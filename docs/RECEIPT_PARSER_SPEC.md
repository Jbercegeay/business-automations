# Receipt Parser Spec

## Current parity target

Match the existing n8n workflow behavior first:

1. Google Drive trigger on new file creation in the receipts folder
2. Download the file
3. Upload the file to Mistral
4. Fetch a signed file URL
5. Run OCR using `mistral-ocr-latest`
6. Parse page one markdown into:
   - date
   - vendor
   - vendor address
   - item name
   - price
   - subtotal
   - tax
   - total cost
   - Category
7. Append rows to the receipts spreadsheet
8. Ask for Telegram approval when category is outside the approved list
9. Move file to completed folder
10. Rename file to `vendor + date`

## Known improvements after parity

- handle multi-page receipts
- fix category list mismatch with `Instructions`
- avoid appending unapproved categories too early
- add retries, logging, and duplicate protection

## Local runtime notes

- Authentication is currently designed around a Google service account.
- Telegram approvals use inline keyboard callbacks plus `getUpdates` polling.
- Local processing state is stored in `.data/receipt-parser-state.json`.
