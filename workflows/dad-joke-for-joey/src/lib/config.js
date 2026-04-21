const REQUIRED_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "DAD_JOKE_RECIPIENT_EMAIL",
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

export function loadDadJokeConfig(env = process.env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  return {
    missing,
    pollIntervalMs: Number(env.DAD_JOKE_POLL_INTERVAL_MS || 60000),
    schedule: {
      timezone: normalizeEnvValue(env.DAD_JOKE_TIMEZONE || "") || "America/Chicago",
      sendHour24: Number(env.DAD_JOKE_SEND_HOUR_24 || 8),
    },
    google: {
      serviceAccountEmail: normalizeEnvValue(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
      ),
      privateKey: normalizeEnvValue(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""),
      impersonatedUserEmail: normalizeEnvValue(
        env.GOOGLE_IMPERSONATED_USER_EMAIL || "",
      ),
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
    },
    gmail: {
      recipientEmail: normalizeEnvValue(env.DAD_JOKE_RECIPIENT_EMAIL || ""),
      subject: normalizeEnvValue(env.DAD_JOKE_SUBJECT || "") || "Daily Dad Joke",
      fromEmail: normalizeEnvValue(env.DAD_JOKE_FROM_EMAIL || ""),
    },
  };
}
