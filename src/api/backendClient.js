const axios =
  require("axios");

const appConfig =
  require("../config/appConfig");

const {
  logger
} = require(
  "../logging/logger"
);

const client =
  axios.create({
    baseURL:
      appConfig.backend.baseUrl,
    timeout:
      appConfig.backend.requestTimeoutMs,
    headers: {
      "x-api-key":
        appConfig.backend.apiKey
    }
  });

const request =
  async ({
    method,
    path,
    data,
    config
  }) => {
    try {
      const response =
        await client.request({
          method,
          url:
            path,
          data,
          ...config
        });

      return response.data;
    } catch (error) {
      logger.error({
        event:
          "backend_request_error",
        method:
          method.toUpperCase(),
        path,
        status:
          error.response?.status,
        code:
          error.code,
        response:
          error.response?.data
      });

      throw error;
    }
  };

const ingestConversation =
  async ({
    platform,
    conversationId,
    messages
  }) => {
    logger.info({
      event:
        "backend_ingest_request",
      platform,
      conversationId,
      messageCount:
        messages.length
    });

    return request({
      method:
        "post",
      path:
        "/api/conversations/ingest",
      data: {
        platform,
        conversationId,
        messages
      }
    });
  };

const queueAnalysis =
  async ({
    conversationId
  }) => {
    return request({
      method:
        "post",
      path:
        "/api/conversations/analyze",
      data: {
        conversationId
      }
    });
  };

const getAnalysis =
  async (
    sessionId
  ) => {
    return request({
      method:
        "get",
      path:
        `/api/conversations/analysis/${sessionId}`
    });
  };

const getConversationMessage =
  async ({
    platform,
    conversationId,
    messageId
  }) =>
    request({
      method:
        "get",
      path:
        `/api/conversations/messages/${encodeURIComponent(
          messageId
        )}?platform=${encodeURIComponent(
          platform
        )}&conversationId=${encodeURIComponent(
          conversationId
        )}`
    });

const getConversationMessages =
  async ({
    platform,
    conversationId,
    since,
    limit
  }) => {
    const query =
      new URLSearchParams({
        platform,
        conversationId,
        ...(since
          ? {
              since
            }
          : {}),
        ...(limit
          ? {
              limit:
                String(
                  limit
                )
            }
          : {})
      });

    return request({
      method:
        "get",
      path:
        `/api/conversations/messages?${query.toString()}`
    });
  };

const analyzeImages =
  async (
    form
  ) => {
    return request({
      method:
        "post",
      path:
        "/api/ocr",
      data:
        form,
      config: {
        headers:
          form.getHeaders(),
        timeout:
          appConfig.backend.imageAnalysisRequestTimeoutMs
      }
    });
  };

const analyzeRichImage =
  async (
    form
  ) =>
    request({
      method:
        "post",
      path:
        "/api/media/image",
      data:
        form,
      config: {
        headers:
          form.getHeaders(),
        timeout:
          appConfig.backend.ocrRequestTimeoutMs
      }
    });

const analyzeAudio =
  async (
    form
  ) =>
    request({
      method:
        "post",
      path:
        "/api/media/audio",
      data:
        form,
      config: {
        headers:
          form.getHeaders(),
        timeout:
          appConfig.backend.audioRequestTimeoutMs
      }
    });

const askQuestion =
  async ({
    platform,
    chatId,
    userId,
    username,
    userQuestion,
    message
  }) =>
    request({
      method:
        "post",
      path:
        "/api/chat",
      data: {
        platform,
        chatId,
        userId,
        username,
        userQuestion,
        message
      }
    });

const analyzeUrl =
  async (
    url
  ) =>
    request({
      method:
        "post",
      path:
        "/api/url/analyze",
      data: {
        url
      },
      config: {
        timeout:
          appConfig.backend.urlAnalysisRequestTimeoutMs
      }
    });

const analyzeWalletToken =
  async (
    payload
  ) =>
    request({
      method:
        "post",
      path:
        "/api/web3/wallet-token-analysis",
      data:
        payload,
      config: {
        timeout:
          30000
      }
    });

const verifyPaymentProof =
  async (
    payload
  ) =>
    request({
      method:
        "post",
      path:
        "/api/web3/payment-proof",
      data:
        payload,
      config: {
        timeout:
          30000
      }
    });

const classifyProactiveConversation =
  async ({
    messages,
    localSignal,
    directRequest =
      false,
    conversationalLevel =
      1
  }) =>
    request({
      method:
        "post",
      path:
        "/api/chat/proactive/classify",
      data: {
        messages,
        localSignal,
        directRequest,
        conversationalLevel
      }
    });

const getConversationSettings =
  async ({
    platform,
    conversationId
  }) =>
    request({
      method:
        "get",
      path:
        `/api/conversation-settings?platform=${encodeURIComponent(
          platform
        )}&conversationId=${encodeURIComponent(
          conversationId
        )}`
    });

const upsertConversationSettings =
  async (
    payload
  ) =>
    request({
      method:
        "put",
      path:
        "/api/conversation-settings",
      data:
        payload
    });

const upsertModeratorMonitor =
  async (
    payload
  ) =>
    request({
      method:
        "post",
      path:
        "/api/moderator-audits/monitors",
      data:
        payload
    });

const listModeratorMonitors =
  async (
    platform
  ) =>
    request({
      method:
        "get",
      path:
        `/api/moderator-audits/monitors?platform=${encodeURIComponent(
          platform
        )}`
    });

const getDueModeratorReports =
  async (
    platform
  ) =>
    request({
      method:
        "get",
      path:
        `/api/moderator-audits/reports/due?platform=${encodeURIComponent(
          platform
        )}`
    });

const generateModeratorReport =
  async (
    payload
  ) =>
    request({
      method:
        "post",
      path:
        "/api/moderator-audits/reports/generate",
      data:
        payload
    });

const requestTelegramOtp =
  async (
    payload
  ) =>
    request({
      method:
        "post",
      path:
        "/auth/telegram/request-otp",
      data:
        payload,
      config: {
        headers: {
          "x-admin-token":
            appConfig.backend.adminToken
        }
      }
    });

module.exports = {
  ingestConversation,
  queueAnalysis,
  getAnalysis,
  getConversationMessage,
  getConversationMessages,
  analyzeImages,
  analyzeRichImage,
  analyzeAudio,
  analyzeUrl,
  analyzeWalletToken,
  verifyPaymentProof,
  askQuestion,
  classifyProactiveConversation,
  getConversationSettings,
  upsertConversationSettings,
  upsertModeratorMonitor,
  listModeratorMonitors,
  getDueModeratorReports,
  generateModeratorReport,
  requestTelegramOtp
};
