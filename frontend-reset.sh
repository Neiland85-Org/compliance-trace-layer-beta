#!/bin/bash

echo "---- TRACE FRONTEND RESET ----"

echo "1. Killing running dev servers..."
kill -9 $(lsof -ti:5173) 2>/dev/null
pkill -f vite 2>/dev/null
pkill -f node 2>/dev/null

echo "2. Cleaning vite cache..."
rm -rf apps/console/node_modules/.vite
rm -rf node_modules/.vite

echo "3. Cleaning build output..."
rm -rf apps/console/dist

echo "4. Checking critical files..."

FILES=(
"apps/console/src/App.jsx"
"apps/console/src/main.jsx"
"apps/console/src/components/Layout.jsx"
"apps/console/src/features/catalog/Catalog.jsx"
"apps/console/src/features/catalog/ArchitectureCard.jsx"
)

for f in "${FILES[@]}"
do
  if [ -f "$f" ]; then
    echo "OK  $f"
  else
    echo "MISSING  $f"
  fi
done

echo "5. Checking broken imports..."

grep -R "import " apps/console/src | grep "./" || true

echo "6. Installing dependencies if needed..."
npm install --silent

echo "7. Starting frontend..."

npm run dev -w apps/console
