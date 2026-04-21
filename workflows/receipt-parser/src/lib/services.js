import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "../../../_shared/src/env.js";
import { GoogleAuthClient } from "../../../_shared/src/google-auth.js";
import { GoogleDriveClient } from "../../../_shared/src/google-drive.js";
import { GoogleSheetsClient } from "../../../_shared/src/google-sheets.js";
import { createLogger } from "../../../_shared/src/logger.js";
import { MistralClient } from "../../../_shared/src/mistral.js";
import { OpenAiReceiptParserClient } from "../../../_shared/src/openai.js";
import { TelegramApprovalClient } from "../../../_shared/src/telegram.js";
import { loadReceiptParserConfig } from "./config.js";
import { ReceiptStateStore } from "./state-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");

export function createReceiptParserContext() {
  loadEnvFile(projectRoot);

  const config = loadReceiptParserConfig();
  const logger = createLogger("receipt-parser");
  const stateStore = new ReceiptStateStore(projectRoot);

  const googleAuth = new GoogleAuthClient(config.google);

  const services = {
    drive: new GoogleDriveClient(googleAuth),
    sheets: new GoogleSheetsClient(googleAuth),
    mistral: new MistralClient(config.mistral.apiKey),
    openai: new OpenAiReceiptParserClient(config.openai),
    telegram: new TelegramApprovalClient(config.telegram),
  };

  return {
    projectRoot,
    config,
    logger,
    services,
    stateStore,
  };
}
