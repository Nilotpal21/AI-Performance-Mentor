import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { MentorInput } from '@/lib/types'
import { validateGrounding } from '@/lib/validator'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string
      mentor_input: MentorInput
      history: ChatMessage[]
      questions_used: number
    }

    const { message, mentor_input, history, questions_used } = body

    if (questions_used >= 3) {
      return NextResponse.json({
        reply: "You've used your 3 free questions for this test. Upgrade to Mentor tier for unlimited chat.",
        blocked: true,
      })
    }

    const systemPrompt = `You are a performance coach for a JEE/NEET student. Answer ONLY based on the test data provided. NEVER reference any number not present in the data. If asked about something outside the test data, say you can only discuss this test's performance.

Here is the student's test data:
${JSON.stringify(mentor_input, null, 2)}`

    // Take last 6 messages of history
    const recentHistory = history.slice(-6)

    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0.3,
      system: systemPrompt,
      messages,
    })

    const replyText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('')

    const isGrounded = validateGrounding(replyText, mentor_input)

    return NextResponse.json({
      reply: replyText,
      is_fallback: !isGrounded,
    })
  } catch (err) {
    console.error('[api/chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
