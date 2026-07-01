#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash package_repo_clean_for_black.sh /absolute/path/to/repo_clean
# Example:
#   bash package_repo_clean_for_black.sh "/Users/thomashooker/repo_clean"

REPO_PATH="${1:-}"

if [[ -z "$REPO_PATH" ]]; then
  echo "Usage: bash package_repo_clean_for_black.sh /absolute/path/to/repo_clean"
  exit 1
fi

if [[ ! -d "$REPO_PATH" ]]; then
  echo "Repo path not found: $REPO_PATH"
  exit 1
fi

REPO_NAME="$(basename "$REPO_PATH")"
PARENT_DIR="$(dirname "$REPO_PATH")"
STAMP="$(date +%Y%m%d-%H%M%S)"
ZIP_NAME="${REPO_NAME}-handoff-${STAMP}.zip"
ZIP_PATH="${PARENT_DIR}/${ZIP_NAME}"

cd "$PARENT_DIR"

# Build a clean handoff zip:
# - include source code and project files
# - exclude secrets, dependencies, build output, git internals, and OS junk
zip -r "$ZIP_PATH" "$REPO_NAME" \
  -x "${REPO_NAME}/.env.local" \
  -x "${REPO_NAME}/.env*.local" \
  -x "${REPO_NAME}/node_modules/*" \
  -x "${REPO_NAME}/.next/*" \
  -x "${REPO_NAME}/.git/*" \
  -x "${REPO_NAME}/dist/*" \
  -x "${REPO_NAME}/build/*" \
  -x "${REPO_NAME}/coverage/*" \
  -x "${REPO_NAME}/tmp/*" \
  -x "${REPO_NAME}/.DS_Store" \
  -x "${REPO_NAME}/**/.DS_Store" \
  -x "${REPO_NAME}/npm-debug.log*" \
  -x "${REPO_NAME}/yarn-debug.log*" \
  -x "${REPO_NAME}/yarn-error.log*" \
  -x "${REPO_NAME}/pnpm-debug.log*"

echo ""
echo "Created: $ZIP_PATH"
echo ""
echo "Quick secret check for zip contents:"
zipinfo -1 "$ZIP_PATH" | egrep '(^|/)\.env|(^|/)node_modules/|(^|/)\.next/|(^|/)\.git/' || true
