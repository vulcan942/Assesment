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

## Time spent

Planning: 
Building: 
Testing: 
Reviewing: 
