'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  Sparkles, 
  X, 
  Loader2, 
  Copy, 
  FileText,
  AlertTriangle
} from 'lucide-react'

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  getEditorHTML: () => string
  getEditorText: () => string
}

export function AiSidebar({
  isOpen,
  onClose,
  getEditorHTML,
  getEditorText,
}: AiSidebarProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    const text = getEditorText().trim()
    if (!text || text === '') {
      toast.error('The document is empty. Write some text to summarize.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'summarize',
          text,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      setSummary(data.result)
      toast.success('Summary generated!')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while communicating with the AI.')
      toast.error(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!summary) return
    navigator.clipboard.writeText(summary)
    toast.success('Summary copied to clipboard!')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Document Summary</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Generate a clean, structured summary of your document's current text.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleGenerateSummary} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer mt-1 font-semibold text-xs flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate Summary
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50/30 p-4 text-xs text-red-600 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {summary && !loading && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Generated Summary</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 overflow-y-auto text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {summary}
            </div>
          </div>
        )}

        {!summary && !loading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3 border border-dashed border-slate-200 rounded-xl">
            <Sparkles className="h-8 w-8 text-slate-300" />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Click the button above to analyze the document and build an AI summary.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
