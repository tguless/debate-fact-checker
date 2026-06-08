export function youtubeThumbnailUrl(
  videoId: string,
  quality: "default" | "hq" | "mq" = "hq",
): string {
  const file = quality === "default" ? "default" : quality === "mq" ? "mqdefault" : "hqdefault";
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
}

export function resolveAnalysisThumbnail(input: {
  videoId: string;
  thumbnailUrl?: string | null;
}): string {
  return input.thumbnailUrl?.trim() || youtubeThumbnailUrl(input.videoId);
}

export function resolveAnalysisTitle(input: {
  videoId: string;
  title?: string | null;
}): string {
  return input.title?.trim() || input.videoId;
}

export function resolveAnalysisChannel(input: {
  channelName?: string | null;
}): string | null {
  return input.channelName?.trim() || null;
}
