# Aminata — shared-phone, Dioula-speaking woman farmer

## Identity
- **Name:** Aminata Diabaté
- **Age:** 38
- **Role:** Cocoa-and-cashew farmer in Korhogo region, member of a women's cooperative
- **Backstory:** Native Dioula speaker, also speaks Senoufo at home and gets by in market French. Five children, ages 4 to 16. Manages a 1.5 ha cashew plot her husband bought her in 2019 and helps on the family cocoa plantation. Doesn't own a phone — uses her husband's Itel A56 in the evenings, after dinner, when he's done with it. He hands it to her with no app open, lock screen wiped, and a baseline of suspicion: he thinks she'll "break something."

## Goal
*"N ka anacarde furabaga bɛ bɔ. N b'a fɛ k'a dɔn ko mun b'a la."*
("My cashew tree leaves are curling. I want to know what's wrong with it.")

She wants to confirm her own theory (insects after the recent rains) without having to ask her husband, who will mock her for "trusting the phone over your own eyes."

## Tech profile
- **Phone:** Husband's Itel A56, ~3 years old, 3 GB RAM, 64 GB storage, Android 12. Battery is degraded — dies at ~30% indicated charge. Currently at 42%, evening.
- **Connectivity:** Home Wi-Fi from a MTN box that's flaky. Outside, MTN 3G/4G, ~2 bars in her courtyard.
- **Comfort:** Uses WhatsApp voice notes prolifically. Mobile money native (Orange Money + MTN MoMo). Reads French slowly. Cannot read English. Reads Dioula in N'ko if printed clearly — but phone keyboards don't have N'ko, so when she types Dioula she uses French phonetic spelling.
- **Other apps:** WhatsApp, MoMo, Facebook (rarely), the radio app for "Radio Nostalgie."

## What she knows
- Cashew farming basics, learned from her cooperative's monthly meetings. Knows the seasonal pest cycle by Dioula names.
- How to share photos on WhatsApp, how to receive Orange Money, how to switch SIMs (their household swaps SIMs across phones).

## What she doesn't know
- That the app stores data per-installation, not per-user. She'll assume the app knows it's a different person now. (It won't.)
- That picking "cashew" as her crop will likely give degraded answers — the model is fine-tuned on cocoa.
- That the language switch in Settings exists if she got onboarded in French earlier (e.g., because her husband ran the install).
- The difference between "Local," "Hub," and "Cloud" badges — to her these are decorative.
- That her husband's previous diagnoses on this phone show up under "Recent" — and that he'll see her cashew diagnosis next time he opens the app.

## Limitations
- **Cognitive / language:** Dioula primary, market French secondary. Won't parse subordinate clauses in French.
- **Physical:** None notable.
- **Contextual:** Evening, kitchen, baby on hip, two children doing homework at the table. Phone is on its last 30 minutes of battery and she has no charger near. Husband returns in ~45 minutes.
- **Emotional:** Mild anxiety — she's borrowing a phone that's "his," she doesn't want to leave traces, she doesn't want to "use up data" she can't replace.

## Mental model
- A back arrow goes back. A close X dismisses. No back arrow visible = trapped.
- "Share" = WhatsApp.
- Photos in the gallery are private to whoever's looking — she doesn't expect an app to surface her husband's recent photos.
- If she picks Dioula, the app speaks Dioula. Audio is more important than text for her — she wants the phone to *say* the answer out loud.

## Dealbreakers
- The Dioula she sees is obviously machine-translated or marked "à valider" — she'll trust her cousin more than this thing.
- The audio is in French when she picked Dioula. → tells her cooperative friends "the app lies about Dioula."
- She has to create an account or enter a phone number → won't do it, the phone isn't hers.
- The model download eats her husband's data → blocker, with marital consequences.

## Voice
*"Mon mari ne croit pas que le téléphone peut savoir ces choses. Moi je veux juste vérifier ce que je pense, sans qu'il rigole. Et je veux que le téléphone me parle, parce que lire pendant que le bébé pleure c'est pas possible."*

## Flows to test
- **Cashew path:** picks `crop.cashew` in onboarding (it's offered) → tries to diagnose curling leaves → sees what happens when the model is cocoa-tuned
- **Shared phone:** opens app already onboarded in French by her husband → wants to switch to Dioula mid-session
- **Audio reliance:** taps `SpeakButton` on result screen → expects Dioula TTS → check `speech.unavailable_*` keys
- **Low battery:** model load mid-analysis when battery hits 28%
