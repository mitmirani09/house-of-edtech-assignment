import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, WifiOff, Zap, Shield, GitBranch, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white min-h-screen relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              EdtechDocs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white cursor-pointer">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/35 bg-indigo-950/30 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" /> Offline-First Collaborative Editor
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
          Documents that work{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            anywhere, offline or online
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Create and collaborate on rich documents. Work offline with local browser storage, and sync instantly to the cloud when you're back online — conflict-free.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-20">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-6 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white py-6 px-8 rounded-lg cursor-pointer">
              Create Free Account
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left w-full border-t border-slate-800/80 pt-16">
          <div className="space-y-3">
            <div className="rounded-lg bg-indigo-950/50 border border-indigo-900/50 p-3 w-fit text-indigo-400">
              <WifiOff className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Local-First Storage</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every keystroke is saved immediately to your browser's IndexedDB. Never lose your edits, even on unstable connections.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-blue-950/50 border border-blue-900/50 p-3 w-fit text-blue-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Changes sync automatically in the background as soon as you reconnect, leveraging Yjs CRDT for deterministic merging.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-950/50 border border-emerald-900/50 p-3 w-fit text-emerald-400">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Version History</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Travel back in time. Snapshot documents, browse past edits, and restore earlier states without disrupting active editors.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-purple-950/50 border border-purple-900/50 p-3 w-fit text-purple-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Secure RBAC</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Control document access with Role-Based Access. Assign Owner, Editor, or Viewer access with full API and WebSocket validation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EdtechDocs. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://github.com/mitmirani09" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
            <a href="https://linkedin.com/in/mit-mirani-09" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
