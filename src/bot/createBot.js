const { Telegraf } = require("telegraf");
const { logger, childForUpdate } = require("../logging/logger");
const { registerCommands } = require("../commands/registerCommands");
const { handleOtpCommand } = require("../handlers/otpHandler");

const createBot = (token) => {
  const bot = new Telegraf(token);

  bot.use(async (ctx, next) => {
    const log = childForUpdate(ctx);
    log.info({
      event: "telegram_update_received"
    });

    if (ctx.from?.is_bot) {
      log.info({
        event: "telegram_update_ignored_bot_sender"
      });
      return;
    }

    return next();
  });

  registerCommands(bot);

  bot.start((ctx) =>
    ctx.reply(
      "Hello. I only provide Intel Refinery login codes now. Use /otp in this private chat to get a one-time login code."
    )
  );

  bot.on("text", async (ctx) => {
    const text = ctx.message?.text || "";
    if (/^\/otp(?:@\w+)?\b/i.test(text)) {
      return handleOtpCommand(ctx);
    }

    return ctx.reply(
      "This bot only supports /otp for Intel Refinery login."
    );
  });

  bot.catch((error, ctx) => {
    childForUpdate(ctx).error({
      event: "telegram_handler_error",
      error: error.message
    });
  });

  bot.telegram.setMyCommands([
    {
      command: "otp",
      description: "Get a one-time Intel Refinery login code"
    }
  ]).catch(() => {});

  logger.info({
    event: "bot_created",
    mode: "otp_only"
  });

  return {
    bot
  };
};

module.exports = {
  createBot
};
