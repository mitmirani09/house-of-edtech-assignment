'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import { updateDocumentContent } from '@/lib/actions/document'
import { restoreVersionSnapshot } from '@/lib/actions/version'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Heading1, 
  Heading2, 
  Heading3, 
  Check, 
  CloudOff,
  RefreshCw,
  History,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { Role } from '@prisma/client'
import { VersionHistorySidebar } from './VersionHistorySidebar'
import type { Snapshot } from './types'

// Deterministic color helper for collaboration cursors
function getRandomColor(str: string) {
  const colors = [
    '#6366F1', // Primary / Indigo
    '#10B981', // Secondary / Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

interface EditorContainerProps {
  documentId: string
  initialTitle: string
  initialContent: string
  role: Role
  currentUser?: {
    id: string
    name: string
    email: string
  }
}

export function EditorContainer({ 
  documentId, 
  initialContent, 
  role,
  currentUser
}: EditorContainerProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [localSynced, setLocalSynced] = useState(false)
  const [remoteSynced, setRemoteSynced] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null)

  const isSynced = localSynced && remoteSynced
  
  const isReadOnly = role === Role.VIEWER
  const initialContentRef = useRef(initialContent)

  // Create persistent Y.Doc instance
  const ydocRef = useRef<Y.Doc | null>(null)
  if (ydocRef.current === null) {
    ydocRef.current = new Y.Doc()
  }
  const ydoc = ydocRef.current

  // Create persistent WebsocketProvider instance
  const wsProviderRef = useRef<WebsocketProvider | null>(null)
  if (wsProviderRef.current === null && typeof window !== 'undefined') {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234'
    wsProviderRef.current = new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: {
        userId: currentUser?.id || '',
        room: documentId,
      }
    })
  }
  const wsProvider = wsProviderRef.current

  const handleSave = useCallback(async (html: string) => {
    try {
      const res = await updateDocumentContent(documentId, html)
      if (res?.error) {
        setSaveStatus('error')
        toast.error(res.error)
      } else {
        setSaveStatus('saved')
      }
    } catch (err) {
      console.error(err)
      setSaveStatus('error')
    }
  }, [documentId])

  const handleRestore = useCallback(async () => {
    if (!previewSnapshot) return
    try {
      const htmlContent = previewSnapshot.htmlContent || ''
      setPreviewSnapshot(null)
      setIsHistoryOpen(false)
      
      // Because we use CSS hidden instead of unmounting, editor is always mounted!
      if (ydoc) {
         // Wipe the Yjs document state completely to ensure no merge conflicts with the old state!
         const fragment = ydoc.getXmlFragment('default')
         fragment.delete(0, fragment.length)
      }
      // Wait 50ms for React to render out of preview mode
      setTimeout(async () => {
        // Re-inject content directly through TipTap API to force a sync update
        const evt = new CustomEvent('restore-content', { detail: htmlContent })
        window.dispatchEvent(evt)
      }, 50)
      
      // Persist restoration log in DB
      await restoreVersionSnapshot(documentId, previewSnapshot.id)
      
      setSaveStatus('saved')
      toast.success('Version restored successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to restore version')
      setSaveStatus('error')
    }
  }, [documentId, previewSnapshot, handleSave, ydoc])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      ...(wsProvider ? [
        CollaborationCaret.configure({
          provider: wsProvider,
          user: {
            name: currentUser?.name || 'Anonymous',
            color: getRandomColor(currentUser?.id || 'anonymous'),
          }
        })
      ] : [])
    ],
    editable: !isReadOnly,
    immediatelyRender: false, // Prevents Next.js SSR hydration warnings
    onUpdate: ({ editor, transaction }) => {
      if (isReadOnly) return

      // Skip database save if the transaction was triggered by a remote collaboration change
      if (!isChangeOrigin(transaction)) {
        setSaveStatus('saving')
        
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
          const html = editor.getHTML()
          await handleSave(html)
        }, 1200)
      } else {
        // Offline: changes are cached in IndexedDB
        setSaveStatus('saved')
      }
    },
    onBlur: ({ editor }) => {
      if (isReadOnly) return
      
      if (navigator.onLine) {
        const html = editor.getHTML()
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        handleSave(html)
      }
    }
  })

  useEffect(() => {
    const handler = (e: any) => {
       if (editor) {
          editor.commands.setContent(e.detail)
          handleSave(e.detail)
       }
    }
    window.addEventListener('restore-content', handler as EventListener)
    return () => window.removeEventListener('restore-content', handler as EventListener)
  }, [editor, handleSave])

  const handleManualSave = useCallback(async () => {
    if (!editor || isReadOnly) return
    setSaveStatus('saving')
    const html = editor.getHTML()
    await handleSave(html)
  }, [editor, isReadOnly, handleSave])

  // Setup local IndexedDB persistence with y-indexeddb
  useEffect(() => {
    const provider = new IndexeddbPersistence(documentId, ydoc)
    provider.on('synced', () => {
      setLocalSynced(true)
    })
    return () => {
      // Delay destruction by a short time to allow pending updates to flush to IndexedDB
      setTimeout(() => {
        provider.destroy()
      }, 300)
    }
  }, [documentId, ydoc])

  // Setup remote WebSocket sync & handle connection status / cleanup
  useEffect(() => {
    if (!wsProvider) {
      const timer = setTimeout(() => {
        setRemoteSynced(true)
      }, 0)
      return () => clearTimeout(timer)
    }

    const handleSync = (synced: boolean) => {
      if (synced) {
        setRemoteSynced(true)
      }
    }

    wsProvider.on('sync', handleSync)

    // Fallback timeout of 2 seconds for offline or server unreachable state
    const timeoutId = setTimeout(() => {
      setRemoteSynced(true)
    }, 2000)

    return () => {
      wsProvider.off('sync', handleSync)
      clearTimeout(timeoutId)
      
      // Delay destruction to allow pending socket messages to flush
      setTimeout(() => {
        wsProvider.destroy()
        if (wsProviderRef.current === wsProvider) wsProviderRef.current = null
        
        ydoc.destroy()
        if (ydocRef.current === ydoc) ydocRef.current = null
      }, 300)
    }
  }, [wsProvider, ydoc])

  // Handle window online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Internet reconnected. Syncing changes to cloud...')
      if (editor && !isReadOnly) {
        const html = editor.getHTML()
        setSaveStatus('saving')
        handleSave(html)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Connection lost. Working offline — changes saved locally.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [editor, isReadOnly, handleSave])

  // Populate editor with initialContent if the document is empty
  useEffect(() => {
    if (isSynced && editor) {
      if (editor.isEmpty && initialContentRef.current) {
        editor.commands.setContent(initialContentRef.current)
        initialContentRef.current = ''
      }
    }
  }, [isSynced, editor])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (!editor || !isSynced) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] rounded-2xl border border-border bg-white p-8 md:p-12 shadow-sm gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Connecting & loading document...</p>
      </div>
    )
  }

  return (
    <>
      {/* Preview UI */}
      {previewSnapshot && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Previewing: {previewSnapshot.label || 'Unnamed Version'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Saved on {new Date(previewSnapshot.createdAt).toLocaleString()} by {previewSnapshot.createdByName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <Button onClick={handleRestore} size="sm" className="cursor-pointer">
                  Restore this version
                </Button>
              )}
              <Button variant="outline" onClick={() => setPreviewSnapshot(null)} size="sm" className="cursor-pointer">
                Exit Preview
              </Button>
            </div>
          </div>

          <div className="min-h-[500px] w-full rounded-2xl border border-border bg-white p-8 md:p-12 shadow-sm">
            <div className="mb-4 text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md max-w-fit flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Preview Mode — read-only snapshot
            </div>
            {previewSnapshot.htmlContent ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewSnapshot.htmlContent }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">This snapshot has no content.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Editor UI */}
      <div className={previewSnapshot ? 'hidden' : 'flex flex-col gap-6'}>
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 rounded-xl border border-border bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-1">
            {/* Bold */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`cursor-pointer ${editor.isActive('bold') ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>

            {/* Italic */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`cursor-pointer ${editor.isActive('italic') ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>

            <span className="h-6 w-px bg-border mx-1" />

            {/* Heading 1 */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>

            {/* Heading 2 */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            {/* Heading 3 */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`cursor-pointer ${editor.isActive('heading', { level: 3 }) ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <span className="h-6 w-px bg-border mx-1" />

            {/* Bullet List */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`cursor-pointer ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>

            {/* Ordered List */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`cursor-pointer ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <span className="h-6 w-px bg-border mx-1" />

            {/* Undo */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly || !editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>

            {/* Redo */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isReadOnly || !editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status Indicators */}
            <div className="flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-border">
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                ) : (
                  <CloudOff className="h-3 w-3 text-red-500" />
                )}
                <span className="text-muted-foreground font-medium hidden sm:inline-block">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <span className="h-3 w-px bg-border"></span>

              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                {saveStatus === 'saving' && (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Saved to cloud</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-500">Save failed</span>
                )}
              </div>
            </div>

            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline-block">History</span>
              </Button>
            )}
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="min-h-[500px] w-full rounded-2xl border border-border bg-white p-8 md:p-12 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all duration-200">
          <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
        </div>

        <VersionHistorySidebar
          documentId={documentId}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onPreviewVersion={(snapshot) => setPreviewSnapshot(snapshot)}
          activePreviewId={undefined}
          getEditorHTML={() => editor?.getHTML() ?? ''}
        />
      </div>
    </>
  )
}
