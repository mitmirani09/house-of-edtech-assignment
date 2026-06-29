import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'

const AIRequestSchema = z.object({
  action: z.enum(['assistant', 'summarize']),
  text: z.string().min(1, 'Content is required').max(500000, 'Content is too long'),
  modifier: z.enum(['improve', 'grammar', 'shorten', 'simplify']).optional(),
})

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Rate limiting (max 30 AI requests per user per minute)
  const limitRes = rateLimit(`ai-req:${session.user.id}`, 30, 60000)
  if (!limitRes.success) {
    return NextResponse.json({ error: limitRes.error }, { status: 429 })
  }

  // 3. Check for API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    return NextResponse.json({
      error: 'GEMINI_API_KEY is not configured. Please get a key from Google AI Studio and put it in your .env file.'
    }, { status: 400 })
  }

  try {
    const json = await req.json()
    const validation = AIRequestSchema.safeParse(json)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const { action, text, modifier } = validation.data

    let prompt = ''
    if (action === 'summarize') {
      prompt = `Provide a structured, clean, and concise summary of the following document. Use bullet points and bold headers if appropriate. Do not include any meta-text or preambles, just output the clean summary: \n\n${text}`
    } else if (action === 'assistant') {
      if (modifier === 'improve') {
        prompt = `Improve the flow, clarity, and vocabulary of the following text while keeping its core message and style. Do not wrap in quotes or add preamble: \n\n${text}`
      } else if (modifier === 'grammar') {
        prompt = `Fix all spelling, punctuation, and grammatical issues in the following text. Preserve the original meaning. Do not wrap in quotes or add preamble: \n\n${text}`
      } else if (modifier === 'shorten') {
        prompt = `Make the following text more concise and brief while preserving all critical information. Do not wrap in quotes or add preamble: \n\n${text}`
      } else if (modifier === 'simplify') {
        prompt = `Rewrite the following text in clear, simple, and straightforward language. Do not wrap in quotes or add preamble: \n\n${text}`
      }
    }

    // Call Google Gemini via Vercel AI SDK
    const model = google('gemini-2.5-flash')
    const { text: resultText } = await generateText({
      model,
      prompt,
    })

    return NextResponse.json({ success: true, result: resultText })
  } catch (error: any) {
    console.error('AI execution error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process AI request' }, { status: 500 })
  }
}
