const {
  requestTelegramOtp
} = require(
  "../api/backendClient"
);
const {
  replyToMessage
} = require(
  "../services/telegramReply"
);

const handleOtpCommand =
  async (
    ctx
  ) => {
    if (
      ctx.chat.type !==
      "private"
    ) {
      return replyToMessage(
        ctx,
        "For security, use /otp in a private chat with me."
      );
    }

    try {
      const response =
        await requestTelegramOtp({
          telegramUserId:
            String(
              ctx.from.id
            ),
          displayName:
            [
              ctx.from.first_name,
              ctx.from.last_name
            ]
              .filter(Boolean)
              .join(" ") ||
            null,
          username:
            ctx.from.username ||
            null
        });

      return replyToMessage(
        ctx,
        [
          "<b>Your login code</b>",
          "",
          `<code>${response.data.code}</code>`,
          "",
          `This code expires in ${response.data.expiresInMinutes} minutes and can be used once.`
        ].join(
          "\n"
        ),
        {
          parse_mode:
            "HTML"
        }
      );
    } catch {
      return replyToMessage(
        ctx,
        "I could not generate a login code right now. Please try again shortly."
      );
    }
  };

module.exports = {
  handleOtpCommand
};
