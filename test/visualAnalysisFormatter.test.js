const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  formatVisualAnalysis
} = require(
  "../src/services/visualAnalysisFormatter"
);

test(
  "visual analysis formatter summarizes image analysis",
  () => {
    const text =
      formatVisualAnalysis({
        ocrText:
          "Paid 250 USDT",
        visualAnalysis: {
          visual_summary:
            "A receipt is shown.",
          notable_observations: [
            "The total is highlighted."
          ],
          safety_signals: [],
          ocr_relevance:
            "The visible total supports the payment claim."
        }
      });

    assert.match(
      text,
      /A receipt is shown\./
    );
    assert.match(
      text,
      /Key points/
    );
    assert.doesNotMatch(
      text,
      /What I can read|What I can see|OCR/
    );
    assert.doesNotMatch(
      text,
      /Why it matters|Notable detail/
    );
  }
);

test(
  "visual analysis formatter explains when visual interpretation is unavailable",
  () => {
    const text =
      formatVisualAnalysis({
        ocrText:
          "Escrow protects payment",
        visualError:
          "401 Invalid API Key"
      });

    assert.match(
      text,
      /temporarily unavailable/
    );
  }
);

test(
  "visual analysis formatter avoids raw screenshot chrome when curated details are absent",
  () => {
    const text =
      formatVisualAnalysis({
        ocrText:
          "100% battery\n< Chats Raptossy ra\nonline > =\nApril 18",
        visualAnalysis: {
          is_chat_screenshot:
            true,
          user_facing_summary:
            "A Telegram screenshot shows a conversation about delayed payment."
        }
      });

    assert.match(
      text,
      /delayed payment/
    );
    assert.doesNotMatch(
      text,
      /battery|Raptossy|April 18|Key points/
    );
  }
);
