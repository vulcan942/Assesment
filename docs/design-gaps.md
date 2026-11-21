# Design gaps

Rulings on pieces the five features need that `design-system/README.md` does not list. Rule: compose first; a new component needs a reason the existing ones cannot cover. Issue 13 (home, featured products) and issue 14 (category page) are ruled on so far; later issues append here.

## SiteHeader

**Ruling: compose. No design-system component.** A small app-level `SiteHeader` in `client/src/components/` is plain markup, not a new design-system part.

- Markup: `<header>` containing one `<a>`/`<Link to="/">` with the brand text (plain text "Catalogue"; no logo, branding is pending). Styled with tokens only (`ink`, `t-heading-sm`, `border` hairline under it, `surface`). The link is at least 44px tall and shows the 2px focus outline.
- Props: none. It takes no `Product`.
- Scope in issue 13: brand link only. Category nav was deferred to the category-listing issue, because `GET /categories` did not exist yet and `product-scope.md` forbids endpoints and UI for later.
- Issue 14 added the nav to this header (done): built from `GET /categories` via `api.ts`, composed from `Button` (ghost) links (ruled in the issue 14 section below; `CategoryFilter` was deleted), with its own loading/error/empty handling. The search box belongs to the search issue.
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

## Issue 14 (category page)

### SectionHeading

**Ruling: compose. No component.** Same as the issue 13 row: a styled `<h2>` with `t-heading-md`. Used for "Top rated" and "More in this category" (each only when its list is not empty, per `DECISIONS.md`). The page title is an `<h1>` with the category name (first letter uppercased via CSS, not `capitalize`). Three uses of one tag plus a class; a component would add no behaviour. If the class string repeats on three pages, share a constant, not a component.

### Category nav (header and home)

**Ruling: compose. One app-level component in `client/src/components/`, `CategoryNav`, no new design-system part.**

- Markup: `<nav aria-label="Categories">` with a `<ul>` of `Link`s (react-router) to `/categories/${encodeURIComponent(name)}`. Links are styled with the existing `Button` `variant="ghost"` via `asChild` (or the same classes), at least 44px tall, 2px focus outline with 2px offset, first letter uppercased (`first-letter:uppercase`). Wraps onto several rows; no horizontal scroll, no menu, no animation.
- Data: it calls `api.getCategories()` itself and owns loading (a short text or placeholder), error (`Notice` danger, one line, what happened and what to do) and empty (renders nothing). One fetch per mount: the header and home each mount it, which is two calls to a cheap endpoint; no shared cache or context (no caching decision). If that bothers you later, lift the fetch into `RootLayout`; not now.
- The current page is marked with `aria-current="page"` on its link.
- Why one component, not two: the header and the home "Browse categories" list differ only by heading and layout, so `CategoryNav` takes only optional `className` and `heading` (see the issue 14 designer requests, resolved).
- Why not a new design-system component: it is a list of links; nothing needs a new token, state or glyph.

### CategoryFilter.tsx

**Ruling: delete it.** It is unused, and it does the wrong job:

- It derives categories from loaded `Product[]`, which conflicts with the rule that the server list wins (conflict 3 below) and with the "no filtering in the client" rule in `frontend.md`.
- It is a toggle group with `onChange` and an "All" option, so it filters in place. We navigate to a category URL instead, which needs links, not toggles, for correct semantics (back button, shareable URL, screen readers announce links).
- Done: the file is deleted. `design-system/contract.md` line 29 ("Category chips come from the distinct `category` values of the products you load, plus an All chip") now reads: category links come from `GET /categories` (done in `contract.md`). `README.md` does not name `CategoryFilter`, so only that line changes. Chip tokens stay available; nothing else in the design system moves.

### Category page structure

**Ruling: compose. `CategoryPage` in `client/src/pages/` from existing parts.**

- `<h1>` category name, then, in order: `<h2>` "Top rated" + `ProductGrid` (when `topRated` non-empty), `<h2>` "More in this category" + `ProductGrid` (when `products` non-empty).
- Loading: one `ProductGrid` in loading state. Error: `ProductGrid` error state with default copy. Empty (both lists empty): one `ProductGrid` with `emptyTitle`/`emptyBody` set to "No products in this category yet. Try another category."
- Unknown category (API 404): `Notice` with "We could not find that category. Choose one from the menu." The page distinguishes it by the `api.ts` error type (status 404), not by parsing messages. No new component.
- Cards use the same `renderTitle` link and `onEnquire` navigation as home (ruled above). No sorting or filtering controls. Pagination controls are #18.
- Route: `/categories/:category` in `routes.tsx`; the param is decoded by react-router before use.

### Designer requests (issue 14, for the architect)

No new components. Two requests, both **resolved** with one optional prop.

1. **Heading owned by `CategoryNav`. Resolved: accept `heading?: string`.**
   - With `heading` set, `CategoryNav` renders a wrapper `<div className>` holding `<h2 id={useId()}>{heading}</h2>` and the `<nav>`. `HomePage` drops its own `section` and `h2` and passes `heading="Browse categories"`. The header passes none, so it renders only the `<nav>`.
   - Empty state renders nothing at all (wrapper, heading and its outer spacing included), so no heading over an empty list. The heading shows in loading, ready and error states, same as "Featured products" on home. `className` goes on the outermost element rendered.
   - Reason: the component already knows when it is empty; the parent does not. One prop, no callback.
2. **Duplicate landmark name. Resolved: no `label` prop; derive it.**
   - With `heading` set, the nav uses `aria-labelledby` pointing at the `h2` (name "Browse categories"). Without it, `aria-label="Categories"`. The two navs are then distinctly named from the one prop in request 1.
   - Reason: a second prop would only restate the heading text and could drift from it.

The nav error copy ("Categories did not load" / "Refresh the page to try again.") and the unknown-category tone (info `Notice`, not danger) are design choices in `docs/design.md`, not requests.

## Conflicts found

1. **`server/src/config.ts` still enforces five ids** (`.length(5, ...)`). `docs/DECISIONS.md` says the count is not enforced and blank entries are ignored. Resolution: backend-builder removes the `.length(5)` pipe (keep split, trim, filter blanks) and updates `config.test.ts`. `ARCHITECTURE.md` now matches `DECISIONS.md`.
2. **`design-system/contract.md` has no `description`** but `GET /products/:id` returns it (already in `DECISIONS.md`). Not an issue 13 blocker: the featured endpoint returns `Product` exactly as the contract defines it. Update `contract.md` in the product-page issue.
3. **`ProductGrid` contract says category chips come from loaded products** (`contract.md`), but the API serves `GET /categories`. Resolution for the category issue: the server list wins, the client does not derive categories. Not needed for issue 13.
4. **Server `Product.id` is `string`, contract allows `string | number`.** Compatible: the server only emits strings.
