/** Port of upstream ParsedAssistantUsage (session_usage.rs). */
export type AssistantUsage = {
  messageId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  stopReason: string | null;
  timestamp: string | null;
  sessionId: string | null;
};

export type ParseResult = {
  entries: AssistantUsage[];
  skipped: number;
};

export type ModelRow = {
  model: string;
  decisions: number;
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
  tokens_per_decision: number;
  /** Present only when --prices was supplied. Labeled "your prices" in text output. */
  your_prices_usd?: number;
};

export type SessionRow = {
  sessionId: string;
  decisions: number;
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
  tokens_per_decision: number;
  your_prices_usd?: number;
};

export type LedgerReport = {
  filesScanned: number;
  skipped: number;
  decisions: number;
  byModel: ModelRow[];
  bySession: SessionRow[];
};

export type TokenPrices = {
  /** USD per 1M tokens */
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
};
