const appConfig =
  require("../config/appConfig");

const {
  parseTimeRange,
  parseMessageCount
} = require(
  "../parsers/timeRangeParser"
);

const {
  parseMessageLink
} = require(
  "../parsers/messageLinkParser"
);

const {
  parseRequestedScope
} = require(
  "../parsers/scopeParser"
);

const {
  analyzeMessages
} = require(
  "../services/analysisWorkflow"
);

const {
  formatAnalysis
} = require(
  "../services/responseFormatter"
);

const {
  withProcessingMessage
} = require(
  "../services/processingMessage"
);

const {
  askContextualQuestion
} = require(
  "../services/questionWorkflow"
);

const {
  enrichMessagesWithImageOcr
} = require(
  "../services/messageImageWorkflow"
);
const {
  enrichMessagesWithAudioAnalysis
} = require(
  "../services/messageAudioWorkflow"
);
const {
  getConversationMessage,
  getConversationMessages
} = require(
  "../api/backendClient"
);
const {
  analyzeUrl
} = require(
  "../api/backendClient"
);
const {
  analyzeWalletToken
} = require(
  "../api/backendClient"
);
const {
  verifyPaymentProof
} = require(
  "../api/backendClient"
);

const {
  formatTelegramHtml,
  stripHtmlTags
} = require(
  "../services/telegramFormatter"
);
const {
  replyToMessage
} = require(
  "../services/telegramReply"
);
const {
  withTypingAction
} = require(
  "../services/typingAction"
);

const normalizePersistedMessages =
  (
    chatId,
    messages = []
  ) =>
    messages.map(
      (message) => ({
        ...message,
        chatId,
        timestamp:
          new Date(
            message.timestamp
          ),
        isBot:
          false
      })
    );

const ensureMessages =
  async (
    ctx,
    messages
  ) => {
    if (
      !messages.length
    ) {
      await replyToMessage(
        ctx,
        "I do not have enough accessible messages for that request. Add me to the group with message access, or reply to specific messages."
      );
      return false;
    }

    return true;
  };

const clarifyScope =
  (
    ctx
  ) =>
    replyToMessage(
      ctx,
      "I can summarize that. Which span should I use: a time range like <code>last 2 hours</code>, or Telegram links marking the start and end?",
      {
        parse_mode:
          "HTML"
      }
    );

const analyzeAndReply =
  async (
    ctx,
    messages
  ) =>
    withProcessingMessage(
      ctx,
      async () => {
        try {
          const enrichedMessages =
            await enrichMessagesWithImageOcr(
              ctx,
              messages
            );
          const mediaEnrichedMessages =
            await enrichMessagesWithAudioAnalysis(
              ctx,
              enrichedMessages
            );
          const session =
            await analyzeMessages({
              chatId:
                ctx.chat.id,
              messages:
                mediaEnrichedMessages
            });

          await replyToMessage(
            ctx,
            formatAnalysis(
              session
            ),
            {
              parse_mode:
                "HTML"
            }
          );
        } catch {
          await ctx.reply(
            "Analysis is temporarily unavailable. Please try again shortly."
          );
        }
      }
    );

