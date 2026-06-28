const appConfig =
  require("../config/appConfig");

const {
  withProcessingMessage
} = require(
  "../services/processingMessage"
);

const {
  analyzeTelegramImages,
  analyzeTelegramImageRichly
} = require(
  "../services/imageWorkflow"
);

const {
  extractImage
} = require(
  "../services/messageImageWorkflow"
);

const {
  formatVisualAnalysis
} = require(
  "../services/visualAnalysisFormatter"
);
const {
  replyToMessage
} = require(
  "../services/telegramReply"
);

const buildImageConversationId =
  (
    ctx
  ) =>
    [
      "image",
      ctx.chat.id,
      ctx.message.message_id
    ].join(":");

const supportedMimeTypes =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ]);

const validateImages =
  (
    images
  ) => {
    if (
      images.length >
      appConfig.limits.maxImages
    ) {
      return `Please send at most ${appConfig.limits.maxImages} images at once.`;
    }

    for (
      const image
      of images
    ) {
      if (
        !supportedMimeTypes.has(
          image.mimeType
        )
      ) {
        return "Unsupported image format. Use JPG, PNG, or WebP.";
      }

      if (
        image.fileSize >
        appConfig.limits.maxImageBytes
      ) {
        return "One of the images is too large.";
      }
    }

    return null;
  };

const analyzeImagesAndReply =
  async (
    ctx,
    images,
    {
      showProcessing =
        true
    } = {}
  ) => {
    const task =
      async () => {
        try {
          const results =
            [];

          for (
            const image
            of images
          ) {
            results.push(
              await analyzeTelegramImageRichly(
                ctx,
                image
              )
            );
          }
          const text =
            results
              .map(
                (
                  result,
                  index
                ) =>
                  [
                    `Image ${index + 1}`,
                    result.data?.ocrText
                      ? `OCR text:\n${result.data.ocrText}`
                      : null,
                    result.data?.visualAnalysis
                      ? `Visual analysis:\n${JSON.stringify(
                          result.data.visualAnalysis
                        )}`
                      : null
                  ]
                    .filter(Boolean)
                    .join("\n")
              )
              .filter(Boolean)
              .join("\n\n");
          const visualSummary =
            results
              .map(
                (
                  result,
                  index
                ) =>
                  [
                    images.length >
                    1
                      ? `🖼️ <b>Image ${index + 1}</b>`
                      : null,
                    formatVisualAnalysis(
                      result.data
                    )
                  ]
                    .filter(Boolean)
                    .join("\n")
              )
              .filter(Boolean)
              .join("\n\n");

          if (
            !text
          ) {
            await replyToMessage(
              ctx,
              "I could not extract readable text from that image."
            );
            return;
          }

          await replyToMessage(
            ctx,
            [
              "<b>Image analysis</b>",
              "",
              visualSummary
            ]
              .filter(
                (line) =>
                  line !== null
              )
              .join("\n"),
            {
              parse_mode:
                "HTML"
            }
          );
        } catch (error) {
          const timedOut =
            error.code ===
            "ECONNABORTED";

          await replyToMessage(
            ctx,
            timedOut
              ? "Image analysis is taking longer than expected. Please try again shortly with the same image."
              : "Image analysis is temporarily unavailable. Please try again shortly."
          );
        }
      };

    return showProcessing
      ? withProcessingMessage(
          ctx,
          task
        )
      : task();
  };

const handleAnalyzeImageCommand =
  async (
    ctx,
    sessions
  ) => {
    const repliedImage =
      extractImage(
        ctx.message
          ?.reply_to_message || {}
      );

    if (
      repliedImage
    ) {
      const error =
        validateImages(
          [repliedImage]
        );
      if (
        error
      ) {
        return replyToMessage(
          ctx,
          error
        );
      }
      return analyzeImagesAndReply(
        ctx,
        [repliedImage]
      );
    }

    sessions.create(
      ctx.chat.id,
      ctx.from.id
    );

    return replyToMessage(
      ctx,
      "Upload up to 5 images within 2 minutes and I will analyze them."
    );
  };

const finalizePendingUpload =
  async (
    ctx,
    sessions,
    session
  ) => {
    const latest =
      sessions.get(
        session.chatId,
        session.userId
      );

    if (
      !latest ||
      latest !== session
    ) {
      return;
    }

    const images =
      [...session.images];

    sessions.clear(
      session.chatId,
      session.userId
    );

    await analyzeImagesAndReply(
      ctx,
      images
    );
  };

const handlePendingUpload =
  async (
    ctx,
    sessions
  ) => {
    const session =
      sessions.get(
        ctx.chat.id,
        ctx.from.id
      );

    if (
      !session
    ) {
      return false;
    }

    const image =
      extractImage(
        ctx.message
      );

    if (
      !image
    ) {
      return false;
    }

    session.images.push(
      image
    );

    const error =
      validateImages(
        session.images
      );

    if (
      error
    ) {
      sessions.clear(
        ctx.chat.id,
        ctx.from.id
      );
      await replyToMessage(
        ctx,
        error
      );
      return true;
    }

    sessions.scheduleFinalize(
      ctx.chat.id,
      ctx.from.id,
      appConfig.limits.uploadSettleDelayMs,
      (latestSession) =>
        finalizePendingUpload(
          ctx,
          sessions,
          latestSession
        )
    );
    return true;
  };

module.exports = {
  extractImage,
  validateImages,
  handleAnalyzeImageCommand,
  handlePendingUpload,
  analyzeImagesAndReply,
  buildImageConversationId,
  finalizePendingUpload
};
