# PokouAI — Demo recording playbook

Phone-to-hub demo: phone runs the React Native app, Mac runs Ollama with `gemma4:e2b`, traffic flows over LAN. Use this when on-device GGUF isn't loaded (or while you're waiting on a v2 retrain).

## Pre-flight checks (~2 min)

Run these on the Mac before recording.

```bash
# 1. Confirm the Mac IP — DHCP can shift it from session to session
ipconfig getifaddr en0

# 2. Ollama is up and bound to the LAN (not just localhost)
curl http://192.168.2.85:11434/api/tags | head -c 100
# Expect: {"models":[{"name":"gemma4:e2b", ...

# 3. Prevent the Mac from sleeping mid-demo
caffeinate -d &
# Leave this running until the demo's done; Ctrl+C the terminal to release.
```

If `ipconfig` returns a different IP than `192.168.2.85`, update **Settings → Hub URL** on the phone before recording.

If `curl` fails:
- Server not running → `OLLAMA_HOST=0.0.0.0:11434 ollama serve` in a Mac terminal (or `launchctl setenv OLLAMA_HOST "0.0.0.0:11434"` then restart the menu-bar app)
- `localhost` works but LAN IP doesn't → menu-bar Ollama bound to 127.0.0.1 only; restart it after the `setenv`

## On the phone (or iOS Simulator)

- Same Wi-Fi as the Mac. **Not cellular.** Not a guest SSID with AP isolation. (Simulator runs on the Mac itself, so this is automatic.)
- Open PokouAI → **Settings**:
  - **Hub URL** = `http://<mac-IP>:11434` (Simulator can also use `http://127.0.0.1:11434`)
  - **Hub Model** = `gemma4:e2b`
- **Simulator has no camera.** Use **🖼 From gallery** in the app. Push a sample image into Photos first:
  ```bash
  xcrun simctl addmedia booted data/raw/black_pod/00011000_jpg.rf.c2VHijIZ890e1bwWEHL2.jpg
  # Or any class: black_pod / frosty_pod_rot / healthy / other_damage / swollen_shoot
  ```
  Drag-and-drop from Finder onto the Simulator window also works.
- Take **one dry-run photo** before recording. First inference has Ollama's cold-start delay (~10 s while `gemma4:e2b` loads into VRAM). After that, `keep_alive: '15m'` keeps it hot for the next 15 minutes — record within that window.
- **Clear the deck before recording** — Settings → Dev → 🗑 *Clear all diagnoses* removes any test runs that might leak into the Home recent-diagnoses list during capture.

## What to capture

1. **Open** — language already set, brief glance at home tile (camera + farm log + intelligence)
2. **Capture** — tap **📷 Take photo** → real device; or tap **🖼 From gallery** → Simulator. Sample images: `data/raw/<class>/` (Roboflow exports) or `data/processed/<class>/` (cleanly-named).
3. **Diagnose** — the panel shows the analyzing spinner with the chosen tier badge (**🛰 hub (Ollama)** during this demo). This is the architectural proof — call it out in the voiceover. There is no model-download prompt mid-flow; on-device GGUF status lives in Settings → Model version.
4. **Result** — disease + confidence band + symptoms + treatment + prevention + agronomist callout
5. **Read aloud** — tap 🔊 to demo TTS in the user's language (fr/en supported on-device)
6. **Education** — tap 📖 Learn more to show the "why this happened" screen
7. **Loop setup** — set a hypothesis on the result; mention the day-7 follow-up story
8. **Offline pitch** — toggle airplane mode → analyze again → router falls back (to local if GGUF sideloaded, mock otherwise). Narrate: "with the fine-tuned model on the phone, this works fully offline; the demo is hub-routed because we're still finishing the on-device fine-tune."

Total: ~90 s for the core flow, +30 s for the offline pitch.

## Recording

iOS:
- **Settings → Control Center → +** Screen Recording (one-time)
- Swipe down from top-right → red record button → tap PokouAI

Voiceover options:
- **Live narration** — Control Center → long-press the record button → enable Microphone → tap Start Recording
- **Post-hoc narration** — record silent screen capture, narrate over it in iMovie afterwards (cleaner audio)

Framing:
- Landscape orientation feels wider for screen-share viewers
- Hold the phone steady; consider a tripod / book stack
- For a sample image flow, AirDrop a real cocoa pod photo to the phone first so the gallery picker has it ready

## After recording

- Trim to 60–90 s in the Photos app or iMovie
- Export at 1080p
- Drop it in `docs/media/demo.mp4` (gitignored — too large for git)
- Reference the file in `PokouAI_Submission_WriteUp.md` and the YouTube/loom link if you upload publicly

## Things that will go wrong

| Symptom | Fix |
|---|---|
| "Hub unreachable" banner | `curl http://<ip>:11434/api/tags` from Mac. If fails → restart Ollama with `OLLAMA_HOST=0.0.0.0:11434`. |
| Phone hangs on "Analyzing" >60 s | Cold-start. Wait, or pre-warm with a dry-run query before recording. |
| Result page shows a French disease name with English labels | Pre-fix DB row. Settings → Dev → 🗑 Clear all diagnoses, then re-record. New diagnoses parse language-cleanly. |
| Result body is English but disease title is French (or vice versa) | Same as above — stored DB rows from before the May 2026 parser fix. Clear + re-record. |
| Result content is in the wrong language entirely | Settings → Language → switch to the right one. Restart the diagnose — i18n.changeLanguage also drops the cached LLM context. |
| Mac IP keeps changing | Set a static DHCP reservation in your router for the Mac's MAC address. Not strictly needed for one demo session. |
| Ollama responses look generic, not cocoa-tuned | Hub model is base `gemma4:e2b`, not your fine-tune. The v2 fine-tune isn't loaded into Ollama yet — that's expected pre-retrain. Mention this honestly in the voiceover. |
