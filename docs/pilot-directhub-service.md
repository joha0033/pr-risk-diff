# Pilot: directhub-service

1. Merge `pr-risk-diff` to `main` first (reusable workflow must exist on default branch).
2. In `directhub-service`, add `.pr-risk/context.md` from [`templates/directhub-service/context.md`](../templates/directhub-service/context.md).
3. Add `.github/workflows/pr-risk.yml` from [`templates/directhub-service/pr-risk.yml`](../templates/directhub-service/pr-risk.yml).
4. Ensure org secret `GEMINI_API_KEY` is available to the repo.
5. Open a PR to `main` and verify:
   - Risk job runs after other checks pass.
   - Comment includes `<!-- pr-risk-assessment -->`.
   - Check **Risk Assessment** appears with tier/score.

Tune `.pr-risk/context.md` if scores are systematically too high/low.
