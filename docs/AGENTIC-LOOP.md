# Agentic Research Loop — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fixed sequential research pipeline with a ReAct-style agent loop where the system dynamically decides what to search, fetch, and analyze — demonstrating the agentic workflow pattern that SignalCore uses in production.

**Architecture:** A tool-use agent loop where each vendor gets an autonomous research agent. The agent has access to tools (`search_web`, `fetch_page`, `analyze_content`, `search_github`) and runs a think→act→observe loop. It starts with seed queries, examines results, identifies evidence gaps per requirement, and dynamically fetches additional sources until confidence thresholds are met or a max-iteration limit is reached. The mock analyzer is preserved but the _orchestration logic_ becomes agentic.

**Tech Stack:** TypeScript, Next.js API routes, SSE streaming, existing scoring/evidence types

---

## Gap Analysis: What's Missing

### Current Fixed Pipeline

```
for each vendor:
  fetch(hardcoded_urls)          ← always the same 4-5 URLs
  for each page × requirement:
    analyze(page, requirement)   ← no feedback loop
  deduplicate → emit
```

### Target Agentic Pipeline

```
for each vendor:
  agent = new ResearchAgent(vendor, requirements)
  while !agent.satisfied && iterations < MAX:
    thought = agent.think(context)      ← "I need pricing info for Langfuse"
    action  = agent.selectTool(thought) ← search_web("langfuse pricing 2026")
    result  = agent.execute(action)     ← fetch + parse result
    agent.observe(result)               ← update evidence map, identify gaps
  emit final evidence
```

### Key Differences

| Aspect            | Fixed Pipeline         | Agentic Loop                           |
| ----------------- | ---------------------- | -------------------------------------- |
| Source discovery  | Hardcoded URL list     | Dynamic search + follow links          |
| Decision making   | None — runs all URLs   | Agent decides what to fetch next       |
| Stopping criteria | When all URLs fetched  | When evidence confidence is sufficient |
| Adaptability      | Same path every run    | Adapts based on what it finds          |
| Feedback loop     | None                   | Observe → think → act cycle            |
| Tool abstraction  | Implicit fetch/analyze | Explicit tool interface                |

---

## Phase 1: Tool Interface & Registry

**Goal:** Define the agent's tool interface and implement concrete tools.

### Task 1.1: Define tool types

**Files:**

- Create: `src/lib/research/agent/types.ts`

**Step 1: Create the agent tool type definitions**

```typescript
import type { Evidence, Requirement, SourceType } from "@/lib/scoring/types";

/** A tool the research agent can invoke */
export interface AgentTool {
  name: string;
  description: string;
  execute: (params: Record<string, string>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data: string;
  metadata?: Record<string, unknown>;
}

/** A single step in the agent's reasoning */
export interface AgentStep {
  thought: string;
  toolName: string;
  toolParams: Record<string, string>;
  observation: string;
  evidence: Evidence[];
  timestamp: string;
}

/** Evidence coverage tracker per requirement */
export interface EvidenceGap {
  requirementId: string;
  requirementName: string;
  evidenceCount: number;
  bestStrength: Evidence["strength"] | null;
  sourceTypes: SourceType[];
  satisfied: boolean;
}

/** Agent context that accumulates across iterations */
export interface AgentContext {
  vendorId: string;
  vendorName: string;
  requirements: Requirement[];
  steps: AgentStep[];
  evidence: Evidence[];
  gaps: EvidenceGap[];
  urlsFetched: Set<string>;
  iteration: number;
  maxIterations: number;
}

/** Events emitted during agent execution */
export type AgentEvent =
  | { type: "agent_thinking"; vendorId: string; thought: string }
  | {
      type: "agent_tool_call";
      vendorId: string;
      toolName: string;
      params: Record<string, string>;
    }
  | {
      type: "agent_observation";
      vendorId: string;
      observation: string;
      evidenceFound: number;
    }
  | { type: "agent_gap_update"; vendorId: string; gaps: EvidenceGap[] };
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/types.ts
git commit -m "feat: add agent tool type definitions for agentic research loop"
```

---

### Task 1.2: Implement `search_web` tool

**Files:**

- Create: `src/lib/research/agent/tools/search-web.ts`

The search tool simulates web search results. In live mode, it would call a search API (SerpAPI, Brave Search, etc). In mock mode, it returns plausible search results based on the query keywords matching vendor docs/GitHub/blog patterns.

**Step 1: Implement the search tool**

