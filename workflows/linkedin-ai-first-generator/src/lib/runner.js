import { processLatestVideoContent } from "./process-video.js";
import { describeLinkedinAiFirstGeneratorWorkflow } from "./workflow.js";

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

function shouldRunNow(config, stateStore) {
  const { dateKey, hour24 } = getDateParts(config.schedule.timezone);

  if (hour24 < config.schedule.sendHour24) {
    return {
      shouldRun: false,
      dateKey,
      hour24,
      reason: "before_schedule_window",
    };
  }

  if (stateStore.getLastRunDate() === dateKey) {
    return {
      shouldRun: false,
      dateKey,
      hour24,
      reason: "already_ran_today",
    };
  }

  return {
    shouldRun: true,
    dateKey,
    hour24,
    reason: "scheduled_window_open",
  };
}

async function processLatestVideo(context, { force = false } = {}) {
  const { services, stateStore, logger } = context;

  const video = await services.youtube.getLatestVideo();
  if (!video) {
    logger.warn("No YouTube video found for configured channel");
    return { status: "skipped", reason: "no_video" };
  }

  if (!force && stateStore.hasCompletedVideo(video.id)) {
    logger.info("Skipping already processed video", {
      videoId: video.id,
      title: video.title,
    });
    return { status: "skipped", reason: "already_processed", video };
  }

  try {
    const result = await processLatestVideoContent(context, video);
    stateStore.markVideo(video.id, {
      status: "completed",
      title: video.title,
      message: "",
      failedAt: "",
      imageDriveUrl: result.imageDriveUrl,
      processedAt: result.processedAt,
    });
    logger.info("Video processed successfully", {
      videoId: video.id,
      title: video.title,
      status: result.status,
    });
    return { status: "completed", video, result };
  } catch (error) {
    logger.error("Failed to process video", {
      videoId: video.id,
      title: video.title,
      message: error.message,
      body: error.body,
    });
    stateStore.markVideo(video.id, {
      status: "error",
      title: video.title,
      message: error.message,
      failedAt: new Date().toISOString(),
    });
    return { status: "error", video, error };
  }
}

function markScheduledRun(stateStore, decision, runResult) {
  stateStore.markDailyRun(decision.dateKey, {
    status: runResult.status,
    reason: runResult.reason || "",
    videoId: runResult.video?.id || "",
    title: runResult.video?.title || "",
  });
}

function logSkip(logger, config, stateStore, decision) {
  logger.info("LinkedIn workflow skipped", {
    reason: decision.reason,
    dateKey: decision.dateKey,
    hour24: decision.hour24,
    sendHour24: config.schedule.sendHour24,
    timezone: config.schedule.timezone,
    lastRunDate: stateStore.getLastRunDate(),
  });
}

export async function runLinkedinAiFirstGenerator(
  context,
  { once = false, force = false } = {},
) {
  const { config, logger, stateStore } = context;

  if (config.missing.length > 0) {
    logger.warn("LinkedIn AI First Generator is missing required env vars", {
      missing: config.missing,
    });
    console.log(describeLinkedinAiFirstGeneratorWorkflow(config));
    return false;
  }

  do {
    const decision = shouldRunNow(config, stateStore);

    if (force) {
      const runResult = await processLatestVideo(context, { force: true });
      if (once) {
        break;
      }
      logger.info("Sleeping before next poll", {
        pollIntervalMs: config.pollIntervalMs,
      });
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
      continue;
    }

    if (!decision.shouldRun) {
      logSkip(logger, config, stateStore, decision);

      if (once) {
        break;
      }

      logger.info("Sleeping before next poll", {
        pollIntervalMs: config.pollIntervalMs,
      });
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
      continue;
    }

    const runResult = await processLatestVideo(context, { force: false });
    markScheduledRun(stateStore, decision, runResult);

    if (once) {
      break;
    }

    logger.info("Sleeping before next poll", {
      pollIntervalMs: config.pollIntervalMs,
    });
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  } while (true);
}
