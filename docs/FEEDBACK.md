# SignalCore — Feedback Response

## The Feedback

> "I expected a more agentic approach (e.g. an agent loop with search / fetch tools) rather than a strict fixed workflow."

---

## What We Built

### Current Architecture: Pipeline-Based Research

Our system follows a **fixed, sequential pipeline** pattern:

```
User clicks "Run Research"
  → POST /api/research/start
    → For each vendor (sequential):
        → Fetch 4-5 pre-configured URLs (parallel, max 3)
        → For each fetched page × each requirement:
            → Extract evidence (mock or LLM)
        → Deduplicate evidence per vendor-requirement pair
    → Stream events via SSE
    → Return aggregated evidence
```

**Key characteristics:**

1. **Hardcoded sources** — 18 URLs defined in `sources.ts`, manually curated per vendor. The system never discovers new URLs on its own.
2. **Fixed execution plan** — Every research run follows the exact same path: fetch these URLs, analyze against these requirements, done. No branching, no decisions.
3. **No reasoning loop** — The orchestrator doesn't evaluate whether it has enough evidence, whether sources are relevant, or whether it should dig deeper.
4. **One-shot analysis** — Each page is analyzed once per requirement. If the evidence is weak or missing, the system doesn't try alternative sources.
5. **Simulated LLM** — In default mode, evidence extraction uses pre-generated mock responses (`mock-responses.ts`), so the "analysis" is deterministic lookup.

### What Works Well

- **Real HTTP fetching** — actual vendor docs and GitHub APIs are hit
- **SSE streaming** — real-time progress feedback to the UI
- **Structured evidence model** — proper types for evidence, scoring, confidence
- **Scoring engine** — deterministic, weighted scoring with source type, recency, and strength factors
- **Full UI** — comparison matrix, evidence drawer, radar charts, priority sliders, walkthrough
- **115 tests** — unit, AI prompt regression, and e2e coverage

---

## Why The Feedback Makes Sense

The reviewer expected an **agent** — a system that reasons, decides, and acts autonomously. What we delivered is closer to a **script** — a system that executes a predetermined sequence of steps.

| Aspect                | Our Pipeline                      | An Agentic System                                                                      |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| **Source discovery**  | Hardcoded URL list                | Agent searches for relevant sources dynamically                                        |
| **Execution plan**    | Fixed: fetch → parse → analyze    | Agent decides what to do next based on what it's learned                               |
| **Sufficiency check** | None — runs all sources once      | Agent evaluates: "Do I have enough evidence? Is it strong enough?"                     |
| **Adaptability**      | Same path every time              | Agent adjusts strategy: tries different search queries, follows links, explores deeper |
| **Tool use**          | Single tool (HTTP fetch)          | Multiple tools: web search, fetch, read docs, query APIs                               |
| **Reasoning**         | None — orchestrator is procedural | Agent reasons about findings and decides next actions                                  |
| **Error recovery**    | Skip failed sources               | Agent tries alternative approaches when a source fails                                 |

---

## Agentic Alternatives

### Option A: Agent Loop with Tool Use (ReAct Pattern)

The classic agentic pattern — a reasoning loop where the LLM decides what tool to use next.

```
while not done:
    observation = look at what I know so far
    thought = reason about what's missing
    action = pick a tool (search, fetch, analyze)
    result = execute the tool
    update state with result
    if sufficient_evidence(): done = True
```

**Tools the agent would have:**

- `web_search(query)` — search the web for vendor information
- `fetch_page(url)` — fetch and parse a specific URL
- `extract_evidence(text, requirement)` — analyze text for evidence
- `evaluate_coverage(vendor, requirement)` — check if we have enough evidence
- `follow_links(page)` — discover and follow relevant links from a page

**How it works for a vendor evaluation:**

1. Agent receives: "Evaluate LangSmith for the requirement: Tracing & Observability"
2. Agent thinks: "I should search for LangSmith's tracing capabilities"
3. Agent calls `web_search("LangSmith tracing observability features")`
4. Agent gets results, picks the most relevant URL
5. Agent calls `fetch_page(url)` and `extract_evidence(text, requirement)`
6. Agent evaluates: "I found moderate evidence from docs. Let me check GitHub for implementation details."
7. Agent calls `web_search("LangSmith SDK tracing GitHub")`
8. Continues until it has strong evidence or exhausts options

**Pros:**

- Genuinely adaptive — finds sources we didn't predict
- Handles new vendors without code changes
- Can go deep on specific requirements where evidence is thin
- Demonstrates real AI reasoning

**Cons:**

- Requires real LLM calls (cost, latency)
- Non-deterministic — different runs may produce different results
- Harder to test and debug
- Can get stuck in loops or go off-track

**Implementation complexity:** Medium-high. Requires an LLM-driven loop, tool definitions, state management, and guardrails (max iterations, budget limits).

### Option B: DAG-Based Agent with Planning

A more structured agentic approach where the LLM creates an execution plan first, then executes it.

```
Plan phase:
    LLM receives vendors + requirements
    LLM outputs a research plan (DAG of tasks)

Execute phase:
    For each task in topological order:
        Execute task (search, fetch, analyze)
        If results insufficient:
            LLM generates follow-up tasks
            Add to DAG

Synthesize phase:
    LLM reviews all evidence
    Produces final assessment
```

**Pros:**

- More predictable than pure ReAct
- Can parallelize independent tasks in the DAG
- Plan is inspectable and debuggable
- Balances autonomy with structure

**Cons:**

