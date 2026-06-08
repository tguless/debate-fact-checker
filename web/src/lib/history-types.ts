export type HistoryListItem = {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  overallScore: number | null;
  segmentCount: number;
  durationSeconds: number | null;
  summary: string | null;
  agentMode: boolean;
  createdAt: string;
  claimCount: number;
};

export type HistoryQueryInput = {
  q?: string;
  status?: string;
  mode?: string;
  sort?: string;
  page?: string | number;
};
