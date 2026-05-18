# Video → live app design audit

Goal: identify what the Remotion mock screens show that the published app does *not* (or shows differently), so we can close the gaps before publishing the repo. Sources audited:

- Mocks: [`src/phone/MockHomeScreen.tsx`](src/phone/MockHomeScreen.tsx) · [`src/phone/MockResultScreen.tsx`](src/phone/MockResultScreen.tsx) · [`src/phone/MockSkillDemoScreen.tsx`](src/phone/MockSkillDemoScreen.tsx)
- Live: [`../app/src/screens/HomeScreen.tsx`](../app/src/screens/HomeScreen.tsx) · [`../app/src/screens/ResultScreen.tsx`](../app/src/screens/ResultScreen.tsx) · [`../app/src/screens/SkillDemoScreen.tsx`](../app/src/screens/SkillDemoScreen.tsx)

The verdict per screen: **converged** (no action), **close** (cosmetic alignment), or **divergent** (port video pattern to live).

---

## HomeScreen

**Verdict: close — three cosmetic deltas.**

| What the video shows | What the live app shows | Action |
|---|---|---|
| Header chips: `📱 Local` + `☁️ Online` (always two, fixed layout) | `📱 Local` + `🛰 Hub` (conditional) + `☁️ Online/Offline` (3-way with offline state) | **Keep live.** The live app's conditional hub badge and explicit offline state are more useful than the video's simplification. Reviewers can verify offline behaviour in-app. |
| Primary button text: `📷 Take photo` then `🖼️ Choose photo` | `📷 Take photo` then `🖼 From gallery` | **Cosmetic.** "Choose photo" reads slightly cleaner than "From gallery." Low priority. Translate-key rename — `home.from_gallery` → `home.choose_photo` across `app/src/i18n/locales/*.json` if changed. |
| Recent row: dense single-line, dark thumbnail block, monochrome content | Multi-line card with full thumbnail, date + percentage, tap → Result | **Keep live.** Live is richer. The video compresses for portrait readability. |
| Farmer Agent tile pulses when highlighted | Static tile (no highlight animation) | **Optional polish.** The pulse is a video-only attention cue. Not needed in production. Skip. |
| Tile order: primary buttons → Recent → Learn (calendar + quiz) → Intel → Group → Farmer Agent → Log + Settings | Same order | **Converged.** |
| Overdue banner (red, conditional on overdue loops) | Live only — not in the mock | **Keep live.** The video timing didn't need to show overdue state. |

**Net gap to close before publish:** none load-bearing. Optional: rename "From gallery" → "Choose photo" if you want exact mock parity in the published code.

---

## ResultScreen

**Verdict: close — one missing pattern in live app worth porting.**

| What the video shows | What the live app shows | Action |
|---|---|---|
| Image caption overlay bottom-left of photo (`Cocoa pod · forest-edge plot`) | No caption overlay on image | **Port.** Tiny, high-impact polish. Add an absolutely-positioned caption pill over the result image showing `{disease emoji} · {plot label or location hint}`. Plot label exists in the schema; if not stored yet, render the disease label only. Files: `app/src/screens/ResultScreen.tsx` (add overlay inside the `Image` wrapper or render as sibling). |
| Three pills inline: confidence band + tier badge + adapted-for | Live renders the same three pills | **Converged.** |
| Symptoms card, Treatment card | Same structure | **Converged.** |
| "🔬 Test your theory" mini card | Live uses a fuller [`HypothesisCard`](../app/src/components/HypothesisCard.tsx) component | **Keep live.** The full card is the actual interactive surface; the mock compresses it. |
| **Missing from mock:** Prevention card, Agronomist callout (orange), Sources line, Learn-more + Practice action row, Share button | All present in live | **Keep live.** The mock simplifies for portrait readability; published app should keep the full set. |
| Speak button (TTS read-aloud) | Present in live, missing from mock | **Keep live.** TTS is a Digital Equity Prize claim — keep it. |

**Net gap to close before publish:** add the disease/plot caption overlay on the result image. ~10 lines of JSX in `ResultScreen.tsx`.

---

## SkillDemoScreen

**Verdict: converged.**

The live `SkillDemoScreen` is the source of truth for the video mock — the mock simply takes a `stageId` + `level` prop and renders a stripped layout for the phone-frame, while the live app renders the full interactive surface with the stage stepper, level switcher, scenario card, stage body, agent memory footer, and two-track note. Both read the same [`skill_demo.json`](src/data/skill_demo.json).

| What the video shows | What the live app shows | Action |
|---|---|---|
| Same disease/image/farmer scenario | Same | **Converged.** |
| Stage stepper (5 chips) | Horizontal scrollable pill row | **Converged** (live has horizontal scroll, mock is fixed since 5 fits). |
| Level switcher (3 buttons) | Same | **Converged.** |
| Per-stage adapted content | Same — driven from the same JSON | **Converged.** |
| Agent memory footer (`What the agent has inferred`) | Live only — not in mock | **Keep live.** The mock omits the footer to fit the portrait frame; the live app has space for it. |
| Two-track note footnote | Live only | **Keep live.** Same reason. |

**Net gap to close before publish:** none.

---

## Summary — what to port before publishing the code

| Priority | Change | File(s) | Effort |
|---|---|---|---|
| 🟢 P1 — recommended | Add a small caption overlay on the Result-screen image (disease + plot context), matching the video mock | `app/src/screens/ResultScreen.tsx` | ~10 LOC |
| 🟡 P2 — optional polish | Rename i18n key `home.from_gallery` → `home.choose_photo` and update label | `app/src/i18n/locales/*.json` + `HomeScreen.tsx` | ~6 LOC |
| ⚪ Skip | Pulse animation on the Farmer Agent tile when highlighted | — | Video-only attention cue, not useful in production |

Everything else the video shows is either already in the published app (often with more functionality than the mock conveys) or intentionally simplified for the portrait video frame.
