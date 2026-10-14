import { describe, expect, test } from "bun:test";
import { parseLine, parseLines } from "../src/parse.ts";
import { PARSE_LINE } from "./fixtures.ts";

describe("parse (upstream test_parse_usage_from_jsonl_line)", () => {
  test("extracts id, model, tokens, stop_reason, session", () => {
    const entry = parseLine(PARSE_LINE);
    expect(entry).not.toBeNull();
    expect(entry!.messageId).toBe("msg_test123");
    expect(entry!.model).toBe("claude-opus-4-6");
    expect(entry!.inputTokens).toBe(3);
    expect(entry!.outputTokens).toBe(150);
    expect(entry!.cacheReadTokens).toBe(5000);
    expect(entry!.cacheCreationTokens).toBe(10000);
    expect(entry!.stopReason).toBe("end_turn");
    expect(entry!.sessionId).toBe("session-abc");
    expect(entry!.timestamp).toBe("2026-04-05T12:00:00Z");
  });

  test("ignores non-assistant and missing usage", () => {
    expect(parseLine('{"type":"user","message":{}}')).toBeNull();
    expect(
      parseLine(
        '{"type":"assistant","message":{"id":"x","model":"m"},"sessionId":"s"}',
      ),
    ).toBeNull();
  });

  test("malformed JSON increments skipped and never throws", () => {
    const { entries, skipped } = parseLines(
      "not-json\n" + PARSE_LINE + "\n{broken\n",
    );
    expect(skipped).toBe(2);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.messageId).toBe("msg_test123");
  });
});
