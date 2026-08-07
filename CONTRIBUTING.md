# Contributing

Thanks for taking the time to contribute!

## Setup

```bash
nvm use        # Node version from .nvmrc
npm ci
npm run validate
```

`npm run validate` is the same pipeline CI runs: typecheck → lint → format check → tests → knip → build → publint + attw. If it is green locally, CI will be green.

## Useful scripts

| Script                      | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `npm test` / `test:watch`   | Jest test suite (92+ tests)                        |
| `npm run coverage`          | Coverage with a 100% threshold (receipts excluded) |
| `npm run lint` / `lint:fix` | ESLint 10 with type-checked rules                  |
| `npm run format`            | Prettier over the whole repo                       |
| `npm run build`             | Dual CJS + ESM build into `build/`                 |
| `npm run docs:api`          | TypeDoc API reference into `docs-api/`             |
| `npm run check:package`     | publint + arethetypeswrong on the packed tarball   |

## Commit messages

The repo uses [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`, `build:`, `ci:`, …) — commitlint checks them on every PR, and [release-please](https://github.com/googleapis/release-please) builds releases and the changelog from them. A `feat:` lands in a minor release, a `fix:` in a patch.

## Tests

Test conventions live in [spec/TESTING.md](spec/TESTING.md). In short: structure assertions go through the helpers in `spec/utils/spec-helpers.ts`; README examples covered by `spec/receipts/` must stay line-for-line in sync with the README (and new recipes should get a receipt); coverage must stay at 100% — enforced locally and in CI via `npm run coverage` inside `validate`.

## Pull requests

- Branch from `main`; PRs need the required checks green: `validate`, `package`, and every cell of the `nest N / node V` compatibility grid (NestJS 8-11 × Node 18.16-26, minus Nest 11 on Node 18).
- The `nest next` job tracks the upcoming NestJS major and is allowed to fail.
- Releases are cut by merging the release-please Release PR — contributors never publish manually.
