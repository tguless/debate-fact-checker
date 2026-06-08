/** In-memory registry of active agent runs (single Node process / one container). */
const activeRuns = new Map<string, AbortController>();

export function registerAgentRun(analysisId: string): AbortController {
  const existing = activeRuns.get(analysisId);
  if (existing) {
    existing.abort();
  }

  const controller = new AbortController();
  activeRuns.set(analysisId, controller);
  return controller;
}

export function unregisterAgentRun(analysisId: string): void {
  activeRuns.delete(analysisId);
}

export function cancelAgentRun(analysisId: string): boolean {
  const controller = activeRuns.get(analysisId);
  if (!controller) {
    return false;
  }

  controller.abort();
  activeRuns.delete(analysisId);
  return true;
}

export function isAgentRunActive(analysisId: string): boolean {
  return activeRuns.has(analysisId);
}
