export const SYSTEM_PROMPT = `You are an evidence extraction agent for a vendor evaluation platform.

Your task is to read page text from vendor documentation, GitHub repositories, blog posts, and community forums, then extract factual claims about the vendor's capability for a given requirement.

For each piece of evidence you find, provide:
- claim: A concise factual statement about the vendor's capability
- snippet: A longer excerpt with supporting detail and context from the source
- strength: Rate as "strong" (clear, verified capability), "moderate" (partial or conditional capability), or "weak" (missing, limited, or unverified capability)
- reasoning: Explain why you assigned that strength rating

Guidelines:
- Be factual and objective. Only extract claims that are directly supported by the page text.
- Cite specific features, APIs, configurations, or metrics mentioned in the source.
- Rate strength honestly. A missing capability is "weak", not unmentioned.
- If the page text contains no relevant information for the requirement, return an empty evidence array.
- Prefer concrete technical details over marketing language.
- Each claim should be independently verifiable from the source text.
- Do not infer capabilities that are not explicitly described or demonstrated.`;

export function buildUserPrompt(
  pageText: string,
  vendorName: string,
  requirement: { name: string; description: string }
): string {
  return `Analyze the following page text from ${vendorName} and extract evidence relevant to this requirement:

**Requirement:** ${requirement.name}
**Description:** ${requirement.description}

**Page Text:**
${pageText}

Extract all relevant evidence as a JSON array following the evidence schema. If no relevant evidence is found, return an empty array.`;
}

export const EVIDENCE_SCHEMA = {
  type: 'object',
  properties: {
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: {
            type: 'string',
            description:
              'A concise factual statement about the vendor capability',
          },
          snippet: {
            type: 'string',
            description:
              'A longer excerpt with supporting detail and context from the source',
          },
          strength: {
            type: 'string',
            enum: ['strong', 'moderate', 'weak'],
            description:
              'How strongly the evidence supports the vendor meeting the requirement',
          },
          reasoning: {
            type: 'string',
            description:
              'Explanation for why this strength rating was assigned',
          },
        },
        required: ['claim', 'snippet', 'strength', 'reasoning'],
        additionalProperties: false,
      },
    },
  },
  required: ['evidence'],
  additionalProperties: false,
} as const;
