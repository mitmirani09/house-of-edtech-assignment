import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/dashboard/Navbar'
import { CreateDocBtn } from '@/components/dashboard/CreateDocBtn'
import { JoinDocBtn } from '@/components/dashboard/JoinDocBtn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, ArrowRight, Shield, Edit, Eye } from 'lucide-react'

// Simple helper to format time
function formatRelativeTime(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch all documents for this user
  const memberships = await prisma.documentMember.findMany({
    where: { userId: session.user.id },
    include: {
      document: true,
    },
    orderBy: {
      document: {
        updatedAt: 'desc',
      },
    },
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Shield className="h-3.5 w-3.5 text-amber-500" />
      case 'EDITOR':
        return <Edit className="h-3.5 w-3.5 text-blue-400" />
      default:
        return <Eye className="h-3.5 w-3.5 text-slate-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-950/40 text-amber-400 border-amber-800'
      case 'EDITOR':
        return 'bg-blue-950/40 text-blue-400 border-blue-800'
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white min-h-screen">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <Navbar user={session.user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              My Documents
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create, edit, or join collaborative offline documents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <JoinDocBtn />
            <CreateDocBtn />
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-center bg-slate-900/20 backdrop-blur-sm min-h-[400px]">
            <div className="rounded-full bg-slate-900 border border-slate-800 p-4 mb-4">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">No documents found</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-2 mb-6">
              Get started by creating a new document or joining an existing one using its ID.
            </p>
            <div className="flex items-center gap-3">
              <JoinDocBtn />
              <CreateDocBtn />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map(({ id: memberId, role, document: doc }) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card className="h-full bg-slate-900/40 border-slate-850 hover:border-slate-700 transition-all duration-200 group flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5">
                        <FileText className="h-5 w-5 text-indigo-400" />
                      </div>
                      <Badge className={`flex items-center gap-1.5 capitalize px-2.5 py-0.5 font-medium border ${getRoleColor(role)}`}>
                        {getRoleIcon(role)}
                        {role.toLowerCase()}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-mono mt-1 select-all hover:text-slate-400 transition-colors">
                        ID: {doc.id}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-4 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Updated {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
