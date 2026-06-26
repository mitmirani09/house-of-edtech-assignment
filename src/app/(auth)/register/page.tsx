'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser, RegisterActionState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Compass, Shield, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    registerUser,
    null as RegisterActionState
  )

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Password strength validation logic
  const passwordStrength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  useEffect(() => {
    if (state?.success) {
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } else if (state?.error) {
      if (typeof state.error === 'string') {
        toast.error(state.error)
      } else {
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

  const getStrengthColor = (index: number) => {
    if (index >= passwordStrength) return 'bg-slate-200'
    switch (passwordStrength) {
      case 1:
        return 'bg-rose-500'
      case 2:
        return 'bg-amber-500'
      case 3:
        return 'bg-emerald-500'
      case 4:
        return 'bg-indigo-600'
      default:
        return 'bg-slate-200'
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-white font-sans">
      
      {/* Left Column (Branding & Features) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#F8FAFC] p-12 xl:p-16 border-r border-slate-200/60 relative overflow-hidden">
        {/* Background grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#6366F1] text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-[#0F172A] tracking-tight">
            House of Edtech
          </span>
        </div>

        {/* Content Centered */}
        <div className="my-auto w-full max-w-3xl space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              Collaborative Editing. Offline-First Power.
            </h1>
            <p className="text-slate-500 text-base leading-relaxed">
              Write and edit documents in real-time, even with zero internet. Your changes are saved locally and synced automatically once you reconnect.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {/* Instant Sync */}
            <div className="flex items-start gap-4 bg-slate-100/60 border border-slate-200/50 p-4 rounded-xl backdrop-blur-xs">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 mt-0.5 shrink-0">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-label text-xs tracking-wider text-slate-700 font-bold uppercase">
                  Conflict-Free Sync
                </h3>
                <p className="text-slate-500 text-sm">
                  Work offline seamlessly. Our Yjs CRDT engine automatically merges concurrent edits when you reconnect, eliminating data conflicts.
                </p>
              </div>
            </div>

            {/* Data Integrity */}
            <div className="flex items-start gap-4 bg-slate-100/60 border border-slate-200/50 p-4 rounded-xl backdrop-blur-xs">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-[#6366F1] mt-0.5 shrink-0">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-label text-xs tracking-wider text-slate-700 font-bold uppercase">
                  Version Time Travel
                </h3>
                <p className="text-slate-500 text-sm">
                  Snapshot your document, inspect previous edits in detail, and restore past versions without overwriting active collaborators.
                </p>
              </div>
            </div>
          </div>

          {/* Quote Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative">
            <p className="text-[#0F172A] text-sm italic leading-relaxed mb-4">
              {"\"EdtechDocs is the first editor that allows me to write documents on a plane with zero connection, and then merges perfectly with my team's changes when we land.\""}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-900 text-white font-bold text-xs">
                MC
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">Marcus Chen</h4>
                <p className="text-[10px] text-slate-400 font-medium font-label uppercase">CTO @ FLOWSTATE LABS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-slate-400 font-label tracking-wide relative z-10">
          © 2024 House of Edtech. Engineering-led clarity.
        </div>
      </div>

      {/* Right Column (Register Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-16 sm:px-16 xl:px-24 bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
              Create your workspace
            </h2>
            <p className="text-slate-500 text-sm">
              Create your account to start writing and collaborating.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-label text-xs tracking-wider text-slate-500 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Linus Torvalds"
                required
                disabled={isPending}
                className="bg-white border-slate-200 hover:border-slate-300 text-[#0F172A] placeholder-slate-400 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-10 px-3 rounded-lg text-sm"
              />
              {state?.error?.name && (
                <p className="text-xs text-rose-500 mt-1 font-label">{state.error.name[0]}</p>
              )}
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-label text-xs tracking-wider text-slate-500 font-medium">
                Work Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                disabled={isPending}
                className="bg-white border-slate-200 hover:border-slate-300 text-[#0F172A] placeholder-slate-400 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-10 px-3 rounded-lg text-sm"
              />
              {state?.error?.email && (
                <p className="text-xs text-rose-500 mt-1 font-label">{state.error.email[0]}</p>
              )}
            </div>

            {/* Create Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-label text-xs tracking-wider text-slate-500 font-medium">
                Create Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="bg-white border-slate-200 hover:border-slate-300 text-[#0F172A] placeholder-slate-400 focus-visible:ring-[#6366F1] focus-visible:border-[#6366F1] h-10 pl-3 pr-10 rounded-lg text-sm w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div className={`h-full rounded-full transition-colors duration-300 ${getStrengthColor(0)}`} />
                    <div className={`h-full rounded-full transition-colors duration-300 ${getStrengthColor(1)}`} />
                    <div className={`h-full rounded-full transition-colors duration-300 ${getStrengthColor(2)}`} />
                    <div className={`h-full rounded-full transition-colors duration-300 ${getStrengthColor(3)}`} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-label flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Enter at least 8 characters
                  </p>
                </div>
              )}
              {state?.error?.password && (
                <p className="text-xs text-rose-500 mt-1 font-label">{state.error.password[0]}</p>
              )}
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-[#6366F1] focus:ring-[#6366F1] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-normal select-none cursor-pointer">
                I agree to the{' '}
                <Link href="#" className="text-[#6366F1] hover:underline font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-[#6366F1] hover:underline font-medium">Privacy Policy</Link>.
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#6366F1] hover:bg-[#5558e6] text-white font-bold h-11 rounded-lg text-sm shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? 'Creating Account...' : 'Create My Account'}
            </Button>
          </form>

          {/* Social Sign Up (Mockup Elements for Visual Fidelity) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-center relative">
              <span className="text-[10px] text-slate-400 font-label bg-white px-3 relative z-10 uppercase tracking-widest">
                Or Sign Up With
              </span>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -z-0" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                disabled
                className="border-slate-200 text-slate-405 hover:bg-slate-50 h-10 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 select-none opacity-60 cursor-not-allowed"
              >
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                className="border-slate-200 text-slate-405 hover:bg-slate-50 h-10 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 select-none opacity-60 cursor-not-allowed"
              >
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.472 0-6.27-2.779-6.27-6.216 0-3.437 2.798-6.216 6.27-6.216 1.564 0 2.977.568 4.07 1.51l3.052-3.052C18.665 1.858 15.684 1 12.24 1 6.033 1 1 6.033 1 12.3s5.033 11.3 11.24 11.3c6.477 0 11.24-4.542 11.24-11.3 0-.773-.086-1.503-.24-2.015H12.24z"/>
                </svg>
                Google
              </Button>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-sm text-center text-slate-500 font-sans">
            Already have an account?{' '}
            <Link href="/login" className="text-[#6366F1] hover:underline font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
