# LinkedIn AI First Generator Setup

## 1. Add env vars

Add these to the project root `.env`:

- `YOUTUBE_API_KEY`
- `LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID`
- `LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY`
- `GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID`
- `GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID`
- `GOOGLE_SHEETS_LINKEDIN_SHEET_NAME` optional, defaults to `Sheet1`
- `LINKEDIN_AI_FIRST_GENERATOR_NOTIFY_EMAIL` optional
- `LINKEDIN_AI_FIRST_GENERATOR_EMAIL_SUBJECT` optional, defaults to `AI Executive Brief`
- `LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE` optional, defaults to `America/Chicago`
- `LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24` optional, defaults to `9`
- `LINKEDIN_AI_FIRST_GENERATOR_POLL_INTERVAL_MS` optional, defaults to `60000`
- `OPENAI_API_KEY`

Example:

```dotenv
YOUTUBE_API_KEY=your_youtube_api_key
LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID=UCujMOyMfjf4hvYn7aRe1JEQ
LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY=your_youtube_transcript_io_key
GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID=your_drive_folder_id
GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID=your_sheet_id
GOOGLE_SHEETS_LINKEDIN_SHEET_NAME=Sheet1
LINKEDIN_AI_FIRST_GENERATOR_NOTIFY_EMAIL=jbercegeay74@gmail.com
LINKEDIN_AI_FIRST_GENERATOR_EMAIL_SUBJECT=AI Executive Brief
LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE=America/Chicago
LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24=9
LINKEDIN_AI_FIRST_GENERATOR_POLL_INTERVAL_MS=60000
OPENAI_API_KEY=your_openai_api_key
```

## 2. Google OAuth files

This workflow uses personal Google OAuth, not a service account, for Drive, Sheets, and Gmail.

Required local files:

- OAuth client JSON:
  `/Users/johnnyb/Documents/business-automations/.secrets/google_oauth_client.json`
- Saved OAuth token:
  `/Users/johnnyb/Documents/business-automations/.data/linkedin-ai-first-generator-google-token.json`

The first local run opens a browser so you can approve Google access. After approval, the token file is saved and reused.

## 3. Run locally

Single pass:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run linkedin-ai-first-generator:once
```

Continuous scheduler mode:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run linkedin-ai-first-generator
```

Force re-run the latest video:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run linkedin-ai-first-generator:once -- --force
```

## 4. Daily scheduling behavior

The long-running service polls every minute by default, but it only attempts one scheduled run per day after the configured hour.

Example:

- `LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE=America/Chicago`
- `LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24=9`

That means the workflow will make its one daily attempt sometime after 9:00 AM Central.

## 5. Local state

The workflow stores runtime state in:

- `/Users/johnnyb/Documents/business-automations/.data/linkedin-ai-first-generator-state.json`
- `/Users/johnnyb/Documents/business-automations/.data/linkedin-ai-first-generator-google-token.json`

## 6. Ubuntu server notes

The server needs three things in addition to the repo:

1. `/opt/business-automations/.env`
2. `/opt/business-automations/.secrets/google_oauth_client.json`
3. `/opt/business-automations/.data/linkedin-ai-first-generator-google-token.json`

The easiest production setup is:

1. complete Google OAuth locally first
2. copy the OAuth client JSON to the server
3. copy the saved OAuth token file to the server
4. protect both files with restricted permissions

Example copy approach:

```bash
scp /Users/johnnyb/Documents/business-automations/.secrets/google_oauth_client.json your-server:/tmp/
scp /Users/johnnyb/Documents/business-automations/.data/linkedin-ai-first-generator-google-token.json your-server:/tmp/
```

Then on Ubuntu:

```bash
sudo mkdir -p /opt/business-automations/.secrets /opt/business-automations/.data
sudo mv /tmp/google_oauth_client.json /opt/business-automations/.secrets/google_oauth_client.json
sudo mv /tmp/linkedin-ai-first-generator-google-token.json /opt/business-automations/.data/linkedin-ai-first-generator-google-token.json
sudo chown -R automation:automation /opt/business-automations/.secrets /opt/business-automations/.data
sudo chmod 700 /opt/business-automations/.secrets
sudo chmod 600 /opt/business-automations/.secrets/google_oauth_client.json
sudo chmod 600 /opt/business-automations/.data/linkedin-ai-first-generator-google-token.json
```

## 7. Ubuntu service

The Ubuntu deployment template for this workflow is:

`/opt/business-automations/deploy/linkedin-ai-first-generator.service`

Install it with:

```bash
sudo cp /opt/business-automations/deploy/linkedin-ai-first-generator.service /etc/systemd/system/linkedin-ai-first-generator.service
sudo systemctl daemon-reload
sudo systemctl enable --now linkedin-ai-first-generator
```

Check it with:

```bash
sudo systemctl status linkedin-ai-first-generator
sudo journalctl -u linkedin-ai-first-generator -f
```
