#!/bin/bash
set -euo pipefail

echo "Running pre-commit hygiene & secret check..."

# 1. Check for forbidden file patterns staged in Git
FORBIDDEN_PATTERNS=(
  "\.env"
  "\.key$"
  "\.pem$"
  "\.pfx$"
  "\.p12$"
  "\.pdb$"
  "\.zip$"
  "\.msi$"
  "doc\.txt"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM || true)

if [ -n "$STAGED_FILES" ]; then
  for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    MATCHES=$(echo "$STAGED_FILES" | grep -E "$pattern" | grep -v "\.env\.example" || true)
    if [ -n "$MATCHES" ]; then
      echo "ERROR: Staged files match forbidden pattern '$pattern':"
      echo "$MATCHES"
      exit 1
    fi
  done
fi

# 2. Check for potential hard-coded private keys in staged diffs
if git diff --cached | grep -E "^\+[^\+]*-----BEGIN (RSA|EC|OPENSSH|ED25519|.*PRIVATE) KEY-----" > /dev/null 2>&1; then
  echo "ERROR: Attempting to commit a private key in git diff."
  exit 1
fi

echo "Pre-commit check passed."
