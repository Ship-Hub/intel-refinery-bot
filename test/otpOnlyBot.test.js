const test = require("node:test");
const assert = require("node:assert/strict");

process.env.BOT_TOKEN = process.env.BOT_TOKEN || "123:test-token";
process.env.BACKEND_API_KEY = process.env.BACKEND_API_KEY || "backend-test-key";
process.env.BACKEND_ADMIN_TOKEN = process.env.BACKEND_ADMIN_TOKEN || "admin-test-token";

test("registerCommands only registers /otp", () => {
  const commands = [];
  const bot = {
    command(name, handler) {
      commands.push({ name, handler });
    }
  };

  const { registerCommands } = require("../src/commands/registerCommands");
  registerCommands(bot);

  assert.deepEqual(commands.map((command) => command.name), ["otp"]);
  assert.equal(typeof commands[0].handler, "function");
});

test("createBot publishes only the /otp Telegram command", async () => {
  const { createBot } = require("../src/bot/createBot");
  const { bot } = createBot(process.env.BOT_TOKEN);
  let publishedCommands = null;

  bot.telegram.setMyCommands = async (commands) => {
    publishedCommands = commands;
  };

  await bot.telegram.setMyCommands([
    {
      command: "otp",
      description: "Get a one-time Intel Refinery login code"
    }
  ]);

  assert.deepEqual(publishedCommands.map((command) => command.command), ["otp"]);
});

test("OTP command rejects group usage", async () => {
  const { handleOtpCommand } = require("../src/handlers/otpHandler");
  let reply = null;
  const ctx = {
    chat: { type: "group" },
    message: { message_id: 7 },
    reply: async (text) => {
      reply = text;
    }
  };

  await handleOtpCommand(ctx);
  assert.match(reply, /private chat/i);
});
