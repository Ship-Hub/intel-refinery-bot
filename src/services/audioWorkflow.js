const FormData =
  require("form-data");
const axios =
  require("axios");

const {
  analyzeAudio
} = require(
  "../api/backendClient"
);

const downloadTelegramFile =
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

const analyzeTelegramAudio =
  async (
    ctx,
    audio
  ) => {
    const downloaded =
      await downloadTelegramFile(
        ctx,
        audio.fileId
      );
    const form =
      new FormData();

    form.append(
      "audio",
      downloaded.buffer,
      {
        filename:
          downloaded.filePath
            .split("/")
            .pop() ||
          `voice.${audio.mimeType ===
          "audio/ogg"
            ? "ogg"
            : "audio"}`
      }
    );
    form.append(
      "durationSeconds",
      String(
        audio.duration
      )
    );

    return analyzeAudio(
      form
    );
  };

module.exports = {
  analyzeTelegramAudio
};