const handleSummary =
  async (
    ctx,
    store,
    input
  ) => {
    const requestedCount =
      parseMessageCount(
        input,
        appConfig.limits.maxMessages
      );

    if (
      requestedCount?.error
    ) {
      return replyToMessage(
        ctx,
        requestedCount.error
      );
    }

    if (
      requestedCount
    ) {
      let messages =
        store.getLatest(
          ctx.chat.id,
          requestedCount.count
        );
      const persisted =
        await getConversationMessages({
          platform:
            "telegram",
          conversationId:
            String(
              ctx.chat.id
            ),
          limit:
            requestedCount.count
        }).catch(
          () => null
        );

      if (
        persisted?.data?.length
      ) {
        messages =
          normalizePersistedMessages(
            ctx.chat.id,
            persisted.data
          );
      }

      if (
        !await ensureMessages(
          ctx,
          messages
        )
      ) {
        return;
      }

      return analyzeAndReply(
        ctx,
        messages.slice(
          -requestedCount.count
        )
      );
    }

    const scope =
      parseRequestedScope(
        input
      );
    if (
      scope?.type ===
      "range"
    ) {
      return handleScopedAnalysis(
        ctx,
        store,
        scope
      );
    }

    if (
      scope?.type ===
      "from"
    ) {
      return handleScopedAnalysis(
        ctx,
        store,
        scope
      );
    }

    if (
      !input?.trim()
    ) {
      return clarifyScope(
        ctx
      );
    }

    const parsed =
      parseTimeRange(
        input,
        appConfig.limits.maxRangeHours
      );

    if (
      parsed?.error
    ) {
      return replyToMessage(
        ctx,
        parsed.error
      );
    }

    if (
      !parsed
    ) {
      const messages =
        store.getLatest(
          ctx.chat.id,
          Math.min(
            appConfig.limits.maxMessages,
            50
          )
        );

      if (
        messages.length
      ) {
        return analyzeAndReply(
          ctx,
          messages
        );
      }

      return clarifyScope(
        ctx
      );
    }

    let messages =
      parsed
        ? store.getSince(
            ctx.chat.id,
            parsed.since
          )
        : store.getLatest(
            ctx.chat.id,
            appConfig.limits.maxMessages
          );
    const persisted =
      await getConversationMessages({
        platform:
          "telegram",
        conversationId:
          String(
            ctx.chat.id
          ),
        since:
          parsed?.since?.toISOString(),
        limit:
          appConfig.limits.maxMessages
      }).catch(
        () => null
      );

    if (
      persisted?.data?.length
    ) {
      messages =
        normalizePersistedMessages(
          ctx.chat.id,
          persisted.data
        );
    }

    if (
      !await ensureMessages(
        ctx,
        messages
      )
    ) {
      return;
    }

    return analyzeAndReply(
      ctx,
      messages
    );
  };

const handleScopedAnalysis =
  async (
    ctx,
    store,
    scope
  ) => {
    const messages =
      scope.type ===
      "range"
        ? store.getRange(
            ctx.chat.id,
            scope.startId,
            scope.endId
          )
        : store.getFrom(
            ctx.chat.id,
            scope.startId
          );

    if (
      scope.type ===
        "from" &&
      messages[0]
        ?.messageId !==
        scope.startId
    ) {
      return replyToMessage(
        ctx,
        "I do not have that starting message in my accessible history, so I cannot reliably summarize from that link yet."
      );
    }

    if (
      !await ensureMessages(
        ctx,
        messages
      )
    ) {
      return;
    }

    return analyzeAndReply(
      ctx,
      messages
    );
  };

const handleMessageAnalysis =
  async (
    ctx
  ) => {
    const target =
      ctx.message
        ?.reply_to_message;

    if (
      !target
    ) {
      return replyToMessage(
        ctx,
        "Reply to the message you want me to analyze, then use /analyze_message."
      );
    }

    const normalized =
      require("../telegram/normalizeTelegramMessage")
        .normalizeTelegramMessage(
          target
        );

    return analyzeAndReply(
      ctx,
      [normalized]
    );
  };

const handleRangeAnalysis =
  async (
    ctx,
    store,
    input
  ) => {
    const scope =
      parseRequestedScope(
        input
      );

    if (
      !scope
    ) {
      return clarifyScope(
        ctx
      );
    }

    return handleScopedAnalysis(
      ctx,
      store,
      scope
    );
  };

const handleQuestion =
  async (
    ctx,
    store,
    question,
    {
      showProcessing =
        true
    } = {}
  ) => {
    const requestedRange =
      parseTimeRange(
        question,
        appConfig.limits.maxRangeHours
      );
    let messages =
      requestedRange &&
      !requestedRange.error
        ? store.getSince(
            ctx.chat.id,
            requestedRange.since
          )
        : store.getLatest(
            ctx.chat.id,
            Math.min(
              appConfig.limits.maxMessages,
              200
            )
          );
    const persisted =
      await getConversationMessages({
        platform:
          "telegram",
        conversationId:
          String(
            ctx.chat.id
          ),
        since:
          requestedRange &&
          !requestedRange.error
            ? requestedRange.since.toISOString()
            : undefined,
        limit:
          Math.min(
            appConfig.limits.maxMessages,
            200
          )
      }).catch(
        () => null
      );

    if (
      persisted?.data?.length
    ) {
      messages =
        normalizePersistedMessages(
          ctx.chat.id,
          persisted.data
        );
    }

    if (
      !await ensureMessages(
        ctx,
        messages
      )
    ) {
      return;
    }

    const task =
      async () => {
        try {
          const answer =
            await askContextualQuestion({
              ctx,
              question,
              messages
            });

          await replyToMessage(
            ctx,
            formatTelegramHtml(
              stripHtmlTags(
                answer.data.reply
              )
            ),
            {
              parse_mode:
                "HTML"
            }
          );
        } catch {
          await replyToMessage(
            ctx,
            "I could not answer that safely right now. Please try again shortly."
          );
        }
      };

    return showProcessing
      ? withProcessingMessage(
          ctx,
          task
        )
      : withTypingAction(
          ctx,
          task
        );
  };

