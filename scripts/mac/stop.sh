#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

echo "Stopping LocalStack..."
docker compose down

echo "Stopped."
