export type AgentTurnPayload = {
  id: string;
  turnIndex: number;
  role: string;
  turnType: string;
  content: string | null;
  toolName: string | null;
  toolInput: unknown;
  toolOutput: unknown;
  createdAt: string;
};

export type TurnEvent =
  | { type: "turn"; turn: AgentTurnPayload }
  | { type: "done"; analysisId: string }
  | { type: "error"; message: string };
