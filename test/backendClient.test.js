const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const http =
  require("node:http");

process.env.BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "test-token";
process.env.BACKEND_API_KEY =
  "backend-test-key";

test(
  "backend client sends authenticated ingest requests",
  async () => {
    const server =
      http.createServer(
        (req, res) => {
          assert.equal(
            req.url,
            "/api/conversations/ingest"
          );
          assert.equal(
            req.headers["x-api-key"],
            "backend-test-key"
          );

          let body =
            "";
          req.on(
            "data",
            (chunk) => {
              body +=
                chunk;
            }
          );
          req.on(
            "end",
            () => {
              const parsed =
                JSON.parse(
                  body
                );
              assert.equal(
                parsed.platform,
                "telegram"
              );
              assert.equal(
                parsed.messages.length,
                1
              );
              res.writeHead(
                200,
                {
                  "content-type":
                    "application/json"
                }
              );
              res.end(
                JSON.stringify({
                  success:
                    true,
                  data: {
                    conversationId:
                      1,
                    insertedCount:
                      1
                  }
                })
              );
            }
          );
        }
      );

    await new Promise(
      (resolve) =>
        server.listen(
          0,
          resolve
        )
    );

    const address =
      server.address();
    process.env.BACKEND_BASE_URL =
      `http://127.0.0.1:${address.port}`;

    delete require.cache[
      require.resolve(
        "../src/config/env"
      )
    ];
    delete require.cache[
      require.resolve(
        "../src/config/appConfig"
      )
    ];
    delete require.cache[
      require.resolve(
        "../src/api/backendClient"
      )
    ];

    const {
      ingestConversation
    } = require(
      "../src/api/backendClient"
    );

    const result =
      await ingestConversation({
        platform:
          "telegram",
        conversationId:
          "thread",
        messages: [
          {
            messageId:
              "1"
          }
        ]
      });

    assert.equal(
      result.data.insertedCount,
      1
    );

    await new Promise(
      (resolve) =>
        server.close(
          resolve
        )
    );
  }
);

test(
  "backend client sends authenticated URL analysis requests",
  async () => {
    const server =
      http.createServer(
        (req, res) => {
          assert.equal(
            req.url,
            "/api/url/analyze"
          );
          assert.equal(
            req.headers["x-api-key"],
            "backend-test-key"
          );

          let body =
            "";
          req.on(
            "data",
            (chunk) => {
              body +=
                chunk;
            }
          );
          req.on(
            "end",
            () => {
              assert.equal(
                JSON.parse(
                  body
                ).url,
                "https://example.com/case"
              );
              res.writeHead(
                200,
                {
                  "content-type":
                    "application/json"
                }
              );
              res.end(
                JSON.stringify({
                  success:
                    true
                })
              );
            }
          );
        }
      );

    await new Promise(
      (resolve) =>
        server.listen(
          0,
          resolve
        )
    );

    const address =
      server.address();
    process.env.BACKEND_BASE_URL =
      `http://127.0.0.1:${address.port}`;

    delete require.cache[
      require.resolve(
        "../src/config/env"
      )
    ];
    delete require.cache[
      require.resolve(
        "../src/config/appConfig"
      )
    ];
    delete require.cache[
      require.resolve(
        "../src/api/backendClient"
      )
    ];

    const {
      analyzeUrl
    } = require(
      "../src/api/backendClient"
    );

    const result =
      await analyzeUrl(
        "https://example.com/case"
      );

    assert.equal(
      result.success,
      true
    );

    await new Promise(
      (resolve) =>
        server.close(
          resolve
        )
    );
  }
);
