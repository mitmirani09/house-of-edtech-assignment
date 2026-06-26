'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument } from '@/lib/actions/document'
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
import { FilePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CreateDocBtn() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', title)
      const res = await createDocument(formData)
      if (res?.error) {
        toast.error(res.error)
      } else if (res?.docId) {
        toast.success('Document created!')
        setOpen(false)
        setTitle('')
        router.push(`/documents/${res.docId}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer" />}>
        <span className="flex items-center">
          <FilePlus className="mr-2 h-4 w-4" /> Create Document
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Document</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Give your new document a name. You will be set as the Owner.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-foreground">Document Title</Label>
              <Input
                id="title"
                placeholder="My Awesome Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
