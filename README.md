# minilab-cc-switch-burn-ledger

Keyless Bun/TypeScript minilab that answers one question before you optimize anything: **how many tokens does each agent decision burn, by model?**

It ports the Claude Code JSONL session-usage accounting rules from [farion1231/cc-switch](https://github.com/farion1231/cc-switch) (`session_usage.rs`) into a local CLI, parity-tests them against upstream fixtures, and runs upstream frontend/backend CI at a fixed pin.

**Built by SkilledDragon LLC — architecture-led software engineering · [skilleddragon.com](https://skilleddragon.com)**

## What was built

| Piece | Role |
| --- | --- |
| `src/parse.ts` | Port of assistant + `message.usage` JSONL parsing |
| `src/dedup.ts` | `message.id` dedup (prefer `stop_reason`) + billable gate |
| `src/ledger.ts` | Per-model / per-session aggregates + path containment |
| `bin/burn-ledger.ts` | `burn-ledger <dir> [--json] [--prices file]` |
| Skill | `.claude/skills/measure-decision-burn/SKILL.md` |
| Upstream scripts | `scripts/upstream-cc-switch-{frontend,backend}.sh` |

Upstream pin: `479964f2ef59e291f563218ac674a1fd82dcdbd3` (MIT).

## Why measure first

Decision models make each yes/no cheap. Before swapping models or routes, measure **tokens per decision by model** on your own session logs.

## Brand guardrail

This lab works only on local log directories you pass on the CLI (plus synthetic fixtures). It stays offline to those logs and does **not** include third-party proxy or pooling configuration.

## Parity table

| Upstream test (`session_usage.rs`) | Lab test | Result |
| --- | --- | --- |
| `test_parse_usage_from_jsonl_line` | `tests/parse.test.ts` | Pass |
| `test_dedup_by_message_id` | `tests/dedup.test.ts` | Pass |
| `test_sync_imports_billable_message_without_stop_reason` | `tests/dedup.test.ts` | Pass |
| Ledger fixture + `--json` snapshot | `tests/ledger.test.ts` | Pass |
| CLI no-arg / symlink escape / malformed | `tests/cli.test.ts` | Pass |

## Setup

```bash
# Bun 1.4.3 (CI). Local authoring may use a nearby 1.4.x; engines ask >=1.4.3.
export DISABLE_TELEMETRY=1 DO_NOT_TRACK=1
bun install --frozen-lockfile
bun run typecheck
bun test
```

`.nvmrc` is `24`. No API keys.

## Tutorial

1. Copy a Claude Code session-log folder to `./sample-logs` (never commit it; gitignored).
2. Run:

   ```bash
   bun run ledger ./sample-logs
   ```

3. Read `tokens_per_decision` by model. Optionally pass `--prices prices.json` (USD per 1M tokens) for a **your prices** column — no prices are hard-coded.

## Using these skills in Claude Code and Cursor

Both read `.claude/skills/measure-decision-burn/SKILL.md`. No `.cursor/skills` or `.agents/skills` mirrors (CI fails if those paths exist).

## API keys / telemetry

**No API keys required.**

| Variable | Purpose |
| --- | --- |
| `DISABLE_TELEMETRY=1` / `DO_NOT_TRACK=1` | Org-wide telemetry off switches |
| `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` | Upstream frontend CI (corepack) |
| `CC_SWITCH_TEST_HOME` | Temp HOME for upstream backend tests (set by CI / backend script) |
| `BURN_LEDGER_LOG_DIR` | Optional documented path for your local log copy (never committed) |

See `.env.example`. Upstream may read `XAI_API_KEY` for an optional provider feature; this lab never sets or needs it.

## Tests (keyless)

```bash
bun install --frozen-lockfile
bun run typecheck
bun test
bun audit
test ! -e .cursor/skills && test ! -e .agents/skills
```

Upstream (Linux CI; verbatim from upstream `.github/workflows/ci.yml` at the pin):

```bash
bash scripts/upstream-cc-switch-frontend.sh
bash scripts/upstream-cc-switch-backend.sh
```

Authoring hosts without Rust **1.95** / webkit2gtk skip the backend script locally; GitHub Actions runs `upstream-backend` on `ubuntu-22.04`.

## CI

Jobs: `lab` · `upstream-frontend` · `upstream-backend` · `security` (gitleaks **8.30.1** + osv-scanner **2.7.0**). Actions pinned by commit SHA. Env: `DISABLE_TELEMETRY=1`, `DO_NOT_TRACK=1`.
