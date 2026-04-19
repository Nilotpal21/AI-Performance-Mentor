import Anthropic from '@anthropic-ai/sdk'
import { MentorInput, MentorOutput } from './types'
import { validateGrounding, generateFallback } from './validator'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a performance coach narrator for JEE/NEET students. Your ONLY job is to convert pre-computed analytics into clear, supportive narrative text.

STRICT RULES:
1. NEVER compute, estimate, infer, or approximate any number. Every number in your output MUST appear verbatim in the data provided to you.
2. Write in second person ("You attempted...", "Your accuracy...").
3. Be direct and supportive. Never shame. If score is 0, acknowledge it happened and focus on the path forward.
4. Keep each section concise — under 80 words.
5. Rank appears ONLY in rank_section — never elsewhere.

OUTPUT: Return ONLY valid JSON, no markdown, no explanation:
{
  "opening": "1-2 sentences on overall session",
  "score_section": "Score with NTA note if nta_note_required is true",
  "chapter_section": "Top 2-3 chapters to focus on by name, with loss numbers",
  "time_section": "Time management — time taken vs allotted, surplus if any",
  "recommendations": "2-3 specific actionable steps for next mock",
  "rank_section": "AIR and percentile, with category context benchmark"
}`

export async function generateMentorNarrative(input: MentorInput): Promise<MentorOutput> {
  try {
    const userMessage = `Here is the student's pre-computed performance data:\n${JSON.stringify(input, null, 2)}\n\nGenerate the mentor narrative following your rules exactly.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ],
    })

    const rawText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('')

    // Strip possible markdown code fences
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    const parsed = JSON.parse(cleaned) as Omit<MentorOutput, 'is_fallback'>

    const outputString = JSON.stringify(parsed)
    const isGrounded = validateGrounding(outputString, input)

    if (!isGrounded) {
      console.warn('[narrator] Grounding validation failed — returning fallback')
      return generateFallback(input)
    }

    return {
      opening: parsed.opening ?? '',
      score_section: parsed.score_section ?? '',
      chapter_section: parsed.chapter_section ?? '',
      time_section: parsed.time_section ?? '',
      recommendations: parsed.recommendations ?? '',
      rank_section: parsed.rank_section ?? '',
      is_fallback: false,
    }
  } catch (err) {
    console.error('[narrator] Error generating narrative:', err)
    return generateFallback(input)
  }
}
