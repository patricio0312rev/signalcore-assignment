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
│   ├── page.tsx            # Dashboard (main page, client component)
│   └── api/
│       ├── research/       # Agentic research pipeline API
│       │   ├── start/route.ts    # POST — trigger research
│       │   ├── status/route.ts   # GET — SSE progress stream
│       │   └── results/route.ts  # GET — completed evidence
│       ├── evidence/route.ts
│       ├── recommend/route.ts
│       └── score/route.ts
├── components/             # React components by feature
│   ├── research/           # ResearchPanel, VendorProgress, EventLog
│   ├── layout/             # Header, Sidebar, Footer
│   ├── matrix/             # ComparisonMatrix, ScoreCell, badges
│   ├── evidence/           # EvidenceDrawer, EvidenceCard
│   ├── charts/             # RadarChart, ScoreBarChart
│   ├── chat/               # ChatPanel, ChatMessage, SuggestionChips
│   ├── vendors/            # VendorScoreCard, VendorComparisonBar
│   └── settings/           # PrioritySliders, ExportButton
├── lib/                    # Business logic (no React)
│   ├── research/           # Agentic research pipeline
│   │   ├── types.ts        # Research types (sessions, events, pages)
│   │   ├── sources.ts      # Vendor source URL configs (18 real URLs)
│   │   ├── fetcher.ts      # HTTP fetcher with caching and retries
│   │   ├── parser.ts       # HTML-to-text and GitHub response parsers
│   │   ├── analyzer.ts     # Evidence extraction (routes to mock/live)
│   │   ├── mock-analyzer.ts # Simulated LLM with pre-generated responses
│   │   ├── mock-responses.ts # 24 vendor×requirement mock evidence sets
│   │   ├── prompts.ts      # LLM prompts for live mode
│   │   ├── orchestrator.ts # Pipeline coordinator (sequential vendors)
│   │   ├── session-store.ts # In-memory session management with TTL
│   │   └── config.ts       # Research mode env var handling
│   ├── scoring/            # engine.ts, weights.ts, confidence.ts, types.ts
│   ├── chat/               # scenarios.ts, matcher.ts, prompts.ts
│   └── utils/              # freshness.ts, export.ts
├── data/                   # JSON data (vendors, requirements, chat scenarios)
│   ├── evidence.json       # Empty — populated by research pipeline
│   ├── vendors.json        # 4 vendors: LangSmith, Langfuse, Braintrust, PostHog
│   ├── requirements.json   # 6 requirements from assignment spec
│   └── chat-scenarios.json
└── __tests__/              # Test files (115 tests across 10 suites)
    ├── unit/               # scoring, confidence, weights, freshness, parser, mock-analyzer
    ├── ai/                 # prompt-regression, scoring-consistency, hallucination, response-quality
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

- **Agentic research pipeline** — app fetches real vendor docs/GitHub data, then extracts evidence (simulated LLM by default, swappable to live via `RESEARCH_MODE` env var)
- **Real web fetching, simulated analysis** — HTTP requests are always real; only the LLM evidence extraction step is simulated in default mode
- **SSE for progress** — research progress streams to browser via Server-Sent Events (`/api/research/status`)
- **In-memory sessions** — research sessions stored in module-level Map (demo-only; production would use Redis/KV)
- **Deterministic scoring** — same evidence input always produces same scores
- **Client-side interactivity** — priority sliders recalculate scores in the browser
- **Chat recommendations** — hardcoded scenarios matched by keyword (no real LLM calls)

## Git Conventions

- Commit messages: `type: description` (feat, fix, test, docs, refactor, chore)
- Keep commits atomic — one feature/fix per commit
- Branch: work directly on `main` (time-constrained assignment)

## Component Patterns

- Props defined as `interface ComponentNameProps { ... }` in a types.d.ts file in the same folder of the component
- Use `cn()` helper (clsx + twMerge) for conditional classes
- Use debouncing for inputs related to search or chat
- Event handlers named `handleX` (e.g., `handleCellClick`)
- Loading/empty/error states handled in every component that fetches data
- No `useEffect` for derived state — use `useMemo` instead
- Do not create components of more than 200 lines
- One component per file
- Components should go under the components folder and then be grouped by categories like buttons, inputs, and so on. Sections (the ones that implement reusable components) should also be part of this folder and the pages use the sections and components as needed

## Styling

- Tailwind v4: use `@import "tailwindcss"` in CSS, NOT `@tailwind` directives
- Design tokens defined as CSS variables in `app/globals.css`
- No inline `style={}` — always use Tailwind classes
- Spacing system: stick to 4px increments (p-1, p-2, p-4, etc.)

## Do NOT

- Do NOT make real API calls to any LLM provider, simulate them
- Do NOT create `.env` files or require API keys to run, but create the `.env.example` in case we were using one
- Do NOT use `"use client"` unless the component genuinely needs interactivity
- Do NOT over-abstract — this is a 3-hour prototype, not an enterprise codebase
