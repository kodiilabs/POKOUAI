# PokouAI — Agent, Knowledge & Signals Architecture Proposal
## For the Learning & Skill-Building Module

**Status:** Proposal for review — not yet integrated into main PRD
**Date:** May 2026 (updated)

---

## The Core Idea

Replace the current flat learning system with a **three-layer architecture**:

1. **The Farmer Agent** — a persistent, adaptive model of each farmer's skill level across cocoa-specific competencies
2. **The Knowledge Stack** — a layered, sourced corpus of cocoa knowledge that the agent draws from
3. **The Environmental Signals Layer** — real-world contextual data (weather, regional disease pressure, season, plot conditions) that conditions what's relevant right now

These three dimensions combine on every interaction. The agent is the personalization engine. The knowledge stack is the fuel. The environmental layer is the context that makes both relevant *today*.

A 30-year experienced farmer and a first-season farmer use the same app but have entirely different experiences. And the *same* farmer gets different content in February than in October — even at the same skill level — because the world around them has changed.

---

## Why This Approach Is Right for This Population

The research on skill-based adaptive learning in low-literacy agricultural contexts points consistently to one finding: **generic content fails; contextually matched content works.**

The IITA Farmer Field School programs in Côte d'Ivoire found that farmers who learned through participatory, discovery-based methods — where content matched their actual knowledge level — dramatically outperformed those who received uniform extension messaging. The digital equivalent is an agent that knows what you already know, draws from sources you can trust, and adapts to what's happening on your land right now.

The critical adaptation for PokouAI's population: the agent must infer skill level from **behavior and voice**, not from quiz scores or explicit self-reporting. A non-literate farmer cannot fill in a skill assessment form. But they can describe a sick plant, and that description carries enormous diagnostic signal about what they know.

---

# Layer 1: The Farmer Agent (Skill Model)

## The Skill Map

These are the discrete skills the agent tracks. They are grounded in what the Farmer Field School curricula and cocoa IPM research identify as the actual competencies that separate low-yield from high-yield farmers.

Each skill has three levels: **Novice → Practitioner → Expert**

---

### Skill 1: Observation — Seeing What's There

*Can this farmer spot signs of disease before a pod is visibly dying?*

| Level | What it looks like |
|---|---|
| Novice | Reports problems only when pods are heavily damaged or lost. Describes symptoms in vague terms ("the plant is sick," "the pods are bad"). |
| Practitioner | Notices early symptoms — color changes, unusual spots, slight deformation — before major damage occurs. Describes specific visual signs. |
| Expert | Actively monitors specific high-risk areas (forest edges, shaded plots, wet zones). Notices patterns across plots. Catches issues 10–14 days earlier than a Novice. |

**How the agent assesses this:** Timing of app use relative to disease stage. Quality and specificity of "Farmer Speaks First" voice responses. Whether the farmer initiates contact or only responds to prompts. Whether they report from observation or from visible crop loss.

**How the experience changes:**
- Novice: "Go look at your pods near the forest edge today. Can you describe what you see?"
- Practitioner: "You mentioned the pods were darkening at the edges. Did you also check the stems near the base?"
- Expert: "Last time you caught black pod early on Plot B. Have you checked Plot A since the rains started?"

---

### Skill 2: Disease Recognition — Naming What You See

*Can this farmer connect visual symptoms to a specific disease?*

| Level | What it looks like |
|---|---|
| Novice | Cannot distinguish between diseases. Sees "a problem" but cannot name or narrow it. Relies entirely on the app's diagnosis. |
| Practitioner | Correctly identifies 2–3 of the most common diseases (black pod, CSSVD, mirid) from visual description before diagnosis is confirmed. May use local names. |
| Expert | Identifies all major diseases reliably, including early-stage presentations. Can distinguish between diseases with similar symptoms. Rarely wrong. |

**How the agent assesses this:** Accuracy of "Farmer Speaks First" hypotheses over time. Whether the farmer's described symptoms match the eventual diagnosis. Whether they use specific local disease names versus generic descriptions.

**How the experience changes:**
- Novice: Diagnosis delivered as full narrative with cause, story, and treatment. No assumption of prior knowledge.
- Practitioner: "You described dark patches on the pods — you're right, that's black pod. Here's what is happening this time that's slightly different from last season..."
- Expert: "Based on what you described, you've already identified this correctly. Do you want to confirm the treatment plan or discuss anything specific?"

---

### Skill 3: Treatment Decision — Knowing What to Do and When

*Can this farmer choose the right treatment, at the right time, in the right amount?*

