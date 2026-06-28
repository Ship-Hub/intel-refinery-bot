const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  parseTimeRange,
  parseMessageCount
} = require(
  "../src/parsers/timeRangeParser"
);

const {
  parseMessageLink
} = require(
  "../src/parsers/messageLinkParser"
);

const {
  parseMentionIntent
} = require(
  "../src/parsers/mentionParser"
);

const {
  parseRequestedScope
} = require(
  "../src/parsers/scopeParser"
);

const {
  isLikelyInScope
} = require(
  "../src/parsers/nicheClassifier"
);

test(
  "time parser enforces range caps",
  () => {
    assert.equal(
      parseTimeRange(
        "last 2 hours",
        24
      ).label,
      "2h"
    );
    assert.match(
      parseTimeRange(
        "last 48 hours",
        24
      ).error,
      /24h/
    );
  }
);

test(
  "message link parser handles public and private links",
  () => {
    assert.equal(
      parseMessageLink(
        "https://t.me/group/123"
      ).messageId,
      "123"
    );
    assert.equal(
      parseMessageLink(
        "https://t.me/c/12345/678"
      ).messageId,
      "678"
    );
  }
);

test(
  "mention parser recognizes supported intents",
  () => {
    assert.equal(
      parseMentionIntent(
        "@judgebot summarize last hour",
        "judgebot"
      ).type,
      "summary"
    );
    assert.equal(
      parseMentionIntent(
        "@judgebot should I be worried?",
        "judgebot"
      ).type,
      "question"
    );
    assert.deepEqual(
      parseMentionIntent(
        "@judgebot analyze the last 3 audios sent in this chat",
        "judgebot"
      ),
      {
        type:
          "audio_history",
        count:
          3
      }
    );
    assert.deepEqual(
      parseMentionIntent(
        "@judgebot analyze the last audio sent in this chat",
        "judgebot"
      ),
      {
        type:
          "audio_history",
        count:
          1
      }
    );
    assert.equal(
      parseMentionIntent(
        "@judgebot analyze this link",
        "judgebot"
      ).type,
      "question"
    );
  }
);

test(
  "message count parser supports last-N summaries",
  () => {
    assert.deepEqual(
      parseMessageCount(
        "summarize the last 50 messages in this chat",
        200
      ),
      {
        count:
          50,
        label:
          "last 50 messages"
      }
    );
    assert.match(
      parseMessageCount(
        "last 500 messages",
        200
      ).error,
      /200 message/
    );
  }
);

test(
  "scope parser supports one-link and two-link requests",
  () => {
    assert.deepEqual(
      parseRequestedScope(
        "analyze the chat from here: https://t.me/c/12345/1468"
      ),
      {
        type:
          "from",
        startId:
          "1468"
      }
    );
    assert.deepEqual(
      parseRequestedScope(
        "from https://t.me/c/12345/1468 to https://t.me/c/12345/1474"
      ),
      {
        type:
          "range",
        startId:
          "1468",
        endId:
          "1474"
      }
    );
  }
);

test(
  "niche classifier keeps cheap routing local",
  () => {
    assert.equal(
      isLikelyInScope(
        "Did you think I really did what I am accused of?"
      ),
      true
    );
    assert.equal(
      isLikelyInScope(
        "what is the weather tomorrow?"
      ),
      false
    );
  }
);
