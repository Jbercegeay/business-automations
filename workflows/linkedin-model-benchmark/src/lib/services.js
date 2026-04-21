import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "../../../_shared/src/env.js";
import { GoogleOAuthClient } from "../../../_shared/src/google-oauth.js";
import { GoogleSheetsClient } from "../../../_shared/src/google-sheets.js";
import { fetchJson } from "../../../_shared/src/http.js";
import { createLogger } from "../../../_shared/src/logger.js";
import { loadLinkedinModelBenchmarkConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");

function loadPromptFromLinkedinWorkflow() {
  const filePath = path.resolve(
    __dirname,
    "../../../linkedin-ai-first-generator/src/lib/prompts/content-system.txt",
  );
  return readFileSync(filePath, "utf8").trim();
}

function cleanTranscriptPayload(payload) {
  const tracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
  const track = tracks.find((item) => item.language === "en") || tracks[0];
  const transcriptItems = Array.isArray(track?.transcript) ? track.transcript : [];
  const fullTranscript = transcriptItems
    .map((segment) => segment?.text?.trim())
    .filter(Boolean)
    .join(" ");

  if (!fullTranscript) {
    throw new Error("Transcript payload contained no usable text.");
  }

  return fullTranscript;
}

function parseJsonPayload(rawContent) {
  const trimmed = String(rawContent || "").trim();
  if (!trimmed) {
    throw new Error("Model returned empty content.");
  }

  const withoutFences = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  const candidate =
    start !== -1 && end !== -1 && end > start
      ? withoutFences.slice(start, end + 1)
      : withoutFences;

  return JSON.parse(candidate);
}

function validateContentPackage(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Parsed response is not an object.");
  }

  if (typeof parsed.linkedinPost !== "string" || !parsed.linkedinPost.trim()) {
    throw new Error("Parsed response is missing linkedinPost.");
  }

  if (typeof parsed.emailHtml !== "string" || !parsed.emailHtml.trim()) {
    throw new Error("Parsed response is missing emailHtml.");
  }

  return {
    linkedinPost: parsed.linkedinPost.trim(),
    emailHtml: parsed.emailHtml.trim(),
  };
}

function buildVideoUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function createRunGroupId(videoId) {
  return `${videoId}-${Date.now()}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSheetRow({
  runGroupId,
  video,
  transcriptSource,
  model,
  promptVersion,
  output,
  errorMessage = "",
  processedAt,
}) {
  return [
    runGroupId,
    video.id,
    video.title,
    buildVideoUrl(video.id),
    video.publishedAt || "",
    transcriptSource,
    model.id,
    model.label,
    promptVersion,
    output?.linkedinPost || "",
    output?.emailHtml || "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    errorMessage,
    processedAt,
  ];
}

class YouTubeTranscriptClient {
  constructor({ apiKey }) {
    this.apiKey = apiKey;
  }

  async fetchTranscript(videoId) {
    const response = await fetchJson("https://www.youtube-transcript.io/api/transcripts", {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: [videoId],
      }),
    });

    const transcript = Array.isArray(response) ? response[0] : response;
    if (!transcript) {
      throw new Error(`No transcript payload returned for video ${videoId}`);
    }

    return transcript;
  }
}

class OpenRouterBenchmarkClient {
  constructor(config) {
    this.config = config;
    this.contentSystemPrompt = loadPromptFromLinkedinWorkflow();
  }

  async generateContentPackage({ modelId, video, transcript }) {
    const headers = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.config.httpReferer) {
      headers["HTTP-Referer"] = this.config.httpReferer;
    }

    if (this.config.appTitle) {
      headers["X-Title"] = this.config.appTitle;
    }

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetchJson(`${this.config.baseUrl}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: "system",
                content: this.contentSystemPrompt,
              },
              {
                role: "user",
                content: JSON.stringify({
                  video,
                  transcript,
                }),
              },
            ],
          }),
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error(`OpenRouter returned no content for model ${modelId}.`);
        }

        return validateContentPackage(parseJsonPayload(content));
      } catch (error) {
        lastError = error;

        const isRetryable = error.status === 429 || error.status >= 500;
        if (!isRetryable || attempt === 3) {
          break;
        }

        await sleep(2000 * attempt);
      }
    }

    throw lastError;
  }
}

class LinkedinBenchmarkService {
  constructor({ config, logger, transcript, openrouter, sheets }) {
    this.config = config;
    this.logger = logger;
    this.transcript = transcript;
    this.openrouter = openrouter;
    this.sheets = sheets;
  }

  async runVideoBenchmark(video) {
    const transcriptPayload = await this.transcript.fetchTranscript(video.id);
    const transcript = cleanTranscriptPayload(transcriptPayload);
    const runGroupId = createRunGroupId(video.id);
    const processedAt = new Date().toISOString();
    const rows = [];

    for (const model of this.config.models) {
      this.logger.info("Generating benchmark output", {
        videoId: video.id,
        modelId: model.id,
      });

      try {
        const output = await this.openrouter.generateContentPackage({
          modelId: model.id,
          video,
          transcript,
        });

        rows.push(
          toSheetRow({
            runGroupId,
            video,
            transcriptSource: this.config.transcript.sourceLabel,
            model,
            promptVersion: this.config.promptVersion,
            output,
            processedAt,
          }),
        );
      } catch (error) {
        const errorMessage =
          error?.body?.error?.message || error.message || "Unknown benchmark error";

        this.logger.error("Benchmark model failed", {
          videoId: video.id,
          modelId: model.id,
          message: errorMessage,
          body: error.body,
        });

        rows.push(
          toSheetRow({
            runGroupId,
            video,
            transcriptSource: this.config.transcript.sourceLabel,
            model,
            promptVersion: this.config.promptVersion,
            output: null,
            errorMessage: `ERROR: ${errorMessage}`,
            processedAt,
          }),
        );
      }
    }

    await this.sheets.appendValues(
      this.config.sheets.spreadsheetId,
      this.config.sheets.sheetName,
      rows,
    );

    this.logger.info("Benchmark rows appended", {
      videoId: video.id,
      runGroupId,
      rowCount: rows.length,
      spreadsheetId: this.config.sheets.spreadsheetId,
      sheetName: this.config.sheets.sheetName,
    });
  }
}

export function createLinkedinModelBenchmarkContext() {
  loadEnvFile(projectRoot);

  const config = loadLinkedinModelBenchmarkConfig();
  const logger = createLogger("linkedin-model-benchmark");

  const googleAuth = new GoogleOAuthClient({
    credentialsPath: path.join(projectRoot, ".secrets", "google_oauth_client.json"),
    tokenPath: path.join(
      projectRoot,
      ".data",
      "linkedin-ai-first-generator-google-token.json",
    ),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  const transcript = new YouTubeTranscriptClient(config.transcript);
  const openrouter = new OpenRouterBenchmarkClient(config.openrouter);
  const sheets = new GoogleSheetsClient(googleAuth);
  const benchmark = new LinkedinBenchmarkService({
    config,
    logger,
    transcript,
    openrouter,
    sheets,
  });

  return {
    projectRoot,
    config,
    logger,
    services: {
      benchmark,
    },
  };
}
