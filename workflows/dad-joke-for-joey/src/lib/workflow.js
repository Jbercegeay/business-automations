export function describeDadJokeWorkflow(config) {
  return [
    "Dad Joke for Joey workflow",
    `Timezone: ${config.schedule.timezone}`,
    `Send hour: ${config.schedule.sendHour24}:00`,
    `Recipient: ${config.gmail.recipientEmail || "(missing)"}`,
    config.missing.length > 0
      ? `Missing env vars: ${config.missing.join(", ")}`
      : "All required env vars are present.",
  ].join("\n");
}
