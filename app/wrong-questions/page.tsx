'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WrongQuestion } from '@/lib/types'

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Physics:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400'   },
  Chemistry: { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400'  },
  Maths:     { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  Biology:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400'  },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   'text-green-400 bg-green-500/10 border border-green-500/30',
  Medium: 'text-amber-400 bg-amber-500/10 border border-amber-500/30',
  Hard:   'text-red-400 bg-red-500/10 border border-red-500/30',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function WrongQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [activeSubject, setActiveSubject] = useState<string>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const raw = sessionStorage.getItem('wrong_questions')
    if (!raw) {
      router.push('/')
      return
    }
    const parsed = JSON.parse(raw) as WrongQuestion[]
    // Only show questions where student was actually wrong (marks_lost > 0)
    setQuestions(parsed.filter(q => q.student_answer !== q.correct_answer))
  }, [router])

  const subjects = ['All', ...Array.from(new Set(questions.map(q => q.subject)))]

  const filtered = activeSubject === 'All'
    ? questions
    : questions.filter(q => q.subject === activeSubject)

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpandedIds(new Set(filtered.map(q => q.id)))
  }

  function collapseAll() {
    setExpandedIds(new Set())
  }

  const totalMarksLost = questions.reduce((sum, q) => sum + q.marks_lost, 0)

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading questions...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <button
          onClick={() => router.push('/mentor')}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          &#8592; Back to Report
        </button>
        <span className="text-gray-500 text-xs uppercase tracking-widest">Wrong Questions</span>
        <div className="w-24" />
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header summary */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Wrong Questions Review</h1>
          <p className="text-gray-400 text-sm">
            {questions.length} incorrect answers &middot; {totalMarksLost} marks lost to negative marking
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(
            questions.reduce((acc, q) => {
              acc[q.subject] = (acc[q.subject] ?? 0) + 1
              return acc
            }, {} as Record<string, number>)
          ).map(([subject, count]) => {
            const colors = SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.Physics
            return (
              <div key={subject} className={`rounded-xl p-3 border ${colors.bg} ${colors.border} text-center`}>
                <p className={`font-bold text-xl ${colors.text}`}>{count}</p>
                <p className="text-gray-400 text-xs mt-0.5">{subject}</p>
              </div>
            )
          })}
        </div>

        {/* Subject filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {subjects.map(s => {
            const active = s === activeSubject
            const colors = s !== 'All' ? SUBJECT_COLORS[s] : null
            return (
              <button
                key={s}
                onClick={() => setActiveSubject(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? colors
                      ? `${colors.bg} ${colors.border} ${colors.text}`
                      : 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                {s}
                {s !== 'All' && (
                  <span className="ml-1 opacity-60">
                    ({questions.filter(q => q.subject === s).length})
                  </span>
                )}
              </button>
            )
          })}
          <div className="ml-auto flex gap-2">
            <button onClick={expandAll} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
              Expand all
            </button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
              Collapse all
            </button>
          </div>
        </div>

        {/* Question list */}
        <div className="space-y-3">
          {filtered.map((q, idx) => {
            const isOpen = expandedIds.has(q.id)
            const colors = SUBJECT_COLORS[q.subject] ?? SUBJECT_COLORS.Physics

            return (
              <div
                key={q.id}
                className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
                  isOpen ? 'border-red-500/40' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Question header — always visible */}
                <button
                  className="w-full text-left px-5 py-4 flex items-start gap-4"
                  onClick={() => toggleExpand(q.id)}
                >
                  {/* Index */}
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Tags row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.border} border ${colors.text}`}>
                        {q.subject}
                      </span>
                      <span className="text-gray-500 text-xs">{q.chapter}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                      <span className="ml-auto text-red-400 text-xs font-medium">−{q.marks_lost} mark</span>
                    </div>
                    {/* Question text preview */}
                    <p className={`text-gray-200 text-sm leading-relaxed ${!isOpen ? 'line-clamp-2' : ''}`}>
                      {q.question_text}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <span className={`text-gray-500 flex-shrink-0 transition-transform text-sm mt-0.5 ${isOpen ? 'rotate-180' : ''}`}>
                    &#8964;
                  </span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, i) => {
                        const label = OPTION_LABELS[i]
                        const isCorrect = label === q.correct_answer
                        const isStudentPick = label === q.student_answer
                        return (
                          <div
                            key={label}
                            className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                              isCorrect
                                ? 'bg-green-500/10 border-green-500/40 text-green-200'
                                : isStudentPick
                                ? 'bg-red-500/10 border-red-500/40 text-red-200'
                                : 'bg-gray-800/50 border-gray-700/50 text-gray-400'
                            }`}
                          >
                            <span className={`font-bold w-4 flex-shrink-0 ${
                              isCorrect ? 'text-green-400' : isStudentPick ? 'text-red-400' : 'text-gray-500'
                            }`}>
                              {label}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && (
                              <span className="text-green-400 text-xs font-medium flex-shrink-0">Correct</span>
                            )}
                            {isStudentPick && !isCorrect && (
                              <span className="text-red-400 text-xs font-medium flex-shrink-0">Your answer</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Why you were wrong</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div className="pt-4 pb-8 text-center">
          <button
            onClick={() => router.push('/mentor')}
            className="px-6 py-3 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-300 text-sm transition-colors"
          >
            &#8592; Back to Full Report
          </button>
        </div>

      </div>
    </div>
  )
}
