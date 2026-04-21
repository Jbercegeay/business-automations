import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "../../../_shared/src/env.js";
import { GmailClient } from "../../../_shared/src/gmail.js";
import { GoogleAuthClient } from "../../../_shared/src/google-auth.js";
import { GoogleOAuthClient } from "../../../_shared/src/google-oauth.js";
import { GoogleDriveClient } from "../../../_shared/src/google-drive.js";
import { GoogleSheetsClient } from "../../../_shared/src/google-sheets.js";
import { fetchJson } from "../../../_shared/src/http.js";
import { createLogger } from "../../../_shared/src/logger.js";
import { loadLinkedinAiFirstGeneratorConfig } from "./config.js";
import { LinkedinAiFirstGeneratorStateStore } from "./state-store.js";

const CONTENT_SCHEMA = {
  name: "linkedin_content_package",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      emailHtml: { type: "string" },
      linkedinPost: { type: "string" },
    },
    required: ["emailHtml", "linkedinPost"],
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");

function loadPrompt(name) {
  const filePath = path.join(__dirname, "prompts", name);
  return readFileSync(filePath, "utf8").trim();
}

class YouTubeClient {
  constructor({ apiKey, channelId }) {
    this.apiKey = apiKey;
    this.channelId = channelId;
  }

  async getLatestVideo() {
    const params = new URLSearchParams({
      key: this.apiKey,
      channelId: this.channelId,
      part: "snippet",
      type: "video",
      order: "date",
      maxResults: "1",
    });
    const searchResponse = await fetchJson(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    );
    const item = searchResponse.items?.[0];

    if (!item?.id?.videoId) {
      return null;
    }

    const videoId = item.id.videoId;
    const videoParams = new URLSearchParams({
      key: this.apiKey,
      id: videoId,
      part: "snippet,contentDetails,statistics",
    });
    const videoResponse = await fetchJson(
      `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`,
    );
    const video = videoResponse.items?.[0];
    if (!video) {
      return null;
    }

    return {
      id: video.id,
      title: video.snippet?.title || item.snippet?.title || video.id,
      description: video.snippet?.description || "",
      publishedAt: video.snippet?.publishedAt || "",
      channelTitle: video.snippet?.channelTitle || "",
      thumbnails: video.snippet?.thumbnails || {},
      statistics: video.statistics || {},
      duration: video.contentDetails?.duration || "",
    };
  }
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

class OpenAiLinkedinGeneratorClient {
  constructor(config) {
    this.config = config;
    this.contentSystemPrompt = loadPrompt("content-system.txt");
    this.imageSystemPrompt = loadPrompt("image-system.txt");
  }

  async requestOpenAiChat({ model, messages, responseFormat = null }) {
    const body = {
      model,
      messages,
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    return fetchJson("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async generateContentPackage({ video, transcript }) {
    const response = await this.requestOpenAiChat({
      model: this.config.model,
      responseFormat: {
        type: "json_schema",
        json_schema: CONTENT_SCHEMA,
      },
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
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned no structured content package.");
    }

    return JSON.parse(content);
  }

  async generateImagePrompt({ video, linkedinPost }) {
    const response = await this.requestOpenAiChat({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: this.imageSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            title: video.title,
            linkedinPost,
          }),
        },
      ],
    });

    const prompt = response.choices?.[0]?.message?.content?.trim();
    if (!prompt) {
      throw new Error("OpenAI returned no image prompt.");
    }

    return prompt;
  }

  async generateImage({ prompt }) {
    const response = await fetchJson("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.imageModel,
        prompt,
        size: this.config.imageSize,
        quality: this.config.imageQuality,
      }),
    });

    const image = response.data?.[0];
    if (!image?.b64_json) {
      throw new Error("OpenAI image generation returned no image data.");
    }

    return {
      buffer: Buffer.from(image.b64_json, "base64"),
      mimeType: "image/png",
    };
  }
}

