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
  "range analysis enrichment appends audio companion messages",
  async () => {
    const audioWorkflowPath =
      require.resolve(
        "../src/services/audioWorkflow"
      );
    const messageAudioWorkflowPath =
      require.resolve(
        "../src/services/messageAudioWorkflow"
      );
    const originalAudioWorkflow =
      require.cache[
        audioWorkflowPath
      ];

    require.cache[
      audioWorkflowPath
    ] = {
      exports: {
        analyzeTelegramAudio:
          async () => ({
            data: {
              transcript:
                "I paid you yesterday.",
              analysis:
                "Speaker claims payment was already made."
            }
          })
      }
    };
    delete require.cache[
      messageAudioWorkflowPath
    ];

    const {
      enrichMessagesWithAudioAnalysis
    } = require(
      "../src/services/messageAudioWorkflow"
    );

    const messages =
      [
        {
          messageId:
            "9",
          text:
            "",
          raw: {
            voice: {
              file_id:
                "voice-1",
              file_size:
                100,
              duration:
                20
            }
          }
        }
      ];

    const enriched =
      await enrichMessagesWithAudioAnalysis(
        {},
        messages
      );

    assert.equal(
      enriched.length,
      2
    );
    assert.match(
      enriched[1].text,
      /Audio transcript/
    );

    if (
      originalAudioWorkflow
    ) {
      require.cache[
        audioWorkflowPath
      ] =
        originalAudioWorkflow;
    } else {
      delete require.cache[
        audioWorkflowPath
      ];
    }
    delete require.cache[
      messageAudioWorkflowPath
    ];
  }
);
