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
process.env.UPLOAD_SETTLE_DELAY_MS =
  "5";

const {
  UploadSessionStore
} = require(
  "../src/services/uploadSessionStore"
);

const {
  handlePendingUpload
} = require(
  "../src/handlers/imageHandlers"
);

const {
  sleep
} = require(
  "../src/utils/sleep"
);

test(
  "pending image upload batches several images before finalizing",
  async () => {
    const sessions =
      new UploadSessionStore({
        timeoutMs:
          100
      });
    const replies =
      [];
    const ctx = {
      chat: {
        id: 1
      },
      from: {
        id: 2
      },
      message: {
        message_id: 10,
        chat: {
          id: 1,
          type: "group"
        },
        from: {
          id: 2
        },
        date: 1,
        photo: [
          {
            file_id: "a",
            file_size: 1
          }
        ]
      },
      reply:
        async (text) => {
          replies.push(
            text
          );
          return {
            message_id:
              99
          };
        },
      telegram: {
        deleteMessage:
          async () => {}
      }
    };

    sessions.create(
      1,
      2
    );

    await handlePendingUpload(
      ctx,
      sessions
    );

    ctx.message = {
      ...ctx.message,
      message_id: 11,
      photo: [
        {
          file_id: "b",
          file_size: 1
        }
      ]
    };

    await handlePendingUpload(
      ctx,
      sessions
    );

    assert.equal(
      sessions.get(
        1,
        2
      ).images.length,
      2
    );

    await sleep(
      50
    );

    assert.equal(
      sessions.get(
        1,
        2
      ),
      null
    );
    assert.ok(
      replies.length >= 1
    );
  }
);
