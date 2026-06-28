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

test(
  "linked message analysis rejects missing local history cleanly",
  async () => {
    const {
      handleLinkedMessageAnalysis
    } = require(
      "../src/handlers/analysisHandlers"
    );
    const replies =
      [];
    const store = {
      getRange:
        () => []
    };
    const ctx = {
      chat: {
        id:
          1
      },
      reply:
        async (
          message
        ) =>
          replies.push(
            message
          )
    };

    await handleLinkedMessageAnalysis(
      ctx,
      store,
      "https://t.me/c/2044059385/1675"
    );

    assert.deepEqual(
      replies,
      [
        "I do not have that linked message in my accessible history yet."
      ]
    );
  }
);
