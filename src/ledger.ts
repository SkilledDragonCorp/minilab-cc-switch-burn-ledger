import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import {
  dedupByMessageId,
  hasBillableTokens,
  importBillable,
} from "./dedup.ts";
import { parseLines } from "./parse.ts";
import type {
  AssistantUsage,
  LedgerReport,
  ModelRow,
  SessionRow,
  TokenPrices,
} from "./types.ts";

function costUsd(m: AssistantUsage, prices: TokenPrices): number {
  const m1 = 1_000_000;
  return (
    (m.inputTokens * prices.input +
      m.outputTokens * prices.output +
      m.cacheReadTokens * prices.cache_read +
      m.cacheCreationTokens * prices.cache_creation) /
    m1
  );
}

function aggregate(
  entries: AssistantUsage[],
  prices?: TokenPrices,
): { byModel: ModelRow[]; bySession: SessionRow[] } {
  type Acc = {
    decisions: number;
    input: number;
    output: number;
    cache_read: number;
    cache_creation: number;
    cost: number;
  };

  const modelMap = new Map<string, Acc>();
  const sessionMap = new Map<string, Acc>();

  const bump = (map: Map<string, Acc>, key: string, m: AssistantUsage) => {
    const cur = map.get(key) ?? {
      decisions: 0,
      input: 0,
      output: 0,
      cache_read: 0,
      cache_creation: 0,
      cost: 0,
    };
    cur.decisions += 1;
    cur.input += m.inputTokens;
    cur.output += m.outputTokens;
    cur.cache_read += m.cacheReadTokens;
    cur.cache_creation += m.cacheCreationTokens;
    if (prices) cur.cost += costUsd(m, prices);
    map.set(key, cur);
  };

  for (const m of entries) {
    bump(modelMap, m.model, m);
    bump(sessionMap, m.sessionId ?? "(unknown)", m);
  }

  const toModel = ([model, v]: [string, Acc]): ModelRow => {
    const tokens = v.input + v.output + v.cache_read + v.cache_creation;
    const row: ModelRow = {
      model,
      decisions: v.decisions,
      input: v.input,
      output: v.output,
      cache_read: v.cache_read,
      cache_creation: v.cache_creation,
      tokens_per_decision:
        v.decisions === 0 ? 0 : Math.round((tokens / v.decisions) * 100) / 100,
    };
    if (prices) row.your_prices_usd = Math.round(v.cost * 1e6) / 1e6;
    return row;
  };

  const toSession = ([sessionId, v]: [string, Acc]): SessionRow => {
    const tokens = v.input + v.output + v.cache_read + v.cache_creation;
    const row: SessionRow = {
      sessionId,
      decisions: v.decisions,
      input: v.input,
      output: v.output,
      cache_read: v.cache_read,
      cache_creation: v.cache_creation,
      tokens_per_decision:
        v.decisions === 0 ? 0 : Math.round((tokens / v.decisions) * 100) / 100,
    };
    if (prices) row.your_prices_usd = Math.round(v.cost * 1e6) / 1e6;
    return row;
  };

  return {
    byModel: [...modelMap.entries()].map(toModel).sort((a, b) =>
      a.model.localeCompare(b.model),
    ),
    bySession: [...sessionMap.entries()]
      .map(toSession)
      .sort((a, b) => a.sessionId.localeCompare(b.sessionId)),
  };
}

/**
 * Ensure candidate resolves under rootDir. Rejects symlink escape.
 */
export function assertPathInsideRoot(rootDir: string, candidate: string): string {
  const rootReal = realpathSync(rootDir);
  let candidateReal: string;
  try {
    candidateReal = realpathSync(candidate);
  } catch {
    throw new Error(`path not readable or escapes root: ${candidate}`);
  }
  const rootPrefix = rootReal.endsWith(sep) ? rootReal : rootReal + sep;
  if (candidateReal !== rootReal && !candidateReal.startsWith(rootPrefix)) {
    throw new Error(`symlink or path escapes root: ${candidate}`);
  }
  return candidateReal;
}

/** Collect *.jsonl under dir; reject any path that escapes via symlink. */
export function collectJsonlFiles(dir: string): string[] {
  const root = resolve(dir);
  let rootStat;
  try {
    rootStat = statSync(root);
  } catch {
    throw new Error(`directory not found: ${dir}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`not a directory: ${dir}`);
  }
  const rootReal = realpathSync(root);
  const out: string[] = [];

  const walk = (current: string) => {
    assertPathInsideRoot(rootReal, current);
    const entries = readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(current, ent.name);
      const real = assertPathInsideRoot(rootReal, full);
      const st = statSync(real);
      if (st.isDirectory()) {
        walk(real);
      } else if (st.isFile() && ent.name.endsWith(".jsonl")) {
        out.push(real);
      }
    }
  };

  walk(rootReal);
  return out.sort();
}

export function buildLedger(dir: string, prices?: TokenPrices): LedgerReport {
  const files = collectJsonlFiles(dir);
  const all: AssistantUsage[] = [];
  let skipped = 0;

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const parsed = parseLines(text);
    skipped += parsed.skipped;
    all.push(...parsed.entries);
  }

  const zeroSkipped = dedupByMessageId(all).filter(
    (m) => !hasBillableTokens(m),
  ).length;
  skipped += zeroSkipped;

  const billable = importBillable(all);
  const { byModel, bySession } = aggregate(billable, prices);
  return {
    filesScanned: files.length,
    skipped,
    decisions: billable.length,
    byModel,
    bySession,
  };
}

export function loadPrices(path: string): TokenPrices {
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<TokenPrices>;
  for (const key of [
    "input",
    "output",
    "cache_read",
    "cache_creation",
  ] as const) {
    if (typeof raw[key] !== "number" || !Number.isFinite(raw[key])) {
      throw new Error(`prices.json missing numeric field: ${key}`);
    }
  }
  return raw as TokenPrices;
}

export function formatLedgerText(report: LedgerReport): string {
  const lines: string[] = [];
  lines.push(
    `files=${report.filesScanned} decisions=${report.decisions} skipped=${report.skipped}`,
  );
  lines.push("");
  lines.push("by model:");
  for (const row of report.byModel) {
    const cost =
      row.your_prices_usd !== undefined
        ? ` your_prices_usd=${row.your_prices_usd}`
        : "";
    lines.push(
      `  ${row.model} decisions=${row.decisions} input=${row.input} output=${row.output} cache_read=${row.cache_read} cache_creation=${row.cache_creation} tokens_per_decision=${row.tokens_per_decision}${cost}`,
    );
  }
  lines.push("");
  lines.push("by session:");
  for (const row of report.bySession) {
    const cost =
      row.your_prices_usd !== undefined
        ? ` your_prices_usd=${row.your_prices_usd}`
        : "";
    lines.push(
      `  ${row.sessionId} decisions=${row.decisions} input=${row.input} output=${row.output} cache_read=${row.cache_read} cache_creation=${row.cache_creation} tokens_per_decision=${row.tokens_per_decision}${cost}`,
    );
  }
  return lines.join("\n") + "\n";
}
