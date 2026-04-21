function cleanTranscriptPayload(payload) {
  const tracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
  const track = tracks.find((item) => item.language === "en") || tracks[0];
  const transcriptItems = Array.isArray(track?.transcript) ? track.transcript : [];
  const fullTranscript = transcriptItems
    .map((segment) => segment?.text?.trim())
    .filter(Boolean)
    .join(" ");

  if (!fullTranscript) {
    throw new Error("Transcript payload contained no usable text.");
  }

  return fullTranscript;
}

function normalizeFileName(value) {
  return String(value || "linkedin-graphic")
    .replace(/[^\w.-]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function inferExtension(mimeType) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".png";
}

function buildImageFileName(video) {
  const safeTitle = normalizeFileName(video.title);
  return `${safeTitle || "linkedin-graphic"}-${video.id}`;
}

function toSheetRow(result) {
  return [
    result.video.id,
    result.video.title,
    result.linkedinPost,
    result.emailHtml,
    result.imageDriveUrl,
    result.status,
    result.processedAt,
  ];
}

function buildNotificationText(result) {
  return [
    `Title: ${result.video.title}`,
    `Video ID: ${result.video.id}`,
    `Status: ${result.status}`,
    `Image URL: ${result.imageDriveUrl}`,
    "",
    "LinkedIn Post:",
    result.linkedinPost,
  ].join("\n");
}

export async function processLatestVideoContent(context, video) {
  const { services, logger, config } = context;

  logger.info("Fetching transcript", {
    videoId: video.id,
    title: video.title,
  });
  const transcriptPayload = await services.transcript.fetchTranscript(video.id);
  const transcript = cleanTranscriptPayload(transcriptPayload);

  logger.info("Generating content package", { videoId: video.id });
  const contentPackage = await services.openai.generateContentPackage({
    video,
    transcript,
  });

  logger.info("Generating image prompt", { videoId: video.id });
  const imagePrompt = await services.openai.generateImagePrompt({
    video,
    linkedinPost: contentPackage.linkedinPost,
  });

  logger.info("Generating companion image", { videoId: video.id });
  const generatedImage = await services.openai.generateImage({
    prompt: imagePrompt,
  });

  const imageFileName =
    `${buildImageFileName(video)}${inferExtension(generatedImage.mimeType)}`;

  logger.info("Uploading image to Drive", {
    videoId: video.id,
    fileName: imageFileName,
  });
  const uploadedImage = await services.drive.uploadFile({
    name: imageFileName,
    folderId: config.drive.imagesFolderId,
    mimeType: generatedImage.mimeType,
    buffer: generatedImage.buffer,
  });

  const result = {
    video,
    transcript,
    linkedinPost: contentPackage.linkedinPost,
    emailHtml: contentPackage.emailHtml,
    imagePrompt,
    imageDriveUrl: uploadedImage.webViewLink || uploadedImage.webContentLink || "",
    status: "Review",
    processedAt: new Date().toISOString(),
  };

  logger.info("Appending review row to Google Sheets", {
    videoId: video.id,
    spreadsheetId: config.sheets.spreadsheetId,
    sheetName: config.sheets.sheetName,
  });
  await services.sheets.appendValues(
    config.sheets.spreadsheetId,
    config.sheets.sheetName,
    [toSheetRow(result)],
  );

  if (config.notification.recipientEmail) {
    logger.info("Sending Gmail notification", {
      videoId: video.id,
      recipientEmail: config.notification.recipientEmail,
    });
    await services.gmail.sendRichMessage({
      to: config.notification.recipientEmail,
      subject: `${config.notification.subject}: ${video.title}`,
      from: config.notification.fromEmail || undefined,
      text: buildNotificationText(result),
      html: result.emailHtml,
    });
  }

  return result;
}
