'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser, RegisterActionState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    registerUser,
    null as RegisterActionState
  )

  useEffect(() => {
    if (state?.success) {
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } else if (state?.error) {
      if (typeof state.error === 'string') {
        toast.error(state.error)
      } else {
        // Validation errors
        const errors = state.error
        Object.keys(errors).forEach((key) => {
          const messages = errors[key as keyof typeof errors]
          if (messages && messages.length > 0) {
            toast.error(`${key}: ${messages[0]}`)
          }
        })
      }
    }
  }, [state, router])

  return (
    <div className="flex-1 flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      
      <Card className="w-full max-w-md bg-slate-950/70 border-slate-800 backdrop-blur-md shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              EdtechDocs
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Create an account</CardTitle>
          <CardDescription className="text-slate-400">
            Get started by creating your account to edit documents offline
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                disabled={isPending}
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
              />
              {state?.error?.name && (
                <p className="text-xs text-rose-500 mt-1">{state.error.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isPending}
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
              />
              {state?.error?.email && (
                <p className="text-xs text-rose-500 mt-1">{state.error.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
              />
              {state?.error?.password && (
                <p className="text-xs text-rose-500 mt-1">{state.error.password[0]}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
            >
              {isPending ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-sm text-center text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
