import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describeLinkedinModelBenchmarkWorkflow } from "./workflow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const benchmarkVideos = JSON.parse(
  readFileSync(path.join(__dirname, "benchmark-videos.json"), "utf8"),
);

function selectVideos(videos, { limit = null, videoId = "" } = {}) {
  let selected = videos;

  if (videoId) {
    selected = selected.filter((video) => video.id === videoId);
  }

  if (Number.isFinite(limit) && limit > 0) {
    selected = selected.slice(0, limit);
  }

  return selected;
}

export async function runLinkedinModelBenchmark(
  context,
  { limit = null, videoId = "" } = {},
) {
  const { config, logger, services } = context;

  if (config.missing.length > 0) {
    logger.warn("LinkedIn model benchmark is missing required env vars", {
      missing: config.missing,
    });
    console.log(describeLinkedinModelBenchmarkWorkflow(config));
    return;
  }

  const videos = selectVideos(benchmarkVideos, { limit, videoId });
  if (videos.length === 0) {
    throw new Error("No benchmark videos matched the requested filters.");
  }

  for (const video of videos) {
    logger.info("Running benchmark for video", {
      videoId: video.id,
      title: video.title,
    });
    await services.benchmark.runVideoBenchmark(video);
  }
}
