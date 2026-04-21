import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

export class LinkedinAiFirstGeneratorStateStore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.dataDir = path.join(projectRoot, ".data");
    this.filePath = path.join(this.dataDir, "linkedin-ai-first-generator-state.json");
    this.state = {
      lastRunDate: "",
      history: [],
      videos: {},
      ...readJson(this.filePath, {}),
    };
    mkdirSync(this.dataDir, { recursive: true });
    this.save();
  }

  save() {
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  hasCompletedVideo(videoId) {
    return this.state.videos[videoId]?.status === "completed";
  }

  markVideo(videoId, payload) {
    this.state.videos[videoId] = {
      ...this.state.videos[videoId],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }

  getLastRunDate() {
    return this.state.lastRunDate || "";
  }

  markDailyRun(dateKey, payload = {}) {
    this.state.lastRunDate = dateKey;
    this.state.history = [
      {
        dateKey,
        updatedAt: new Date().toISOString(),
        ...payload,
      },
      ...(this.state.history || []),
    ].slice(0, 30);
    this.save();
  }
}
