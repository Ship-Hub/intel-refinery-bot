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
  isImageAnalysisRequest
} = require(
  "../src/handlers/captionHandler"
);

test(
  "caption handler detects untagged image analysis requests",
  () => {
    assert.equal(
      isImageAnalysisRequest(
        "Can you analyze this image?"
      ),
      true
    );
    assert.equal(
      isImageAnalysisRequest(
        "holiday photo"
      ),
      false
    );
  }
);
