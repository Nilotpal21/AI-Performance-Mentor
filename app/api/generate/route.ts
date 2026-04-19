import { NextRequest, NextResponse } from 'next/server'
import { AttemptData } from '@/lib/types'
import { computeMentorInput } from '@/lib/ingestion'
import { generateMentorNarrative } from '@/lib/narrator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { attempt: AttemptData }
    const { attempt } = body

    if (!attempt) {
      return NextResponse.json({ error: 'Missing attempt data' }, { status: 400 })
    }

    const mentorInput = computeMentorInput(attempt)
    const mentorOutput = await generateMentorNarrative(mentorInput)

    return NextResponse.json({ mentor_output: mentorOutput, mentor_input: mentorInput })
  } catch (err) {
    console.error('[api/generate] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
