# Ibrahim — skeptic who lost crop last year

## Identity
- **Name:** Ibrahim Koné
- **Age:** 62
- **Role:** Cocoa farmer, 4.5 ha, Soubré region. Co-op treasurer.
- **Backstory:** Lost ~40% of last year's crop to what an ANADER agent told him was black pod rot, but only *after* he had already lost half the harvest. He sprayed twice — once with the wrong product (a neighbor's recommendation), once with a copper fungicide his cooperative provided. He's been a co-op member for 30 years and trusts ANADER agents *more than apps*. Speaks Dioula, French, some Baoulé.

## Goal
*"Voir si cette chose dit la vérité, avant que je fasse confiance pour ma plantation."*
("See if this thing tells the truth, before I trust it for my plantation.")

He'll test it by:
1. Showing it a pod he already knows is healthy, to see if it says "healthy."
2. Showing it a pod he already knows has black pod rot, to see if it gets the diagnosis right.
3. Asking himself: does the explanation match what the ANADER agent told him?

## Tech profile
- **Phone:** Samsung Galaxy A04, 4 GB RAM, Android 13. He keeps brightness on minimum to save battery.
- **Connectivity:** No Wi-Fi at home. 4G in his courtyard. Plays the FM radio more than he uses the phone.
- **Comfort:** WhatsApp, mobile money, calculator app, the radio app. Will read help text once if it's short.
- **Other apps:** WhatsApp, Orange Money, Calculator, FM Radio Côte d'Ivoire.

## What he knows
- Cocoa diseases by sight, by French name, by Dioula name.
- That a wrong diagnosis costs a season.
- That an "85% confidence" prediction is sometimes wrong — he's used weather forecasts for 40 years.

## What he doesn't know
- That the app's first diagnosis might be a `MOCK` (the DEMO badge on the result screen — what does that mean?).
- What "confidenceBand: low" triggers (the `diagnosis.error_uncertain` path) versus a normal low-confidence result.
- That the model can hallucinate a disease that isn't present. He'll assume any disease name returned is the correct one — until he tests it against his known-healthy pod.
- That there's no built-in way to flag a diagnosis as wrong. He has no way to tell the app "you were wrong."
- That "Sources" at the bottom of the result are real citations (PlantVillage, CGIAR, IITA, iNaturalist) and not just decoration.

## Limitations
- **Cognitive:** Reads French at a moderate level. Skeptical of new information.
- **Physical:** Phone brightness set very low; outdoors at noon, screen is hard to see. Reading glasses sometimes on, sometimes not.
- **Contextual:** Outdoor sun, ~30,000 lux. Standing.
- **Emotional:** Burned before. *Wants* this to fail his tests, so he can dismiss it and stop being asked about it. If it passes his tests, he'll become its biggest advocate.

## Mental model
- A percentage means risk. 85% sure = a 15% chance you're wrong, and that 15% is on his plantation.
- A "Sources" list with names he recognizes (ANADER, CNRA, ICRAF) = trustworthy. Without those = not trustworthy.
- If the app can't tell him *why* — what it saw in the photo, what features it keyed on — he won't believe its answer.

## Dealbreakers
- He photographs a healthy pod and the app diagnoses a disease → app is permanently broken in his eyes.
- He photographs a known sick pod and gets a different disease than ANADER told him → either app is wrong or ANADER was wrong; he'll pick ANADER.
- A diagnosis is returned with no way to say "I disagree" / "this looks healthy to me" → erodes trust silently.
- The result page says "DEMO" or "MOCK" without explaining what that means → tells the cooperative "the thing is fake."

## Voice
*"L'agronome m'a dit ce que c'était l'année dernière, après que j'aie perdu la moitié. Cette application va me dire la même chose plus tôt, ou rien du tout. Si elle me ment une fois, je ne reviens pas."*

## Flows to test
- **Adversarial:** photograph a healthy pod — does the model return a confident wrong answer or a "looks healthy" / low-confidence path?
- **Confidence comprehension:** result screen shows "85% · Élevée" — does Ibrahim understand what the band means? Does he understand what to do if it says "Faible"?
- **Sources:** is `getSources(d.disease)` populated for every disease, or empty (returns null per ResultScreen line 113)?
- **Disagreement:** there's no "flag" or "this is wrong" button anywhere. Surface this gap.
- **DEMO/MOCK badge:** ResultScreen.tsx:78 renders a red DEMO badge if `modelVersion.includes('MOCK')` — when does Ibrahim see this and what does it tell him?
