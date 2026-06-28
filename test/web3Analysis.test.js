const test =
  require("node:test");
const assert =
  require("node:assert/strict");

process.env.BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "test-token";
process.env.BACKEND_API_KEY =
  process.env.BACKEND_API_KEY ||
  "test-key";

const {
  extractEvmAddresses,
  detectChainId,
  detectExplicitChainId,
  isWeb3Intent,
  isWeb3WalletTokenRequest,
  parseWeb3WalletTokenRequest,
  getWeb3WalletTokenMissingFields,
  buildWeb3ClarifyingQuestion,
  formatWalletTokenAnalysis
} = require(
  "../src/handlers/analysisHandlers"
);

test(
  "web3 request parser detects wallet and token checks",
  () => {
    const text =
      "Check if wallet 0x1111111111111111111111111111111111111111 dumped token 0x2222222222222222222222222222222222222222 on bsc";

    assert.deepEqual(
      extractEvmAddresses(
        text
      ),
      [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222"
      ]
    );
    assert.equal(
      detectChainId(
        text
      ),
      "56"
    );
    assert.equal(
      detectExplicitChainId(
        text
      ),
      "56"
    );
    assert.equal(
      isWeb3WalletTokenRequest(
        text
      ),
      true
    );
  }
);

test(
  "web3 clarification detects missing token and chain",
  () => {
    const request =
      parseWeb3WalletTokenRequest(
        "Did this wallet dump 0x1111111111111111111111111111111111111111?"
      );
    const missing =
      getWeb3WalletTokenMissingFields(
        request
      );

    assert.equal(
      isWeb3Intent(
        "Did this wallet dump 0x1111111111111111111111111111111111111111?"
      ),
      true
    );
    assert.deepEqual(
      missing,
      [
        "token contract address",
        "chain"
      ]
    );
    assert.match(
      buildWeb3ClarifyingQuestion(
        missing
      ),
      /token contract address and chain/
    );
  }
);

test(
  "web3 clarification merges follow-up chain and token",
  () => {
    const first =
      parseWeb3WalletTokenRequest(
        "Check wallet 0x1111111111111111111111111111111111111111"
      );
    const second =
      parseWeb3WalletTokenRequest(
        "BSC token contract 0x2222222222222222222222222222222222222222",
        first
      );

    assert.deepEqual(
      second,
      {
        walletAddress:
          "0x1111111111111111111111111111111111111111",
        tokenContractAddress:
          "0x2222222222222222222222222222222222222222",
        chainId:
          "56"
      }
    );
    assert.deepEqual(
      getWeb3WalletTokenMissingFields(
        second
      ),
      []
    );
  }
);

test(
  "web3 analysis formatter summarizes holding and outgoing transfers",
  () => {
    const formatted =
      formatWalletTokenAnalysis({
        data: {
          chain: {
            name:
              "Ethereum"
          },
          walletAddress:
            "0x1111111111111111111111111111111111111111",
          token: {
            symbol:
              "ABC",
            name:
              "ABC Token"
          },
          currentBalance: {
            formatted:
              "100",
            symbol:
              "ABC"
          },
          transferTotals: {
            incoming: {
              formatted:
                "1000",
              count:
                1
            },
            outgoing: {
              formatted:
                "900",
              count:
                2
            }
          },
          assessment:
            "The wallet moved most tokens out.",
          recentOutgoingTransfers: [
            {
              timestamp:
                "2026-05-19T00:00:00.000Z",
              to:
                "0x2222222222222222222222222222222222222222",
              hash:
                "0xabc"
            }
          ]
        }
      });

    assert.match(
      formatted,
      /Current balance: 100 ABC/
    );
    assert.match(
      formatted,
      /moved most tokens out/
    );
  }
);
