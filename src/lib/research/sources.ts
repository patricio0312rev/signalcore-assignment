import type { ResearchSource } from '@/lib/research/types';

export const RESEARCH_SOURCES: ResearchSource[] = [
  // --- LangSmith ---
  {
    vendorId: 'langsmith',
    url: 'https://api.github.com/repos/langchain-ai/langsmith-sdk',
    sourceType: 'github',
    label: 'LangSmith SDK — GitHub repo metadata',
  },
  {
    vendorId: 'langsmith',
    url: 'https://api.github.com/repos/langchain-ai/langsmith-sdk/readme',
    sourceType: 'github',
    label: 'LangSmith SDK — GitHub README',
  },
  {
    vendorId: 'langsmith',
    url: 'https://docs.smith.langchain.com/evaluation',
    sourceType: 'official',
    label: 'LangSmith — Evaluation docs',
  },
  {
    vendorId: 'langsmith',
    url: 'https://docs.smith.langchain.com/observability',
    sourceType: 'official',
    label: 'LangSmith — Observability docs',
  },
  {
    vendorId: 'langsmith',
    url: 'https://docs.smith.langchain.com/prompt_engineering',
    sourceType: 'official',
    label: 'LangSmith — Prompt management docs',
  },

  // --- Langfuse ---
  {
    vendorId: 'langfuse',
    url: 'https://api.github.com/repos/langfuse/langfuse',
    sourceType: 'github',
    label: 'Langfuse — GitHub repo metadata',
  },
  {
    vendorId: 'langfuse',
    url: 'https://api.github.com/repos/langfuse/langfuse/readme',
    sourceType: 'github',
    label: 'Langfuse — GitHub README',
  },
  {
    vendorId: 'langfuse',
    url: 'https://langfuse.com/docs',
    sourceType: 'official',
    label: 'Langfuse — Documentation overview',
  },
  {
    vendorId: 'langfuse',
    url: 'https://langfuse.com/docs/open-source',
    sourceType: 'official',
    label: 'Langfuse — Self-hosting docs',
  },
  {
    vendorId: 'langfuse',
    url: 'https://langfuse.com/pricing',
    sourceType: 'official',
    label: 'Langfuse — Pricing page',
  },

  // --- Braintrust ---
  {
    vendorId: 'braintrust',
    url: 'https://api.github.com/repos/braintrustdata/braintrust-sdk',
    sourceType: 'github',
    label: 'Braintrust SDK — GitHub repo metadata',
  },
  {
    vendorId: 'braintrust',
    url: 'https://api.github.com/repos/braintrustdata/braintrust-sdk/readme',
    sourceType: 'github',
    label: 'Braintrust SDK — GitHub README',
  },
  {
    vendorId: 'braintrust',
    url: 'https://www.braintrust.dev/docs',
    sourceType: 'official',
    label: 'Braintrust — Documentation overview',
  },
  {
    vendorId: 'braintrust',
    url: 'https://www.braintrust.dev/docs/guides/evals',
    sourceType: 'official',
    label: 'Braintrust — Evaluation guide',
  },

  // --- PostHog ---
  {
    vendorId: 'posthog',
    url: 'https://api.github.com/repos/PostHog/posthog',
    sourceType: 'github',
    label: 'PostHog — GitHub repo metadata',
  },
  {
    vendorId: 'posthog',
    url: 'https://api.github.com/repos/PostHog/posthog/readme',
    sourceType: 'github',
    label: 'PostHog — GitHub README',
  },
  {
    vendorId: 'posthog',
    url: 'https://posthog.com/docs',
    sourceType: 'official',
    label: 'PostHog — Documentation overview',
  },
  {
    vendorId: 'posthog',
    url: 'https://posthog.com/docs/ai-engineering',
    sourceType: 'official',
    label: 'PostHog — AI engineering docs',
  },
  {
    vendorId: 'posthog',
    url: 'https://posthog.com/pricing',
    sourceType: 'official',
    label: 'PostHog — Pricing page',
  },
];
