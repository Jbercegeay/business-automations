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

function normalizeEnvValue(value) {
  if (!value) {
    return "";
  }

  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replace(/\\n/g, "\n");
}

export function loadReceiptParserConfig(env = process.env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  return {
    missing,
    pollIntervalMs: Number(env.RECEIPT_PARSER_POLL_INTERVAL_MS || 60000),
    google: {
      serviceAccountEmail: normalizeEnvValue(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
      ),
      privateKey: normalizeEnvValue(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""),
      impersonatedUserEmail: normalizeEnvValue(
        env.GOOGLE_IMPERSONATED_USER_EMAIL || "",
      ),
    },
    drive: {
      receiptsFolderId: normalizeEnvValue(
        env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID || "",
      ),
      completedFolderId: normalizeEnvValue(
        env.GOOGLE_DRIVE_COMPLETED_FOLDER_ID || "",
      ),
    },
    sheets: {
      spreadsheetId: normalizeEnvValue(
        env.GOOGLE_SHEETS_RECEIPTS_SPREADSHEET_ID || "",
      ),
      sheetName:
        normalizeEnvValue(env.GOOGLE_SHEETS_RECEIPTS_SHEET_NAME || "") || "Sheet1",
    },
    mistral: {
      apiKey: normalizeEnvValue(env.MISTRAL_API_KEY || ""),
    },
    openai: {
      apiKey: normalizeEnvValue(env.OPENAI_API_KEY || ""),
      model: normalizeEnvValue(env.OPENAI_MODEL || "") || "gpt-4o-mini",
    },
    telegram: {
      botToken: normalizeEnvValue(env.TELEGRAM_BOT_TOKEN || ""),
      chatId: normalizeEnvValue(env.TELEGRAM_CHAT_ID || ""),
    },
  };
}
