require("dotenv").config();

const env =
  require("./config/env");

const {
  logger
} = require(
  "./logging/logger"
);

const {
  createBot
} = require(
  "./bot/createBot"
);

const {
  bot
} = createBot(
  env.BOT_TOKEN
);

bot.launch()
  .then(
    () => {
      logger.info({
        event:
          "bot_started"
      });
    }
  )
  .catch(
    (error) => {
      logger.fatal({
        event:
          "bot_start_failed",
        error:
          error.message
      });
      process.exit(
        1
      );
    }
  );

process.once(
  "SIGINT",
  () =>
    bot.stop(
      "SIGINT"
    )
);

process.once(
  "SIGTERM",
  () =>
    bot.stop(
      "SIGTERM"
    )
);
