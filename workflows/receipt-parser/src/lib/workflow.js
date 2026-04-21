import { APPROVED_CATEGORIES } from "./categories.js";

export function describeReceiptParserWorkflow(config) {
  const missingText = config.missing.length
    ? `Missing env vars: ${config.missing.join(", ")}`
    : "All required env vars are present.";

  return [
    "1. Watch the Google Drive receipts folder for newly created files.",
    "2. Download the new receipt file.",
    "3. Upload the file to Mistral with purpose=ocr.",
    "4. Request a signed file URL from Mistral.",
    "5. Run Mistral OCR against the signed URL.",
    "6. Parse the first OCR page with OpenAI into structured receipt fields.",
    `7. If category is one of: ${APPROVED_CATEGORIES.join(", ")}, append the row to Google Sheets.`,
    "8. Otherwise send a Telegram approval request for the proposed category.",
    "9. After completion, move the file to the completed folder and rename it.",
    "",
    missingText,
  ].join("\n");
}
