const {
  escapeHtml
} = require(
  "./telegramFormatter"
);

const pickKeyText =
  (
    text = ""
  ) =>
    text
      .split(
        /\r?\n/
      )
      .map(
        (line) =>
          line.trim()
      )
      .filter(
        (line) =>
          line.length >=
          8 &&
          !/[=|\\\/]{2,}/.test(
            line
          )
      )
      .filter(
        (
          line,
          index,
          lines
        ) =>
          lines.findIndex(
            (candidate) =>
              candidate.toLowerCase() ===
              line.toLowerCase()
          ) ===
          index
      )
      .sort(
        (
          left,
          right
        ) => {
          const score =
            (line) =>
              /\b(start now|visit|learn more|contact|dexcourt\.com)\b/i.test(
                line
              )
                ? 1
                : 0;

          return score(
            right
          ) -
            score(
              left
            );
        }
      )
      .slice(
        0,
        4
      );

const formatVisualAnalysis =
  (
    result
  ) => {
    const analysis =
      result?.visualAnalysis || {};
    const keyText =
      analysis.user_facing_key_details
        ?.filter(Boolean)
        .slice(
          0,
          4
        ) ||
      (
        analysis.is_chat_screenshot
          ? []
          : pickKeyText(
              result?.ocrText || ""
            )
      );
    const lines =
      [
        analysis.user_facing_summary ||
        analysis.visual_summary
          ? escapeHtml(
              analysis.user_facing_summary ||
                analysis.visual_summary
            )
          : null,
        !analysis.visual_summary &&
        result?.visualError
          ? "The deeper visual interpretation is temporarily unavailable."
          : null,
        keyText.length
          ? ""
          : null,
        keyText.length
          ? "<b>Key points</b>"
          : null,
        ...keyText.map(
          (line) =>
            `- ${escapeHtml(
              line
            )}`
        )
      ].filter(
        (line) =>
          line !== null
      );

    if (
      !lines.length &&
      result?.visualError
    ) {
      return "I could read the image, but the deeper visual interpretation is temporarily unavailable.";
    }

    return lines.join(
      "\n"
    );
  };

module.exports = {
  formatVisualAnalysis,
  pickKeyText
};
