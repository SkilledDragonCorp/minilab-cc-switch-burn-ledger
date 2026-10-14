#!/usr/bin/env bun
import { buildLedger, formatLedgerText, loadPrices } from "../src/ledger.ts";

function usage(): never {
  console.error(
    "usage: burn-ledger <dir> [--json] [--prices prices.json]\n" +
      "  Reads *.jsonl recursively from <dir> only.\n" +
      "  Refuses to run with no directory argument.",
  );
  process.exit(2);
}

function main(argv: string[]): void {
  const args = argv.slice(2);
  if (args.length === 0 || args[0]!.startsWith("-")) {
    usage();
  }

  const dir = args[0]!;
  let json = false;
  let pricesPath: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--json") {
      json = true;
    } else if (a === "--prices") {
      pricesPath = args[++i];
      if (!pricesPath) {
        console.error("--prices requires a file path");
        process.exit(2);
      }
    } else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }

  try {
    const prices = pricesPath ? loadPrices(pricesPath) : undefined;
    const report = buildLedger(dir, prices);
    if (json) {
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    } else {
      process.stdout.write(formatLedgerText(report));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    process.exit(1);
  }
}

main(process.argv);
