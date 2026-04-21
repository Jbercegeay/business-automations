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

export class DadJokeStateStore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.dataDir = path.join(projectRoot, ".data");
    this.filePath = path.join(this.dataDir, "dad-joke-for-joey-state.json");
    this.state = {
      lastSentDate: "",
      history: [],
      ...readJson(this.filePath, {}),
    };
    mkdirSync(this.dataDir, { recursive: true });
    this.save();
  }

  save() {
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getLastSentDate() {
    return this.state.lastSentDate || "";
  }

  setLastSentDate(dateKey, payload = {}) {
    this.state.lastSentDate = dateKey;
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
