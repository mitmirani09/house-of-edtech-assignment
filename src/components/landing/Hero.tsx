import { Sparkles } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BrowserMockup from './BrowserMockup'

interface HeroProps {
    isLoggedIn?: boolean
}

export default function Hero({ isLoggedIn }: HeroProps) {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-12 lg:py-20 w-full max-w-7xl mx-auto px-6 relative z-10">
            {/* Left side: Content */}
            <div className="flex flex-col items-start text-left lg:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold font-mono animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" /> Offline-First Collaborative Editor
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-black/80">
                    Documents that work anywhere,{' '}
                    <span className="text-primary">
                        offline or online
                    </span>
                </h1>

                <p className="text-black/60 text-lg md:text-xl leading-relaxed max-w-xl">
                    Create and collaborate on rich documents. Work offline with local browser storage, and sync instantly to the cloud when you&apos;re back online — conflict-free.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
                    {isLoggedIn ? (
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-8 rounded-lg shadow-lg hover:shadow-primary/25 transition-all duration-200 cursor-pointer">
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-8 rounded-lg shadow-lg hover:shadow-primary/25 transition-all duration-200 cursor-pointer">
                                Get Started
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Right side: Browser Mockup */}
            <BrowserMockup />
        </div>
    )
}