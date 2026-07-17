#!/bin/bash
set -e
cd "$(dirname "$0")"
[ -f .git/index.lock ] && rm -f .git/index.lock
[ -f .git/HEAD.lock ]  && rm -f .git/HEAD.lock
MSG="${1:-update}"
git add -A
git commit -m "$MSG" 2>/dev/null || echo "Nothing to commit"
git push origin main
echo "✅ Pushed to origin/main"
