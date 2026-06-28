const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  UploadSessionStore
} = require(
  "../src/services/uploadSessionStore"
);

const {
  sleep
} = require(
  "../src/utils/sleep"
);

test(
  "upload sessions are scoped and expire automatically",
  async () => {
    const sessions =
      new UploadSessionStore({
        timeoutMs: 20
      });

    sessions.create(
      1,
      2
    );

    assert.ok(
      sessions.get(
        1,
        2
      )
    );
    assert.equal(
      sessions.get(
        1,
        3
      ),
      null
    );

    await sleep(
      30
    );

    assert.equal(
      sessions.get(
        1,
        2
      ),
      null
    );
  }
);