- Still requires LLM calls
- Planning step adds latency
- Re-planning on insufficient results adds complexity

**Implementation complexity:** High. Requires plan generation, DAG execution, re-planning logic.

### Option C: Hybrid — Fixed Pipeline + Agentic Gap-Filling

Keep our current pipeline as the "fast path" but add an agentic layer that activates when evidence is insufficient.

```
Phase 1 (current pipeline):
    Fetch pre-configured sources
    Extract evidence (mock or LLM)
    Score coverage per vendor-requirement

Phase 2 (agentic gap-fill):
    For each vendor-requirement pair with low confidence:
        Agent searches for additional sources
        Agent fetches and analyzes new pages
        Agent updates evidence and re-scores
```

**Pros:**

- Builds on what we already have
- Fast for the common case (pre-configured sources usually sufficient)
- Agentic behavior only kicks in where needed — cost-efficient
- Easier to implement incrementally
- Deterministic base + adaptive supplement

**Cons:**

- Still partially hardcoded
- Two-phase approach is a compromise — less "purely agentic"
- Gap-fill phase still needs LLM calls

**Implementation complexity:** Medium. We already have the pipeline; need to add a coverage evaluator and a search/fetch loop.

### Option D: Tool-Use Agent via Vercel AI SDK

Use Vercel AI SDK's `generateText` with tool definitions to create a proper tool-calling agent.

```typescript
const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    webSearch: tool({ description: '...', parameters: z.object({...}), execute: async (params) => {...} }),
    fetchPage: tool({ description: '...', parameters: z.object({...}), execute: async (params) => {...} }),
    extractEvidence: tool({ description: '...', parameters: z.object({...}), execute: async (params) => {...} }),
    reportFindings: tool({ description: '...', parameters: z.object({...}), execute: async (params) => {...} }),
  },
  maxSteps: 20,
  system: 'You are a research agent evaluating vendor tools...',
  prompt: `Evaluate ${vendor.name} for: ${requirement.description}`,
});
```

**Pros:**

- Clean, framework-supported agent pattern
- Automatic tool-calling loop with `maxSteps`
- Streaming support built-in
- Closest to what the reviewer likely expected
- Framework handles the loop, retries, and tool dispatch

**Cons:**

- Requires Vercel AI SDK dependency
- Real LLM API calls required
- Need to handle streaming of intermediate tool calls to UI

**Implementation complexity:** Medium. Vercel AI SDK handles the agent loop; we define tools and the system prompt.

---

## Recommendation

**Option C (Hybrid)** is the most pragmatic path if we want to preserve existing work while adding genuine agentic behavior. It shows we understand both approaches and chose a practical balance.

**Option D (Vercel AI SDK tool-use)** is the cleanest "agentic" answer if we're willing to restructure the research layer. It's what most reviewers picture when they say "agent loop with search/fetch tools."

For a deep-dive discussion, I'd suggest presenting **Option D as the target architecture** with **Option C as the migration path** — showing that the fixed pipeline was a deliberate Phase 1 choice to get a working prototype, and the agentic layer was planned as the natural evolution.

---

## What to Emphasize in the Deep Dive

1. **The pipeline was a deliberate simplification**, not a design oversight. Real HTTP fetching + structured evidence extraction was the foundation; the agent loop was the planned next layer.

2. **The infrastructure supports an agentic upgrade.** Our SSE streaming, event system, session management, and evidence model all transfer directly to an agent-based architecture. The orchestrator is the only component that changes fundamentally.

3. **The scoring engine is agent-agnostic.** Whether evidence comes from a fixed pipeline or an autonomous agent, the scoring, confidence calculation, and UI rendering work identically.

4. **Mock mode was for development velocity**, not a permanent choice. The `RESEARCH_MODE` config already supports swapping to live LLM analysis — the same switch point where an agent loop would plug in.

5. **Concrete next step:** Replace `orchestrator.ts` with a tool-calling agent (Option D). The tools (`fetchPage`, `parseHtml`, `analyzeEvidence`) already exist as standalone functions — they just need to be wrapped as agent tools instead of called in a fixed sequence.

---

## Deep Dive Q&A

### Q1: How do we give tools to the agent and code it?

"Tools" are just **functions you define in your code** that the LLM can call by name. You describe each tool (name, description, parameters) and the LLM decides which one to call based on its reasoning.

Here's how it works with the **Vercel AI SDK** (the cleanest approach for Next.js):

