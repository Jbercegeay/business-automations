# Business Automations Memory

This file is the shared, repo-local working memory for `/Users/johnnyb/Documents/business-automations`.

Future agents and sessions can update this file as the source of truth for:

- repo conventions
- workflow locations
- deployment habits
- server details
- auth setup
- environment variable expectations
- operational runbooks

## Repo Basics

- Repo path: `/Users/johnnyb/Documents/business-automations`
- Purpose: code-first background automations that replace n8n-style workflows
- Structure:
  - `workflows/`: one folder per workflow
  - `workflows/_shared/`: shared clients/helpers
  - `docs/`: setup and deployment docs
  - `deploy/`: `systemd` service templates
  - `scripts/`: deployment/update helpers
- Root `.env` is the shared config file for all workflows
- Runtime state is stored in `.data/`
- Secret local files may live in `.secrets/`

## Current Workflows

- `receipt-parser`
- `dad-joke-for-joey`
- `linkedin-ai-first-generator`

## Deployment Pattern

- Server repo path: `/opt/business-automations`
- Preferred update command:

```bash
sudo bash /opt/business-automations/scripts/deploy-update.sh
```

- `systemd` services:
  - `receipt-parser`
  - `dad-joke-for-joey`
  - `linkedin-ai-first-generator`

Useful server commands:

```bash
sudo systemctl status linkedin-ai-first-generator
sudo journalctl -u linkedin-ai-first-generator -f
sudo journalctl -u linkedin-ai-first-generator -n 50 --no-pager
sudo systemctl restart linkedin-ai-first-generator
```

## Server Access

- SSH command:

```bash
ssh jbercegeay74@192.168.50.2
```

Use real filled-in commands when walking the user through server work. Do not use placeholders like `your-server`.

## LinkedIn AI First Generator

### What It Does

- watches the configured YouTube channel
- fetches the latest video transcript
- generates:
  - LinkedIn post
  - executive HTML brief
  - companion image
- uploads image to Google Drive
- appends review row to Google Sheets
- optionally sends Gmail notification

### Schedule

- Runs once per day after the configured hour
- Current intended schedule:
  - timezone: `America/Chicago`
  - hour: `9`

Relevant env vars:

```dotenv
LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE=America/Chicago
LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24=9
LINKEDIN_AI_FIRST_GENERATOR_POLL_INTERVAL_MS=60000
```

### Auth Model

This workflow uses personal Google OAuth for Drive, Sheets, and Gmail.

It does not rely on the service account path for the LinkedIn workflow runtime.

Required files:

- Local OAuth client JSON:
  - `/Users/johnnyb/Documents/business-automations/.secrets/google_oauth_client.json`
- Local OAuth token:
  - `/Users/johnnyb/Documents/business-automations/.data/linkedin-ai-first-generator-google-token.json`
- Server OAuth client JSON:
  - `/opt/business-automations/.secrets/google_oauth_client.json`
- Server OAuth token:
  - `/opt/business-automations/.data/linkedin-ai-first-generator-google-token.json`

### Current LinkedIn Workflow Values

Non-secret operational values currently used:

```dotenv
LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID=UCujMOyMfjf4hvYn7aRe1JEQ
GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID=12bF7aHzGv-hFJ_J-SaHZiH4VP2epKEJC
GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID=1BJaTGOU5lb0ddEmhmSGLvbvGl07Ew4DsXKlPuHtYcCA
GOOGLE_SHEETS_LINKEDIN_SHEET_NAME=Sheet1
LINKEDIN_AI_FIRST_GENERATOR_NOTIFY_EMAIL=jbercegeay74@gmail.com
LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE=America/Chicago
LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24=9
```

Do not store fresh secret values here unless the user explicitly wants them kept in this file.

### Service

- Service name: `linkedin-ai-first-generator`
- Service template:
  - `/opt/business-automations/deploy/linkedin-ai-first-generator.service`

Manual force-run on server:

```bash
cd /opt/business-automations
sudo -u automation npm run linkedin-ai-first-generator:once -- --force
```

## Env File Guidance

- Local env:
  - `/Users/johnnyb/Documents/business-automations/.env`
- Server env:
  - `/opt/business-automations/.env`

When adding a new workflow:

1. add workflow-specific vars to `.env.example`
2. add real values to local `.env`
3. add real values to server `.env`
4. restart or redeploy affected services

## Docs Added For LinkedIn Workflow

- `/Users/johnnyb/Documents/business-automations/docs/LINKEDIN_AI_FIRST_GENERATOR_SETUP.md`
- `/Users/johnnyb/Documents/business-automations/docs/UBUNTU_DEPLOY.md`

## Security Note

Several live secrets were exposed during setup in chat. Rotate them after deployment is stable.

At minimum rotate:

- OpenAI API key
- Mistral API key
- Telegram bot token
- YouTube API key
- youtube-transcript.io API key
- Gmail app password if still active

## Editing Guidance For Future Agents

- Preserve the one-workflow-per-folder repo shape
- Reuse shared helpers only when the reuse is real
- Keep deploy instructions concrete and copy-pasteable
- Prefer filled-in commands over placeholder examples when the real server/user values are known
- Update this file when major workflow, auth, server, or deployment details change
