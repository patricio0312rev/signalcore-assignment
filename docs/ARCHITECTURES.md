# SignalCore Architecture Diagrams

## 1. Current Workflow: Fixed Pipeline

```mermaid
flowchart TD
    User([User clicks Run Research]) --> Start[POST /api/research/start]
    Start --> Session[Create Session + Return ID]
    Session --> Loop

    subgraph Loop["For each vendor (sequential)"]
        direction TB
        Sources["sources.ts\n18 hardcoded URLs"] --> Fetch
        Fetch["Fetch Pages\n(parallel, max 3)"] --> Parse["Parse HTML / GitHub API"]
        Parse --> Analyze

        subgraph Analyze["For each page x requirement"]
            Mock["mock-analyzer.ts\nPre-generated responses\nNo LLM calls"]
        end

        Analyze --> Dedup["Deduplicate Evidence\nKeep strongest per vendor-requirement"]
    end

    Loop --> SSE["SSE Stream Events\nGET /api/research/status"]
    SSE --> Results["GET /api/research/results"]
    Results --> Scoring["Scoring Engine\nWeighted aggregation"]
    Scoring --> UI([Dashboard + Matrix + Charts])

    style Sources fill:#fff3bf,stroke:#f59e0b
    style Mock fill:#ffc9c9,stroke:#ef4444
    style Dedup fill:#d0bfff,stroke:#8b5cf6
    style SSE fill:#b2f2bb,stroke:#22c55e
    style Scoring fill:#a5d8ff,stroke:#4a9eed
```

**Limitations:**
- No dynamic source discovery — always the same 18 URLs
- No reasoning — if evidence is weak, pipeline moves on
- No adaptability — same path every run regardless of results
- Mock analyzer returns deterministic, pre-written responses

---

## 2. Agentic Approach: ReAct Loop

```mermaid
flowchart TD
    User([User starts research]) --> Goal["Goal: Evaluate vendor X\nfor requirement Y"]
    Goal --> Observe

    subgraph Agent["Agent Loop (max N iterations)"]
        direction TB
        Observe["Observe\nWhat evidence do I have so far?"] --> Think
        Think{"Think\nIs evidence sufficient?"}
        Think -->|"Yes - strong evidence\nfrom multiple sources"| Report["Report Findings\n(structured evidence)"]
        Think -->|"No - gaps found"| Plan["Plan\nWhat should I search for next?"]
        Plan --> Act["Act: Pick & execute a tool"]
        Act --> Tool1["web_search()\nDiscover new sources"]
        Act --> Tool2["fetch_page()\nGet specific URL content"]
        Act --> Tool3["extract_evidence()\nAnalyze text for claims"]
        Act --> Tool4["follow_links()\nSpider relevant pages"]
        Act --> Tool5["check_coverage()\nEvaluate evidence quality"]
        Tool1 & Tool2 & Tool3 & Tool4 & Tool5 --> Observe
    end

    Report --> Score["Score + Confidence\nBased on real evidence"]
    Score --> UI([Dashboard with provenance])

    style Think fill:#fff3bf,stroke:#f59e0b
    style Plan fill:#d0bfff,stroke:#8b5cf6
    style Report fill:#b2f2bb,stroke:#22c55e
    style Tool1 fill:#c3fae8,stroke:#06b6d4
    style Tool2 fill:#c3fae8,stroke:#06b6d4
    style Tool3 fill:#c3fae8,stroke:#06b6d4
    style Tool4 fill:#c3fae8,stroke:#06b6d4
    style Tool5 fill:#c3fae8,stroke:#06b6d4
```

