const REQUIRED_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_DRIVE_RECEIPTS_FOLDER_ID",
  "GOOGLE_DRIVE_COMPLETED_FOLDER_ID",
  "GOOGLE_SHEETS_RECEIPTS_SPREADSHEET_ID",
  "GOOGLE_SHEETS_RECEIPTS_SHEET_NAME",
  "MISTRAL_API_KEY",
  "OPENAI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];

export function loadReceiptParserConfig(env = process.env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  return {
    missing,
    pollIntervalMs: Number(env.RECEIPT_PARSER_POLL_INTERVAL_MS || 60000),
    google: {
      serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
      privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "",
      impersonatedUserEmail: env.GOOGLE_IMPERSONATED_USER_EMAIL || "",
    },
    drive: {
      receiptsFolderId: env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID || "",
      completedFolderId: env.GOOGLE_DRIVE_COMPLETED_FOLDER_ID || "",
    },
    sheets: {
      spreadsheetId: env.GOOGLE_SHEETS_RECEIPTS_SPREADSHEET_ID || "",
      sheetName: env.GOOGLE_SHEETS_RECEIPTS_SHEET_NAME || "Sheet1",
    },
    mistral: {
      apiKey: env.MISTRAL_API_KEY || "",
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || "",
      model: env.OPENAI_MODEL || "gpt-4o-mini",
    },
    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN || "",
      chatId: env.TELEGRAM_CHAT_ID || "",
    },
  };
}
