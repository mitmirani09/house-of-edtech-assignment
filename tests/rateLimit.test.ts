import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit } from '../src/lib/rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should allow requests under the limit', () => {
    const key = 'test-user-1'
    const result = rateLimit(key, 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should block requests that exceed the limit', () => {
    const key = 'test-user-2'
    for (let i = 0; i < 5; i++) {
      const res = rateLimit(key, 5, 60000)
      expect(res.success).toBe(true)
    }

    // 6th request should fail
    const blockedRes = rateLimit(key, 5, 60000)
    expect(blockedRes.success).toBe(false)
    expect(blockedRes.remaining).toBe(0)
    expect(blockedRes.error).toContain('Too many requests')
  })

  it('should reset limits after the window expires', () => {
    const key = 'test-user-3'
    for (let i = 0; i < 5; i++) {
      rateLimit(key, 5, 60000)
    }

    // Move time forward by 61 seconds
    vi.advanceTimersByTime(61000)

    const res = rateLimit(key, 5, 60000)
    expect(res.success).toBe(true)
    expect(res.remaining).toBe(4)
  })
})
