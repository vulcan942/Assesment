# Design

UI design for the catalogue PoC. Built only from `design-system/` components and the rulings in `docs/design-gaps.md`. Token names only; no raw colours, sizes or fonts.

Scope of this version: **issue 13 (home, featured products)**, **issue 14 (category nav and category page)** and **issue 15 (search bar and results page)**. Other screens are added by later issues.

| Screen | Route | Status |
| --- | --- | --- |
| Home | `/` | Designed below |
| Category | `/categories/:category` | Designed below |
| Search results | `/search?q=` | Designed below (with the search bar) |
| Product detail | `/products/:id` | Later issue (placeholder route until then) |
| Enquiry form and thank-you | on product detail | Later issue |

## App layout (shared by every page)

```
RootLayout (router root element)
  SiteHeader                                  no props
    header (border hairline below, surface)
      inner row (container classes)
        Link to="/"  "Catalogue"              t-heading-sm, ink
        CategoryNav                           see "Category nav" below
        SearchBar                             see "Search bar" below; below 960px on its own row under the nav
  main (container classes)
    <Outlet />                                the page
```

- Container classes (one shared string, per design-gaps): centred, max width `container-max`, horizontal padding `space-4` below 600px and `space-6` from 600px. The header inner row and `main` use the same string so the brand aligns with content.
- `main` vertical padding: `space-6` top and bottom below 960px, `space-8` from 960px.
- Brand link: at least `touch-target` tall, 2px `focus` outline with 2px offset, no underline change on hover beyond `accent` text. Text is "Catalogue". No logo. The category nav (issue 14) and search bar (issue 15) are the other two header children.
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
  CategoryNav heading="Browse categories"      same component as the header; renders its own h2
    div (className: top spacing)
      h2 id (useId)                             "Browse categories"   t-heading-md, ink
      nav aria-labelledby=h2 id                 own loading/error/empty
```

- "Browse categories" sits below the featured section, `space-6` below the grid below 960px and `space-7` from 960px (top spacing is on the `CategoryNav` wrapper via `className`). Heading to nav gap `space-4`. The heading shows in loading, ready and error; when the list is empty `CategoryNav` renders nothing (wrapper, heading and spacing), so there is no heading over an empty list. It does not depend on the featured status: if featured fails, categories still show.
- This makes the featured empty copy "Try browsing a category" true: the header nav and this block both link to categories.
- The `h2` is owned by `CategoryNav` via an optional `heading` prop, and names the nav through `aria-labelledby` (design-gaps, issue 14 requests 1 and 2, resolved).

- `N` is whatever `GET /products/featured` returns (five by default). The page never assumes five.
- Data: `HomePage` calls `api.ts` for featured products and passes the `Product[]` straight into `ProductGrid`. No sorting, filtering or slicing in the component.
- Heading level: the page has no `h1` in the header, so the section heading is the first heading. Use `h2` as ruled and keep it; the header brand is a link, not a heading. Open gap: the home page still has no `h1` (the category page has one). To be settled; recorded in `DECISIONS.md`.
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
- "Try browsing a category" is plain text, not a link. The header nav and the "Browse categories" block hold the links.
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

- Landmarks: `header` with `nav` "Categories", `main`, one labelled `section` (featured), and `nav` "Browse categories" (named by its heading).
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

## Category nav

`CategoryNav` (app-level, `client/src/components/`, ruled in design-gaps issue 14). Used in the header on every page and in the home "Browse categories" block.

### Component tree

```
CategoryNav(className?, heading?)
  [heading set: div(className) > h2 "heading", nav aria-labelledby=h2]
  [no heading:  nav(className) aria-label="Categories"]
    status "ready":   ul > li x N > Link to=/categories/{encodeURIComponent(name)}
                        rendered as Button variant="ghost" asChild, aria-current="page" on the active one
                        text = category name, first letter uppercased (first-letter:uppercase)
    status "loading": div role="status" aria-busy="true" aria-label "Loading categories" > ul (aria-hidden) > li x 4 placeholder bars (surface-muted, radius-sm)
    status "error":   Notice (danger), one line
    status "empty":   renders nothing (no nav, no wrapper, no heading)
