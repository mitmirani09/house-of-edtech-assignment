import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'

const AIRequestSchema = z.object({
  action: z.enum(['assistant', 'summarize']),
  text: z.string().min(1, 'Content is required').max(500000, 'Content is too long'),
  modifier: z.enum(['improve', 'grammar', 'shorten', 'simplify']).optional(),
})

describe('AI Route Request Schema', () => {
  it('should validate valid summarize requests', () => {
    const payload = {
      action: 'summarize',
      text: 'This is a sample document content to be summarized.',
    }
    const res = AIRequestSchema.safeParse(payload)
    expect(res.success).toBe(true)
  })

  it('should validate valid assistant requests with modifiers', () => {
    const payload = {
      action: 'assistant',
      text: 'This is a phrase to improve.',
      modifier: 'improve',
    }
    const res = AIRequestSchema.safeParse(payload)
    expect(res.success).toBe(true)
  })

  it('should fail validation if text is missing', () => {
    const payload = {
      action: 'summarize',
      text: '',
    }
    const res = AIRequestSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('should fail validation if action is invalid', () => {
    const payload = {
      action: 'invalid-action',
      text: 'Sample text',
    }
    const res = AIRequestSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('should fail validation if modifier is invalid', () => {
    const payload = {
      action: 'assistant',
      text: 'Sample text',
      modifier: 'invalid-modifier',
    }
    const res = AIRequestSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })
})
