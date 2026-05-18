# Yao — extension agent + cooperative hub operator

## Identity
- **Name:** Yao Brou
- **Age:** 28
- **Role:** Agricultural extension agent (vulgarisateur), employed by ANADER, assigned to a cluster of 4 villages around Daloa
- **Backstory:** Diploma in agronomy from INPHB Yamoussoukro. Speaks French fluently, Baoulé natively, some English from school. Tech-curious but not a developer — he's the guy in the village who fixes everyone's WhatsApp settings. Just received a donated ThinkPad T480 from an NGO partner and was told "PokouAI can run on this as a hub for the cooperative." He read the README once.

## Goal
*"Animer une session de formation sur la pourriture brune pour 12 producteurs, avec leurs téléphones connectés à mon laptop. Sortir avec chacun ayant pris au moins une photo et compris le traitement."*
("Run a training session on black pod rot for 12 producers, with their phones connected to my laptop. Each of them leaves having taken at least one photo and understood the treatment.")

## Tech profile
- **Phone:** Samsung Galaxy A14, his own, 4 GB RAM, Android 13. He installed PokouAI from a TestFlight-style link.
- **Laptop:** Donated ThinkPad T480, 16 GB RAM, no dedicated GPU, Ubuntu 22.04. He installed Ollama by copy-pasting commands from a Discord post.
- **Connectivity:** Cooperative office has a mobile hotspot (MTN), ~10 GB/month shared, often capped by mid-month. He'll bring his own MiFi for the session, no internet expected.
- **Comfort:** Comfortable with Android, basic Ubuntu terminal usage if he has copy-paste instructions, can read English documentation slowly with a translator. Hates having to debug things in front of a group.

## What he knows
- The cocoa pathogens by French name and by symptom, has been trained at ANADER.
- That `192.168.x.x` is a "local IP." Doesn't know what subnet his MiFi assigns.
- That Ollama exists. Has run `ollama serve` once.
- That his phone needs to be on the same Wi-Fi as the laptop for the hub to be reachable.

## What he doesn't know
- Which Ollama model variant (`gemma-4-27b` vs `gemma-4-e4b`) his ThinkPad can actually run without thermal throttling.
- The exact URL format the app expects in `hub.url_label` (does it want `http://192.168.1.10:11434`? `192.168.1.10`? `http://laptop.local:11434`?).
- What happens to the 12 farmers' phones if the hub goes down mid-session — does each phone fall back to local? Does it freeze?
- What `group_mode` does that `take_photo` doesn't.
- Whether `note_no_save` (group mode doesn't save to journal) means *anything* is preserved (he wants to share the disease list with the farmers afterward).

## Limitations
- **Cognitive:** None — he's the most technically capable user in this cast.
- **Physical:** None.
- **Contextual:** Standing in front of 12 people who are deciding whether to ever come to another training session. Public failure cost is *very high*. Has 90 minutes total, including the introduction.
- **Emotional:** Wants to look competent. Will skip features he doesn't understand rather than experiment in public. Will not read help text mid-session.

## Mental model
- A wizard screen has Back / Next at the bottom.
- A button that says "Save and test" should test the thing being saved before exiting the screen, not after.
- "Reachable" means "the request returned 200." He doesn't think about model loading inside the hub.
- He expects "Group mode" to be a different UX than solo mode — bigger text? a projector view? a participant counter?

## Dealbreakers
- Hub pairing requires entering a long URL with no QR code option → he won't have farmers type it in.
- Hub config fails silently — "saved" but next diagnosis still routes local with no explanation → he can't troubleshoot in front of a group.
- The Ollama side needs a specific model name and he picks the wrong one → 27B chokes the laptop, fans spin, group sees the laptop hang.
- Group mode doesn't actually look different from solo mode → why is he using it?

## Voice
*"J'ai 90 minutes avec 12 producteurs. Si le hub plante pendant la démo, je perds toute crédibilité. Je veux savoir avant la session ce qui marche, ce qui ne marche pas, et comment je récupère si ça plante."*

## Flows to test
- **Hub pairing:** [HubSettingsScreen.tsx](../../app/src/screens/HubSettingsScreen.tsx) — URL entry, "Save and test," failure modes
- **Group session:** [GroupModeScreen.tsx](../../app/src/screens/GroupModeScreen.tsx) — what's actually different
- **Tier fallback:** hub stops responding mid-diagnosis — does the next farmer's photo silently route local, or does the app surface it?
- **Recovery:** he restarts Ollama mid-session — when does the app re-detect the hub?
