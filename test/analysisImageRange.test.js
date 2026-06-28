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
  "analysis sends OCR-enriched messages when a range contains images",
  async () => {
    const analysisWorkflowPath =
      require.resolve(
        "../src/services/analysisWorkflow"
      );
    const messageImageWorkflowPath =
      require.resolve(
        "../src/services/messageImageWorkflow"
      );
    const analysisHandlersPath =
      require.resolve(
        "../src/handlers/analysisHandlers"
      );
    const originalAnalysisWorkflow =
      require.cache[
        analysisWorkflowPath
      ];
    const originalMessageImageWorkflow =
      require.cache[
        messageImageWorkflowPath
      ];

    let analyzedMessages;

    require.cache[
      analysisWorkflowPath
    ] = {
      exports: {
        analyzeMessages:
          async ({
            messages
          }) => {
            analyzedMessages =
              messages;

            return {
              data: {
                analysis: {}
              }
            };
          }
      }
    };
    require.cache[
      messageImageWorkflowPath
    ] = {
      exports: {
        enrichMessagesWithImageOcr:
          async (
            _ctx,
            messages
          ) => [
            ...messages,
            {
              ...messages[0],
              messageId:
                "1:ocr:0",
              text:
                "ocr text"
            }
          ]
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
      [
        {
          messageId:
            "1",
          text:
            "hello",
          timestamp:
            new Date(),
          participant: {}
        }
      ]
    );

    assert.equal(
      analyzedMessages.length,
      2
    );
    assert.equal(
      analyzedMessages[1].text,
      "ocr text"
    );

    if (
      originalAnalysisWorkflow
    ) {
      require.cache[
        analysisWorkflowPath
      ] =
        originalAnalysisWorkflow;
    } else {
      delete require.cache[
        analysisWorkflowPath
      ];
    }

    if (
      originalMessageImageWorkflow
    ) {
      require.cache[
        messageImageWorkflowPath
      ] =
        originalMessageImageWorkflow;
    } else {
      delete require.cache[
        messageImageWorkflowPath
      ];
    }
    delete require.cache[
      analysisHandlersPath
    ];
  }
);
