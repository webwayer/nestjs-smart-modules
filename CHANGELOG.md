# Changelog

All notable changes to this project will be documented in this file. Releases are managed by [release-please](https://github.com/googleapis/release-please); commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## [1.1.1](https://github.com/webwayer/nestjs-smart-modules/compare/v1.1.0...v1.1.1) (2026-09-06)


### Bug Fixes

* **infer:** a smart module takes a list of any length up to a thousand ([e931f4d](https://github.com/webwayer/nestjs-smart-modules/commit/e931f4dc1faf89fe79dbdad7db255b1a181ee50a))

## [1.1.0](https://github.com/webwayer/nestjs-smart-modules/compare/v1.0.3...v1.1.0) (2026-08-07)


### Features

* **build:** publish dual ESM and CJS builds ([12d0e29](https://github.com/webwayer/nestjs-smart-modules/commit/12d0e29adcb99e3b04dc8404cac2fae2e4522eec))
* **peer:** support NestJS 8 and 9 ([dd8e82d](https://github.com/webwayer/nestjs-smart-modules/commit/dd8e82d7123889e9a2f82e9f24ca8a754df9e850))
* **types:** export public types and accept symbol injection tokens ([6857477](https://github.com/webwayer/nestjs-smart-modules/commit/68574777b8d3acb39e40463e82a3e0cd57f5589c))


### Bug Fixes

* **ci:** repair nest-next warning step and old-TS probe invocation ([bd9d914](https://github.com/webwayer/nestjs-smart-modules/commit/bd9d9141287a5e460b918ae372d26f53daa6385a))
* **modules:** apply async imports to the generated config module, not the provider ([e4523eb](https://github.com/webwayer/nestjs-smart-modules/commit/e4523eb840750a7469a240131440f3083b7042e1))
* **package:** ship src so published sourcemaps resolve ([6245b34](https://github.com/webwayer/nestjs-smart-modules/commit/6245b34a05f3af80363d5449d3ee946cf9a37aaa))
* **release:** dispatch CI onto Release-PR branches and harden the pipeline ([0b84906](https://github.com/webwayer/nestjs-smart-modules/commit/0b84906ec0ccc5c1022051a962b78e5062154055))
* **repo:** repair corrupted .gitignore and untrack generated artifacts ([8e0fe0c](https://github.com/webwayer/nestjs-smart-modules/commit/8e0fe0c4f716eec675485d25bf60f97b0a5ebf36))
* **smartModule:** invoke the module definition factory once per call ([3ecd9c5](https://github.com/webwayer/nestjs-smart-modules/commit/3ecd9c52171c66e243833be1aa41a7479567bbe6))

### [1.0.3](https://github.com/webwayer/nestjs-smart-modules/compare/v1.0.2...v1.0.3) (2026-07-14)


### Bug Fixes

* **smartModule:** stop mutating the definition's imports array across factory calls ([0224b7d](https://github.com/webwayer/nestjs-smart-modules/commit/0224b7d68c1869f0a22a37aa81e0ad387c7ef2be))

### [1.0.2](https://github.com/webwayer/nestjs-smart-modules/compare/v1.0.1...v1.0.2) (2025-10-08)

### [1.0.1](https://github.com/webwayer/nestjs-smart-modules/compare/v1.0.0...v1.0.1) (2025-07-05)

## 1.0.0 (2025-07-05)
