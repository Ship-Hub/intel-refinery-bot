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
  isPaymentProofIntent,
  parsePaymentProofRequest,
  getPaymentProofMissingFields,
  formatPaymentProofAnalysis
} = require(
  "../src/handlers/analysisHandlers"
);

test(
  "payment proof parser asks for missing recipient and amount",
  () => {
    const text =
      "Verify this payment https://etherscan.io/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa on ethereum";
    const request =
      parsePaymentProofRequest(
        text
      );

    assert.equal(
      isPaymentProofIntent(
        text
      ),
      true
    );
    assert.equal(
      request.txHash,
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    assert.deepEqual(
      getPaymentProofMissingFields(
        request
      ),
      [
        "recipient wallet address",
        "claimed amount"
      ]
    );
  }
);

test(
  "payment proof parser merges follow-up recipient and amount",
  () => {
    const first =
      parsePaymentProofRequest(
        "Verify tx 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa on bsc"
      );
    const second =
      parsePaymentProofRequest(
        "Recipient 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb amount 1.5 BNB",
        first
      );

    assert.equal(
      second.chainId,
      "56"
    );
    assert.equal(
      second.expectedTo,
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    assert.equal(
      second.expectedAmount,
      "1.5"
    );
    assert.deepEqual(
      getPaymentProofMissingFields(
        second
      ),
      []
    );
  }
);

test(
  "payment proof formatter reports verdict and checks",
  () => {
    const formatted =
      formatPaymentProofAnalysis({
        data: {
          verdict:
            "confirmed",
          assessment:
            "The transaction matches the payment claim.",
          chain: {
            name:
              "Ethereum"
          },
          txHash:
            "0xabc",
          transaction: {
            from:
              "0xfrom",
            to:
              "0xto",
            valueNative:
              "0.5",
            status:
              "success"
          },
          checks: {
            successful:
              true,
            toMatches:
              true,
            amountMatches:
              true
          }
        }
      });

    assert.match(
      formatted,
      /Verdict: confirmed/
    );
    assert.match(
      formatted,
      /amountMatches: true/
    );
  }
);
