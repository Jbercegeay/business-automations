import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "../../../_shared/src/env.js";
import { fetchJson } from "../../../_shared/src/http.js";
import { createLogger } from "../../../_shared/src/logger.js";
import { SmtpClient } from "../../../_shared/src/smtp.js";
import { loadDadJokeConfig } from "./config.js";
import { DadJokeStateStore } from "./state-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");

export function createDadJokeContext() {
  loadEnvFile(projectRoot);

  const config = loadDadJokeConfig();
  const logger = createLogger("dad-joke-for-joey");
  const stateStore = new DadJokeStateStore(projectRoot);

  const services = {
    email: new SmtpClient(config.smtp),
    http: {
      getJson(url, options = {}) {
        return fetchJson(url, options);
      },
    },
  };

  return {
    projectRoot,
    config,
    logger,
    services,
    stateStore,
  };
}
