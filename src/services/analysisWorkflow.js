const {
  ingestConversation,
  queueAnalysis
} = require(
  "../api/backendClient"
);

const {
  pollAnalysis
} = require(
  "./pollAnalysis"
);

const toBackendMessages =
  (
    messages
  ) =>
    messages.map(
      (message) => ({
        messageId:
          message.messageId,
        text:
          message.text,
        timestamp:
          message.timestamp.toISOString(),
        replyTo:
          message.replyTo,
        participant:
          message.participant,
        metadata: {
          source:
            "telegram"
        }
      })
    );

const analyzeMessages =
  async ({
    chatId,
    messages,
    platform =
      "telegram",
    conversationId =
      String(chatId)
  }) => {
    const ingest =
      await ingestConversation({
        platform:
          platform,
        conversationId:
          conversationId,
        messages:
          toBackendMessages(
            messages
          )
      });

    const queued =
      await queueAnalysis({
        conversationId:
          ingest.data.conversationId
      });

    return pollAnalysis(
      queued.data.sessionId
    );
  };

module.exports = {
  analyzeMessages
};
