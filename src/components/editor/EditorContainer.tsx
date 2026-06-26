'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const isReadOnly = role === Role.VIEWER

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      })
    ],
    content: initialContent,
    editable: !isReadOnly,
    immediatelyRender: false, // Prevents Next.js SSR hydration warnings
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      
      if (isReadOnly) return

      setSaveStatus('saving')
      
      // Debounce saving: trigger save 1.2 seconds after typing stops
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        await handleSave(html)
      }, 1200)
    },
    onBlur: ({ editor }) => {
      if (isReadOnly) return
      
      const html = editor.getHTML()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      handleSave(html)
    }
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleSave = async (html: string) => {
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
  }

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
            <>
              <CloudOff className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive font-medium">Save Failed</span>
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
