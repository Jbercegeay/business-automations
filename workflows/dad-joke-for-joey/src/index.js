import { createDadJokeContext } from "./lib/services.js";
import { runDadJokeWorkflow } from "./lib/runner.js";

const args = new Set(process.argv.slice(2));
const runOnce = args.has("--once");

async function main() {
  const context = createDadJokeContext();
  await runDadJokeWorkflow(context, { once: runOnce });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
