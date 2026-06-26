import { getDocumentWithRole } from '@/lib/actions/document'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditorContainer } from '@/components/editor/EditorContainer'

interface DocumentPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params

  const res = await getDocumentWithRole(id)

  if (res.error) {
    if (res.error === 'Not authenticated') {
      redirect('/login')
    }
    // Redirect to dashboard on other access errors
    redirect('/dashboard')
  }

  const document = res.document
  const role = res.role

  if (!document || !role) {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Top Header for Editor */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <span className="text-border">|</span>
            <h2 className="text-sm font-bold text-foreground line-clamp-1 max-w-[200px] md:max-w-[400px]">
              {document.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-muted capitalize">
              Role: {role.toLowerCase()}
            </div>
            {/* Visual placeholder for sync status will be wired in client container */}
          </div>
        </div>
      </header>

      {/* Editor Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        <EditorContainer 
          documentId={document.id} 
          initialTitle={document.title} 
          initialContent={document.content || ''} 
          role={role} 
        />
      </main>
    </div>
  )
}