const handleLinkedMessageAnalysis =
  async (
    ctx,
    store,
    link
  ) => {
    const parsed =
      parseMessageLink(
        link
      );

    if (
      !parsed
    ) {
      return null;
    }

    let messages =
      store.getRange(
        ctx.chat.id,
        parsed.messageId,
        parsed.messageId
      );

    if (
      !messages.length
    ) {
      try {
        const persisted =
          await getConversationMessage({
            platform:
              "telegram",
            conversationId:
              String(
                ctx.chat.id
              ),
            messageId:
              parsed.messageId
          });

        if (
          persisted.data
        ) {
          messages = [
            {
              ...persisted.data,
              chatId:
                ctx.chat.id,
              timestamp:
                new Date(
                  persisted.data.timestamp
                ),
              isBot:
                false
            }
          ];
        }
      } catch {}
    }

    if (
      !messages.length
    ) {
      return replyToMessage(
        ctx,
        "I do not have that linked message in my accessible history yet."
      );
    }

    return withProcessingMessage(
      ctx,
      async () => {
        try {
          const answer =
            await askContextualQuestion({
              ctx,
              question:
                messages[0].text,
              messages
            });

          await replyToMessage(
            ctx,
            formatTelegramHtml(
              stripHtmlTags(
                answer.data.reply
              )
            ),
            {
              parse_mode:
                "HTML"
            }
          );
        } catch {
          await replyToMessage(
            ctx,
            "I could not analyze that linked message right now. Please try again shortly."
          );
        }
      }
    );
  };

const looksLikeMessageLink =
  (
    value = ""
  ) =>
    Boolean(
      parseMessageLink(
        value.trim()
      )
    );

const handleLinkedScopeSummary =
  async (
    ctx,
    store,
    text
  ) => {
    const scope =
      parseRequestedScope(
        text
      );

    if (
      !scope
    ) {
      return false;
    }

    await handleScopedAnalysis(
      ctx,
      store,
      scope
    );
    return true;
  };

const extractExternalUrl =
  (
    value = ""
  ) =>
    value.match(
      /https?:\/\/[^\s<>()]+/i
    )?.[0] ||
    null;

const extractEvmAddresses =
  (
    value = ""
  ) =>
    [
      ...new Set(
        value.match(
          /0x[a-fA-F0-9]{40}/g
        ) || []
      )
    ];

const detectChainId =
  (
    value = ""
  ) => {
    const text =
      value.toLowerCase();

    if (
      /\b(bsc|bnb|bscscan)\b/.test(
        text
      )
    ) {
      return "56";
    }

    if (
      /\bpolygon|polygonscan\b/.test(
        text
      )
    ) {
      return "137";
    }

    if (
      /\bbase|basescan\b/.test(
        text
      )
    ) {
      return "8453";
    }

    if (
      /\barbitrum|arbiscan\b/.test(
        text
      )
    ) {
      return "42161";
    }

    return "1";
  };

const detectExplicitChainId =
  (
    value = ""
  ) => {
    const text =
      value.toLowerCase();

    if (
      /\b(eth|ethereum|etherscan)\b/.test(
        text
      )
    ) {
      return "1";
    }

    if (
      /\b(bsc|bnb|bscscan)\b/.test(
        text
      )
    ) {
      return "56";
    }

    if (
      /\bpolygon|polygonscan\b/.test(
        text
      )
    ) {
      return "137";
    }

    if (
      /\bbase|basescan\b/.test(
        text
      )
    ) {
      return "8453";
    }

    if (
      /\barbitrum|arbiscan\b/.test(
        text
      )
    ) {
      return "42161";
    }

    return null;
  };

const isWeb3WalletTokenRequest =
  (
    value = ""
  ) =>
    /\b(wallet|token|etherscan|bscscan|polygonscan|basescan|arbiscan|dump|dumping|sold|sell|holding|hold|team)\b/i.test(
      value
    ) &&
    extractEvmAddresses(
      value
    ).length >=
      2;

