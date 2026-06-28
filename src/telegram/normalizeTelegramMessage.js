const normalizeTelegramMessage =
  (
    message
  ) => ({
    chatId:
      message.chat.id,
    chatType:
      message.chat.type,
    messageId:
      String(
        message.message_id
      ),
    replyTo:
      message.reply_to_message
        ? String(
            message.reply_to_message
              .message_id
          )
        : null,
    text:
      message.text ||
      message.caption ||
      "",
    timestamp:
      new Date(
        message.date * 1000
      ),
    participant: {
      externalUserId:
        message.from?.id
          ? String(
              message.from.id
            )
          : null,
      username:
        message.from?.username ||
        null,
      displayName:
        [
          message.from?.first_name,
          message.from?.last_name
        ]
          .filter(Boolean)
          .join(" ") ||
        null
    },
    isBot:
      Boolean(
        message.from?.is_bot
      ),
    raw:
      message
  });

module.exports = {
  normalizeTelegramMessage
};
