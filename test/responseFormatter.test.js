const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  formatAnalysis
} = require(
  "../src/services/responseFormatter"
);

test(
  "formatter omits neutral direction and uncertain risk labels",
  () => {
    const text =
      formatAnalysis({
        status:
          "completed",
        result: {
          trajectory: {
            overallState:
              "neutral"
          },
          analysis: {
            summary:
              "A calm exchange.",
            conflictLevel:
              "low",
            fudAssessment: {
              classification:
                "uncertain"
            },
            recommendation:
              "Ask one follow-up question.",
            missingContext:
              []
          }
        }
      });

    assert.doesNotMatch(
      text,
      /Risk signal/
    );
    assert.doesNotMatch(
      text,
      /Conversation direction/
    );
    assert.match(
      text,
      /<b>Summary<\/b>/
    );
  }
);