const isWeb3Intent =
  (
    value = ""
  ) =>
    /\b(wallet|token|contract|etherscan|bscscan|polygonscan|basescan|arbiscan|dump|dumping|sold|sell|holding|hold|team|trace|transaction|on-chain|onchain)\b/i.test(
      value
    ) &&
    (
      extractEvmAddresses(
        value
      ).length >
        0 ||
      /\b(dump|dumping|sold|sell|holding|hold|team wallet|trace wallet|token contract)\b/i.test(
        value
      )
    );

const extractTxHash =
  (
    value = ""
  ) =>
    value.match(
      /0x[a-fA-F0-9]{64}/
    )?.[0] ||
    null;

const extractNativeAmount =
  (
    value = ""
  ) =>
    value.match(
      /\b(\d+(?:\.\d+)?)\s*(?:eth|bnb|matic|base eth|arb eth)\b/i
    )?.[1] ||
    null;

const isPaymentProofIntent =
  (
    value = ""
  ) =>
    /\b(payment|paid|pay|sent|transfer|tx|transaction|etherscan|bscscan|basescan|polygonscan|proof|influencer)\b/i.test(
      value
    ) &&
    Boolean(
      extractTxHash(
        value
      ) ||
      /\/tx\/0x[a-fA-F0-9]{64}/.test(
        value
      )
    );

const pendingPaymentProofs =
  new Map();

const paymentPendingKey =
  (
    ctx
  ) =>
    `${ctx.chat?.id || "unknown"}:${ctx.from?.id || "unknown"}`;

const getPendingPaymentProof =
  (
    ctx
  ) => {
    const pending =
      pendingPaymentProofs.get(
        paymentPendingKey(
          ctx
        )
      );

    if (
      !pending
    ) {
      return null;
    }

    if (
      Date.now() -
        pending.updatedAt >
      10 *
        60 *
        1000
    ) {
      pendingPaymentProofs.delete(
        paymentPendingKey(
          ctx
        )
      );
      return null;
    }

    return pending;
  };

const setPendingPaymentProof =
  (
    ctx,
    request
  ) =>
    pendingPaymentProofs.set(
      paymentPendingKey(
        ctx
      ),
      {
        ...request,
        updatedAt:
          Date.now()
      }
    );

const clearPendingPaymentProof =
  (
    ctx
  ) =>
    pendingPaymentProofs.delete(
      paymentPendingKey(
        ctx
      )
    );

const hasPendingPaymentProof =
  (
    ctx
  ) =>
    Boolean(
      getPendingPaymentProof(
        ctx
      )
    );

const parsePaymentProofRequest =
  (
    text = "",
    previous =
      {}
  ) => {
    const addresses =
      extractEvmAddresses(
        text.replace(
          /0x[a-fA-F0-9]{64}/g,
          ""
        )
      );
    const request =
      {
        txHash:
          extractTxHash(
            text
          ) ||
          previous.txHash ||
          null,
        chainId:
          detectExplicitChainId(
            text
          ) ||
          previous.chainId ||
          null,
        expectedFrom:
          previous.expectedFrom ||
          null,
        expectedTo:
          previous.expectedTo ||
          null,
        expectedAmount:
          extractNativeAmount(
            text
          ) ||
          previous.expectedAmount ||
          null
      };

    if (
      addresses.length >=
      2
    ) {
      request.expectedFrom =
        addresses[0];
      request.expectedTo =
        addresses[1];
    } else if (
      addresses.length ===
      1
    ) {
      const lower =
        text.toLowerCase();

      if (
        /\b(to|recipient|receiver|influencer)\b/.test(
          lower
        )
      ) {
        request.expectedTo =
          addresses[0];
      } else if (
        /\b(from|sender|payer)\b/.test(
          lower
        )
      ) {
        request.expectedFrom =
          addresses[0];
      } else if (
        !request.expectedTo
      ) {
        request.expectedTo =
          addresses[0];
      } else if (
        !request.expectedFrom
      ) {
        request.expectedFrom =
          addresses[0];
      }
    }

    return request;
  };

const getPaymentProofMissingFields =
  (
    request
  ) =>
    [
      request.txHash
        ? null
        : "transaction hash or explorer transaction link",
      request.chainId
        ? null
        : "chain",
      request.expectedTo
        ? null
        : "recipient wallet address",
      request.expectedAmount
        ? null
        : "claimed amount"
    ].filter(Boolean);

