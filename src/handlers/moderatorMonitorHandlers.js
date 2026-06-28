const {
  Markup
} = require(
  "telegraf"
);
const {
  createPendingSetup,
  getPendingSetup,
  clearPendingSetup
} = require(
  "../services/monitorSetupStore"
);
const {
  upsertModeratorMonitor,
  generateModeratorReport
} = require(
  "../api/backendClient"
);
const {
  addMonitor
} = require(
  "../services/monitorRegistry"
);
const {
  formatModeratorReport
} = require(
  "../services/moderatorReportWorkflow"
);

const toAdmin =
  (
    member
  ) => ({
    externalUserId:
      String(
        member.user.id
      ),
    username:
      member.user.username ||
      null,
    displayName:
      [
        member.user.first_name,
        member.user.last_name
      ]
        .filter(Boolean)
        .join(" ") ||
      null
  });

const handleMonitorModeratorsCommand =
  async (
    ctx,
    botUsername
  ) => {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    if (
      member.status !==
      "creator"
    ) {
      return ctx.reply(
        "Only the group owner can set up moderator monitoring."
      );
    }

    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );
    const token =
      createPendingSetup({
        ownerId:
          ctx.from.id,
        chatId:
          ctx.chat.id,
        ownerUsername:
          ctx.from.username,
        admins:
          admins
            .filter(
              (admin) =>
                !admin.user.is_bot
            )
            .map(
              toAdmin
            )
      });
    const url =
      `https://t.me/${botUsername}?start=monitor_${token}`;

    const prompt =
      await ctx.reply(
      "Owner verified. Continue setup privately so the report destination stays private.",
      Markup.inlineKeyboard([
        Markup.button.url(
          "Continue in private",
          url
        )
      ])
    );

    setTimeout(
      () =>
        ctx.telegram.deleteMessage(
          ctx.chat.id,
          prompt.message_id
        ).catch(
          () => {}
        ),
      2 * 60 * 1000
    );

    return prompt;
  };

const handleMonitorStart =
  async (
    ctx,
    token
  ) => {
    const setup =
      getPendingSetup(
        ctx.from.id,
        token
      );

    if (
      !setup
    ) {
      return ctx.reply(
        "That monitoring setup link is invalid or expired."
      );
    }

    const prompt =
      await ctx.reply(
      "How often should I send moderator audit reports?",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "Daily",
            `monitor_freq:daily:${token}`
          ),
          Markup.button.callback(
            "Weekly",
            `monitor_freq:weekly:${token}`
          )
        ],
        [
          Markup.button.callback(
            "Bi-weekly",
            `monitor_freq:biweekly:${token}`
          ),
          Markup.button.callback(
            "Monthly",
            `monitor_freq:monthly:${token}`
          )
        ]
      ])
    );

    setTimeout(
      () =>
        ctx.telegram.deleteMessage(
          ctx.chat.id,
          prompt.message_id
        ).catch(
          () => {}
        ),
      2 * 60 * 1000
    );

    return prompt;
  };

const handleMonitorFrequency =
  async (
    ctx,
    frequency,
    token
  ) => {
    const setup =
      getPendingSetup(
        ctx.from.id,
        token
      );

    if (
      !setup
    ) {
      await ctx.answerCbQuery();
      return ctx.reply(
        "That monitoring setup has expired."
      );
    }

    await upsertModeratorMonitor({
      platform:
        "telegram",
      conversationId:
        setup.chatId,
      ownerExternalUserId:
        setup.ownerId,
      ownerUsername:
        setup.ownerUsername,
      reportFrequency:
        frequency,
      admins:
        setup.admins
    });
    addMonitor(
      setup.chatId
    );
    clearPendingSetup(
      ctx.from.id
    );
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(
      undefined
    ).catch(
      () => {}
    );

    return ctx.reply(
      `Moderator monitoring is now active. I will send ${frequency} reports here.`
    );
  };

const handleModeratorReportCommand =
  async (
    ctx
  ) => {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    if (
      member.status !==
      "creator"
    ) {
      return ctx.reply(
        "Only the group owner can request moderator audit reports."
      );
    }

    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );
    const report =
      await generateModeratorReport({
        platform:
          "telegram",
        conversationId:
          String(
            ctx.chat.id
          ),
        ownerExternalUserId:
          String(
            ctx.from.id
          ),
        admins:
          admins
            .filter(
              (admin) =>
                !admin.user.is_bot
            )
            .map(
              toAdmin
            )
      });

    await ctx.telegram.sendMessage(
      ctx.from.id,
      formatModeratorReport(
        report.data
      ),
      {
        parse_mode:
          "HTML"
      }
    );

    if (
      ctx.chat.type ===
      "private"
    ) {
      return;
    }

    return ctx.reply(
      "I sent the current moderator audit report to you privately."
    );
  };

const isModeratorReportRequest =
  (
    text = ""
  ) =>
    /\b(audit|moderator report|moderation report|admin report|staff report|moderators?)\b/i.test(
      text
    ) &&
    /\b(show|give|generate|provide|send|report|audit|last\s+\d+\s*(?:hours?|hrs?|days?))\b/i.test(
      text
    );

module.exports = {
  handleMonitorModeratorsCommand,
  handleMonitorStart,
  handleMonitorFrequency,
  handleModeratorReportCommand,
  isModeratorReportRequest
};
