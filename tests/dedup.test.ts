import { describe, expect, test } from "bun:test";
import {
  dedupByMessageId,
  importBillable,
  shouldReplace,
} from "../src/dedup.ts";
import { parseLine } from "../src/parse.ts";
import {
  BILLABLE_NOSTOP,
  DEDUP_FINAL,
  DEDUP_INTERMEDIATE,
  EMPTY_ZERO,
} from "./fixtures.ts";

describe("dedup (upstream test_dedup_by_message_id)", () => {
  test("keep stop_reason entry (intermediate then final)", () => {
    const a = parseLine(DEDUP_INTERMEDIATE)!;
    const b = parseLine(DEDUP_FINAL)!;
    expect(shouldReplace(a, b)).toBe(true);
    const out = dedupByMessageId([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0]!.outputTokens).toBe(1349);
    expect(out[0]!.stopReason).toBe("end_turn");
  });

  test("keep stop_reason entry (final then intermediate — no replace)", () => {
    const a = parseLine(DEDUP_FINAL)!;
    const b = parseLine(DEDUP_INTERMEDIATE)!;
    expect(shouldReplace(a, b)).toBe(false);
    const out = dedupByMessageId([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0]!.outputTokens).toBe(1349);
  });
});

describe("billable gate (upstream test_sync_imports_billable_message_without_stop_reason)", () => {
  test("imports billable without stop_reason; skips all-zero", () => {
    const billable = parseLine(BILLABLE_NOSTOP)!;
    const empty = parseLine(EMPTY_ZERO)!;
    const imported = importBillable([billable, empty]);
    expect(imported).toHaveLength(1);
    expect(imported[0]!.messageId).toBe("msg_nostop");
    expect(imported[0]!.cacheReadTokens).toBe(48719);
    expect(imported[0]!.stopReason).toBeNull();
  });
});
