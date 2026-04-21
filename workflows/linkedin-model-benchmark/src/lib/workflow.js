export function describeLinkedinModelBenchmarkWorkflow(config) {
  const missingText = config.missing.length
    ? `Missing env vars: ${config.missing.join(", ")}`
    : "All required env vars are present.";

  return [
    "1. Load the fixed 10-video benchmark set.",
    "2. Fetch each video transcript from youtube-transcript.io.",
    "3. Run all benchmark models against the same transcript and prompt.",
    "4. Validate linkedinPost and emailHtml for each model.",
    "5. Append 3 benchmark rows per video into the dedicated benchmark sheet.",
    "",
    `Models: ${config.models.map((model) => model.id).join(", ")}`,
    `Benchmark sheet: ${config.sheets.sheetName}`,
    missingText,
  ].join("\n");
}
