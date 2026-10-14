import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildLedger } from "../src/ledger.ts";
import {
  BILLABLE_NOSTOP,
  DEDUP_FINAL,
  DEDUP_INTERMEDIATE,
  EMPTY_ZERO,
  PARSE_LINE,
  SESSION_B_ASSISTANT,
} from "./fixtures.ts";
import snapshot from "./snapshots/ledger.json";

const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function makeFixtureDir(): string {
  const dir = join(
    tmpdir(),
    `burn-ledger-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  mkdirSync(join(dir, "proj-a"), { recursive: true });
  mkdirSync(join(dir, "proj-b"), { recursive: true });
  writeFileSync(
    join(dir, "proj-a", "session-a.jsonl"),
    [DEDUP_INTERMEDIATE, DEDUP_FINAL, PARSE_LINE].join("\n") + "\n",
  );
  writeFileSync(
    join(dir, "proj-b", "session-b.jsonl"),
    [BILLABLE_NOSTOP, EMPTY_ZERO, SESSION_B_ASSISTANT].join("\n") + "\n",
  );
  dirs.push(dir);
  return dir;
}

describe("ledger aggregation", () => {
  test("per-model totals and --json snapshot", () => {
    const dir = makeFixtureDir();
    const report = buildLedger(dir);

    // msg_1 (1349 out) + msg_test123 + msg_nostop + msg_b1 ; msg_empty skipped
    expect(report.decisions).toBe(4);
    expect(report.filesScanned).toBe(2);
    expect(report.skipped).toBe(1); // all-zero only

    const opus46 = report.byModel.find((r) => r.model === "claude-opus-4-6");
    expect(opus46).toEqual({
      model: "claude-opus-4-6",
      decisions: 2,
      input: 6,
      output: 1499,
      cache_read: 10000,
      cache_creation: 20000,
      tokens_per_decision: 15752.5,
    });

    const opus48 = report.byModel.find((r) => r.model === "claude-opus-4-8");
    expect(opus48).toEqual({
      model: "claude-opus-4-8",
      decisions: 1,
      input: 2,
      output: 1,
      cache_read: 48719,
      cache_creation: 2061,
      tokens_per_decision: 50783,
    });

    const sonnet = report.byModel.find((r) => r.model === "claude-sonnet-4-5");
    expect(sonnet).toEqual({
      model: "claude-sonnet-4-5",
      decisions: 1,
      input: 10,
      output: 20,
      cache_read: 100,
      cache_creation: 50,
      tokens_per_decision: 180,
    });

    expect(report.bySession.map((s) => s.sessionId).sort()).toEqual([
      "session-a",
      "session-abc",
      "session-b",
      "session-wf",
    ]);

    expect(report).toEqual(snapshot);
  });
});
