import { existsSync } from "node:fs";
import path from "node:path";

const BASE_REQUIRED_KEYS = [
  "YOUTUBE_API_KEY",
  "LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID",
  "LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID",
  "GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID",
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

export function loadLinkedinAiFirstGeneratorConfig(env = process.env, projectRoot = process.cwd()) {
  const oauthCredentialsPath = path.join(
    projectRoot,
    ".secrets",
    "google_oauth_client.json",
  );
  const useOAuth = existsSync(oauthCredentialsPath);
  const requiredKeys = useOAuth
    ? BASE_REQUIRED_KEYS
    : [
        "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
        ...BASE_REQUIRED_KEYS,
      ];
  const missing = requiredKeys.filter((key) => !env[key]);

  return {
    missing,
    authMode: useOAuth ? "oauth" : "service_account",
    pollIntervalMs: Number(env.LINKEDIN_AI_FIRST_GENERATOR_POLL_INTERVAL_MS || 60000),
    schedule: {
      timezone:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_TIMEZONE || "") ||
        "America/Chicago",
      sendHour24: Number(env.LINKEDIN_AI_FIRST_GENERATOR_SEND_HOUR_24 || 9),
    },
    youtube: {
      apiKey: normalizeEnvValue(env.YOUTUBE_API_KEY || ""),
      channelId: normalizeEnvValue(
        env.LINKEDIN_AI_FIRST_GENERATOR_YOUTUBE_CHANNEL_ID || "",
      ),
    },
    transcript: {
      apiKey: normalizeEnvValue(
        env.LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY || "",
      ),
    },
    google: {
      oauthCredentialsPath,
      oauthTokenPath: path.join(
        projectRoot,
        ".data",
        "linkedin-ai-first-generator-google-token.json",
      ),
      serviceAccountEmail: normalizeEnvValue(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
      ),
      privateKey: normalizeEnvValue(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""),
      impersonatedUserEmail: normalizeEnvValue(
        env.GOOGLE_IMPERSONATED_USER_EMAIL || "",
      ),
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/gmail.send",
      ],
    },
    drive: {
      imagesFolderId: normalizeEnvValue(
        env.GOOGLE_DRIVE_LINKEDIN_IMAGES_FOLDER_ID || "",
      ),
    },
    sheets: {
      spreadsheetId: normalizeEnvValue(
        env.GOOGLE_SHEETS_LINKEDIN_SPREADSHEET_ID || "",
      ),
      sheetName:
        normalizeEnvValue(env.GOOGLE_SHEETS_LINKEDIN_SHEET_NAME || "") || "Sheet1",
    },
    openai: {
      apiKey: normalizeEnvValue(env.OPENAI_API_KEY || ""),
      model:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_OPENAI_MODEL || "") ||
        "gpt-4.1-mini",
      imageModel:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_IMAGE_MODEL || "") ||
        "gpt-image-1",
      imageSize:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_IMAGE_SIZE || "") ||
        "1536x1024",
      imageQuality:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_IMAGE_QUALITY || "") ||
        "medium",
    },
    notification: {
      recipientEmail: normalizeEnvValue(
        env.LINKEDIN_AI_FIRST_GENERATOR_NOTIFY_EMAIL || "",
      ),
      subject:
        normalizeEnvValue(env.LINKEDIN_AI_FIRST_GENERATOR_EMAIL_SUBJECT || "") ||
        "AI Executive Brief",
      fromEmail: normalizeEnvValue(env.GOOGLE_IMPERSONATED_USER_EMAIL || ""),
    },
  };
}
