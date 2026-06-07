import { fetchTranscript } from "youtube-transcript-plus";

export type TranscriptSegment = {
  index: number;
  startMs: number;
  durationMs: number;
  text: string;
  timestamp: string;
};

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match?.[1] ?? null;
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

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await fetchTranscript(videoId);

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
