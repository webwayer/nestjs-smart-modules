// Jest in native ESM mode, for NestJS 12 and later: pure ESM packages cannot be
// loaded by Jest's CommonJS runtime. Same suite and same settings as the
// `jest` block in package.json, which NestJS 8-11 keep using; only the module
// format of the compiled specs and sources differs. Run with `npm run test:esm`.
import { readFileSync } from 'node:fs'

const { jest: base } = JSON.parse(readFileSync('package.json', 'utf8'))

export default {
  ...base,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.spec.esm.json' }],
  },
}
