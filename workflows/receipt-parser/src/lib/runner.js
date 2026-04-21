import { finalizeReceipt, processReceiptFile } from "./process-receipt.js";
import { describeReceiptParserWorkflow } from "./workflow.js";

async function handleTelegramApprovals(context) {
  const { services, stateStore, logger, config } = context;
  const offset = stateStore.getTelegramOffset();
  const updates = await services.telegram.getUpdates(offset);

  for (const update of updates.result || []) {
    stateStore.setTelegramOffset(update.update_id + 1);
    const callback = update.callback_query;
    const data = callback?.data || "";
    const [action, receiptId] = data.split(":");
    if (!action || !receiptId) {
      continue;
    }

    const pending = stateStore.getPendingApproval(receiptId);
    if (!pending) {
      await services.telegram.answerCallbackQuery(
        callback.id,
        "This receipt is no longer pending.",
      );
      continue;
    }

    if (action === "approve") {
      logger.info("Telegram approval received", { receiptId });
      await services.sheets.updateCategoryById(
        config.sheets.spreadsheetId,
        config.sheets.sheetName,
        receiptId,
        pending.category,
      );
      await finalizeReceipt({
        driveFile: {
          id: pending.driveFileId,
          name: pending.originalName,
          parents: [pending.originalParentId],
        },
        parsed: pending.parsed,
        services,
        config,
        logger,
      });
      stateStore.clearPendingApproval(receiptId);
      await services.telegram.answerCallbackQuery(callback.id, "Category approved.");
      continue;
    }

    if (action === "reject") {
      logger.warn("Telegram approval rejected", { receiptId });
      stateStore.clearPendingApproval(receiptId);
      await services.telegram.answerCallbackQuery(
        callback.id,
        "Category rejected. File left in intake state.",
      );
    }
  }
}

async function processNewReceipts(context) {
  const { services, config, stateStore, logger } = context;
  const files = await services.drive.listFilesInFolder(config.drive.receiptsFolderId);

  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      logger.info("Skipping nested folder in intake folder", {
        fileId: file.id,
        name: file.name,
      });
      continue;
    }

    if (stateStore.hasProcessedFile(file.id)) {
      continue;
    }

    try {
      await processReceiptFile({
        driveFile: file,
        services,
        logger,
        stateStore,
        config,
      });
    } catch (error) {
      logger.error("Failed to process receipt", {
        fileId: file.id,
        name: file.name,
        message: error.message,
        body: error.body,
      });
      stateStore.markProcessed(file.id, {
        status: "error",
        message: error.message,
      });
    }
  }
}

export async function runReceiptParser(context, { once = false } = {}) {
  const { config, logger } = context;

  if (config.missing.length > 0) {
    logger.warn("Receipt parser is missing required env vars", {
      missing: config.missing,
    });
    console.log(describeReceiptParserWorkflow(config));
    return;
  }

  do {
    await handleTelegramApprovals(context);
    await processNewReceipts(context);

    if (once) {
      break;
    }

    logger.info("Sleeping before next poll", {
      pollIntervalMs: config.pollIntervalMs,
    });
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  } while (true);
}
