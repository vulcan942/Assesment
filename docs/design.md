# Design

UI design for the catalogue PoC. Built only from `design-system/` components and the rulings in `docs/design-gaps.md`. Token names only; no raw colours, sizes or fonts.

Scope of this version: **issue 13, home screen (featured products)**. Other screens are added by later issues.

| Screen | Route | Status |
| --- | --- | --- |
| Home | `/` | Designed below |
| Category | `/categories/:category` | Later issue |
| Search results | `/search?q=` | Later issue |
| Product detail | `/products/:id` | Later issue (placeholder route until then) |
| Enquiry form and thank-you | on product detail | Later issue |

## App layout (shared by every page)

```
RootLayout (router root element)
  SiteHeader                                  no props
    header (border hairline below, surface)
      inner row (container classes)
        Link to="/"  "Catalogue"              t-heading-sm, ink
  main (container classes)
    <Outlet />                                the page
```

- Container classes (one shared string, per design-gaps): centred, max width `container-max`, horizontal padding `space-4` below 600px and `space-6` from 600px. The header inner row and `main` use the same string so the brand aligns with content.
- `main` vertical padding: `space-6` top and bottom below 960px, `space-8` from 960px.
- Brand link: at least `touch-target` tall, 2px `focus` outline with 2px offset, no underline change on hover beyond `accent` text. Text is "Catalogue". No logo, no nav, no search in this issue.
- Page background `surface`.

## Home

### Component tree

```
HomePage
  (inside RootLayout > main)
  section  aria-labelledby="featured-heading"
    h2 id="featured-heading"                  "Featured products"   t-heading-md, ink
    ProductGrid(products=featured, status, onEnquire, renderTitle, errorTitle, errorBody, emptyTitle, emptyBody)
      status "ready":   ul > li x N > ProductCard(product, onEnquire) x N
      status "loading": placeholder cards (aria-busy, aria-label "Loading products")
      status "error":   Notice (danger)
      empty:            Notice (info)
```

- `N` is whatever `GET /products/featured` returns (five by default). The page never assumes five.
- Data: `HomePage` calls `api.ts` for featured products and passes the `Product[]` straight into `ProductGrid`. No sorting, filtering or slicing in the component.
- Heading level: the page has no `h1` in the header, so the section heading is the first heading. Use `h2` as ruled and keep it; the header brand is a link, not a heading.
- Spacing: `space-5` between cards (set by `ProductGrid`), `space-4` between the heading and the grid.

### ProductCard on home

Existing `ProductCard` anatomy, unchanged except the optional `renderTitle` prop (see design-gaps, request 3):

```
ProductCard(product, onEnquire, renderTitle?)
  image well (surface-muted; image contained; "No image" if missing or broken)
  category        t-caption, ink-muted
  h3 > renderTitle(product)    t-heading-sm, ink, up to 2 lines
                               home passes: Link to=/products/:id wrapping product.title
  price           t-price, via formatPrice
  Button variant="secondary" "Enquire"   (sr-only " about {title}")
```

- The title is the link to `/products/:id` (`product.id` as given). Hover shows an underline in `accent`; focus is the 2px `focus` outline with 2px offset. Do not make the whole card a link: the `Enquire` button sits inside it and nested interactive elements are invalid.
- `Enquire` is the only action. There is no cart, buy, wishlist or quantity UI.
- `onEnquire` on home: the product page holds the enquiry form and does not exist yet, so `HomePage` passes a handler that navigates to `/products/:id`. `onEnquire` stays required. When the enquiry issue lands, that page opens the form. Ruled in design-gaps, request 2 (resolved).
- Card chrome unchanged: `border` hairline, `shadow-card`, `shadow-raised` on hover, `radius-lg`, `space-4` body padding.

### States

| State | What the user sees |
| --- | --- |
| Loading | `h2` "Featured products" stays. `ProductGrid status="loading"`: placeholder cards in `surface-muted` (`radius-sm` bars), `aria-busy="true"`, accessible name "Loading products". No spinner, no animation. |
| Ready | Cards in configured order, linked to `/products/:id`. |
| Error | `h2` stays. In place of the grid: `Notice` danger with an alert icon, title "Featured products did not load", body "We could not reach the catalogue. Check your connection and refresh the page to try again." Title `t-label` in `danger`, body `t-body-sm` in `ink` on `danger-bg`, `radius-md`. Announced with `role="alert"`. |
| Empty | `h2` stays. `Notice` info with an info icon, on `surface-muted`. Title "No featured products", body "No featured products right now. Try browsing a category." (copy fixed in `DECISIONS.md`). |
| Partial | A configured id the server cannot find is skipped by the server, so the grid just shows fewer cards. No special UI. |

Notes:

- Retry is a hint, not a button: the copy tells the user to refresh. No new control, so nothing to add to the system.
- "Try browsing a category" is plain text. Category links do not exist in this issue (design-gaps: nav deferred), so the empty copy must not render a link. The sentence stays as decided; when the category issue lands the header nav makes it true.
- The existing `ProductGrid` has fixed error and empty copy that does not match the above. Ruled in `docs/design-gaps.md` (request 1, resolved): optional `errorTitle`, `errorBody`, `emptyTitle`, `emptyBody` props on `ProductGrid`, with the current text as default.

### Responsive behaviour

Breakpoints: 600px and 960px only. Column count is not a breakpoint rule: `ProductGrid` fits as many columns as `card-min` allows.

| Width | Layout |
| --- | --- |
| Below 600px | One column of cards (a 220px minimum plus `space-4` page padding cannot fit two on common phones). Container padding `space-4`. Section top and bottom `space-6`. `h2` stays `t-heading-md`. Cards fill the width; `Enquire` is full width and at least `touch-target` tall. Error and empty notices fill the width. |
| 600px to 959px | Container padding `space-6`. Grid fits two to three columns by `card-min`, gap `space-5`. Section top and bottom `space-6`. |
| 960px and up | Full desktop spacing: `main` top and bottom `space-8`. Grid fits up to the `container-max` width, so four to five columns by `card-min`, gap `space-5`. |

- Five featured cards at `container-max` fit in one row or wrap to a second row of one or more cards; accepted, no special handling.
- Text never truncates except card titles, which clamp to two lines. Product prices and categories wrap.
- Touch: all interactive elements at least `touch-target` tall (brand link, title link tap area, `Enquire`).

### Accessibility

- Landmarks: `header`, `main`, one labelled `section`.
- Order of tab stops per card: title link, then `Enquire`.
- Images: `alt` is the product title (existing). Missing or failed image shows the words "No image".
- Loading is announced through `aria-busy` and the label, error through `role="alert"`; state is never colour alone (icon plus title plus words).
- Focus ring is never removed.

### Copy

| Where | Text |
| --- | --- |
| Brand link | Catalogue |
| Section heading | Featured products |
| Card action | Enquire |
| Loading label (accessible only) | Loading products |
| Error title | Featured products did not load |
| Error body | We could not reach the catalogue. Check your connection and refresh the page to try again. |
| Empty title | No featured products |
| Empty body | No featured products right now. Try browsing a category. |
| Image missing | No image |

Plain, sentence case, no exclamation marks, no emoji, no sales words. Prices appear exactly as the data gives them, through `formatPrice`.

## Not found

Temporary until the product page issue (#16) lands. Home cards and `Enquire` currently land here.

- Heading (h2): "This page does not exist."
- Link: "Go to the catalogue", underlined, goes to `/`.
