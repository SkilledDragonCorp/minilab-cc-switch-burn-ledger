---
name: measure-decision-burn
description: >-
  Before proposing a model swap, measure tokens per decision by model from local
  Claude Code JSONL session logs with burn-ledger.
---

# Measure decision burn

Decision models make each yes/no cheap — first **measure** what each decision costs today.

## Steps

1. Copy session logs into a local folder (never commit them). Example: `./sample-logs`.
2. From the minilab root, run:

   ```bash
   DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 bun run ledger ./sample-logs
   ```

3. Summarize **tokens per decision by model** (`tokens_per_decision` in the ledger).
4. Only after that summary, propose any model swap or routing change.

## Rules

- Never run the CLI with no directory argument (it refuses so it never silently reads `~/.claude`).
- Work only on local log files or synthetic fixtures you point at.
- Stay on local logs and synthetic fixtures only; do not add third-party proxy or pooling configuration.