| Level | What it looks like |
|---|---|
| Novice | Waits for full app recommendation. Does not know which treatment options exist or how timing affects outcome. |
| Practitioner | Knows 1–2 reliable treatments for common diseases. Understands that earlier is better. May not know dosage or product alternatives. |
| Expert | Selects appropriate treatment based on disease, severity, timing, and cost. Understands trade-offs. Can adapt if first-choice product is unavailable. |

**How the agent assesses this:** Day 7 outcomes — did treatment work? What did the farmer say they did? Farmer's unprompted mention of treatment timing or product choice in voice responses.

**How the experience changes:**
- Novice: Full ranked treatment list with cost and timing. Step-by-step instruction.
- Practitioner: "You've used copper fungicide successfully before. Same approach here works — timing is the key. Can you treat within 48 hours?"
- Expert: "Given the severity you described, you probably already know the options. Is there anything in the way of treating early this time?"

---

### Skill 4: Prevention Habits — Acting Before Problems Arrive

*Does this farmer take preventive actions that reduce disease risk before outbreaks occur?*

| Level | What it looks like |
|---|---|
| Novice | Reactive only. Acts after visible damage. No pruning, shade management, or sanitation routine. |
| Practitioner | Does some preventive actions (removes infected pods, prunes occasionally) but inconsistently or at suboptimal timing. |
| Expert | Maintains a proactive farm calendar. Prunes, removes infected material, manages shade, and times preventive sprays with weather patterns. Disease incidence on their farm is visibly lower. |

**How the agent assesses this:** Whether the farmer initiates contact proactively (before visible disease) versus reactively (after loss). Day 7 responses — did they mention anything they did beyond treatment? Seasonal patterns in their Farm Intelligence Log.

**How the experience changes:**
- Novice: Seasonal reminders and simple prevention calendar. "The rains are coming — this is the time black pod spreads fastest. Here is one thing to do this week."
- Practitioner: "You've been good about removing infected pods. Adding shade management would cut your risk further — want me to walk you through how?"
- Expert: "Your farm log shows you had less black pod this year than last. The early pruning you did in February likely made a difference."

---

### Skill 5: Farm Self-Knowledge — Knowing Your Own Land

*Does this farmer know which plots are highest risk, which seasons are hardest, and what patterns repeat on their specific land?*

| Level | What it looks like |
|---|---|
| Novice | Treats all plots as the same. No differentiated strategy by plot. Cannot explain why one area performs differently. |
| Practitioner | Knows which plots are problematic but doesn't know why. Can name the pattern but not the cause. |
| Expert | Understands the micro-conditions of each plot (drainage, shade, proximity to risk factors). Uses this knowledge to prioritize monitoring and prevention. |

**How the agent assesses this:** References to specific plots in voice responses. Whether plot-specific recommendations are acted on. Farm Intelligence Log patterns over multiple seasons.

**How the experience changes:**
- Novice: Treats all plots identically in recommendations.
- Practitioner: "The last three black pod cases were on your forest-edge plot. That pattern suggests something specific about that location — want to explore it?"
- Expert: "Based on your history, Plot C near the stream is your highest-risk area in the wet season. Should I flag that automatically going forward?"

---

## How the Agent Works

### What the Agent Is

The Farmer Agent is not a chatbot. It is a **persistent profile** that lives behind every interaction and silently shapes what the farmer sees, hears, and is asked. The farmer never sees "your skill level is Practitioner in Disease Recognition." They just notice that the app seems to understand them — that it doesn't explain things they already know, that it challenges them in ways that feel right, that it references their own history correctly.

This invisibility is intentional and critical. For non-literate farmers especially, a visible skill score can feel like a school grade — with all the shame and anxiety that implies. The agent works in the background so the farmer only experiences its output: a conversation that feels personal.

### Three Agent Components

**1. The Skill Tracker**
Maintains a continuously updated estimate of the farmer's level across all 5 skills. Updates after every interaction — diagnosis, Day 7 response, Observation Training Loop check-in. Never resets. Gradually improves its accuracy as it accumulates more behavioral signal.

**2. The Content Selector**
For every interaction, decides which content depth, vocabulary level, and challenge level to pull from the Knowledge Stack (Layer 2). A Novice gets foundational narrative from the official curriculum layer. An Expert gets confirmation, research-layer nuance, and peer stories. A Practitioner gets the middle path.

**3. The Learning Path Planner**
Identifies which skill is the weakest link for this farmer and creates opportunities to address it. If a farmer is Expert in Disease Recognition but Novice in Prevention Habits, the agent gradually introduces prevention prompts — not as a new module to complete, but as natural extensions of existing conversations.

---

## Onboarding — The 3-Question Voice Assessment

