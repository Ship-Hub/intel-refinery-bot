const test =
  require("node:test");
const assert =
  require("node:assert/strict");
process.env.BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "test-token";
process.env.BACKEND_API_KEY =
  process.env.BACKEND_API_KEY ||
  "test-key";

const {
  isReplyToBot
} = require(
  "../src/handlers/replyHandler"
);

test(
  "reply handler detects replies to bot messages",
  () => {
    assert.equal(
      isReplyToBot({
        message: {
          reply_to_message: {
            from: {
              is_bot:
                true
            }
          }
        }
      }),
      true
    );
  }
);
