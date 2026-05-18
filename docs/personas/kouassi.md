# Kouassi — primary persona

## Identity
- **Name:** Kouassi N'Guessan
- **Age:** 54
- **Role:** Cocoa farmer in Bouaflé region, 3 ha plantation inherited from his father, sells through the village cooperative
- **Backstory:** Grew up speaking Baoulé at home and in the field. Three years of primary school in French in the late 1970s, then dropped out to help on the farm. Reads Baoulé phonetically (Baoulé is rarely written, so this is shaky), can read simple French if he sounds it out slowly. Wife and four children, two adults who left for Abidjan. Lost ~25% of last year's harvest to "the brown rot" — never got a diagnosis, just heard from neighbors what to spray.

## Goal in his app
*"Mes cabosses ont des taches brunes. Je veux savoir quoi faire avant la récolte."*
("My pods have brown spots. I want to know what to do before harvest.")

He has heard from his cousin that "there is a phone thing that knows the diseases." He does **not** describe this as "using an AI to diagnose crop disease." He describes it as "asking the phone what is wrong."

## Tech profile
- **Phone:** Tecno Spark Go 2020, 2 GB RAM, 32 GB storage (28 GB full — photos of grandchildren, downloaded WhatsApp media, no cleanup ever done). Android 11. Cracked screen, top-right corner unresponsive to touch.
- **Connectivity:** No Wi-Fi at home. 4G coverage only at the village market 2 km away (Orange CI), often degrades to 3G. Buys 500 MB data passes when he needs to use WhatsApp.
- **Comfort:** Comfortable with phone calls and WhatsApp voice notes. Uses Orange Money for cash transfers. Has *never* installed an app from a Play Store link he didn't recognize. His son installed WhatsApp for him three years ago.
- **Mental models from other apps:** WhatsApp (the green icon = messages), Orange Money (the orange logo = money), the call icon (green phone), the camera icon (it's a camera).
- **Other apps used:** WhatsApp, Orange Money, the default camera, occasionally YouTube when his daughter sends him a link.

## What he knows
- Cocoa farming cold — knows the difference between a healthy and sick pod by sight, knows which trees historically suffer.
- The local names for diseases in Baoulé and in Dioula (market language). Does **not** know the French names ("Pourriture brune du cabosse") or the scientific names ("Phytophthora").
- How to take a photo with the camera and send it on WhatsApp.

## What he doesn't know
- What "GGUF" means. What a "model" is. What 1.5 GB is in real terms (does it fit on his phone? he doesn't know how much space he has left).
- That a one-time download means he won't need internet later — he assumes anything on a phone requires data.
- What "Hub Ollama" is, what "tier local / hub / cloud" means.
- What a percentage means in the context of a diagnosis ("85% confidence" — 85% of what?).
- What "fongicide à base de cuivre" means in Baoulé. He knows the word "anti-fongique" from the cooperative meetings, but not the chemistry.
- What "Apprendre / Quiz / Mode groupe" buttons would do.
- That tapping the language flag once is enough — he might tap it three times waiting for something to happen.

## Limitations
- **Cognitive / language:** Baoulé is his thinking language. French is effortful. English is a foreign script. Reads slowly, gives up on text after one or two short lines if it doesn't pay off.
- **Physical:** Presbyopia (needs reading glasses he often doesn't have on him). Cracked top-right screen — taps in that area don't always register.
- **Contextual:** Mid-afternoon, outdoors in his plantation. Sun is bright. Hands are slightly sticky from sap. He's standing, not sitting. Phone is at ~40% battery and he won't charge until evening.
- **Emotional:** Anxious — he's lost a season before. Not patient with anything that "fait des histoires" (makes a fuss). Calls his son when something doesn't work, but his son is in Abidjan and won't pick up until evening.

## Mental model
- A button with a green phone icon = make a call. A camera icon = take a photo. Anything else, he's not sure.
- Percentages mean "out of 100" abstractly — he uses them only for cocoa price quotes and weather forecasts on the radio.
- He expects that if he picks "Baoulé" as his language, everything will be in Baoulé. Period. Not "Baoulé where translated, French otherwise." That distinction doesn't exist in his model.
- He expects the phone to know what he's pointing at as soon as he points it — like the camera focuses automatically.

## Dealbreakers
- The first screen is in English. → uninstalls, tells his cousin "ça ne marche pas."
- Asked to type something complicated (URL, email, password) before he gets value. → gives up.
- The app says "download 1.5 GB" and he doesn't know if his phone has space. → backs out, never opens again.
- The app sits on a spinner for >30 seconds with no progress indicator. → assumes broken, force-closes.
- The diagnosis result is in French paragraphs with no audio. → can't read it, doesn't trust it.

## Voice
*"Mon neveu m'a dit qu'il y a une chose dans le téléphone qui connaît les maladies du cacao. Je veux juste prendre une photo de la cabosse malade et que le téléphone me dise quoi faire. En baoulé, parce que le français, à mon âge, c'est fatigant."*

## Flows to test against this persona
- **Cold start:** install → onboarding → first diagnosis → audio playback of result
- **Returning user:** open after 2 weeks → see overdue follow-up banner → complete day-7 check
- **Edge case:** picks Baoulé → expects everything in Baoulé → encounters `[FR→BCI à valider]` strings
- **Edge case:** taps the top-right area where his screen is cracked (network badges live there)
