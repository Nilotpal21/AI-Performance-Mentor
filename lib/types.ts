export type WrongQuestion = {
  id: string
  chapter: string
  subject: string
  question_text: string
  options: string[]           // A, B, C, D
  student_answer: string      // e.g. 'B'
  correct_answer: string      // e.g. 'A'
  explanation: string
  marks_lost: number          // negative marks penalty
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export type AttemptData = {
  attempt_id: string
  exam_track: 'JEE Main' | 'JEE Advanced' | 'NEET'
  student_name: string
  score_raw: number
  score_total: number  // NTA normalized
  normalization_applied: boolean
  max_score: number
  total_questions: number
  attempted: number
  correct: number
  incorrect: number
  time_taken_min: number
  time_allotted_min: number
  air: number          // All India Rank
  percentile_overall: number
  category: 'General' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS'
  is_first_mock: boolean
  peer_cohort_size: number
  subject_percentiles: { Physics?: number; Chemistry?: number; Maths?: number; Biology?: number }
  chapters: Array<{
    name: string
    subject: string
    attempted: number
    correct: number
    incorrect: number
    total: number
  }>
  wrong_questions?: WrongQuestion[]
}

export type MentorInput = {
  attempt_id: string
  exam_track: string
  score_total: number
  score_raw: number
  normalization_applied: boolean
  max_score: number
  attempt_rate: number           // attempted/total_questions * 100
  accuracy: number               // correct/attempted * 100
  incorrect_count: number
  time_taken_min: number
  time_allotted_min: number
  time_surplus_min: number       // time_allotted - time_taken
  percentile_overall: number
  subject_percentiles: Record<string, number>
  air: number
  peer_cohort_size: number
  chapter_loss_ranking: Array<{  // sorted by loss (incorrect * negative marks - missed * opportunity cost)
    name: string
    subject: string
    loss_score: number
    attempted: number
    correct: number
    incorrect: number
    total: number
    accuracy_pct: number
  }>
  category_rank_context: {
    target_label: string
    benchmark_percentile: number
    benchmark_label: string
  }
  nta_note_required: boolean
  vocabulary_tier: 'standard' | 'simplified'  // simplified if is_first_mock
}

export type MentorOutput = {
  opening: string
  score_section: string
  chapter_section: string
  time_section: string
  recommendations: string
  rank_section: string
  is_fallback: boolean
}
