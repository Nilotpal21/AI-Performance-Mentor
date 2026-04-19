'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SAMPLE_ATTEMPT } from '@/lib/sample-attempt'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleViewReport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt: SAMPLE_ATTEMPT }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()
      sessionStorage.setItem('mentor_output', JSON.stringify(data.mentor_output))
      sessionStorage.setItem('mentor_input', JSON.stringify(data.mentor_input))
      router.push('/mentor')
    } catch (err) {
      console.error(err)
      setError('Failed to generate report. Please check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">
            Beta
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            AI Performance Mentor
          </h1>
          <p className="text-gray-400 text-lg font-medium">JEE / NEET</p>
          <p className="text-gray-300 text-xl mt-2">
            Your test results, explained. Not just ranked.
          </p>
        </div>

        {/* Demo card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Demo Student</p>
              <h2 className="text-white font-semibold text-lg">Arjun Kumar</h2>
              <p className="text-gray-400 text-sm">JEE Main Mock #4</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Score</p>
              <p className="text-white font-bold text-2xl">143<span className="text-gray-500 text-base font-normal">/300</span></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-800">
            <div className="text-center">
              <p className="text-gray-500 text-xs">Attempted</p>
              <p className="text-gray-200 font-medium">75/90</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs">Accuracy</p>
              <p className="text-green-400 font-medium">69%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs">Percentile</p>
              <p className="text-blue-400 font-medium">74.2</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleViewReport}
          disabled={loading}
          className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your report...
            </>
          ) : (
            <>View My Mentor Report &#8594;</>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Differentiators */}
        <div className="text-left space-y-3 pt-2">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-4">What&apos;s different</p>
          {[
            { icon: '↓', label: 'Rank shown last, after context' },
            { icon: '◎', label: 'Tells you WHY — not just what happened' },
            { icon: '?', label: '3 grounded follow-up questions' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 text-gray-300">
              <span className="text-blue-400 font-mono text-sm mt-0.5 w-4 flex-shrink-0">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