```typescript
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic"; // or openai
import { z } from "zod";

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  maxSteps: 15, // max tool-call iterations before stopping
  system:
    "You are a research agent evaluating vendor tools for LLM observability...",
  prompt: `Evaluate LangSmith for: Tracing & Observability`,
  tools: {
    // Each "tool" is just a function with a schema
    web_search: tool({
      description: "Search the web for vendor information",
      parameters: z.object({
        query: z.string().describe("Search query"),
      }),
      execute: async ({ query }) => {
        // Call Brave Search API, Serper, or Tavily
        const results = await fetch(`https://api.search.com?q=${query}`);
        return results.json();
      },
    }),

    fetch_page: tool({
      description: "Fetch and parse a specific URL",
      parameters: z.object({
        url: z.string().url(),
      }),
      execute: async ({ url }) => {
        // We ALREADY have this — it's our fetcher.ts + parser.ts
        const page = await fetchPage({
          url,
          sourceType: "official",
          vendorId: "",
        });
        return { title: page.title, text: page.text };
      },
    }),

    extract_evidence: tool({
      description: "Analyze text and extract evidence for a requirement",
      parameters: z.object({
        text: z.string(),
        requirement: z.string(),
      }),
      execute: async ({ text, requirement }) => {
        // This is where the LLM actually reads the text
        // Could be a second LLM call, or the agent does it inline
        return { evidence: "..." };
      },
    }),

    report_findings: tool({
      description: "Submit final evidence when research is complete",
      parameters: z.object({
        evidence: z.array(
          z.object({
            claim: z.string(),
            snippet: z.string(),
            strength: z.enum(["strong", "moderate", "weak"]),
            sourceUrl: z.string(),
          }),
        ),
      }),
      execute: async ({ evidence }) => {
        return { status: "complete", count: evidence.length };
      },
    }),
  },
});
```

**What happens under the hood:**

1. The SDK sends your prompt + tool descriptions to the LLM
2. The LLM responds with "I want to call `web_search` with query X"
3. The SDK runs your `execute` function and sends the result back to the LLM
4. The LLM sees the result, thinks, and calls another tool (or finishes)
5. This loops up to `maxSteps` times

You don't code the loop — **the SDK handles it**.

### Q2: How do we test the agent's tool calls?

Three layers:

**Unit test each tool in isolation** (what we already do):

```typescript
// Test fetch_page independently
test("fetch_page returns parsed content", async () => {
  const page = await fetchPage({ url: "https://docs.langchain.com/..." });
  expect(page.status).toBe("success");
  expect(page.text.length).toBeGreaterThan(0);
});
```

**Mock the LLM to test the loop deterministically:**

```typescript
// Use Vercel AI SDK's mock provider
import { simulateReadableStream, MockLanguageModelV1 } from "ai/test";

test("agent calls web_search then fetch_page", async () => {
  const mockModel = new MockLanguageModelV1({
    doGenerate: async () => ({
      // Simulate the LLM choosing to call web_search first
      toolCalls: [
        { toolName: "web_search", args: { query: "LangSmith tracing" } },
      ],
    }),
  });

  const result = await generateText({
    model: mockModel,
    tools: {
      /* your tools */
    },
    maxSteps: 3,
  });

  // Assert the tools were called in expected order
  expect(result.steps.map((s) => s.toolCalls[0]?.toolName)).toEqual([
    "web_search",
    "fetch_page",
    "report_findings",
  ]);
});
```

**Record and replay for regression tests:**

- Log every tool call + LLM response during a real run
- Replay the same sequence in tests to catch regressions
- This is what our `ai/` test suite already does for prompt quality

### Q3: How do we prevent loops and the agent going off-track?

Multiple guardrails:

| Guardrail                  | How                                                        |
| -------------------------- | ---------------------------------------------------------- |
| **`maxSteps`**             | Hard cap on iterations (e.g., 15). SDK stops automatically |
| **Token budget**           | Track total tokens used, stop if over budget               |
| **System prompt rules**    | "You MUST call report_findings within 10 steps"            |
| **Tool validation**        | Reject duplicate searches (same query twice)               |
| **Timeout**                | Abort after N seconds total wall time                      |
| **Allowed tools per step** | Restrict which tools are available at each stage           |

Example system prompt guardrails:

```
Rules:
- You have a maximum of 10 tool calls. Use them wisely.
- Never search for the same query twice.
- After 3 fetch_page calls, you MUST evaluate what you have.
- Always call report_findings as your final action.
- Focus ONLY on the given requirement. Do not research unrelated topics.
```

The Vercel AI SDK also supports an `onStepFinish` callback where you can programmatically abort:

```typescript
let toolCallCount = 0;
const result = await generateText({
  maxSteps: 15,
  onStepFinish: ({ toolCalls }) => {
    toolCallCount += toolCalls.length;
    if (toolCallCount > 10) throw new Error("Budget exceeded");
  },
});
```

### Q4: What does ReAct mean?

**ReAct = Reasoning + Acting**

It's a pattern from a [2022 paper by Yao et al.](https://arxiv.org/abs/2210.03629). The idea:

```
Traditional LLM:  Question → Answer (one shot, no tools)
ReAct LLM:        Question → Think → Act → Observe → Think → Act → ... → Answer
```

The LLM alternates between:

- **Reasoning** ("I need to find pricing info, let me search for it")
- **Acting** (calls `web_search("LangSmith pricing")`)
- **Observing** (reads the result)
- **Reasoning again** ("OK I found pricing, but I still need GitHub stars")

It's just a fancy name for "LLM in a loop with tools." Every major agent framework (LangChain, Vercel AI SDK, CrewAI) implements this pattern.

### Q5: Which model should we choose?

For a **research agent** that needs to reason about evidence quality:

| Model               | Cost (input/output per 1M tokens) | Quality             | Speed     | Best for                 |
| ------------------- | --------------------------------- | ------------------- | --------- | ------------------------ |
| **Claude Sonnet 4** | $3 / $15                          | Excellent reasoning | Fast      | Best balance for agents  |
| **GPT-4o**          | $2.50 / $10                       | Good reasoning      | Fast      | Good alternative         |
| **GPT-4o-mini**     | $0.15 / $0.60                     | Decent              | Very fast | Simple tool routing only |
| **Claude Haiku**    | $0.80 / $4                        | Good                | Very fast | Simple extraction tasks  |

**Recommendation:** **Claude Sonnet 4** or **GPT-4o** for the agent brain (reasoning + tool selection). Either works — the Vercel AI SDK lets you swap models with one line:

```typescript
// Swap by changing one import
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic("claude-sonnet-4-20250514");

