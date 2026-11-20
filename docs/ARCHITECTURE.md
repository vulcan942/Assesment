# Architecture

How the catalogue PoC is structured and why. Scope comes from `challenge.md` and `docs/PRODUCT.md`. Rules in `.claude/rules/` are the enforced version of this document; where they overlap, the rules win.

## 1. Goals and constraints

| Source | Constraint | How the design answers it |
| --- | --- | --- |
| challenge.md | Client never calls Fake Store; all product data goes through our backend | Only `server/` knows the Fake Store host. `client/` talks to `/api` only (checked by `scripts/check-boundaries.mjs`). |
| challenge.md | Foundation, not a throwaway: data source, look and feel, email provider will change | Three seams, each changed in one place (section 8). |
| challenge.md | Runs locally in under 10 minutes, no paid accounts | `docker compose up` starts client, server and Mailpit. Config from `.env.example`. |
| challenge.md | AWS-compatible infrastructure, no secrets in the repo | Plain Dockerfiles, env-only config, Mailpit swapped for SES behind an interface. |
| challenge.md | Time-box 2 to 3 hours | Smallest structure that still keeps the three seams. No speculative layers. |

Non-goals: cart, checkout, accounts, admin, final branding, real product metadata.

## 2. Stack and why

| Layer | Choice | Reason |
| --- | --- | --- |
| Client | React 19, TypeScript, Vite, Tailwind, shadcn/ui | Web is the quickest to run and review. shadcn gives accessible parts we own as source, with tokens in one CSS file. |
| Backend | Node.js, TypeScript (strict), Express 5, zod | Same language as the client. Express is small and well known. zod validates every request at the edge and types the config. |
| Mail (local) | Mailpit over SMTP | Free, no signup, shows the sales email in a web UI. |
| Packaging | Docker Compose, nginx serves the client and proxies `/api` | One origin for the browser, one command to run. |
| Tests | Vitest in both packages, Testing Library on the client | Same runner everywhere, tests run with no network. |

## 3. System context

```
 Browser
    |  one origin (http://localhost:8080)
    v
 client container  (nginx: static React app, proxies /api)
    |  HTTP JSON
    v
 server container  (Express)
    |------------------------------> ProductProvider  --> Fake Store API (adapter)
    '------------------------------> Mailer           --> SMTP --> Mailpit (adapter)
```

Dependencies point one way: client -> server API -> providers. Nothing points back.

## 4. Boundaries

- `client/` and `server/` share no imports. The shared shapes are the API contract (section 6), written down once and mirrored by types on each side.
- `client/` makes every server call through one module, `client/src/lib/api.ts`. Components never use `fetch`.
- Inside `server/`: **routes -> services -> providers**. A route never calls a provider. A provider never imports a route or service. Services depend on interfaces, not concrete classes.
- Business rules (search, top rated, category grouping, pagination, enquiry email content) live in services, so they survive a provider swap.
- Providers are selected by config at startup in one composition root.

## 5. Server structure

```
server/src/
  index.ts            start-up: load config, build providers, build app, listen
  config.ts           zod-validated env, fails fast with a clear message
  app.ts              Express app, CORS to CLIENT_ORIGIN only, error handler
  routes/             thin: validate input, call a service, shape the response
  services/           catalogue service, enquiry service
  domain/             Product, ProductProvider, Mailer, typed errors
  providers/
    fakestore/        ProductProvider adapter: URLs, field names, mapping, error mapping
    smtp/             Mailer adapter
```

`domain/` is the only place providers and services both import from.

### Domain types

```ts
// What the app knows about a product. Not the upstream shape.
interface Product {
  id: string | number
  title: string
  price?: number
  image?: string
  category?: string
  description?: string   // used for search and the detail page
  rating?: number        // used only to rank "top rated"; not sent to the client
}

interface ProductProvider {          // everything the app needs from a catalogue
  list(): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  listCategories(): Promise<string[]>
}

interface Mailer {                   // deliver only; content is built in the service
  send(message: { to: string; subject: string; body: string }): Promise<void>
}
```

Typed errors: `UpstreamError` (provider failed, timed out or returned malformed data), `NotFoundError`, `ValidationError`, `MailDeliveryError`. The error handler maps them to HTTP responses. Raw upstream errors and stack traces never reach the client.

### Service responsibilities

- **Catalogue service**: featured products (configured ID list, in that order), categories, category page (top rated first, then the rest, no duplicates), search, product by id, pagination.
- **Enquiry service**: builds the sales email (escapes all customer text, strips newlines from header values), calls `Mailer`, converts a failure into `MailDeliveryError`. It never reports success if the email was not sent.

## 6. API contract

Read-only `GET` for catalogue data and one `POST` for enquiries. All under `/api`.

| Method and path | Purpose | Success response |
| --- | --- | --- |
| `GET /health` | Liveness | `{ "status": "ok" }` |
| `GET /products/featured` | Home page: the 5 configured products | `Product[]` |
| `GET /categories` | Category links | `string[]` |
| `GET /categories/:category/products?page&pageSize` | Category page | `{ topRated: Product[], products: Product[], page, pageSize, total }` |
| `GET /products?q=&page&pageSize` | Search | `{ products: Product[], page, pageSize, total }` |
| `GET /products/:id` | Product details | `ProductDetail` |
| `POST /enquiries` | Enquire | `201 { "status": "sent" }` |

Response shapes:

- `Product` is the design-system shape from `design-system/contract.md`: `id, title, price?, image?, category?`. The server drops `rating` and `description` here.
- `ProductDetail` is `Product` plus `description?`. See open decision 1.
- `topRated` is not paginated; `products` holds the additional items and is paginated.

Errors share one shape and the right status:

