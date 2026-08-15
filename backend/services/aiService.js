const axios = require("axios");

const ANALYZE_API_URL = process.env.ANALYZE_API_URL || "http://127.0.0.1:8000/api/analyze";
const SIMILAR_WORDS_API_URL =
  process.env.SIMILAR_WORDS_API_URL || "http://127.0.0.1:8000/api/similar-words";
const AI_HEALTH_URL =
  process.env.AI_HEALTH_URL || buildAiHealthUrl(ANALYZE_API_URL, SIMILAR_WORDS_API_URL);

const AI_HEALTH_TIMEOUT_MS = Number(process.env.AI_HEALTH_TIMEOUT_MS) || 12000;
const AI_STARTUP_TIMEOUT_MS = Number(process.env.AI_STARTUP_TIMEOUT_MS) || 90000;
const AI_RETRY_DELAY_MS = Number(process.env.AI_RETRY_DELAY_MS) || 4000;

function buildAiHealthUrl(...candidateUrls) {
  for (const candidateUrl of candidateUrls) {
    try {
      const parsedUrl = new URL(candidateUrl);
      return `${parsedUrl.origin}/healthAi`;
    } catch {
      continue;
    }
  }

  return "";
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getAxiosErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    "Unknown AI service error."
  );
}

async function pingAiService(timeoutMs = AI_HEALTH_TIMEOUT_MS) {
  if (!AI_HEALTH_URL) {
    throw new Error("AI_HEALTH_URL is not configured.");
  }

  const response = await axios.get(AI_HEALTH_URL, {
    timeout: timeoutMs
  });

  return response.data;
}

async function ensureAiServiceReady(options = {}) {
  const startupTimeoutMs = options.startupTimeoutMs || AI_STARTUP_TIMEOUT_MS;
  const retryDelayMs = options.retryDelayMs || AI_RETRY_DELAY_MS;
  const healthTimeoutMs = options.healthTimeoutMs || AI_HEALTH_TIMEOUT_MS;
  const startedAt = Date.now();
  let attempts = 0;
  let lastError = null;

  while (Date.now() - startedAt < startupTimeoutMs) {
    attempts += 1;

    try {
      await pingAiService(healthTimeoutMs);

      return {
        ready: true,
        attempts,
        elapsedMs: Date.now() - startedAt
      };
    } catch (error) {
      lastError = error;
      await sleep(retryDelayMs);
    }
  }

  const timeoutError = new Error("AI service is still waking up. Please retry in a moment.");
  timeoutError.details = {
    attempts,
    elapsedMs: Date.now() - startedAt,
    lastError: getAxiosErrorMessage(lastError)
  };

  throw timeoutError;
}

module.exports = {
  ANALYZE_API_URL,
  SIMILAR_WORDS_API_URL,
  AI_HEALTH_URL,
  ensureAiServiceReady,
  getAxiosErrorMessage,
  pingAiService
};
