import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      videoUrl: true,
      videoId: true,
      status: true,
      overallScore: true,
      segmentCount: true,
      durationSeconds: true,
      summary: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ analyses });
}
