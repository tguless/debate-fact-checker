import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HistoryPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const analyses = await prisma.analysis.findMany({
    where: query
      ? {
          OR: [
            { videoId: { contains: query, mode: "insensitive" } },
            { videoUrl: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      videoId: true,
      videoUrl: true,
      status: true,
      overallScore: true,
      segmentCount: true,
      durationSeconds: true,
      summary: true,
      createdAt: true,
      _count: { select: { claims: true } },
    },
  });

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          ← Back to home
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-5" />
            <h1 className="font-heading text-3xl font-semibold">Analysis history</h1>
          </div>
          <p className="text-muted-foreground">
            Search past analyses by video ID, URL, or summary text.
          </p>
        </div>

        <form method="get" className="flex gap-3">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search video ID or keywords..."
            className="h-11"
          />
          <button type="submit" className={cn(buttonVariants(), "h-11 px-6")}>
            Search
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No analyses found.
              </CardContent>
            </Card>
          ) : (
            analyses.map((item) => (
              <Link key={item.id} href={`/analyses/${item.id}`}>
                <Card className="border-border/60 transition-colors hover:bg-muted/30">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="font-mono text-sm">{item.videoId}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {item.summary ?? item.videoUrl}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      {item.overallScore ? (
                        <span className="text-sm font-medium">
                          {Math.round(item.overallScore)}/100
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{item._count.claims} claims flagged</span>
                    <span>·</span>
                    <span>{item.segmentCount} segments</span>
                    <span>·</span>
                    <span>{item.createdAt.toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
