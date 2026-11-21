# Design gaps

Rulings on pieces the five features need that `design-system/README.md` does not list. Rule: compose first; a new component needs a reason the existing ones cannot cover. Only issue 13 (home, featured products) is ruled on so far; later issues append here.

## SiteHeader

**Ruling: compose. No design-system component.** A small app-level `SiteHeader` in `client/src/components/` is plain markup, not a new design-system part.

- Markup: `<header>` containing one `<a>`/`<Link to="/">` with the brand text (plain text "Catalogue"; no logo, branding is pending). Styled with tokens only (`ink`, `t-heading-sm`, `border` hairline under it, `surface`). The link is at least 44px tall and shows the 2px focus outline.
- Props: none. It takes no `Product`.
- Scope in issue 13: brand link only. Category nav is deferred to the category-listing issue. Reason: `GET /categories` does not exist yet, and `product-scope.md` forbids endpoints and UI for later. The home page links to products only.
- When the category issue lands, it adds the nav to this header, built from `GET /categories` via `api.ts` and composed from `Button` (ghost) links or the existing `CategoryFilter`. At that point it needs its own loading/error/empty handling. Search box likewise belongs to the search issue.
- Why not a new component: the README lists seven components for browsing content, and a page header is a layout wrapper with one link. Nothing in it needs a new token, state or glyph.

## PageContainer

**Ruling: compose. No `PageContainer` component.**

- Use one shared layout (the router's root element) that renders `SiteHeader` and `<main>` with the container classes: centred, max width `container-max` (1200px), horizontal padding `space-4` below 600px and `space-6` above. Pages render inside `<main>` and never set their own width. This gives one place for the width, which is all a wrapper component would give.
- Props: none (it is a class string on `<main>`, and the same on the header's inner row so the brand aligns with the content).
- Gap to fix: `container-max` is in `tokens.json` but not yet mapped in `client/src/index.css`. The frontend-builder maps it there (colours rule: tokens only live in `index.css`) rather than hard-coding `1200px` or `max-w-7xl`.
- Revisit: if a second place needs the same wrapper (header inner row plus main is two uses of one class string), extract a constant, not a component.

## Other pieces issue 13 needs (already covered, no new component)

| Piece | Ruling | Reason |
| --- | --- | --- |
| Section heading ("Featured products") | Compose: `<h2>` with `t-heading-md` | A styled heading tag; no behaviour. |
| Featured list | Compose: `ProductGrid` of `ProductCard` | Already has loading (placeholder cards, `aria-busy`) and empty states. Empty copy: "No featured products right now. Try browsing a category." Error state: `Notice` danger with what happened and what to do. |
| Card link to `/products/:id` | Compose: card title as a link inside `ProductCard` | `Enquire` stays the only action. If `ProductCard` has no link to the product page yet, the optional `renderTitle` prop on the title is a change to an existing component, not a new one (see request 3, resolved). The product page itself is a later issue; until it exists the route can be a placeholder. |
| Home hero | Not needed | `t-display` is allowed but optional. Skipped: no requirement. |

## Designer requests (issue 13, for the architect)

No new components needed. Two changes to existing pieces and one question. All three **resolved**.

All changes below are made by the frontend-builder in `client/src/components/` (where `ProductGrid` and `ProductCard` live; `design-system/` holds the spec, tokens and docs only). Update the component's entry in `design-system/README.md` props when the props change.

1. **`ProductGrid` fixed copy. Resolved: compose (change existing component).**
   - Add optional props `errorTitle`, `errorBody`, `emptyTitle`, `emptyBody` (all `string`). Current text is the default in each, so other pages are untouched. Home passes the copy from `docs/design.md`.
   - Reason: four strings, no new markup or state. A wrapper component or a `Notice` rendered by the page would duplicate the status branching `ProductGrid` already owns.
2. **`onEnquire` on home. Resolved: keep `onEnquire` required; home navigates.**
   - `HomePage` passes `(p) => navigate(`/products/${p.id}`)` using react-router's `useNavigate`. `ProductCard` and `ProductGrid` signatures do not change for this.
   - Reason: an optional `onEnquire` would allow an `Enquire` button that does nothing, or hide it, and then "Enquire" is no longer on every card. Navigating keeps `Enquire` the only product action and the card needs no knowledge of routing. When the enquiry issue lands, the product page opens the form; home does not change.
3. **Title link. Resolved: render-prop, router-agnostic.**
   - `ProductCard` gets optional `renderTitle?: (product: Product) => ReactNode`. Inside the existing `<h3>` it renders `renderTitle(product)`, defaulting to `product.title`. `ProductGrid` gets the same optional prop and passes it to each card.
   - Home passes `(p) => <Link to={`/products/${p.id}`}>{p.title}</Link>`. The card never imports react-router and still takes only `Product`.
   - Link styling (in the card, so every page gets it): the `<h3>` keeps the two-line clamp; the link is a block with `min-h-11` and `items-center` for the 44px tap area, `ink` text, underline and `accent` colour on hover, 2px `focus` outline with 2px offset. Only the title is a link, never the whole card, because the card holds the `Enquire` button.
   - Reason: a plain `href` prop would force a full page reload in a client-routed app; a render-prop is the smallest way to stay router-agnostic. This is a change to an existing component, not a new one.

**Router.** `react-router` (v7, single `react-router` package, `createBrowserRouter`) is confirmed, as in `DECISIONS.md`. It is not yet in `client/package.json`; the frontend-builder adds it and states the justification (four pages, `Link`, `useNavigate`, `Outlet`). It is free, needs no account and is acceptable under `security-config.md` and `CLAUDE.md` ("no new libraries without asking" is satisfied by this ruling plus `DECISIONS.md`). No other routing or data library is approved.

## Conflicts found

1. **`server/src/config.ts` still enforces five ids** (`.length(5, ...)`). `docs/DECISIONS.md` says the count is not enforced and blank entries are ignored. Resolution: backend-builder removes the `.length(5)` pipe (keep split, trim, filter blanks) and updates `config.test.ts`. `ARCHITECTURE.md` now matches `DECISIONS.md`.
2. **`design-system/contract.md` has no `description`** but `GET /products/:id` returns it (already in `DECISIONS.md`). Not an issue 13 blocker: the featured endpoint returns `Product` exactly as the contract defines it. Update `contract.md` in the product-page issue.
3. **`ProductGrid` contract says category chips come from loaded products** (`contract.md`), but the API serves `GET /categories`. Resolution for the category issue: the server list wins, the client does not derive categories. Not needed for issue 13.
4. **Server `Product.id` is `string`, contract allows `string | number`.** Compatible: the server only emits strings.
