# Business Automations

This project is the home for custom automations that replace existing n8n workflows.

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
- `workflows/dad-joke-for-joey`: scheduled dad joke email sender using the Gmail API

## Deployment

- local `.env`: project root, `./.env`
- Ubuntu `.env`: project root on the server, for example `/opt/business-automations/.env`
- the Ubuntu `systemd` service loads `/opt/business-automations/.env` via `EnvironmentFile`
- default deployment posture: keep the repo private and use a read-only SSH deploy key for GitHub access
- preferred production update command: `sudo bash /opt/business-automations/scripts/deploy-update.sh`
- current service templates: `deploy/receipt-parser.service` and `deploy/dad-joke-for-joey.service`
- Ubuntu deployment guide: `docs/UBUNTU_DEPLOY.md`
