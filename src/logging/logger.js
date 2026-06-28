const pino =
  require("pino");

const env =
  require("../config/env");

const logger =
  pino({
    level:
      env.LOG_LEVEL,
    base: {
      service:
        "disputeanalysis-telegram-bot"
    },
    timestamp:
      pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "token",
        "botToken",
        "apiKey",
        "headers.x-api-key",
        "headers['x-api-key']",
        "config.headers.x-api-key"
      ],
      remove: true
    }
  });

const childForUpdate =
  (
    ctx
  ) =>
    logger.child({
      updateId:
        ctx.update?.update_id,
      chatId:
        ctx.chat?.id,
      userId:
        ctx.from?.id
    });

module.exports = {
  logger,
  childForUpdate
};

