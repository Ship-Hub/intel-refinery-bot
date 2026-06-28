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
  buildImageConversationId
} = require(
  "../src/handlers/imageHandlers"
);

test(
  "image analysis gets a request-scoped conversation id",
  () => {
    assert.equal(
      buildImageConversationId({
        chat: {
          id:
            -1001
        },
        message: {
          message_id:
            77
        }
      }),
      "image:-1001:77"
    );
  }
);
