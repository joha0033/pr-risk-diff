# Consumer install

## MVP (agent runs in workflow job)

In the consumer repo (e.g. `directhub-service`):

```yaml
# .github/workflows/pr-risk.yml
name: PR Risk

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main]

jobs:
  assess:
    uses: adcellerant/pr-risk-diff/.github/workflows/assess-pr-risk.yml@main
    secrets:
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

Add `.pr-risk/context.md` on the default branch (customize critical paths).

## Hybrid (central API)

Deploy `pr-risk-diff` to Cloud Run with `GEMINI_API_KEY`, then:

```yaml
jobs:
  assess:
    uses: adcellerant/pr-risk-diff/.github/workflows/assess-pr-risk.yml@main
    secrets:
      PR_RISK_API_URL: ${{ secrets.PR_RISK_API_URL }}
      PR_RISK_API_KEY: ${{ secrets.PR_RISK_API_KEY }}
    with:
      use_remote_api: true
```

Consumer repos do not need `GEMINI_API_KEY` when using remote API mode.
