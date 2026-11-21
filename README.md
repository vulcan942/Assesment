# Catalogue

A product catalogue where visitors browse, filter by category, search, and send a sales enquiry about a product. There is no cart, checkout or account. See [docs/PRODUCT.md](docs/PRODUCT.md) for scope.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind and shadcn/ui, tested with Vitest and Testing Library. Chosen for the stock shadcn components the design system is built on.
- **Server:** Node, TypeScript, Express, Zod, tested with Vitest. Layers are routes, services, providers, so the product data source and email provider can be swapped by config.
- **Email:** [Mailpit](https://mailpit.axllent.org) catches mail locally, so no paid account is needed.

## Run it

Needs Docker.

```sh
docker compose up --build
```

- App: http://localhost:8080
- Caught enquiry emails: http://localhost:8025
- Stop: `docker compose down`

## Configuration

All settings come from environment variables and are listed in [.env.example](.env.example). `docker compose` reads it as is. To change a value, create a `.env` file; its values win. The server stops at startup and names every missing or invalid variable.

## Develop without Docker

Needs Node 22 (Node 20 breaks the client tests). Check `node -v` in the shell you test from: on one Windows machine Git Bash resolved Node 20 while PowerShell had Node 24.

```sh
npm run setup        # install server and client dependencies
cd server && npm run dev
cd client && npm run dev
```

Set the variables from `.env.example` in your shell for the server.

## Checks

From the repo root:

```sh
npm run typecheck
npm run lint        # also runs scripts/check-boundaries.mjs
npm test
```

CI runs the same three commands on every push and pull request.

## Design system

`design-system/` holds the spec, data contract and `tokens.json`. The client uses stock shadcn components in `client/src/components/ui`. Colours live only in `client/src/index.css`, mapped from `tokens.json`; the boundary check fails the lint if a raw colour appears elsewhere.

## Documents

- [docs/DECISIONS.md](docs/DECISIONS.md): assumptions, dropped items, growth path
- [AI_USAGE.md](AI_USAGE.md): how AI was used
