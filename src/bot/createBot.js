const {
  Telegraf
} = require("telegraf");

const appConfig =
  require("../config/appConfig");

const {
  logger,
  childForUpdate
} = require(
  "../logging/logger"
);

const {
  MessageStore
} = require(
  "../telegram/messageStore"
);

const {
  normalizeTelegramMessage
} = require(
  "../telegram/normalizeTelegramMessage"
);

const {
  UploadSessionStore
} = require(
  "../services/uploadSessionStore"
);

const {
  registerCommands
} = require(
  "../commands/registerCommands"
);

const {
  createMentionHandler
} = require(
  "../handlers/mentionHandler"
);

const {
  handlePendingUpload
} = require(
  "../handlers/imageHandlers"
);
const {
  handleCaptionedImageRequest
} = require(
  "../handlers/captionHandler"
);
const {
  handleQuestion,
  handleSummary,
  extractExternalUrl,
  handleUrlAnalysis,
  isPaymentProofIntent,
  hasPendingPaymentProof,
  handlePaymentProofAnalysis,
  isWeb3Intent,
  hasPendingWeb3Request,
  handleWalletTokenAnalysis
} = require(
  "../handlers/analysisHandlers"
);
const {
  classifyProactiveSignal,
  isOnCooldown,
  markProactiveReply,
  decideProactiveAction,
  confirmProactiveAction
} = require(
  "../services/proactiveResponder"
);
const {
  handleMonitorStart,
  handleMonitorFrequency,
  handleModeratorReportCommand,
  isModeratorReportRequest
} = require(
  "../handlers/moderatorMonitorHandlers"
);
const {
  ingestConversation,
  listModeratorMonitors,
  getConversationSettings
} = require(
  "../api/backendClient"
);
const {
  replaceMonitors,
  isMonitored
} = require(
  "../services/monitorRegistry"
);
const {
  getConversationLevel,
  setConversationLevel,
  hasLoadedConversationLevel
} = require(
  "../services/conversationLevelRegistry"
);
const {
  deliverDueModeratorReports
} = require(
  "../services/moderatorReportWorkflow"
);
const {
  handleReplyToBot
} = require(
  "../handlers/replyHandler"
);
const {
  handleConversationLevelChoice
} = require(
  "../handlers/conversationLevelHandlers"
);

