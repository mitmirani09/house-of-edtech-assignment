'use server'

import { signIn, signOut } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type RegisterActionState = {
  success?: boolean
  error?: {
    name?: string[]
    email?: string[]
    password?: string[]
    form?: string[]
  }
} | null

export async function registerUser(prevState: RegisterActionState, formData: FormData): Promise<RegisterActionState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = RegisterSchema.safeParse({ name, email, password })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        error: { email: ['Email already in use'] },
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      error: { form: ['Something went wrong. Please try again.'] },
    }
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
        case 'CallbackRouteError':
          return { error: 'Invalid email or password.' }
        default:
          return { error: 'Authentication failed.' }
      }
    }
    throw error
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: '/login' })
}
