const cooldownByChat =
  new Map();
const {
  classifyProactiveConversation
} = require(
  "../api/backendClient"
);

const disputePatterns =
  [
    /\bscam(?:mer)?\b/,
    /\brug(?:ged)?\b/,
    /\bfraud\b/,
    /\bpanic\b/,
    /\beveryone get out\b/,
    /\bget out\b/,
    /\bliar|lied|lying\b/,
    /\baccus(?:e|ed|ation)\b/,
    /\brefund\b/,
    /\bproof\b/,
    /\bevidence\b/,
    /\bthreat(?:en)?\b/
  ];

const getRecentText =
  (
    messages
  ) =>
    messages
      .slice(
        -3
      )
      .map(
        (message) =>
          message.text || ""
      )
      .join(
        "\n"
      )
      .toLowerCase();

const classifyProactiveSignal =
  (
    messages
  ) => {
    const text =
      getRecentText(
        messages
      );
    const latestText =
      String(
        messages.at(
          -1
        )?.text || ""
      ).toLowerCase();

    if (
      /\b(summary|summarize|what happened|give me context|what is going on)\b/.test(
        latestText
      )
    ) {
      return {
        category:
          "summary",
        confidence:
          0.9
      };
    }

    if (
      /\?\s*$/.test(
        latestText
      ) ||
      /\b(lol|lmao|haha|funny)\b/.test(
        latestText
      )
    ) {
      return {
        category:
          "casual_qa",
        confidence:
          0.82
      };
    }

    const disputeHits =
      disputePatterns.filter(
        (pattern) =>
          pattern.test(
            text
          )
      ).length;
    const latestDisputeHit =
      disputePatterns.some(
        (pattern) =>
          pattern.test(
            latestText
          )
      );

    if (
      latestDisputeHit &&
      (
        /\bscam group\b/.test(
          text
        ) ||
        /\brug(?:ged)?\b/.test(
          text
        ) &&
          /\b(get out|everyone get out|i'?m out|i am out)\b/.test(
            text
          )
      )
    ) {
      return {
        category:
          "moderation_triage",
        confidence:
          0.95
      };
    }

    if (
      latestDisputeHit &&
      disputeHits >=
        2 &&
      messages
        .slice(
          -3
        )
        .filter(
          (message) =>
            message.text?.trim()
        ).length >=
        2
    ) {
      return {
        category:
          "moderation_triage",
        confidence:
          Math.min(
            0.95,
            0.7 +
              disputeHits *
                0.08
          )
      };
    }

    return {
      category:
        "casual_qa",
      confidence:
        0
    };
  };

const isOnCooldown =
  (
    chatId,
    now =
      Date.now()
  ) => {
    const previous =
      cooldownByChat.get(
        chatId
      );

    return Boolean(
      previous &&
      now -
        previous <
        5 *
          60 *
          1000
    );
  };

const markProactiveReply =
  (
    chatId,
    now =
      Date.now()
  ) =>
    cooldownByChat.set(
      chatId,
      now
    );

const decideProactiveAction =
  (
    signal,
    conversationalLevel =
      1
  ) => {
    if (
      signal.category ===
        "summary" &&
      signal.confidence >=
        0.9 &&
      conversationalLevel >=
        2
    ) {
      return "summary";
    }

    if (
      signal.category ===
        "moderation_triage" &&
      signal.confidence >=
        0.86
    ) {
      return "moderation_triage";
    }

    if (
      signal.category ===
        "casual_qa" &&
      signal.confidence >=
        0.8 &&
      conversationalLevel >=
        3
    ) {
      return "casual_qa";
    }

    return "observe";
  };

const confirmProactiveAction =
  async ({
    messages,
    localSignal,
    conversationalLevel =
      1
  }) => {
    const response =
      await classifyProactiveConversation({
        messages:
          messages.map(
            (message) => ({
              text:
                message.text || ""
            })
          ),
        localSignal,
        directRequest:
          false,
        conversationalLevel
      });

    return response.data;
  };

module.exports = {
  classifyProactiveSignal,
  isOnCooldown,
  markProactiveReply,
  decideProactiveAction,
  confirmProactiveAction
};
