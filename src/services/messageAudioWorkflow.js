const {
  extractAudio,
  validateAudio
} = require(
  "./audioUtils"
);
const {
  analyzeTelegramAudio
} = require(
  "./audioWorkflow"
);

const enrichMessagesWithAudioAnalysis =
  async (
    ctx,
    messages
  ) => {
    const audioMessages =
      messages
        .map(
          (message) => ({
            message,
            audio:
              extractAudio(
                message.raw || message
              )
          })
        )
        .filter(
          ({
            audio
          }) =>
            audio &&
            !validateAudio(
              audio
            )
        );

    const enriched =
      [];

    for (
      const {
        message,
        audio
      }
      of audioMessages
    ) {
      try {
        const result =
          await analyzeTelegramAudio(
            ctx,
            audio
          );
        const text =
          [
            result.data?.transcript
              ? `Audio transcript:\n${result.data.transcript}`
              : null,
            result.data?.analysis
              ? `Audio analysis:\n${result.data.analysis}`
              : null
          ]
            .filter(Boolean)
            .join("\n\n");

        if (
          text
        ) {
          enriched.push({
            ...message,
            messageId:
              `${message.messageId}:audio`,
            replyTo:
              message.messageId,
            text
          });
        }
      } catch {
        continue;
      }
    }

    return [
      ...messages,
      ...enriched
    ];
  };

module.exports = {
  enrichMessagesWithAudioAnalysis
};
