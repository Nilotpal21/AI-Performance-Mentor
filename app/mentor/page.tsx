'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MentorInput, MentorOutput } from '@/lib/types'
import SectionCard from '@/components/SectionCard'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function MentorPage() {
  const router = useRouter()
  const [mentorOutput, setMentorOutput] = useState<MentorOutput | null>(null)
  const [mentorInput, setMentorInput] = useState<MentorInput | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outputRaw = sessionStorage.getItem('mentor_output')
    const inputRaw = sessionStorage.getItem('mentor_input')
    if (!outputRaw || !inputRaw) {
      router.push('/')
      return
    }
    setMentorOutput(JSON.parse(outputRaw) as MentorOutput)
    setMentorInput(JSON.parse(inputRaw) as MentorInput)
  }, [router])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function handleSendMessage() {
    if (!inputText.trim() || !mentorInput || questionsUsed >= 3) return

    const userMessage = inputText.trim()
    setInputText('')
    setChatError(null)

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(newHistory)
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mentor_input: mentorInput,
          history: chatHistory,
          questions_used: questionsUsed,
        }),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()

      if (data.blocked) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }])
        setQuestionsUsed(prev => prev + 1)
      }
    } catch (err) {
      console.error(err)
      setChatError('Failed to get response. Please try again.')
      // Remove the user message we optimistically added
      setChatHistory(chatHistory)
    } finally {
      setChatLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const questionsRemaining = Math.max(0, 3 - questionsUsed)
  const isBlocked = questionsUsed >= 3

  if (!mentorOutput || !mentorInput) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading report...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          &#8592; Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs uppercase tracking-widest">
            {mentorOutput.is_fallback ? 'Quick Summary' : 'AI Mentor'}
          </span>
          {mentorOutput.is_fallback && (
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-full">
              Fallback
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs">{mentorInput.exam_track}</p>
      </nav>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 space-y-6 lg:space-y-0">

        {/* LEFT: Report */}
        <div className="space-y-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Your Performance Report</h1>
            <p className="text-gray-400 text-sm mt-1">{mentorInput.attempt_id}</p>
          </div>

          {/* 1. Opening */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <p className="text-gray-200 text-base leading-relaxed italic">
              &ldquo;{mentorOutput.opening}&rdquo;
            </p>
          </div>

          {/* 2. Score */}
          <SectionCard
            title="Score"
            content={mentorOutput.score_section}
            variant="highlight"
          />

          {/* 3. Chapter analysis */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 text-gray-400">
              Chapter Analysis
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed mb-4">
              {mentorOutput.chapter_section}
            </p>
            {/* Chapter loss viz */}
            <div className="space-y-2 mt-4 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Top chapters by loss score</p>
              {mentorInput.chapter_loss_ranking.slice(0, 5).map((chapter, i) => {
                const maxLoss = mentorInput.chapter_loss_ranking[0]?.loss_score ?? 1
                const pct = Math.round((chapter.loss_score / maxLoss) * 100)
                const barColor = i === 0
                  ? 'bg-red-500'
                  : i <= 2
                  ? 'bg-amber-500'
                  : 'bg-green-600'
                return (
                  <div key={chapter.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300">{chapter.name} <span className="text-gray-500">({chapter.subject})</span></span>
                      <span className="text-xs text-gray-400">loss: {chapter.loss_score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Time */}
          <SectionCard
            title="Time Management"
            content={mentorOutput.time_section}
            variant="default"
          />

          {/* 5. Recommendations */}
          <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 text-blue-400">
              Recommendations
            </h3>
            <div className="space-y-2">
              {mentorOutput.recommendations.split(/\d+\.\s+/).filter(Boolean).map((rec, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-blue-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <p className="text-gray-200 text-sm leading-relaxed">{rec.trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-500 text-xs uppercase tracking-widest whitespace-nowrap">— Your Result —</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* 6. Rank (last) */}
          <SectionCard
            title="All India Rank"
            content={mentorOutput.rank_section}
            variant="rank"
          />

          {/* Subject percentiles */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 text-gray-400">
              Subject Percentiles
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(mentorInput.subject_percentiles).map(([subject, pct]) => (
                <div key={subject} className="text-center">
                  <p className="text-gray-500 text-xs mb-1">{subject}</p>
                  <p className={`font-bold text-xl ${
                    pct >= 80 ? 'text-green-400' : pct >= 65 ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {pct}
                  </p>
                  <p className="text-gray-600 text-xs">percentile</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="flex flex-col h-[calc(100vh-5rem)] sticky top-20">
          {/* Chat header */}
          <div className="bg-gray-900 border border-gray-700 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Ask about this test</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-gray-500 text-xs">Grounded to your test data</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              questionsRemaining > 1
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : questionsRemaining === 1
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {questionsRemaining} question{questionsRemaining !== 1 ? 's' : ''} remaining
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto bg-gray-900/50 border-x border-gray-700 px-4 py-4 space-y-4 min-h-0">
            {chatHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Ask anything about your test performance.</p>
                <p className="text-gray-600 text-xs mt-2">e.g. &ldquo;Why did I lose marks in Thermodynamics?&rdquo;</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input or upgrade prompt */}
          <div className="bg-gray-900 border border-t-0 border-gray-700 rounded-b-xl p-3">
            {isBlocked ? (
              <div className="text-center py-3 space-y-2">
                <span className="text-2xl">🔒</span>
                <p className="text-gray-300 text-sm font-medium">Upgrade to Mentor tier for unlimited chat</p>
                <button className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors">
                  Upgrade Now
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={chatLoading}
                  placeholder="Ask about your performance..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading || !inputText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Send
                </button>
              </div>
            )}
            {chatError && (
              <p className="text-red-400 text-xs mt-2">{chatError}</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
