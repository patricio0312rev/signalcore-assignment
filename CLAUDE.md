# SignalCore — Project Context

## Tech Stack

- **Next.js 16** (App Router) with React 19
- **TypeScript** (strict mode enabled)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Recharts** for data visualization
- **Lucide React** for icons
- **date-fns** for date manipulation
- **clsx + tailwind-merge** for conditional class names

## File Structure

```
src/
├── app/                    # Pages and API routes (App Router)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard (main page)
│   └── api/
│       ├── evidence/route.ts
│       ├── recommend/route.ts
│       └── score/route.ts
├── components/             # React components by feature
│   ├── layout/             # Header, Sidebar, Footer
│   ├── matrix/             # ComparisonMatrix, ScoreCell, badges
│   ├── evidence/           # EvidenceDrawer, EvidenceCard
│   ├── charts/             # RadarChart, ScoreBarChart
│   ├── chat/               # ChatPanel, ChatMessage, SuggestionChips
│   ├── vendors/            # VendorScoreCard, VendorComparisonBar
│   └── settings/           # PrioritySliders, ExportButton
├── lib/                    # Business logic (no React)
│   ├── scoring/            # engine.ts, weights.ts, confidence.ts, types.ts
│   ├── chat/               # scenarios.ts, matcher.ts, prompts.ts
│   └── utils/              # freshness.ts, export.ts
├── data/                   # Static JSON data
│   ├── evidence.json
│   ├── vendors.json
│   ├── requirements.json
│   └── chat-scenarios.json
└── __tests__/              # Test files
    ├── unit/
    ├── ai/
    └── e2e/
```

## Coding Standards

- **No `any` type** — use proper TypeScript types or `unknown`
- **Functional components only** — no class components
- **Named exports** — avoid default exports (except for Next.js pages/layouts which require them)
- **Path alias**: Use `@/` for imports from `src/` (e.g., `import { Score } from '@/lib/scoring/types'`)
- **Pure functions in `lib/`** — no React imports, no side effects
- **Components are colocated by feature**, not by type

## Data Model

### Core Types (defined in `src/lib/scoring/types.ts`)

- **Vendor**: `{ id, name, description, website, logoUrl }`
- **Requirement**: `{ id, name, description, priority: 'high' | 'medium' | 'low' }`
- **Evidence**: `{ id, vendorId, requirementId, claim, snippet, sourceUrl, sourceType: 'official' | 'github' | 'blog' | 'community', strength: 'strong' | 'moderate' | 'weak', publishedAt, capturedAt }`
- **Score**: `{ vendorId, requirementId, score: number (0-5), confidence: 'high' | 'medium' | 'low', evidenceCount: number }`

### Scoring Constants

- Source weights: official=1.0, github=0.8, blog=0.6, community=0.4
- Recency: fresh(<90d)=1.0, aging(90-365d)=0.85, stale(>365d)=0.7
- Priority: high=3, medium=2, low=1

## Testing

- **Unit tests**: Vitest + Testing Library + jsdom — run with `npm test`
- **E2E tests**: Playwright — run with `npx playwright test`
- Test files live in `src/__tests__/` organized by type (unit, ai, e2e)

## Key Decisions

- **No LLM API calls** — chat recommendations are hardcoded scenarios matched by keyword
- **Deterministic scoring** — same evidence input always produces same scores
- **Static data** — all evidence/vendor/requirement data lives in JSON files, served via API routes
- **Client-side interactivity** — priority sliders recalculate scores in the browser
