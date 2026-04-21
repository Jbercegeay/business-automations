# Dad Joke for Joey Setup

## 1. Add env vars

Add these to the project root `.env`:

- `DAD_JOKE_RECIPIENT_EMAIL`
- `DAD_JOKE_SMTP_USER`
- `DAD_JOKE_SMTP_APP_PASSWORD`
- `DAD_JOKE_FROM_EMAIL` optional, defaults to the SMTP username
- `DAD_JOKE_SUBJECT` optional, defaults to `Daily Dad Joke`
- `DAD_JOKE_TIMEZONE` optional, defaults to `America/Chicago`
- `DAD_JOKE_SEND_HOUR_24` optional, defaults to `8`
- `DAD_JOKE_POLL_INTERVAL_MS` optional, defaults to `60000`
- `DAD_JOKE_SMTP_HOST` optional, defaults to `smtp.gmail.com`
- `DAD_JOKE_SMTP_PORT` optional, defaults to `465`
- `DAD_JOKE_SMTP_SECURE` optional, defaults to `true`

Example:

```dotenv
DAD_JOKE_RECIPIENT_EMAIL=joey.cox@integer.net
DAD_JOKE_SMTP_USER=jbercegeay74@gmail.com
DAD_JOKE_SMTP_APP_PASSWORD=your_16_character_app_password
DAD_JOKE_FROM_EMAIL=jbercegeay74@gmail.com
DAD_JOKE_SUBJECT=Daily Dad Joke
DAD_JOKE_TIMEZONE=America/Chicago
DAD_JOKE_SEND_HOUR_24=8
DAD_JOKE_POLL_INTERVAL_MS=60000
DAD_JOKE_SMTP_HOST=smtp.gmail.com
DAD_JOKE_SMTP_PORT=465
DAD_JOKE_SMTP_SECURE=true
```

## 2. Gmail access

This workflow sends mail through Gmail SMTP using a personal Gmail account.

Requirements:

- turn on 2-Step Verification for the Gmail account
- create a Gmail app password for this workflow
- use the Gmail address as `DAD_JOKE_SMTP_USER`
- use the 16-character app password as `DAD_JOKE_SMTP_APP_PASSWORD`

Recommended sender setup:

- `DAD_JOKE_SMTP_USER=jbercegeay74@gmail.com`
- `DAD_JOKE_FROM_EMAIL=jbercegeay74@gmail.com`

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

## 5. Ubuntu service

The Ubuntu deployment template for this workflow is:

`/opt/business-automations/deploy/dad-joke-for-joey.service`

Install it with:

```bash
sudo cp /opt/business-automations/deploy/dad-joke-for-joey.service /etc/systemd/system/dad-joke-for-joey.service
sudo systemctl daemon-reload
sudo systemctl enable --now dad-joke-for-joey
```

Check it with:

```bash
sudo systemctl status dad-joke-for-joey
sudo journalctl -u dad-joke-for-joey -f
```
