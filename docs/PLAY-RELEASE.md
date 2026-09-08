# Google Play release handoff

## What is built

A Capacitor Android application sharing the shopper and staff React interface with the web app. App ID: `com.northstar.dealership` (temporary brand), version code 1. Minimum Android API 24, target API 36. No camera, location or contact permissions; cleartext traffic and Android backups are disabled. Staff login tokens stay in memory in the native app and expire after eight hours.

The debug APK is for installation testing. The release AAB is unsigned until you supply your own upload key. Neither file represents a Play-approved or published app. Do not upload the debug APK as a production release.

## Owner setup still needed

1. Complete your Google Play developer registration and identity verification. Decide whether this will be a paid staff product or a free shopper app for a specific dealership; pricing is configured in Play Console. The code has no in-app subscriptions or payment processing.
2. Confirm the final app name, unique package ID, dealership/operator identity and public support contact. Change the package ID before the first release if Northstar is not your brand.
3. Publish a reachable production backend. Owner-only Sites access is unsuitable for Android API requests. Never embed owner passwords, API keys or Sites bypass tokens in the app bundle.
4. Replace sample inventory and verify photo rights, availability, prices, privacy disclosures, and retention practices. The in-app privacy notice is a starting disclosure, not a completed legal policy for an unknown operator.
5. Set up your Play upload key and retain a secure backup. The Gradle build accepts `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD` through the environment. These are never committed.
6. Complete the store listing, content rating, Data safety answers, privacy-policy URL and review access instructions. Give reviewers a dedicated test environment/account rather than your production owner password. Follow any account-specific testing requirements shown in Play Console.
7. Test on physical devices and your required closed/internal testing track, including navigation, network loss, sign-in expiry, browser links, rotation, large text, and Android back behavior.

## Data safety inventory for review

The app stores inquiry names, emails, optional phone numbers, messages, consent preferences, requested appointments and staff notes in the deployment database. Phone intake also stores the caller number and transcribed request. Staff sessions and short-lived rate-limit identifiers are processed for security. Shortlisted vehicle IDs are stored locally. An exported lead CSV is temporarily written to the Android app cache and shared only when staff choose an export destination. The app does not collect precise location, payment card data, credit applications, or contact lists. Optional OpenAI processing receives assistant messages and inventory context; optional Twilio processing receives phone audio/transcription metadata. Review provider processing and the final deployment configuration before answering Play Console questions.

Shoppers can delete an inquiry and linked appointments with their private request code. Staff can delete leads. There is no shopper account creation, and this release does not offer password reset, staff invitations, subscription entitlements, or multi-dealership tenant billing.

## References checked during development

- Android target API requirements: https://developer.android.com/google/play/requirements/target-sdk
- Capacitor Android environment: https://capacitorjs.com/docs/getting-started/environment-setup
- Google Play release guide: https://capacitorjs.com/docs/android/deploying-to-google-play
- Twilio signed webhooks: https://www.twilio.com/docs/usage/webhooks/webhooks-security

Confirm the Play Console’s current requirements at submission time.
