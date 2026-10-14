import type { AssistantUsage } from "./types.ts";

/**
 * Upstream dedup (session_usage.rs):
 * - Same message.id → keep the entry that has stop_reason when the other lacks it.
 * - When both have or both lack stop_reason → keep higher output_tokens.
 */
export function shouldReplace(
  existing: AssistantUsage,
  incoming: AssistantUsage,
): boolean {
  if (incoming.stopReason != null && existing.stopReason == null) {
    return true;
  }
  if (
    (incoming.stopReason != null) === (existing.stopReason != null) &&
    incoming.outputTokens > existing.outputTokens
  ) {
    return true;
  }
  return false;
}

export function dedupByMessageId(entries: AssistantUsage[]): AssistantUsage[] {
  const map = new Map<string, AssistantUsage>();
  for (const entry of entries) {
    const existing = map.get(entry.messageId);
    if (!existing || shouldReplace(existing, entry)) {
      map.set(entry.messageId, entry);
    }
  }
  return [...map.values()];
}

/** True when any billable dimension is > 0 (upstream has_billable_tokens). */
export function hasBillableTokens(msg: AssistantUsage): boolean {
  return (
    msg.inputTokens > 0 ||
    msg.outputTokens > 0 ||
    msg.cacheReadTokens > 0 ||
    msg.cacheCreationTokens > 0
  );
}

/** Dedup then drop all-zero placeholders. */
export function importBillable(entries: AssistantUsage[]): AssistantUsage[] {
  return dedupByMessageId(entries).filter(hasBillableTokens);
}
