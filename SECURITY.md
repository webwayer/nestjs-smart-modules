# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a Vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private vulnerability reporting instead: [Report a vulnerability](https://github.com/webwayer/nestjs-smart-modules/security/advisories/new). You will get a response within a few days; fixes are released through the normal release pipeline (with provenance) and credited unless you prefer otherwise.

## Scope Notes

The library has zero runtime dependencies and never touches the network or the filesystem — it only assembles NestJS `DynamicModule` objects from the configuration you pass. Reports about the behavior of NestJS itself belong in the [NestJS security process](https://github.com/nestjs/nest/security).