```typescript
import type { AgentTool, ToolResult } from "../types";
import { RESEARCH_SOURCES } from "../../sources";

/** Seed URLs that the search tool can "discover" based on query keywords */
const DISCOVERABLE_URLS: Record<
  string,
  { url: string; title: string; sourceType: string }[]
> = {
  langsmith: [
    {
      url: "https://docs.smith.langchain.com/evaluation",
      title: "LangSmith Evaluation Docs",
      sourceType: "official",
    },
    {
      url: "https://docs.smith.langchain.com/observability",
      title: "LangSmith Observability Docs",
      sourceType: "official",
    },
    {
      url: "https://docs.smith.langchain.com/prompt_engineering",
      title: "LangSmith Prompt Management",
      sourceType: "official",
    },
    {
      url: "https://blog.langchain.dev/langsmith-overview/",
      title: "LangSmith Overview — LangChain Blog",
      sourceType: "blog",
    },
    {
      url: "https://api.github.com/repos/langchain-ai/langsmith-sdk",
      title: "LangSmith SDK — GitHub",
      sourceType: "github",
    },
  ],
  langfuse: [
    {
      url: "https://langfuse.com/docs",
      title: "Langfuse Documentation",
      sourceType: "official",
    },
    {
      url: "https://langfuse.com/docs/open-source",
      title: "Langfuse Self-Hosting Guide",
      sourceType: "official",
    },
    {
      url: "https://langfuse.com/pricing",
      title: "Langfuse Pricing",
      sourceType: "official",
    },
    {
      url: "https://langfuse.com/blog/opentelemetry",
      title: "OpenTelemetry Support — Langfuse Blog",
      sourceType: "blog",
    },
    {
      url: "https://api.github.com/repos/langfuse/langfuse",
      title: "Langfuse — GitHub",
      sourceType: "github",
    },
  ],
  braintrust: [
    {
      url: "https://www.braintrust.dev/docs",
      title: "Braintrust Documentation",
      sourceType: "official",
    },
    {
      url: "https://www.braintrust.dev/docs/guides/evals",
      title: "Braintrust Evaluation Guide",
      sourceType: "official",
    },
    {
      url: "https://www.braintrust.dev/docs/guides/tracing",
      title: "Braintrust Tracing Guide",
      sourceType: "official",
    },
    {
      url: "https://api.github.com/repos/braintrustdata/braintrust-sdk",
      title: "Braintrust SDK — GitHub",
      sourceType: "github",
    },
  ],
  posthog: [
    {
      url: "https://posthog.com/docs",
      title: "PostHog Documentation",
      sourceType: "official",
    },
    {
      url: "https://posthog.com/docs/ai-engineering",
      title: "PostHog AI Engineering Docs",
      sourceType: "official",
    },
    {
      url: "https://posthog.com/pricing",
      title: "PostHog Pricing",
      sourceType: "official",
    },
    {
      url: "https://posthog.com/blog/llm-analytics",
      title: "LLM Analytics — PostHog Blog",
      sourceType: "blog",
    },
    {
      url: "https://api.github.com/repos/PostHog/posthog",
      title: "PostHog — GitHub",
      sourceType: "github",
    },
  ],
};

function matchQuery(
  query: string,
): { url: string; title: string; sourceType: string }[] {
  const q = query.toLowerCase();

  // Find which vendor the query is about
  const vendorId = Object.keys(DISCOVERABLE_URLS).find((v) =>
    q.includes(v.toLowerCase()),
  );
  if (!vendorId) return [];

  const allUrls = DISCOVERABLE_URLS[vendorId];

  // Filter by keyword relevance
  const keywords = q.split(/\s+/).filter((w) => w.length > 3);
  const scored = allUrls.map((entry) => {
    const text =
      `${entry.title} ${entry.url} ${entry.sourceType}`.toLowerCase();
    const hits = keywords.filter((kw) => text.includes(kw)).length;
    return { ...entry, score: hits };
  });

  // Return top 3, sorted by relevance
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function createSearchWebTool(): AgentTool {
  return {
    name: "search_web",
    description:
      "Search the web for vendor documentation, blog posts, and community discussions. Returns a list of relevant URLs with titles.",
    async execute(params) {
      const query = params.query ?? "";
      if (!query) {
        return { success: false, data: "Missing required parameter: query" };
      }

      // Simulate search latency
      await new Promise((r) => setTimeout(r, Math.random() * 150 + 50));

      const results = matchQuery(query);

      if (results.length === 0) {
        return {
          success: true,
          data: "No results found for this query.",
          metadata: { resultCount: 0 },
        };
      }

      const formatted = results
        .map((r, i) => `${i + 1}. [${r.sourceType}] ${r.title}\n   ${r.url}`)
        .join("\n");

      return {
        success: true,
        data: `Found ${results.length} results:\n${formatted}`,
        metadata: {
          resultCount: results.length,
          urls: results.map((r) => r.url),
        },
      };
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/tools/search-web.ts
git commit -m "feat: implement search_web agent tool with mock search results"
```

---

### Task 1.3: Implement `fetch_page` tool

**Files:**

- Create: `src/lib/research/agent/tools/fetch-page.ts`

Wraps the existing `fetchPage` from `fetcher.ts` into the agent tool interface.

**Step 1: Implement the fetch tool**

