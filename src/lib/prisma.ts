import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL
  if (connectionString && connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat')) {
    connectionString += connectionString.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true'
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
