'use client'

import { logoutUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, FileText, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            EdtechDocs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white cursor-pointer" />}>
              <span className="flex items-center justify-center h-full w-full">
                <User className="h-4 w-4" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-950 border-slate-800 text-white" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-slate-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
