# PokouAI Personas

Personas used for UX walkthroughs via the `persona-tester` skill. Each file is a self-contained character with goal, tech profile, limitations, and dealbreakers, designed to stress a *different* failure axis in the app.

## Cast

| File | Persona | Primary failure axis |
|------|---------|----------------------|
| [kouassi.md](./kouassi.md) | Kouassi, 54, Baoulé cocoa farmer | Language fluency, low-end Android, field conditions, install UX |
| [aminata.md](./aminata.md) | Aminata, 38, Dioula-speaking woman, shared phone | Dioula translations, single-user assumptions, low battery |
| [yao.md](./yao.md) | Yao, 28, extension agent + hub operator | Hub tier, group mode, InferenceRouter fallback |
| [adjoa.md](./adjoa.md) | Adjoa, 19, daughter installing for her father | Proxy install, onboarding-handoff, 1.5 GB download |
| [ibrahim.md](./ibrahim.md) | Ibrahim, 62, skeptic who lost crop last year | Trust, model uncertainty display, error recovery, sun glare |
| [priya.md](./priya.md) | Priya, 31, Gemma 4 Good hackathon judge | English completeness, demo-path bugs, cold-install path |

## Usage

```
/persona-tester run kouassi against "diagnose brown spots on my pod"
```

When running a walkthrough, the skill embodies the persona in present tense, narrates each screen as they perceive it, and produces a findings report (blockers / friction / nits + assumptions surfaced).

See `.claude/skills/persona-tester/` for the skill itself.
