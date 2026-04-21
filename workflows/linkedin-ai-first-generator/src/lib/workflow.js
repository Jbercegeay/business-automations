export function describeLinkedinAiFirstGeneratorWorkflow(config) {
  const missingText = config.missing.length
    ? `Missing env vars: ${config.missing.join(", ")}`
    : "All required env vars are present.";

  return [
    "1. Wait until the configured daily send hour in the configured timezone.",
    "2. Fetch the latest public video from the configured YouTube channel.",
    "3. Request the transcript from youtube-transcript.io.",
    "4. Clean the transcript into one plain-text document.",
    "5. Generate a LinkedIn post and executive HTML brief from the same transcript.",
    "6. Generate a LinkedIn-style image prompt from the LinkedIn post.",
    "7. Create a companion image with OpenAI image generation.",
    "8. Upload the image to Google Drive.",
    "9. Append a review row to Google Sheets with status Review.",
    "10. Optionally send a Gmail notification containing the HTML brief.",
    "",
    `Daily schedule: ${config.schedule.timezone} at ${String(config.schedule.sendHour24).padStart(2, "0")}:00`,
    missingText,
  ].join("\n");
}
