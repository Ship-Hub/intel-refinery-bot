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
  handleScopedAnalysis
} = require(
  "../src/handlers/analysisHandlers"
);

test(
  "from-scope analysis rejects unavailable start links",
  async () => {
    const replies =
      [];
    await handleScopedAnalysis(
      {
        chat: {
          id:
            1
        },
        reply:
          async (
            text
          ) =>
            replies.push(
              text
            )
      },
      {
        getFrom:
          () => [
            {
              messageId:
                "1512"
            }
          ]
      },
      {
        type:
          "from",
        startId:
          "1511"
      }
    );

    assert.match(
      replies[0],
      /starting message/
    );
  }
);
