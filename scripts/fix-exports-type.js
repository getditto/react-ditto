#!/usr/bin/env node
// This script defines the type of exports in the dist directory using minimal
// package.json files. Setting the type in the main package.json file does not
// work because we want to support both CommonJS and ES Module exports in the
// same package.

const FS = require('node:fs')

const DIST_DIR = 'dist'

FS.writeFileSync(
  `${DIST_DIR}/cjs/package.json`,
  JSON.stringify({
    type: 'commonjs',
  }),
)

FS.writeFileSync(
  `${DIST_DIR}/esm/package.json`,
  JSON.stringify({
    type: 'module',
  }),
)
