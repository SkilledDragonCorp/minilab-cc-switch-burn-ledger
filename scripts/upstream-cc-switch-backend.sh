#!/usr/bin/env bash
# Upstream backend CI commands at pin 479964f2 — copied verbatim from
# .github/workflows/ci.yml (backend job, ubuntu-22.04 leg) at that SHA.
# Intended for Linux CI (webkit2gtk / Tauri system deps). Local Darwin may
# lack Rust 1.95 and webkit packages — run this job in GitHub Actions.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export DISABLE_TELEMETRY="${DISABLE_TELEMETRY:-1}"
export DO_NOT_TRACK="${DO_NOT_TRACK:-1}"

if [[ -z "${CC_SWITCH_TEST_HOME:-}" ]]; then
  export CC_SWITCH_TEST_HOME="$(mktemp -d "${TMPDIR:-/tmp}/cc-switch-home.XXXXXX")"
fi

bash "$ROOT/scripts/vendor-cc-switch.sh"
cd "$ROOT/vendor/cc-switch"

# Verbatim from upstream ci.yml L131
channel=$(sed -nE 's/^channel *= *"([^"]+)".*/\1/p' rust-toolchain.toml)
test -n "$channel"
echo "rust channel=$channel"

# Verbatim from upstream ci.yml L144–151 (Linux system deps)
if [[ "$(uname -s)" == "Linux" ]]; then
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends \
    build-essential pkg-config libssl-dev \
    libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev
  sudo apt-get install -y --no-install-recommends libwebkit2gtk-4.1-dev \
    || sudo apt-get install -y --no-install-recommends libwebkit2gtk-4.0-dev
  sudo apt-get install -y --no-install-recommends libsoup-3.0-dev \
    || sudo apt-get install -y --no-install-recommends libsoup2.4-dev
fi

# Verbatim from upstream ci.yml L168, L171, L174, L179
mkdir -p dist
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo nextest run --manifest-path src-tauri/Cargo.toml --profile ci
