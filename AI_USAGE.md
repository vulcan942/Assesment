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

## Time spent

Planning: 
Building: 
Testing: 
Reviewing: 