const buildPaymentProofClarifyingQuestion =
  (
    missing
  ) =>
    `I can verify that payment proof on-chain. Please send the ${missing.join(
      " and "
    )}. For now I verify native payments like ETH, BNB, MATIC, or Base ETH.`;

const formatPaymentProofAnalysis =
  (
    response
  ) => {
    const data =
      response?.data ||
      response;

    return [
      `Verdict: ${data.verdict}`,
      data.assessment,
      "",
      `Chain: ${data.chain?.name || data.chain?.id || "Unknown"}`,
      `Transaction: ${data.txHash}`,
      `From: ${data.transaction?.from}`,
      `To: ${data.transaction?.to}`,
      `Amount: ${data.transaction?.valueNative}`,
      `Status: ${data.transaction?.status}`,
      "",
      "Checks:",
      ...Object.entries(
        data.checks ||
          {}
      ).map(
        ([
          key,
          value
        ]) =>
          `- ${key}: ${value}`
      )
    ].join(
      "\n"
    );
  };

const handlePaymentProofAnalysis =
  async (
    ctx,
    text
  ) => {
    const request =
      parsePaymentProofRequest(
        text,
        getPendingPaymentProof(
          ctx
        ) ||
          {}
      );
    const missing =
      getPaymentProofMissingFields(
        request
      );

    if (
      missing.length
    ) {
      setPendingPaymentProof(
        ctx,
        request
      );
      return replyToMessage(
        ctx,
        buildPaymentProofClarifyingQuestion(
          missing
        )
      );
    }

    clearPendingPaymentProof(
      ctx
    );

    try {
      const result =
        await verifyPaymentProof(
          request
        );

      return replyToMessage(
        ctx,
        formatTelegramHtml(
          stripHtmlTags(
            formatPaymentProofAnalysis(
              result
            )
          )
        ),
        {
          parse_mode:
            "HTML"
        }
      );
    } catch (
      error
    ) {
      return replyToMessage(
        ctx,
        `I could not verify that payment proof right now: ${error.response?.data?.error || error.message}`
      );
    }
  };

const pendingWeb3Requests =
  new Map();

const web3PendingKey =
  (
    ctx
  ) =>
    `${ctx.chat?.id || "unknown"}:${ctx.from?.id || "unknown"}`;

const getPendingWeb3Request =
  (
    ctx
  ) => {
    const key =
      web3PendingKey(
        ctx
      );
    const pending =
      pendingWeb3Requests.get(
        key
      );

    if (
      !pending
    ) {
      return null;
    }

    if (
      Date.now() -
        pending.updatedAt >
      10 *
        60 *
        1000
    ) {
      pendingWeb3Requests.delete(
        key
      );
      return null;
    }

    return pending;
  };

const setPendingWeb3Request =
  (
    ctx,
    request
  ) =>
    pendingWeb3Requests.set(
      web3PendingKey(
        ctx
      ),
      {
        ...request,
        updatedAt:
          Date.now()
      }
    );

const clearPendingWeb3Request =
  (
    ctx
  ) =>
    pendingWeb3Requests.delete(
      web3PendingKey(
        ctx
      )
    );

const hasPendingWeb3Request =
  (
    ctx
  ) =>
    Boolean(
      getPendingWeb3Request(
        ctx
      )
    );

const parseWeb3WalletTokenRequest =
  (
    text = "",
    previous =
      {}
  ) => {
    const addresses =
      extractEvmAddresses(
        text
      );
    const explicitChainId =
      detectExplicitChainId(
        text
      );
    const request =
      {
        walletAddress:
          previous.walletAddress ||
          null,
        tokenContractAddress:
          previous.tokenContractAddress ||
          null,
        chainId:
          explicitChainId ||
          previous.chainId ||
          null
      };

    if (
      addresses.length >=
      2
    ) {
      request.walletAddress =
        addresses[0];
      request.tokenContractAddress =
        addresses[1];
      return request;
    }

    if (
      addresses.length ===
      1
    ) {
      const address =
        addresses[0];
      const lower =
        text.toLowerCase();

      if (
        request.walletAddress &&
        !request.tokenContractAddress
      ) {
        request.tokenContractAddress =
          address;
      } else if (
        request.tokenContractAddress &&
        !request.walletAddress
      ) {
        request.walletAddress =
          address;
      } else if (
        /\b(token|contract)\b/.test(
          lower
        ) &&
        !/\bwallet\b/.test(
          lower
        )
      ) {
        request.tokenContractAddress =
          address;
      } else {
        request.walletAddress =
          address;
      }
    }

    return request;
  };

