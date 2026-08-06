// Each build directory gets its own package.json "type" marker so Node (and
// TypeScript's node16/nodenext resolution) treats the .js and .d.ts files in
// it with the right module format.
import { writeFileSync } from 'node:fs'

writeFileSync('build/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 2) + '\n')
writeFileSync('build/esm/package.json', JSON.stringify({ type: 'module' }, null, 2) + '\n')
