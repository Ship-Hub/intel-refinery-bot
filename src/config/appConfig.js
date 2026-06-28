const env = require("./env");

module.exports = {
  bot: {
    username: env.BOT_USERNAME.replace(/^@/, "").toLowerCase()
  },
  backend: {
    baseUrl: env.BACKEND_BASE_URL,
    apiKey: env.BACKEND_API_KEY,
    adminToken: env.BACKEND_ADMIN_TOKEN,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS
  }
};
