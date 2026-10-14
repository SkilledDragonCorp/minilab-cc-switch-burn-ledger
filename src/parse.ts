import type { AssistantUsage, ParseResult } from "./types.ts";

function asU32(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return 0;
}

/**
 * Parse one JSONL line using upstream session_usage rules:
 * accept only `type === "assistant"` with `message.usage`.
 * Malformed JSON never throws — counted via skipped when using parseLines.
 */
export function parseLine(line: string): AssistantUsage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (obj.type !== "assistant") return null;

  const message = obj.message;
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  const id = msg.id;
  if (typeof id !== "string" || id.length === 0) return null;

  const usage = msg.usage;
  if (!usage || typeof usage !== "object") return null;
  const u = usage as Record<string, unknown>;

  const model =
    typeof msg.model === "string" && msg.model.length > 0 ? msg.model : "unknown";

  const stopRaw = msg.stop_reason;
  const stopReason = typeof stopRaw === "string" ? stopRaw : null;

  const timestamp =
    typeof obj.timestamp === "string" ? obj.timestamp : null;
  const sessionId =
    typeof obj.sessionId === "string" ? obj.sessionId : null;

  return {
    messageId: id,
    model,
    inputTokens: asU32(u.input_tokens),
    outputTokens: asU32(u.output_tokens),
    cacheReadTokens: asU32(u.cache_read_input_tokens),
    cacheCreationTokens: asU32(u.cache_creation_input_tokens),
    stopReason,
    timestamp,
    sessionId,
  };
}

/** Parse many lines; non-empty lines that fail to parse increment skipped. */
export function parseLines(text: string): ParseResult {
  const entries: AssistantUsage[] = [];
  let skipped = 0;

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      JSON.parse(line.trim());
    } catch {
      skipped += 1;
      continue;
    }
    const entry = parseLine(line);
    if (entry) entries.push(entry);
  }

  return { entries, skipped };
}