Full skill assessment requires 6–10 interactions to become reliable. But the agent needs a starting point. Onboarding provides a rough initial estimate through 3 voice questions that take under 2 minutes and work entirely without reading.

**Design principle:** These are not tests. They are conversations that happen to produce signal. A farmer who refuses to answer or gives very short answers defaults to Novice across all skills — which is the safest starting point and never penalizes anyone.

---

**Question 1 — Observation Signal**
*(Delivered by voice, with a simple plant image on screen)*

> "Look at this cocoa plant. Tell me anything you notice — anything at all. There is no wrong answer."

What the agent listens for:
- Generic ("it looks sick") → Novice signal
- Specific symptoms named ("the pods are dark, the leaves are yellowing") → Practitioner signal
- Causal or contextual observation ("this looks like what happens near the end of the wet season") → Expert signal

---

**Question 2 — Recognition Signal**
*(Follows naturally from Q1)*

> "You've seen problems like this on your farm before. What do you usually call this, or what do you think causes it?"

What the agent listens for:
- No answer or "I don't know" → Novice
- Local disease name used correctly → Practitioner
- Causal explanation given (fungus, weather, insects) → Expert

---

**Question 3 — Experience Signal**
*(Conversational, not a test)*

> "How long have you been farming cocoa? And when you have a problem on your farm — what do you usually do first?"

