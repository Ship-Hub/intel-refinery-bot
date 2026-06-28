const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.BOT_TOKEN = process.env.BOT_TOKEN || "123:test-token";
process.env.BACKEND_API_KEY = "backend-test-key";
process.env.BACKEND_ADMIN_TOKEN = "admin-test-token";

test("backend client sends authenticated OTP requests", async () => {
  const server = http.createServer((req, res) => {
    assert.equal(req.url, "/auth/telegram/request-otp");
    assert.equal(req.method, "POST");
    assert.equal(req.headers["x-api-key"], "backend-test-key");
    assert.equal(req.headers["x-admin-token"], "admin-test-token");

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const parsed = JSON.parse(body);
      assert.equal(parsed.telegramUserId, "42");

      res.writeHead(200, {
        "content-type": "application/json"
      });
      res.end(JSON.stringify({
        success: true,
        data: {
          code: "123456",
          expiresInMinutes: 10
        }
      }));
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  process.env.BACKEND_BASE_URL = `http://127.0.0.1:${address.port}`;

  for (const modulePath of [
    "../src/config/env",
    "../src/config/appConfig",
    "../src/api/backendClient"
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }

  const { requestTelegramOtp } = require("../src/api/backendClient");
  const result = await requestTelegramOtp({
    telegramUserId: "42",
    displayName: "Cap",
    username: "cap"
  });

  assert.equal(result.data.code, "123456");
  await new Promise((resolve) => server.close(resolve));
});
