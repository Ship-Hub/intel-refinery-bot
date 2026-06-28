const { handleOtpCommand } = require("../handlers/otpHandler");

const registerCommands = (bot) => {
  bot.command("otp", handleOtpCommand);
};

module.exports = {
  registerCommands
};