```

- Links: ghost `Button` (`accent` text, `t-label`), at least `touch-target` (44px) tall, horizontal padding `space-4`, 2px `focus` outline with 2px offset, `radius-md`. The active link has `aria-current="page"` and also shows an `accent-subtle` fill and underline, so it is not colour alone. Gap between links `space-2`.
- Names are shown as the server gives them (first letter uppercased only, never title case; "jewelery" is not corrected).
- Placeholder bars are the same height as a link (`touch-target`), no animation.

### States

| State | What the user sees |
| --- | --- |
| Loading | Four placeholder bars in `surface-muted`, `aria-busy="true"`, accessible name "Loading categories". Reserves the row height so the page does not jump. |
| Ready | One link per category from `GET /categories`, in server order. |
| Error | One-line `Notice` danger: title "Categories did not load", body "Refresh the page to try again." Announced with `role="alert"`. Brand link and page content still work. |
| Empty | Nothing rendered, including the home heading. |

### Placement and responsive

Wraps onto further rows; no horizontal scroll, no menu, no animation. Wrapping keeps every link at 44px with no hidden items.

| Width | Header | Home "Browse categories" block |
| --- | --- | --- |
| Below 600px | Brand link on its own row, nav on rows below it (`space-2` between). Container padding `space-4`. Links wrap as needed; the Notice fills the width. | Same wrap, links start at the left edge, `space-2` gaps. |
| 600px to 959px | Same stacked layout as below 600px; container padding `space-6`. | Same. |
| 960px and up | Brand and nav on one row: brand at the left, nav fills the rest and wraps if it must; vertically centred, `space-4` between brand and nav. | Same wrap. |

- Header padding: `space-3` top and bottom below 960px, `space-4` from 960px. Hairline `border` below, as before.
- Order of tab stops in the header: brand, then each category link.

Copy: Loading label (accessible only) "Loading categories"; error title "Categories did not load"; error body "Refresh the page to try again."; home heading "Browse categories".

## Category page

Route `/categories/:category`. Rendered inside `RootLayout > main`; the header nav shows the current category as active.

### Component tree

```
CategoryPage
  h1                                            category name, first letter uppercased (first-letter:uppercase), t-heading-lg (`--text-heading-lg` token, 28px) at every width
  status "ready", topRated non-empty:
    section aria-labelledby="top-rated-heading"
      h2 id="top-rated-heading"                 "Top rated"   t-heading-md, ink
      ProductGrid(products=topRated, status="ready", onEnquire, renderTitle)
        ul > li x N > ProductCard(product, onEnquire, renderTitle)
  status "ready", products non-empty:
    section aria-labelledby="more-heading"
      h2 id="more-heading"                      "More in this category"   t-heading-md, ink
      ProductGrid(products=products, status="ready", onEnquire, renderTitle)
  status "loading":
    ProductGrid(products=[], status="loading")
  status "error":
    ProductGrid(products=[], status="error")
  status "ready", both lists empty:
    ProductGrid(products=[], status="ready", emptyTitle, emptyBody)
  status "not-found" (API 404):
    h1 "Category not found" + Alert (info) with the body copy
