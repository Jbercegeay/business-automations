# LinkedIn AI First Generator

This workflow rebuilds the original n8n content pipeline in code.

It fetches the newest video from a configured YouTube channel, pulls the transcript, generates a LinkedIn post and executive HTML brief from the same transcript, creates a companion image, uploads that image to Google Drive, appends a review row to Google Sheets, and optionally sends a Gmail notification with the draft brief.

## Runtime

- Node.js 20+
- environment variables loaded from the project root `.env`
- Google OAuth desktop client JSON in `.secrets/google_oauth_client.json`
- saved Google OAuth token in `.data/linkedin-ai-first-generator-google-token.json`
- OpenAI API access
- YouTube Data API access
- youtube-transcript.io API access

## Commands

```bash
npm run linkedin-ai-first-generator
npm run linkedin-ai-first-generator:once
node workflows/linkedin-ai-first-generator/src/index.js --once --force
```

## Required Environment Variables

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `YOUTUBE_API_KEY`
- `LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID`
- `LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID`
- `GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID`
- `LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE` optional, defaults to `America/Chicago`
- `LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24` optional, defaults to `9`
- `LINKEDIN_AI_FIRST_GENERATOR_NOTIFY_EMAIL` optional

## Review Sheet Columns

The configured sheet should have these columns in order:

1. `Video ID`
2. `Title`
3. `LinkedIn Post`
4. `Email HTML`
5. `Image URL`
6. `Status`
7. `Processed At`

## Source Layout

- `src/index.js`: workflow entrypoint
- `src/lib/runner.js`: polling loop, once-a-day schedule gate, and latest-video dedupe
- `src/lib/process-video.js`: main orchestration for one video
- `src/lib/services.js`: config, clients, and prompt loading
- `src/lib/state-store.js`: persistent processed-video state
- `src/lib/prompts/`: editable prompt templates
