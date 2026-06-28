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
  extractAudio,
  validateAudio
} = require(
  "../src/handlers/audioHandlers"
);

test(
  "audio extraction and validation enforce configured caps",
  () => {
    const audio =
      extractAudio({
        voice: {
          file_id:
            "voice-1",
          file_size:
            100,
          duration:
            42
        }
      });

    assert.equal(
      audio.fileId,
      "voice-1"
    );
    assert.equal(
      validateAudio(
        audio
      ),
      null
    );
    assert.match(
      validateAudio({
        ...audio,
        fileSize:
          5000001
      }),
      /5 MB/
    );
    assert.match(
      validateAudio({
        ...audio,
        duration:
          601
      }),
      /10 minutes/
    );
    assert.equal(
      extractAudio({
        media: {
          type:
            "voice",
          fileId:
            "voice-2",
          duration:
            10,
          fileSize:
            50,
          mimeType:
            "audio/ogg"
        }
      }).fileId,
      "voice-2"
    );
  }
);
