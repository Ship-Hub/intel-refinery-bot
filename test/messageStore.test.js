const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  MessageStore
} = require(
  "../src/telegram/messageStore"
);

test(
  "message store deduplicates and caps retained messages",
  () => {
    const store =
      new MessageStore({
        maxMessages: 2
      });

    store.add({
      chatId: 1,
      messageId: "1",
      timestamp: new Date(1),
      isBot: false
    });
    store.add({
      chatId: 1,
      messageId: "1",
      timestamp: new Date(1),
      isBot: false
    });
    store.add({
      chatId: 1,
      messageId: "2",
      timestamp: new Date(2),
      isBot: false
    });
    store.add({
      chatId: 1,
      messageId: "3",
      timestamp: new Date(3),
      isBot: false
    });

    assert.deepEqual(
      store.getLatest(1, 5)
        .map((m) => m.messageId),
      ["2", "3"]
    );
  }
);

