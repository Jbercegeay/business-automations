# AGENT.md

This file gives future agents working rules for `/Users/johnnyb/Documents/business-automations`.

Use it together with [memory.md](/Users/johnnyb/Documents/business-automations/memory.md).

## First Read Order

When starting work in this repo, use this order:

1. read `AGENT.md`
2. read `memory.md`
3. inspect the specific workflow folder involved
4. inspect any related docs in `docs/`
5. inspect shared helpers in `workflows/_shared/` only if needed

## How To Use `memory.md`

`memory.md` is the repo-local shared memory for ongoing context across sessions.

Read it:

- at the start of any non-trivial task in this repo
- before deployment work
- before server or `.env` changes
- before changing auth setup
- before touching workflow scheduling
- before walking the user through SSH/server steps

Update it:

- after major workflow additions
- after auth model changes
- after server/deployment changes
- after discovering important repo conventions
- after changing service names, file paths, or operational commands
- after a successful setup that future agents should reuse

Do not use `memory.md` as a dumping ground for every small edit. Keep it high-signal and operational.

## What Belongs In `memory.md`

Good things to store:

- repo structure conventions
- workflow names and purposes
- server SSH details if the user explicitly wants them kept there
- deployment paths
- service names
- important file locations
- non-secret env variable names and meanings
- auth model decisions
- recurring maintenance commands
- known operational gotchas

Avoid storing:

- fresh API secrets unless the user explicitly asks for that
- noisy one-off debugging logs
- redundant file-by-file change lists
- temporary experiments

## Repo Rules

- Keep each automation in its own folder under `workflows/`
- Put reusable helpers in `workflows/_shared/` only when reuse is real
- Put setup and process notes in `docs/`
- Put `systemd` service templates in `deploy/`
- Put helper scripts in `scripts/`
- Keep env vars in the root `.env`
- Update `.env.example` whenever a workflow gains new required or useful env vars

## Important Paths

- Repo root:
  - `/Users/johnnyb/Documents/business-automations`
- Local env:
  - `/Users/johnnyb/Documents/business-automations/.env`
- Local shared memory:
  - `/Users/johnnyb/Documents/business-automations/memory.md`
- Local secrets:
  - `/Users/johnnyb/Documents/business-automations/.secrets/`
- Local runtime state:
  - `/Users/johnnyb/Documents/business-automations/.data/`
- Server repo:
  - `/opt/business-automations`
- Server env:
  - `/opt/business-automations/.env`
- Server secrets:
  - `/opt/business-automations/.secrets/`
- Server runtime state:
  - `/opt/business-automations/.data/`

## Env File Guidance

When adding or changing a workflow:

1. update `.env.example`
2. update local `.env` if needed
3. tell the user exactly what must be added to the server `.env`
4. restart or redeploy the affected service

When walking the user through env changes:

- give exact key names
- prefer complete copy-paste blocks
- avoid placeholders when real values are already known and safe to share in context

## Secrets Guidance

- Never commit `.env`, `.secrets/`, or runtime token files
- Keep `.secrets/` and `.data/` out of Git unless the user explicitly asks otherwise
- If secrets were exposed in conversation, remind the user to rotate them after deployment is stable
- Prefer storing only non-secret operational context in `memory.md`

## Deployment Rules

The standard server update path for this repo is:

```bash
sudo bash /opt/business-automations/scripts/deploy-update.sh
```

Before telling the user to run it:

1. confirm local changes are committed
2. confirm they are pushed to GitHub
3. confirm the server has the right `.env`
4. confirm any required `.secrets/` or `.data/` files are present

If a new workflow has a `systemd` service:

1. add a template under `deploy/`
2. update `docs/UBUNTU_DEPLOY.md`
3. update `scripts/deploy-update.sh` if the service should be restarted during deploys

## Server Guidance

When walking the user through server work:

- use the real SSH command if known
- prefer exact copy-paste commands
- do not use fake placeholders like `your-server`
- remember `/opt/business-automations` may require `sudo` to inspect

If known server details are important for future work, store them in `memory.md`.

## Workflow Design Guidance

- Keep workflow code explicit and readable
- Favor small focused files over hidden workflow-builder abstractions
- Use state files in `.data/` for dedupe and run history where appropriate
- Keep prompt text in local files when prompts are part of the workflow
- Add setup docs for workflows that require outside configuration

## Scheduling Guidance

For long-running scheduled workflows in this repo:

- prefer a simple always-on service with poll interval plus schedule gate logic
- store “already ran today” or similar schedule state in `.data/`
- document timezone and send-hour env vars
- provide a `--force` path for manual reprocessing when useful

## Definition Of Done

A workflow change is not fully done until:

1. code works locally or has been checked as far as possible
2. docs are updated
3. `.env.example` is updated if config changed
4. deploy files are updated if server behavior changed
5. `memory.md` is updated if the change affects future operational context

## Current High-Value Context

Always review `memory.md` for:

- current server access details
- LinkedIn workflow auth model
- service names
- schedule details
- repo-specific operational notes