class OpenRouterLinkedinTextClient {
  constructor(config) {
    this.config = config;
    this.contentSystemPrompt = loadPrompt("content-system.txt");
    this.imageSystemPrompt = loadPrompt("image-system.txt");
  }

  buildHeaders() {
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

    return headers;
  }

  async requestOpenRouter({ messages }) {
    return fetchJson(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.config.textModel,
        messages,
      }),
    });
  }

  parseContentPackage(content) {
    const trimmed = String(content || "").trim();
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
    const parsed = JSON.parse(candidate);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.linkedinPost !== "string" ||
      typeof parsed.emailHtml !== "string"
    ) {
      throw new Error("OpenRouter returned an invalid LinkedIn content package.");
    }

    return {
      linkedinPost: parsed.linkedinPost.trim(),
      emailHtml: parsed.emailHtml.trim(),
    };
  }

  async generateContentPackage({ video, transcript }) {
    const response = await this.requestOpenRouter({
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
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter returned no structured content package.");
    }

    return this.parseContentPackage(content);
  }

  async generateImagePrompt({ video, linkedinPost }) {
    const response = await this.requestOpenRouter({
      messages: [
        {
          role: "system",
          content: this.imageSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            title: video.title,
            linkedinPost,
          }),
        },
      ],
    });

    const prompt = response.choices?.[0]?.message?.content?.trim();
    if (!prompt) {
      throw new Error("OpenRouter returned no image prompt.");
    }

    return prompt;
  }
}

class LinkedinTextGenerationService {
  constructor({ logger, openrouter, openai }) {
    this.logger = logger;
    this.openrouter = openrouter;
    this.openai = openai;
  }

  async generateContentPackage(input) {
    if (!this.openrouter) {
      return this.openai.generateContentPackage(input);
    }

    try {
      this.logger.info("Generating content package with OpenRouter", {
        model: this.openrouter.config.textModel,
      });
      return await this.openrouter.generateContentPackage(input);
    } catch (error) {
      this.logger.warn("OpenRouter content generation failed, falling back to OpenAI", {
        model: this.openrouter.config.textModel,
        message: error.message,
        body: error.body,
      });
      return this.openai.generateContentPackage(input);
    }
  }

  async generateImagePrompt(input) {
    if (!this.openrouter) {
      return this.openai.generateImagePrompt(input);
    }

    try {
      this.logger.info("Generating image prompt with OpenRouter", {
        model: this.openrouter.config.textModel,
      });
      return await this.openrouter.generateImagePrompt(input);
    } catch (error) {
      this.logger.warn("OpenRouter image prompt generation failed, falling back to OpenAI", {
        model: this.openrouter.config.textModel,
        message: error.message,
        body: error.body,
      });
      return this.openai.generateImagePrompt(input);
    }
  }
}

export function createLinkedinAiFirstGeneratorContext() {
  loadEnvFile(projectRoot);

  const config = loadLinkedinAiFirstGeneratorConfig(process.env, projectRoot);
  const logger = createLogger("linkedin-ai-first-generator");
  const stateStore = new LinkedinAiFirstGeneratorStateStore(projectRoot);

  const googleAuth =
    config.authMode === "oauth"
      ? new GoogleOAuthClient({
          credentialsPath: config.google.oauthCredentialsPath,
          tokenPath: config.google.oauthTokenPath,
          scopes: config.google.scopes,
        })
      : new GoogleAuthClient(config.google);

  const services = {
    youtube: new YouTubeClient(config.youtube),
    transcript: new YouTubeTranscriptClient(config.transcript),
    openai: new OpenAiLinkedinGeneratorClient(config.openai),
    drive: new GoogleDriveClient(googleAuth),
    sheets: new GoogleSheetsClient(googleAuth),
    gmail: new GmailClient(googleAuth),
  };

  const openrouter =
    config.openrouter.apiKey ? new OpenRouterLinkedinTextClient(config.openrouter) : null;
  services.text = new LinkedinTextGenerationService({
    logger,
    openrouter,
    openai: services.openai,
  });

  return {
    projectRoot,
    config,
    logger,
    services,
    stateStore,
  };
}
