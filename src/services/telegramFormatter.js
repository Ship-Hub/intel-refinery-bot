const escapeHtml =
  (
    text = ""
  ) =>
    text
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      );

const formatTelegramHtml =
  (
    text = ""
  ) => {
    const escaped =
      escapeHtml(
        text
      );

    return escaped
      .replace(
        /\*\*(.+?)\*\*/g,
        "<b>$1</b>"
      )
      .replace(
        /__(.+?)__/g,
        "<u>$1</u>"
      )
      .replace(
        /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
        "<i>$1</i>"
      );
  };

const stripHtmlTags =
  (
    text = ""
  ) =>
    text.replace(
      /<\/?(?:b|i|u|code)>/gi,
      ""
    );

module.exports = {
  escapeHtml,
  formatTelegramHtml,
  stripHtmlTags
};
