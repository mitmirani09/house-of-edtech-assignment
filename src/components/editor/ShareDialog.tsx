'use client'

import { useEffect, useState, useCallback } from 'react'
import { Role } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  inviteUserToDocument, 
  getDocumentMembers, 
  updateMemberRole, 
  removeMember 
} from '@/lib/actions/document'
import { toast } from 'sonner'
import { Share2, UserPlus, Trash2, Loader2, Mail } from 'lucide-react'

interface ShareDialogProps {
  documentId: string
  userRole: Role
}

interface Member {
  id: string
  userId: string
  documentId: string
  role: Role
  user: {
    id: string
    name: string | null
    email: string
  }
}

export function ShareDialog({ documentId, userRole }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  
  // Invite Form States
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>(Role.VIEWER)
  const [isInviting, setIsInviting] = useState(false)
  
  // Pending actions state (loading state for specific inline member edits)
  const [activeActionMemberId, setActiveActionMemberId] = useState<string | null>(null)
  
  const isOwner = userRole === Role.OWNER

  const fetchMembers = useCallback(() => {
    // Schedule state updates asynchronously to prevent set-state-in-effect ESLint warnings
    setTimeout(async () => {
      setLoading(true)
      try {
        const res = await getDocumentMembers(documentId)
        if (res.error) {
          toast.error(res.error)
        } else if (res.members) {
          setMembers(res.members as Member[])
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load collaborators')
      } finally {
        setLoading(false)
      }
    }, 0)
  }, [documentId])

  // Load members when dialog opens
  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open, fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const res = await inviteUserToDocument(documentId, inviteEmail.trim(), inviteRole)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Collaborator invited successfully!')
        setInviteEmail('')
        fetchMembers()
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberUserId: string, newRole: Role) => {
    setActiveActionMemberId(memberUserId)
    try {
      const res = await updateMemberRole(documentId, memberUserId, newRole)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Access role updated!')
        fetchMembers()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update access role.')
    } finally {
      setActiveActionMemberId(null)
    }
  }

  const handleRemove = async (memberUserId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    setActiveActionMemberId(memberUserId)
    try {
      const res = await removeMember(documentId, memberUserId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Collaborator access revoked.')
        fetchMembers()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to revoke access.')
    } finally {
      setActiveActionMemberId(null)
    }
  }

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return email ? email.slice(0, 2).toUpperCase() : '??'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2 cursor-pointer border-slate-200 hover:border-slate-300 text-slate-700 h-9" />}>
        <span className="flex items-center gap-1.5">
          <Share2 className="h-4 w-4" /> Share
        </span>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-[#0F172A] font-bold text-lg">Manage Access</DialogTitle>
          <DialogDescription className="text-slate-500 text-xs mt-0.5">
            {isOwner 
              ? 'Invite other users and configure collaborator permission settings.' 
              : 'View all users who have access to this document.'}
          </DialogDescription>
        </DialogHeader>

        {/* Invite collaborators section (Owners only) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="py-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
            <Label htmlFor="email" className="font-label text-xs tracking-wider text-slate-500 font-bold uppercase">
              Invite Collaborator
            </Label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                  required
                  className="pl-9 bg-white border-slate-200 hover:border-slate-300 text-slate-900 focus-visible:ring-primary focus-visible:border-primary text-sm h-10"
                />
              </div>
              <div className="w-[110px]">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  disabled={isInviting}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 rounded-lg text-sm h-10 px-2 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value={Role.EDITOR}>Editor</option>
                  <option value={Role.VIEWER}>Viewer</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="bg-primary hover:bg-primary/95 text-white font-bold h-10 shrink-0 cursor-pointer"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Collaborators List (All Roles) */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 min-h-[220px]">
          <Label className="font-label text-xs tracking-wider text-slate-500 font-bold uppercase block pb-1">
            People with Access
          </Label>

          {loading && members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading collaborators...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[300px]">
              {members.map((member) => {
                const isMemberOwner = member.role === Role.OWNER
                const isActionPending = activeActionMemberId === member.userId

                return (
                  <div key={member.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shrink-0">
                        {getInitials(member.user.name, member.user.email)}
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {member.user.name || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Owner permissions controls */}
                      {isOwner && !isMemberOwner ? (
                        <>
                          {isActionPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <>
                              {/* Role Selector */}
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                                disabled={isActionPending}
                                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md text-xs h-7 px-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                              >
                                <option value={Role.EDITOR}>Editor</option>
                                <option value={Role.VIEWER}>Viewer</option>
                              </select>
                              {/* Remove Revoke Button */}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={isActionPending}
                                onClick={() => handleRemove(member.userId)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer h-7 w-7 rounded-md"
                                title="Revoke access"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        /* Static Role Badge for non-owners or self */
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 select-none rounded capitalize ${
                            isMemberOwner 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : member.role === Role.EDITOR 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {member.role.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
