import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Apply proxy to all pages except api, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'],
}