// OR
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o");
```

Don't use mini/haiku for the main agent loop — they make worse tool-calling decisions. Use them for sub-tasks like "extract evidence from this text" where the reasoning is simpler.

### Q6: What AWS services would we use? Or which other options do we have?

**AWS Option:**

| Component        | AWS Service                | Purpose                        |
| ---------------- | -------------------------- | ------------------------------ |
| Frontend hosting | CloudFront + S3            | CDN + static assets            |
| API              | Lambda + API Gateway       | Serverless functions           |
| Job queue        | SQS or Step Functions      | Distribute agent jobs          |
| Sessions/cache   | ElastiCache (Redis)        | Real-time state                |
| Database         | RDS (Postgres) or DynamoDB | Evidence storage               |
| File cache       | S3                         | Cached web pages               |
| Vector search    | OpenSearch or Bedrock KB   | Semantic evidence search       |
| LLM              | Bedrock (Claude)           | No API key needed, pay-per-use |

**Simpler alternatives (better for this project):**

| Component      | Service                               | Why                                         |
| -------------- | ------------------------------------- | ------------------------------------------- |
| Everything     | **Vercel**                            | Next.js-native, zero config, edge functions |
| Job queue      | **Inngest** or **Trigger.dev**        | Serverless job queues designed for Next.js  |
| Database       | **Supabase** (Postgres)               | Free tier, instant setup, built-in auth     |
| Cache/sessions | **Upstash Redis**                     | Serverless Redis, pay-per-request           |
| Vector DB      | **Pinecone** or **Supabase pgvector** | Semantic search for evidence                |
| LLM            | **Direct API** (Anthropic/OpenAI)     | Simple API keys, no infra                   |

**For a demo/assignment:** Vercel + Upstash Redis + Supabase is the fastest path. No AWS needed.

**For production at scale:** AWS (or GCP/Azure) makes sense when you need fine-grained control over compute, networking, and costs.

### Q7: What does SSE streaming mean?

**SSE = Server-Sent Events**

It's a simple protocol where the server **pushes** updates to the browser over a single HTTP connection. Unlike WebSockets (bidirectional), SSE is **one-way: server → client**.

```
Normal HTTP:    Client asks → Server responds → Connection closes
SSE:            Client opens → Server sends event → sends another → ... → closes
```

How we use it in SignalCore:

```
Browser                          Server
  |                                |
  |--- GET /api/research/status -->|
  |                                |  (connection stays open)
  |<-- data: {job_started} --------|
  |<-- data: {source_fetched} -----|
  |<-- data: {source_fetched} -----|
  |<-- data: {analysis_complete} --|
  |<-- : heartbeat ----------------|  (keeps connection alive)
  |<-- data: {job_complete} -------|
  |<-- data: {session_complete} ---|
  |                                |  (connection closes)
```

**In the browser**, you consume it with `EventSource`:

```typescript
const source = new EventSource(`/api/research/status?sessionId=${id}`);
source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI progressively
  if (data.type === "source_fetched") updateProgress(data);
  if (data.type === "session_complete") source.close();
};
```

**On the server**, you write to a stream:

```typescript
// Our current implementation in /api/research/status/route.ts
const stream = new ReadableStream({
  start(controller) {
    const interval = setInterval(() => {
      const newEvents = getNewEvents(sessionId);
      for (const event of newEvents) {
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
      }
    }, 500); // poll every 500ms
  },
});
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" },
});
```

**Why SSE over WebSockets?** Simpler, works with serverless (Vercel/Lambda), auto-reconnects, and we only need server→client direction. WebSockets are overkill here.

---

## Production Deployment Architecture

### Where Does Each Piece Live?

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL                                         │
│                                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────────────────────┐    │
│  │   Next.js Frontend  │    │   API Routes (Serverless Functions)      │    │
│  │                     │    │                                          │    │
│  │  - Dashboard        │    │  POST /api/research/start                │    │
│  │  - Comparison Matrix│───▶│    → Validates request                   │    │
│  │  - Evidence Drawer  │    │    → Enqueues job to Inngest             │    │
│  │  - Research Panel   │    │    → Returns sessionId                   │    │
│  │  - Chat Panel (RAG) │    │                                          │    │
│  │  - Charts + Sliders │    │  GET /api/research/status (SSE)          │    │
│  │                     │    │    → Reads events from Redis Pub/Sub     │    │
│  │  React 19 + RSC     │    │    → Streams to browser                  │    │
│  │  Tailwind v4        │    │                                          │    │
│  │                     │    │  GET /api/research/results               │    │
│  │                     │    │    → Reads from Postgres                 │    │
│  │                     │    │                                          │    │
│  │                     │    │  POST /api/chat (RAG)                    │    │
│  │                     │    │    → Calls Haiku with context            │    │
│  └─────────────────────┘    └──────────────────────────────────────────┘    │
│           CDN                        Serverless (10s timeout)               │
└──────────────────────────────────────────────────────────────────────────────┘
          │                                     │
          │                                     │ enqueue job
          │                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            INNGEST (Job Orchestration)                       │
│                                                                             │
│  Receives: { sessionId, vendors[], requirements[] }                         │
│                                                                             │
│  Runs the Research Agent function (up to 5 min per job)                     │
│  Handles retries, timeouts, fan-out to parallel vendor jobs                 │
│  Publishes progress events to Redis                                         │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    RESEARCH AGENT (Sonnet 4)                       │     │
│  │                                                                    │     │
│  │  Vercel AI SDK generateText() with tools + maxSteps: 15            │     │
│  │                                                                    │     │
│  │  The agent IS the Inngest function. Tools are inline functions:    │     │
│  │                                                                    │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐          │     │
│  │  │ web_search() │  │ fetch_page()│  │ extract_evidence()│          │     │
│  │  │             │  │             │  │                  │          │     │
│  │  │ Calls Brave │  │ HTTP fetch  │  │ Sends text to    │          │     │
│  │  │ Search API  │  │ + parse HTML│  │ Haiku for cheap  │          │     │
│  │  │ (external)  │  │ (in-process)│  │ extraction       │          │     │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘          │     │
│  │                                                                    │     │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐        │     │
│  │  │ follow_links()│  │query_github() │  │report_findings() │        │     │
│  │  │              │  │               │  │                 │        │     │
│  │  │ Parse <a>    │  │ GitHub API    │  │ Write evidence  │        │     │
│  │  │ from fetched │  │ stars, issues │  │ to Postgres     │        │     │
│  │  │ pages        │  │ releases      │  │ + publish event │        │     │
│  │  └──────────────┘  └───────────────┘  └─────────────────┘        │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
          │                          │                    │
          │ LLM calls                │ progress events    │ store results
          ▼                          ▼                    ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
│  Anthropic API   │   │  Upstash Redis   │   │    Supabase (Postgres)   │
│                  │   │                  │   │                          │
│  Sonnet 4:       │   │  - Session state │   │  - evidence table        │
│    Agent brain   │   │  - Pub/Sub for   │   │  - scores table          │
│    (reasoning +  │   │    SSE events    │   │  - research_sessions     │
│     tool calls)  │   │  - Page cache    │   │  - vendors, requirements │
│                  │   │    (TTL: 1 hour) │   │                          │
│  Haiku:          │   │                  │   │  pgvector extension:     │
│    Evidence      │   │                  │   │  - evidence embeddings   │
│    extraction    │   │                  │   │    for RAG retrieval     │
│    (cheap, fast) │   │                  │   │                          │
│                  │   │                  │   │                          │
│  RAG chat:       │   │                  │   │                          │
│    Haiku with    │   │                  │   │                          │
│    retrieved     │   │                  │   │                          │
│    context       │   │                  │   │                          │
└──────────────────┘   └──────────────────┘   └──────────────────────────┘
```

