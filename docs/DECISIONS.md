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
- Resolved in #16: home cards and `Enquire` now open the product page. `NotFoundPage` remains as the `*` catch-all.
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
- Product page (#16): `GET /products/:id` returns `Product` plus optional `description`; `rating` stays out of the wire shape. `description` is omitted when upstream has none. `design-system/contract.md` now defines `ProductDetail` (updated in the architect review); the client type is `ProductDetail` in `lib/api.ts`.
- Product page (#16) architect review fixes: (a) `ARCHITECTURE.md` still planned the id schema as `min(1).max(32)`; it now says `z.string().trim().regex(/^[\w-]+$/).max(64)`, matching this file. (b) `ARCHITECTURE.md` still listed `ProductDetail` as "open decision 1" and `NotFoundPage` as the temporary `/products/:id` handler; both updated. (c) The id failure message is 'That product link is not valid.' in `fields.id`. (d) `EnquiryForm`'s success button is labelled "Back to products", so on the product page `onDone` navigates to `/` and `onCancel` closes the dialog; the earlier note implied only closing. (e) The not-found state is inline in `ProductPage` with product-specific copy ("We could not find that product."), because `NotFoundPage` says "This page does not exist." (f) `Enquire` on this page is a primary `Button`; cards keep secondary. No conflict with `challenge.md`, `PRODUCT.md` or the rules. Details in `docs/design-gaps.md` (issue 16).
- Product page (#16): the route id must match `^[\w-]+$` and be at most 64 characters (this settles the `.`/`..` note above). Fake Store ids are digits, but the schema is not digits-only so a replacement provider with other id formats works.
- Product page (#16): a malformed id (fails the schema) is a `400 validation_failed`; a well-formed id the provider does not know is a `404 not_found` with the generic message. The client shows the not-found page copy for both, since a person cannot tell them apart.
- Product page (#16): the Fake Store adapter returns `null` for an unknown id (it answers an empty 200), and the service turns `null` into `NotFoundError`.
- Product page (#16): `/products/featured` is registered before `/products/:id` so "featured" is not read as an id.
- Product page (#16): the Enquire button opens a `Dialog` holding `EnquiryForm`, wired to the existing `sendEnquiry`. Until #17 adds `POST /enquiries` the form shows its honest "Enquiry not sent" error; it never reports success. #17 then adds server code only. Cards on home, category and search keep navigating to `/products/:id`.
- Product page (#16): copy and display follow `ProductCard`. Image `alt` is the product title, with the "No image" placeholder when the image is missing or fails to load. The price line is omitted when `price` is missing; otherwise `formatPrice` (USD). A missing `description` hides that section; a missing category hides the category line.
- Product page (#16): navigation is one "Back to products" link to `/` plus the category shown as a link to its category page when present. No breadcrumb component, no browser-history tricks.
- Product page (#16): `document.title` is `{title} - Catalogue`; for not-found it is `Product not found - Catalogue`. Loading, error (with retry) and not-found are separate states, as on the other pages. The error state covers network and 5xx.
- Product page (#16): the `/products/:id` placeholder pointing at `NotFoundPage` is replaced by the real `ProductPage` route. `NotFoundPage` stays as the `*` catch-all.
- Product page (#16): the Fake Store adapter checks the id against `/^[\w-]+$/` and returns `null` if it fails, even though the route already validates the same pattern. This is deliberate defence in depth: the route is not the only possible caller of the provider, and `encodeURIComponent('..')` leaves `..` unchanged, so without the guard a dot-segment id could resolve outside `/products`.
- Product page (#16): ids are not trimmed. A padded id such as ' 7 ' is a `400 validation_failed`, not silently read as `7`. A different string should not name the same product.
- Product page (#16): the Enquire dialog calls `sendEnquiry`, which fails with 'Enquiry not sent' until #17 adds `POST /enquiries`. It never reports success.
- Product page (#16): the image fallback (`useState`, `onError`, 'No image') is duplicated in `ProductCard` and `ProductPage`. Two uses; extract an `ImageWell` at a third.
- Product page (#16): the page sets `document.title` in a passive effect (`useEffect`), so it changes after the render. Tests must `waitFor` the title instead of asserting it right after render. One earlier failure of that assertion did not reproduce in about 30 runs; this race is its root cause (found in code review).
- Tailwind reminder (a recurring mistake): the Tailwind step here is 4px, so the design tokens `space-N` are not Tailwind step N. For example `space-5` (24px) is `gap-6` and `space-7` (48px) is `gap-12`; `gap-5` is 20px. Check the arithmetic against `tokens.json` before writing a spacing class.

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