```typescript
import type { AgentTool } from "../types";
import type { ResearchSource } from "../../types";
import { fetchPage } from "../../fetcher";

function inferSourceType(url: string): ResearchSource["sourceType"] {
  if (url.includes("github.com")) return "github";
  if (url.includes("/blog")) return "blog";
  return "official";
}

export function createFetchPageTool(vendorId: string): AgentTool {
  return {
    name: "fetch_page",
    description:
      "Fetch and parse a web page, GitHub repo, or documentation URL. Returns the extracted text content.",
    async execute(params) {
      const url = params.url ?? "";
      if (!url) {
        return { success: false, data: "Missing required parameter: url" };
      }

      const source: ResearchSource = {
        vendorId,
        url,
        sourceType: inferSourceType(url),
        label: `Agent-discovered: ${url}`,
      };

      const page = await fetchPage(source);

      if (page.status === "error") {
        return {
          success: false,
          data: `Failed to fetch ${url}: ${page.error ?? "Unknown error"}`,
        };
      }

      const truncated =
        page.text.length > 3000
          ? page.text.slice(0, 3000) + "\n[...truncated]"
          : page.text;

      return {
        success: true,
        data: truncated,
        metadata: {
          title: page.title,
          publishedAt: page.publishedAt,
          sourceType: page.sourceType,
          textLength: page.text.length,
        },
      };
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/tools/fetch-page.ts
git commit -m "feat: implement fetch_page agent tool wrapping existing fetcher"
```

---

### Task 1.4: Implement `analyze_content` tool

**Files:**

- Create: `src/lib/research/agent/tools/analyze-content.ts`

Wraps the existing mock analyzer into the agent tool interface. Analyzes fetched content against a specific requirement.

**Step 1: Implement the analyze tool**

```typescript
import type { AgentTool } from "../types";
import type { FetchedPage } from "../../types";
import type { Requirement } from "@/lib/scoring/types";
import { analyzePageForRequirement } from "../../analyzer";

export function createAnalyzeContentTool(
  vendorId: string,
  requirements: Requirement[],
): AgentTool {
  return {
    name: "analyze_content",
    description:
      "Analyze page content against a specific requirement to extract evidence. Provide the page text and requirement ID.",
    async execute(params) {
      const requirementId = params.requirementId ?? "";
      const pageText = params.pageText ?? "";
      const sourceUrl = params.sourceUrl ?? "";
      const sourceType = params.sourceType ?? "official";

      if (!requirementId || !pageText) {
        return {
          success: false,
          data: "Missing required parameters: requirementId, pageText",
        };
      }

      const requirement = requirements.find((r) => r.id === requirementId);
      if (!requirement) {
        return {
          success: false,
          data: `Unknown requirement: ${requirementId}`,
        };
      }

      const page: FetchedPage = {
        url: sourceUrl,
        text: pageText,
        title: "",
        publishedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        sourceType: sourceType as FetchedPage["sourceType"],
        vendorId,
        status: "success",
      };

      const result = await analyzePageForRequirement(
        page,
        requirement,
        vendorId,
      );

      if (result.evidence.length === 0) {
        return {
          success: true,
          data: `No evidence found for requirement "${requirement.name}" in this content.`,
          metadata: { evidenceCount: 0 },
        };
      }

      const summary = result.evidence
        .map((e, i) => `Evidence ${i + 1} [${e.strength}]: ${e.claim}`)
        .join("\n");

      return {
        success: true,
        data: `Found ${result.evidence.length} pieces of evidence:\n${summary}`,
        metadata: {
          evidenceCount: result.evidence.length,
          evidence: result.evidence,
        },
      };
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/tools/analyze-content.ts
git commit -m "feat: implement analyze_content agent tool wrapping existing analyzer"
```

---

### Task 1.5: Implement `search_github` tool

**Files:**

- Create: `src/lib/research/agent/tools/search-github.ts`

Searches GitHub for repos/issues related to a vendor. In mock mode, returns known repo URLs.

**Step 1: Implement the GitHub search tool**

