# AI Performance Mentor — JEE / NEET

A working prototype of the AI Performance Mentor described in the product solution document.

## What it does

Turns a mock exam result into a personalized coaching narrative — grounded entirely in the student's own data.

**Two views:**
- **Report** (View 1): Narrative walkthrough of the test — score, chapter analysis, time management, recommendations. Rank appears **last**, after context.
- **Chat** (View 2): 3 grounded follow-up questions (free tier), answered only from the test data.

## Architecture

The core principle: **LLM is narrator, not reasoner.**

All computation happens server-side before any model call:
- `lib/ingestion.ts` — computes attempt rate, accuracy, chapter loss ranking, category benchmarks, NTA note
- `lib/narrator.ts` — calls Claude Haiku at temp 0.2, parses structured JSON output
- `lib/validator.ts` — extracts all numeric tokens from LLM output and verifies each exists verbatim in MentorInput; serves rule-based fallback on any violation

## Getting started

1. Set your Anthropic API key in `.env.local`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Demo

The prototype uses a pre-built demo student (Arjun Kumar, JEE Main Mock #4) — no real grader integration needed. Click "View My Mentor Report" on the landing page.

## Stack

- Next.js 14 App Router
- TypeScript + Tailwind CSS
- Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic SDK
