const parseMentionIntent =
  (
    text,
    botUsername
  ) => {
    if (
      !text
    ) {
      return null;
    }

    const mention =
      `@${botUsername}`;
    const lower =
      text.toLowerCase();

    if (
      !lower.includes(
        mention
      )
    ) {
      return null;
    }

    const mentionPattern =
      new RegExp(
        `@${botUsername}`,
        "i"
      );
    const body =
      text
        .replace(
          mentionPattern,
          ""
        )
        .trim();
    const normalizedBody =
      body.toLowerCase();

    const hasQuestion =
      /\?$/.test(
        normalizedBody
      ) ||
      /^(did|do|does|should|who|what|why|how|was|were|is|are|i'll|ill)\b/.test(
        normalizedBody
      );

    if (
      /summari[sz]e/.test(
        normalizedBody
      )
    ) {
      return {
        type:
          "summary",
        text:
          body
      };
    }

    const audioHistoryMatch =
      normalizedBody.match(
        /analy[sz]e the last (?:(\d+|one) )?audios? sent in this chat/
      );

    if (
      audioHistoryMatch
    ) {
      return {
        type:
          "audio_history",
        count:
          !audioHistoryMatch[1] ||
          audioHistoryMatch[1] ===
          "one"
            ? 1
            : Number(
                audioHistoryMatch[1]
              )
      };
    }

    if (
      normalizedBody.includes(
        "analyze this"
      ) &&
      !/\b(link|website|page|url)\b/.test(
        normalizedBody
      )
    ) {
      return {
        type:
          "message"
      };
    }

    if (
      normalizedBody.includes(
        "analyze from"
      ) ||
      normalizedBody.includes(
        "give your verdict on the chat from"
      )
    ) {
      return {
        type:
          "range",
        text:
          body
      };
    }

    if (
      hasQuestion ||
      normalizedBody.includes(
        "what happened here"
      ) ||
      normalizedBody.includes(
        "analyze this argument"
      )
    ) {
      return {
        type:
          "question",
        text:
          body
      };
    }

    return {
      type:
        "question",
      text:
        body
    };
  };

module.exports = {
  parseMentionIntent
};