```

- Data: `CategoryPage` calls `api.ts` for the category using the decoded `:category` param and passes the lists straight to `ProductGrid`. `topRated` and `products` never overlap (server guarantee); no sorting, filtering, slicing or de-duplication in the component.
- Each heading appears only when its own list is non-empty. A category with three or fewer products shows only "Top rated". No page controls, sort or filter controls (paging is #18).
- `renderTitle` is a `Link` to `/products/:id`; `onEnquire` navigates to `/products/:id`, same as home.
- Spacing: `space-5` between `h1` and the first section, `space-6` between sections below 960px and `space-7` from 960px, `space-4` between a section heading and its grid.
- The `h1` is the first heading on this page (the header has no heading). Section headings are `h2`, cards `h3`.

### States

| State | What the user sees |
| --- | --- |
| Loading | `h1` shows the category name from the URL. Below it one `ProductGrid status="loading"`: placeholder cards, `aria-busy="true"`, name "Loading products". No section headings. |
| Ready | `h1`, then "Top rated" grid, then "More in this category" grid, each heading only with a non-empty list. |
| Error | `h1` stays. `ProductGrid` error `Notice` danger, default copy (title "Products did not load", body "Check your connection and refresh the page to try again.", the existing `ProductGrid` defaults). `role="alert"`. No section headings. |
| Empty | `h1` stays. `Notice` info, title "No products found" (default), body "No products in this category yet. Try another category." (copy from `DECISIONS.md`). No section headings. |
| Unknown category (404) | `h1` reads "Category not found"; below it an `Alert` (info) with the body "We could not find that category. Choose one from the menu." (copy from `DECISIONS.md`). The header nav and "Browse" links stay as the way out; no category is active. No product grid. |

Notes:

- The page tells 404 from other errors by the `api.ts` error type (status 404), not by message text.
- The unknown-category `Alert` uses the info tone, not danger: the site is working and the URL is wrong. Announced with `role="status"`. "Choose one from the menu" refers to the header category nav, which is on every page.
- Retry is a hint ("refresh the page"), no button.

### Responsive behaviour

Breakpoints: 600px and 960px only. Column count comes from `card-min`, not a breakpoint rule.

| Width | Layout |
| --- | --- |
| Below 600px | One column of cards. Container padding `space-4`. `h1` and `h2` at their token sizes. `Enquire` full width, at least `touch-target` tall. Notices fill the width. |
| 600px to 959px | Container padding `space-6`. Grid fits two to three columns, gap `space-5`. Section gap `space-6`. |
| 960px and up | `main` top and bottom `space-8`. Grid fits four to five columns up to `container-max`, gap `space-5`. Section gap `space-7`. |

- Card titles clamp to two lines; nothing else truncates. Long category names in the `h1` wrap.
- All interactive elements at least `touch-target` tall.

### Accessibility

- Landmarks: `header` with `nav` "Categories", `main`, one labelled `section` per non-empty list.
- The heading order is `h1`, `h2`, `h3`. Section headings are absent when the list is, so there is no heading over nothing.
- Active category link has `aria-current="page"`.
- Document title is the raw category name followed by " - Catalogue", set by the page and reset to "Catalogue" on leave.
- State is never colour alone.

### Copy

| Where | Text |
| --- | --- |
| Page title (h1) | Category name from the server, first letter uppercased by CSS |
| Section heading 1 | Top rated |
| Section heading 2 | More in this category |
| Card action | Enquire |
| Loading label (accessible only) | Loading products |
| Error title | Products did not load |
| Error body | Check your connection and refresh the page to try again. |
| Empty title | No products found (ProductGrid default) |
| Empty body | No products in this category yet. Try another category. |
| Unknown title | Category not found |
| Unknown body | We could not find that category. Choose one from the menu. |

## Search bar

`SearchBar` (app-level, `client/src/components/`, ruled in design-gaps issue 15). Third child of `SiteHeader`, on every page. Home and category pages do not get a second one. It never calls the API: it navigates to `/search?q=` and the results page fetches.

### Component tree

```
SearchBar(defaultValue?, className?)
  form role="search" noValidate
    div (row: field + button, gap space-2)
      Label htmlFor=id                       "Search products"   sr-only, t-label
      Input id type="search" name="q"        placeholder "Search products", maxLength=100,
                                             aria-invalid + aria-describedby only while the error shows
      Button variant="primary" type="submit" "Search"
    [error only] p id role="alert"           inline alert glyph + "Enter a word to search for."
