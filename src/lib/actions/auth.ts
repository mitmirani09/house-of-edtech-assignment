'use server'

import { signIn, signOut } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
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
  // Rate Limiting by IP for unauthenticated route
  const ip = await getClientIp()
  const limitRes = rateLimit(`register:${ip}`, 5, 60000)
  if (!limitRes.success) {
    return {
      error: { form: [limitRes.error || 'Too many registration attempts. Please try again later.'] },
    }
  }

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
      where: { email: validatedFields.data.email },
    })

    if (existingUser) {
      return {
        error: { email: ['Email already in use'] },
      }
    }

    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 10)

    await prisma.user.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
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

export async function loginUser(prevState: { error?: string } | null, formData: FormData) {
  // Rate Limiting by IP for login attempts
  const ip = await getClientIp()
  const limitRes = rateLimit(`login:${ip}`, 10, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error || 'Too many login attempts. Please try again later.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = LoginSchema.safeParse({ email, password })
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  try {
    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
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
