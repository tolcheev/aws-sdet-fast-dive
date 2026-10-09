#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

archive_name="aws-sdet-fast-dive.zip"
build_dir="dist/aws-sdet-fast-dive"

rm -rf dist
mkdir -p "$build_dir"

rsync -a \
  --exclude '.git' \
  --exclude '.localstack' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  ./ "$build_dir/"

(
  cd dist
  zip -qr "$archive_name" aws-sdet-fast-dive
)

echo "Created dist/$archive_name"
