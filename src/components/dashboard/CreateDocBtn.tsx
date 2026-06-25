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
      <DialogTrigger render={<Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg cursor-pointer" />}>
        <span className="flex items-center">
          <FilePlus className="mr-2 h-4 w-4" /> Create Document
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Document</DialogTitle>
          <DialogDescription className="text-slate-400">
            Give your new document a name. You will be set as the Owner.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-slate-300">Document Title</Label>
              <Input
                id="title"
                placeholder="My Awesome Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
