const REQUIRED_KEYS = [
  "YOUTUBE_API_KEY",
  "LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY",
  "OPENROUTER_API_KEY",
  "GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SPREADSHEET_ID",
];

const BENCHMARK_MODELS = [
  {
    id: "openai/gpt-oss-120b:free",
    label: "GPT-OSS 120B Free",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B Free",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    label: "Qwen3 Next 80B Free",
  },
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

export function loadLinkedinModelBenchmarkConfig(env = process.env) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  return {
    missing,
    youtube: {
      apiKey: normalizeEnvValue(env.YOUTUBE_API_KEY || ""),
    },
    transcript: {
      apiKey: normalizeEnvValue(
        env.LINKEDIN_AI_FIRST_GENERATOR_TRANSCRIPT_API_KEY || "",
      ),
      sourceLabel: "youtube-transcript.io",
    },
    openrouter: {
      apiKey: normalizeEnvValue(env.OPENROUTER_API_KEY || ""),
      baseUrl:
        normalizeEnvValue(env.OPENROUTER_BASE_URL || "") ||
        "https://openrouter.ai/api/v1",
      httpReferer: normalizeEnvValue(env.OPENROUTER_HTTP_REFERER || ""),
      appTitle: normalizeEnvValue(env.OPENROUTER_APP_TITLE || ""),
    },
    sheets: {
      spreadsheetId: normalizeEnvValue(
        env.GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SPREADSHEET_ID || "",
      ),
      sheetName:
        normalizeEnvValue(env.GOOGLE_SHEETS_LINKEDIN_BENCHMARK_SHEET_NAME || "") ||
        "Benchmark",
    },
    promptVersion:
      normalizeEnvValue(env.LINKEDIN_MODEL_BENCHMARK_PROMPT_VERSION || "") ||
      "linkedin-ai-first-generator-v1",
    models: BENCHMARK_MODELS,
  };
}
