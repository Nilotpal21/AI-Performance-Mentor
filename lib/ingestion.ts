import { AttemptData, MentorInput } from './types'

export function computeMentorInput(attempt: AttemptData): MentorInput {
  const attempt_rate = Math.round(attempt.attempted / attempt.total_questions * 100)
  const accuracy = Math.round(attempt.correct / attempt.attempted * 100)
  const time_surplus_min = attempt.time_allotted_min - attempt.time_taken_min

  // Chapter loss ranking
  const chapter_loss_ranking = attempt.chapters.map(chapter => {
    const missed = chapter.total - chapter.attempted
    const loss_score = chapter.incorrect * 4 + missed * 2
    const accuracy_pct = chapter.attempted > 0
      ? Math.round(chapter.correct / chapter.attempted * 100)
      : 0
    return {
      name: chapter.name,
      subject: chapter.subject,
      loss_score,
      attempted: chapter.attempted,
      correct: chapter.correct,
      incorrect: chapter.incorrect,
      total: chapter.total,
      accuracy_pct,
    }
  }).sort((a, b) => b.loss_score - a.loss_score)

  // Category rank context
  const categoryMap: Record<string, { benchmark_percentile: number; benchmark_label: string }> = {
    'General':  { benchmark_percentile: 95, benchmark_label: 'General category qualifier' },
    'OBC-NCL':  { benchmark_percentile: 88, benchmark_label: 'OBC-NCL qualifier' },
    'SC':       { benchmark_percentile: 75, benchmark_label: 'SC qualifier' },
    'ST':       { benchmark_percentile: 68, benchmark_label: 'ST qualifier' },
    'EWS':      { benchmark_percentile: 90, benchmark_label: 'EWS qualifier' },
  }
  const categoryContext = categoryMap[attempt.category] ?? {
    benchmark_percentile: 95,
    benchmark_label: 'category qualifier',
  }

  const category_rank_context = {
    target_label: attempt.category,
    benchmark_percentile: categoryContext.benchmark_percentile,
    benchmark_label: categoryContext.benchmark_label,
  }

  const nta_note_required = attempt.normalization_applied && attempt.exam_track === 'JEE Main'
  const vocabulary_tier = attempt.is_first_mock ? 'simplified' : 'standard'

  // Build subject_percentiles as Record<string, number>
  const subject_percentiles: Record<string, number> = {}
  for (const [key, val] of Object.entries(attempt.subject_percentiles)) {
    if (val !== undefined) {
      subject_percentiles[key] = val
    }
  }

  return {
    attempt_id: attempt.attempt_id,
    exam_track: attempt.exam_track,
    score_total: attempt.score_total,
    score_raw: attempt.score_raw,
    normalization_applied: attempt.normalization_applied,
    max_score: attempt.max_score,
    attempt_rate,
    accuracy,
    incorrect_count: attempt.incorrect,
    time_taken_min: attempt.time_taken_min,
    time_allotted_min: attempt.time_allotted_min,
    time_surplus_min,
    percentile_overall: attempt.percentile_overall,
    subject_percentiles,
    air: attempt.air,
    peer_cohort_size: attempt.peer_cohort_size,
    chapter_loss_ranking,
    category_rank_context,
    nta_note_required,
    vocabulary_tier: vocabulary_tier as 'standard' | 'simplified',
  }
}
