#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-feat/checkout-eth}"
REMOTE="${2:-origin}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Initializing new git repository..."
  git init
  git add .
  git commit -m "chore: init repository"
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  git checkout -B "$BRANCH"
fi

echo "Adding changes..."
git add -A
git commit -m "feat: add 1 ETH purchase via Stripe Link and PayPal" || true

echo "Pushing to $REMOTE $BRANCH..."
git push -u "$REMOTE" "$BRANCH"

echo "Done. Open a PR to trigger a Vercel Preview Deployment."
