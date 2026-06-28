const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const apiDir = process.env.API_DIR || "/var/www/intel-refinery/current/api";
const botEnvPath =
  process.env.BOT_ENV_PATH || "/var/www/intel-refinery-bot/shared/bot.env";

const parseEnvFile = (filePath) => {
  const values = {};
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

const getColumn = async (db, table, column) => {
  const [rows] = await db
    .promise()
    .query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  return rows[0] || null;
};

const hasColumn = async (db, table, column) => Boolean(await getColumn(db, table, column));

const isTextId = (column) => /char|varchar|text/i.test(column?.Type || "");

const main = async () => {
  if (!fs.existsSync(botEnvPath)) {
    throw new Error(`Bot env file not found at ${botEnvPath}`);
  }

  const botEnv = parseEnvFile(botEnvPath);
  const rawApiKey = botEnv.BACKEND_API_KEY;

  if (!rawApiKey) {
    throw new Error("BACKEND_API_KEY is not configured in bot env");
  }

  require(path.join(apiDir, "node_modules", "dotenv")).config({
    path: path.join(apiDir, ".env")
  });

  const db = require(path.join(apiDir, "src", "config", "db"));
  const { hashApiKey } = require(path.join(
    apiDir,
    "src",
    "utils",
    "hashApiKey"
  ));

  const accountIdColumn = await getColumn(db, "accounts", "id");
  const apiKeyIdColumn = await getColumn(db, "api_keys", "id");
  const accountIdIsText = isTextId(accountIdColumn);
  const apiKeyIdIsText = isTextId(apiKeyIdColumn);

  const [existingAccounts] = await db
    .promise()
    .query(
      "SELECT id FROM accounts WHERE organization_name = ? ORDER BY created_at ASC LIMIT 1",
      ["Intel Refinery Bot"]
    );

  let accountId = existingAccounts[0]?.id;

  if (!accountId) {
    if (accountIdIsText) {
      accountId = crypto.randomUUID();
      await db
        .promise()
        .query(
          "INSERT INTO accounts (id, organization_name, role) VALUES (?, ?, ?)",
          [accountId, "Intel Refinery Bot", "owner"]
        );
    } else {
      const [result] = await db
        .promise()
        .query(
          "INSERT INTO accounts (organization_name, role) VALUES (?, ?)",
          ["Intel Refinery Bot", "owner"]
        );
      accountId = result.insertId;
    }
  }

  const apiKeyHash = await hashApiKey(rawApiKey);
  const keyPrefix = rawApiKey.slice(0, 16);
  const hasIsActive = await hasColumn(db, "api_keys", "is_active");
  const hasCreatedBy = await hasColumn(db, "api_keys", "created_by_user_id");
  const hasRevokedAt = await hasColumn(db, "api_keys", "revoked_at");
  const columns = [
    "account_id",
    "name",
    "label",
    "key_prefix",
    "api_key_hash",
    "daily_credit_limit"
  ];
  const values = [
    accountId,
    "Intel Refinery Bot",
    "Intel Refinery Bot",
    keyPrefix,
    apiKeyHash,
    1000
  ];

  if (apiKeyIdIsText) {
    columns.unshift("id");
    values.unshift(crypto.randomUUID());
  }

  if (hasCreatedBy) {
    columns.push("created_by_user_id");
    values.push(null);
  }

  if (hasIsActive) {
    columns.push("is_active");
    values.push(1);
  }

  if (hasRevokedAt) {
    await db
      .promise()
      .query(
        "UPDATE api_keys SET revoked_at = NOW() WHERE account_id = ? AND label = ? AND revoked_at IS NULL",
        [accountId, "Intel Refinery Bot"]
      );
  } else if (hasIsActive) {
    await db
      .promise()
      .query(
        "UPDATE api_keys SET is_active = 0 WHERE account_id = ? AND label = ?",
        [accountId, "Intel Refinery Bot"]
      );
  }

  await db
    .promise()
    .query(
      `INSERT INTO api_keys (${columns.join(", ")}) VALUES (${columns
        .map(() => "?")
        .join(", ")})`,
      values
    );

  await db.promise().end();
  console.log("Seeded backend API key for Intel Refinery Bot.");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
