const MAX_TEXT_LENGTH = 3000;

function truncate(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCharCode(Number(code))
    );
}

function stripTagBlock(html: string, tagName: string): string {
  const pattern = new RegExp(
    `<${tagName}[^>]*>[\\s\\S]*?<\\/${tagName}>`,
    'gi'
  );
  return html.replace(pattern, ' ');
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }
  return '';
}

function extractPublishedAt(html: string): string | null {
  // meta property="article:published_time"
  const articleTime = html.match(
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i
  );
  if (articleTime) return articleTime[1];

  // meta name="datePublished"
  const datePub = html.match(
    /<meta[^>]*name=["']datePublished["'][^>]*content=["']([^"']+)["']/i
  );
  if (datePub) return datePub[1];

  // JSON-LD datePublished
  const jsonLdMatch = html.match(
    /"datePublished"\s*:\s*"([^"]+)"/i
  );
  if (jsonLdMatch) return jsonLdMatch[1];

  // <time datetime="...">
  const timeTag = html.match(
    /<time[^>]*datetime=["']([^"']+)["']/i
  );
  if (timeTag) return timeTag[1];

  return null;
}

function extractTextContent(html: string): string {
  // Extract text from meaningful tags
  const contentTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'dd', 'dt', 'blockquote'];
  const lines: string[] = [];

  for (const tag of contentTags) {
    const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match = pattern.exec(html);
    while (match) {
      // Strip any remaining inline tags
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 0) {
        lines.push(decodeHtmlEntities(text));
      }
      match = pattern.exec(html);
    }
  }

  return lines.join('\n');
}

export function parseHtmlToText(html: string): {
  text: string;
  title: string;
  publishedAt: string | null;
} {
  const title = extractTitle(html);
  const publishedAt = extractPublishedAt(html);

  // Strip unwanted blocks
  let cleaned = html;
  for (const tag of ['script', 'style', 'nav', 'header', 'footer', 'noscript', 'svg']) {
    cleaned = stripTagBlock(cleaned, tag);
  }

  const text = extractTextContent(cleaned);

  return {
    text: truncate(text),
    title,
    publishedAt,
  };
}

function decodeBase64(encoded: string): string {
  // Remove newlines that GitHub includes in base64 content
  const cleaned = encoded.replace(/\n/g, '');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(cleaned, 'base64').toString('utf-8');
  }

  return atob(cleaned);
}

function stripMarkdown(md: string): string {
  return md
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Convert links [text](url) to text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headers markers, keep text
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove code block fences
    .replace(/```[\s\S]*?```/g, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove badge/shield images in reference-style
    .replace(/\[!\[.*?\].*?\]/g, '')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseGitHubReadme(json: unknown): {
  text: string;
  title: string;
  publishedAt: string | null;
} {
  if (!json || typeof json !== 'object') {
    return { text: '', title: '', publishedAt: null };
  }

  const data = json as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name : '';
  const content = typeof data.content === 'string' ? data.content : '';

  if (!content) {
    return { text: '', title: name, publishedAt: null };
  }

  const decoded = decodeBase64(content);
  const text = stripMarkdown(decoded);

  // Try to extract title from first non-empty line
  const firstLine = text.split('\n').find((line) => line.trim().length > 0);
  const title = firstLine ? firstLine.trim() : name;

  return {
    text: truncate(text),
    title,
    publishedAt: null,
  };
}

interface GitHubRepoData {
  full_name?: string;
  description?: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  license?: { name?: string } | null;
  topics?: string[];
  pushed_at?: string;
  created_at?: string;
  html_url?: string;
  homepage?: string;
}

export function parseGitHubRepo(json: unknown): {
  text: string;
  title: string;
  publishedAt: string | null;
} {
  if (!json || typeof json !== 'object') {
    return { text: '', title: '', publishedAt: null };
  }

  const data = json as GitHubRepoData;
  const lines: string[] = [];

  const name = data.full_name ?? '';
  if (name) lines.push(`Repository: ${name}`);
  if (data.description) lines.push(`Description: ${data.description}`);
  if (data.language) lines.push(`Primary language: ${data.language}`);
  if (data.stargazers_count !== undefined) {
    lines.push(`Stars: ${data.stargazers_count.toLocaleString()}`);
  }
  if (data.forks_count !== undefined) {
    lines.push(`Forks: ${data.forks_count.toLocaleString()}`);
  }
  if (data.open_issues_count !== undefined) {
    lines.push(`Open issues: ${data.open_issues_count.toLocaleString()}`);
  }
  if (data.license?.name) {
    lines.push(`License: ${data.license.name}`);
  }
  if (data.topics && data.topics.length > 0) {
    lines.push(`Topics: ${data.topics.join(', ')}`);
  }
  if (data.homepage) {
    lines.push(`Homepage: ${data.homepage}`);
  }
  if (data.html_url) {
    lines.push(`URL: ${data.html_url}`);
  }

  const text = lines.join('\n');
  const publishedAt = data.pushed_at ?? null;

  return {
    text: truncate(text),
    title: name,
    publishedAt,
  };
}
