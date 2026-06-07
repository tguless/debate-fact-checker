export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type ReadUrlResult = {
  url: string;
  content: string;
  truncated: boolean;
  charCount: number;
  source: "tavily-extract" | "fetch-fallback";
  failed?: string;
};

const MAX_READ_URL_CHARS = 12_000;

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    return searchTavily(query, maxResults, tavilyKey);
  }

  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    return searchSerper(query, maxResults, serperKey);
  }

  return searchDuckDuckGoInstant(query, maxResults);
}

async function searchTavily(
  query: string,
  maxResults: number,
  apiKey: string,
): Promise<SearchResult[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ title: string; url: string; content: string }>;
  };

  return (data.results ?? []).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.content,
  }));
}

async function searchSerper(
  query: string,
  maxResults: number,
  apiKey: string,
): Promise<SearchResult[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`Serper search failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    organic?: Array<{ title: string; link: string; snippet: string }>;
  };

  return (data.organic ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
  }));
}

async function searchDuckDuckGoInstant(
  query: string,
  maxResults: number,
): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string } | { Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
  };

  const results: SearchResult[] = [];

  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.Heading ?? "Summary",
      url: data.AbstractURL,
      snippet: data.AbstractText,
    });
  }

  for (const topic of data.RelatedTopics ?? []) {
    if (results.length >= maxResults) break;
    if ("Topics" in topic && topic.Topics) {
      for (const sub of topic.Topics) {
        if (sub.Text && sub.FirstURL) {
          results.push({ title: sub.Text.slice(0, 80), url: sub.FirstURL, snippet: sub.Text });
        }
      }
    } else if ("Text" in topic && topic.Text && topic.FirstURL) {
      results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
    }
  }

  if (results.length === 0) {
    return [
      {
        title: "No instant results",
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet:
          "DuckDuckGo instant API returned no results. Set TAVILY_API_KEY or SERPER_API_KEY for richer search.",
      },
    ];
  }

  return results.slice(0, maxResults);
}

export async function readUrl(
  url: string,
  options?: { query?: string },
): Promise<ReadUrlResult> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    return readUrlTavily(url, tavilyKey, options?.query);
  }

  return readUrlFallback(url);
}

async function readUrlTavily(
  url: string,
  apiKey: string,
  query?: string,
): Promise<ReadUrlResult> {
  const body: Record<string, unknown> = {
    urls: [url],
    format: "markdown",
    extract_depth: "basic",
  };

  if (query?.trim()) {
    body.query = query.trim();
    body.chunks_per_source = 3;
  }

  const response = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Tavily extract failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ url: string; raw_content: string }>;
    failed_results?: Array<{ url: string; error: string }>;
  };

  const failed = data.failed_results?.find((item) => item.url === url);
  if (failed) {
    return {
      url,
      content: "",
      truncated: false,
      charCount: 0,
      source: "tavily-extract",
      failed: failed.error,
    };
  }

  const raw = data.results?.[0]?.raw_content ?? "";
  const { content, truncated } = truncateContent(raw);

  return {
    url,
    content,
    truncated,
    charCount: content.length,
    source: "tavily-extract",
  };
}

async function readUrlFallback(url: string): Promise<ReadUrlResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "DebateFactChecker/1.0 (research; +https://localhost)",
      Accept: "text/html,text/plain,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const text = stripHtmlToText(html);
  const { content, truncated } = truncateContent(text);

  return {
    url,
    content,
    truncated,
    charCount: content.length,
    source: "fetch-fallback",
    failed:
      content.length < 200
        ? "Extracted very little text. Set TAVILY_API_KEY for reliable full-page reads."
        : undefined,
  };
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateContent(raw: string): { content: string; truncated: boolean } {
  if (raw.length <= MAX_READ_URL_CHARS) {
    return { content: raw, truncated: false };
  }

  return {
    content: `${raw.slice(0, MAX_READ_URL_CHARS)}\n\n[... truncated — ${raw.length - MAX_READ_URL_CHARS} more characters omitted ...]`,
    truncated: true,
  };
}
