# Architecture Overview

## Runtime Components
- `Express API`: receives Twilio webhooks and simulation requests.
- `Assistant Engine`: classifies topic, urgency, mood, and returns contextual response.
- `Knowledge Base`: local JSON snapshot of inventory, hours, and promotions.
- `Lead Store`: lead records and follow-up queue persisted in JSON.
- `Appointment Store`: test-drive appointments persisted in JSON or mirrored to Google Calendar.
- `Dispatch Scheduler`: weekday cron job for next-morning digest and opt-in follow-up texts.

## Call Flow
1. Incoming call hits `POST /webhooks/twilio/voice`.
2. TwiML `<Gather>` captures caller speech.
3. `POST /webhooks/twilio/voice/collect` processes transcription.
4. Assistant generates response and lead record.
5. If caller opts in, follow-up is queued.
6. For test-drive intents, appointment is scheduled and linked to lead lifecycle.
7. On weekday schedule, digest/follow-up dispatch runs.

## Feature Mapping
- Smart Call Flow: Twilio webhook + simulation endpoint.
- Natural Conversation: OpenAI-powered or mock contextual responses.
- Lead Capture: persisted `leads.json` with urgency/topic tags.
- Offline Mode: morning dispatch to staff SMS.
- AI Follow-up: queued personalized SMS per lead.
- Knowledge Base: manual/API/scraped snapshot updates.
- Voice Personality Selector: query/body persona.
- Vehicle Matchmaker: preference parser + inventory matching.
- Mood Detector: keyword-based sentiment class.
- Schedule Test Drive: appointment scheduling via mock or Google Calendar provider.

## Day 1-2 Constraints
- Storage uses JSON files for speed.
- Google Calendar connector currently expects an access token from environment.
- CRM connector remains deferred to Day 3+.
- Voice synthesis and transcription currently Twilio-driven.
