const {
  withProcessingMessage
} = require(
  "../services/processingMessage"
);
const {
  analyzeTelegramAudio
} = require(
  "../services/audioWorkflow"
);
const {
  formatTelegramHtml
} = require(
  "../services/telegramFormatter"
);
const {
  extractAudio,
  validateAudio
} = require(
  "../services/audioUtils"
);
const {
  replyToMessage
} = require(
  "../services/telegramReply"
);
const {
  getConversationMessages
} = require(
  "../api/backendClient"
);

const analyzeAudioAndReply =
  async (
    ctx,
    audio
  ) =>
    withProcessingMessage(
      ctx,
      async () => {
        try {
          const result =
            await analyzeTelegramAudio(
              ctx,
              audio
            );

          await replyToMessage(
            ctx,
            [
              "🎙️ <b>Audio analysis</b>",
              "",
              "<b>Transcript</b>",
              formatTelegramHtml(
                result.data.transcript ||
                  "(no transcript returned)"
              ),
              "",
              "<b>Interpretation</b>",
              formatTelegramHtml(
                result.data.analysis ||
                  "No analysis returned."
              )
            ].join(
              "\n"
            ),
            {
              parse_mode:
                "HTML"
            }
          );
        } catch {
          await replyToMessage(
            ctx,
            "Audio analysis is temporarily unavailable. Please try again shortly."
          );
        }
      }
    );

const handleAnalyzeAudioCommand =
  async (
    ctx
  ) => {
    const audio =
      extractAudio(
        ctx.message
          ?.reply_to_message || {}
      );
    const error =
      validateAudio(
        audio
      );

    if (
      error
    ) {
      return replyToMessage(
        ctx,
        error
      );
    }

    return analyzeAudioAndReply(
      ctx,
      audio
    );
  };

const handleRecentAudioAnalysis =
  async (
    ctx,
    store,
    count =
      1
  ) => {
    const persisted =
      await getConversationMessages({
        platform:
          "telegram",
        conversationId:
          String(
            ctx.chat.id
          ),
        limit:
          200
      }).catch(
        () => null
      );
    const candidates =
      persisted?.data?.length
        ? persisted.data
        : store.getLatest(
            ctx.chat.id,
            200
          );
    const audioItems =
      candidates
        .map(
          (message) => ({
            message,
            audio:
              extractAudio(
                message.raw ||
                  message
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
        )
        .slice(
          -Math.max(
            1,
            Math.min(
              count,
              10
            )
          )
        );

    if (
      !audioItems.length
    ) {
      return replyToMessage(
        ctx,
        "I could not find any recent audio messages in the accessible chat history."
      );
    }

    return withProcessingMessage(
      ctx,
      async () => {
        const replies =
          [];

        for (
          let index =
            0;
          index <
          audioItems.length;
          index++
        ) {
          const result =
            await analyzeTelegramAudio(
              ctx,
              audioItems[index].audio
            );
          replies.push(
            [
              `<b>Audio ${index + 1}</b>`,
              "",
              "<b>Transcript</b>",
              formatTelegramHtml(
                result.data.transcript ||
                  "(no transcript returned)"
              ),
              "",
              "<b>Interpretation</b>",
              formatTelegramHtml(
                result.data.analysis ||
                  "No analysis returned."
              )
            ].join(
              "\n"
            )
          );
        }

        return replyToMessage(
          ctx,
          replies.join(
            "\n\n"
          ),
          {
            parse_mode:
              "HTML"
          }
        );
      }
    );
  };

module.exports = {
  extractAudio,
  validateAudio,
  analyzeAudioAndReply,
  handleAnalyzeAudioCommand,
  handleRecentAudioAnalysis
};