**Key differences from current:**
- Agent **decides** what to search — no hardcoded URL list
- Agent **evaluates** evidence quality and decides when to stop
- Agent **adapts** strategy based on what it finds (or doesn't find)
- Agent can **follow links** and discover sources we never predicted
- Each iteration streams progress events to the UI in real-time

---

## 3. Current Architecture

```mermaid
graph LR
    subgraph Browser["Browser (Client)"]
        Dashboard["Dashboard Page\n(client component)"]
        Matrix["Comparison Matrix"]
        Drawer["Evidence Drawer"]
        Research["Research Panel"]
        Charts["Charts + Sliders"]
    end

    subgraph NextJS["Next.js Server"]
        API_Start["POST /research/start"]
        API_Status["GET /research/status\n(SSE)"]
        API_Results["GET /research/results"]
        API_Score["GET /score"]
        API_Evidence["GET /evidence"]
    end

    subgraph Lib["lib/ (Business Logic)"]
        Orchestrator["orchestrator.ts\nSequential vendor loop"]
        Fetcher["fetcher.ts\nHTTP + retry + cache"]
        Parser["parser.ts\nHTML & GitHub parsing"]
        MockAnalyzer["mock-analyzer.ts\nPre-generated responses"]
        ScoringEngine["scoring/engine.ts\nWeighted aggregation"]
        SessionStore["session-store.ts\nIn-memory Map"]
        Sources["sources.ts\n18 hardcoded URLs"]
    end

    subgraph External["External Services"]
        GitHub["GitHub API"]
        VendorDocs["Vendor Doc Sites"]
        Pricing["Pricing Pages"]
    end

    Dashboard --> API_Start & API_Status & API_Results
    Matrix --> API_Score
    Drawer --> API_Evidence

    API_Start --> Orchestrator
    Orchestrator --> Sources
    Orchestrator --> Fetcher
    Fetcher --> Parser
    Fetcher --> GitHub & VendorDocs & Pricing
    Orchestrator --> MockAnalyzer
    Orchestrator --> SessionStore
    API_Status --> SessionStore
    API_Results --> SessionStore
    API_Score --> ScoringEngine

    style SessionStore fill:#ffc9c9,stroke:#ef4444
    style Sources fill:#ffc9c9,stroke:#ef4444
    style MockAnalyzer fill:#ffc9c9,stroke:#ef4444
    style ScoringEngine fill:#b2f2bb,stroke:#22c55e
```

**Pain points (in red):**
- `SessionStore` — in-memory Map, lost on restart, can't scale horizontally
- `Sources` — hardcoded URLs, no dynamic discovery
- `MockAnalyzer` — no real analysis, deterministic lookup

---

## 4. Production Architecture (Scalable + Agentic)

```mermaid
graph TB
    subgraph Edge["Frontend (Vercel Edge CDN)"]
        NextApp["Next.js App\n(RSC + Client)"]
        WS["WebSocket / SSE\nReal-time updates"]
        ClientCache["SWR / React Query\nClient cache"]
    end

    subgraph API["API Layer (Serverless Functions)"]
        Gateway["API Gateway\n+ Rate Limiting + Auth"]
        Routes["Research API Routes"]
        Queue["Job Queue\n(BullMQ / Inngest)"]
        EventBus["Event Bus\n(Redis Pub/Sub)"]
    end

    subgraph Workers["Agent Workers (Horizontally Scalable)"]
        subgraph AgentCore["Research Agent (ReAct)"]
            Planner["Planner LLM\nDecides next action"]
            Evaluator["Evaluator LLM\nChecks evidence quality"]
            StateMgr["State Manager\nTracks progress per vendor"]
        end

        subgraph Tools["Tool Registry"]
            T1["web_search()"]
            T2["fetch_page()"]
            T3["analyze_text()"]
            T4["follow_links()"]
            T5["check_coverage()"]
            T6["query_github()"]
            T7["report_findings()"]
        end
    end

    subgraph Data["Data Layer (Persistent)"]
        Redis[("Redis\nSessions + Cache")]
        Postgres[("Postgres\nEvidence + Scores")]
        S3[("S3 / R2\nPage Cache")]
        VectorDB[("Vector DB\nSemantic Search")]
    end

    subgraph External["External Services"]
        LLM["Claude API\n(Reasoning + Analysis)"]
        SearchAPI["Web Search API\n(Brave / Serper)"]
        VendorSites["Vendor Websites\n+ GitHub APIs"]
    end

    NextApp -->|"HTTP"| Gateway
    WS <-->|"Real-time"| EventBus
    Gateway --> Routes
    Routes -->|"Enqueue job"| Queue
    Queue -->|"Dispatch"| AgentCore
    AgentCore --> Tools
    EventBus -->|"Progress events"| WS

    Planner --> T1 & T2 & T4 & T6
    Evaluator --> T5
    T3 --> LLM
    T1 --> SearchAPI
    T2 & T4 & T6 --> VendorSites
    T7 --> Postgres

    StateMgr --> Redis
    Tools --> S3
    T3 --> VectorDB
    Postgres --> ClientCache

    style LLM fill:#ffc9c9,stroke:#ef4444
    style Redis fill:#fff3bf,stroke:#f59e0b
    style Postgres fill:#fff3bf,stroke:#f59e0b
    style VectorDB fill:#e5dbff,stroke:#8b5cf6
    style Planner fill:#b2f2bb,stroke:#22c55e
    style Evaluator fill:#b2f2bb,stroke:#22c55e
```

**How it scales:**
- **Agent Workers** scale horizontally — add more instances behind the job queue
- **Job Queue** (BullMQ/Inngest) distributes vendor research jobs across workers
- **Redis Pub/Sub** fans out real-time events to all connected clients
- **Vector DB** enables semantic search across previously cached evidence (no re-fetching)
- **S3/R2 page cache** avoids re-fetching vendor docs across research sessions
- **Postgres** stores evidence permanently for cross-session analysis
- **Serverless API** auto-scales with traffic, no server management
