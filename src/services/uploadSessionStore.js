class UploadSessionStore {
  constructor({
    timeoutMs
  }) {
    this.timeoutMs =
      timeoutMs;
    this.sessions =
      new Map();
  }

  key(
    chatId,
    userId
  ) {
    return `${chatId}:${userId}`;
  }

  create(
    chatId,
    userId
  ) {
    const key =
      this.key(
        chatId,
        userId
      );

    this.clear(
      chatId,
      userId
    );

    const session = {
      chatId,
      userId,
      images: [],
      expiresAt:
        Date.now() +
        this.timeoutMs
    };

    session.timer =
      setTimeout(
        () =>
          this.sessions.delete(
            key
          ),
        this.timeoutMs
      );

    this.sessions.set(
      key,
      session
    );

    return session;
  }

  get(
    chatId,
    userId
  ) {
    return this.sessions.get(
      this.key(
        chatId,
        userId
      )
    ) || null;
  }

  clear(
    chatId,
    userId
  ) {
    const key =
      this.key(
        chatId,
        userId
      );
    const session =
      this.sessions.get(
        key
      );

    if (
      session?.timer
    ) {
      clearTimeout(
        session.timer
      );
    }

    if (
      session?.finalizeTimer
    ) {
      clearTimeout(
        session.finalizeTimer
      );
    }

    this.sessions.delete(
      key
    );
  }

  scheduleFinalize(
    chatId,
    userId,
    delayMs,
    callback
  ) {
    const session =
      this.get(
        chatId,
        userId
      );

    if (
      !session
    ) {
      return;
    }

    if (
      session.finalizeTimer
    ) {
      clearTimeout(
        session.finalizeTimer
      );
    }

    session.finalizeTimer =
      setTimeout(
        () =>
          callback(
            session
          ),
        delayMs
      );
  }
}

module.exports = {
  UploadSessionStore
};
