const appConfig =
  require("../config/appConfig");

const {
  analyzeTelegramImageRichly
} = require(
  "./imageWorkflow"
);

const supportedMimeTypes =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ]);

const extractImage =
  (
    message
  ) => {
    const photo =
      message.photo?.at(
        -1
      );

    if (
      photo
    ) {
      return {
        fileId:
          photo.file_id,
        fileSize:
          photo.file_size || 0,
        mimeType:
          "image/jpeg"
      };
    }

    const document =
      message.document;

    if (
      document?.mime_type?.startsWith(
        "image/"
      )
    ) {
      return {
        fileId:
          document.file_id,
        fileSize:
          document.file_size || 0,
        mimeType:
          document.mime_type
      };
    }

    return null;
  };

const extractMessageImage =
  (
    message
  ) => {
    const image =
      extractImage(
        message.raw || message
      );

    if (
      !image ||
      !supportedMimeTypes.has(
        image.mimeType
      ) ||
      image.fileSize >
        appConfig.limits.maxImageBytes
    ) {
      return null;
    }

    return {
      image,
      message
    };
  };

const chunk =
  (
    items,
    size
  ) => {
    const chunks =
      [];

    for (
      let index = 0;
      index < items.length;
      index += size
    ) {
      chunks.push(
        items.slice(
          index,
          index + size
        )
      );
    }

    return chunks;
  };

const buildOcrMessage =
  (
    batch,
    text,
    index
  ) => {
    const anchor =
      batch.at(
        -1
      ).message;

    return {
      ...anchor,
      messageId:
        `${anchor.messageId}:ocr:${index}`,
      replyTo:
        anchor.messageId,
      text:
        text.trim()
    };
  };

const enrichMessagesWithImageOcr =
  async (
    ctx,
    messages
  ) => {
    const imageMessages =
      messages
        .map(
          extractMessageImage
        )
        .filter(Boolean);

    if (
      !imageMessages.length
    ) {
      return messages;
    }

    const ocrMessages =
      [];
    const batches =
      chunk(
        imageMessages,
        appConfig.limits.maxImages
      );

    for (
      const [index, batch]
      of batches.entries()
    ) {
      const textParts =
        [];

      for (
        const {
          image
        }
        of batch
      ) {
        try {
          const result =
            await analyzeTelegramImageRichly(
              ctx,
              image
            );

          if (
            result.data?.ocrText?.trim()
          ) {
            textParts.push(
              `OCR text:\n${result.data.ocrText.trim()}`
            );
          }

          if (
            result.data?.visualAnalysis
          ) {
            textParts.push(
              `Visual analysis:\n${JSON.stringify(
                result.data.visualAnalysis
              )}`
            );
          }
        } catch {
          continue;
        }
      }

      const text =
        textParts.join(
          "\n\n"
        );

      if (
        text
      ) {
        ocrMessages.push(
          buildOcrMessage(
            batch,
            text,
            index
          )
        );
      }
    }

    return [
      ...messages,
      ...ocrMessages
    ];
  };

module.exports = {
  extractImage,
  extractMessageImage,
  enrichMessagesWithImageOcr
};