const createBot =
  (
    token
  ) => {
    const bot =
      new Telegraf(
        token
      );
    const store =
      new MessageStore({
        maxMessages:
          appConfig.limits.maxMessages
      });
    const sessions =
      new UploadSessionStore({
        timeoutMs:
          appConfig.limits.uploadSessionTimeoutMs
      });
    const recentExternalUrls =
      new Map();
    const rememberExternalUrl =
      (
        chatId,
        url
      ) => {
        if (
          url
        ) {
          recentExternalUrls.set(
            String(
              chatId
            ),
            {
              url,
              createdAt:
                Date.now()
            }
          );
        }
      };
    const getRecentExternalUrl =
      (
        chatId
      ) => {
        const record =
          recentExternalUrls.get(
            String(
              chatId
            )
          );

        if (
          !record
        ) {
          return null;
        }

        if (
          Date.now() -
            record.createdAt >
          10 *
            60 *
            1000
        ) {
          recentExternalUrls.delete(
            String(
              chatId
            )
          );
          return null;
        }

        return record.url;
      };

    bot.use(
      async (
        ctx,
        next
      ) => {
        const log =
          childForUpdate(
            ctx
          );
        log.info({
          event:
            "telegram_update_received"
        });

        if (
          ctx.from?.is_bot
        ) {
          log.info({
            event:
              "telegram_update_ignored_bot_sender"
          });
          return;
        }

        if (
          ctx.message
        ) {
          const normalized =
            normalizeTelegramMessage(
              ctx.message
            );
          store.add(
            normalized
          );

          rememberExternalUrl(
            ctx.chat.id,
            extractExternalUrl(
              normalized.text
            )
          );

          ingestConversation({
              platform:
                "telegram",
              conversationId:
                String(
                  ctx.chat.id
                ),
              messages: [
                {
                  messageId:
                    normalized.messageId,
                  text:
                    normalized.text,
                  timestamp:
                    normalized.timestamp.toISOString(),
                  replyTo:
                    normalized.replyTo,
                  participant:
                    normalized.participant,
                  metadata: {
                    source:
                      "telegram_monitor",
                    media: normalized.raw?.voice
                      ? {
                          type:
                            "voice",
                          fileId:
                            normalized.raw.voice.file_id,
                          fileSize:
                            normalized.raw.voice.file_size || 0,
                          duration:
                            normalized.raw.voice.duration || 0,
                          mimeType:
                            normalized.raw.voice.mime_type ||
                            "audio/ogg"
                        }
                      : normalized.raw?.audio
                        ? {
                            type:
                              "audio",
                            fileId:
                              normalized.raw.audio.file_id,
                            fileSize:
                              normalized.raw.audio.file_size || 0,
                            duration:
                              normalized.raw.audio.duration || 0,
                            mimeType:
                              normalized.raw.audio.mime_type || null
                          }
                        : null
                  }
                }
              ]
            }).catch(
              () => {}
            );
        }

        return next();
      }
    );

    registerCommands(
      bot,
      {
        store,
        sessions
      }
    );

    bot.on(
      "message",
      async (
        ctx,
        next
      ) => {
        const consumed =
          await handlePendingUpload(
            ctx,
            sessions
          );

        if (
          consumed
        ) {
          return;
        }

        const consumedCaption =
          await handleCaptionedImageRequest(
            ctx
          );

        if (
          consumedCaption
        ) {
          return;
        }

        const consumedReply =
          await handleReplyToBot(
            ctx,
            store
          );

        if (
          consumedReply
        ) {
          return;
        }

        return next();
      }
    );

    bot.hears(
      /@/i,
      createMentionHandler({
        store,
        botUsername:
          appConfig.bot.username,
        getRecentExternalUrl
      })
    );

    bot.start(
      (ctx) => {
        const token =
          ctx.message.text
            .split(
              " "
            )[1];

        if (
          token?.startsWith(
            "monitor_"
          )
        ) {
          return handleMonitorStart(
            ctx,
            token.replace(
              /^monitor_/,
              ""
            )
          );
        }

        return ctx.reply(
          "Hello. I can help analyze disputes, evidence, and moderation context."
        );
      }
    );

    bot.action(
      /^monitor_freq:(daily|weekly|biweekly|monthly):(.+)$/,
      (ctx) =>
        handleMonitorFrequency(
          ctx,
          ctx.match[1],
          ctx.match[2]
        )
    );

    bot.action(
      /^conversation_level:([123]):(\d+)$/,
      (ctx) =>
        handleConversationLevelChoice(
          ctx,
          ctx.match[1],
          ctx.match[2]
        )
    );

    bot.on(
      "text",
      async (
        ctx,
        next
      ) => {
        const externalUrl =
          extractExternalUrl(
            ctx.message.text
          );
        const wantsLinkAnalysis =
          /\b(analy[sz]e|review|check|inspect|summari[sz]e|verdict)\b/i.test(
            ctx.message.text
          ) &&
          /\b(website|link|page|url|that|this)\b/i.test(
            ctx.message.text
          );

        if (
          ctx.message.text.includes(
            `@${appConfig.bot.username}`
          ) ||
          ctx.message.reply_to_message
            ?.from
            ?.is_bot ||
          ctx.message.entities?.some(
            (entity) =>
              entity.type ===
              "bot_command"
          ) ||
          (
            isOnCooldown(
              ctx.chat.id
            ) &&
            !wantsLinkAnalysis
          )
        ) {
          return next();
        }

        if (
          isModeratorReportRequest(
            ctx.message.text
          ) &&
          isMonitored(
            ctx.chat.id
          )
        ) {
          return handleModeratorReportCommand(
            ctx
          );
        }

        if (
          isPaymentProofIntent(
            ctx.message.text
          ) ||
          hasPendingPaymentProof(
            ctx
          )
        ) {
          return handlePaymentProofAnalysis(
            ctx,
            ctx.message.text
          );
        }

        if (
          isWeb3Intent(
            ctx.message.text
          ) ||
          hasPendingWeb3Request(
            ctx
          )
        ) {
          return handleWalletTokenAnalysis(
            ctx,
            ctx.message.text
          );
        }

        if (
          externalUrl &&
          wantsLinkAnalysis
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

        const messages =
          store.getLatest(
            ctx.chat.id,
            8
          );
        const signal =
          classifyProactiveSignal(
            messages
          );
        const conversationalLevel =
          getConversationLevel(
            ctx.chat.id
          );
        const localAction =
          decideProactiveAction(
            signal,
            conversationalLevel
          );

        if (
          localAction ===
          "observe"
        ) {
          return next();
        }

        let confirmed;

        try {
          confirmed =
            await confirmProactiveAction({
              messages,
              localSignal:
                signal,
              conversationalLevel
            });
        } catch {
          return next();
        }

        const action =
          confirmed.policy?.action;

        if (
          action ===
          "respond" &&
          confirmed.classification?.category ===
            "summary"
        ) {
          markProactiveReply(
            ctx.chat.id
          );
          return handleSummary(
            ctx,
            store,
            "last 30 minutes"
          );
        }

        if (
          action ===
          "offer_help" &&
          confirmed.classification?.category ===
            "moderation_triage"
        ) {
          markProactiveReply(
            ctx.chat.id
          );
          return handleQuestion(
            ctx,
            store,
            "A scam, rug, fraud, or panic claim may be forming in the chat. Give a brief moderator-style intervention: separate allegation from established evidence, ask for the concrete proof or transaction details, and keep the tone calm. Do not repeat accusations as facts."
            ,
            {
              showProcessing:
                false
            }
          );
        }

        if (
          action ===
            "respond" &&
          confirmed.classification?.category ===
            "casual_qa" &&
          conversationalLevel >=
            3
        ) {
          markProactiveReply(
            ctx.chat.id
          );
          return handleQuestion(
            ctx,
            store,
            ctx.message.text,
            {
              showProcessing:
                false
            }
          );
        }

        return next();
      }
    );

    bot.catch(
      (error, ctx) => {
        childForUpdate(
          ctx
        ).error({
          event:
            "telegram_handler_error",
          error:
            error.message
        });
      }
    );

    logger.info({
      event:
        "bot_created"
    });

    bot.telegram.setMyCommands([
      {
        command:
          "help",
        description:
          "Show what I can do"
      },
      {
        command:
          "summary",
        description:
          "Summarize a time range"
      },
      {
        command:
          "analyze",
        description:
          "Ask a question or analyze a message link"
      },
      {
        command:
          "analyze_time",
        description:
          "Analyze a recent time window"
      },
      {
        command:
          "analyze_range",
        description:
          "Analyze between two Telegram links"
      },
      {
        command:
          "analyze_message",
        description:
          "Analyze the replied-to message"
      },
      {
        command:
          "analyze_reply",
        description:
          "Analyze the replied-to message"
      },
      {
        command:
          "analyze_image",
        description:
          "Analyze a replied-to image"
      },
      {
        command:
          "analyze_audio",
        description:
          "Analyze a replied-to voice note"
      },
      {
        command:
          "monitor_moderators",
        description:
          "Owner setup for moderator monitoring"
      },
      {
        command:
          "moderator_report",
        description:
          "Owner-only current moderator report"
      },
      {
        command:
          "conversation_level",
        description:
          "Set group conversational level"
      },
      {
        command:
          "otp",
        description:
          "Get a private login code"
      }
    ]).catch(
      () => {}
    );

    listModeratorMonitors(
      "telegram"
    )
      .then(
        (response) =>
          replaceMonitors(
            response.data || []
          )
      )
      .catch(
        () => {}
      );

    bot.on(
      "message",
      (
        ctx,
        next
      ) => {
        if (
          !hasLoadedConversationLevel(
            ctx.chat.id
          )
        ) {
          getConversationSettings({
            platform:
              "telegram",
            conversationId:
              String(
                ctx.chat.id
              )
          })
            .then(
              (response) =>
                setConversationLevel(
                  ctx.chat.id,
                  response.data.conversationalLevel
                )
            )
            .catch(
              () =>
                setConversationLevel(
                  ctx.chat.id,
                  1
                )
            );
        }

        return next();
      }
    );

    setInterval(
      () =>
        deliverDueModeratorReports(
          bot
        ).catch(
          () => {}
        ),
      10 * 60 * 1000
    );

    return {
      bot,
      store,
      sessions
    };
  };

module.exports = {
  createBot
};
