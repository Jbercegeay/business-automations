const REQUIRED_KEYS = [
  "DAD_JOKE_RECIPIENT_EMAIL",
  "DAD_JOKE_SMTP_USER",
  "DAD_JOKE_SMTP_APP_PASSWORD",
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
    gmail: {
      recipientEmail: normalizeEnvValue(env.DAD_JOKE_RECIPIENT_EMAIL || ""),
      subject: normalizeEnvValue(env.DAD_JOKE_SUBJECT || "") || "Daily Dad Joke",
      fromEmail:
        normalizeEnvValue(env.DAD_JOKE_FROM_EMAIL || "") ||
        normalizeEnvValue(env.DAD_JOKE_SMTP_USER || ""),
    },
    smtp: {
      host: normalizeEnvValue(env.DAD_JOKE_SMTP_HOST || "") || "smtp.gmail.com",
      port: Number(env.DAD_JOKE_SMTP_PORT || 465),
      secure: normalizeEnvValue(env.DAD_JOKE_SMTP_SECURE || "") !== "false",
      username: normalizeEnvValue(env.DAD_JOKE_SMTP_USER || ""),
      password: normalizeEnvValue(env.DAD_JOKE_SMTP_APP_PASSWORD || ""),
    },
  };
}
