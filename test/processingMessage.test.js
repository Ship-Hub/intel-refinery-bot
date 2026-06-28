const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  withProcessingMessage
} = require(
  "../src/services/processingMessage"
);

test(
  "processing indicator is deleted after success and failure",
  async () => {
    let deletes =
      0;
    const ctx = {
      chat: {
        id: 1
      },
      reply:
        async () => ({
          message_id: 2
        }),
      telegram: {
        deleteMessage:
          async () => {
            deletes++;
          }
      }
    };

    await withProcessingMessage(
      ctx,
      async () => "ok"
    );

    await assert.rejects(
      () =>
        withProcessingMessage(
          ctx,
          async () => {
            throw new Error(
              "boom"
            );
          }
        ),
      /boom/
    );

    assert.equal(
      deletes,
      2
    );
  }
);
