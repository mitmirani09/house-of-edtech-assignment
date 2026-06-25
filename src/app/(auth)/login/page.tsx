'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        const result = await loginUser(prevState, formData)
        return result
      } catch (err: any) {
        // NextAuth redirect triggers error throwing in Server Actions
        // If it is a redirect, let Next.js handle it
        if (err.message === 'NEXT_REDIRECT') {
          throw err
        }
        return { error: 'Something went wrong.' }
      }
    },
    null
  )

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

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
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access your collaborative documents
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
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
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-center text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Create one
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
