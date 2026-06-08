import {
  fetchTranscript,
  YoutubeTranscriptNotAvailableLanguageError,
} from "youtube-transcript-plus";

export type TranscriptSegment = {
  index: number;
  startMs: number;
  durationMs: number;
  text: string;
  timestamp: string;
};

export type TranscriptResult = {
  segments: TranscriptSegment[];
  lang: string;
};

const PREFERRED_TRANSCRIPT_LANGS = ["en", "en-US", "en-GB"] as const;

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function isVideoId(value: string | undefined | null): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{11}$/.test(value));
}

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (isVideoId(trimmed)) {
    return trimmed;
  }

  return extractVideoIdFromUrl(trimmed);
}

function extractVideoIdFromUrl(trimmed: string): string | null {
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return isVideoId(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host.endsWith("youtube-nocookie.com")
    ) {
      const fromQuery = url.searchParams.get("v");
      if (isVideoId(fromQuery)) {
        return fromQuery;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      for (const segment of ["shorts", "embed", "live", "v"] as const) {
        const idx = parts.indexOf(segment);
        const id = idx >= 0 ? parts[idx + 1] : undefined;
        if (isVideoId(id)) {
          return id;
        }
      }
    }
  } catch {
    // Not a parseable URL — try regex on raw text (embedded links, partial URLs).
  }

  const regexMatch = YOUTUBE_ID_REGEX.exec(trimmed);
  return regexMatch?.[1] ?? null;
}

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function mapTranscriptSegments(
  raw: Awaited<ReturnType<typeof fetchTranscript>>,
): TranscriptSegment[] {
  return raw.map((segment, index) => {
    const startMs = Math.round(segment.offset * 1000);
    const durationMs = Math.round(segment.duration * 1000);

    return {
      index,
      startMs,
      durationMs,
      text: segment.text.trim(),
      timestamp: formatTimestamp(startMs),
    };
  });
}

export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  const meta = await fetchVideoMetadata(videoId);
  return meta.title;
}

export function youtubeThumbnailUrl(
  videoId: string,
  quality: "default" | "hq" | "mq" = "hq",
): string {
  const file = quality === "default" ? "default" : quality === "mq" ? "mqdefault" : "hqdefault";
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
}

export type VideoMetadata = {
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  thumbnailUrl: string;
};

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const fallbackThumbnail = youtubeThumbnailUrl(videoId);

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    );
    if (!response.ok) {
      return {
        title: null,
        channelName: null,
        channelUrl: null,
        thumbnailUrl: fallbackThumbnail,
      };
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
    };

    return {
      title: data.title?.trim() ?? null,
      channelName: data.author_name?.trim() ?? null,
      channelUrl: data.author_url?.trim() ?? null,
      thumbnailUrl: data.thumbnail_url?.trim() ?? fallbackThumbnail,
    };
  } catch {
    return {
      title: null,
      channelName: null,
      channelUrl: null,
      thumbnailUrl: fallbackThumbnail,
    };
  }
}

export async function getTranscript(videoId: string): Promise<TranscriptResult> {
  let lastLangError: YoutubeTranscriptNotAvailableLanguageError | null = null;

  for (const lang of PREFERRED_TRANSCRIPT_LANGS) {
    try {
      const raw = await fetchTranscript(videoId, { lang });
      if (raw.length > 0) {
        return { segments: mapTranscriptSegments(raw), lang };
      }
    } catch (error) {
      if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
        lastLangError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastLangError?.availableLangs.length) {
    const englishLike = lastLangError.availableLangs.find((lang) => lang.startsWith("en"));
    const fallbackLang = englishLike ?? lastLangError.availableLangs[0];
    const raw = await fetchTranscript(videoId, { lang: fallbackLang });
    return { segments: mapTranscriptSegments(raw), lang: fallbackLang };
  }

  const raw = await fetchTranscript(videoId);
  return { segments: mapTranscriptSegments(raw), lang: "auto" };
}

export function buildFullText(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => segment.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateDurationSeconds(segments: TranscriptSegment[]): number {
  if (segments.length === 0) return 0;
  const last = segments[segments.length - 1];
  return Math.ceil((last.startMs + last.durationMs) / 1000);
}
