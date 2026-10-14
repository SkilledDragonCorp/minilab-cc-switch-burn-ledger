import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PARSE_LINE } from "./fixtures.ts";

const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe("CLI burn-ledger", () => {
  test("no-arg exits 2", () => {
    const proc = Bun.spawnSync(["bun", "run", "bin/burn-ledger.ts"], {
      cwd: join(import.meta.dir, ".."),
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(proc.exitCode).toBe(2);
  });

  test("symlink pointing outside dir is rejected", () => {
    const root = join(
      tmpdir(),
      `burn-cli-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    const outside = join(
      tmpdir(),
      `burn-outside-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    mkdirSync(root, { recursive: true });
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, "escape.jsonl"), PARSE_LINE + "\n");
    symlinkSync(outside, join(root, "evil-link"));
    dirs.push(root, outside);

    const proc = Bun.spawnSync(
      ["bun", "run", "bin/burn-ledger.ts", root],
      {
        cwd: join(import.meta.dir, ".."),
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(proc.exitCode).toBe(1);
    const err = proc.stderr.toString();
    expect(err.toLowerCase()).toContain("escape");
  });

  test("malformed line increments skipped", () => {
    const root = join(
      tmpdir(),
      `burn-cli-mal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "a.jsonl"), "not-json\n" + PARSE_LINE + "\n");
    dirs.push(root);

    const proc = Bun.spawnSync(
      ["bun", "run", "bin/burn-ledger.ts", root, "--json"],
      {
        cwd: join(import.meta.dir, ".."),
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(proc.exitCode).toBe(0);
    const report = JSON.parse(proc.stdout.toString()) as { skipped: number };
    expect(report.skipped).toBe(1);
  });
});
