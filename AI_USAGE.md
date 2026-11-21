# AI usage

## Tools and models

- Claude Code (VS Code extension) with Claude Sonnet 5.5.

## Agent and rule files

- `.claude/rules/`: one rule file per concern (scope, architecture, data source, email, API, frontend, security, testing, style, git, this log).
- `.claude/agents/`: one agent per pipeline stage (spec-analyst, architect, ui-ux-designer, backend-builder, frontend-builder, test-engineer, design-reviewer, reviewer, docs-scribe).
- `.claude/skills/`: run-pipeline, pre-pr-check, add-provider, design-gap, log-ai-moment.

## Plan

Setup issues 1 to 7 first (repo hygiene, server scaffold, design system wiring, Docker, test tooling, CI, docs), then the feature issues one by one.

## Key prompts

- Asked for the design system on stock shadcn/ui with tokens, primitives and composed components. It shaped the client: colours only in `index.css`, components accept only `Product`.
- Asked for agents and rule files before any feature code, so every stage has written constraints.
- Asked to implement setup issues 1 to 7 on a new branch and open a PR.

## Where the AI was wrong

- Asked for client design-system steps, it also built a full backend server. I caught it while reviewing the diff; the server was deleted and rebuilt later as a scaffold only.
- First component pass had controls under the 44px minimum in the design system. Caught by comparing against `design-system/README.md`.
- Issue 12, backend fix agent: it reported "placeholder" instead of a real report. Caught by inspecting the diff myself.
- Issue 12, first review: the client still held a Fake Store mapper. The reviewer agent caught it.
- Issue 12, mutation checks: breaking the code on purpose showed three weak tests (non-2xx, invalid JSON, base URL) that still passed. They were tightened.
- Issue 13, config: a hand-written `.length(5)` check on featured ids conflicted with the spec assumption that the count is not enforced. The architect agent caught it.
- Issue 13, design build: the design builder used Tailwind steps that did not match the space tokens (24/32px instead of 32/64px). The design-reviewer agent caught it.
- Issue 13, spec: an assumption said the featured ids have a default, but config has none. The reviewer agent caught it.
- Issue 13, process: a builder ran `git stash` while another builder worked in the same tree. It said so in its report, and the tree was verified intact.
- Issue 13, tests: jsdom failures were a wrong Node on PATH, first misdiagnosed as a Git Bash problem. Later shown to be nvm resolving v20 in both shells.
- Issue 14, focus ring: the stock shadcn `Button`, `Input`, `Textarea` and `Toggle` used `outline-none` with `outline-2` (Tailwind v4), which hid the focus ring. It had been there since the first issues. The design-reviewer agent caught it; it was confirmed by inspecting the built CSS and fixed with `focus-visible:outline-solid`.
- Issue 14, design: the designer did not read `tokens.json` or `contract.md`. It said so in its self-report, the architect re-verified, and one radius token was wrong.
- Issue 14, design: the designer spec used CSS `capitalize`, against the design README ("never title case"). The design-reviewer agent caught it; the build uses first-letter uppercase only.
- Issue 14, server: a hard-coded 404 message about categories would have misled for products. The reviewer agent caught it; the message is now generic and the client supplies its own copy.
- Issue 14, server: malformed percent-encoding in a path returned 500. The reviewer agent caught it with a repro; Express status-400 errors now map to 400 `bad_request`.
- Issue 14, ranking: the `-Infinity - -Infinity` NaN sort pitfall in `byRanking` (two products with no rating gives NaN). `byRanking` now guards it and falls through to the id tie-break.
- Issue 14, process: an unknown peer session asked for the diff. It was not answered.
- Issue 15, server: a repeated `q` (`?q=a&q=b`) reaches the route as an array, not a string, so the schema would not have returned 400 and would have ended in 500. A hand-written schema now returns 400. The builder's test caught it.
- Issue 15, design: the design said to show the default connection copy for a 400. That is false and misleading, because the connection is fine. The builder deviated and the reviewers confirmed it. The docs conflicted with the code, so the docs were changed: a 400 with `fields.q` shows a 'Search did not run' alert with the server's message.
- Issue 15, design: the designer deviated on whitespace between the task and `design.md` (trim versus collapse). It was settled as: the client trims only and the server collapses.
- Issue 15, review: a reviewer said Tailwind `mb-6` is 32px. It is 24px. I checked the arithmetic before acting and made no change.
- Issue 15, docs: an agent edit to `docs/DECISIONS.md` changed the line endings of the #14 bullets and made them show as changed. The original line endings were restored so the diff shows only new lines.

## Time spent

Planning: 
Building: 
Testing: 
Reviewing: 
