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
        "intel-refinery-telegram-bot"
    },
    timestamp:
      pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "token",
        "botToken",
        "apiKey",
        "adminToken",
        "headers.x-api-key",
        "headers.x-admin-token",
        "headers['x-api-key']",
        "headers['x-admin-token']",
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
