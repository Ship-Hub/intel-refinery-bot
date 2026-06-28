const {
  parseMentionIntent
} = require(
  "../parsers/mentionParser"
);

const {
  handleSummary,
  handleMessageAnalysis,
  handleRangeAnalysis,
  handleQuestion,
  extractExternalUrl,
  handleUrlAnalysis,
  isPaymentProofIntent,
  hasPendingPaymentProof,
  handlePaymentProofAnalysis,
  isWeb3Intent,
  isWeb3WalletTokenRequest,
  hasPendingWeb3Request,
  handleWalletTokenAnalysis
} = require(
  "./analysisHandlers"
);

const {
  extractImage,
  analyzeImagesAndReply,
  validateImages
} = require(
  "./imageHandlers"
);

const {
  extractAudio,
  validateAudio,
  analyzeAudioAndReply,
  handleRecentAudioAnalysis
} = require(
  "./audioHandlers"
);
const {
  handleModeratorReportCommand,
  isModeratorReportRequest
} = require(
  "./moderatorMonitorHandlers"
);

const isCapabilityQuestion =
  (
    text = ""
  ) =>
    /\b(can you see all the admins|can you monitor them|what can you do|what are you able to do)\b/i.test(
      text
    );

const createMentionHandler =
  ({
    store,
    botUsername,
    getRecentExternalUrl =
      () => null
  }) =>
    async (
      ctx
    ) => {
      const intent =
        parseMentionIntent(
          ctx.message.text,
          botUsername
        );

      if (
        !intent
      ) {
        return;
      }

      const mentionedExternalUrl =
        extractExternalUrl(
          intent.text
        );
      if (
        isPaymentProofIntent(
          intent.text
        ) ||
        hasPendingPaymentProof(
          ctx
        )
      ) {
        return handlePaymentProofAnalysis(
          ctx,
          intent.text
        );
      }

      if (
        isWeb3WalletTokenRequest(
          intent.text
        ) ||
        isWeb3Intent(
          intent.text
        ) ||
        hasPendingWeb3Request(
          ctx
        )
      ) {
        return handleWalletTokenAnalysis(
          ctx,
          intent.text
        );
      }

      const wantsLinkAnalysis =
        /\b(analy[sz]e|review|check|inspect|summari[sz]e|verdict)\b/i.test(
          intent.text
        ) &&
        /\b(website|link|page|url|that|this)\b/i.test(
          intent.text
        );

      if (
        mentionedExternalUrl &&
        wantsLinkAnalysis
      ) {
        return handleUrlAnalysis(
          ctx,
          mentionedExternalUrl
        );
      }

      if (
        wantsLinkAnalysis
      ) {
        const recentExternalUrl =
          getRecentExternalUrl(
            ctx.chat.id
          );

        if (
          recentExternalUrl
        ) {
          return handleUrlAnalysis(
            ctx,
            recentExternalUrl
          );
        }
      }

      if (
        intent.type ===
        "summary"
      ) {
        return handleSummary(
          ctx,
          store,
          intent.text
        );
      }

      if (
        intent.type ===
        "message"
      ) {
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
            return ctx.reply(
              error
            );
          }

          return analyzeImagesAndReply(
            ctx,
            [repliedImage]
          );
        }

        const repliedAudio =
          extractAudio(
            ctx.message
              ?.reply_to_message || {}
          );

        if (
          repliedAudio
        ) {
          const error =
            validateAudio(
              repliedAudio
            );

          if (
            error
          ) {
            return ctx.reply(
              error
            );
          }

          return analyzeAudioAndReply(
            ctx,
            repliedAudio
          );
        }

        return handleMessageAnalysis(
          ctx
        );
      }

      if (
        intent.type ===
        "range"
      ) {
        return handleRangeAnalysis(
          ctx,
          store,
          intent.text
        );
      }

      if (
        intent.type ===
        "audio_history"
      ) {
        return handleRecentAudioAnalysis(
          ctx,
          store,
          intent.count
        );
      }

      if (
        intent.type ===
        "question"
      ) {
        if (
          isModeratorReportRequest(
            intent.text
          )
        ) {
          return handleModeratorReportCommand(
            ctx
          );
        }

        const externalUrl =
          extractExternalUrl(
            intent.text
          );

        if (
          externalUrl
        ) {
          return handleUrlAnalysis(
            ctx,
            externalUrl
          );
        }

        if (
          wantsLinkAnalysis
        ) {
          const recentExternalUrl =
            getRecentExternalUrl(
              ctx.chat.id
            );

          if (
            recentExternalUrl
          ) {
            return handleUrlAnalysis(
              ctx,
              recentExternalUrl
            );
          }
        }

        if (
          isCapabilityQuestion(
            intent.text
          )
        ) {
          return ctx.reply(
            "I can summarize chats by time, count, or Telegram links; analyze specific replies; inspect images; transcribe and analyze voice notes; analyze web links; answer questions about the conversation; and produce moderator audit reports when monitoring is configured. Moderator setup and audit reports require the group owner check. Reports are sent privately to the owner, not posted into the group."
          );
        }

        return handleQuestion(
          ctx,
          store,
          intent.text
        );
      }

      return;
    };

module.exports = {
  createMentionHandler,
  isCapabilityQuestion
};
