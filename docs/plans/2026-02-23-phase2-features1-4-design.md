# Phase 2 Design: Features 1-4

## Objective

Build the data layer, scoring engine, comparison matrix UI, and evidence drawer for SignalCore — a vendor evaluation tool comparing LangSmith, Langfuse, and Braintrust.

## Design Decisions

- **Dark mode only** — no light/dark toggle. The `dark` class is hardcoded on `<html>`.
- **Fonts**: Inter (body) + JetBrains Mono (scores/numbers) via `next/font/google`
- **Icons**: Lucide React (tree-shakeable, already installed)
- **UI framework**: shadcn/ui (tooltip, badge, table, card, button, sheet)
- **Toasts**: Sileo for physics-based toast notifications
- **Charts**: Recharts only — no hand-drawn SVGs
- **Score scale**: 0-10 (matching mockups, not original 0-5)
- **Design tokens**: CSS variables in globals.css tuned to mockup palette

## Mockup Color Palette (dark mode)

| Token                | Value     | Usage                     |
| -------------------- | --------- | ------------------------- |
| background           | `#0f172a` | Page background           |
| card / surface       | `#1e293b` | Card surfaces             |
| border               | `#334155` | Borders                   |
| primary              | `#137fec` | Accent, links, highlights |
| muted-foreground     | `#94a3b8` | Secondary text            |
| foreground           | `#f8fafc` | Primary text              |
| chart-1 (LangSmith)  | `#137fec` | Blue                      |
| chart-2 (Langfuse)   | `#10b981` | Green                     |
| chart-3 (Braintrust) | `#f43f5e` | Rose                      |

## Feature 1: Data Layer & Types

### Types (`src/lib/scoring/types.ts`)

```typescript
type Priority = 'high' | 'medium' | 'low'
type SourceType = 'official' | 'github' | 'blog' | 'community'
type Strength = 'strong' | 'moderate' | 'weak'
type Confidence = 'high' | 'medium' | 'low'
type FreshnessLevel = 'fresh' | 'aging' | 'stale'

interface Vendor { id, name, description, website, logoUrl }
interface Requirement { id, name, description, priority: Priority }
interface Evidence { id, vendorId, requirementId, claim, snippet, sourceUrl, sourceType, strength, publishedAt, capturedAt }
interface Score { vendorId, requirementId, score: number (0-10), confidence, evidenceCount, freshnessLevel }
interface VendorScore { vendor: Vendor, totalScore: number, confidence, scores: Score[] }
```

### Data Files

- `src/data/vendors.json` — 3 vendors
- `src/data/requirements.json` — 6 requirements with priorities
- `src/data/evidence.json` — 18-20 items with real URLs

### API Routes

- `GET /api/evidence?vendorId=X&requirementId=Y` — returns filtered evidence
- `GET /api/score` — returns all computed scores

## Feature 2: Scoring Engine

### Files

- `src/lib/scoring/engine.ts` — main scoring function
- `src/lib/scoring/weights.ts` — source weights map
- `src/lib/scoring/confidence.ts` — confidence calculator
- `src/lib/utils/freshness.ts` — freshness utilities

### Algorithm

1. Filter evidence by vendor + requirement
2. For each evidence item: `weight = sourceWeight * recencyMultiplier * strengthMultiplier`
3. Aggregate weighted scores, normalize to 0-10
4. Calculate confidence from evidence count + diversity + recency
5. Determine freshness from most recent evidence date

## Feature 3: Comparison Matrix UI

### Components

- `src/components/layout/Header.tsx` — top nav bar
- `src/components/vendors/VendorScoreCard.tsx` — summary card with score + sparkline
- `src/components/matrix/ComparisonMatrix.tsx` — table wrapper
- `src/components/matrix/ScoreCell.tsx` — cell with score, progress bar, source count
- `src/components/matrix/PriorityBadge.tsx` — P0/P1/P2 badges
- `src/components/matrix/ConfidenceBadge.tsx` — high/med/low indicator
- `src/app/page.tsx` — dashboard composing all sections

### Interactions

- Cells are clickable — opens evidence drawer
- Tooltip on hover showing "Click to view evidence"
- Highest score per row gets subtle highlight

## Feature 4: Evidence Drawer

### Components

- `src/components/evidence/EvidenceDrawer.tsx` — shadcn Sheet from right
- `src/components/evidence/EvidenceCard.tsx` — individual evidence item
- `src/components/evidence/SourceTypeBadge.tsx` — official/github/blog/community
- `src/components/evidence/FreshnessBadge.tsx` — fresh/aging/stale with dot
- `src/components/evidence/StrengthIndicator.tsx` — strong/moderate/weak

### Behavior

- Opens from right side using shadcn Sheet
- Header shows "[Vendor] x [Requirement]" with score + confidence cards
- Scrollable list of evidence cards
- Each card: source badge, freshness, claim title, snippet, URL, strength

## Out of Scope

- Light mode
- Chat panel (Feature 6)
- Priority sliders (Feature 7)
- Export (Feature 8)
- Radar chart (Feature 5 — will be a placeholder div for now)
