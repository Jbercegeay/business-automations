import { createLinkedinModelBenchmarkContext } from "./lib/services.js";
import { runLinkedinModelBenchmark } from "./lib/runner.js";

const args = process.argv.slice(2);

function parseArgs(argv) {
  const parsed = {
    limit: null,
    videoId: "",
  };

  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      parsed.limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg.startsWith("--video-id=")) {
      parsed.videoId = arg.slice("--video-id=".length);
    }
  }

  return parsed;
}

async function main() {
  const context = createLinkedinModelBenchmarkContext();
  const options = parseArgs(args);
  await runLinkedinModelBenchmark(context, options);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
