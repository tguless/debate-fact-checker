import { youtubeThumbnailUrl } from "@/lib/youtube";

type VideoDisplayInput = {
  videoId: string;
  title?: string | null;
  channelName?: string | null;
  channelUrl?: string | null;
  thumbnailUrl?: string | null;
};

export function resolveAnalysisThumbnail(input: VideoDisplayInput): string {
  return input.thumbnailUrl?.trim() || youtubeThumbnailUrl(input.videoId);
}

export function resolveAnalysisTitle(input: VideoDisplayInput): string {
  return input.title?.trim() || input.videoId;
}

export function resolveAnalysisChannel(input: VideoDisplayInput): string | null {
  return input.channelName?.trim() || null;
}
