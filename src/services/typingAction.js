const withTypingAction =
  async (
    ctx,
    task
  ) => {
    await ctx.telegram?.sendChatAction?.(
      ctx.chat.id,
      "typing"
    )?.catch(
      () => {}
    );
    const interval =
      setInterval(
        () =>
          ctx.telegram?.sendChatAction?.(
            ctx.chat.id,
            "typing"
          )?.catch(
            () => {}
          ),
        4000
      );

    try {
      return await task();
    } finally {
      clearInterval(
        interval
      );
    }
  };

module.exports = {
  withTypingAction
};
