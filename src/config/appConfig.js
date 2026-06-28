const env =
  require("./env");

module.exports = {
  bot: {
    username:
      env.BOT_USERNAME
        .replace(/^@/, "")
        .toLowerCase()
  },
  backend: {
    baseUrl:
      env.BACKEND_BASE_URL,
    apiKey:
      env.BACKEND_API_KEY,
    adminToken:
      env.BACKEND_ADMIN_TOKEN,
    requestTimeoutMs:
      env.REQUEST_TIMEOUT_MS,
    urlAnalysisRequestTimeoutMs:
      env.URL_ANALYSIS_REQUEST_TIMEOUT_MS,
    ocrRequestTimeoutMs:
      env.OCR_REQUEST_TIMEOUT_MS,
    imageAnalysisRequestTimeoutMs:
      env.IMAGE_ANALYSIS_REQUEST_TIMEOUT_MS,
    audioRequestTimeoutMs:
      env.AUDIO_REQUEST_TIMEOUT_MS
  },
  limits: {
    maxMessages:
      Math.min(
        env.MAX_MESSAGES,
        500
      ),
    maxRangeHours:
      Math.min(
        env.MAX_RANGE_HOURS,
        24
      ),
    maxPollAttempts:
      env.MAX_POLL_ATTEMPTS,
    pollIntervalMs:
      env.POLL_INTERVAL_MS,
    uploadSessionTimeoutMs:
      env.UPLOAD_SESSION_TIMEOUT_MS,
    uploadSettleDelayMs:
      env.UPLOAD_SETTLE_DELAY_MS,
    maxImages:
      Math.min(
        env.MAX_IMAGES,
        5
      ),
    maxImageBytes:
      env.MAX_IMAGE_BYTES,
    maxAudioBytes:
      env.MAX_AUDIO_BYTES,
    maxAudioSeconds:
      env.MAX_AUDIO_SECONDS
  }
};