### Component Breakdown

#### Frontend → Vercel (Edge CDN)

The Next.js app deploys to Vercel as-is. No changes needed from current setup.

- **Static pages** served from CDN
- **RSC (React Server Components)** for initial data loads
- **Client components** for interactivity (matrix, sliders, chat)
- **SSE connection** to stream agent progress in real-time

#### API Routes → Vercel Serverless Functions

Thin API layer that validates requests and delegates to the agent:

- `POST /api/research/start` — enqueues a job to Inngest, returns `sessionId`
- `GET /api/research/status` — subscribes to Redis Pub/Sub, streams events via SSE
- `GET /api/research/results` — queries Postgres for completed evidence
- `POST /api/chat` — RAG endpoint (see below)

These are **short-lived** (10s Vercel timeout) — they don't run the agent themselves.

#### Agent → Inngest Functions (Long-Running)

This is the key architectural decision. The agent **cannot run in a Vercel serverless function** because:

- Vercel functions timeout at 10s (free) or 60s (pro)
- A research agent needs 1-5 minutes per vendor
- Agent loops require persistent execution

**Inngest** solves this:

```typescript
// src/inngest/research-agent.ts
import { inngest } from "./client";
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const researchAgent = inngest.createFunction(
  { id: "research-agent", retries: 2 },
  { event: "research/start" },
  async ({ event, step }) => {
    const { sessionId, vendor, requirements } = event.data;

    // Each vendor runs as a separate step (retryable)
    const evidence = await step.run(`research-${vendor.id}`, async () => {
      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        maxSteps: 15,
        system: `You are researching ${vendor.name}...`,
        prompt: `Evaluate for: ${requirements.map((r) => r.name).join(", ")}`,
        tools: {
          web_search: tool({
            /* ... */
          }),
          fetch_page: tool({
            /* ... */
          }),
          extract_evidence: tool({
            // Uses Haiku for cheap extraction
            execute: async ({ text, requirement }) => {
              const extraction = await generateText({
                model: anthropic("claude-haiku-4-5-20251001"),
                prompt: `Extract evidence from: ${text}`,
              });
              return extraction;
            },
          }),
          report_findings: tool({
            /* writes to Postgres */
          }),
        },
        onStepFinish: async ({ toolResults }) => {
          // Publish progress to Redis for SSE
          await redis.publish(
            `session:${sessionId}`,
            JSON.stringify({
              type: "agent_step",
              vendorId: vendor.id,
              toolResults,
            }),
          );
        },
      });

      return result;
    });

    return evidence;
  },
);
```

**Why Inngest instead of AWS Lambda?**

| Feature           | Inngest                               | AWS Lambda                         |
| ----------------- | ------------------------------------- | ---------------------------------- |
| Setup             | `npm install inngest`, zero infra     | VPC, IAM roles, API Gateway config |
| Max duration      | 5 min (free), unlimited (pro)         | 15 min                             |
| Retries           | Built-in with backoff                 | Manual SQS + DLQ setup             |
| Fan-out           | `step.run()` for parallel vendor jobs | Step Functions needed              |
| Works with Vercel | Native integration                    | Need API Gateway bridge            |
| Observability     | Dashboard built-in                    | CloudWatch setup                   |

