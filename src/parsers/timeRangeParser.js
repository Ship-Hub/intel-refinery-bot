const parseTimeRange =
  (
    input,
    maxRangeHours
  ) => {
    const text =
      input.toLowerCase();

    if (
      text.includes(
        "today"
      )
    ) {
      const now =
        new Date();
      const start =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
      return {
        since:
          start,
        label:
          "today"
      };
    }

    const match =
      text.match(
        /last\s+(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/
      ) ||
      text.match(
        /^(\d+)\s*(m|h)$/
      );

    if (
      !match
    ) {
      return null;
    }

    const amount =
      Number(
        match[1]
      );
    const unit =
      match[2];
    const hours =
      unit.startsWith("h")
        ? amount
        : amount / 60;

    if (
      hours >
      maxRangeHours
    ) {
      return {
        error:
          `Range exceeds ${maxRangeHours}h limit`
      };
    }

    return {
      since:
        new Date(
          Date.now() -
            hours *
              60 *
              60 *
              1000
        ),
      label:
        `${amount}${unit.startsWith("h") ? "h" : "m"}`
    };
  };

module.exports = {
  parseTimeRange,
  parseMessageCount
};

function parseMessageCount(
  input = "",
  maxMessages =
    200
) {
  const text =
    input.toLowerCase();
  const match =
    text.match(
      /last\s+(\d+)\s*(?:messages?|msgs?)\b/
    );

  if (
    !match
  ) {
    return null;
  }

  const count =
    Number(
      match[1]
    );

  if (
    !Number.isFinite(
      count
    ) ||
    count <=
      0
  ) {
    return null;
  }

  if (
    count >
    maxMessages
  ) {
    return {
      error:
        `Message count exceeds ${maxMessages} message limit`
    };
  }

  return {
    count,
    label:
      `last ${count} messages`
  };
}
