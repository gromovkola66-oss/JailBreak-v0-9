#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAME_DIR="$SCRIPT_DIR/../JailBreak-1.2"
ELECTRON_DIR="$SCRIPT_DIR"

echo "=== JailBreak Electron Build ==="
echo ""

# Step 1: Build the game
echo "[Step 1] Building game (Vite single-file)..."
cd "$GAME_DIR"
npm run build
echo "Game built successfully: $GAME_DIR/dist/index.html"
echo ""

# Step 2: Copy built game to electron app folder
echo "[Step 2] Copying game to Electron app..."
mkdir -p "$ELECTRON_DIR/app"
cp "$GAME_DIR/dist/index.html" "$ELECTRON_DIR/app/index.html"
echo "Copied to: $ELECTRON_DIR/app/index.html"
echo ""

# Step 3: Generate icon if it doesn't exist
if [ ! -f "$ELECTRON_DIR/assets/icon.png" ]; then
  echo "[Step 3] Generating icon..."
  cd "$ELECTRON_DIR"
  node generate-icon.js
  echo ""
fi

# Step 4: Build Electron app
echo "[Step 4] Building Electron executable..."
cd "$ELECTRON_DIR"
npm run build
echo ""

echo "=== Build Complete ==="
echo "Output: $ELECTRON_DIR/dist/"
