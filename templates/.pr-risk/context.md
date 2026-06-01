# Repository risk context

Describe paths, features, and behaviors that increase merge risk for this repo.

## P0 / critical paths

- Example: `src/billing/` — payment webhooks; outages affect revenue.
- Example: `src/auth/` — session and token handling.

## Known fragile areas

- Example: legacy report export pipeline (high regression history).

## Review expectations

- Schema migrations require DBA sign-off.
- Feature flags must default off in production config.
