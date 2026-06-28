const {
  parseMessageLink
} = require(
  "./messageLinkParser"
);

const extractLinks =
  (
    text = ""
  ) =>
    text.match(
      /https?:\/\/t\.me\/\S+/g
    ) || [];

const parseRequestedScope =
  (
    text = ""
  ) => {
    const links =
      extractLinks(
        text
      );

    if (
      links.length >= 2
    ) {
      const start =
        parseMessageLink(
          links[0]
        );
      const end =
        parseMessageLink(
          links[1]
        );

      if (
        start &&
        end
      ) {
        return {
          type:
            "range",
          startId:
            start.messageId,
          endId:
            end.messageId
        };
      }
    }

    if (
      links.length === 1
    ) {
      const start =
        parseMessageLink(
          links[0]
        );

      if (
        start
      ) {
        return {
          type:
            "from",
          startId:
            start.messageId
        };
      }
    }

    return null;
  };

module.exports = {
  extractLinks,
  parseRequestedScope
};

