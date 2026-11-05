// Typechecks the spec suite, with all its type assertions, against the
// declarations the package publishes rather than its sources: consumers get
// declarations emitted by the TypeScript this repo builds with, read by
// whichever TypeScript they use. Needs a prior `npm run build`.
//
//   node scripts/check-published-types.mjs [typescript-version]
import { spawnSync } from 'node:child_process'
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import console from 'node:console'
import process from 'node:process'

const version = process.argv[2]
// Inside build/ because everything already ignores it, and so that packages
// still resolve from the repo's node_modules.
const dir = 'build/types-check'
const nestMajor = Number(JSON.parse(readFileSync('node_modules/@nestjs/common/package.json', 'utf8')).version.split('.')[0])

rmSync(dir, { recursive: true, force: true })
cpSync('spec', `${dir}/spec`, { recursive: true })
cpSync('build/esm', `${dir}/src`, {
  recursive: true,
  filter: (source) => !/\.[^/]+$/.test(source) || source.endsWith('.d.ts'),
})
writeFileSync(
  `${dir}/tsconfig.json`,
  JSON.stringify({
    compilerOptions: {
      module: 'es2022',
      moduleResolution: 'bundler',
      target: 'es2022',
      isolatedModules: true,
      useDefineForClassFields: false,
      strict: true,
      strictPropertyInitialization: false,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      noEmit: true,
      // TypeScript 6 stopped including every @types package by default.
      types: ['jest', 'node'],
    },
    include: ['spec', 'src'],
    // NestJS 8 types @Inject() so that it is rejected on a constructor
    // parameter under `strict`, which has nothing to do with this library.
    exclude: nestMajor === 8 ? ['spec/receipts/multiple-instances.spec.ts'] : [],
  }),
)

const tsc = version ? ['npx', '-y', '-p', `typescript@${version}`, 'tsc'] : ['npx', 'tsc']
const result = spawnSync(tsc[0], [...tsc.slice(1), '-p', dir, '--pretty', 'false'], { encoding: 'utf8' })
rmSync(dir, { recursive: true, force: true })

// Errors inside other packages' declarations are theirs to fix (@types/node
// on an old TypeScript, say) and a consumer turns them off with skipLibCheck.
// Ours are kept: the copied declarations do not live under node_modules.
const diagnostics = result.stdout.split(/\n(?=\S)/).filter((block) => block.includes('error TS'))
const ours = diagnostics.filter((block) => !block.startsWith('node_modules/') && !block.includes('/node_modules/'))

if (ours.length > 0) {
  console.error(ours.join('\n'))
  process.exit(1)
}
if (result.status !== 0 && diagnostics.length === 0) {
  console.error('tsc did not run:', result.error ?? result.stderr)
  process.exit(1)
}
console.log(`Published types check passed on TypeScript ${version ?? '(installed)'} and NestJS ${nestMajor}`)
