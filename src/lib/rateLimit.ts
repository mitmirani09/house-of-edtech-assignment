import { headers } from 'next/headers'

const rateLimitMap = new Map<string, number[]>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  error?: string
}

export function rateLimit(key: string, limit = 60, windowMs = 60000): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  let timestamps = rateLimitMap.get(key) || []
  
  // Filter out expired timestamps
  timestamps = timestamps.filter(t => t > windowStart)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    const reset = oldest + windowMs
    return {
      success: false,
      remaining: 0,
      reset,
      error: `Too many requests. Please try again in ${Math.ceil((reset - now) / 1000)} seconds.`
    }
  }

  timestamps.push(now)
  rateLimitMap.set(key, timestamps)

  return {
    success: true,
    remaining: limit - timestamps.length,
    reset: now + windowMs
  }
}

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers()
    const xForwardedFor = headersList.get('x-forwarded-for')
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim()
    }
    const xRealIp = headersList.get('x-real-ip')
    if (xRealIp) return xRealIp
  } catch (e) {
    // Fail silently in environments where headers() is not available
  }
  return '127.0.0.1'
}