```typescript
import type { AgentTool } from "../types";

const GITHUB_REPOS: Record<
  string,
  { repo: string; url: string; stars: number; description: string }[]
> = {
  langsmith: [
    {
      repo: "langchain-ai/langsmith-sdk",
      url: "https://api.github.com/repos/langchain-ai/langsmith-sdk",
      stars: 850,
      description: "LangSmith Python/JS SDK for tracing and evaluation",
    },
    {
      repo: "langchain-ai/langsmith-cookbook",
      url: "https://api.github.com/repos/langchain-ai/langsmith-cookbook",
      stars: 450,
      description: "Recipes and examples for LangSmith",
    },
  ],
  langfuse: [
    {
      repo: "langfuse/langfuse",
      url: "https://api.github.com/repos/langfuse/langfuse",
      stars: 6200,
      description: "Open-source LLM engineering platform",
    },
    {
      repo: "langfuse/langfuse-js",
      url: "https://api.github.com/repos/langfuse/langfuse-js",
      stars: 320,
      description: "Langfuse JS/TS SDK",
    },
  ],
  braintrust: [
    {
      repo: "braintrustdata/braintrust-sdk",
      url: "https://api.github.com/repos/braintrustdata/braintrust-sdk",
      stars: 180,
      description: "Braintrust TypeScript SDK",
    },
  ],
  posthog: [
    {
      repo: "PostHog/posthog",
      url: "https://api.github.com/repos/PostHog/posthog",
      stars: 22000,
      description: "Product analytics with LLM observability",
    },
  ],
};

export function createSearchGitHubTool(): AgentTool {
  return {
    name: "search_github",
    description:
      "Search GitHub for repositories, SDKs, and open-source projects related to a vendor.",
    async execute(params) {
      const query = params.query ?? "";
      if (!query) {
        return { success: false, data: "Missing required parameter: query" };
      }

      await new Promise((r) => setTimeout(r, Math.random() * 100 + 50));

      const q = query.toLowerCase();
      const vendorId = Object.keys(GITHUB_REPOS).find((v) =>
        q.includes(v.toLowerCase()),
      );

      if (!vendorId) {
        return {
          success: true,
          data: "No GitHub repositories found for this query.",
          metadata: { resultCount: 0 },
        };
      }

      const repos = GITHUB_REPOS[vendorId];
      const formatted = repos
        .map(
          (r, i) =>
            `${i + 1}. ${r.repo} (⭐ ${r.stars})\n   ${r.description}\n   ${r.url}`,
        )
        .join("\n");

      return {
        success: true,
        data: `Found ${repos.length} repositories:\n${formatted}`,
        metadata: {
          resultCount: repos.length,
          repos: repos.map((r) => r.url),
        },
      };
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/tools/search-github.ts
git commit -m "feat: implement search_github agent tool"
```

---

## Phase 2: Agent Loop (ReAct Pattern)

**Goal:** Build the core agent loop that thinks, selects tools, observes results, and tracks evidence gaps.

### Task 2.1: Implement the gap tracker

**Files:**

- Create: `src/lib/research/agent/gap-tracker.ts`

Tracks which requirements have sufficient evidence and which need more research.

**Step 1: Implement gap tracker**

```typescript
import type { Evidence, Requirement, SourceType } from "@/lib/scoring/types";
import type { EvidenceGap } from "./types";

const MIN_EVIDENCE_COUNT = 1;
const PREFERRED_EVIDENCE_COUNT = 2;

export function computeGaps(
  requirements: Requirement[],
  evidence: Evidence[],
): EvidenceGap[] {
  return requirements.map((req) => {
    const reqEvidence = evidence.filter((e) => e.requirementId === req.id);
    const sourceTypes = [...new Set(reqEvidence.map((e) => e.sourceType))];
    const bestStrength =
      reqEvidence.length > 0
        ? ((reqEvidence.some((e) => e.strength === "strong")
            ? "strong"
            : reqEvidence.some((e) => e.strength === "moderate")
              ? "moderate"
              : "weak") as Evidence["strength"])
        : null;

    return {
      requirementId: req.id,
      requirementName: req.name,
      evidenceCount: reqEvidence.length,
      bestStrength,
      sourceTypes,
      satisfied:
        reqEvidence.length >= MIN_EVIDENCE_COUNT && bestStrength !== "weak",
    };
  });
}

export function allGapsSatisfied(gaps: EvidenceGap[]): boolean {
  return gaps.every((g) => g.satisfied);
}

export function getHighestPriorityGap(
  gaps: EvidenceGap[],
  requirements: Requirement[],
): EvidenceGap | null {
  const unsatisfied = gaps.filter((g) => !g.satisfied);
  if (unsatisfied.length === 0) return null;

  // Sort by priority (high > medium > low), then by evidence count (fewer first)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  unsatisfied.sort((a, b) => {
    const reqA = requirements.find((r) => r.id === a.requirementId);
    const reqB = requirements.find((r) => r.id === b.requirementId);
    const prioA = priorityOrder[reqA?.priority ?? "low"];
    const prioB = priorityOrder[reqB?.priority ?? "low"];
    if (prioA !== prioB) return prioA - prioB;
    return a.evidenceCount - b.evidenceCount;
  });

  return unsatisfied[0];
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/gap-tracker.ts
git commit -m "feat: implement evidence gap tracker for agent loop"
```

---

### Task 2.2: Implement the planner (simulated reasoning)

**Files:**

- Create: `src/lib/research/agent/planner.ts`

The planner decides what tool to call next based on current gaps and context. In mock mode this is rule-based; in live mode it would be an LLM call.

**Step 1: Implement the planner**

