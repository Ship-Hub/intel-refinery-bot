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
  "range analysis enrichment appends OCR messages for attached images",
  async () => {
    const imageWorkflowPath =
      require.resolve(
        "../src/services/imageWorkflow"
      );
    const messageImageWorkflowPath =
      require.resolve(
        "../src/services/messageImageWorkflow"
      );
    const originalImageWorkflow =
      require.cache[
        imageWorkflowPath
      ];

    require.cache[
      imageWorkflowPath
    ] = {
      exports: {
        analyzeTelegramImageRichly:
          async (
            _ctx,
            image
          ) => {
            assert.equal(
              image.fileId,
              "image-1"
            );

            return {
              data: {
                ocrText:
                  "invoice total 42",
                visualAnalysis: {
                  is_chat_screenshot:
                    false,
                  visual_summary:
                    "A printed invoice is visible."
                }
              }
            };
          }
      }
    };
    delete require.cache[
      messageImageWorkflowPath
    ];

    const {
      enrichMessagesWithImageOcr
    } = require(
      "../src/services/messageImageWorkflow"
    );

    const messages =
      [
        {
          messageId:
            "7",
          text:
            "please review",
          replyTo:
            null,
          timestamp:
            new Date(
              "2026-05-16T10:00:00.000Z"
            ),
          participant: {
            username:
              "ada"
          },
          raw: {
            photo: [
              {
                file_id:
                  "image-1",
                file_size:
                  100
              }
            ]
          }
        }
      ];

    const enriched =
      await enrichMessagesWithImageOcr(
        {},
        messages
      );

    assert.equal(
      enriched.length,
      2
    );
    assert.equal(
      enriched[1].messageId,
      "7:ocr:0"
    );
    assert.equal(
      enriched[1].replyTo,
      "7"
    );
    assert.equal(
      enriched[1].text,
      'OCR text:\ninvoice total 42\n\nVisual analysis:\n{"is_chat_screenshot":false,"visual_summary":"A printed invoice is visible."}'
    );

    if (
      originalImageWorkflow
    ) {
      require.cache[
        imageWorkflowPath
      ] =
        originalImageWorkflow;
    } else {
      delete require.cache[
        imageWorkflowPath
      ];
    }
    delete require.cache[
      messageImageWorkflowPath
    ];
  }
);
