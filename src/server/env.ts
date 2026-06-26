import dotenv from 'dotenv'
import path from 'path'

// Load environment variables matching Next.js configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
