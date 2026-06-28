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
  formatModeratorReport
} = require(
  "../src/services/moderatorReportWorkflow"
);

test(
  "moderator report formatter includes requested fields",
  () => {
    const text =
      formatModeratorReport({
        admins: [
          {
            externalUserId:
              "42",
            displayName:
              "Ada Lovelace",
            numberOfMessages:
              10,
            escalationCaused:
              1,
            deescalations:
              3,
            behaviourSummary:
              "Calm and helpful.",
            score:
              9
          }
        ]
      });

    assert.match(
      text,
      /Ada Lovelace/
    );
    assert.match(
      text,
      /Messages: 10/
    );
    assert.match(
      text,
      /Score: 9\/10/
    );
  }
);
