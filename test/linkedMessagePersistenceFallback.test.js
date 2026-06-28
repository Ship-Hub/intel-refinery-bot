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
  "linked message analysis falls back to persisted backend history and answers that message",
  async () => {
    const backendPath =
      require.resolve(
        "../src/api/backendClient"
      );
    const handlerPath =
      require.resolve(
        "../src/handlers/analysisHandlers"
      );
    const questionWorkflowPath =
      require.resolve(
        "../src/services/questionWorkflow"
      );
    const originalBackend =
      require.cache[
        backendPath
      ];
    const originalQuestionWorkflow =
      require.cache[
        questionWorkflowPath
      ];

    require.cache[
      backendPath
    ] = {
      exports: {
        getConversationMessage:
          async () => ({
            data: {
              messageId:
                "1719",
              text:
                "Who most likely poisoned Adrian?",
              timestamp:
                new Date().toISOString(),
              participant: {}
            }
          })
      }
    };
    require.cache[
      questionWorkflowPath
    ] = {
      exports: {
        askContextualQuestion:
          async ({
            question,
            messages
          }) => ({
            data: {
              reply:
                `${question} / ${messages.length}`
            }
          })
      }
    };
    delete require.cache[
      handlerPath
    ];
    const {
      handleLinkedMessageAnalysis
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
      message: {
        message_id:
          2
      },
      reply:
        async (
          text
        ) => {
          replies.push(
            text
          );
          return {
            message_id:
              replies.length
          };
        },
      telegram: {
        deleteMessage:
          async () => {},
        sendChatAction:
          async () => {}
      }
    };

    await handleLinkedMessageAnalysis(
      ctx,
      {
        getRange:
          () => []
      },
      "https://t.me/c/2044059385/1719"
    );

    assert.deepEqual(
      replies,
      [
        "Processing...",
        "Who most likely poisoned Adrian? / 1"
      ]
    );

    if (
      originalBackend
    ) {
      require.cache[
        backendPath
      ] =
        originalBackend;
    } else {
      delete require.cache[
        backendPath
      ];
    }
    if (
      originalQuestionWorkflow
    ) {
      require.cache[
        questionWorkflowPath
      ] =
        originalQuestionWorkflow;
    } else {
      delete require.cache[
        questionWorkflowPath
      ];
    }
    delete require.cache[
      handlerPath
    ];
  }
);
