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
  buildContextBlock,
  isBotCommandText
} = require(
  "../src/services/questionWorkflow"
);

test(
  "question context preserves image-only messages",
  () => {
    const context =
      buildContextBlock([
        {
          participant: {
            username:
              "cap"
          },
          text:
            "",
          raw: {
            photo: [
              {
                file_id:
                  "image"
              }
            ]
          }
        }
      ]);

    assert.equal(
      context,
      "cap: [image attached]"
    );
  }
);

test(
  "question context excludes bot commands",
  () => {
    const context =
      buildContextBlock([
        {
          participant: {
            username:
              "cap"
          },
          text:
            "/analyze@dispute_analyzer_bot",
          raw:
            {}
        },
        {
          participant: {
            username:
              "cap"
          },
          text:
            "Actual conversation text",
          raw:
            {}
        }
      ]);

    assert.equal(
      isBotCommandText(
        "/analyze_image@dispute_analyzer_bot"
      ),
      true
    );
    assert.equal(
      context,
      "cap: Actual conversation text"
    );
  }
);

test(
  "question workflow keeps raw user question separate from the contextual prompt",
  async () => {
    const backendClientPath =
      require.resolve(
        "../src/api/backendClient"
      );
    const workflowPath =
      require.resolve(
        "../src/services/questionWorkflow"
      );
    const originalBackendClient =
      require.cache[
        backendClientPath
      ];
    const originalWorkflow =
      require.cache[
        workflowPath
      ];
    let payload =
      null;

    require.cache[
      backendClientPath
    ] = {
      exports: {
        askQuestion:
          async (
            input
          ) => {
            payload =
              input;

            return {
              reply:
                "ok"
            };
          }
      }
    };
    delete require.cache[
      workflowPath
    ];

    const {
      askContextualQuestion
    } =
      require(
        "../src/services/questionWorkflow"
      );

    await askContextualQuestion({
      ctx: {
        chat: {
          id:
            "chat"
        },
        from: {
          id:
            "user",
          username:
            "cap"
        }
      },
      question:
        "What's the weather in California like?",
      messages: []
    });

    assert.equal(
      payload.userQuestion,
      "What's the weather in California like?"
    );
    assert.match(
      payload.message,
      /Conversation context:/
    );

    if (
      originalBackendClient
    ) {
      require.cache[
        backendClientPath
      ] =
        originalBackendClient;
    } else {
      delete require.cache[
        backendClientPath
      ];
    }

    if (
      originalWorkflow
    ) {
      require.cache[
        workflowPath
      ] =
        originalWorkflow;
    } else {
      delete require.cache[
        workflowPath
      ];
    }
  }
);

test(
  "question context respects the supplied payload budget",
  () => {
    const context =
      buildContextBlock(
        [
          {
            participant: {
              username:
                "cap"
            },
            text:
              "x".repeat(
                500
              ),
            raw:
              {}
          }
        ],
        25
      );

    assert.equal(
      context.length,
      25
    );
  }
);
