const parseMessageLink =
  (
    value
  ) => {
    const match =
      value.match(
        /^https?:\/\/t\.me\/(?:c\/\d+\/|[^/]+\/)(\d+)$/
      );

    if (
      !match
    ) {
      return null;
    }

    return {
      messageId:
        match[1]
    };
  };

module.exports = {
  parseMessageLink
};
