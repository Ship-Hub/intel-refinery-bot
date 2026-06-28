const {
  Markup
} = require(
  "telegraf"
);
const {
  upsertConversationSettings
} = require(
  "../api/backendClient"
);
const {
  setConversationLevel
} = require(
  "../services/conversationLevelRegistry"
);
const {
  replyToMessage
} = require(
  "../services/telegramReply"
);

const canManageConversationLevel =
  async (
    ctx
  ) => {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    return [
      "creator",
      "administrator"
    ].includes(
      member.status
    );
  };

const handleConversationLevelCommand =
  async (
    ctx
  ) => {
    if (
      !await canManageConversationLevel(
        ctx
      )
    ) {
      return replyToMessage(
        ctx,
        "Only group admins can change the conversational level."
      );
    }

    const prompt =
      await replyToMessage(
        ctx,
        "Choose how conversational I should be in this group:",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Level 1",
              `conversation_level:1:${ctx.message.message_id}`
            ),
            Markup.button.callback(
              "Level 2",
              `conversation_level:2:${ctx.message.message_id}`
            ),
            Markup.button.callback(
              "Level 3",
              `conversation_level:3:${ctx.message.message_id}`
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

const handleConversationLevelChoice =
  async (
    ctx,
    level,
    commandMessageId
  ) => {
    if (
      !await canManageConversationLevel(
        ctx
      )
    ) {
      await ctx.answerCbQuery();
      return ctx.reply(
        "Only group admins can change the conversational level."
      );
    }

    await upsertConversationSettings({
      platform:
        "telegram",
      conversationId:
        String(
          ctx.chat.id
        ),
      conversationalLevel:
        Number(
          level
        )
    });
    setConversationLevel(
      ctx.chat.id,
      level
    );
    await ctx.answerCbQuery();
    await ctx.deleteMessage()
      .catch(
        () => {}
      );

    return ctx.telegram.sendMessage(
      ctx.chat.id,
      `Conversational level set to ${level}.`,
      {
        reply_parameters: {
          message_id:
            Number(
              commandMessageId
            )
        }
      }
    );
  };

module.exports = {
  handleConversationLevelCommand,
  handleConversationLevelChoice
};
