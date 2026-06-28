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
  "analysis failures return a user-facing retry message",
  async () => {
    const analysisWorkflowPath =
      require.resolve(
        "../src/services/analysisWorkflow"
      );
    const analysisHandlersPath =
      require.resolve(
        "../src/handlers/analysisHandlers"
      );
    const originalWorkflow =
      require.cache[
        analysisWorkflowPath
      ];

    require.cache[
      analysisWorkflowPath
    ] = {
      exports: {
        analyzeMessages:
          async () => {
            throw new Error(
              "backend unavailable"
            );
          }
      }
    };
    delete require.cache[
      analysisHandlersPath
    ];

    const {
      analyzeAndReply
    } = require(
      "../src/handlers/analysisHandlers"
    );

    const replies =
      [];
    const ctx = {
      chat: {
        id:
          1
      },
      reply:
        async (
          message
        ) => {
          replies.push(
            message
          );

          return {
            message_id:
              replies.length
          };
        },
      telegram: {
        deleteMessage:
          async () => {}
      }
    };

    await analyzeAndReply(
      ctx,
      []
    );

    assert.deepEqual(
      replies,
      [
        "Processing...",
        "Analysis is temporarily unavailable. Please try again shortly."
      ]
    );

    if (
      originalWorkflow
    ) {
      require.cache[
        analysisWorkflowPath
      ] =
        originalWorkflow;
    } else {
      delete require.cache[
        analysisWorkflowPath
      ];
    }
    delete require.cache[
      analysisHandlersPath
    ];
  }
);
