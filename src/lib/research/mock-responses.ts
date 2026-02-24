import type { SourceType, Strength } from '@/lib/scoring/types';

export interface MockResponse {
  claim: string;
  snippet: string;
  sourceType: SourceType;
  strength: Strength;
  reasoning: string;
}

export const MOCK_RESPONSES: Record<string, MockResponse[]> = {
  // =====================================================================
  // LANGSMITH
  // =====================================================================

  'langsmith-framework-agnostic': [
    {
      claim:
        'LangSmith provides a @traceable decorator that enables tracing for non-LangChain Python functions and arbitrary REST API calls.',
      snippet:
        'The @traceable decorator can wrap any Python function to send trace data to LangSmith, regardless of the underlying LLM provider. The wrap_openai utility patches OpenAI client calls automatically. However, first-class integration depth (auto-tracing, run tree nesting) is significantly richer when using LangChain or LangGraph.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Non-LangChain usage is supported but requires manual instrumentation. The deepest features (auto-trace propagation, streaming callbacks) are LangChain-native, lowering the framework-agnostic score.',
    },
    {
      claim:
        'The langsmith-sdk GitHub README shows examples for OpenAI, Anthropic, and generic REST endpoints alongside LangChain.',
      snippet:
        'README examples demonstrate wrap_openai for direct OpenAI SDK calls and @traceable for plain functions. The TypeScript SDK mirrors these capabilities. Community issues indicate occasional friction when tracing non-LangChain streaming responses, suggesting the integration is functional but secondary.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Multi-provider examples exist but community feedback shows edge cases with non-LangChain providers, indicating moderate rather than strong framework agnosticism.',
    },
  ],

  'langsmith-self-hosting': [
    {
      claim:
        'LangSmith is a cloud-hosted SaaS platform with no publicly available self-hosting option.',
      snippet:
        'The official documentation makes no mention of on-premise deployment, Docker images, or Helm charts for self-managed instances. All data is stored in LangChain-managed infrastructure. An enterprise plan exists but is described as a dedicated cloud tenant, not a self-hosted deployment.',
      sourceType: 'official',
      strength: 'weak',
      reasoning:
        'No self-hosting capability is documented. Organizations requiring full data sovereignty cannot deploy LangSmith on their own infrastructure.',
    },
    {
      claim:
        'The langsmith-sdk repository contains only client-side code; no server components are open-sourced.',
      snippet:
        'The GitHub repository hosts the Python and TypeScript SDKs for sending data to the LangSmith platform. There are no server-side components, database schemas, or deployment manifests in the repository. Multiple open issues requesting self-hosting have been closed or redirected to the enterprise sales team.',
      sourceType: 'github',
      strength: 'weak',
      reasoning:
        'Server-side code is proprietary and not available for self-deployment. This is a fundamental limitation for self-hosting requirements.',
    },
  ],

  'langsmith-eval-framework': [
    {
      claim:
        'LangSmith offers a comprehensive evaluation framework with LLM-as-judge evaluators, custom scoring functions, and annotation queues for human review.',
      snippet:
        'The evaluation system supports dataset-driven experiments where each example runs through the target function and a set of evaluators. Built-in evaluators include LLM-as-judge (configurable rubrics), exact match, regex, and embedding distance. Custom evaluators are plain Python functions returning a score. Annotation queues enable human-in-the-loop review with configurable criteria and inter-annotator agreement tracking.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'LangSmith evaluation is mature and feature-rich, covering automated scoring, human review, and experiment comparison in a unified workflow.',
    },
    {
      claim:
        'The langsmith-sdk provides evaluate() and aevaluate() functions that run experiments against versioned datasets with parallel execution.',
      snippet:
        'The SDK evaluate() function accepts a target callable, a dataset name, and a list of evaluators. Results are streamed to the LangSmith UI where experiment runs can be compared side by side. The aevaluate() async variant supports concurrent evaluation. GitHub examples show integration with pytest for CI pipelines.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Programmatic evaluation with CI integration demonstrates a production-ready eval framework suitable for continuous testing workflows.',
    },
    {
      claim:
        'A blog post from the LangChain team describes using LangSmith evaluations to catch regressions in RAG pipelines before deployment.',
      snippet:
        'The post walks through creating a golden dataset, defining faithfulness and relevance evaluators, and setting up GitHub Actions to run evaluations on each PR. The author notes that evaluation latency can be significant for large datasets since each example triggers LLM calls for the judge, recommending sampling strategies for CI.',
      sourceType: 'blog',
      strength: 'moderate',
      reasoning:
        'Real-world usage validates the eval framework but also surfaces practical limitations around latency and cost at scale.',
    },
  ],

  'langsmith-opentelemetry': [
    {
      claim:
        'LangSmith uses a proprietary tracing format and does not natively support OpenTelemetry ingestion or export.',
      snippet:
        'Traces in LangSmith follow a custom run-tree structure with parent-child relationships specific to the LangSmith data model. The SDK sends data to LangSmith-specific API endpoints. There is no documented OTLP exporter, OTel collector integration, or W3C trace-context propagation. Teams using existing OTel infrastructure would need to maintain parallel tracing systems.',
      sourceType: 'official',
      strength: 'weak',
      reasoning:
        'The proprietary tracing format creates vendor lock-in and prevents integration with existing OpenTelemetry observability stacks.',
    },
    {
      claim:
        'GitHub issues requesting OpenTelemetry support in langsmith-sdk remain open without an implementation timeline.',
      snippet:
        'Several community-filed issues request OTel compatibility, citing the need to correlate LLM traces with application-level spans in Jaeger or Datadog. Maintainer responses acknowledge the request but indicate no concrete plans. A community fork attempted an OTel bridge but is not officially maintained.',
      sourceType: 'github',
      strength: 'weak',
      reasoning:
        'Lack of official OTel support and no public roadmap commitment makes this a genuine gap for teams standardized on OpenTelemetry.',
    },
  ],

  'langsmith-prompt-management': [
    {
      claim:
        'LangSmith Hub provides versioned prompt storage with a playground for iterative editing and one-line SDK retrieval via hub.pull().',
      snippet:
        'Prompts stored in LangSmith Hub support semantic versioning, commit history, and forking. The playground allows testing prompts against multiple models with variable substitution. The SDK hub.pull("owner/prompt-name") call retrieves the latest or pinned version at runtime, enabling prompt updates without code deployments.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Full lifecycle prompt management with versioning, testing, and runtime retrieval is a core LangSmith feature with deep SDK integration.',
    },
    {
      claim:
        'The langsmith-sdk README documents prompt CRUD operations and the hub.pull() / hub.push() workflow for CI-driven prompt management.',
      snippet:
        'SDK methods include create_prompt, update_prompt, and like_prompt for Hub management. The push/pull pattern supports GitOps workflows where prompts are version-controlled alongside application code. TypeScript and Python SDKs have feature parity for prompt operations.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Programmatic prompt management with both SDKs enables automated prompt deployment pipelines.',
    },
  ],

  'langsmith-pricing': [
    {
      claim:
        'LangSmith offers a free Developer tier, a Plus tier at $39/seat/month, and an Enterprise tier with custom pricing.',
      snippet:
        'The Developer tier includes 5,000 free traces per month with limited retention. Plus adds higher trace volume, longer retention, and team collaboration features. Enterprise pricing requires contacting sales and includes SSO, dedicated support, and custom data retention. Per-trace overage costs are documented for Plus but not for Enterprise, reducing pricing transparency at scale.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Pricing is transparent for smaller teams but becomes opaque at enterprise scale where custom negotiation is required.',
    },
    {
      claim:
        'Community discussions on GitHub and forums indicate unexpected costs at high trace volumes due to per-trace pricing.',
      snippet:
        'Users in GitHub Discussions report that production workloads generating millions of traces per month face significant costs. Sampling and filtering at the SDK level are recommended workarounds. The pricing calculator on the website helps estimate costs but does not cover all Enterprise features.',
      sourceType: 'community',
      strength: 'moderate',
      reasoning:
        'Usage-based pricing is transparent in structure but can lead to unpredictable costs without careful trace volume management.',
    },
  ],

  // =====================================================================
  // LANGFUSE
  // =====================================================================

  'langfuse-framework-agnostic': [
    {
      claim:
        'Langfuse provides framework-agnostic observability through its @observe decorator, low-level SDK, and native OpenAI/Anthropic/LiteLLM integrations.',
      snippet:
        'The @observe() decorator wraps any Python function for tracing without framework coupling. Dedicated integrations exist for OpenAI, Anthropic, LiteLLM, LlamaIndex, and LangChain, each requiring only a one-line wrapper. The JS/TS SDK offers equivalent functionality. The OpenTelemetry-based ingestion path enables any OTel-instrumented application to send traces.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Multiple integration paths (decorators, SDK, OTel) with no framework dependency make Langfuse genuinely framework-agnostic.',
    },
    {
      claim:
        'The Langfuse GitHub repository includes integration examples for 12+ LLM frameworks and a generic REST API.',
      snippet:
        'The /examples directory contains working notebooks for OpenAI, Anthropic, Mistral, Ollama, LangChain, LlamaIndex, Haystack, and others. The cookbooks demonstrate that trace structure is consistent across all frameworks. Community-contributed integrations (Semantic Kernel, Spring AI) further validate the framework-agnostic design.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Broad integration coverage backed by working examples and community contributions confirms strong framework agnosticism.',
    },
  ],

  'langfuse-self-hosting': [
    {
      claim:
        'Langfuse is fully open-source under the MIT license with official Docker Compose and Kubernetes deployment guides.',
      snippet:
        'The self-hosting documentation covers Docker Compose for development, Helm charts for Kubernetes production deployments, and environment variable configuration for PostgreSQL, Redis, S3, and authentication providers. All features available in the cloud version are included in the self-hosted edition with no artificial feature gating.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Complete feature parity between cloud and self-hosted editions under a permissive license is the strongest possible self-hosting story.',
    },
    {
      claim:
        'The langfuse/langfuse GitHub repository contains the full server application including Docker configuration and database migrations.',
      snippet:
        'The repository includes the complete Next.js application, Prisma database schema, Docker Compose files, and CI/CD workflows. Over 20,000 GitHub stars and active community contributions indicate a healthy self-hosting ecosystem. Issues related to self-hosting receive prompt maintainer responses.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Open-source server code with active maintenance and strong community adoption demonstrates reliable self-hosting support.',
    },
    {
      claim:
        'A community blog post details deploying Langfuse on AWS ECS with RDS PostgreSQL for a production workload handling 500K traces per day.',
      snippet:
        'The author describes the architecture, scaling considerations, and operational lessons from running self-hosted Langfuse for six months. Key findings include that the application is stateless and horizontally scalable, PostgreSQL is the main bottleneck at high volume, and upgrading between versions is straightforward via Docker image tags.',
      sourceType: 'blog',
      strength: 'strong',
      reasoning:
        'Production-validated self-hosting at significant scale confirms that the self-hosted deployment is not just possible but practical.',
    },
  ],

  'langfuse-eval-framework': [
    {
      claim:
        'Langfuse provides evaluation capabilities including model-based scoring, custom evaluator functions, and annotation workflows.',
      snippet:
        'Evaluations can be attached to traces via the SDK using score() calls with custom numeric or categorical values. Model-based evaluators (LLM-as-judge) are configurable through the UI. Annotation queues allow human reviewers to label traces. However, the evaluation framework lacks built-in experiment management for comparing prompt versions side-by-side.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Core evaluation primitives exist but the framework is less mature than dedicated evaluation platforms like Braintrust for structured experiment workflows.',
    },
    {
      claim:
        'The Langfuse GitHub repository shows active development on evaluation features with recent PRs adding dataset evaluation runs.',
      snippet:
        'Recent pull requests introduce dataset-based evaluation runs that execute a target function against stored examples and attach scores automatically. This brings the evaluation experience closer to LangSmith and Braintrust. The feature is documented but marked as beta, indicating ongoing iteration.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Evaluation features are actively improving but the beta status and more recent introduction means less production validation compared to evaluation-first platforms.',
    },
  ],

  'langfuse-opentelemetry': [
    {
      claim:
        'Langfuse supports native OTLP ingestion, allowing any OpenTelemetry-instrumented application to send traces directly.',
      snippet:
        'The Langfuse server exposes an OTLP-compatible HTTP endpoint that accepts standard OTel trace data. Applications instrumented with OpenTelemetry SDKs can point their OTel collector or exporter to the Langfuse endpoint with an authorization header. Semantic conventions for LLM spans (gen_ai.*) are supported for automatic metadata extraction.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Native OTLP ingestion with semantic convention support enables seamless integration into existing OpenTelemetry observability stacks.',
    },
    {
      claim:
        'The Langfuse GitHub repository includes OpenTelemetry integration examples and a dedicated otel-integration module.',
      snippet:
        'Integration examples demonstrate sending traces from OpenLLMetry, Traceloop, and custom OTel instrumentations to Langfuse. The implementation maps OTel span attributes to Langfuse trace fields, preserving trace hierarchy and timing. This allows teams to use a single OTel collector for both application and LLM observability.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Working OTel examples with maintained integration code confirm that OpenTelemetry is a first-class ingestion path, not an afterthought.',
    },
  ],

  'langfuse-prompt-management': [
    {
      claim:
        'Langfuse provides prompt management with version control, a built-in playground, SDK integration via getPrompt(), and support for A/B testing between prompt versions.',
      snippet:
        'Prompts are stored as versioned objects with text or chat message templates. The playground allows testing against configured models with variable injection. The SDK langfuse.getPrompt("name") retrieves prompts at runtime with optional version pinning and client-side caching. Labels (e.g., "production", "staging") enable gradual rollouts and A/B testing between versions.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Full prompt lifecycle management with versioning, testing, runtime retrieval, and rollout controls covers all key prompt management needs.',
    },
    {
      claim:
        'The langfuse-python SDK implements prompt caching and fallback logic for robust production prompt retrieval.',
      snippet:
        'The SDK caches prompts locally with a configurable TTL to reduce latency and handle Langfuse server unavailability gracefully. Fallback to the last cached version ensures application resilience. The TypeScript SDK provides equivalent caching behavior with compile() for variable substitution.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Production-grade SDK features like caching and fallback demonstrate that prompt management is designed for reliability, not just convenience.',
    },
  ],

  'langfuse-pricing': [
    {
      claim:
        'Langfuse offers a free self-hosted tier with all features, a free cloud Hobby tier, a Pro tier at $59/month, and a Team tier at $199/month.',
      snippet:
        'Self-hosting is completely free with no feature restrictions under the MIT license. The cloud Hobby tier includes 50,000 observations per month. Pro and Team tiers add higher volume limits, SSO, and priority support. All cloud pricing is published on the website with clear per-observation overage rates. Enterprise cloud pricing is available on request.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Transparent pricing across all tiers, combined with a genuinely free self-hosted option, gives organizations maximum flexibility.',
    },
    {
      claim:
        'GitHub Discussions indicate that teams self-hosting Langfuse report minimal infrastructure costs relative to cloud alternatives.',
      snippet:
        'Users report running self-hosted Langfuse on modest infrastructure (2 vCPU, 4GB RAM for the app, a managed PostgreSQL instance) for teams of 10-20 engineers. Monthly infrastructure costs are estimated at $50-150 depending on cloud provider and trace volume, compared to hundreds per month for equivalent cloud-hosted alternatives.',
      sourceType: 'community',
      strength: 'strong',
      reasoning:
        'Community-reported infrastructure costs validate that self-hosting is economically viable, making the pricing story strong from both cloud and self-hosted perspectives.',
    },
  ],

  // =====================================================================
  // BRAINTRUST
  // =====================================================================

  'braintrust-framework-agnostic': [
    {
      claim:
        'Braintrust provides a framework-agnostic SDK that wraps any LLM provider through its proxy and supports direct API logging.',
      snippet:
        'The Braintrust SDK wraps LLM calls through a configurable proxy that normalizes request/response formats across OpenAI, Anthropic, Google, Mistral, and other providers. The invoke() function and wrapOpenAI() utility work independently of any orchestration framework. Logging can also be done via direct API calls for unsupported providers.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Provider-agnostic proxy design with direct logging fallback means Braintrust works with any LLM setup without framework dependencies.',
    },
    {
      claim:
        'The braintrust-sdk GitHub repository demonstrates integrations with raw OpenAI, Anthropic, and custom model endpoints.',
      snippet:
        'SDK examples show wrapping OpenAI chat completions, Anthropic messages, and custom HTTP endpoints with consistent logging. The TypeScript and Python SDKs share the same API surface. No LangChain or LlamaIndex dependency is required, though optional integrations exist.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Working examples across multiple providers with no framework requirement confirm genuine framework agnosticism.',
    },
  ],

  'braintrust-self-hosting': [
    {
      claim:
        'Braintrust is a cloud-only platform with no self-hosting or on-premise deployment option.',
      snippet:
        'The documentation describes Braintrust as a managed cloud service. There are no Docker images, Helm charts, or self-hosting guides in the documentation or repository. Data is stored on Braintrust-managed infrastructure. The SDK repository contains only client libraries, not server components.',
      sourceType: 'official',
      strength: 'weak',
      reasoning:
        'No self-hosting option exists. Organizations with strict data residency requirements cannot run Braintrust on their own infrastructure.',
    },
    {
      claim:
        'The braintrust-sdk repository contains only client-side code with no server or deployment artifacts.',
      snippet:
        'The repository structure includes Python and TypeScript SDK packages, API client code, and examples. There is no server application, database schema, or infrastructure configuration. Issues requesting self-hosting point to the cloud platform as the only option.',
      sourceType: 'github',
      strength: 'weak',
      reasoning:
        'Proprietary server architecture with only client SDKs open-sourced eliminates any path to self-managed deployment.',
    },
  ],

  'braintrust-eval-framework': [
    {
      claim:
        'Braintrust is built as an evaluation-first platform with Eval() experiments, custom scorers, versioned datasets, and side-by-side experiment comparison.',
      snippet:
        'The core Eval() function runs a task against a dataset and applies a set of scoring functions, producing an experiment that is automatically versioned and comparable to previous runs. Built-in scorers include factuality, relevance, and toxicity. Custom scorers are plain functions returning 0-1 scores. The UI displays experiment diffs highlighting regressions and improvements at the individual example level.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Evaluation is the foundational use case for Braintrust, resulting in the most mature and feature-complete eval framework among the compared vendors.',
    },
    {
      claim:
        'The braintrust-sdk README positions evaluation as the primary SDK function with Eval() as the first documented API.',
      snippet:
        'The README quick-start immediately introduces Eval() with a dataset, task function, and scorer. The examples directory includes evaluations for summarization, Q&A, and classification tasks. The SDK also provides braintrust eval CLI command for running evaluations from the terminal, enabling CI integration with JSON output.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'SDK documentation leading with evaluation confirms this is the core product value, backed by CLI tooling for automation.',
    },
    {
      claim:
        'A technical blog post compares Braintrust evaluation workflows to pytest, framing LLM evals as a natural extension of software testing.',
      snippet:
        'The analogy to unit testing resonates: datasets are test fixtures, scorers are assertions, and experiments are test runs. The post demonstrates setting up evaluation gates in CI that block merges when key metrics regress beyond thresholds. This testing-oriented approach is distinctive among observability-focused competitors.',
      sourceType: 'blog',
      strength: 'strong',
      reasoning:
        'The testing-first philosophy with CI integration demonstrates a mature evaluation framework designed for production quality gates.',
    },
  ],

  'braintrust-opentelemetry': [
    {
      claim:
        'Braintrust supports logging spans and traces but uses its own tracing format rather than native OpenTelemetry.',
      snippet:
        'The Braintrust SDK provides traced() and span logging functions that create hierarchical traces stored in the Braintrust platform. These follow a proprietary schema optimized for LLM workloads. While the data model captures similar information to OTel spans (timing, metadata, parent-child relationships), there is no OTLP export or OTel collector integration documented.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Tracing exists but in a proprietary format. Teams can capture similar data but cannot integrate with existing OTel pipelines without custom bridging.',
    },
    {
      claim:
        'The braintrust-sdk provides span-level logging with .traced() but does not implement OTel span interfaces.',
      snippet:
        'The traced() decorator and startSpan() API create Braintrust-specific span objects with input/output/metadata fields. These do not implement the OpenTelemetry Span interface or propagate W3C trace context. A community member proposed an OTel bridge in GitHub issues, but no official implementation exists.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Proprietary span format with no OTel bridge means some tracing capability exists but interoperability with OTel ecosystems is limited.',
    },
  ],

  'braintrust-prompt-management': [
    {
      claim:
        'Braintrust includes prompt management with versioning and playground testing, though it is secondary to the evaluation workflow.',
      snippet:
        'Prompts can be created and versioned in the Braintrust UI with a playground for testing. The SDK provides functions to retrieve prompts at runtime. However, the prompt management features are less emphasized in documentation compared to evaluation, and advanced features like A/B testing between prompt versions are handled through the experiment framework rather than dedicated prompt tooling.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Prompt management exists and is functional but is clearly a supporting feature to evaluation rather than a primary product focus.',
    },
    {
      claim:
        'The braintrust-sdk includes prompt retrieval functions but the majority of examples focus on evaluation workflows.',
      snippet:
        'SDK documentation shows loadPrompt() for runtime retrieval and the ability to use prompts within Eval() experiments. The integration between prompts and evaluations is useful for testing prompt changes. However, dedicated prompt management features like deployment labels, gradual rollouts, or caching strategies are not documented.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Basic prompt management is available but lacks advanced deployment and operational features found in prompt-focused platforms.',
    },
  ],

  'braintrust-pricing': [
    {
      claim:
        'Braintrust offers a free tier for individuals, a Pro tier at usage-based pricing, and Enterprise with custom quotes.',
      snippet:
        'The free tier includes limited experiments and logging. Pro pricing is based on the number of logged rows and stored datasets, with published per-unit rates. Enterprise pricing requires contacting sales and includes advanced access controls, dedicated support, and custom retention. The AI proxy usage (routing LLM calls through Braintrust) is priced separately based on token throughput.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Pricing is transparent for smaller-scale usage but becomes less predictable at enterprise scale with multiple pricing dimensions.',
    },
    {
      claim:
        'Community feedback suggests Braintrust pricing is competitive for evaluation-heavy workloads but can scale unexpectedly with high log volume.',
      snippet:
        'Users on community forums report that evaluation-focused workflows (running experiments, comparing results) stay within predictable cost ranges. However, using Braintrust for production logging alongside evaluation can increase costs significantly as row counts grow. The proxy pricing adds another variable for teams routing all LLM calls through Braintrust.',
      sourceType: 'community',
      strength: 'moderate',
      reasoning:
        'Multi-dimensional pricing (experiments, logging, proxy) creates moderate complexity in cost prediction for comprehensive usage.',
    },
  ],

  // =====================================================================
  // POSTHOG
  // =====================================================================

  'posthog-framework-agnostic': [
    {
      claim:
        'PostHog LLM observability supports OpenAI, Anthropic, LangChain, and other frameworks through its tracing integration.',
      snippet:
        'PostHog added AI/LLM observability as a product area, providing tracing for LLM calls across popular providers. The integration uses PostHog event capture to log LLM interactions including token usage, latency, and model parameters. However, this is a newer addition to the product and the breadth of framework-specific integrations is narrower than dedicated LLM observability tools.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'Multiple framework support exists but as a newer feature with less integration depth than dedicated LLM observability platforms.',
    },
    {
      claim:
        'The PostHog GitHub repository shows LLM observability as an actively developed feature area with recent commits.',
      snippet:
        'Recent commits and PRs add LLM tracing support for additional providers. The implementation captures events via the standard PostHog SDK capture() call with structured LLM metadata. Framework integrations are plugin-based, meaning new provider support can be added incrementally, but the current catalog is smaller than competitors.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Active development signals growing capability, but the smaller current integration catalog compared to LLM-focused tools warrants a moderate rating.',
    },
  ],

  'posthog-self-hosting': [
    {
      claim:
        'PostHog offers a fully self-hosted open-source edition with Docker Compose and Kubernetes deployment options.',
      snippet:
        'PostHog self-hosting is well-established with comprehensive deployment guides for Docker Compose (development) and Helm charts (production Kubernetes). The platform uses ClickHouse for analytics storage, PostgreSQL for metadata, and Kafka for event ingestion. Self-hosted instances receive the same core feature set as the cloud version.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'PostHog has a mature self-hosting story for its core product analytics platform with years of production usage.',
    },
    {
      claim:
        'The PostHog/posthog GitHub repository is the complete platform including all server components, with over 20,000 stars.',
      snippet:
        'The monorepo contains the full Django backend, React frontend, ClickHouse schemas, Kafka consumers, and infrastructure configurations. The self-hosting community is active with thousands of production deployments. However, newer features like LLM observability may lag behind the cloud version in self-hosted releases.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Fully open-source server with a large and active self-hosting community demonstrates production-grade self-hosting capability.',
    },
    {
      claim:
        'Community reports indicate that LLM-specific features may have delayed availability on self-hosted instances compared to PostHog Cloud.',
      snippet:
        'Forum posts note that some AI engineering features were initially cloud-only before being backported to self-hosted editions. Users should verify that specific LLM observability features are available in the self-hosted version they deploy. Core product analytics self-hosting is solid, but the AI features are newer.',
      sourceType: 'community',
      strength: 'moderate',
      reasoning:
        'While PostHog core self-hosting is strong, the LLM-specific features being newer introduces some uncertainty about self-hosted feature parity.',
    },
  ],

  'posthog-eval-framework': [
    {
      claim:
        'PostHog does not provide a dedicated LLM evaluation framework; its focus is product analytics and event-based monitoring.',
      snippet:
        'PostHog excels at product analytics: funnels, cohorts, A/B testing for user-facing features, and session recordings. For LLM workloads, it can track metrics like response latency, token usage, and error rates through its event system. However, there are no built-in LLM-specific evaluators, dataset management, or experiment comparison tools designed for assessing LLM output quality.',
      sourceType: 'official',
      strength: 'weak',
      reasoning:
        'PostHog can monitor LLM operational metrics but lacks the evaluation primitives (scorers, datasets, experiments) needed for LLM quality assessment.',
    },
    {
      claim:
        'The PostHog repository has no evaluation-specific modules for LLM output quality scoring.',
      snippet:
        'A search of the repository reveals no evaluation framework, scorer implementations, or dataset-driven experiment runners. LLM-related code focuses on event capture and dashboard visualization. Teams needing LLM evaluation would need to build custom solutions or integrate a dedicated evaluation tool alongside PostHog.',
      sourceType: 'github',
      strength: 'weak',
      reasoning:
        'Absence of evaluation code in the repository confirms that LLM output quality assessment is not a product capability.',
    },
  ],

  'posthog-opentelemetry': [
    {
      claim:
        'PostHog supports OpenTelemetry for general application monitoring, with LLM-specific OTel support being a more recent addition.',
      snippet:
        'PostHog can ingest events via standard SDKs and has experimented with OTel-compatible ingestion for application traces. The platform supports correlating LLM events with product analytics data. However, the OTel integration is primarily designed for general application observability rather than LLM-specific semantic conventions.',
      sourceType: 'official',
      strength: 'moderate',
      reasoning:
        'General OTel compatibility exists for application monitoring, but LLM-specific OTel conventions (gen_ai.*) are not deeply integrated.',
    },
    {
      claim:
        'The PostHog GitHub repository shows ongoing work on OTel integration with varying levels of maturity across features.',
      snippet:
        'PRs and issues related to OpenTelemetry show incremental progress toward OTel compatibility. The core event ingestion pipeline can accept structured event data that maps to OTel concepts. Full OTel collector integration with automatic LLM span extraction is not yet available, though the architecture does not prevent future support.',
      sourceType: 'github',
      strength: 'moderate',
      reasoning:
        'Work in progress on OTel support shows commitment but the current state is partial, particularly for LLM-specific tracing.',
    },
  ],

  'posthog-prompt-management': [
    {
      claim:
        'PostHog does not offer prompt management functionality; its product focus is analytics and experimentation for user-facing features.',
      snippet:
        'PostHog provides feature flags and A/B testing for product experiments, which could theoretically be repurposed to toggle between prompt versions. However, there is no dedicated prompt storage, versioning, playground, or SDK retrieval mechanism designed for LLM prompts. Teams would need a separate tool for prompt management.',
      sourceType: 'official',
      strength: 'weak',
      reasoning:
        'No prompt management capability exists. Feature flags offer a partial workaround for prompt switching but lack the domain-specific features of prompt management tools.',
    },
    {
      claim:
        'The PostHog repository contains no prompt management modules or related API endpoints.',
      snippet:
        'A review of the codebase reveals no prompt-related models, API routes, or UI components. The feature flag system is the closest analog, but it stores boolean or string values without template rendering, version history, or model-specific testing capabilities needed for prompt management.',
      sourceType: 'github',
      strength: 'weak',
      reasoning:
        'Complete absence of prompt management code confirms this is outside the product scope.',
    },
  ],

  'posthog-pricing': [
    {
      claim:
        'PostHog offers a generous free tier with 1 million events per month, usage-based pricing beyond that, and an all-in-one bundle that can be cost-effective.',
      snippet:
        'The free tier includes 1 million events, 5,000 session recordings, and 1 million feature flag requests per month. Paid usage is billed per event with volume discounts. The all-in-one platform (analytics, session recording, feature flags, experimentation, LLM observability) can be more cost-effective than assembling separate tools for each capability.',
      sourceType: 'official',
      strength: 'strong',
      reasoning:
        'Generous free tier and transparent usage-based pricing with the bundling advantage of an all-in-one platform make this a strong pricing story.',
    },
    {
      claim:
        'The PostHog GitHub repository and community confirm that the self-hosted edition is free with no usage limits.',
      snippet:
        'Self-hosted PostHog has no per-event pricing or usage caps. Infrastructure costs are the only expense, and the community shares benchmarks for running PostHog on various cloud providers. For teams already running PostHog for product analytics, adding LLM observability incurs only marginal additional event volume costs.',
      sourceType: 'github',
      strength: 'strong',
      reasoning:
        'Free self-hosting with no artificial limits and marginal cost for LLM features in existing PostHog deployments is highly cost-effective.',
    },
    {
      claim:
        'Community users report that the all-in-one pricing is favorable compared to running separate analytics, experimentation, and LLM observability tools.',
      snippet:
        'Users on forums compare the total cost of PostHog (analytics + feature flags + session recording + LLM monitoring) against the combined cost of Amplitude + LaunchDarkly + FullStory + LangSmith. The bundled PostHog approach is frequently cited as more cost-effective, though the LLM observability depth may not match dedicated tools.',
      sourceType: 'community',
      strength: 'strong',
      reasoning:
        'The bundling value proposition is validated by community cost comparisons, though teams should weigh cost savings against feature depth for LLM-specific needs.',
    },
  ],
};
