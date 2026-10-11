#!/bin/sh
# Build + run every test suite. Needs Chrome at /usr/bin/google-chrome and playwright-core in test/node_modules.
set -e
cd "$(dirname "$0")/.."
node build.mjs
node test/functional.js
node test/sw-update.js
node test/parity.js     # needs the pre-refactor backup (PP_BEFORE=…); skip if you no longer have it
