# Decisions

## Assumptions

- Setup issues come before feature issues, so `server/` has a health endpoint only. The config loader validates every setting `.env.example` lists, because Docker and the later providers need them.
- The server runs TypeScript directly with `tsx` instead of a compile step: one less build stage for a small app. Revisit if start-up time or image size matters.
- Docker Compose reads `.env.example` directly so `docker compose up` works with no setup. A `.env` file overrides it.
- In Docker the client is served by nginx, which proxies `/api` to the server. The browser sees one origin; `CLIENT_ORIGIN` still sets the server's CORS allow-list.
- Mailpit is the default mail catcher: free, no signup, has a web UI.
- Work is on branch `setup/foundation` rather than the stale `feature` branch from `git-workflow.md`.

## Dropped or simplified

- Design system is consumed as stock shadcn components in `client/src/components/ui` with tokens in `client/src/index.css`, not as a separate package. Fewer moving parts for one app.
- The "no raw colours" rule is a small script (`scripts/check-boundaries.mjs`), not an ESLint plugin: the client lints with oxlint, which has no rule for this. The same script also covers the Fake Store host, `server/` imports and `fetch(` outside `lib/api.ts` checks.
- `client/src/data/sampleProducts.ts` still holds Fake Store URLs. The boundary check skips this one file until the client loads products from the API.
- `client/src/lib/api.ts` does not exist yet; the boundary check already names it as the only place `fetch(` may appear.
- Docker images were not built in the setup branch (no Docker daemon was available); `docker compose config` validates the file.

## Growth path

- Add providers behind `ProductProvider` and `Mailer` interfaces in `server/src/providers`; select them by config.
- Add a build step for the server image (compile to JavaScript) when image size matters.
- AWS: the plain Dockerfiles and env-only config run on ECS or App Runner; swap Mailpit for SES through a new `Mailer` adapter.

## Next steps

- Feature issues: featured products, category listing, search, product page, enquiry flow.
- Verify `docker compose up --build` end to end and record the time taken.
