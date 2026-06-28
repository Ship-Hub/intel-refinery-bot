class MessageStore {
  constructor({
    maxMessages
  }) {
    this.maxMessages =
      maxMessages;
    this.byChat =
      new Map();
  }

  add(message) {
    if (
      !message ||
      message.isBot
    ) {
      return;
    }

    const key =
      String(
        message.chatId
      );
    const bucket =
      this.byChat.get(
        key
      ) || [];

    if (
      bucket.some(
        (item) =>
          item.messageId ===
          message.messageId
      )
    ) {
      return;
    }

    bucket.push(
      message
    );

    bucket.sort(
      (a, b) =>
        a.timestamp -
        b.timestamp
    );

    while (
      bucket.length >
      this.maxMessages
    ) {
      bucket.shift();
    }

    this.byChat.set(
      key,
      bucket
    );
  }

  getLatest(chatId, count) {
    const bucket =
      this.byChat.get(
        String(chatId)
      ) || [];

    return bucket.slice(
      -count
    );
  }

  getSince(chatId, since) {
    const bucket =
      this.byChat.get(
        String(chatId)
      ) || [];

    return bucket.filter(
      (message) =>
        message.timestamp >=
        since
    );
  }

  getRange(
    chatId,
    startId,
    endId
  ) {
    const bucket =
      this.byChat.get(
        String(chatId)
      ) || [];

    const start =
      Number(startId);
    const end =
      Number(endId);
    const low =
      Math.min(
        start,
        end
      );
    const high =
      Math.max(
        start,
        end
      );

    return bucket.filter(
      (message) =>
        Number(message.messageId) >=
          low &&
        Number(message.messageId) <=
          high
    );
  }

  getFrom(
    chatId,
    startId
  ) {
    const bucket =
      this.byChat.get(
        String(chatId)
      ) || [];
    const start =
      Number(
        startId
      );

    return bucket.filter(
      (message) =>
        Number(
          message.messageId
        ) >= start
    );
  }
}

module.exports = {
  MessageStore
};
