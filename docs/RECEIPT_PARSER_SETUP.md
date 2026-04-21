# Receipt Parser Setup

## 1. Create `.env`

Copy `.env.example` to `.env` in the project root and fill in:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_IMPERSONATED_USER_EMAIL` if needed for shared Workspace access
- `GOOGLE_DRIVE_RECEIPTS_FOLDER_ID`
- `GOOGLE_DRIVE_COMPLETED_FOLDER_ID`
- `GOOGLE_SHEETS_RECEIPTS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_RECEIPTS_SHEET_NAME`
- `MISTRAL_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `RECEIPT_PARSER_POLL_INTERVAL_MS`

## 2. Google access

The current implementation uses a Google service account.

Share these with the service account email:

- the Drive intake folder
- the Drive completed folder
- the Google Sheet

If your Google Workspace setup requires domain-wide delegation, set `GOOGLE_IMPERSONATED_USER_EMAIL`.

## 3. Telegram access

Create a Telegram bot with BotFather, then:

- put the bot token in `TELEGRAM_BOT_TOKEN`
- send a message to the bot from the target Telegram account
- use the target chat ID for `TELEGRAM_CHAT_ID`

## 4. Run it

Single pass:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run receipt-parser:once
```

Continuous polling:

```bash
cd /Users/johnnyb/Documents/business-automations
npm run receipt-parser
```

## 5. Local state

The worker stores local state in:

`/Users/johnnyb/Documents/business-automations/.data/receipt-parser-state.json`

That file tracks:

- processed Drive file IDs
- pending Telegram approvals
- the last Telegram update offset

## 6. Current behavior notes

- OCR parsing uses only the first page, matching the original n8n flow
- unknown categories are appended to Sheets before approval, matching the original flow
- approved categories move the file and rename it
- rejected categories stay unfinalized
