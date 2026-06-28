const {
  cleanEnv,
  str,
  num
} = require("envalid");

const env =
  cleanEnv(
    process.env,
    {
      BOT_TOKEN:
        str(),
      BOT_USERNAME:
        str({
          default: "JudgeBot"
        }),
      BACKEND_BASE_URL:
        str({
          default: "http://127.0.0.1:5000"
        }),
      BACKEND_API_KEY:
        str(),
      BACKEND_ADMIN_TOKEN:
        str({
          default:
            ""
        }),
      LOG_LEVEL:
        str({
          default: "info"
        }),
      MAX_MESSAGES:
        num({
          default: 500
        }),
      MAX_RANGE_HOURS:
        num({
          default: 24
        }),
      POLL_INTERVAL_MS:
        num({
          default: 2000
        }),
      MAX_POLL_ATTEMPTS:
        num({
          default: 15
        }),
      REQUEST_TIMEOUT_MS:
        num({
          default: 15000
        }),
      URL_ANALYSIS_REQUEST_TIMEOUT_MS:
        num({
          default: 180000
        }),
      OCR_REQUEST_TIMEOUT_MS:
        num({
          default: 60000
        }),
      IMAGE_ANALYSIS_REQUEST_TIMEOUT_MS:
        num({
          default: 180000
        }),
      AUDIO_REQUEST_TIMEOUT_MS:
        num({
          default: 120000
        }),
      UPLOAD_SESSION_TIMEOUT_MS:
        num({
          default: 120000
        }),
      UPLOAD_SETTLE_DELAY_MS:
        num({
          default: 4000
        }),
      MAX_IMAGES:
        num({
          default: 5
        }),
      MAX_IMAGE_BYTES:
        num({
          default: 5000000
        }),
      MAX_AUDIO_BYTES:
        num({
          default: 5000000
        }),
      MAX_AUDIO_SECONDS:
        num({
          default: 600
        })
    }
  );

module.exports =
  env;
