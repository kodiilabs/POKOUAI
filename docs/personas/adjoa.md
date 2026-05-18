# Adjoa — daughter installing for her father

## Identity
- **Name:** Adjoa N'Guessan (Kouassi's eldest daughter)
- **Age:** 19
- **Role:** Second-year university student in Abidjan, home for the holidays
- **Backstory:** Grew up in the village, now lives in a student dorm in Cocody. Bilingual French/Baoulé, reads English. Uses TikTok, Instagram, WhatsApp, Google Maps, mobile money, a banking app. Home for two weeks; her dad asked her to "mets le truc qui connaît les maladies du cacao" on his phone. She has *one evening* with him, sitting on the porch.

## Goal
*"Installer PokouAI sur le téléphone de papa, faire le setup, et m'assurer qu'il peut prendre une photo et avoir une réponse tout seul avant que je reparte à Abidjan dimanche."*
("Install PokouAI on dad's phone, do the setup, and make sure he can take a photo and get an answer on his own before I go back to Abidjan Sunday.")

She'll happily slog through any setup screen if it means her dad doesn't need her help next week.

## Tech profile
- **Her phone:** Redmi Note 12, fast.
- **His phone:** the Tecno Spark Go from Kouassi's profile (2 GB RAM, 28 GB used out of 32 GB).
- **Connectivity:** her family's house has no Wi-Fi. She tethers from her phone (Orange CI, 5 GB plan, currently 4.2 GB left).
- **Comfort:** smartphone-native, used to onboarding flows, will hit "Skip" if it's offered, will read fine print only for permissions she's suspicious of.
- **Mental model from other apps:** account creation is normal, biometric login is normal, push notifications she'll deny by reflex, in-app purchases she'll watch for.

## What she knows
- How to install an APK from a link, how to enable "install from unknown sources" if prompted.
- How to switch a phone's language at the OS level.
- That her dad reads slowly in French and won't read at all in English.
- That her dad's photos are sacred — she won't delete anything to free space without asking.

## What she doesn't know
- That the app's first launch will pull a 1.5 GB GGUF model — over her tethered data plan.
- Whether the app's onboarding language picker is for *her* (the installer) or for *him* (the user). She'll pick Baoulé, then worry the rest of setup is going to be in Baoulé too.
- Whether tapping "🛰 Hub" or "☁️ Cloud" badges does anything (they're badges, not buttons, but she'll try).
- Whether the consent screen needs her dad to tap it himself, or if she can tap on his behalf.
- That `recentDiagnoses` will show *her* setup-test photo (e.g. a cabbage from the kitchen) as her dad's first "diagnosis" forever.

## Limitations
- **Cognitive:** None — she's a power user.
- **Physical:** None.
- **Contextual:** Evening, porch, mosquitoes, generator hum, her dad watching over her shoulder asking questions. She wants to finish in 20–30 minutes.
- **Emotional:** Patient with her dad, impatient with the app. If something is fiddly, she'll find a workaround rather than read help.

## Mental model
- "Continue" without a "Back" means I'm stuck if I made a wrong choice.
- A download progress bar means the download is real; a spinner means "maybe stuck."
- Audio playback should auto-handle the language she picked — she shouldn't have to also "set the voice" somewhere.
- A demo / test photo she takes during setup should be deletable.

## Dealbreakers
- The 1.5 GB download starts without warning and eats her tether plan → she yanks the SIM.
- The setup wizard doesn't let her change language after picking it → she'll have to factory-reset the app to fix.
- The first diagnosis she runs as a test is permanently in her dad's Recent and she can't remove it → annoying.
- She finishes onboarding, hands the phone to her dad, and he sees a screen that requires *her* to do something else → fail.

## Voice
*"Papa ne va pas chercher dans les paramètres. Si ça ne marche pas du premier coup, il appelle. Et moi je suis à Abidjan, je ne peux pas le débugger par WhatsApp. Donc je veux finir ce soir et que demain matin il prenne une photo, point."*

## Flows to test
- **Onboarding handoff:** she sets it up, he opens it next morning cold — is the language right, is the model ready, is there an obvious "take a photo" affordance?
- **Model download:** what does the download UX do on a tethered connection that will run out of data?
- **Test diagnosis:** her setup test stays in his Recent — can she remove it?
- **Notifications:** does the app ask for notification permission? Adjoa will deny by reflex — but the day-7 follow-up loop depends on it.
