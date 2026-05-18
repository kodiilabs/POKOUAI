# Project Memory

This project follows the **AI-augmented Development Lifecycle (ADLC)** documented in `.adlc/`. Detect the language, framework, and package manager from the codebase before assuming any of them.

## Always-load context

@.adlc/ETHOS.md
@.claude/instructions.md

## Per-project context (fill in for this project)

- `.claude/context/project-overview.md` — what this project is and who it's for
- `.claude/context/tech-stack.md` — languages, frameworks, runtimes, infra
- `.claude/context/constraints.md` — cost / latency / compliance / must-never
- `.claude/context/style-guide.md` — naming, structure, framework conventions

## ADLC workflow

The four stages and the agents that own each:

1. **Stage 0 — Context** → `/spec` turns an idea into a tight REQ
2. **Stage 1 — Build & Iterate** → `/architect` for the design, then implement; or `/proceed` for routine, `/bugfix` for scoped bugs, `/spike` for unknowns
3. **Stage 2 — Evaluate** → `/validate` runs the full eval + 5-dimension scoring, then `/review` checks correctness, security, and AI-specific concerns
4. **Stage 3 — Ship & Know** → `/wrapup` closes out (deploy, regression, dashboard, tracker), then `/reflect` updates assumptions and captures lessons

Full mapping with tracker integration: `.adlc/workflows.md`.

## Where things live

- `.adlc/requirements/REQ-xxx.md` — feature specs
- `.adlc/evals/REQ-xxx/` — golden / adversarial / persona / hold-out sets
- `.adlc/evals/_shared/` — reusable adversarial + persona examples
- `.adlc/evals/_regression/` — regression suite + changelog
- `.adlc/assumptions/ASSUMPTIONS.md` — living assumptions log
- `.adlc/knowledge/KNOWLEDGE.md` — lessons learned (one line each)
- `.adlc/metrics/dashboard.md` — system health snapshot
- `.adlc/templates/` — REQ, task, bug, spike, eval, assumption, lesson templates
- `.claude/agents/` — sub-agents (architect, bugfix, proceed, reflect, review, spec, validate, wrapup)
- `.claude/commands/` — slash commands (`/spec`, `/architect`, `/validate`, `/review`, `/wrapup`, `/reflect`, `/proceed`, `/bugfix`, `/spike`, `/eval-only`)
- `.claude/skills/` — domain skills (product-manager, persona-tester, frontend-design)
- `.claude/settings.json` — permissions, hooks, env scaffold

## Critical rules

- Never run tests, linters, or builds automatically — list the exact commands instead.
- Never commit to `main` / `master`; never force-push.
- Never log, print, or commit secrets, `.env` values, or PII.
- For AI features, eval sets are part of "done."
- Don't introduce new abstractions, dependencies, or patterns without a reason grounded in the current task.
