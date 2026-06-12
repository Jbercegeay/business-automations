# Business Automations

Custom Node.js automations that replace visual n8n workflows with version-controlled code.

## Goals

- Keep each automation in its own workflow folder
- Share auth, clients, and utility code from one common place
- Track changes in Git instead of inside a visual workflow tool
- Make it easy to run locally now and deploy later

## Structure

- `workflows/`: one folder per automation
- `workflows/_shared/`: shared clients, helpers, schemas, and config
- `docs/`: process notes, setup guides, and workflow specs
- `scripts/`: utility scripts for setup, testing, and maintenance
- `deploy/`: deployment templates such as `systemd` service files

## First Workflow

The first migration target is `workflows/receipt-parser`, which will replace the current receipt-processing n8n workflow.

## Current Workflows

- `workflows/receipt-parser`: Google Drive receipt OCR, parsing, Sheets writeback, and Telegram approval flow
- `workflows/linkedin-ai-first-generator`: once-a-day latest YouTube video to transcript, OpenRouter-first LinkedIn draft + executive HTML brief, Drive image, Sheets review queue, and optional Gmail notification
- `workflows/linkedin-model-benchmark`: fixed-set 3-model OpenRouter benchmark for LinkedIn post and executive email quality
- `workflows/dad-joke-for-joey`: scheduled dad joke email sender using Gmail SMTP

## Tech Stack

- Node.js 20+
- Google APIs
- Nodemailer
- Environment-based configuration
- `systemd` service templates for server deployment

## Local Development

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in local credentials for the workflow you are running.

Run a workflow once:

```bash
npm run receipt-parser:once
npm run linkedin-ai-first-generator:once
npm run linkedin-model-benchmark:once
npm run dad-joke-for-joey:once
```

Check JavaScript syntax across workflow entry points:

```bash
npm run lint
```

## Deployment

- local `.env`: project root, `./.env`
- Ubuntu `.env`: project root on the server, for example `/opt/business-automations/.env`
- the Ubuntu `systemd` service loads `/opt/business-automations/.env` via `EnvironmentFile`
- use server-local environment files and deploy keys for production credentials
- preferred production update command: `sudo bash /opt/business-automations/scripts/deploy-update.sh`
- current service templates: `deploy/receipt-parser.service`, `deploy/dad-joke-for-joey.service`, and `deploy/linkedin-ai-first-generator.service`
- Ubuntu deployment guide: `docs/UBUNTU_DEPLOY.md`

## Notes

Do not commit tokens, OAuth credentials, SMTP passwords, or client data. Production secrets should live only in deployment environment files or provider secret stores.
