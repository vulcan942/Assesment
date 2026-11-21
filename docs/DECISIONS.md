# Decisions

## Assumptions

- Server layout and tooling follow `docs/ARCHITECTURE.md`. The decisions below settle what it left open.
- Setup issues come before feature issues, so `server/` has a health endpoint only. The config loader validates every setting `.env.example` lists, because Docker and the later providers need them.
- The server runs TypeScript directly with `tsx` instead of a compile step: one less build stage for a small app. Revisit if start-up time or image size matters.
- Docker Compose reads `.env.example` directly so `docker compose up` works with no setup. A `.env` file overrides it.
- In Docker the client is served by nginx, which proxies `/api` to the server. The browser sees one origin; `CLIENT_ORIGIN` still sets the server's CORS allow-list.
- Mailpit is the default mail catcher: free, no signup, has a web UI.
- Work is on branch `setup/foundation` rather than the stale `feature` branch from `git-workflow.md`.
- Contract conflict: Fake Store field names are mapped inside the `fakestore` adapter. The API returns `Product`. `GET /products/:id` adds an optional `description`, so the product page can show full details; the list endpoints omit it. `design-system/contract.md` needs that one optional field.
- Routing uses `react-router`: four pages, and hand-rolled routing is more code than the dependency.
- "Top rated" is the top 3 by rating per category, a constant in the catalogue service. The brief gives no number.
- No caching in the PoC. Add an in-memory TTL cache inside the provider only if latency hurts.
- The interfaces are `ProductProvider` and `Mailer`, as in the rules. Agent and skill files were renamed to match.
- Fake Store requests time out after 5 seconds, a constant in the adapter.
- A 404 or an empty body from Fake Store means "not found", and `get by id` returns `null`. Other non-2xx, timeouts and invalid JSON become `UpstreamError`.
- Upstream data is validated all-or-nothing: one malformed product fails the whole list with `UpstreamError`, rather than silently dropping it.
- Fake Store ids are numbers; the adapter maps them to string ids in our `Product`.
- The pagination and top-rated response shapes in `client/src/lib/api.ts` follow `docs/ARCHITECTURE.md` and are unverified until the server routes exist.
- The provider factory is not wired into `server/src/index.ts` until the first service issue needs it.
- The adapter builds the upstream URL from the id, so the route-level id schema must reject `.` and `..`, for example `^[\w-]+$`.
- Node 22 is required (jsdom 31). Node 20 breaks the client jsdom tests.
- Test failures seen under Git Bash were a wrong Node on its PATH (v20, versus v24 in PowerShell), not a code bug. Check `node -v` first.

## Dropped or simplified

- Design system is consumed as stock shadcn components in `client/src/components/ui` with tokens in `client/src/index.css`, not as a separate package. Fewer moving parts for one app.
- The "no raw colours" rule is a small script (`scripts/check-boundaries.mjs`), not an ESLint plugin: the client lints with oxlint, which has no rule for this. The same script also covers the Fake Store host, `server/` imports and `fetch(` outside `lib/api.ts` checks.
- `client/src/data/sampleProducts.ts` still holds Fake Store URLs. The boundary check skips this one file until the client loads products from the API.
- `client/src/lib/api.ts` now exists and is the only place `fetch(` may appear.

## Growth path

- Add providers behind `ProductProvider` and `Mailer` interfaces in `server/src/providers`; select them by config.
- Add a build step for the server image (compile to JavaScript) when image size matters.
- AWS: the plain Dockerfiles and env-only config run on ECS or App Runner; swap Mailpit for SES through a new `Mailer` adapter.

## Next steps

- Feature issues: featured products, category listing, search, product page, enquiry flow.
- Record `docker compose up --build` time. Enquiry email landing in Mailpit is checked once the enquiry endpoint exists.
