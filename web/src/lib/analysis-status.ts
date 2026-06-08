/** Statuses where a user-initiated cancel still makes sense. */
export const CANCELLABLE_STATUSES = new Set([
  "PENDING",
  "FETCHING_TRANSCRIPT",
  "ANALYZING",
  "AGENT_RUNNING",
]);

export const RUNNING_STATUSES = new Set([...CANCELLABLE_STATUSES]);

export function isCancellableStatus(status: string): boolean {
  return CANCELLABLE_STATUSES.has(status);
}

export function isRunningStatus(status: string): boolean {
  return RUNNING_STATUSES.has(status);
}