```typescript
import type { AgentContext, AgentStep, EvidenceGap } from "./types";
import type { Requirement } from "@/lib/scoring/types";
import { getHighestPriorityGap } from "./gap-tracker";

interface PlannedAction {
  thought: string;
  toolName: string;
  toolParams: Record<string, string>;
}

/** Rule-based planner that simulates LLM reasoning about what to research next */
export function planNextAction(context: AgentContext): PlannedAction | null {
  const gap = getHighestPriorityGap(context.gaps, context.requirements);

  // All gaps satisfied — we're done
  if (!gap) {
    return null;
  }

  const requirement = context.requirements.find(
    (r) => r.id === gap.requirementId,
  );
  if (!requirement) return null;

  // Strategy 1: No evidence yet → search the web for this requirement
  if (gap.evidenceCount === 0 && context.iteration <= 2) {
    return {
      thought: `I have no evidence for "${requirement.name}" for ${context.vendorName}. Let me search for relevant documentation.`,
      toolName: "search_web",
      toolParams: {
        query: `${context.vendorName} ${requirement.name.toLowerCase()}`,
      },
    };
  }

  // Strategy 2: Only weak evidence → search GitHub for code-level proof
  if (gap.bestStrength === "weak" && !gap.sourceTypes.includes("github")) {
    return {
      thought: `Evidence for "${requirement.name}" is weak. Let me check GitHub for code-level proof.`,
      toolName: "search_github",
      toolParams: {
        query: `${context.vendorName} ${requirement.name.toLowerCase()}`,
      },
    };
  }

  // Strategy 3: Have search results with unfetched URLs → fetch the top result
  const lastStep = context.steps[context.steps.length - 1];
  if (
    lastStep?.toolName === "search_web" ||
    lastStep?.toolName === "search_github"
  ) {
    const urls = (
      lastStep.observation.match(/https?:\/\/[^\s)]+/g) ?? []
    ).filter((url) => !context.urlsFetched.has(url));
    if (urls.length > 0) {
      return {
        thought: `Found search results. Let me fetch "${urls[0]}" to get detailed content.`,
        toolName: "fetch_page",
        toolParams: { url: urls[0] },
      };
    }
  }

  // Strategy 4: Have fetched content → analyze it for the gap requirement
  if (lastStep?.toolName === "fetch_page" && lastStep.observation.length > 50) {
    return {
      thought: `I have page content. Let me analyze it for evidence about "${requirement.name}".`,
      toolName: "analyze_content",
      toolParams: {
        requirementId: requirement.id,
        pageText: lastStep.observation,
        sourceUrl: lastStep.toolParams.url ?? "",
        sourceType: lastStep.toolParams.url?.includes("github")
          ? "github"
          : "official",
      },
    };
  }

  // Strategy 5: Fallback — try a broader web search
  if (context.iteration < context.maxIterations - 1) {
    return {
      thought: `Need more evidence for "${requirement.name}". Trying a broader search.`,
      toolName: "search_web",
      toolParams: {
        query: `${context.vendorName} ${requirement.name.toLowerCase()} documentation guide`,
      },
    };
  }

  return null;
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/planner.ts
git commit -m "feat: implement rule-based planner for agent tool selection"
```

---

### Task 2.3: Implement the agent loop

**Files:**

- Create: `src/lib/research/agent/research-agent.ts`

The core ReAct loop: think → act → observe → update gaps → repeat.

**Step 1: Implement the agent**

```typescript
import type { Vendor, Requirement, Evidence } from "@/lib/scoring/types";
import type { AgentContext, AgentEvent, AgentStep, AgentTool } from "./types";
import { computeGaps, allGapsSatisfied } from "./gap-tracker";
import { planNextAction } from "./planner";
import { createSearchWebTool } from "./tools/search-web";
import { createFetchPageTool } from "./tools/fetch-page";
import { createAnalyzeContentTool } from "./tools/analyze-content";
import { createSearchGitHubTool } from "./tools/search-github";

const DEFAULT_MAX_ITERATIONS = 12;

export async function runResearchAgent(
  vendor: Vendor,
  requirements: Requirement[],
  onEvent: (event: AgentEvent) => void,
  maxIterations?: number,
): Promise<Evidence[]> {
  const tools: AgentTool[] = [
    createSearchWebTool(),
    createSearchGitHubTool(),
    createFetchPageTool(vendor.id),
    createAnalyzeContentTool(vendor.id, requirements),
  ];

  const toolMap = new Map(tools.map((t) => [t.name, t]));

  const context: AgentContext = {
    vendorId: vendor.id,
    vendorName: vendor.name,
    requirements,
    steps: [],
    evidence: [],
    gaps: computeGaps(requirements, []),
    urlsFetched: new Set(),
    iteration: 0,
    maxIterations: maxIterations ?? DEFAULT_MAX_ITERATIONS,
  };

  // Emit initial gaps
  onEvent({
    type: "agent_gap_update",
    vendorId: vendor.id,
    gaps: context.gaps,
  });

  while (context.iteration < context.maxIterations) {
    // Check if all gaps are satisfied
    if (allGapsSatisfied(context.gaps)) {
      onEvent({
        type: "agent_thinking",
        vendorId: vendor.id,
        thought:
          "All requirements have sufficient evidence. Research complete.",
      });
      break;
    }

    // Plan next action
    const action = planNextAction(context);
    if (!action) {
      onEvent({
        type: "agent_thinking",
        vendorId: vendor.id,
        thought: "No more actions available. Wrapping up research.",
      });
      break;
    }

    // Emit thinking
    onEvent({
      type: "agent_thinking",
      vendorId: vendor.id,
      thought: action.thought,
    });

    // Execute tool
    const tool = toolMap.get(action.toolName);
    if (!tool) break;

    onEvent({
      type: "agent_tool_call",
      vendorId: vendor.id,
      toolName: action.toolName,
      params: action.toolParams,
    });

    const result = await tool.execute(action.toolParams);

    // Track fetched URLs
    if (action.toolName === "fetch_page" && action.toolParams.url) {
      context.urlsFetched.add(action.toolParams.url);
    }

    // Extract any evidence from tool result
    const newEvidence: Evidence[] =
      (result.metadata?.evidence as Evidence[] | undefined) ?? [];

    if (newEvidence.length > 0) {
      context.evidence.push(...newEvidence);
    }

    // Record step
    const step: AgentStep = {
      thought: action.thought,
      toolName: action.toolName,
      toolParams: action.toolParams,
      observation: result.data,
      evidence: newEvidence,
      timestamp: new Date().toISOString(),
    };
    context.steps.push(step);

    // Emit observation
    onEvent({
      type: "agent_observation",
      vendorId: vendor.id,
      observation: result.data.slice(0, 200),
      evidenceFound: newEvidence.length,
    });

    // Update gaps
    context.gaps = computeGaps(requirements, context.evidence);
    onEvent({
      type: "agent_gap_update",
      vendorId: vendor.id,
      gaps: context.gaps,
    });

    context.iteration++;
  }

  return context.evidence;
}
```

