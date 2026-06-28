const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  createPendingSetup
} = require(
  "../src/services/monitorSetupStore"
);

test(
  "monitor setup token stays short enough for Telegram callback data",
  () => {
    const token =
      createPendingSetup({
        ownerId:
          "1",
        chatId:
          "2",
        ownerUsername:
          "owner",
        admins: [
          {
            externalUserId:
              "3"
          }
        ]
      });

    assert.ok(
      `monitor_freq:biweekly:${token}`.length <=
        64
    );
  }
);
