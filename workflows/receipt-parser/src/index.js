import { createReceiptParserContext } from "./lib/services.js";
import { runReceiptParser } from "./lib/runner.js";

const args = new Set(process.argv.slice(2));
const runOnce = args.has("--once");

async function main() {
  const context = createReceiptParserContext();
  await runReceiptParser(context, { once: runOnce });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
