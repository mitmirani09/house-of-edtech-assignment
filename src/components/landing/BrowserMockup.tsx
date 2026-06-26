import React from 'react'

const BrowserMockup = () => {
  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center relative">
      {/* Browser Container */}
      <div className="w-full max-w-[500px] aspect-[4/3.4] rounded-2xl border border-slate-200/10 bg-white/5 shadow-2xl backdrop-blur-md p-6 relative overflow-hidden select-none">

        {/* Top Bar of Browser */}
        <div className="flex items-center justify-between border-b border-slate-200/10 pb-4 mb-8">
          {/* OS Controls */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-90" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-90" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] opacity-90" />
          </div>
          {/* File Name & Latency */}
          <span className="text-xs font-mono text-slate-400 tracking-wide">
            editor.md — 128ms latency
          </span>
        </div>

        {/* Editor Mockup Area */}
        <div className="font-mono text-sm space-y-6 pl-2 pr-6">
          {/* Line 01 */}
          <div className="flex items-center gap-6">
            <span className="text-indigo-400/50 text-right w-6 font-bold">01</span>
            <div className="h-4 bg-indigo-200/15 rounded-md w-[80%]" />
          </div>

          {/* Line 02 */}
          <div className="flex items-center gap-6">
            <span className="text-indigo-400/50 text-right w-6 font-bold">02</span>
            <div className="h-4 bg-indigo-200/15 rounded-md w-[50%]" />
          </div>

          {/* Line 03 */}
          <div className="flex items-center gap-6">
            <span className="text-indigo-400/50 text-right w-6 font-bold">03</span>
            <div className="h-4 bg-indigo-200/15 rounded-md w-[90%]" />
          </div>

          {/* Line 04 (With Local cursor/badge) */}
          <div className="flex items-center gap-6">
            <span className="text-indigo-400/50 text-right w-6 font-bold">04</span>
            <div className="flex items-center flex-1 relative">
              {/* Text block before cursor */}
              <div className="h-4 bg-indigo-200/15 rounded-md w-[40%]" />

              {/* Active cursor and tooltip badge */}
              <div className="h-5 w-[2px] bg-secondary mx-1 relative animate-pulse">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-secondary text-white text-[10px] font-bold py-0.5 px-2 rounded shadow-md whitespace-nowrap z-10 flex items-center gap-1 font-sans">
                  Sarah (Local)
                </div>
              </div>

              {/* Text block after cursor */}
              <div className="h-4 bg-indigo-200/15 rounded-md w-[30%]" />
            </div>
          </div>

          {/* Line 05 */}
          <div className="flex items-center gap-6">
            <span className="text-indigo-400/50 text-right w-6 font-bold">05</span>
            <div className="h-4 bg-indigo-200/15 rounded-md w-[35%]" />
          </div>
        </div>

        {/* Floating Badges */}

        {/* Top-Right Badge: Conflict Resolved */}
        <div className="absolute top-16 right-6 flex items-center gap-2 bg-white text-slate-800 border border-slate-100 rounded-xl py-2.5 px-4 shadow-xl hover:scale-105 transition-transform duration-200">
          <div className="w-2 h-2 rounded-full bg-secondary animate-ping" />
          <div className="w-2 h-2 rounded-full bg-secondary absolute" />
          <span className="text-xs font-semibold font-mono tracking-tight pl-2">
            Conflict Resolved: v102
          </span>
        </div>

        {/* Bottom-Left Badge: Node Sync */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white text-slate-800 border border-slate-100 rounded-xl py-2.5 px-4 shadow-xl hover:scale-105 transition-transform duration-200">
          <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3.5" />
            <circle cx="5" cy="5" r="2.5" />
            <circle cx="19" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <line x1="6.8" y1="6.8" x2="9.5" y2="9.5" />
            <line x1="17.2" y1="6.8" x2="14.5" y2="9.5" />
            <line x1="6.8" y1="17.2" x2="9.5" y2="14.5" />
            <line x1="17.2" y1="17.2" x2="14.5" y2="14.5" />
          </svg>
          <span className="text-xs font-semibold font-mono tracking-tight">
            Node Sync: Active
          </span>
        </div>

      </div>
    </div>
  )
}

export default BrowserMockup;