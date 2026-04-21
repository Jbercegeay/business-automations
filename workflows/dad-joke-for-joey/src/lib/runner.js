import { fetchDadJoke } from "./joke.js";
import { describeDadJokeWorkflow } from "./workflow.js";

function getDateParts(timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour24: Number(parts.hour),
  };
}

function shouldSendNow(config, stateStore) {
  const { dateKey, hour24 } = getDateParts(config.schedule.timezone);

  if (hour24 < config.schedule.sendHour24) {
    return { shouldSend: false, dateKey, hour24 };
  }

  if (stateStore.getLastSentDate() === dateKey) {
    return { shouldSend: false, dateKey, hour24 };
  }

  return { shouldSend: true, dateKey, hour24 };
}

async function sendDadJoke(context) {
  const { services, config, logger, stateStore } = context;
  const decision = shouldSendNow(config, stateStore);

  if (!decision.shouldSend) {
    logger.info("Dad joke send skipped", {
      dateKey: decision.dateKey,
      hour24: decision.hour24,
      sendHour24: config.schedule.sendHour24,
      timezone: config.schedule.timezone,
      lastSentDate: stateStore.getLastSentDate(),
    });
    return false;
  }

  const joke = await fetchDadJoke(services);

  await services.gmail.sendMessage({
    to: config.gmail.recipientEmail,
    subject: config.gmail.subject,
    text: joke,
    from: config.gmail.fromEmail || undefined,
  });

  stateStore.setLastSentDate(decision.dateKey, {
    recipientEmail: config.gmail.recipientEmail,
    subject: config.gmail.subject,
  });

  logger.info("Dad joke sent", {
    dateKey: decision.dateKey,
    recipientEmail: config.gmail.recipientEmail,
  });

  return true;
}

export async function runDadJokeWorkflow(context, { once = false } = {}) {
  const { config, logger } = context;

  if (config.missing.length > 0) {
    logger.warn("Dad joke workflow is missing required env vars", {
      missing: config.missing,
    });
    console.log(describeDadJokeWorkflow(config));
    return;
  }

  do {
    await sendDadJoke(context);

    if (once) {
      break;
    }

    logger.info("Sleeping before next poll", {
      pollIntervalMs: config.pollIntervalMs,
    });
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  } while (true);
}
