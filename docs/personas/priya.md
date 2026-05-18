# Priya — hackathon judge (meta-persona)

## Identity
- **Name:** Priya Subramanian
- **Age:** 31
- **Role:** ML engineer at a US Big Tech company, judging the Gemma 4 Good Hackathon
- **Backstory:** Bay Area, Stanford MS, builds RAG systems by day. Volunteered to judge ~30 submissions in a week. Has never grown anything, has never been to West Africa. Reviews each submission as: 6 minutes of demo video → 10 minutes of repo skim → 2 minutes of hands-on if the submission ships an APK / TestFlight.

## Goal
*"Evaluate PokouAI in under 20 minutes total. Decide: does this work, is the offline claim real, does the multilingual claim hold up, would I forward this to the finalists list."*

## Tech profile
- **Phone:** iPhone 15 Pro, on Wi-Fi (gigabit fiber, Mountain View).
- **Comfort:** ML researcher. Reads code fluently. Reads French at a tourist level. Doesn't read Dioula, Baoulé.
- **Other apps:** Slack, GitHub, Linear, Anthropic Console, Hugging Face.

## What she knows
- What Gemma 4 E2B / E4B is, what GGUF is, what `llama.cpp` and Ollama are.
- What QLoRA / Unsloth is.
- How to spot a model that's actually local vs. one that's calling out to a hosted endpoint.
- What "Phytophthora palmivora" is, vaguely, from a Google search.

## What she doesn't know
- Anything about cocoa farming, Côte d'Ivoire, or the lives of the intended users.
- Whether the Baoulé translations are correct.
- What the actual scarce resource is for the target user (it's storage, not RAM).
- That her airport-Wi-Fi test of "offline mode" isn't really offline mode — iOS may still route some queries.

## Limitations
- **Cognitive:** Strong English reader. French at tourist level — will miss nuance.
- **Physical:** None.
- **Contextual:** Tired, on submission #18 of 30. Wants to make a fast decision and move on.
- **Emotional:** Already disappointed with most submissions. *Wants* a winner, but is calibrated to the median, which is low.

## Mental model
- A README with a clear "Quick start" and a working `npx expo start` = real. A README full of TBDs = vapor.
- Demo video that shows airplane-mode toggle = credible offline claim. Demo video without that = handwave.
- An English-language judge mode is a sign the team thought about reviewers.

## Dealbreakers
- The demo video doesn't show real inference on a real phone → "this is a slide deck."
- The "100% offline" claim isn't demonstrated → marks down hard.
- The English path has French strings leaking through → "they didn't even test their own English."
- The model download takes 8+ minutes during her 2-minute hands-on window → she won't wait.

## Voice
*"Show me the photo go in, show me the diagnosis come out, in airplane mode, in two languages, in 90 seconds. I have 12 more of these to review tonight."*

## Flows to test
- **Cold install:** `npx expo start` from the repo → can she get to a working demo in 5 minutes?
- **English completeness:** start the app in English → does every screen render in English, or do `[FR→EN à valider]` placeholders leak through?
- **Offline claim:** install with internet, then enable airplane mode, then run a diagnosis end-to-end → does it work? Does the "☁️" badge correctly show offline?
- **Tier proof:** is there a way to *show* her this ran on-device (the `📱 Llama.cpp · on-device` badge on the result screen)?
- **MOCK detection:** Result screen shows "DEMO" badge when `modelVersion.includes('MOCK')` — does her demo path hit a real model or a mock?
