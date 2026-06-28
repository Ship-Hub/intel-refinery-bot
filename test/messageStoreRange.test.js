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
  "message store returns messages from a starting id onward",
  () => {
    const store =
      new MessageStore({
        maxMessages:
          10
      });

    for (
      const id
      of [1, 2, 3]
    ) {
      store.add({
        chatId:
          1,
        messageId:
          String(id),
        timestamp:
          new Date(id),
        isBot:
          false
      });
    }

    assert.deepEqual(
      store.getFrom(
        1,
        2
      ).map(
        (m) =>
          m.messageId
      ),
      ["2", "3"]
    );
  }
);
