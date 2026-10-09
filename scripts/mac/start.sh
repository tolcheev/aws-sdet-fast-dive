#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "Starting LocalStack..."
docker compose up -d localstack

echo "Creating local AWS resources..."
npm run aws:bootstrap

echo
echo "Open http://localhost:3000 after the API starts."
echo "Press Ctrl+C here to stop the API."
echo

npm run dev
