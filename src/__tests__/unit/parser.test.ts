import { describe, it, expect } from 'vitest';
import { parseHtmlToText, parseGitHubReadme, parseGitHubRepo } from '@/lib/research/parser';

describe('parseHtmlToText', () => {
  it('extracts title from <title> tag', () => {
    const html = '<html><head><title>LangSmith Documentation</title></head><body><p>Hello</p></body></html>';
    const result = parseHtmlToText(html);
    expect(result.title).toBe('LangSmith Documentation');
  });

  it('decodes HTML entities in title', () => {
    const html = '<html><head><title>Braintrust &amp; Evaluation</title></head><body><p>Content</p></body></html>';
    const result = parseHtmlToText(html);
    expect(result.title).toBe('Braintrust & Evaluation');
  });

  it('returns empty title when no <title> tag exists', () => {
    const html = '<html><body><p>No title here</p></body></html>';
    const result = parseHtmlToText(html);
    expect(result.title).toBe('');
  });

  it('strips script and style tags from output', () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <script>var x = "should not appear";</script>
          <style>.hidden { display: none; }</style>
          <p>Visible paragraph content</p>
        </body>
      </html>
    `;
    const result = parseHtmlToText(html);
    expect(result.text).toContain('Visible paragraph content');
    expect(result.text).not.toContain('should not appear');
    expect(result.text).not.toContain('display: none');
  });

  it('strips nav, header, footer, and noscript tags', () => {
    const html = `
      <html><body>
        <nav><p>Navigation link</p></nav>
        <header><p>Header text</p></header>
        <p>Main content</p>
        <footer><p>Footer text</p></footer>
        <noscript><p>Enable JS</p></noscript>
      </body></html>
    `;
    const result = parseHtmlToText(html);
    expect(result.text).toContain('Main content');
    expect(result.text).not.toContain('Navigation link');
    expect(result.text).not.toContain('Header text');
    expect(result.text).not.toContain('Footer text');
    expect(result.text).not.toContain('Enable JS');
  });

  it('extracts text from paragraphs, headings, and list items', () => {
    const html = `
      <html><body>
        <h1>Main Heading</h1>
        <h2>Sub Heading</h2>
        <p>First paragraph with details.</p>
        <ul>
          <li>List item one</li>
          <li>List item two</li>
        </ul>
        <p>Second paragraph.</p>
      </body></html>
    `;
    const result = parseHtmlToText(html);
    expect(result.text).toContain('Main Heading');
    expect(result.text).toContain('Sub Heading');
    expect(result.text).toContain('First paragraph with details.');
    expect(result.text).toContain('List item one');
    expect(result.text).toContain('Second paragraph.');
  });

  it('truncates output to 3000 characters', () => {
    const longParagraph = 'A'.repeat(4000);
    const html = `<html><body><p>${longParagraph}</p></body></html>`;
    const result = parseHtmlToText(html);
    expect(result.text.length).toBeLessThanOrEqual(3003); // 3000 + '...'
    expect(result.text.endsWith('...')).toBe(true);
  });

  it('does not truncate text under 3000 characters', () => {
    const shortParagraph = 'Short content here.';
    const html = `<html><body><p>${shortParagraph}</p></body></html>`;
    const result = parseHtmlToText(html);
    expect(result.text).toBe(shortParagraph);
    expect(result.text.endsWith('...')).toBe(false);
  });

  it('extracts publish date from article:published_time meta tag', () => {
    const html = `
      <html>
        <head>
          <meta property="article:published_time" content="2025-11-15T10:00:00Z">
        </head>
        <body><p>Article content</p></body>
      </html>
    `;
    const result = parseHtmlToText(html);
    expect(result.publishedAt).toBe('2025-11-15T10:00:00Z');
  });

  it('extracts publish date from datePublished meta tag', () => {
    const html = `
      <html>
        <head>
          <meta name="datePublished" content="2025-08-20">
        </head>
        <body><p>Content</p></body>
      </html>
    `;
    const result = parseHtmlToText(html);
    expect(result.publishedAt).toBe('2025-08-20');
  });

  it('extracts publish date from JSON-LD datePublished', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {"@type": "Article", "datePublished": "2025-06-01T12:00:00Z"}
          </script>
        </head>
        <body><p>Content</p></body>
      </html>
    `;
    const result = parseHtmlToText(html);
    expect(result.publishedAt).toBe('2025-06-01T12:00:00Z');
  });

  it('extracts publish date from <time> datetime attribute', () => {
    const html = `
      <html><body>
        <time datetime="2025-03-10">March 10, 2025</time>
        <p>Content</p>
      </body></html>
    `;
    const result = parseHtmlToText(html);
    expect(result.publishedAt).toBe('2025-03-10');
  });

  it('returns null publishedAt when no date metadata exists', () => {
    const html = '<html><body><p>No date here</p></body></html>';
    const result = parseHtmlToText(html);
    expect(result.publishedAt).toBeNull();
  });

  it('decodes HTML entities in extracted text', () => {
    const html = '<html><body><p>LangSmith &amp; Langfuse &lt;comparison&gt;</p></body></html>';
    const result = parseHtmlToText(html);
    expect(result.text).toContain('LangSmith & Langfuse <comparison>');
  });
});

