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

const analysisHandlers =
  require(
    "../src/handlers/analysisHandlers"
  );

const originalHandleUrlAnalysis =
  analysisHandlers.handleUrlAnalysis;

test(
  "mention link request uses recent chat URL when URL is in previous message",
  async () => {
    const called =
      [];
    analysisHandlers.handleUrlAnalysis =
      async (
        _ctx,
        url
      ) => {
        called.push(
          url
        );
      };

    delete require.cache[
      require.resolve(
        "../src/handlers/mentionHandler"
      )
    ];
    const {
      createMentionHandler
    } = require(
      "../src/handlers/mentionHandler"
    );
    const handler =
      createMentionHandler({
        store: {},
        botUsername:
          "dispute_analyzer_bot",
        getRecentExternalUrl:
          () =>
            "https://app.dexcourt.com/disputes/66"
      });

    await handler({
      chat: {
        id:
          -1001
      },
      message: {
        text:
          "@dispute_analyzer_bot analyze this link"
      }
    });

    assert.deepEqual(
      called,
      [
        "https://app.dexcourt.com/disputes/66"
      ]
    );

    analysisHandlers.handleUrlAnalysis =
      originalHandleUrlAnalysis;
    delete require.cache[
      require.resolve(
        "../src/handlers/mentionHandler"
      )
    ];
  }
);
