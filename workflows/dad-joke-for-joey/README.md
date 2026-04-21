# Dad Joke for Joey Workflow

This workflow replaces the n8n `Dad Joke for Joey` automation in code.

## Runtime

- Node.js 20+
- environment variables loaded from the project root `.env`
- Gmail SMTP access using a personal Gmail app password

## Commands

```bash
npm run dad-joke-for-joey
npm run dad-joke-for-joey:once
```

## Current behavior

- checks whether the configured send hour has been reached in the configured timezone
- avoids sending more than once per local calendar day
- fetches a joke from `https://icanhazdadjoke.com`
- sends the joke by Gmail
- stores send history in `.data/dad-joke-for-joey-state.json`