describe('parseGitHubReadme', () => {
  it('decodes base64 content and strips markdown formatting', () => {
    // "# Langfuse\n\nOpen-source **LLM engineering** platform." in base64
    const markdown = '# Langfuse\n\nOpen-source **LLM engineering** platform.';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({
      name: 'README.md',
      content: encoded,
    });

    expect(result.text).toContain('Langfuse');
    expect(result.text).toContain('Open-source LLM engineering platform.');
    expect(result.text).not.toContain('**');
    expect(result.text).not.toContain('#');
  });

  it('handles base64 content with newlines (as GitHub returns)', () => {
    const markdown = '# Test Repository\n\nSome description here.';
    const base64WithNewlines = Buffer.from(markdown)
      .toString('base64')
      .match(/.{1,76}/g)!
      .join('\n');

    const result = parseGitHubReadme({
      name: 'README.md',
      content: base64WithNewlines,
    });

    expect(result.text).toContain('Test Repository');
    expect(result.text).toContain('Some description here.');
  });

  it('strips markdown links but keeps link text', () => {
    const markdown = 'Check [the docs](https://example.com) for details.';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({ name: 'README.md', content: encoded });
    expect(result.text).toContain('Check the docs for details.');
    expect(result.text).not.toContain('https://example.com');
  });

  it('strips markdown images', () => {
    const markdown = '![Logo](https://example.com/logo.png)\n\nContent after image.';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({ name: 'README.md', content: encoded });
    expect(result.text).not.toContain('https://example.com/logo.png');
    expect(result.text).toContain('Content after image.');
  });

  it('strips code block fences', () => {
    const markdown = 'Install:\n\n```bash\nnpm install langfuse\n```\n\nDone.';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({ name: 'README.md', content: encoded });
    expect(result.text).not.toContain('```');
    expect(result.text).toContain('Done.');
  });

  it('extracts title from first non-empty line of content', () => {
    const markdown = '\n\nLangfuse SDK\n\nSome description.';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({ name: 'README.md', content: encoded });
    expect(result.title).toBe('Langfuse SDK');
  });

  it('uses name as title when content is empty', () => {
    const result = parseGitHubReadme({ name: 'README.md', content: '' });
    expect(result.title).toBe('README.md');
    expect(result.text).toBe('');
  });

  it('returns empty values for null/invalid input', () => {
    const result = parseGitHubReadme(null);
    expect(result.text).toBe('');
    expect(result.title).toBe('');
    expect(result.publishedAt).toBeNull();
  });

  it('always returns null for publishedAt', () => {
    const markdown = '# Title';
    const encoded = Buffer.from(markdown).toString('base64');

    const result = parseGitHubReadme({ name: 'README.md', content: encoded });
    expect(result.publishedAt).toBeNull();
  });
});

describe('parseGitHubRepo', () => {
  const repoFixture = {
    full_name: 'langfuse/langfuse',
    description: 'Open source LLM engineering platform',
    language: 'TypeScript',
    stargazers_count: 21500,
    forks_count: 1200,
    open_issues_count: 150,
    license: { name: 'MIT License' },
    topics: ['llm', 'observability', 'tracing'],
    pushed_at: '2026-02-20T08:30:00Z',
    created_at: '2023-05-01T00:00:00Z',
    html_url: 'https://github.com/langfuse/langfuse',
    homepage: 'https://langfuse.com',
  };

  it('extracts repo metadata into text', () => {
    const result = parseGitHubRepo(repoFixture);

    expect(result.text).toContain('Repository: langfuse/langfuse');
    expect(result.text).toContain('Description: Open source LLM engineering platform');
    expect(result.text).toContain('Primary language: TypeScript');
    expect(result.text).toContain('Stars: 21,500');
    expect(result.text).toContain('Forks: 1,200');
    expect(result.text).toContain('Open issues: 150');
    expect(result.text).toContain('License: MIT License');
    expect(result.text).toContain('Topics: llm, observability, tracing');
    expect(result.text).toContain('Homepage: https://langfuse.com');
    expect(result.text).toContain('URL: https://github.com/langfuse/langfuse');
  });

  it('uses full_name as title', () => {
    const result = parseGitHubRepo(repoFixture);
    expect(result.title).toBe('langfuse/langfuse');
  });

  it('uses pushed_at as publishedAt', () => {
    const result = parseGitHubRepo(repoFixture);
    expect(result.publishedAt).toBe('2026-02-20T08:30:00Z');
  });

  it('returns null publishedAt when pushed_at is missing', () => {
    const { pushed_at: _, ...repoWithoutPushedAt } = repoFixture;
    const result = parseGitHubRepo(repoWithoutPushedAt);
    expect(result.publishedAt).toBeNull();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalRepo = {
      full_name: 'test/repo',
    };
    const result = parseGitHubRepo(minimalRepo);

    expect(result.text).toContain('Repository: test/repo');
    expect(result.text).not.toContain('Description:');
    expect(result.text).not.toContain('License:');
    expect(result.text).not.toContain('Topics:');
    expect(result.title).toBe('test/repo');
  });

  it('handles null license field', () => {
    const repoWithNullLicense = { ...repoFixture, license: null };
    const result = parseGitHubRepo(repoWithNullLicense);
    expect(result.text).not.toContain('License:');
  });

  it('handles empty topics array', () => {
    const repoWithNoTopics = { ...repoFixture, topics: [] };
    const result = parseGitHubRepo(repoWithNoTopics);
    expect(result.text).not.toContain('Topics:');
  });

  it('returns empty values for null/invalid input', () => {
    const result = parseGitHubRepo(null);
    expect(result.text).toBe('');
    expect(result.title).toBe('');
    expect(result.publishedAt).toBeNull();
  });
});
