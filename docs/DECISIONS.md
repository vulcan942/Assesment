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
- Node 22 or newer is required (jsdom 31); Node 20 breaks the client jsdom tests. Tests here need Node 24. Local `node` may resolve to v20 via nvm in both Git Bash and PowerShell: put `C:\Program Files\nodejs` first on PATH and check `node -v` before debugging.
- Featured list: `FEATURED_PRODUCT_IDS` is a comma-separated string of ids, split and trimmed once in config. It is required with no code default (fail fast; the list is config, not code). `.env.example` ships `1,2,3,4,5`. Changing it needs a restart only.
- The count is not enforced: the endpoint returns whatever is configured, so "exactly five" in `.env.example` and `ARCHITECTURE.md` is a guideline, not a startup check. Blank entries are ignored. An empty list shows the empty state.
- `react-router` is justified: it routes home, category, search and product pages.
- Interim state: home cards and `Enquire` navigate to a NotFound page until the product page (#16) lands. `NotFoundPage` is a temporary placeholder.
- CORS has no preflight handling yet; it is added with the enquiry POST (#17).
- The server error handler logs `req.path` only. It must never log the enquiry body.
- Unknown `/api` paths return a JSON 404.
- Featured order is the configured order, not upstream order.
- A configured id the provider cannot find is skipped and logged. Other upstream failures (`UpstreamError`) fail the request, as for every endpoint. Reason: one stale id should not blank the home page.
- Featured cards link to `/products/:id`, the product page route.
- Featured empty state (no ids configured, or none found) reads "No featured products right now. Try browsing a category."
- Category page (#14) keeps the `{ topRated, products, page, pageSize, total }` shape but does not page yet: it returns every non-top-rated product with `page: 1`, `pageSize` equal to `products.length`, and `total` the count of `products`. `page` and `pageSize` query params are not read until #18 adds real paging.
- Ranking: rating descending, a missing rating sorts last, ties break by id ascending (numeric-aware string compare), so the order is stable. `topRated` is the first 3 of that order and `products` is the remainder in the same order, so no product appears twice. A category with 3 or fewer products has an empty `products` list.
- Category names are matched exactly and case-sensitively against `provider.listCategories()`, with no normalising. The client sends them with `encodeURIComponent` (for example `men's%20clothing`); Express decodes the path param.
- Unknown category: the service checks the name against `listCategories()` and throws `NotFoundError` (404). A known category with no products returns 200 with empty lists. Costs one extra upstream call; no caching, per the existing decision.
- Category names stay raw in the API. The UI uppercases the first letter only (CSS `first-letter:uppercase`; never title case, per the design README); no label mapping, and upstream spellings such as "jewelery" are not corrected.
- Category links appear in the site header nav (every page) and as a "Browse categories" list on home, from one shared component that reads `GET /categories`.
- Category page copy: empty reads "No products in this category yet. Try another category."; unknown reads "We could not find that category. Choose one from the menu."; the "Top rated" section heading shows only when `topRated` is not empty, and "More in this category" only when `products` is not empty.
- #14 unknown-category and not-found 404s use a generic server message, 'We could not find that.', because the same handler will serve products later. Each client page supplies its own copy.
- #14 the error handler maps any Express error with `status === 400` (bad percent-encoding such as `%E0%A4%A`, malformed JSON) to `400 bad_request`. Only 400 is mapped: other 4xx from Express (413, 415) still return 500. Accepted for the PoC.
- #14 category names are matched case-sensitively and exactly. `Electronics` is a 404; `electronics` is the name.
- #14 `total` and `pageSize` count `products` only, excluding `topRated`.
- #14 `document.title` uses the raw category name followed by " - Catalogue" (not capitalised). Minor, accepted.
- #14 shared link classes and breakpoint tokens are repeated in three places and intentionally not extracted yet. Revisit if a fourth appears.
- #14 the home page has no `h1`. This is a pre-existing gap from #13, to be settled; see `docs/design.md`.
- #14 bug fixed: in Tailwind v4, `outline-none` plus `outline-2` hid the focus ring on `Button`, `Input`, `Textarea` and `Toggle` since the first issues. Fixed with `focus-visible:outline-solid`.
- Search (#15): the term is trimmed, runs of whitespace collapse to one space, and the maximum is 100 characters after trimming (over the limit is a 400, not a silent cut). Matching is one case-insensitive plain substring of the whole term (`toLowerCase().includes`, no regex, so no injection and no escaping). Multi-word terms are not split: "red shirt" matches only text containing "red shirt". No accent folding.
- Search (#15): it matches `title` and `description` only, not category. The service reads `description` from the internal product, even though the list wire shape omits it.
- Search (#15): `q` missing, empty or whitespace-only on `GET /products` returns `400 validation_failed` with `fields.q` (the shared validation shape, ARCHITECTURE section 6) holding a message the client can show. `bad_request` stays only for unreadable requests (bad percent-encoding, malformed JSON). There is no "list all" mode. The client also blocks an empty submit with an inline message and makes no request.
- Search (#15): results keep provider order, not rating order (no brief requirement). Like #14, the response keeps `{ products, page, pageSize, total }` but returns all matches with `page: 1`, `pageSize` equal to `products.length`; `page` and `pageSize` params are ignored until #18.
- Search (#15): the client route is `/search?q=`. The search bar sits in the header on every page, wraps under the logo and nav on narrow screens, and shows the current term on the results page. No matches shows "No products match "term". Try a different word or browse a category."
- Search (#15): no suggestions, debounce or live search; it runs only on submit, per the acceptance criteria.
- Search (#15): each search calls `provider.list()` once per request upstream (about 20 items). There is no caching. Upgrade path: a short TTL cache in the service.
- Search (#15): the search field has `maxLength` 100 and the client only trims; the server collapses runs of whitespace.
- Search (#15): the results `h1` shows the term as typed.
- Search (#15): a 400 with `fields.q` shows a destructive Alert titled 'Search did not run' with the server's `q` message. Any other error, and a 400 without `fields.q`, keeps the generic 'Products did not load'.
- Search (#15): the `renderTitle` helper is now repeated in the Home, Category and Search pages (3 times). Not extracted yet; revisit at the next use.

## Dropped or simplified

- Design system is consumed as stock shadcn components in `client/src/components/ui` with tokens in `client/src/index.css`, not as a separate package. Fewer moving parts for one app.
- The "no raw colours" rule is a small script (`scripts/check-boundaries.mjs`), not an ESLint plugin: the client lints with oxlint, which has no rule for this. The same script also covers the Fake Store host, `server/` imports and `fetch(` outside `lib/api.ts` checks.
- `client/src/lib/api.ts` now exists and is the only place `fetch(` may appear.

## Growth path

- Add providers behind `ProductProvider` and `Mailer` interfaces in `server/src/providers`; select them by config.
- Add a build step for the server image (compile to JavaScript) when image size matters.
- AWS: the plain Dockerfiles and env-only config run on ECS or App Runner; swap Mailpit for SES through a new `Mailer` adapter.

## Next steps

- Feature issues: featured products, category listing, search, product page, enquiry flow.
- Record `docker compose up --build` time. Enquiry email landing in Mailpit is checked once the enquiry endpoint exists.