**Alternative: Trigger.dev** — similar to Inngest, also works. Both are "serverless job runners for Next.js."

**If you must use AWS:** Put the agent in a Lambda (15 min timeout) triggered by SQS. Use Step Functions to fan out parallel vendor jobs. More infra to manage but same architecture.

#### Tools → In-Process (Not Lambdas)

Tools are **NOT separate services or Lambdas**. They're regular async functions that run inside the agent's process:

```typescript
// Tools are just functions — they run where the agent runs
const tools = {
  web_search: tool({
    execute: async ({ query }) => {
      // This is a fetch() call, not a Lambda invocation
      const res = await fetch(`https://api.brave.com/search?q=${query}`, {
        headers: { "X-API-Key": process.env.BRAVE_API_KEY },
      });
      return res.json();
    },
  }),

  fetch_page: tool({
    execute: async ({ url }) => {
      // Reuses our existing fetcher.ts — same process
      return fetchPage({ url, sourceType: "official", vendorId: "" });
    },
  }),

  extract_evidence: tool({
    execute: async ({ text, requirement }) => {
      // Makes an API call to Anthropic (Haiku) — cheap + fast
      const result = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        prompt: `Extract evidence for "${requirement}" from:\n${text}`,
      });
      return JSON.parse(result.text);
    },
  }),
};
```

Why not Lambdas for tools?

- **Latency** — Lambda cold starts add 200-500ms per tool call. In a 15-step agent loop, that's 3-7s wasted.
- **Complexity** — Each Lambda needs its own deploy, IAM, logging.
- **No benefit** — Tools are just HTTP fetches and LLM calls. They don't need isolated compute.

The only reason to extract a tool to a Lambda: if it's CPU-intensive (e.g., PDF parsing, image analysis) and would block the agent process. Our tools are all I/O-bound, so in-process is correct.

#### Database → Supabase (Postgres + pgvector)

```sql
-- Evidence stored by the agent's report_findings tool
CREATE TABLE evidence (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  snippet TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,  -- 'official' | 'github' | 'blog' | 'community'
  strength TEXT NOT NULL,     -- 'strong' | 'moderate' | 'weak'
  published_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  embedding VECTOR(1536)      -- For RAG semantic search
);

-- Sessions for tracking research runs
CREATE TABLE research_sessions (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  config JSONB  -- vendors, requirements, agent settings
);
```

#### Cache → Upstash Redis

- **Session state** — replaces our in-memory Map
- **Pub/Sub** — agent publishes events, SSE endpoint subscribes
- **Page cache** — avoid re-fetching same vendor docs (TTL: 1 hour)
- **Dedup** — track which URLs the agent has already visited per session

### RAG Chatbot Architecture

For the chat panel ("Ask questions about the research"):

```
User asks: "Which vendor has the best pricing for small teams?"
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              POST /api/chat (Vercel)                 │
│                                                     │
│  1. Embed the question (Haiku or text-embedding)    │
│  2. Query pgvector for relevant evidence chunks     │
│  3. Build context from top-K results                │
│  4. Call Haiku with context + question              │
│  5. Stream response back via SSE                    │
└─────────────────────────────────────────────────────┘
```

```typescript
// src/app/api/chat/route.ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();

  // 1. Get relevant evidence via semantic search
  const { data: evidence } = await supabase.rpc("match_evidence", {
    query_embedding: await embed(message), // embed the question
    match_count: 10,
    session_id: sessionId,
  });

  // 2. Build context string from retrieved evidence
  const context = evidence
    .map(
      (e) =>
        `[${e.vendor_id}] ${e.claim} (source: ${e.source_url}, strength: ${e.strength})\n"${e.snippet}"`,
    )
    .join("\n\n");

  // 3. Stream answer using Haiku (cheap + fast for chat)
  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are a research assistant. Answer based ONLY on the evidence provided.
If the evidence doesn't cover the question, say so. Always cite sources.`,
    prompt: `Evidence:\n${context}\n\nQuestion: ${message}`,
  });

  return result.toDataStreamResponse();
}
```

**Why Haiku for RAG chat?**

- Chat needs to be **fast** (streaming, conversational)
- The hard work (evidence gathering) was already done by Sonnet
- Haiku just needs to **read and summarize** retrieved evidence — simple task
- Cost: ~$0.001 per chat message vs ~$0.02 with Sonnet

**Why not just keyword search?**

- User asks "Which vendor is cheapest?" — keyword search misses evidence about "pricing", "free tier", "cost per trace"
- pgvector semantic search finds conceptually related evidence regardless of exact wording
- Supabase includes pgvector free — no extra service needed

### Two-Model Strategy Summary

```
┌─────────────────────────────────────────────────┐
│              Sonnet 4 ($3/$15 per 1M)            │
│                                                  │
│  Used for: Agent brain                           │
│  - Decides which tool to call                    │
│  - Reasons about evidence sufficiency            │
│  - Plans research strategy                       │
│  - Runs 1x per vendor research job               │
│  - ~15 steps × ~2K tokens = ~30K tokens/vendor   │
│  - Cost: ~$0.10 per vendor evaluation            │
│                                                  │
│  Total per full research run (4 vendors):        │
│  ~$0.40                                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│           Haiku ($0.80/$4 per 1M)                │
│                                                  │
│  Used for:                                       │
│  1. Evidence extraction (tool inside agent)      │
│     - Reads fetched page text                    │
│     - Extracts structured evidence               │
│     - Called ~5x per vendor = ~20x total          │
│     - Cost: ~$0.02 per research run              │
│                                                  │
│  2. RAG chat responses                           │
│     - Reads retrieved evidence context           │
│     - Generates conversational answers           │
│     - Cost: ~$0.001 per message                  │
└─────────────────────────────────────────────────┘

