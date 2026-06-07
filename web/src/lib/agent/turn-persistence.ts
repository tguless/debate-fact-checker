import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AgentTurnPayload } from "./types";

export async function persistTurn(
  analysisId: string,
  turnIndex: number,
  data: {
    role: "AGENT" | "TOOL" | "SYSTEM";
    turnType: "THINKING" | "TOOL_CALL" | "TOOL_RESULT" | "MESSAGE" | "COMPLETE" | "ERROR";
    content?: string;
    toolName?: string;
    toolInput?: unknown;
    toolOutput?: unknown;
  },
): Promise<AgentTurnPayload> {
  const turn = await prisma.agentTurn.create({
    data: {
      analysisId,
      turnIndex,
      role: data.role,
      turnType: data.turnType,
      content: data.content ?? null,
      toolName: data.toolName ?? null,
      toolInput: data.toolInput ? (data.toolInput as Prisma.InputJsonValue) : undefined,
      toolOutput: data.toolOutput ? (data.toolOutput as Prisma.InputJsonValue) : undefined,
    },
  });

  return {
    id: turn.id,
    turnIndex: turn.turnIndex,
    role: turn.role,
    turnType: turn.turnType,
    content: turn.content,
    toolName: turn.toolName,
    toolInput: turn.toolInput,
    toolOutput: turn.toolOutput,
    createdAt: turn.createdAt.toISOString(),
  };
}
