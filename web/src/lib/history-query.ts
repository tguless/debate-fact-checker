import type { AnalysisStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
  { value: "title_asc", label: "Title A–Z" },
] as const;

export type HistorySort = (typeof HISTORY_SORT_OPTIONS)[number]["value"];

export type HistoryQueryInput = {
  q?: string;
  status?: string;
  mode?: string;
  sort?: string;
  page?: string | number;
};

export type HistoryListItem = {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  thumbnailUrl: string | null;
  status: AnalysisStatus;
  overallScore: number | null;
  segmentCount: number;
  durationSeconds: number | null;
  summary: string | null;
  agentMode: boolean;
  createdAt: string;
  claimCount: number;
};

export type HistoryQueryResult = {
  items: HistoryListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const ANALYSIS_STATUSES = new Set<string>([
  "PENDING",
  "FETCHING_TRANSCRIPT",
  "ANALYZING",
  "AGENT_RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

function parsePage(value: string | number | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseSort(value: string | undefined): HistorySort {
  const allowed = new Set<string>(HISTORY_SORT_OPTIONS.map((option) => option.value));
  if (value && allowed.has(value)) {
    return value as HistorySort;
  }
  return "createdAt_desc";
}

function buildOrderBy(sort: HistorySort): Prisma.AnalysisOrderByWithRelationInput {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: "asc" };
    case "score_desc":
      return { overallScore: { sort: "desc", nulls: "last" } };
    case "score_asc":
      return { overallScore: { sort: "asc", nulls: "last" } };
    case "title_asc":
      return { title: { sort: "asc", nulls: "last" } };
    case "createdAt_desc":
    default:
      return { createdAt: "desc" };
  }
}

function buildWhere(input: HistoryQueryInput): Prisma.AnalysisWhereInput {
  const where: Prisma.AnalysisWhereInput = {};
  const query = input.q?.trim();

  if (query) {
    where.OR = [
      { videoId: { contains: query, mode: "insensitive" } },
      { videoUrl: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { channelName: { contains: query, mode: "insensitive" } },
      { summary: { contains: query, mode: "insensitive" } },
    ];
  }

  if (input.status && input.status !== "ALL" && ANALYSIS_STATUSES.has(input.status)) {
    where.status = input.status as AnalysisStatus;
  }

  if (input.mode === "agent") {
    where.agentMode = true;
  } else if (input.mode === "quick") {
    where.agentMode = false;
  }

  return where;
}

export async function queryAnalysisHistory(
  input: HistoryQueryInput,
): Promise<HistoryQueryResult> {
  const page = parsePage(input.page);
  const sort = parseSort(input.sort);
  const where = buildWhere(input);

  const total = await prisma.analysis.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * HISTORY_PAGE_SIZE;

  const rows = await prisma.analysis.findMany({
    where,
    orderBy: buildOrderBy(sort),
    skip,
    take: HISTORY_PAGE_SIZE,
    select: {
      id: true,
      videoId: true,
      videoUrl: true,
      title: true,
      channelName: true,
      channelUrl: true,
      thumbnailUrl: true,
      status: true,
      overallScore: true,
      segmentCount: true,
      durationSeconds: true,
      summary: true,
      agentMode: true,
      createdAt: true,
      _count: { select: { claims: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      videoId: row.videoId,
      videoUrl: row.videoUrl,
      title: row.title,
      channelName: row.channelName,
      channelUrl: row.channelUrl,
      thumbnailUrl: row.thumbnailUrl,
      status: row.status,
      overallScore: row.overallScore,
      segmentCount: row.segmentCount,
      durationSeconds: row.durationSeconds,
      summary: row.summary,
      agentMode: row.agentMode,
      createdAt: row.createdAt.toISOString(),
      claimCount: row._count.claims,
    })),
    total,
    page: safePage,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages,
  };
}

export function buildHistorySearchParams(
  current: HistoryQueryInput,
  updates: Partial<HistoryQueryInput>,
): URLSearchParams {
  const merged = { ...current, ...updates };

  const params = new URLSearchParams();
  if (merged.q?.trim()) params.set("q", merged.q.trim());
  if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
  if (merged.mode && merged.mode !== "all") params.set("mode", merged.mode);
  if (merged.sort && merged.sort !== "createdAt_desc") params.set("sort", merged.sort);
  if (merged.page && Number(merged.page) > 1) params.set("page", String(merged.page));

  return params;
}
