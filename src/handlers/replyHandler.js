const {
  handleQuestion,
  handleLinkedScopeSummary
} = require(
  "./analysisHandlers"
);

const isReplyToBot =
  (
    ctx
  ) =>
    Boolean(
      ctx.message
        ?.reply_to_message
        ?.from
        ?.is_bot
    );

const handleReplyToBot =
  async (
    ctx,
    store
  ) => {
    if (
      !isReplyToBot(
        ctx
      ) ||
      !ctx.message.text?.trim()
    ) {
      return false;
    }

    const text =
      ctx.message.text.trim();
    const consumedScope =
      await handleLinkedScopeSummary(
        ctx,
        store,
        text
      );

    if (
      consumedScope
    ) {
      return true;
    }

    await handleQuestion(
      ctx,
      store,
      text,
      {
        showProcessing:
          false
      }
    );
    return true;
  };

module.exports = {
  isReplyToBot,
  handleReplyToBot
};
