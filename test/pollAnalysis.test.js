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
process.env.MAX_POLL_ATTEMPTS =
  "3";

const {
  createPollAnalysis
} = require(
  "../src/services/pollAnalysis"
);

test(
  "polling stops when analysis completes",
  async () => {
    let calls =
      0;
    const poll =
      createPollAnalysis({
        getAnalysisFn:
          async () => {
            calls++;
            return {
              session: {
                status:
                  calls === 2
                    ? "completed"
                    : "pending"
              }
            };
          },
        sleepFn:
          async () => {}
      });

    const session =
      await poll(
        1
      );

    assert.equal(
      session.status,
      "completed"
    );
    assert.equal(
      calls,
      2
    );
  }
);

test(
  "polling times out after bounded attempts",
  async () => {
    const poll =
      createPollAnalysis({
        getAnalysisFn:
          async () => ({
            session: {
              status:
                "pending"
            }
          }),
        sleepFn:
          async () => {}
      });

    await assert.rejects(
      () => poll(1),
      /timed out/
    );
  }
);

