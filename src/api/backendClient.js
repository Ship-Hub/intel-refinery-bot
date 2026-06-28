const axios = require("axios");
const appConfig = require("../config/appConfig");
const { logger } = require("../logging/logger");

const client = axios.create({
  baseURL: appConfig.backend.baseUrl,
  timeout: appConfig.backend.requestTimeoutMs,
  headers: {
    "x-api-key": appConfig.backend.apiKey
  }
});

const requestTelegramOtp = async (payload) => {
  try {
    const response = await client.request({
      method: "post",
      url: "/auth/telegram/request-otp",
      data: payload,
      headers: {
        "x-admin-token": appConfig.backend.adminToken
      }
    });

    return response.data;
  } catch (error) {
    logger.error({
      event: "backend_request_error",
      method: "POST",
      path: "/auth/telegram/request-otp",
      status: error.response?.status,
      code: error.code,
      response: error.response?.data
    });

    throw error;
  }
};

module.exports = {
  requestTelegramOtp
};
