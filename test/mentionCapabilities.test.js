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
  isCapabilityQuestion
} = require(
  "../src/handlers/mentionHandler"
);
const {
  isModeratorReportRequest
} = require(
  "../src/handlers/moderatorMonitorHandlers"
);

test(
  "capability questions are recognized locally",
  () => {
    assert.equal(
      isCapabilityQuestion(
        "Can you see all the admins in this group? Can you monitor them?"
      ),
      true
    );
  }
);

test(
  "capability response states owner-only private audit delivery",
  async () => {
    const replies =
      [];
    const handler =
      require(
        "../src/handlers/mentionHandler"
      ).createMentionHandler({
        store: {},
        botUsername:
          "judgebot"
      });

    await handler({
      message: {
        text:
          "@judgebot what can you do?"
      },
      reply: async (
        text
      ) => {
        replies.push(
          text
        );
      }
    });

    assert.match(
      replies[0],
      /group owner check/i
    );
    assert.match(
      replies[0],
      /sent privately to the owner/i
    );
  }
);

test(
  "moderator report requests are recognized locally",
  () => {
    assert.equal(
      isModeratorReportRequest(
        "Show me the audit report for the moderators in this group"
      ),
      true
    );
    assert.equal(
      isModeratorReportRequest(
        "The last 24 hours moderator audit"
      ),
      true
    );
  }
);

test(
  "moderator report command sends report privately and only acknowledges in group",
  async () => {
    const backendClient =
      require(
        "../src/api/backendClient"
      );
    const originalGenerate =
      backendClient.generateModeratorReport;
    backendClient.generateModeratorReport =
      async () => ({
        data: {
          admins: []
        }
      });

    delete require.cache[
      require.resolve(
        "../src/handlers/moderatorMonitorHandlers"
      )
    ];
    const {
      handleModeratorReportCommand
    } = require(
      "../src/handlers/moderatorMonitorHandlers"
    );

    const groupReplies =
      [];
    const privateMessages =
      [];
    await handleModeratorReportCommand({
      chat: {
        id:
          -1001,
        type:
          "supergroup"
      },
      from: {
        id:
          42
      },
      telegram: {
        getChatMember: async () => ({
          status:
            "creator"
        }),
        getChatAdministrators: async () => [
          {
            user: {
              id:
                42,
              is_bot:
                false,
              first_name:
                "Owner"
            }
          }
        ],
        sendMessage: async (
          chatId,
          text
        ) => {
          privateMessages.push({
            chatId,
            text
          });
        }
      },
      reply: async (
        text
      ) => {
        groupReplies.push(
          text
        );
      }
    });

    assert.equal(
      privateMessages[0].chatId,
      42
    );
    assert.match(
      groupReplies[0],
      /privately/i
    );

    backendClient.generateModeratorReport =
      originalGenerate;
    delete require.cache[
      require.resolve(
        "../src/handlers/moderatorMonitorHandlers"
      )
    ];
  }
);
