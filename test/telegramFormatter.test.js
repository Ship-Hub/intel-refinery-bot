const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  formatTelegramHtml
} = require(
  "../src/services/telegramFormatter"
);

test(
  "telegram formatter converts simple markdown to safe html",
  () => {
    assert.equal(
      formatTelegramHtml(
        "**Bold** __underlined__ and *italic* <tag>"
      ),
      "<b>Bold</b> <u>underlined</u> and <i>italic</i> &lt;tag&gt;"
    );
  }
);
