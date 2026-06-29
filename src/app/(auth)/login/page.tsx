'use client'

import { useActionState, useEffect, useState } from 'react'

import Link from 'next/link'
import { loginUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Compass, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error?: string } | null, formData: FormData) => {
      try {
        const result = await loginUser(prevState, formData)
        return result ?? null
      } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
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
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] px-4 py-16 sm:px-6 lg:px-8 font-sans">
      {/* Top Logo Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#6366F1] text-white">
          <Compass className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-[#0F172A] tracking-tight">
          House of Edtech
        </span>
      </div>
      
      {/* Card Container */}
      <Card className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-xl shadow-md overflow-hidden relative border-t-[4px] border-t-[#6366F1]">
        <CardContent className="pt-10 px-8 pb-10 space-y-8">
          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h2 className="text-[22px] font-bold tracking-tight text-[#0F172A]">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 font-sans">
              Collaborative document editing, offline or online.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label text-xs tracking-wider text-slate-500 font-medium uppercase">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                disabled={isPending}
                className="bg-white border-slate-200 hover:border-slate-300 text-[#0F172A] placeholder-slate-400 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-11 px-3.5 rounded-lg text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-label text-xs tracking-wider text-slate-500 font-medium uppercase">
                  Password
                </Label>
                <Link 
                  href="#" 
                  className="font-label text-xs text-[#6366F1] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="bg-white border-slate-200 hover:border-slate-300 text-[#0F172A] placeholder-slate-400 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-11 pl-3.5 pr-10 rounded-lg text-sm w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#6366F1] hover:bg-[#5558e6] text-white font-bold h-11 rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
            >
              {isPending ? 'Logging in...' : 'Login to Your Workspace'}
            </Button>
          </form>

          {/* Create Account Link */}
          <div className="text-sm text-center text-slate-500 font-sans pt-2">
            {"Don't have an account?"}{' '}
            <Link href="/register" className="text-[#6366F1] hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Local-First Engine Active status */}
      <div className="flex items-center gap-2 mt-8 text-xs text-slate-500 font-label tracking-wide">
        <span className="h-2 w-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
        Local-First Engine Active
      </div>
    </div>
  )
}
