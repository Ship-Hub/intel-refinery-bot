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
  classifyProactiveSignal,
  decideProactiveAction
} = require(
  "../src/services/proactiveResponder"
);

test(
  "proactive responder detects summary and moderation signals",
  () => {
    assert.equal(
      classifyProactiveSignal([
        {
          text:
            "Can someone summarize what happened?"
        }
      ]).category,
      "summary"
    );
    assert.equal(
      classifyProactiveSignal([
        {
          text:
            "This is a scam."
        },
        {
          text:
            "You lied and I have proof."
        }
      ]).category,
      "moderation_triage"
    );
    assert.equal(
      decideProactiveAction({
        category:
          "casual_qa",
        confidence:
          0
      }),
      "observe"
    );
    assert.equal(
      decideProactiveAction(
        {
          category:
            "summary",
          confidence:
            0.95
        },
        1
      ),
      "observe"
    );
    assert.equal(
      decideProactiveAction(
        {
          category:
            "summary",
          confidence:
            0.95
        },
        2
      ),
      "summary"
    );
    assert.equal(
      decideProactiveAction(
        {
          category:
            "casual_qa",
          confidence:
            0.82
        },
        3
      ),
      "casual_qa"
    );
    assert.equal(
      classifyProactiveSignal([
        {
          text:
            "Is this a scam group?"
        },
        {
          text:
            "Rug! Everyone get out! I'm out."
        }
      ]).category,
      "moderation_triage"
    );
    assert.equal(
      classifyProactiveSignal([
        {
          text:
            "Is this a scam group?"
        },
        {
          text:
            "I'm down 90%, maybe it rugged."
        },
        {
          text:
            "Who wants a coffee?"
        }
      ]).category,
      "casual_qa"
    );
  }
);