const getWeb3WalletTokenMissingFields =
  (
    request
  ) =>
    [
      request.walletAddress
        ? null
        : "wallet address",
      request.tokenContractAddress
        ? null
        : "token contract address",
      request.chainId
        ? null
        : "chain"
    ].filter(Boolean);

const buildWeb3ClarifyingQuestion =
  (
    missing
  ) =>
    `I can check that on-chain. Please send the ${missing.join(
      " and "
    )}. Supported chains right now: Ethereum, BSC, Base, Polygon, and Arbitrum.`;

const formatWalletTokenAnalysis =
  (
    response
  ) => {
    const data =
      response?.data ||
      response;
    const outgoing =
      data?.transferTotals?.outgoing;
    const incoming =
      data?.transferTotals?.incoming;
    const outgoingTransfers =
      data?.recentOutgoingTransfers ||
      [];

    return [
      `Chain: ${data.chain?.name || data.chain?.id || "Unknown"}`,
      `Wallet: ${data.walletAddress}`,
      `Token: ${data.token?.symbol || "token"}${data.token?.name ? ` (${data.token.name})` : ""}`,
      `Current balance: ${data.currentBalance?.formatted || "0"} ${data.currentBalance?.symbol || ""}`.trim(),
      incoming
        ? `Incoming total: ${incoming.formatted} ${data.currentBalance?.symbol || ""} across ${incoming.count} transfer(s)`.trim()
        : null,
      outgoing
        ? `Outgoing total: ${outgoing.formatted} ${data.currentBalance?.symbol || ""} across ${outgoing.count} transfer(s)`.trim()
        : null,
      "",
      data.assessment,
      outgoingTransfers.length
        ? ""
        : null,
      outgoingTransfers.length
        ? "Recent outgoing transfers:"
        : null,
      ...outgoingTransfers
        .slice(
          0,
          3
        )
        .map(
          (transfer) =>
            `- ${transfer.timestamp || "unknown time"} to ${transfer.to} (${transfer.hash})`
        )
    ]
      .filter(
        (line) =>
          line !== null &&
          line !== undefined
      )
      .join(
        "\n"
      );
  };

const handleWalletTokenAnalysis =
  async (
    ctx,
    text
  ) => {
    const request =
      parseWeb3WalletTokenRequest(
        text,
        getPendingWeb3Request(
          ctx
        ) ||
          {}
      );
    const missing =
      getWeb3WalletTokenMissingFields(
        request
      );

    if (
      missing.length
    ) {
      setPendingWeb3Request(
        ctx,
        request
      );
      return replyToMessage(
        ctx,
        buildWeb3ClarifyingQuestion(
          missing
        )
      );
    }

    clearPendingWeb3Request(
      ctx
    );

    try {
      const result =
        await analyzeWalletToken({
          chainId:
            request.chainId,
          walletAddress:
            request.walletAddress,
          tokenContractAddress:
            request.tokenContractAddress,
          transferLimit:
            100
        });

      return replyToMessage(
        ctx,
        formatTelegramHtml(
          stripHtmlTags(
            formatWalletTokenAnalysis(
              result
            )
          )
        ),
        {
          parse_mode:
            "HTML"
        }
      );
    } catch (
      error
    ) {
      return replyToMessage(
        ctx,
        `I could not check that wallet/token pair right now: ${error.response?.data?.error || error.message}`
      );
    }
  };