What the agent listens for:
- Years of experience (calibration only — experience ≠ skill, but it's a prior)
- Reactive vs. proactive response pattern ("I wait to see what happens" vs. "I go check the worst plots first")
- Whether they mention preventive actions spontaneously

---

**After 3 Questions:**
The agent sets initial skill levels (likely Novice across most skills for most farmers — which is correct and safe) and begins the first diagnosis interaction calibrated to those levels. The real assessment starts immediately and refines rapidly over the first 3–5 uses.

---

## How Skill Levels Change

Levels advance on **behavioral evidence**, not time or completions.

| Signal | Skill it updates | Direction |
|---|---|---|
| "Farmer Speaks First" response includes specific symptom name | Disease Recognition | +toward Practitioner |
| Farmer catches disease at early stage (Day 7 shows pods still recoverable) | Observation | +toward Practitioner |
| Day 7 outcome: treatment worked, applied within 48h | Treatment Decision | +toward Practitioner |
| Farmer initiates contact before visible damage | Observation, Prevention | +toward Expert |
| Farmer mentions preventive action unprompted | Prevention Habits | + |
| Farmer describes plot-specific risk correctly | Farm Self-Knowledge | + |
| Farmer skips "Farmer Speaks First" consistently | All skills | No update (neutral — skipping doesn't downgrade) |
| Day 7 shows treatment failed or was applied too late | Treatment Decision | flag for coaching, not downgrade |

**Levels never go backward.** The agent may become uncertain about a skill level (if behavior becomes inconsistent) but it never demotes a farmer. That would be demoralizing and almost certainly wrong — inconsistent behavior usually reflects external circumstances (money, time, weather) not skill regression.

---

# Layer 2: The Knowledge Stack (Curriculum)

## Why the Knowledge Stack Matters

The Farmer Agent is the personalization engine, but on its own it has nothing to teach. Every diagnosis, every prompt, every prevention reminder pulls from a corpus of cocoa knowledge. That corpus must be:

- **Authoritative** — farmers, cooperatives, and the government need to trust what the app says
- **Defensible** — if advice fails, grounding in CCC/ANADER guidance protects everyone in the chain
- **Maintainable** — diseases evolve, regulations change, products are reformulated; the content needs a clear update pipeline
- **Layered** — different skill levels need different *kinds* of knowledge, not just different volumes of the same kind
- **Localized** — to region, season, and language

The Knowledge Stack is built as a **layered graph**, not a single document. Each layer has different provenance, different update cadence, and different use cases. The agent (Layer 1) chooses which layer to pull from based on skill level and environmental context.

---

## The Five Knowledge Layers

### Layer A — Official Curriculum (Regulatory Spine)

**Source:** Conseil du Café-Cacao (CCC), the national regulator.

**What it covers:** Approved treatments and dosages. Pesticide product registration status. Official disease guidance. Seasonal calendars. Certification requirements (Fairtrade, Rainforest Alliance, EU due diligence).

**Why it matters:** This is the legally defensible spine. Every treatment recommendation must trace back to a CCC-approved product. If the app ever recommends something the regulator hasn't approved, the entire trust chain collapses.

**Update cadence:** Quarterly or whenever CCC issues new bulletins. Slow but high-authority.

**Used at:** All skill levels, especially Novice (where farmers need clarity and safety) and as the foundation for any specific product recommendation.

---

### Layer B — Extension Curriculum (Translation Layer)

**Source:** ANADER (Agence Nationale d'Appui au Développement Rural) — the national extension service. Their Farmer Field School materials are already designed for low-literacy farmers in Côte d'Ivoire.

**What it covers:** How to recognize diseases at different stages. Step-by-step treatment application. Pruning, sanitation, shade management protocols. Seasonal action calendars. Adapted vocabulary and pedagogy for oral, visual learners.

**Why it matters:** This is where Layer A becomes teachable. ANADER has already done the work of translating regulatory language into farmer language. Reusing it saves enormous design effort and inherits the trust ANADER has built over decades.

**Update cadence:** Annual program updates plus seasonal campaigns.

**Used at:** All skill levels. This is the workhorse layer. Most Novice and Practitioner content lives here.

---

### Layer C — Research Depth (Expert Substrate)

**Source:** CNRA (Centre National de Recherche Agronomique), IITA (International Institute of Tropical Agriculture), World Cocoa Foundation, peer-reviewed research.

**What it covers:** Disease lifecycle biology. Resistance mechanisms. Soil-disease interactions. Variety-specific behavior. Emerging threats (new CSSVD strains, climate-driven shifts). Trade-offs between treatment strategies.

**Why it matters:** This is what makes Expert-level content actually expert. Without it, "Expert mode" is just "Novice mode with fewer words." An experienced farmer asking why their forest-edge plot keeps getting hit needs the *real* answer about humidity gradients and inoculum load, not a simplified version.

**Update cadence:** Continuous (research is always moving); curated quarterly.

**Used at:** Practitioner (sparingly, as extension) and Expert (heavily). Rarely surfaced for Novice — would be noise.

---

### Layer D — Indigenous & Local Knowledge

**Source:** Field-collected, in partnership with cooperatives and senior farmers. Region-specific.

**What it covers:** Local disease names (what farmers in Daloa call something vs. what farmers in San-Pédro call it). Traditional indicators (which wild plants flowering signals which seasonal risk). Region-specific microclimates and pest patterns. Indigenous prevention practices that work.

**Why it matters:** This is what makes the app feel like it speaks the farmer's language rather than translating into it. It's also the layer most likely to be missing from any "official" source — which is precisely why it's a competitive advantage to capture it. Pairs naturally with the Story Library.

**Update cadence:** Continuous, contributed; reviewed regularly by partner agronomists for accuracy.

**Used at:** All skill levels — but more weight at Practitioner and Expert, where local nuance lands. For Novice, it's used to translate disease names into the farmer's vocabulary.

---

### Layer E — Farmer-Generated Knowledge (The Living Layer)

**Source:** Story Library (already in the PRD). What other farmers in the same cooperative / region are reporting and trying this season.

**What it covers:** This season's emerging patterns. Treatments that are working in nearby farms right now. Product availability and pricing on the ground. Real outcomes, not theoretical ones.

**Why it matters:** This is the only layer that reflects reality *this week*. The official curriculum may say "apply copper fungicide" but Layer E knows whether copper is available at the local depot, what the going price is, and whether five other farmers in the cooperative just had bad luck with a counterfeit batch.

**Update cadence:** Real-time, continuous, peer-generated.

**Used at:** Heavier weight for Practitioner and Expert, who can contextualize peer experience. Used carefully for Novice (peer noise can mislead an inexperienced farmer).

---

## How the Agent Pulls From the Stack

The Content Selector (Component 2 of the agent) doesn't pull from one layer — it composes from several. The composition shifts with skill level:

| Skill Level | Layer Mix |
|---|---|
| Novice | Layer B as primary (extension voice). Layer A as authority anchor (treatments). Layer D for local vocabulary. Layers C and E mostly suppressed. |
| Practitioner | Layer B plus Layer C where relevant. Layer A as authority anchor. Layer D for nuance. Layer E for peer context. |
| Expert | Layer C heavily. Layer A as compliance reference. Layer D for regional specificity. Layer E for current conditions. Layer B suppressed (too basic). |

The Expert farmer isn't getting *more* content than the Novice — they're getting *different* content from different sources, composed by the agent based on what their skill level actually needs.

---

## Provenance and Attribution

Every piece of content in the stack is tagged with its source. The question is how visible that tagging should be to the farmer.

**Recommendation:** Lightweight, available-but-not-loud. The app shouldn't say "According to Article 7 of CCC Bulletin 2024-03..." — that's noise. But when a Practitioner-level farmer asks "Where does this come from?" or "Who says so?", the agent should have a clear answer. Something like:

> "This comes from ANADER's training materials, and CCC approves the treatment I'm suggesting."

In a low-trust environment where farmers have been burned by bad input dealers, provenance is a feature, not a footnote.

---

## Curriculum Pipeline: Resolved Decisions

### Ownership: Three-Way Partnership

The Knowledge Stack is co-owned through a formal partnership between three Ivorian institutions:

- **CCC (Conseil du Café-Cacao)** — owns Layer A (regulatory authority). Approves all treatment recommendations and product references. Provides the legal-defensibility spine.
- **ANADER (Agence Nationale d'Appui au Développement Rural)** — owns Layer B (extension translation). Provides field-tested Farmer Field School materials and the pedagogical voice for low-literacy delivery.
- **Réseau Ivoirien du Commerce Équitable (RICE)** — owns the cooperative distribution and certification context. Provides Fair Trade-aligned content for certified cooperatives, plus access to cooperative-level networks for field validation, Layer D collection, and Layer E rollout.

**Why this composition works:**
- CCC gives regulatory authority that no internal team can substitute for
- ANADER brings ready-made low-literacy curriculum, saving months of design work
- RICE brings the on-the-ground cooperative relationships needed for Layers D and E, plus certification-aligned content that matters to Fair Trade-certified farmers
- Together they cover regulator + educator + distributor — the three roles needed to make a trusted agricultural app in Côte d'Ivoire

**Internal team role:** Curation, tagging, versioning, technical integration. Not content authorship. The team is the conductor, not the composer.

### Language Rollout

Phased, build-priority order:

| Phase | Language | Purpose |
|---|---|---|
| Phase 2 (MVP) | **English** | Development and internal testing only. Allows fastest iteration on the agent + stack + signal architecture before localization overhead. Not deployed to farmers. |
| Phase 2 (Pilot) | **French** | First deployed language. Reaches literate Francophone farmers, cooperative agronomists, extension officers. Enables ANADER and CCC content to flow with minimal translation friction. |
| Phase 3 | **Baoulé**, **Dioula** | Voice-only delivery in the two most widely spoken cocoa-region languages. Layer D content originates in these languages, not translated into them. |
| Phase 4+ | **Bété, Agni, others** | Expand based on pilot region and cooperative partner footprint. |

**Critical clarification:** English is a development language, not a deployment language. No actual Ivorian cocoa farmer will use the app in English. French is the first language a farmer ever sees in the field. The English-first phase is a build acceleration choice — Anthropic models and most tooling work fastest in English, and the agent architecture can be validated before incurring localization cost.

This needs to be explicit in internal planning to avoid the trap of shipping an English MVP to actual users in the field. The pilot does not begin until French is in place.

---

## Curriculum Pipeline: Still Open

1. **How is content validated before it reaches farmers?** Especially Layers D and E, which are user-contributed or field-collected. Needs an agronomist-in-the-loop process — likely cooperative agronomists (sourced via RICE) and ANADER extension officers reviewing on a defined cadence. Process design pending.

2. **What gets versioned and how?** When CCC changes a recommended product, every piece of Layer B and Layer D content that referenced the old product needs to update. The stack needs versioning, dependency tracking, and rollback. Technical design pending.

3. **What's the content commercial model with the three partners?** Are CCC/ANADER/RICE compensated, co-branded, given data access in exchange for content rights? This needs a formal partnership agreement before Phase 2 build begins.

---

# Layer 3: Environmental Signals

## Why Environmental Signals Matter

The Farmer Agent (Layer 1) tells the app *who* the farmer is. The Knowledge Stack (Layer 2) gives the app *what* it can say. Neither tells the app *what's relevant right now*.

A farmer who is Expert in Disease Recognition still needs different content in mid-October than in mid-February. A Novice farmer near a CSSVD outbreak needs different prompts than a Novice farmer in an unaffected region. A farmer whose forest-edge plot is about to face a 5-day rain forecast needs that knowledge surfaced *now*, not next week.

Environmental signals condition the agent's decisions about **timing**, **prioritization**, and **specificity** — without changing the underlying skill model. A Novice is still a Novice. But what the agent surfaces to that Novice changes with the world around them.

---

## The Five Signal Types

### Signal 1 — Weather

**Source:** Weather APIs (regional + plot-level if possible). Forecast plus historical.

**What it drives:**
- Black pod risk windows (rain + humidity = outbreak likelihood)
- Treatment timing windows (can't spray before rain)
- Prevention activity timing (pruning before vs. after rains)
- Urgency of agent outreach ("rain in 48h — check pods today")

**Phase priority:** Phase 2 — high impact, easy to integrate. Single biggest determinant of disease pressure in cocoa.

---

### Signal 2 — Regional Disease Pressure

**Source:** Initially: CCC and ANADER bulletins. Over time: aggregated, anonymized data from the app's own user base.

**What it drives:**
- Region-wide alerts that override individual skill calibration ("CSSVD breaking out 30km from you — every farmer here needs eyes up regardless of level")
- Cohort framing in messages ("Farmers in your area are reporting...")
- Prioritization of which disease the agent prompts about during onboarding refinement

**Phase priority:** Phase 3 — depends on data availability. Long-term, the app *itself* may become the surveillance layer, which is a strategic opportunity worth flagging.

---

### Signal 3 — Seasonal Calendar

**Source:** Cocoa production calendar for Côte d'Ivoire (main crop October–March, light crop May–August), tuned regionally.

**What it drives:**
- What kind of advice is even relevant this month (no point teaching harvest timing in January)
- Pre-emptive prevention prompts (pruning in dry season, sanitation before rains)
- Money framing (CFA implications shift dramatically by season)

**Phase priority:** Phase 2 — trivial to implement, immediately valuable.

---

### Signal 4 — Plot-Specific Context

**Source:** Farmer Intelligence Log (already in the PRD), augmented with optional geo-tagging, soil type, shade level, drainage characteristics.

**What it drives:**
- Risk weighting per plot (forest-edge = higher black pod risk)
- Prioritization in agent prompts ("check Plot C first")
- Long-term pattern recognition feeding back into Skill 5 (Farm Self-Knowledge)

**Phase priority:** Phase 2 — light version (qualitative plot tagging). Phase 3 — richer version with soil and shade data.

---

### Signal 5 — Cohort Signals

**Source:** Aggregated, anonymized activity from farmers in the same cooperative or region.

**What it drives:**
- Trend detection ("Three farmers in your cooperative reported black pod this week")
- Story Library curation (surfacing locally relevant peer experiences)
- Early warning of emerging issues before they appear in official channels

**Phase priority:** Phase 3 — requires user base of meaningful size to be useful. Privacy and consent design must come first.

---

## How Environmental Signals Combine With Agent + Stack

The full personalization equation:

> **Farmer Agent (skill) × Knowledge Stack (content) × Environmental Signals (relevance) → personalized interaction**

Concrete examples:

**Example 1:** Novice farmer, no plot data, dry season, no regional outbreaks.
→ Light-touch seasonal reminders pulled from Layer B (extension materials). Foundational vocabulary. No urgency.

**Example 2:** Same farmer, now wet season, regional CSSVD alert active.
→ Same farmer model, but content shifts: agent now actively prompts about CSSVD recognition (Layer B with Layer D vocabulary), references the regional alert openly ("the disease is spreading in your area"), increases contact frequency.

**Example 3:** Expert farmer, plot-tagged with forest-edge risk zone, 5-day rain forecast.
→ Agent surfaces: "Heavy rain Thursday through Sunday. Your forest-edge plot is your historical first-fail zone. Worth a check today and Wednesday." Pulls Layer C nuance (humidity gradient explanation) only if farmer asks why.

The agent doesn't change. The stack doesn't change. The signals condition which combination surfaces.

---

# Integration: How the Three Layers Combine in Practice

## What Changes at Each Skill Level — Now With All Three Layers

| | Novice | Practitioner | Expert |
|---|---|---|---|
| **Diagnosis delivery** | Full narrative + cause + story + treatment (Layer B primary, Layer A authority) | Confirmation + extension + one new element (Layer B + Layer C) | Rapid confirmation + farmer-led discussion (Layer C primary, Layer A reference) |
| **"Farmer Speaks First" prompt** | "Tell me anything you notice" | "What do you think is happening?" | "What's your read on this?" |
| **Treatment recommendation** | Full step-by-step ranked list with CFA costs | Key recommendation + timing emphasis | Brief confirmation + trade-off discussion |
| **Day 7 follow-up** | "What happened? Tell me." | "Did it match what you expected?" | "What did you learn that you'd do differently?" |
| **Prevention prompts** | Seasonal reminders, simple single action | Reminder + why + connection to their history | Proactive: "Your log suggests now is the time to..." |
| **Money framing** | "Treating early protected X CFA — that's real money." | "You caught it earlier than last time — that's worth Y more CFA." | "Your prevention habits this season likely saved you Z CFA total." |
| **Environmental conditioning** | Weather + season drive timing of outreach | Add: regional pressure, plot context | Add: cohort signals, predictive pattern surfacing |
| **Source attribution** | Available on request, generally invisible | Available on request, occasionally surfaced ("ANADER recommends...") | Often surfaced — Expert farmers ask "who says so?" |

---

## What This Replaces in the Current PRD

| Current PRD Element | Replaced By |
|---|---|
| Quick Mode / Deep Mode toggle | Agent automatically calibrates depth |
| "My Knowledge Score" (visible number) | Invisible agent model + voice milestone recognition |
| Generic Day 7 reflection prompt | Agent-personalized prompt based on skill + situation |
| Static learning path | Agent-driven, environment-conditioned, personalized path |
| One-size "Farmer Speaks First" prompt | Skill-level-appropriate prompt for each of the 5 skills |
| Implicit/undefined content corpus | Explicit five-layer Knowledge Stack with provenance |
| Farmer-only signals | Environmental conditioning layer |

**What stays from the current PRD:**
- The Day 7 loop as the core learning mechanism
- Money as the emotional climax of every loop
- Story Library for peer knowledge (now formalized as Layer E)
- Observation Training Loop (now skill-tagged)
- Voice-first + icon system + 3 access modes
- Farm Intelligence Log (now also feeds Signal 4)
- "Farmer Speaks First" as skippable but strongly encouraged

---

## Risks Specific to This Architecture

**Risk: Agent miscalibrates and treats an expert like a novice.**
The most damaging failure mode — an experienced farmer being talked down to will disengage immediately. Mitigation: start Novice, promote fast (after 2–3 positive signals, not 10), and let the farmer correct the agent explicitly ("I already know this" → agent logs and promotes).

**Risk: Knowledge Stack gets out of date.**
Pesticide registrations change. CCC updates dosages. Layer A goes stale and the app starts recommending things the regulator no longer approves. Mitigation: explicit content versioning, a named owner for each layer, a quarterly review cadence locked in from day one. Audit log of what was said to whom and when.

**Risk: Environmental data is unavailable or unreliable in some regions.**
Weather APIs may be patchy in remote cocoa areas. Regional disease surveillance may not exist. Mitigation: graceful degradation — the system works without environmental signals, it just works better with them. Don't make any core function depend on a signal that might not arrive.

**Risk: Cohort signals create privacy problems.**
"Three farmers in your cooperative reported black pod" sounds anonymous until the cooperative only has six farmers. Mitigation: minimum-cohort-size thresholds before any cohort signal surfaces. Explicit consent during onboarding. Aggregation only above N=10 or similar.

**Risk: Layered Knowledge Stack delays shipping.**
A full five-layer stack is a significant content build. Mitigation: ship with Layers A and B only (the regulatory + extension spine). Add C, D, E in subsequent phases. The agent architecture handles whatever stack exists — it doesn't require all layers to function.

**Risk: Agent complexity delays shipping.**
A full 5-skill, 3-level agent is a significant build. Mitigation: ship a simplified version first — one skill, two levels, one onboarding question. Add skills in Phase 3.

**Risk: Non-literate users don't respond to onboarding questions.**
Expected. Default to Novice. The agent calibrates through behavior. Onboarding is a shortcut, not a requirement.

**Risk: Agent creates invisible inequality.**
If farmers know (or suspect) the app gives different content to different people, it could create social tension in cooperative settings. Mitigation: frame it always as "the app learns about your farm" — which is true — rather than "the app levels you up" — which invites comparison.

**Risk: Source attribution undermines conversational feel.**
Constant "according to CCC..." breaks the warmth. Mitigation: provenance available on request, not pushed. Default voice is conversational; sourcing surfaces when farmer questions it or when stakes are high (medical-grade decisions).

**Risk: English MVP gets shipped to actual farmers by accident.**
The English-first build phase is for internal validation only. The trap is shipping the English version to a real cooperative under deadline pressure before French translation is complete. Mitigation: hard gate on pilot launch — no deployment to any farmer until French (Layer A + Layer B core content + onboarding voice questions) is fully in place. Treat English as a closed-environment build artifact, not a release candidate.

**Risk: Partnership negotiations with CCC/ANADER/RICE delay content authority.**
Formal partnerships take months. If Phase 2 build starts before partnership terms are signed, there is a risk of building against content the partners later restrict use of. Mitigation: begin partnership conversations in parallel with technical architecture work, not after. Have at least a memorandum of understanding with each of the three partners before content tagging begins.

---

## Recommended Build Sequence

### Phase 2 MVP (Internal — English)
- **Language:** English only. Internal team and partner agronomist review use. **No farmer deployment.**
- **Layer 1 (Agent):** 1 skill tracked (Disease Recognition), 2 levels (Novice / Practitioner), 1 onboarding question
- **Layer 2 (Knowledge):** Layers A and B only. ~50 content pieces sourced from CCC + ANADER, hand-tagged by skill level. Provenance metadata in place but not surfaced. Partnership MOUs signed with CCC, ANADER, RICE.
- **Layer 3 (Environmental):** Weather + seasonal calendar only. Plot context as optional qualitative tag.
- **Measure (internal):** Does the architecture function end-to-end? Do partner agronomists agree the Practitioner-level content is correctly differentiated from Novice?

### Phase 2 Pilot (Field — French)
- **Language:** French. First farmer-facing deployment.
- **Distribution:** Through RICE-partnered cooperatives.
- All Phase 2 MVP architecture, now in French with full voice synthesis.
- **Measure:** Does Practitioner-level content reduce time-to-completion and increase Day 7 return rate vs. Novice content? Does weather-conditioned outreach increase preventive action?

### Phase 3
- **Language:** Add Baoulé and Dioula (voice-only). Layer D content sourced directly in these languages via RICE cooperative networks.
- **Layer 1:** Add Skills 2, 3, 4. Add 3-level system. Full 3-question onboarding. Learning Path Planner.
- **Layer 2:** Add Layer C (research depth — CNRA, IITA) and Layer D (indigenous knowledge — first regional pass).
- **Layer 3:** Add regional disease pressure signal (initially manual / bulletin-driven from CCC). Richer plot context (soil, shade, drainage tags).

### Phase 4
- **Language:** Add Bété, Agni, and others based on pilot region and RICE cooperative footprint.
- **Layer 1:** Add Skill 5 (Farm Self-Knowledge). Cross-skill pattern detection.
- **Layer 2:** Add Layer E (Farmer-Generated, fully integrated with Story Library). Versioned content pipeline with named owners per layer.
- **Layer 3:** Add cohort signals. App-as-surveillance-layer: aggregated regional disease data flows back to CCC/ANADER as a public-good contribution.
- Expose agent insights (anonymized, aggregated) to cooperative agronomists (sourced through RICE) as a cohort-level tool.

---

## Resolved Design Decision: Two-Track Model

**The question:** How do you handle a farmer who is Expert in farming but Novice with the app?

**The answer:** Track them on two completely separate axes. Never conflate them.

Agronomic skill and app fluency are unrelated. A farmer can be any combination:

- Expert farmer, first time with a smartphone → needs UI guidance, zero agronomic hand-holding
- Novice farmer, comfortable with mobile apps → needs agronomic depth, zero UI guidance
- Expert farmer, comfortable with apps → needs neither
- Novice farmer, first time with a smartphone → needs both

Conflating them produces the most common and most damaging onboarding failure in agricultural apps: a 35-year farmer who feels talked down to about cocoa in their first session because the system assumed agronomic novice = app novice. They don't come back.

---

### Track 1 — The Farmer Agent (Agronomic Skill)

Controls how the app *speaks about cocoa* — depth of diagnosis narrative, challenge level of prompts, complexity of prevention advice, which layers of the Knowledge Stack to draw from. Starts from the 3 onboarding voice questions and refines continuously through behavioral inference. Conditioned by environmental signals. Described in full above.

### Track 2 — App Familiarity Flag (UI Comfort)

Controls how the app *behaves as an interface* — whether onboarding tooltips appear, whether icons carry text labels, whether navigation is explicitly guided, whether confirmations are requested before actions.

Three states: **First Time / Familiar / Fluent**

| State | What it controls |
|---|---|
| First Time | All icons labeled. Explicit navigation prompts after each step. Confirmation before any action. Onboarding tooltips visible. |
| Familiar | Labels on primary icons only. Navigation prompts removed. Tooltips hidden unless tapped. |
| Fluent | Minimal UI chrome. Fast navigation assumed. No prompts unless farmer requests help. |

**How it updates:** Automatically, based on session count and navigation behavior — never on farmer input. Default transition: First Time → Familiar after 3 completed sessions. Familiar → Fluent after 8 completed sessions. These thresholds should be validated in the pilot.

**The two tracks never interact.** The Farmer Agent can be delivering Expert-level agronomic content (drawn from Layer C research depth, conditioned by a regional disease alert) while the UI simultaneously shows navigation labels because it is only the farmer's second session. A farmer's knowledge of cocoa has no bearing on how comfortable they are with a touchscreen, and vice versa.

**One pilot validation required:** Confirm the 3-session threshold for First Time → Familiar. Watch session recordings for where navigation friction actually occurs and adjust. Everything else in this model can be built on the assumptions above.