```

- `Label` is a real `<label>` bound to the field and visually hidden: the `search` landmark and the adjacent "Search" button make the purpose visible. Never placeholder-only.
- Placeholder "Search products" repeats the label in `ink-muted` (holds 4.5:1 on `surface`); it vanishes on typing and is not relied on for the name.
- `Input`: at least `touch-target` (44px) tall, text `t-body` (16px, so mobile browsers do not zoom), `surface` fill, `border-control` border, `radius-md`, `space-3` padding. `Button` primary: at least `touch-target` tall, `t-label`, `accent` fill with `on-accent` text, `accent-hover` on hover, `radius-md`. Field takes the remaining row width; button is its natural width.
- Focus: 2px `focus` outline with 2px offset on both the field and the button, never removed. Field border stays `border-control` (3:1) when not focused.
- Native `type="search"` clear control may show; it is not restyled and not relied on. The form is `noValidate` so the browser's own bubble never replaces our message.

### Showing the current term

- On `/search`, `SiteHeader` reads `q` with `useSearchParams` and passes it as `defaultValue` (trimmed). The bar is keyed on the term, so a new search resets the field to the new term.
- On every other page the term is empty and the field is blank.
- The field is uncontrolled beyond that: what the user types is not synced to the URL until submit.

### States

| State | What the user sees |
| --- | --- |
| Idle | Label (sr-only), empty or prefilled field, "Search" button. |
| Empty or whitespace-only submit | No navigation, no request. The message "Enter a word to search for." appears under the field in `danger`, `t-body-sm`, with the alert glyph (20px, 2px stroke, `currentColor`) so it is not colour alone. The field border changes to `danger`. Focus stays in (or returns to) the field. |
| Error cleared | The message and `aria-invalid` are removed on the next edit of the field, or on a valid submit. |
| Over-long | `maxLength=100` stops typing at 100 characters. No separate message; paste is cut by the browser. |
| Valid submit | Navigates to `/search?q={encodeURIComponent(trimmed term)}`. The client trims only; it does not collapse whitespace or match anything. |

- Error association: the message `<p>` has an `id`; while it shows, the `Input` has `aria-invalid="true"` and `aria-describedby` set to that id. When it is gone both attributes are removed (no dangling reference). The message has `role="alert"` because it appears after a submit and must be announced; the field keeps focus so the name, invalid state and description are read together.
- The message is in normal flow under the field. From 960px the header grows by one line while it shows; nothing overlaps.

### Responsive behaviour

Breakpoints 600px and 960px only. The header inner row is `flex-col` below 960px and a single row from 960px.

| Width | Layout |
| --- | --- |
| Below 600px | Stacked: brand row, `CategoryNav` rows, then the search row. The search form fills the container width (padding `space-4`); field and button on one row, `space-2` apart. `space-2` gap between brand and nav as before, `space-3` between nav and search. No horizontal scroll: the field shrinks (`min-w-0`), the button never wraps. Error message wraps under the field. |
| 600px to 959px | Same stack; container padding `space-6`. Search form still fills the width. Header padding `space-3` top and bottom. |
| 960px and up | One row, vertically centred: brand at the left, `CategoryNav` takes the free space and wraps within it, `SearchBar` pushed to the right (`ml-auto`), kept from shrinking, with the field `card-min` wide plus the button. `space-4` between items. Header padding `space-4`. |

- Fit check: at the widest case (`container-max` minus `space-6` padding each side) brand, search (`card-min` field, `space-2`, button) and the nav fit on one row for the few categories the catalogue has. If the nav needs more room it wraps onto more rows inside its own column; the search bar stays on the right and the row grows taller. At 960px exactly the nav column is narrow and wraps sooner; accepted. No item is hidden, no scrolling, no menu.
- Tab order in the header: brand, each category link, search field, "Search".

### Copy

| Where | Text |
| --- | --- |
| Label (sr-only) | Search products |
| Placeholder | Search products |
| Button | Search |
| Empty-submit error | Enter a word to search for. |

## Search results page

Route `/search?q=`. Rendered inside `RootLayout > main`; the header search bar shows the term.

### Component tree

```
SearchPage
  h1                                  Results for "term"   t-heading-lg, ink, wraps (overflow-wrap anywhere)
  status "ready", results non-empty:
    h2 (sr-only)                      "Matching products"
    ProductGrid(products, status="ready", onEnquire, renderTitle)
      ul > li x N > ProductCard(product, onEnquire, renderTitle)
  status "loading":
    ProductGrid(products=[], status="loading")
  status "error":
    ProductGrid(products=[], status="error")          default copy
  status "ready", no matches:
    ProductGrid(products=[], status="ready", emptyTitle, emptyBody)
  q missing or empty (no request):
    h1 "Search products"
    Notice (info)
