/**
 * Multi-turn agent via Vercel AI SDK ToolLoopAgent.
 * The agent orchestrates its own steps — we do not hardcode a pipeline.
 *
 * @see https://ai-sdk.dev/docs/agents/overview
 * @see https://ai-sdk.dev/docs/agents/building-agents
 */
import { openai } from "@ai-sdk/openai";
import { stepCountIs, ToolLoopAgent } from "ai";
import { prisma } from "@/lib/prisma";
import { createAgentTools } from "./ai-tools";
import { finalizeAnalysisOnStepLimit } from "./finalize-on-limit";
import { persistTurn } from "./turn-persistence";
import type { ToolContext } from "./tool-executors";
import type { TurnEvent } from "./types";

const DEFAULT_MAX_STEPS = 50;

function resolveMaxSteps(): number {
  const parsed = Number(process.env.AGENT_MAX_STEPS ?? DEFAULT_MAX_STEPS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_STEPS;
}

export async function* runAgentAnalysis(
  analysisId: string,
  videoId: string,
  videoUrl: string,
): AsyncGenerator<TurnEvent> {
  let turnIndex = 0;
  const ctx: ToolContext = {
    analysisId,
    videoId,
    segments: [],
    fullText: "",
  };

  await prisma.analysis.update({
    where: { id: analysisId },
    data: { status: "AGENT_RUNNING" },
  });

  const startTurn = await persistTurn(analysisId, turnIndex++, {
    role: "SYSTEM",
    turnType: "MESSAGE",
    content:
      "Agent run started via Vercel AI SDK ToolLoopAgent. Orchestration delegated to agent + Cursor skill.",
  });
  yield { type: "turn", turn: startTurn };

  const maxSteps = resolveMaxSteps();

  const agent = new ToolLoopAgent({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o"),
    instructions: `You are an autonomous debate fact-checking agent for: ${videoUrl}

Use the read_skill tool first. You decide the order of all subsequent tools.
Framework: Vercel AI SDK ToolLoopAgent + LangChain transcript RAG + web search.

Step budget: ${maxSteps} tool-loop steps. Each search/read/record counts.
- Prioritize depth on 6–10 major claims over exhaustive coverage.
- After recording claims and technique findings, call finish_analysis — do not keep searching.
- You MUST call finish_analysis before the step limit. If running low on steps, skip new claims and finish with what you have.`,
    tools: createAgentTools(ctx),
    stopWhen: stepCountIs(maxSteps),
  });

  try {
    let finished = false;
    let stepText = "";

    const streamResult = await agent.stream({
      prompt: `Begin fact-check analysis for YouTube video ${videoId}. Read your skill, then work autonomously.`,
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === "text-delta") {
        stepText += part.text;
      }

      if (part.type === "finish-step" && stepText.trim()) {
        const thinkTurn = await persistTurn(analysisId, turnIndex++, {
          role: "AGENT",
          turnType: "THINKING",
          content: stepText.trim(),
        });
        yield { type: "turn", turn: thinkTurn };
        stepText = "";
      }

      if (part.type === "tool-call") {
        const input = "input" in part ? part.input : undefined;
        const callTurn = await persistTurn(analysisId, turnIndex++, {
          role: "AGENT",
          turnType: "TOOL_CALL",
          content: `Calling ${part.toolName}`,
          toolName: part.toolName,
          toolInput: input,
        });
        yield { type: "turn", turn: callTurn };
      }

      if (part.type === "tool-result") {
        const output = "output" in part ? part.output : part;
        const resultTurn = await persistTurn(analysisId, turnIndex++, {
          role: "TOOL",
          turnType: "TOOL_RESULT",
          toolName: part.toolName,
          toolOutput: output,
          content: JSON.stringify(output, null, 2).slice(0, 4000),
        });
        yield { type: "turn", turn: resultTurn };

        if (part.toolName === "finish_analysis") {
          if (output && typeof output === "object" && "completed" in output) {
            finished = true;
          }
        }
      }

      if (part.type === "tool-error") {
        const errorTurn = await persistTurn(analysisId, turnIndex++, {
          role: "TOOL",
          turnType: "ERROR",
          toolName: part.toolName,
          content: String("error" in part ? part.error : "Tool error"),
        });
        yield { type: "turn", turn: errorTurn };
      }
    }

    if (finished) {
      const doneTurn = await persistTurn(analysisId, turnIndex++, {
        role: "SYSTEM",
        turnType: "COMPLETE",
        content: "Analysis complete.",
      });
      yield { type: "turn", turn: doneTurn };
      yield { type: "done", analysisId };
      return;
    }

    const { summary, overallScore } = await finalizeAnalysisOnStepLimit(
      analysisId,
      maxSteps,
    );

    const limitTurn = await persistTurn(analysisId, turnIndex++, {
      role: "SYSTEM",
      turnType: "COMPLETE",
      content: `Step limit (${maxSteps}) reached — auto-finalized with score ${overallScore}/100.`,
    });
    yield { type: "turn", turn: limitTurn };

    const summaryTurn = await persistTurn(analysisId, turnIndex++, {
      role: "SYSTEM",
      turnType: "MESSAGE",
      content: summary,
    });
    yield { type: "turn", turn: summaryTurn };
    yield { type: "done", analysisId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent run failed";

    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", errorMessage: message },
    });

    const errorTurn = await persistTurn(analysisId, turnIndex++, {
      role: "SYSTEM",
      turnType: "ERROR",
      content: message,
    });
    yield { type: "turn", turn: errorTurn };
    yield { type: "error", message };
  }
}
