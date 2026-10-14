# Security Policy

**Built by [SkilledDragon LLC](https://skilleddragon.com)**

This is a **SkilledDragon educational minilab**, not a production product. We do **not** maintain these repos on a regular schedule and we do **not** operate a vulnerability response program for them.

## Supported versions

Only the `main` branch of this repository is documented. There is no LTS track.

## Contact

General questions: **hello@skilleddragon.com**  
Do not use a dedicated security mailbox for this repo — none exists.

## If you find an issue

- Prefer reporting **upstream** when the issue is in [farion1231/cc-switch](https://github.com/farion1231/cc-switch) (MIT).
- For something specific to this minilab’s burn-ledger port, skill, or CI, you may email hello@skilleddragon.com. There is **no SLA**, and we may not patch or reply quickly.
- Do not expect private coordinated disclosure or paid bounty handling here.

## Secret-handling policy

- Never commit `.env`, API keys, PEM/key material, or real Claude Code session logs.
- This lab requires **no API keys**. Optional `BURN_LEDGER_LOG_DIR` points at a local copy of logs (gitignored `sample-logs/`).
- Local `.env` is gitignored. Copy from `.env.example` and set `DISABLE_TELEMETRY=1` and `DO_NOT_TRACK=1`.

## Hygiene tooling

| Control | Pin / command |
| --- | --- |
| gitleaks | `v8.30.1` (`.pre-commit-config.yaml` + CI `security` job downloads the linux_x64 release tarball, verifies SHA256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`, then runs `./gitleaks git --redact --verbose .`) |
| osv-scanner | `v2.7.0` linux_amd64 SHA256 `160c6253e2922e9e0a6a9771c5c4c40a4b3c6090b34a3cdd5e80c96cc2e4218b` on upstream `pnpm-lock.yaml` + `src-tauri/Cargo.lock` via `osv-scanner.toml` (IgnoredVulns for pin `479964f2` only) |
| Dependency audit | `bun audit` on the lab lockfile |
| Upstream pin | `farion1231/cc-switch` @ `479964f2ef59e291f563218ac674a1fd82dcdbd3` (MIT), cloned into gitignored `vendor/cc-switch` |

Use at your own risk. Pin versions, review the code, and treat this as sample material.
