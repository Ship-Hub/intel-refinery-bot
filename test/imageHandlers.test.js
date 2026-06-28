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
  extractImage,
  validateImages
} = require(
  "../src/handlers/imageHandlers"
);

test(
  "image extraction chooses the largest photo",
  () => {
    const image =
      extractImage({
        photo: [
          {
            file_id: "small",
            file_size: 10
          },
          {
            file_id: "large",
            file_size: 20
          }
        ]
      });

    assert.equal(
      image.fileId,
      "large"
    );
  }
);

test(
  "direct image analysis no longer depends on conversation analysis",
  async () => {
    const fs =
      require("node:fs");
    const source =
      fs.readFileSync(
        require.resolve(
          "../src/handlers/imageHandlers"
        ),
        "utf8"
      );

    assert.doesNotMatch(
      source,
      /analyzeMessages/
    );
  }
);

test(
  "image validation rejects too many images",
  () => {
    const images =
      Array.from({
        length: 6
      }, () => ({
        mimeType:
          "image/jpeg",
        fileSize:
          1
      }));

    assert.match(
      validateImages(
        images
      ),
      /at most 5/
    );
  }
);