```

- Data: `SearchPage` reads `q` with `useSearchParams`, trims it, and calls `api.searchProducts(q)`. It passes the `Product[]` straight to `ProductGrid`. No matching, ranking, filtering or slicing in the component; the server returns provider order. One grid only, no sections, no sort or filter controls. Paging is #18.
- Cards: `renderTitle` is a `Link` to `/products/:id` and `onEnquire` navigates to `/products/:id`, same as home and category. `Enquire` is the only product action.
- `term` is the trimmed `q` shown as plain text (React escapes it), in straight double quotes.
- A result count is not shown (no requirement).
- Heading order: `h1`, then the sr-only `h2` (only when ready, so cards do not jump from `h1` to `h3`), then card `h3`. The header has no heading.

### States

| State | What the user sees |
| --- | --- |
| Loading | `h1` with the term. One `ProductGrid status="loading"`: placeholder cards in `surface-muted` (`radius-sm` bars), `aria-busy="true"`, name "Loading products". No spinner, no animation. No `h2`. |
| Ready | `h1`, then cards in server order, linked to `/products/:id`. |
| Error | `h1` stays. `ProductGrid` error `Notice` danger, A 400 with `fields.q` (for example an over-long term reached by editing the URL) shows a destructive `Alert` titled "Search did not run" with the server's `q` message as the body (for example "Use 100 characters or fewer."). Any other error, and a 400 without `fields.q`, shows the default copy: title "Products did not load", body "Check your connection and refresh the page to try again.". `role="alert"`. The client trims only; the server collapses whitespace. |
| Empty | `h1` stays. `Notice` info on `surface-muted`: title `No products match "term"`, body "Try a different word or browse a category." The header nav is the way to browse. |
| Missing or empty `q` | No request. `h1` reads "Search products". `Notice` info: title "No search term", body "Enter a word to search for." The header search box is the control. No grid. |

Notes:

- Retry is a hint ("refresh the page"), no button.
- Long term: the term is at most 100 characters after trimming (the bar's `maxLength`), but a URL can carry more; the `h1` and the empty-state `Notice` title both wrap (`overflow-wrap: anywhere`), never truncate and never cause horizontal scroll, at 320px as at desktop.
- A new search from the header changes `q`, which returns the page to loading for the new term; the `h1` and `document.title` follow.

### Responsive behaviour

Breakpoints 600px and 960px only. Column count comes from `card-min`, not a breakpoint rule.

| Width | Layout |
| --- | --- |
| Below 600px | One column. Container padding `space-4`. `h1` stays `t-heading-lg`, wraps over lines. `space-5` between `h1` and grid. `Enquire` full width, at least `touch-target` tall. Notices fill the width. |
| 600px to 959px | Container padding `space-6`. Grid fits two to three columns, gap `space-5`. |
| 960px and up | `main` top and bottom `space-8`. Grid fits four to five columns up to `container-max`, gap `space-5`. |

### Accessibility

- Landmarks: `header` with `nav` "Categories" and `search` (the form), then `main`.
- Document title: `Search - Catalogue`, set by the page and reset to "Catalogue" on leave. It does not include the term.
- Loading through `aria-busy` and the label, error through `role="alert"`, empty and missing-term notices as `role="status"`. State is never colour alone (icon, title and words).
- Tab order after the header: title link, then `Enquire`, per card.

### Copy

Straight double quotes around the term. Sentence case, no exclamation marks.

| Where | Text |
| --- | --- |
| Page title (h1) | Results for "term" |
| Page title, no term | Search products |
| Sr-only section heading | Matching products |
| Card action | Enquire |
| Loading label (accessible only) | Loading products |
| Error title | Products did not load |
| Error body | Check your connection and refresh the page to try again. |
| Error title, 400 with `fields.q` | Search did not run |
| Error body, 400 with `fields.q` | The server's `q` message, for example "Use 100 characters or fewer." |
| Empty title | No products match "term" |
| Empty body | Try a different word or browse a category. |
| No-term title | No search term |
| No-term body | Enter a word to search for. |
| Document title | Search - Catalogue |

## Not found

Temporary until the product page issue (#16) lands. Home cards and `Enquire` currently land here.

- Heading (h2): "This page does not exist."
- Link: "Go to the catalogue", underlined, goes to `/`.
