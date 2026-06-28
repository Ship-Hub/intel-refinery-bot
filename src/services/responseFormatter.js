const {
  escapeHtml
} = require(
  "./telegramFormatter"
);

const formatAnalysis =
  (
    session
  ) => {
    if (
      session.status ===
      "failed"
    ) {
      return "Analysis could not be completed safely. Please try again with a smaller or clearer message set.";
    }

    const result =
      session.result;
    const analysis =
      result?.analysis || {};
    const direction =
      result?.trajectory || {};
    const classification =
      analysis.fudAssessment
        ?.classification;

    return [
      `🧾 <b>Summary</b>\n${escapeHtml(
        analysis.summary ||
          "No summary returned."
      )}`,
      `⚖️ <b>Conflict level:</b> ${escapeHtml(
        analysis.conflictLevel ||
          "unknown"
      )}`,
      direction.overallState &&
      direction.overallState !==
        "neutral"
        ? `📈 <b>Conversation direction:</b> ${escapeHtml(
            direction.overallState
          )}`
        : null,
      classification &&
      ![
        "none",
        "no fud",
        "uncertain"
      ].includes(
        classification.toLowerCase()
      )
        ? `🧠 <b>Risk signal:</b> ${escapeHtml(
            classification
          )}`
        : null,
      `✅ <b>Recommendation</b>\n${escapeHtml(
        analysis.recommendation ||
          "No recommendation returned."
      )}`,
      analysis.missingContext?.length
        ? `❓ <b>Missing context</b>\n- ${analysis.missingContext
            .map(
              escapeHtml
            )
            .join("\n- ")}`
        : null
    ]
      .filter(Boolean)
      .join("\n\n");
  };

module.exports = {
  formatAnalysis
};