**Step 2: Commit**

```bash
git add src/lib/research/agent/research-agent.ts
git commit -m "feat: implement ReAct-style agent loop with tool-use pattern"
```

---

## Phase 3: Wire Agent into Orchestrator

**Goal:** Replace the fixed pipeline in `orchestrator.ts` with the agent loop, keeping SSE events compatible.

### Task 3.1: Create new agentic orchestrator

**Files:**

- Create: `src/lib/research/agent/orchestrator.ts`
- Modify: `src/app/api/research/start/route.ts` — switch to new orchestrator

The new orchestrator spawns one research agent per vendor and bridges agent events to the existing SSE event format.

**Step 1: Implement agentic orchestrator**

```typescript
import type { ResearchEvent, ResearchSession } from "../types";
import type { StoredSession } from "../session-store";
import type { Vendor, Requirement, Evidence } from "@/lib/scoring/types";
import type { AgentEvent } from "./types";
import { runResearchAgent } from "./research-agent";
import { updateSession } from "../session-store";
import { clearFetchCache } from "../fetcher";

function bridgeAgentEvent(event: AgentEvent): ResearchEvent | null {
  switch (event.type) {
    case "agent_thinking":
      return {
        type: "source_fetched",
        vendorId: event.vendorId,
        url: "",
        title: `Agent: ${event.thought.slice(0, 100)}`,
        status: "success",
      };
    case "agent_tool_call":
      return {
        type: "source_fetched",
        vendorId: event.vendorId,
        url: event.params.url ?? event.params.query ?? "",
        title: `Tool: ${event.toolName}`,
        status: "success",
      };
    case "agent_observation":
      return {
        type: "analysis_complete",
        vendorId: event.vendorId,
        requirementId: "",
        evidenceCount: event.evidenceFound,
      };
    default:
      return null;
  }
}

function emitEvent(
  event: ResearchEvent,
  onEvent: (event: ResearchEvent) => void,
  sessionId: string,
): void {
  onEvent(event);
  updateSession(sessionId, (session) => ({
    ...session,
    events: [...session.events, event],
  }));
}

export async function runAgenticResearch(
  vendors: Vendor[],
  requirements: Requirement[],
  onEvent: (event: ResearchEvent) => void,
  session: ResearchSession,
): Promise<Evidence[]> {
  clearFetchCache();

  const startTime = Date.now();
  const allEvidence: Evidence[] = [];

  updateSession(session.id, (s) => ({
    ...s,
    status: "running",
  }));

  for (const vendor of vendors) {
    emitEvent(
      { type: "job_started", vendorId: vendor.id, vendorName: vendor.name },
      onEvent,
      session.id,
    );

    // Bridge agent events to SSE format
    const agentOnEvent = (agentEvent: AgentEvent) => {
      const bridged = bridgeAgentEvent(agentEvent);
      if (bridged) {
        emitEvent(bridged, onEvent, session.id);
      }
    };

    const vendorEvidence = await runResearchAgent(
      vendor,
      requirements,
      agentOnEvent,
    );

    allEvidence.push(...vendorEvidence);

    emitEvent(
      {
        type: "job_complete",
        vendorId: vendor.id,
        totalEvidence: vendorEvidence.length,
      },
      onEvent,
      session.id,
    );
  }

  const duration = Date.now() - startTime;

  emitEvent(
    {
      type: "session_complete",
      totalEvidence: allEvidence.length,
      duration,
    },
    onEvent,
    session.id,
  );

  updateSession(session.id, (s: StoredSession) => ({
    ...s,
    status: "complete",
    completedAt: new Date().toISOString(),
  }));

  return allEvidence;
}
```

