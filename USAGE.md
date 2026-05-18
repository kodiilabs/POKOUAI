# Using This Template — Step by Step

A practical, ordered guide for working with the AI-augmented Development Lifecycle (ADLC) inside this template. Read once, bookmark, follow.

---

## Phase 0 — Bootstrap (once per project, ~5 min)

```bash
# 1. Copy the template
cp -R /Users/yaokouadio/Projects/STARTUP/agentic-project-template /Users/yaokouadio/Projects/STARTUP/<project>
cd /Users/yaokouadio/Projects/STARTUP/<project>

# 2. Init git
git init -b main

# 3. Optional — wipe the example REQ
rm .adlc/requirements/REQ-001-Example-Feature.md
```

**Fill these three files. Don't skip — they gate every agent:**

| File | What goes in it |
|---|---|
| [.claude/context/project-overview.md](.claude/context/project-overview.md) | What / who / why / stage / platforms |
| [.claude/context/tech-stack.md](.claude/context/tech-stack.md) | Languages, frameworks, runtimes, tooling |
| [.claude/context/constraints.md](.claude/context/constraints.md) | Cost ceiling, latency budget, compliance, **must-never** list |

Open the project in Claude Code. [CLAUDE.md](CLAUDE.md) auto-loads and pulls in `.adlc/ETHOS.md` and `.claude/instructions.md`.

**Mobile projects on macOS — do this once before any `expo prebuild`**: see [docs/macos-mobile-prereqs.md](docs/macos-mobile-prereqs.md). Three env vars in `~/.zshrc` prevent the recurring CocoaPods SSL + UTF-8 failures that otherwise eat half a day on every fresh project.

---

## Phase 1 — First feature (and every feature after)

The four ADLC stages, run in order. Skipping a stage skips a safety check.

### Stage 0 — Context

```
/spec <one-line description of the feature>
```

The Spec Agent asks you the problem, success metric, constraints, build approach, kill criteria. It writes `.adlc/requirements/REQ-xxx-<name>.md` and appends new assumptions to `ASSUMPTIONS.md`. Push back if any section says "TBD" or "looks good" — that's not done.

### Stage 1 — Build & Iterate

```
/architect REQ-xxx
```

Validates the REQ, confirms the build approach (existing tool → prompt → RAG → agent → fine-tune), produces a technical design + task breakdown, scaffolds `.adlc/evals/REQ-xxx/eval.md` with initial golden + adversarial + persona examples.

**Then implement.** Use these escape hatches mid-build:

| Situation | Run |
|---|---|
| Routine, low-risk sub-task | `/proceed <description>` |
| Scoped, reproducible bug | `/bugfix <description>` |
| Unknown that needs a time-boxed answer | `/spike <exit question>` |
| Sensitive surface (auth, PII, AI input) | `/security-review <scope>` |

### Stage 2 — Evaluate

```
/validate REQ-xxx
```

Runs all four eval sets, scores on **Correctness / Safety / Usefulness / Cost / Latency**, compares iteration vs hold-out for overfitting, gives a verdict: **Pass / Conditional / Fail**. Conditional or Fail → fix and re-run before continuing.

```
/review REQ-xxx          # general code review
/security-review REQ-xxx # if the surface is sensitive
```

### Stage 3 — Ship & Know

```
/wrapup REQ-xxx
```

Verifies deploy is live, promotes eval cases to `.adlc/evals/_regression/suite.md`, updates `.adlc/metrics/dashboard.md`, confirms tracker items are closed and open loops have owners.

```
/reflect REQ-xxx
```

Walks every assumption (Confirmed / Violated / Unverified), appends a one-line lesson to `.adlc/knowledge/KNOWLEDGE.md`, promotes reusable adversarial cases or personas to `.adlc/evals/_shared/`.

---

## Phase 2 — Ongoing rhythm

```
   /spec  →  /architect  →  build  →  /validate  →  /review  →  /wrapup  →  /reflect
```

**Skills auto-activate** on trigger phrases — you don't invoke them:

| Trigger phrases | Skill |
|---|---|
| "is this presentable", "review my app", "help me pitch this", "what would a PM say" | `product-manager` |
| "would my mom understand this", "test as a first-timer", "fresh-eyes audit" | `persona-tester` |
| Any UI / frontend code or design work | `frontend-design` |
| "is this safe", "OWASP check", "audit for security", "PII leak", "prompt injection" | `security-review` |

---

## Phase 3 — When things go sideways

| Situation | What to do |
|---|---|
| Bug in a shipped feature | `/bugfix` |
| Don't know the right approach | `/spike` |
| Existing feature shipped without an eval | `/eval-only` |
| Bug reveals a deeper design issue | **Stop.** Escalate to `/spec` for a new REQ. |
| Constraint becomes impossible to meet | Check kill criteria in the REQ — kill it if hit |
| Tempted to use `/proceed` because the full pipeline feels heavy | That's the warning sign. Use the full pipeline. |

---

## Phase 4 — The compounding loop

Three files are your project's persistent memory. Read them before any new feature work:

- [.adlc/assumptions/ASSUMPTIONS.md](.adlc/assumptions/ASSUMPTIONS.md) — what's been Confirmed / Violated
- [.adlc/knowledge/KNOWLEDGE.md](.adlc/knowledge/KNOWLEDGE.md) — one-line lessons
- [.adlc/metrics/dashboard.md](.adlc/metrics/dashboard.md) — current scores per feature

These are the only things standing between you and re-learning the same lesson on every project. Skip Phase 4 a few times and the system silently degrades to "just another folder of agents."

---

## Invocation note

All 8 agents are wired as slash commands: `/spec`, `/architect`, `/validate`, `/review`, `/wrapup`, `/reflect`, `/proceed`, `/bugfix`. Plus the two non-agent shortcuts: `/spike`, `/eval-only`.

Each command file in `.claude/commands/` delegates to the matching agent in `.claude/agents/` via the Task tool, with a short pre-flight check (does the REQ exist, is the prior stage actually done, etc.). You can also still invoke an agent in plain English ("run the architect on REQ-007") — both paths route through the same agent definition.

Note: `/review` collides with a built-in PR-review skill in some Claude Code harnesses. The project-level `/review` (this one) is scoped to a REQ id; the built-in is scoped to a GitHub PR.

---

## File map (where things live)

```
.adlc/                               # AI-augmented Development Lifecycle
├── ETHOS.md                         # Engineering principles (always-load)
├── workflows.md                     # Four-stage process + tracker mapping
├── requirements/                    # REQ-xxx.md feature specs
├── evals/
│   ├── _shared/                     # Reusable adversarial + persona examples
│   ├── _regression/                 # Regression suite + changelog
│   └── REQ-xxx/                     # Per-feature eval sets
├── assumptions/ASSUMPTIONS.md       # Living assumptions log
├── knowledge/KNOWLEDGE.md           # Lessons learned
├── metrics/dashboard.md             # System health snapshot
└── templates/                       # REQ, task, bug, spike, eval, assumption, lesson

.claude/
├── instructions.md                  # Always / never rules
├── settings.json                    # Permissions, hooks, env
├── context/                         # Per-project: overview, tech-stack, constraints, style-guide
├── agents/<name>.md                 # Sub-agents (YAML frontmatter)
├── commands/<name>.md               # Slash commands
└── skills/<name>/SKILL.md           # Domain skills

CLAUDE.md                            # Auto-loaded by Claude Code
README.md                            # What's in this template
USAGE.md                             # This file
.gitignore, .claudeignore            # Universal ignores
```
