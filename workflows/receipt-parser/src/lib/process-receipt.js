import path from "node:path";

import { isApprovedCategory } from "./categories.js";

function detectMimeType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

function normalizeReceiptId(mistralFileId, driveFileId) {
  return mistralFileId || driveFileId;
}

function toSheetRow(receiptId, parsed) {
  return {
    ID: receiptId,
    Date: parsed.date || "",
    Vendor: parsed.vendor || "",
    "Vendor Address": parsed["vendor address"] || "",
    "Item Names": parsed["item name"] || "",
    "Item Prices": parsed.price || "",
    Quantity: "",
    Subtotal: parsed.subtotal || "",
    Tax: parsed.tax || "",
    Total: parsed["total cost"] || "",
    Category: parsed.Category || "",
  };
}

function buildRenamedFile(parsed, originalName) {
  const vendor = String(parsed.vendor || "receipt").trim().replace(/[^\w.-]+/g, " ");
  const date = String(parsed.date || "").trim();
  const extension = path.extname(originalName);
  return `${vendor}${date ? ` ${date}` : ""}${extension}`.trim();
}

export async function processReceiptFile({
  driveFile,
  services,
  logger,
  stateStore,
  config,
}) {
  logger.info("Downloading receipt file", { fileId: driveFile.id, name: driveFile.name });
  const fileBuffer = await services.drive.downloadFile(driveFile.id);

  logger.info("Uploading receipt to Mistral", { fileId: driveFile.id });
  const uploaded = await services.mistral.uploadReceipt(
    driveFile.name,
    fileBuffer,
    detectMimeType(driveFile.name),
  );

  const receiptId = normalizeReceiptId(uploaded.id, driveFile.id);

  logger.info("Requesting Mistral signed URL", { receiptId });
  const signedUrl = await services.mistral.getSignedUrl(uploaded.id);

  logger.info("Running OCR", { receiptId });
  const ocr = await services.mistral.runOcr(signedUrl.url);
  const firstPageMarkdown = ocr.pages?.[0]?.markdown || "";
  if (!firstPageMarkdown) {
    throw new Error("OCR returned no first-page markdown.");
  }

  logger.info("Parsing OCR output with OpenAI", { receiptId });
  const parsed = await services.openai.parseReceipt(firstPageMarkdown);
  const sheetRow = toSheetRow(receiptId, parsed);

  if (isApprovedCategory(parsed.Category)) {
    logger.info("Category approved automatically", { receiptId, category: parsed.Category });
    await services.sheets.appendRow(
      config.sheets.spreadsheetId,
      config.sheets.sheetName,
      sheetRow,
    );
    await finalizeReceipt({
      driveFile,
      parsed,
      services,
      config,
      logger,
    });
    stateStore.markProcessed(driveFile.id, {
      status: "completed",
      receiptId,
      category: parsed.Category,
      vendor: parsed.vendor,
    });

    return { status: "completed", receiptId, category: parsed.Category };
  }

  logger.info("Category requires approval", { receiptId, category: parsed.Category });
  await services.sheets.appendRow(
    config.sheets.spreadsheetId,
    config.sheets.sheetName,
    sheetRow,
  );
  await services.telegram.sendApprovalRequest(receiptId, parsed.Category, parsed.vendor);

  stateStore.markPendingApproval(receiptId, {
    driveFileId: driveFile.id,
    originalParentId: driveFile.parents?.[0] || config.drive.receiptsFolderId,
    originalName: driveFile.name,
    parsed,
    sheetRow,
    category: parsed.Category,
    vendor: parsed.vendor,
  });
  stateStore.markProcessed(driveFile.id, {
    status: "pending_approval",
    receiptId,
    category: parsed.Category,
    vendor: parsed.vendor,
  });

  return { status: "pending_approval", receiptId, category: parsed.Category };
}

export async function finalizeReceipt({
  driveFile,
  parsed,
  services,
  config,
  logger,
}) {
  const currentParentId = driveFile.parents?.[0] || config.drive.receiptsFolderId;
  await services.drive.moveFile(
    driveFile.id,
    config.drive.completedFolderId,
    currentParentId,
  );
  const newName = buildRenamedFile(parsed, driveFile.name);
  await services.drive.renameFile(driveFile.id, newName);
  logger.info("Moved and renamed receipt", { fileId: driveFile.id, newName });
}
