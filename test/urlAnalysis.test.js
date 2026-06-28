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
  extractExternalUrl,
  formatUrlAnalysis
} = require(
  "../src/handlers/analysisHandlers"
);
const {
  parseMentionIntent
} = require(
  "../src/parsers/mentionParser"
);

test(
  "external URLs are extracted from mention text",
  () => {
    assert.equal(
      extractExternalUrl(
        "analyze this page https://app.example.com/disputes/66 please"
      ),
      "https://app.example.com/disputes/66"
    );
  }
);

test(
  "mention parsing preserves URL casing",
  () => {
    const intent =
      parseMentionIntent(
        "@dispute_analyzer_bot analyze https://example.com/Case/ABC",
        "dispute_analyzer_bot"
      );

    assert.equal(
      intent.text,
      "analyze https://example.com/Case/ABC"
    );
  }
);

test(
  "URL analysis formatting includes image summaries",
  () => {
    const formatted =
      formatUrlAnalysis({
        aiAnalysis: {
          data: {
            summary:
              "Seller claims item was delivered.",
            verdict:
              "Buyer has stronger evidence."
          }
        },
        timeline: [
          "Order placed",
          "Delivery disputed"
        ],
        imageAnalysis: [
          {
            success:
              true,
            analysis: {
              visual_summary:
                "Photo shows a damaged package."
            }
          }
        ]
      });

    assert.match(
      formatted,
      /Buyer has stronger evidence/
    );
    assert.match(
      formatted,
      /Photo shows a damaged package/
    );
  }
);
