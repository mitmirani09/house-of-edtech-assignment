import React from 'react'
import { WifiOff, Zap, Shield, GitBranch } from 'lucide-react'

export default function FeatureSection() {
    return (
        <div className="w-full relative bg-primary text-white">
            {/* Feature Grid Content */}
            <section className="max-w-7xl w-full mx-auto px-6 py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left w-full">
                    {/* Card 1 */}
                    <div className="space-y-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="rounded-xl bg-white/15 p-3 w-fit text-white">
                            <WifiOff className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Local-First Storage</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Every keystroke is saved immediately to your browser&apos;s IndexedDB. Never lose your edits, even on unstable connections.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="space-y-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="rounded-xl bg-white/15 p-3 w-fit text-white">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Real-Time Sync</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Changes sync automatically in the background as soon as you reconnect, leveraging Yjs CRDT for deterministic merging.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="space-y-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="rounded-xl bg-white/15 p-3 w-fit text-white">
                            <GitBranch className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Version History</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Travel back in time. Snapshot documents, browse past edits, and restore earlier states without disrupting active editors.
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="space-y-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="rounded-xl bg-white/15 p-3 w-fit text-white">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Secure RBAC</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Control document access with Role-Based Access. Assign Owner, Editor, or Viewer access with full API and WebSocket validation.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
} 