'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinDocument } from '@/lib/actions/document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function JoinDocBtn() {
  const [open, setOpen] = useState(false)
  const [documentId, setDocumentId] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('documentId', documentId.trim())
      const res = await joinDocument(formData)
      if (res?.error) {
        toast.error(res.error)
      } else if (res?.docId) {
        toast.success('Joined document successfully!')
        setOpen(false)
        setDocumentId('')
        router.push(`/documents/${res.docId}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer" />}>
        <span className="flex items-center">
          <Link2 className="mr-2 h-4 w-4" /> Join Document
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Join Document</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the Document ID shared with you to join. You will join with the Viewer role by default.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="documentId" className="text-slate-300">Document ID</Label>
              <Input
                id="documentId"
                placeholder="clx1234abcd..."
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                disabled={isPending}
                required
                className="bg-slate-900 border-slate-800 text-white placeholder-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
