const appConfig =
  require("../config/appConfig");

const extractAudio =
  (
    message = {}
  ) => {
    const voice =
      message.voice ||
      (
        message.media?.type ===
        "voice"
          ? {
              file_id:
                message.media.fileId,
              file_size:
                message.media.fileSize,
              duration:
                message.media.duration,
              mime_type:
                message.media.mimeType
            }
          : null
      );
    const audio =
      message.audio ||
      (
        message.media?.type ===
        "audio"
          ? {
              file_id:
                message.media.fileId,
              file_size:
                message.media.fileSize,
              duration:
                message.media.duration,
              mime_type:
                message.media.mimeType
            }
          : null
      );
    const source =
      voice || audio;

    if (
      !source
    ) {
      return null;
    }

    return {
      fileId:
        source.file_id,
      fileSize:
        source.file_size || 0,
      duration:
        source.duration || 0,
      mimeType:
        source.mime_type ||
        (voice
          ? "audio/ogg"
          : null)
    };
  };

const validateAudio =
  (
    audio
  ) => {
    if (
      !audio
    ) {
      return "Reply to a voice note or audio file, then use /analyze_audio.";
    }

    if (
      audio.fileSize >
      appConfig.limits.maxAudioBytes
    ) {
      return "Audio is too large. Please keep it at 5 MB or less.";
    }

    if (
      audio.duration >
      appConfig.limits.maxAudioSeconds
    ) {
      return "Audio is too long. Please keep it at 10 minutes or less.";
    }

    return null;
  };

module.exports = {
  extractAudio,
  validateAudio
};
