const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  splitTelegramMessage
} = require(
  "../src/services/telegramReply"
);

test(
  "telegram reply splitter chunks long messages",
  () => {
    const chunks =
      splitTelegramMessage(
        "a".repeat(
          8005
        )
      );

    assert.equal(
      chunks.length,
      3
    );
    assert.ok(
      chunks.every(
        (chunk) =>
          chunk.length <=
          3900
      )
    );
  }
);
