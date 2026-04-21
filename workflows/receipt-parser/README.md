# Receipt Parser Workflow

This module will replace the current n8n receipt parsing automation in code.

## Runtime

- Node.js 20+
- environment variables loaded from the project root `.env`
- Google service account access to Drive and Sheets

## Commands

```bash
npm run receipt-parser
npm run receipt-parser:once
```

## Planned responsibilities

1. Detect newly added receipts in the Google Drive intake folder.
2. Download receipt files.
3. Send files to Mistral OCR.
4. Parse OCR text into structured receipt data with OpenAI.
5. Write approved rows to Google Sheets.
6. Request Telegram approval for new categories.
7. Move and rename completed files.

## Current implementation status

- polls Google Drive for new files
- uploads to Mistral and runs OCR
- parses the first OCR page with OpenAI
- appends rows to Google Sheets
- sends Telegram inline approvals for new categories
- polls Telegram for approve/reject callbacks
- stores lightweight workflow state in `.data/receipt-parser-state.json`

## Source Layout

- `src/index.js`: workflow entrypoint
- `src/lib/config.js`: environment validation
- `src/lib/workflow.js`: current behavior description
- `src/lib/process-receipt.js`: receipt processing orchestration