**Step 2: Update the start route to use agentic orchestrator**

In `src/app/api/research/start/route.ts`, change:

```typescript
// Old
import { runResearch } from "@/lib/research/orchestrator";
// New
import { runAgenticResearch } from "@/lib/research/agent/orchestrator";
```

And change the call:

```typescript
// Old
const evidence = await runResearch(vendors, requirements, handleEvent, session);
// New
const evidence = await runAgenticResearch(
  vendors,
  requirements,
  handleEvent,
  session,
);
```

**Step 3: Commit**

```bash
git add src/lib/research/agent/orchestrator.ts src/app/api/research/start/route.ts
git commit -m "feat: wire agentic orchestrator into research API route"
```

---

## Phase 4: UI — Agent Trace Viewer

**Goal:** Show the agent's reasoning steps in the UI so users can see _how_ the agent decided what to research.

### Task 4.1: Extend SSE events for agent trace

**Files:**

- Modify: `src/lib/research/types.ts` — add agent event types to `ResearchEvent`

**Step 1: Add agent-specific event types**

Add these to the `ResearchEvent` union in `types.ts`:

```typescript
  | { type: 'agent_thought'; vendorId: string; thought: string; iteration: number }
  | { type: 'agent_action'; vendorId: string; toolName: string; params: Record<string, string>; iteration: number }
```

**Step 2: Commit**

```bash
git add src/lib/research/types.ts
git commit -m "feat: add agent trace event types for SSE streaming"
```

---

### Task 4.2: Create AgentTrace component

**Files:**

- Create: `src/components/research/AgentTrace.tsx`

Displays the agent's think→act→observe steps as a timeline.

**Step 1: Implement the component**

```typescript
'use client';

import { Brain, Search, Globe, Code, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentTraceStep {
  type: 'thought' | 'tool_call' | 'observation';
  vendorId: string;
  content: string;
  toolName?: string;
  evidenceFound?: number;
  timestamp: string;
}

interface AgentTraceProps {
  steps: AgentTraceStep[];
}

const TOOL_ICONS: Record<string, typeof Search> = {
  search_web: Search,
  fetch_page: Globe,
  search_github: Code,
  analyze_content: FileText,
};

export function AgentTrace({ steps }: AgentTraceProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Agent Reasoning
      </h4>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {steps.map((step, i) => {
          const Icon = step.type === 'thought'
            ? Brain
            : TOOL_ICONS[step.toolName ?? ''] ?? Search;

          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs',
                step.type === 'thought' && 'bg-primary/5 text-primary',
                step.type === 'tool_call' && 'bg-muted/50 text-foreground',
                step.type === 'observation' && 'bg-emerald-500/5 text-emerald-600'
              )}
            >
              <Icon className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{step.content}</span>
              {step.evidenceFound != null && step.evidenceFound > 0 && (
                <span className="ml-auto shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                  +{step.evidenceFound}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/research/AgentTrace.tsx
git commit -m "feat: add AgentTrace component for displaying agent reasoning steps"
```

---

### Task 4.3: Wire AgentTrace into ResearchPanel

**Files:**

- Modify: `src/components/research/ResearchPanel.tsx` — add AgentTrace below EventLog when running

**Step 1: Import and render AgentTrace**

Add `AgentTrace` import and render it inside the `state.status === 'running'` block:

```typescript
import { AgentTrace } from './AgentTrace';

// Inside the running state block:
{state.status === 'running' && (
  <div className="space-y-4">
    <VendorProgress events={state.events} />
    <AgentTrace steps={agentSteps} />
    <EventLog events={state.events} />
  </div>
)}
```

The `agentSteps` are derived from SSE events that have `type: 'agent_thought'` or `type: 'agent_action'`.

**Step 2: Commit**

```bash
git add src/components/research/ResearchPanel.tsx
git commit -m "feat: wire AgentTrace into ResearchPanel during research"
```

---

## Phase 5: Tests

**Goal:** Add tests for the agent loop, gap tracker, and planner.

### Task 5.1: Test gap tracker

**Files:**

