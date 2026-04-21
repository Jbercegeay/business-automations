# Dad Joke for Joey Setup

## 1. Add env vars

Add these to the project root `.env`:

- `DAD_JOKE_RECIPIENT_EMAIL`
- `DAD_JOKE_FROM_EMAIL` optional
- `DAD_JOKE_SUBJECT` optional, defaults to `Daily Dad Joke`
- `DAD_JOKE_TIMEZONE` optional, defaults to `America/Chicago`
- `DAD_JOKE_SEND_HOUR_24` optional, defaults to `8`
- `DAD_JOKE_POLL_INTERVAL_MS` optional, defaults to `60000`

## 2. Gmail access

This workflow sends mail through the Gmail API using the shared Google service account flow.

Requirements:

- the service account must be allowed to use Gmail send scope
- if your Google Workspace setup uses domain-wide delegation, `GOOGLE_IMPERSONATED_USER_EMAIL` should be the mailbox that sends the joke

The code requests:

- `https://www.googleapis.com/auth/gmail.send`

## 3. Run locally

Single pass:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run dad-joke-for-joey:once
```

Continuous polling:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run dad-joke-for-joey
```

## 4. Local state

The workflow stores send history in:

`/Users/johnnyb/Documents/business-automations/.data/dad-joke-for-joey-state.json`
