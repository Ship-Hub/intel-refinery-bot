const nicheTerms =
  [
    "accused",
    "accusation",
    "argument",
    "conflict",
    "dispute",
    "judge",
    "verdict",
    "evidence",
    "moderation",
    "moderator",
    "escalat",
    "fud",
    "panic",
    "coordinated",
    "harass",
    "threat",
    "scam",
    "fraud",
    "lied",
    "lying",
    "who is right",
    "who was wrong",
    "what happened",
    "summar",
    "analy"
  ];

const isLikelyInScope =
  (
    text = ""
  ) => {
    const lower =
      text.toLowerCase();

    return nicheTerms.some(
      (term) =>
        lower.includes(
          term
        )
    );
  };

module.exports = {
  isLikelyInScope
};