const formatUrlAnalysis =
  (
    result
  ) => {
    const evidence =
      result?.aiAnalysis?.data;
    const risk =
      result?.riskAnalysis?.data ||
      result?.riskAnalysis;
    const timeline =
      result?.timeline?.data?.timeline ||
      result?.timeline?.timeline ||
      (
        Array.isArray(
          result?.timeline
        )
          ? result.timeline
          : []
      );
    const imageNotes =
      (
        result?.imageAnalysis ||
        []
      )
        .filter(
          (item) =>
            item.success &&
            item.analysis?.visual_summary
        )
        .slice(
          0,
          3
        )
        .map(
          (item) =>
            `- ${item.analysis.visual_summary}`
        );
    const documentNotes =
      (
        result?.documents ||
        []
      )
        .filter(
          (document) =>
            document.success &&
            document.text
        )
        .map(
          (document) =>
            `- ${document.url}`
        );
    const claims =
      evidence?.claims ||
      [];
    const riskFlags =
      [
        ...(
          evidence?.riskFlags ||
          []
        ),
        ...(
          risk?.riskFlags ||
          []
        )
      ];

    return [
      evidence?.summary ||
      result?.aiAnalysis?.summary ||
      risk?.summary ||
      "I reviewed the linked page, but I could not extract enough dispute text to make a reliable verdict.",
      evidence?.verdict
        ? `Assessment: ${evidence.verdict}`
        : null,
      risk?.overallRisk
        ? `Website risk: ${risk.overallRisk}${Number.isFinite(
            risk.riskScore
          )
            ? ` (${risk.riskScore}/100)`
            : ""}`
        : null,
      claims.length
        ? ""
        : null,
      claims.length
        ? "Claims found:"
        : null,
      ...claims
        .slice(
          0,
          5
        )
        .map(
          (claim) =>
            `- ${claim}`
        ),
      riskFlags.length
        ? ""
        : null,
      riskFlags.length
        ? "Risk signals:"
        : null,
      ...riskFlags
        .slice(
          0,
          5
        )
        .map(
          (flag) =>
            `- ${flag}`
        ),
      documentNotes.length
        ? ""
        : null,
      documentNotes.length
        ? "Documents reviewed:"
        : null,
      ...documentNotes.slice(
        0,
        3
      ),
      timeline?.length
        ? ""
        : null,
      timeline?.length
        ? "Timeline:"
        : null,
      ...(
        timeline?.length
          ? timeline
              .slice(
                0,
                4
              )
              .map(
                (item) =>
                  typeof item ===
                    "string"
                    ? `- ${item}`
                    : `- ${[
                        item.date,
                        item.actor,
                        item.event
                      ]
                        .filter(Boolean)
                        .join(" - ")}`
              )
          : []
      ),
      imageNotes.length
        ? ""
        : null,
      imageNotes.length
        ? "Images reviewed:"
        : null,
      ...imageNotes
    ]
      .filter(
        (line) =>
          line !== null
      )
      .join(
        "\n"
      );
  };

const handleUrlAnalysis =
  async (
    ctx,
    url
  ) => {
    const processing =
      await ctx.reply(
        "I am analyzing that page now. I will send the result here when it is ready.",
        {
          reply_parameters: {
            message_id:
              ctx.message?.message_id
          }
        }
      );

    Promise.resolve()
      .then(
        async () => {
          try {
            const result =
              await analyzeUrl(
                url
              );

            await replyToMessage(
              ctx,
              formatTelegramHtml(
                stripHtmlTags(
                  formatUrlAnalysis(
                    result
                  )
                )
              ),
              {
                parse_mode:
                  "HTML"
              }
            );
          } catch {
            await replyToMessage(
              ctx,
              "I could not analyze that page right now. Please try again shortly."
            );
          } finally {
            try {
              await ctx.telegram.deleteMessage(
                ctx.chat.id,
                processing.message_id
              );
            } catch {}
          }
        }
      );

    return true;
  };

module.exports = {
  handleSummary,
  handleMessageAnalysis,
  handleRangeAnalysis,
  handleQuestion,
  analyzeAndReply,
  handleScopedAnalysis,
  clarifyScope,
  handleLinkedMessageAnalysis,
  handleLinkedScopeSummary,
  looksLikeMessageLink,
  extractExternalUrl,
  extractEvmAddresses,
  detectChainId,
  detectExplicitChainId,
  isWeb3Intent,
  isPaymentProofIntent,
  isWeb3WalletTokenRequest,
  parsePaymentProofRequest,
  getPaymentProofMissingFields,
  buildPaymentProofClarifyingQuestion,
  hasPendingPaymentProof,
  formatPaymentProofAnalysis,
  handlePaymentProofAnalysis,
  parseWeb3WalletTokenRequest,
  getWeb3WalletTokenMissingFields,
  buildWeb3ClarifyingQuestion,
  hasPendingWeb3Request,
  formatWalletTokenAnalysis,
  handleWalletTokenAnalysis,
  formatUrlAnalysis,
  handleUrlAnalysis
};
