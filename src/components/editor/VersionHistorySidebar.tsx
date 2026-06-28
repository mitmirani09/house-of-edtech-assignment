'use client'

import { useState, useEffect } from 'react'
import { getVersionSnapshots, createVersionSnapshot } from '@/lib/actions/version'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  History, 
  X, 
  Plus, 
  Loader2, 
  Clock, 
  User
} from 'lucide-react'

import type { Snapshot } from './types'

interface VersionHistorySidebarProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
  onPreviewVersion: (snapshot: Snapshot | null) => void
  activePreviewId?: string
  getEditorHTML: () => string
}

export function VersionHistorySidebar({
  documentId,
  isOpen,
  onClose,
  onPreviewVersion,
  activePreviewId,
  getEditorHTML,
}: VersionHistorySidebarProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const fetchSnapshots = async () => {
    setLoading(true)
    try {
      const res = await getVersionSnapshots(documentId)
      if (res.error) {
        toast.error(res.error)
      } else if (res.snapshots) {
        setSnapshots(res.snapshots)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots()
    } else {
      onPreviewVersion(null)
    }
  }, [isOpen, documentId])

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault()
    const html = getEditorHTML()
    if (!html || html === '<p></p>') {
      toast.error('Cannot save an empty document as a version.')
      return
    }
    setCreating(true)
    try {
      const res = await createVersionSnapshot(documentId, newLabel, html)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Version snapshot created!')
        setNewLabel('')
        fetchSnapshots()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to create snapshot')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <History className="h-4 w-4 text-primary" />
          <span>Version History</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Save snapshot form */}
      <form onSubmit={handleCreateSnapshot} className="p-4 border-b border-border bg-slate-50 flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Save Current State
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Final Draft, V1..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            disabled={creating}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <Button type="submit" size="sm" disabled={creating} className="cursor-pointer">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Captures the document exactly as it appears now.</p>
      </form>

      {/* Snapshots list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Loading history...</span>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No saved versions yet.
          </div>
        ) : (
          snapshots.map((snapshot) => {
            const isSelected = activePreviewId === snapshot.id
            const date = new Date(snapshot.createdAt)
            const formattedDate = date.toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div
                key={snapshot.id}
                onClick={() => onPreviewVersion(snapshot)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-foreground line-clamp-1">
                    {snapshot.label || 'Unnamed Version'}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                      Previewing
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-xs">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formattedDate}</span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{snapshot.createdByName}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