Total cost per research run: ~$0.42
Total cost per chat message: ~$0.001
```

### Cost Comparison: Full Research Run

| Component                   | Service          | Cost per run                 |
| --------------------------- | ---------------- | ---------------------------- |
| Agent reasoning (Sonnet 4)  | Anthropic API    | ~$0.40                       |
| Evidence extraction (Haiku) | Anthropic API    | ~$0.02                       |
| Web search (Brave)          | Brave Search API | ~$0.01 (5 queries)           |
| Redis operations            | Upstash          | ~$0.001                      |
| Database writes             | Supabase         | Free tier                    |
| Inngest execution           | Inngest          | Free tier (up to 5K runs/mo) |
| **Total**                   |                  | **~$0.43 per run**           |

---

## Full AWS Architecture

If we deploy everything on AWS instead of Vercel/Inngest/Supabase, here's how it maps:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │                    CloudFront (CDN)                                 │      │
│  │  Static assets from S3 + API requests to ALB                       │      │
│  │  Edge caching, HTTPS termination, WAF protection                   │      │
│  └───────────────┬──────────────────────┬─────────────────────────────┘      │
│                  │ static               │ /api/*                             │
│                  ▼                      ▼                                    │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐         │
│  │    S3 Bucket          │  │    ALB (Application Load Balancer)   │         │
│  │  Next.js static       │  │  Routes to ECS, health checks,      │         │
│  │  export or SSR        │  │  WebSocket/SSE support               │         │
│  └──────────────────────┘  └───────────────┬──────────────────────┘         │
│                                             │                                │
│                                             ▼                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                ECS Fargate — API + SSR (auto-scaled)                  │   │
│  │                                                                      │   │
│  │  Next.js server running on containers                                │   │
│  │                                                                      │   │
│  │  POST /research/start  →  Sends message to SQS, returns sessionId   │   │
│  │  GET  /research/status →  Subscribes to ElastiCache Pub/Sub, SSE    │   │
│  │  GET  /research/results → Reads from RDS Postgres                   │   │
│  │  POST /chat (RAG)      →  Queries OpenSearch, streams via Bedrock   │   │
│  │                                                                      │   │
│  │  (Fargate, NOT Lambda — SSE needs persistent connections)            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│           │                                                                  │
│           │ SQS message: { sessionId, vendors[], requirements[] }            │
│           ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    SQS (Job Queue)                                    │   │
│  │                                                                      │   │
│  │  research-jobs queue                                                 │   │
│  │  - Visibility timeout: 10 min                                        │   │
│  │  - DLQ after 3 failures                                              │   │
│  │  - Optional: one message per vendor for parallel processing          │   │
│  └────────────────────────────┬─────────────────────────────────────────┘   │
│                               │                                              │
│                               ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              ECS Fargate — Agent Workers (auto-scaled 1-10)           │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │            Research Agent (Sonnet 4 via Bedrock)              │    │   │
│  │  │                                                              │    │   │
│  │  │  Vercel AI SDK generateText() + tools + maxSteps: 15         │    │   │
│  │  │                                                              │    │   │
│  │  │  Tools (all in-process, NOT separate Lambdas):               │    │   │
│  │  │                                                              │    │   │
│  │  │  web_search()        → Brave Search API                      │    │   │
│  │  │  fetch_page()        → HTTP fetch + parse (our fetcher.ts)   │    │   │
│  │  │  extract_evidence()  → Bedrock Haiku (cheap, fast)           │    │   │
│  │  │  follow_links()      → Parse <a> tags from fetched pages     │    │   │
│  │  │  query_github()      → GitHub API (stars, issues, releases)  │    │   │
│  │  │  report_findings()   → Write to RDS + publish to Redis       │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│           │                │                    │                             │
│           ▼                ▼                    ▼                             │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────────────────────┐       │
│  │ Bedrock (LLM)  │ │ ElastiCache  │ │    RDS Postgres              │       │
│  │                │ │ (Redis)      │ │                              │       │
│  │ Sonnet 4:      │ │              │ │  evidence, scores,           │       │
│  │  Agent brain   │ │ Session state│ │  research_sessions tables    │       │
│  │                │ │ Pub/Sub for  │ │                              │       │
│  │ Haiku:         │ │  SSE events  │ │  pgvector extension for      │       │
│  │  Extraction    │ │ Page cache   │ │  RAG semantic search         │       │
│  │                │ │  (TTL: 1hr)  │ │                              │       │
│  │ Titan Embed:   │ │ URL dedup    │ │  OR use OpenSearch for       │       │
│  │  RAG vectors   │ │              │ │  vector search at scale      │       │
│  └────────────────┘ └──────────────┘ └──────────────────────────────┘       │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Supporting Services                                                 │   │
│  │                                                                      │   │
│  │  S3              CloudWatch            OpenSearch (optional)         │   │
│  │  Page cache      Logs + metrics        Vector search alternative    │   │
│  │  Export/backup   Agent step traces     to pgvector at scale         │   │
│  │                  Cost dashboards                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### AWS Service Mapping

| Component           | AWS Service                | Why this one                                           | Monthly cost estimate  |
| ------------------- | -------------------------- | ------------------------------------------------------ | ---------------------- |
| **CDN + HTTPS**     | CloudFront                 | Edge caching, WAF, global                              | ~$1-5                  |
| **Static hosting**  | S3                         | Cheap, durable, pairs with CloudFront                  | ~$0.50                 |
| **API + SSR**       | ECS Fargate                | Long-lived SSE connections (Lambda can't), auto-scales | ~$15-30                |
| **Job queue**       | SQS                        | Simple, cheap, DLQ for failed jobs                     | ~$0.01                 |
| **Agent workers**   | ECS Fargate                | 5+ min execution, scales with queue depth              | ~$20-50                |
| **Database**        | RDS Postgres               | pgvector support, managed backups                      | ~$15 (db.t4g.micro)    |
| **Cache + Pub/Sub** | ElastiCache Redis          | Session state, SSE events, page cache                  | ~$13 (cache.t4g.micro) |
| **LLM**             | Bedrock                    | Sonnet 4 + Haiku + Titan Embed, IAM auth, no API keys  | ~$0.43/run             |
| **Embeddings**      | Bedrock Titan Embed        | Cheap embeddings for RAG                               | ~$0.0001/embed         |
| **Vector search**   | RDS pgvector or OpenSearch | pgvector free with RDS; OpenSearch for scale           | $0 or ~$25             |
| **Monitoring**      | CloudWatch                 | Logs, metrics, alarms, dashboards                      | ~$3-5                  |
| **Page cache**      | S3                         | Fetched vendor pages, avoid re-fetching                | ~$0.50                 |

**Estimated monthly total: ~$70-130** (low traffic, auto-scaling to zero when idle)

### Why Fargate, Not Lambda?

**SSE requires persistent connections.** Lambda terminates after the response — it can't stream events for 5 minutes. Fargate containers stay alive.

**Agent workers need 5+ minutes.** Lambda max is 15 min but cold starts, no persistent state between steps, and paying for idle time while waiting on LLM responses make it suboptimal.

**When Lambda IS fine:**

- `POST /research/start` — just enqueues to SQS (2 seconds)
- One-shot RAG chat if under 30s
- Webhook handlers

You can do a **hybrid**: Lambda for the API layer + Fargate for agent workers. This saves cost on the API tier.

### Alternative: Fully Serverless with Step Functions

If you want zero containers:

```
Step Functions workflow:
  1. Start → Fan out to 4 parallel branches (one per vendor)
  2. Each branch:
     a. Lambda: Call LLM, get tool choice
     b. Lambda: Execute chosen tool
     c. Lambda: Call LLM with result, get next tool choice
     d. ... repeat until report_findings or max steps
     e. Lambda: Write evidence to RDS
  3. Join → Lambda: Aggregate results, mark session complete
