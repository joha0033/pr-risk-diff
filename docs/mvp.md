# PR Risk MVP

Advisory PR risk scoring using Google ADK (TypeScript), gated to PRs into `main` after CI checks pass.

## Behavior

| Gate | Rule |
|------|------|
| Branch | Base ref must be `main` |
| Checks | All check runs green (excludes **Risk Assessment** itself) |
| Reviews | Not required for assessment to run |
| Output | PR comment + check run **Risk Assessment** |
| Enforcement | Advisory only (v1) |
| Large diff | Fail-open: posts “unable to assess” if diff > 80k chars |

## Repo context

Add optional [`.pr-risk/context.md`](../templates/.pr-risk/context.md) on the PR branch.

## Local run

```bash
pnpm install
export GEMINI_API_KEY=...
# Build payload manually or via scripts/build-pr-payload.ts with gh auth
pnpm assess
pnpm publish   # needs GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA
```

## Pilot: directhub-service

1. Copy `templates/.pr-risk/context.md` → `directhub-service/.pr-risk/context.md` and customize.
2. Add org secret `GEMINI_API_KEY`.
3. Either enable workflow in `pr-risk-diff` after merge, or add consumer workflow (see [consumer-install.md](./consumer-install.md)).

## Phase 2 (hybrid)

Set org secrets `PR_RISK_API_URL` and `PR_RISK_API_KEY`, deploy Dockerfile to Cloud Run, call reusable workflow with `use_remote_api: true`.

## Phase 3 (multi-agent)

Set repo/org variable `USE_MULTI_AGENT=true`. Optional: `GITHUB_PERSONAL_ACCESS_TOKEN` for GitHub MCP (see `src/tools/mcp-github.ts`).
