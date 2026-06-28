const {
  askQuestion
} = require(
  "../api/backendClient"
);

const hasImageAttachment =
  (
    message
  ) =>
    Boolean(
      message.raw?.photo?.length ||
      message.raw?.document?.mime_type
        ?.startsWith(
          "image/"
        )
    );

const isBotCommandText =
  (
    text = ""
  ) =>
    /^\/(?:analyze|summary|analyze_time|analyze_range|analyze_message|analyze_reply|analyze_image|analyze_audio|monitor_moderators|moderator_report|conversation_level)(?:@\w+)?\b/i.test(
      text.trim()
    );

const formatContextMessage =
  (
    message
  ) => {
    const author =
      message.participant?.username ||
      "Unknown";
    const text =
      message.text?.trim();
    const imageLabel =
      hasImageAttachment(
        message
      )
        ? "[image attached]"
        : "";

    return `${author}: ${[
      imageLabel,
      text
    ]
      .filter(Boolean)
      .join(" ")}`.trim();
  };

const buildContextBlock =
  (
    messages = [],
    maxLength =
      4000
  ) =>
    messages
      .slice(
        -40
      )
      .filter(
        (message) =>
          !isBotCommandText(
            message.text ||
              ""
          )
      )
      .map(
        formatContextMessage
      )
      .filter(Boolean)
      .join("\n")
      .slice(
        0,
        maxLength
      );

const askContextualQuestion =
  async ({
    ctx,
    question,
    messages
  }) => {
    const questionText =
      String(
        question || ""
      );
    const instructionLines =
      [
        "Answer the user's actual question directly.",
        "Speak as the bot in first person. Say I, me, and my capabilities; do not refer to @dispute_analyzer_bot or the bot as a separate third-party system.",
        "Do not claim that a tool action is running or completed unless the surrounding bot workflow has actually invoked that tool.",
        "Use conversation context only when the question is about the conversation, dispute, members, or prior messages.",
        "If the question is general knowledge or unrelated to the chat, answer it normally instead of pretending the chat context is required.",
        "Do not make confident claims about time-sensitive real-world facts such as current presidents, weather, prices, schedules, or recent news unless they are supplied in context. Say you cannot verify live facts from chat context.",
        "If the user asks what the bot can access, say it can use messages it has observed since being added plus messages included in requested ranges; do not claim it only sees mentions.",
        "The bot can summarize by time range, message count, or Telegram message links; analyze replies; analyze web links; analyze images visually and through visible text; analyze voice notes; monitor moderators when configured by a group owner; generate owner-only moderator audit reports; and answer contextual questions.",
        "Be willing to do supported tasks when asked, but never claim that permission-protected actions are complete unless the bot workflow has verified access.",
        "Moderator audit setup and audit report generation require the Telegram group owner check. Moderator reports must be sent privately to the verified owner, not disclosed in the group.",
        "For scam, rug, fraud, or panic claims, do not amplify accusations as facts. Briefly separate allegation from evidence, ask for the concrete transaction or proof, and de-escalate.",
        "Return plain text only. Do not emit HTML or Markdown formatting.",
        "The bot can analyze uploaded or replied-to images before text analysis.",
        "Never mention OCR in user-facing replies. Say visible text if that distinction matters.",
        "If the context shows an image was attached but its extracted text is not present, say that the image itself still needs to be analyzed rather than claiming the bot cannot analyze images."
      ];
    const promptScaffoldLength =
      [
        ...instructionLines,
        "",
        "Conversation context:",
        "",
        "",
        `User question: ${questionText}`
      ].join(
        "\n"
      ).length;
    const maxPayloadLength =
      18000;
    const contextBudget =
      Math.max(
        0,
        maxPayloadLength -
          promptScaffoldLength
      );
    const context =
      buildContextBlock(
        messages,
        contextBudget
      );

    return askQuestion({
      platform:
        "telegram",
      chatId:
        String(
          ctx.chat.id
        ),
      userId:
        String(
          ctx.from.id
        ),
      username:
        ctx.from.username ||
        null,
      userQuestion:
        questionText,
      message:
        [
          ...instructionLines,
          "",
          "Conversation context:",
          context ||
            "(no accessible context)",
          "",
          `User question: ${questionText}`
        ].join("\n")
    });
  };

module.exports = {
  askContextualQuestion,
  buildContextBlock,
  formatContextMessage,
  hasImageAttachment,
  isBotCommandText
};
