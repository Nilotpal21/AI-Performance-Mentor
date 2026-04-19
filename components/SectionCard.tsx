'use client'

import React from 'react'

type SectionCardProps = {
  title: string
  content: string
  variant?: 'default' | 'highlight' | 'rank'
}

function parseMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function SectionCard({ title, content, variant = 'default' }: SectionCardProps) {
  const borderColor = {
    default: 'border-gray-700',
    highlight: 'border-blue-500',
    rank: 'border-amber-500',
  }[variant]

  const titleColor = {
    default: 'text-gray-400',
    highlight: 'text-blue-400',
    rank: 'text-amber-400',
  }[variant]

  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-xl p-5 shadow-sm`}>
      <h3 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${titleColor}`}>
        {title}
      </h3>
      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
        {parseMarkdown(content)}
      </p>
    </div>
  )
}
