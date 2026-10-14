#!/usr/bin/env bash
# Clone farion1231/cc-switch at the pinned SHA into vendor/cc-switch.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIN="479964f2ef59e291f563218ac674a1fd82dcdbd3"
DEST="$ROOT/vendor/cc-switch"
REPO="https://github.com/farion1231/cc-switch.git"

if [[ -x /usr/local/Cellar/git/2.39.0/bin/git ]]; then
  export PATH="/usr/local/Cellar/git/2.39.0/bin:$PATH"
elif [[ -x /usr/local/opt/git/bin/git ]]; then
  export PATH="/usr/local/opt/git/bin:$PATH"
elif [[ -x /opt/homebrew/opt/git/bin/git ]]; then
  export PATH="/opt/homebrew/opt/git/bin:$PATH"
fi

mkdir -p "$ROOT/vendor"

if [[ -d "$DEST/.git" ]]; then
  git -C "$DEST" fetch --depth 1 origin "$PIN"
  git -C "$DEST" checkout --force "$PIN"
else
  rm -rf "$DEST"
  git clone "$REPO" "$DEST"
  git -C "$DEST" fetch --depth 1 origin "$PIN"
  git -C "$DEST" checkout --force "$PIN"
fi

HEAD="$(git -C "$DEST" rev-parse HEAD)"
if [[ "$HEAD" != "$PIN" ]]; then
  echo "vendor pin mismatch: expected $PIN got $HEAD" >&2
  exit 1
fi

echo "vendor/cc-switch @ $HEAD"
