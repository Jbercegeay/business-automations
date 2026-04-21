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

export class ReceiptStateStore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.dataDir = path.join(projectRoot, ".data");
    this.filePath = path.join(this.dataDir, "receipt-parser-state.json");
    this.state = {
      processedFiles: {},
      pendingApprovals: {},
      telegramOffset: 0,
      ...readJson(this.filePath, {}),
    };
    mkdirSync(this.dataDir, { recursive: true });
    this.save();
  }

  save() {
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  hasProcessedFile(fileId) {
    return Boolean(this.state.processedFiles[fileId]);
  }

  markProcessed(fileId, payload) {
    this.state.processedFiles[fileId] = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }

  markPendingApproval(receiptId, payload) {
    this.state.pendingApprovals[receiptId] = {
      ...payload,
      createdAt: new Date().toISOString(),
    };
    this.save();
  }

  getPendingApproval(receiptId) {
    return this.state.pendingApprovals[receiptId] || null;
  }

  clearPendingApproval(receiptId) {
    delete this.state.pendingApprovals[receiptId];
    this.save();
  }

  getTelegramOffset() {
    return this.state.telegramOffset || 0;
  }

  setTelegramOffset(offset) {
    this.state.telegramOffset = offset;
    this.save();
  }
}