```json
{ "error": { "code": "validation_failed", "message": "Check the highlighted fields.", "fields": { "email": "Enter a valid email address." } } }
```

| Status | When |
| --- | --- |
| 400 | Invalid body, query or path param (`fields` present) |
| 404 | Unknown product or category |
| 502 | Product source failed |
| 502 | Enquiry email could not be delivered (customer is told it failed, nothing is reported as sent) |
| 500 | Anything unexpected, with a generic message |

Enquiry body (matches `EnquiryPayload` in `design-system/contract.md`): `name`, `email`, `message` required, `phone` optional, `product: { id, title, price? }`. The server revalidates all of it: trimmed, length-limited, valid email.

Search input is trimmed and length-limited; an empty term is rejected.

## 7. Client structure

```
client/src/
  lib/api.ts          the only place that calls fetch; typed, one error type
  lib/                format, enquiry types, other helpers
  components/ui/      shadcn components (the design system)
  components/         product-aware components (ProductCard, ProductGrid, EnquiryForm, ...)
  pages/              Home, Category, Search, Product; each handles loading, error, empty
  index.css           design tokens as CSS variables, the only home of colours
```

- Pages compose design-system components and pass the API's `Product` straight in. No ranking, filtering or search in the client.
- `EnquiryForm` calls an injected `onSubmit` and knows nothing about email. The page wires it to `api.ts`, and it rejects when delivery fails so the form shows the failure notice.
- Every data view has three states: loading (placeholder cards, `aria-busy`), error (what happened, what to do), empty.
- Look and feel changes by editing the tokens in `index.css`. Components read tokens only.
- The existing `data/sampleProducts.ts` is a temporary stand-in and is deleted when the client loads from the API.

## 8. The three seams

| What will change | Where the change lands | What must not change |
| --- | --- | --- |
| Product data source | New adapter in `server/src/providers/`, new `PRODUCT_SOURCE` value | Routes, services, client, API shape |
| Look and feel | `client/src/index.css` tokens (and the design-system spec) | Components, pages, logic |
| Email provider | New `Mailer` adapter, new `MAIL_PROVIDER` value | Enquiry service, routes, client |

Each is tested on its own: an adapter test for mapping and error handling, and service tests against fake providers.

## 9. Enquiry flow

```
EnquiryForm -> api.ts POST /api/enquiries
  route:   validate body (zod)                      -> 400 on failure
  service: build email (escaped), call Mailer
  adapter: deliver over SMTP                        -> Mailpit locally
  success: 201 -> form shows "Thank you"
  failure: MailDeliveryError -> 502 -> form shows "Your enquiry was not sent..."
```

The email to sales contains the customer's name, email, phone, message and the product (id, title, price).

## 10. Configuration

All config is environment variables, read and validated once at start-up (`config.ts`). `.env.example` lists every variable with a safe placeholder.

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port |
| `CLIENT_ORIGIN` | The only origin allowed by CORS |
| `PRODUCT_SOURCE` | Which `ProductProvider` adapter to build (`fakestore`) |
| `FAKESTORE_BASE_URL` | Upstream base URL, used only by that adapter |
| `FEATURED_PRODUCT_IDS` | Exactly five IDs for the home page |
| `MAIL_PROVIDER` | Which `Mailer` adapter to build (`smtp`) |
| `SMTP_HOST`, `SMTP_PORT` | SMTP target (Mailpit locally) |
| `SALES_EMAIL` | Recipient of enquiries |

## 11. Security basics

- Validate every request at the route boundary; trust nothing from the client.
- CORS allows `CLIENT_ORIGIN` only.
- Escape customer text in the email body and keep header values free of newlines (no header injection).
- Never log customer contact details in full. Log errors with enough context to debug.
- No secrets in the repo; `.env` is ignored.
- Upstream and mail errors are mapped to our own errors, so internals do not leak.
- Rate limit or honeypot on `POST /enquiries` (tracked in the enquiry feature issue).

## 12. Testing strategy

- **Services**: unit tests against fake `ProductProvider` and `Mailer`. Cover featured order, category top-rated then rest without duplicates, search match and no match, pagination edges, enquiry success and failure.
- **Adapters**: tested separately with recorded or fake responses for mapping and error handling.
- **Routes**: validation, status codes, error shape.
- **Client**: what the user sees and does: loading, empty, error, form validation, thank-you.
- One end-to-end happy path: enquire on a product and assert the fake mailer received the product and contact details and the thank-you shows.
- Tests never use the network (`server/test/no-network.ts` enforces it).

## 13. Deployment path to AWS

The Dockerfiles and env-only config run on ECS or App Runner as they are. SES replaces Mailpit by adding a `Mailer` adapter and setting `MAIL_PROVIDER`. A managed catalogue replaces Fake Store by adding a `ProductProvider` adapter. No code outside the adapter and config changes.

## 14. Open decisions

Each needs an owner to settle it and a line in `docs/DECISIONS.md`.

1. **Product detail fields.** `design-system/contract.md` omits `description`, but the product page should show "full details". Proposal: `GET /products/:id` returns `Product` plus `description`; extend the contract with an optional `description` on that one endpoint.
2. **Routing.** Four pages need client-side routing, and CLAUDE.md says no new libraries without asking. Proposal: add `react-router`. The alternative, hash or query-string state by hand, is more code than the dependency.
3. **"Top rated" size per category.** The criteria do not say how many. Proposal: top 3 by rating, a constant in the catalogue service.
4. **Caching.** Fake Store is slow and public. Proposal for the PoC: none; add an in-memory TTL cache inside the provider only if latency hurts.
5. **Naming.** Agent and skill files call the interfaces `ProductSource` and `EmailSender`; the rules and this document use `ProductProvider` and `Mailer`. This document is the reference; the agent and skill files should be aligned.
