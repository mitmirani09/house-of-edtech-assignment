'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { updateDocumentContent } from '@/lib/actions/document'
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
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Role } from '@prisma/client'

interface EditorContainerProps {
  documentId: string
  initialTitle: string
  initialContent: string
  role: Role
}

export function EditorContainer({ 
  documentId, 
  initialContent, 
  role 
}: EditorContainerProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [isSynced, setIsSynced] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const isReadOnly = role === Role.VIEWER
  const initialContentRef = useRef(initialContent)

  // Create persistent Y.Doc instance
  const ydoc = useMemo(() => new Y.Doc(), [])

  // Declaring handleSave first to prevent hoisting/lexical scope errors in useEditor and useEffect
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



  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Collaboration.configure({
        document: ydoc,
      })
    ],
    editable: !isReadOnly,
    immediatelyRender: false, // Prevents Next.js SSR hydration warnings
    onUpdate: ({ editor }) => {
      if (isReadOnly) return

      if (navigator.onLine) {
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
      setIsSynced(true)
    })
    return () => {
      provider.destroy()
    }
  }, [documentId, ydoc])

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

  // Populate editor with initialContent if IndexedDB has no content
  useEffect(() => {
    if (isSynced && editor) {
      const isDocEmpty = ydoc.getXmlFragment('default').length === 0
      if (isDocEmpty && initialContentRef.current) {
        editor.commands.setContent(initialContentRef.current)
        initialContentRef.current = ''
      }
    }
  }, [isSynced, editor, ydoc])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])



  if (!editor) return null

  return (
    <div className="flex flex-col gap-6">
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

          {/* Numbered List */}
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

        {/* Sync / Save Status Banner */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-border text-xs font-mono select-none">
          {!isOnline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
              <span className="text-amber-800 font-medium">Offline — Saved Locally</span>
            </>
          ) : (
            <>
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-slate-600">Saved to Cloud</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
                  <span className="text-primary font-medium">Saving...</span>
                </>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5">
                  <CloudOff className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-destructive font-medium">Save Failed</span>
                  <button
                    onClick={handleManualSave}
                    className="ml-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/15 text-[10px] font-bold cursor-pointer transition-colors"
                    title="Retry saving changes to cloud"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Body Canvas */}
      <div className="min-h-[500px] w-full rounded-2xl border border-border bg-white p-8 md:p-12 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        {isReadOnly && (
          <div className="mb-4 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md max-w-fit">
            Viewing Mode — Document is read-only
          </div>
        )}
        <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
      </div>
    </div>
  )
}
