const {
  handleSummary,
  handleMessageAnalysis,
  handleRangeAnalysis,
  handleQuestion,
  handleLinkedMessageAnalysis,
  looksLikeMessageLink
} = require(
  "../handlers/analysisHandlers"
);

const {
  handleAnalyzeImageCommand
} = require(
  "../handlers/imageHandlers"
);
const {
  handleAnalyzeAudioCommand
} = require(
  "../handlers/audioHandlers"
);
const {
  handleMonitorModeratorsCommand,
  handleModeratorReportCommand
} = require(
  "../handlers/moderatorMonitorHandlers"
);
const {
  handleConversationLevelCommand
} = require(
  "../handlers/conversationLevelHandlers"
);
const {
  handleOtpCommand
} = require(
  "../handlers/otpHandler"
);

const registerCommands =
  (
    bot,
    {
      store,
      sessions
    }
  ) => {
    bot.command(
      "help",
      (ctx) =>
        ctx.reply(
          [
            "I help with dispute and moderation context: summaries, case analysis, message review, image evidence, voice notes, and moderator audits.",
            "",
            "/summary last 2 hours",
            "/analyze <question or message-link>",
            "/analyze_time 2h",
            "/analyze_range <start-link> <end-link>",
            "/analyze_message",
            "/analyze_reply",
            "/analyze_image",
            "/analyze_audio",
            "/monitor_moderators",
            "/moderator_report",
            "/conversation_level",
            "/otp"
          ].join("\n")
        )
    );

    bot.command(
      "summary",
      (ctx) =>
        handleSummary(
          ctx,
          store,
          ctx.message.text
            .replace(
              /^\/summary(?:@\w+)?/,
              ""
            )
            .trim()
        )
    );

    bot.command(
      "analyze",
      (ctx) => {
        const input =
          ctx.message.text
            .replace(
              /^\/analyze(?:@\w+)?/,
              ""
            )
            .trim();

        if (
          looksLikeMessageLink(
            input
          )
        ) {
          return handleLinkedMessageAnalysis(
            ctx,
            store,
            input
          );
        }

        return handleQuestion(
          ctx,
          store,
          input ||
            "What is happening in this conversation?"
        );
      }
    );

    bot.command(
      "analyze_time",
      (ctx) =>
        handleSummary(
          ctx,
          store,
          ctx.message.text
            .replace(
              /^\/analyze_time(?:@\w+)?/,
              ""
            )
            .trim()
        )
    );

    bot.command(
      "analyze_range",
      (ctx) =>
        handleRangeAnalysis(
          ctx,
          store,
          ctx.message.text
        )
    );

    bot.command(
      "analyze_message",
      handleMessageAnalysis
    );

    bot.command(
      "analyze_reply",
      handleMessageAnalysis
    );

    bot.command(
      "analyze_image",
      (ctx) =>
        handleAnalyzeImageCommand(
          ctx,
          sessions
        )
    );

    bot.command(
      "analyze_audio",
      handleAnalyzeAudioCommand
    );

    bot.command(
      "monitor_moderators",
      (ctx) =>
        handleMonitorModeratorsCommand(
          ctx,
          process.env.BOT_USERNAME?.replace(/^@/, "") ||
            "JudgeBot"
        )
    );

    bot.command(
      "moderator_report",
      (ctx) =>
        handleModeratorReportCommand(
          ctx
        )
    );

    bot.command(
      "conversation_level",
      handleConversationLevelCommand
    );

    bot.command(
      "otp",
      handleOtpCommand
    );
  };

module.exports = {
  registerCommands
};
