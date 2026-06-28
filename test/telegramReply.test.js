const test = require("node:test");
const assert = require("node:assert/strict");
const { replyToMessage } = require("../src/services/telegramReply");

test("telegram replies target the triggering message", async () => {
  let payload = null;
  const ctx = {
    message: {
      message_id: 42
    },
    reply: async (text, extra) => {
      payload = {
        text,
        extra
      };
    }
  };

  await replyToMessage(ctx, "hello");
  assert.equal(payload.extra.reply_parameters.message_id, 42);
});