- Create: `src/__tests__/unit/gap-tracker.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  computeGaps,
  allGapsSatisfied,
  getHighestPriorityGap,
} from "@/lib/research/agent/gap-tracker";
import type { Evidence, Requirement } from "@/lib/scoring/types";

const requirements: Requirement[] = [
  {
    id: "r1",
    name: "Tracing",
    description: "Framework-agnostic tracing",
    priority: "high",
  },
  {
    id: "r2",
    name: "Self-hosting",
    description: "Self-hosting option",
    priority: "medium",
  },
];

describe("computeGaps", () => {
  it("returns all unsatisfied when no evidence", () => {
    const gaps = computeGaps(requirements, []);
    expect(gaps).toHaveLength(2);
    expect(gaps.every((g) => !g.satisfied)).toBe(true);
  });

  it("marks gap as satisfied with moderate+ evidence", () => {
    const evidence: Evidence[] = [
      {
        id: "e1",
        vendorId: "v1",
        requirementId: "r1",
        claim: "test",
        snippet: "test",
        sourceUrl: "http://x",
        sourceType: "official",
        strength: "moderate",
        publishedAt: "2026-01-01",
        capturedAt: "2026-01-01",
      },
    ];
    const gaps = computeGaps(requirements, evidence);
    const r1Gap = gaps.find((g) => g.requirementId === "r1");
    expect(r1Gap?.satisfied).toBe(true);
  });
});

describe("getHighestPriorityGap", () => {
  it("returns high-priority gap first", () => {
    const gaps = computeGaps(requirements, []);
    const gap = getHighestPriorityGap(gaps, requirements);
    expect(gap?.requirementId).toBe("r1");
  });
});
```

**Step 2: Run tests**

```bash
npx vitest run src/__tests__/unit/gap-tracker.test.ts
```

**Step 3: Commit**

```bash
git add src/__tests__/unit/gap-tracker.test.ts
git commit -m "test: add unit tests for evidence gap tracker"
```

---

### Task 5.2: Test planner

**Files:**

- Create: `src/__tests__/unit/planner.test.ts`

**Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest";
import { planNextAction } from "@/lib/research/agent/planner";
import { computeGaps } from "@/lib/research/agent/gap-tracker";
import type { AgentContext } from "@/lib/research/agent/types";
import type { Requirement } from "@/lib/scoring/types";

const requirements: Requirement[] = [
  {
    id: "r1",
    name: "Tracing",
    description: "Framework-agnostic tracing",
    priority: "high",
  },
];

function makeContext(overrides?: Partial<AgentContext>): AgentContext {
  return {
    vendorId: "langfuse",
    vendorName: "Langfuse",
    requirements,
    steps: [],
    evidence: [],
    gaps: computeGaps(requirements, []),
    urlsFetched: new Set(),
    iteration: 0,
    maxIterations: 12,
    ...overrides,
  };
}

describe("planNextAction", () => {
  it("suggests search_web when no evidence exists", () => {
    const ctx = makeContext();
    const action = planNextAction(ctx);
    expect(action?.toolName).toBe("search_web");
    expect(action?.toolParams.query).toContain("Langfuse");
  });

  it("returns null when all gaps are satisfied", () => {
    const ctx = makeContext({
      gaps: [
        {
          requirementId: "r1",
          requirementName: "Tracing",
          evidenceCount: 2,
          bestStrength: "strong",
          sourceTypes: ["official"],
          satisfied: true,
        },
      ],
    });
    const action = planNextAction(ctx);
    expect(action).toBeNull();
  });
});
```

**Step 2: Run tests**

```bash
npx vitest run src/__tests__/unit/planner.test.ts
```

**Step 3: Commit**

```bash
git add src/__tests__/unit/planner.test.ts
git commit -m "test: add unit tests for agent planner"
```

---

## Phase 6: Documentation & Deep Dive Prep

**Goal:** Update README and prepare talking points for the Zoom discussion.

### Task 6.1: Update README with agentic architecture section

**Files:**

- Modify: `README.md` — add "Agentic Research Architecture" section

Add a section explaining:

- The ReAct loop pattern (think → act → observe)
- Tool interface design (search_web, fetch_page, analyze_content, search_github)
- Evidence gap tracking as the stopping criteria
- How mock mode simulates the full agent loop without LLM calls
- What changes for production (swap planner from rule-based to LLM, add real search API)

**Step 1: Add section to README**

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add agentic research architecture section to README"
```

---

## Out of Scope

- **Real LLM calls** — the planner uses rule-based logic, not actual LLM reasoning. The architecture supports swapping in an LLM for the planning step.
- **Parallel vendor agents** — vendors are still researched sequentially for simplicity. The agent interface supports concurrent execution.
- **Persistent agent memory** — agent context is ephemeral per session. Production would persist across sessions.
- **Tool auth** — GitHub API calls are unauthenticated (rate limited). Production would use tokens.

---

## Execution Summary

| Phase                        | Tasks        | Estimated Complexity |
| ---------------------------- | ------------ | -------------------- |
| 1. Tool Interface & Registry | 5 tasks      | Core infrastructure  |
| 2. Agent Loop (ReAct)        | 3 tasks      | Core logic           |
| 3. Wire into Orchestrator    | 1 task       | Integration          |
| 4. UI Agent Trace            | 3 tasks      | Frontend             |
| 5. Tests                     | 2 tasks      | Quality              |
| 6. Documentation             | 1 task       | Polish               |
| **Total**                    | **15 tasks** |                      |
