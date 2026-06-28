const { cleanEnv, str, num } = require("envalid");

const env = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  BOT_USERNAME: str({
    default: "intel_refinery_bot"
  }),
  BACKEND_BASE_URL: str({
    default: "http://127.0.0.1:5000"
  }),
  BACKEND_API_KEY: str(),
  BACKEND_ADMIN_TOKEN: str({
    default: ""
  }),
  LOG_LEVEL: str({
    default: "info"
  }),
  REQUEST_TIMEOUT_MS: num({
    default: 15000
  })
});

module.exports = env;
