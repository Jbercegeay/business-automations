import { createLinkedinAiFirstGeneratorContext } from "./lib/services.js";
import { runLinkedinAiFirstGenerator } from "./lib/runner.js";

const args = new Set(process.argv.slice(2));
const runOnce = args.has("--once");
const force = args.has("--force");

async function main() {
  const context = createLinkedinAiFirstGeneratorContext();
  await runLinkedinAiFirstGenerator(context, {
    once: runOnce,
    force,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
