---
name: business-automations-repo
description: Guide for working inside the Business Automations repository. Use when adding, extending, debugging, or deploying automation-style workflows in this repo, especially n8n replacements, parsers, sync jobs, scheduled jobs, notification flows, and shared integration code. Use to decide where new workflow code, shared helpers, docs, scripts, and env vars belong, and when a new request should be split into a separate app instead of added here.
---

# Business Automations Repo

Use this repo for background automations that would otherwise live in n8n or a similar workflow tool.

## Repo Rules

- Put each automation in its own folder under `workflows/`.
- Put reusable integration code in `workflows/_shared/`.
- Keep env vars in the project root `.env`, not inside individual workflow folders.
- Add setup, spec, and deployment notes in `docs/`.
- Put helper and deployment scripts in `scripts/`.
- Put deployment templates such as `systemd` units in `deploy/`.

## Workflow Shape

Prefer this structure for a new workflow:

1. Create `workflows/<workflow-name>/`.
2. Add a local `README.md` that explains the workflow's purpose and commands.
3. Add `src/index.js` as the entrypoint.
4. Keep workflow-specific logic inside that workflow folder.
5. Move only genuinely reusable helpers into `workflows/_shared/`.

Do not move code into `_shared` too early. Duplicate once if needed, then extract shared code when the reuse is real.

## Config Rules

- Treat the root `.env` as the shared config file for the whole repo.
- Add new env vars for new workflows to the root `.env.example`.
- Reuse shared credentials when appropriate, such as one Google service account or one OpenAI API key.
- Add workflow-specific variable names when a new workflow needs separate folders, sheet IDs, or tokens.

Example pattern:

- shared credentials: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `OPENAI_API_KEY`
- workflow-specific config: `GOOGLE_DRIVE_RECEIPTS_FOLDER_ID`, `GOOGLE_DRIVE_INVOICES_FOLDER_ID`

## What Belongs Here

- file parsers
- Drive, Sheets, Telegram, email, or API automations
- scheduled jobs
- sync jobs
- approval flows
- automation-style backend tasks with little or no UI

## What Usually Does Not Belong Here

Usually split the work into a separate app or repo when the request is mainly:

- a frontend product
- a full backend API with many routes and domain models
- a user-facing web app with auth and screens
- a system where automations are only one small piece of a much larger application

Rule of thumb: if it mainly does work in the background, it likely belongs here. If people mainly use it as an app, it likely needs its own home.

## Deployment Notes

- The production `.env` lives at the project root on the server, for example `/opt/business-automations/.env`.
- The current Ubuntu deployment flow is documented in `docs/UBUNTU_DEPLOY.md`.
- The preferred update command on the server is `sudo bash /opt/business-automations/scripts/deploy-update.sh`.

## Working Style

- Preserve the existing simple structure unless there is a clear reason to add complexity.
- Keep new workflows small, explicit, and easy to run locally.
- Favor shared helpers over hidden workflow-builder logic.
- Update docs when workflow structure, env vars, or deployment steps change.