```

Each step is a separate Lambda invocation. Step Functions handles the loop, retries, and parallelism.

**Pros:** Fully serverless, pay-per-step, visual workflow debugger, no containers to manage

**Cons:** Each Lambda = cold start risk, Step Functions adds ~$0.025/1K transitions, more complex than a single agent loop, SSE still needs Fargate or API Gateway WebSocket

### Bedrock vs Direct Anthropic API

| Aspect             | Bedrock                                     | Direct Anthropic API                         |
| ------------------ | ------------------------------------------- | -------------------------------------------- |
| **Auth**           | IAM roles (no API keys)                     | API key in env var                           |
| **Pricing**        | Same per-token                              | Same per-token                               |
| **Models**         | Claude + Titan Embed (all-in-one)           | Claude only, need separate embedding service |
| **Data residency** | Stays in your AWS region/VPC                | Goes to Anthropic's servers                  |
| **VPC access**     | Private subnet, no internet needed          | Needs NAT Gateway                            |
| **Guardrails**     | Bedrock Guardrails (content filtering, PII) | Manual implementation                        |
| **Throughput**     | Request quota increases via support         | Rate limits apply                            |

**Recommendation:** Use Bedrock if on AWS. Same models, same cost, but IAM auth + VPC isolation + Titan Embeddings bundled in.

```typescript
// Bedrock with Vercel AI SDK — one line change
import { bedrock } from "@ai-sdk/amazon-bedrock";

const result = await generateText({
  model: bedrock("anthropic.claude-sonnet-4-20250514-v1:0"),
  // Everything else identical — same tools, same maxSteps
});
```

### Full AWS vs Vercel Stack Comparison

| Aspect             | Vercel Stack                      | Full AWS                                      |
| ------------------ | --------------------------------- | --------------------------------------------- |
| **Time to deploy** | 1 hour                            | 1-2 days (Terraform + networking)             |
| **Monthly cost**   | ~$0-20                            | ~$70-130                                      |
| **Scaling**        | Automatic                         | ECS auto-scaling policies needed              |
| **SSE support**    | Built-in                          | ALB + Fargate config                          |
| **Monitoring**     | Vercel + Inngest dashboards       | CloudWatch setup required                     |
| **Data residency** | Vercel's infra                    | Your VPC, your region                         |
| **Compliance**     | SOC 2                             | Full control (HIPAA, FedRAMP possible)        |
| **Team expertise** | Frontend devs can manage          | Need DevOps/SRE knowledge                     |
| **Vendor lock-in** | Moderate                          | Low (standard services)                       |
| **Best for**       | Startups, prototypes, small teams | Enterprise, regulated industries, large scale |
