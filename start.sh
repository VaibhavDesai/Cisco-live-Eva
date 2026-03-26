#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$ROOT_DIR/web"

echo "================================================"
echo "  Webex AI Agent Studio — Quick Start"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js >= 18."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js >= 18 required (found v$(node -v))."
  exit 1
fi

echo "[1/3] Installing root dependencies..."
cd "$ROOT_DIR"
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo "  Root node_modules found, skipping."
fi

echo ""
echo "[2/3] Installing web app dependencies..."
cd "$WEB_DIR"
if [ ! -d "node_modules" ]; then
  npm install --silent
else
  echo "  Web node_modules found, skipping."
fi

echo ""
echo "[3/3] Starting dev server..."
echo ""
npm run dev
