const withProcessingMessage =
  async (
    ctx,
    task
  ) => {
    const {
      withTypingAction
    } = require(
      "./typingAction"
    );
    const processing =
      await ctx.reply(
        "Processing...",
        {
          reply_parameters: {
            message_id:
              ctx.message?.message_id
          }
        }
      );

    try {
      return await withTypingAction(
        ctx,
        task
      );
    } finally {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          processing.message_id
        );
      } catch {}
    }
  };

module.exports = {
  withProcessingMessage
};
