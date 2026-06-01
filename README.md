# pr-risk-diff

Advisory PR merge-risk scoring with [Google ADK](https://adk.dev/) (TypeScript).

Runs on PRs to `main` after CI checks pass; publishes a PR comment and **Risk Assessment** check.

## Quick start

```bash
pnpm install
cp .env.example .env   # set GEMINI_API_KEY
pnpm typecheck && pnpm lint
```

## Learn more

- [MVP behavior](docs/mvp.md)
- [Consumer install](docs/consumer-install.md)
- [Pilot: directhub-service](docs/pilot-directhub-service.md)
- [Ideas & backlog](docs/ideas.md)
