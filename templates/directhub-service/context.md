# directhub-service risk context

## P0 / critical paths

- Authentication and session handling under service auth modules.
- Payment/billing integrations if touched in a PR.
- Database migrations and Prisma schema changes.

## Fragile areas

- GraphQL resolvers with heavy downstream dependencies.
- Deployment/gitops-related config consumed by production.

## Review expectations

- Schema changes require explicit migration review.
- Large refactors without tests should increase perceived risk.
