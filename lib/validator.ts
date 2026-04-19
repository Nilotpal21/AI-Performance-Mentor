import { MentorInput, MentorOutput } from './types'

export function validateGrounding(output: string, input: MentorInput): boolean {
  const numbers = output.match(/\b\d+\.?\d*\b/g) ?? []
  const inputJson = JSON.stringify(input)

  for (const num of numbers) {
    if (!inputJson.includes(num)) {
      return false
    }
  }
  return true
}

export function generateFallback(input: MentorInput): MentorOutput {
  const top3Chapters = input.chapter_loss_ranking.slice(0, 3)
  const chapterList = top3Chapters
    .map(c => `${c.name} (${c.subject}, loss score: ${c.loss_score})`)
    .join(', ')

  const ntaNote = input.nta_note_required
    ? ` Note: NTA normalization was applied; your raw score was ${input.score_raw}.`
    : ''

  const surplusNote = input.time_surplus_min > 0
    ? `You finished ${input.time_surplus_min} minutes early.`
    : `You used all ${input.time_allotted_min} minutes.`

  return {
    opening: `You completed the ${input.exam_track} mock test with an attempt rate of ${input.attempt_rate}% and an accuracy of ${input.accuracy}%.`,
    score_section: `Your total score is ${input.score_total} out of ${input.max_score}.${ntaNote} Your accuracy stands at ${input.accuracy}% with ${input.incorrect_count} incorrect answers.`,
    chapter_section: `Your highest-loss chapters are: ${chapterList}. Focusing on these areas will have the greatest impact on your next score.`,
    time_section: `You took ${input.time_taken_min} minutes out of the ${input.time_allotted_min} minutes allotted. ${surplusNote}`,
    recommendations: `1. Prioritise revision of ${top3Chapters[0]?.name ?? 'your weakest chapter'} — it has the highest loss score. 2. Review all ${input.incorrect_count} incorrect answers to identify conceptual gaps. 3. Maintain your attempt rate of ${input.attempt_rate}% while working to improve accuracy.`,
    rank_section: `Your All India Rank is ${input.air} with an overall percentile of ${input.percentile_overall}. The benchmark percentile for ${input.category_rank_context.benchmark_label} is ${input.category_rank_context.benchmark_percentile}.`,
    is_fallback: true,
  }
}
