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
      <DialogTrigger render={<Button variant="outline" className="border-border text-foreground hover:bg-accent cursor-pointer" />}>
        <span className="flex items-center">
          <Link2 className="mr-2 h-4 w-4 text-muted-foreground" /> Join Document
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Join Document</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the Document ID shared with you to join. You will join with the Viewer role by default.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="documentId" className="text-foreground">Document ID</Label>
              <Input
                id="documentId"
                placeholder="clx1234abcd..."
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                disabled={isPending}
                required
                className="bg-white border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
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
