const splitTelegramMessage =
  (
    text,
    limit =
      3900
  ) => {
    const chunks =
      [];
    let remaining =
      String(
        text || ""
      );

    while (
      remaining.length >
      limit
    ) {
      const splitAt =
        Math.max(
          remaining.lastIndexOf(
            "\n",
            limit
          ),
          remaining.lastIndexOf(
            " ",
            limit
          )
        );
      const end =
        splitAt >
        0
          ? splitAt
          : limit;
      chunks.push(
        remaining.slice(
          0,
          end
        )
      );
      remaining =
        remaining.slice(
          end
        ).trimStart();
    }

    if (
      remaining
    ) {
      chunks.push(
        remaining
      );
    }

    return chunks;
  };

const replyToMessage =
  async (
    ctx,
    text,
    extra = {}
  ) => {
    let lastReply =
      null;
    for (
      const chunk
      of splitTelegramMessage(
        text
      )
    ) {
      lastReply =
        await ctx.reply(
          chunk,
          {
            ...extra,
            reply_parameters: {
              message_id:
                ctx.message?.message_id
            }
          }
        );
    }

    return lastReply;
  };

module.exports = {
  replyToMessage,
  splitTelegramMessage
};
