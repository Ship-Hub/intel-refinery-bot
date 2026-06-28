const appConfig =
  require("../config/appConfig");

const {
  sleep
} = require(
  "../utils/sleep"
);

const {
  logger
} = require(
  "../logging/logger"
);

const {
  getAnalysis
} = require(
  "../api/backendClient"
);

const createPollAnalysis =
  ({
    getAnalysisFn = getAnalysis,
    sleepFn = sleep
  } = {}) =>
  async (
    sessionId
  ) => {
    for (
      let attempt = 1;
      attempt <=
      appConfig.limits.maxPollAttempts;
      attempt++
    ) {
      logger.info({
        event:
          "analysis_poll_attempt",
        sessionId,
        attempt
      });

      const response =
        await getAnalysisFn(
          sessionId
        );
      const session =
        response.session;

      if (
        session.status ===
          "completed" ||
        session.status ===
          "failed"
      ) {
        return session;
      }

      if (
        attempt <
        appConfig.limits.maxPollAttempts
      ) {
        await sleepFn(
          appConfig.limits.pollIntervalMs
        );
      }
    }

    throw new Error(
      "Analysis polling timed out"
    );
  };

const pollAnalysis =
  createPollAnalysis();

module.exports = {
  createPollAnalysis,
  pollAnalysis
};
