# PR Risk Rubric (Balanced — v1)

Score range: **0–100** (higher = more merge risk). Tiers:

| Tier | Score |
|------|-------|
| low | 0–25 |
| medium | 26–50 |
| high | 51–75 |
| critical | 76–100 |

## Factor weights (balanced)

| Factor ID | Weight | Signals |
|-----------|--------|---------|
| critical-paths | 0.25 | Auth, payments, PII, billing, webhooks |
| schema-migrations | 0.20 | DB migrations, Prisma/schema changes |
| infra-config | 0.15 | Terraform, Helm, CI/CD, env config |
| test-gap | 0.10 | Large logic change with few/no test file changes |
| dependency-security | 0.10 | Lockfile + vulnerable dep hints (when available) |
| pr-size-churn | 0.20 | Lines/files changed, hot-path churn |

## Guidance

- Prefer **actionable** factor rationales tied to file paths.
- Do not inflate score for formatting-only or docs-only PRs unless repo context says otherwise.
- When repo `.pr-risk/context.md` lists P0 paths, weight `critical-paths` heavily if those paths change.
- Output is **advisory only**; never imply merge blocking in v1.
