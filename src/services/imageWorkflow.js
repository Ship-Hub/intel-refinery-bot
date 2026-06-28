const FormData =
  require("form-data");

const axios =
  require("axios");

const {
  analyzeImages,
  analyzeRichImage
} = require(
  "../api/backendClient"
);

const downloadTelegramImage =
  async (
    ctx,
    fileId
  ) => {
    const file =
      await ctx.telegram.getFile(
        fileId
      );
    const url =
      `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
    const response =
      await axios.get(
        url,
        {
          responseType:
            "arraybuffer"
        }
      );

    return {
      buffer:
        Buffer.from(
          response.data
        ),
      filePath:
        file.file_path
    };
  };

const analyzeTelegramImages =
  async (
    ctx,
    images
  ) => {
    const form =
      new FormData();

    for (
      const image
      of images
    ) {
      const downloaded =
        await downloadTelegramImage(
          ctx,
          image.fileId
        );

      form.append(
        "image",
        downloaded.buffer,
        {
          filename:
            downloaded.filePath
              .split("/")
              .pop()
        }
      );
    }

    return analyzeImages(
      form
    );
  };

const analyzeTelegramImageRichly =
  async (
    ctx,
    image
  ) => {
    const downloaded =
      await downloadTelegramImage(
        ctx,
        image.fileId
      );
    const form =
      new FormData();

    form.append(
      "image",
      downloaded.buffer,
      {
        filename:
          downloaded.filePath
            .split("/")
            .pop()
      }
    );

    return analyzeRichImage(
      form
    );
  };

module.exports = {
  analyzeTelegramImages,
  analyzeTelegramImageRichly
};
