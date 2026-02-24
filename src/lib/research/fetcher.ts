import type { ResearchSource, FetchedPage } from '@/lib/research/types';
import { parseHtmlToText, parseGitHubReadme, parseGitHubRepo } from '@/lib/research/parser';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

const cache = new Map<string, FetchedPage>();

export function clearFetchCache(): void {
  cache.clear();
}

function isGitHubApiUrl(url: string): boolean {
  return url.startsWith('https://api.github.com/');
}

function isGitHubReadmeUrl(url: string): boolean {
  return isGitHubApiUrl(url) && url.endsWith('/readme');
}

function isGitHubRepoUrl(url: string): boolean {
  return isGitHubApiUrl(url) && !url.endsWith('/readme');
}

function isTransientError(status: number): boolean {
  return status >= 500 && status < 600;
}

function buildHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'SignalCore-Research/1.0',
  };

  if (isGitHubApiUrl(url)) {
    headers['Accept'] = 'application/vnd.github.v3+json';
  }

  return headers;
}

function makeErrorPage(
  source: ResearchSource,
  errorMessage: string
): FetchedPage {
  return {
    url: source.url,
    text: '',
    title: '',
    publishedAt: null,
    fetchedAt: new Date().toISOString(),
    sourceType: source.sourceType,
    vendorId: source.vendorId,
    status: 'error',
    error: errorMessage,
  };
}

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function attemptFetch(
  url: string,
  headers: Record<string, string>
): Promise<{ response: Response | null; error: string | null }> {
  try {
    const response = await fetchWithTimeout(url, headers);

    if (!response.ok) {
      return {
        response: isTransientError(response.status) ? null : response,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    return { response, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown fetch error';
    return { response: null, error: message };
  }
}

function parseResponse(
  source: ResearchSource,
  body: string
): { text: string; title: string; publishedAt: string | null } {
  if (isGitHubReadmeUrl(source.url)) {
    const json: unknown = JSON.parse(body);
    return parseGitHubReadme(json);
  }

  if (isGitHubRepoUrl(source.url)) {
    const json: unknown = JSON.parse(body);
    return parseGitHubRepo(json);
  }

  return parseHtmlToText(body);
}

export async function fetchPage(
  source: ResearchSource
): Promise<FetchedPage> {
  const cached = cache.get(source.url);
  if (cached) {
    return cached;
  }

  const headers = buildHeaders(source.url);
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { response, error } = await attemptFetch(source.url, headers);

    if (error && !response) {
      lastError = error;
      continue;
    }

    if (response && !response.ok) {
      const errorPage = makeErrorPage(source, error ?? `HTTP ${response.status}`);
      cache.set(source.url, errorPage);
      return errorPage;
    }

    if (response) {
      try {
        const body = await response.text();
        const parsed = parseResponse(source, body);

        const page: FetchedPage = {
          url: source.url,
          text: parsed.text,
          title: parsed.title,
          publishedAt: parsed.publishedAt,
          fetchedAt: new Date().toISOString(),
          sourceType: source.sourceType,
          vendorId: source.vendorId,
          status: 'success',
        };

        cache.set(source.url, page);
        return page;
      } catch (parseErr: unknown) {
        const msg =
          parseErr instanceof Error
            ? parseErr.message
            : 'Failed to parse response';
        const errorPage = makeErrorPage(source, msg);
        cache.set(source.url, errorPage);
        return errorPage;
      }
    }
  }

  const errorPage = makeErrorPage(source, lastError || 'Fetch failed after retries');
  cache.set(source.url, errorPage);
  return errorPage;
}
