#!/bin/zsh
set -e
cd -- "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js 22.12 veya üstü gerekli. https://nodejs.org'
  read -k 1 '?Çıkmak için bir tuşa bas…'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci
fi
node scripts/launch.mjs
