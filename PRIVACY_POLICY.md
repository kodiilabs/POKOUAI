# PokouAI Privacy Policy

_Last updated: 2026-04-21_

PokouAI is an offline-first crop disease advisor for smallholder farmers. Privacy is a first-class constraint, not an afterthought.

## What we collect
**Nothing, by default.** The app performs all disease diagnosis locally on the device. Images captured for analysis never leave the phone unless you explicitly choose to sync.

## On-device data
The following is stored **only on your device**:
- Photos you capture for diagnosis
- Diagnosis results (disease name, confidence, recommendations)
- Farm log entries (date, location label, notes — if you add them)
- Your language and crop preferences

This data lives in the app's private storage. Uninstalling the app removes it.

## Optional cloud sync (disabled by default)
If you explicitly enable cloud sync in Settings:
- Anonymized diagnosis metadata (disease class, confidence, timestamp, app version) may be sent to our backend to improve the model.
- **No raw images, no location coordinates, no personal identifiers** are transmitted.
- You can disable sync at any time.

## Location
We do **not** collect GPS coordinates. If you add a location label to a farm log entry, it is a free-text field stored only on your device.

## Model updates
The app may check for updated disease knowledge (`cocoa_diseases.json`) or model versions on startup when online. These checks are anonymous (no user identifier).

## Third parties
- **Google Gemma**: model weights used under Gemma Terms of Use. No user data is shared with Google.
- **Expo / React Native**: the app is built on these open-source frameworks. No analytics SDK is included.

## Children
The app is intended for adult users (farmers, agronomists). It does not knowingly collect data from children.

## Changes
We will update this file in the GitHub repository when the policy changes. The `Last updated` date at the top reflects the current version.

## Contact
File an issue on the GitHub repository for privacy-related questions.
