const getFetch = require('../utils/fetch');

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'qwen/qwen3.6-27b';
const DEFAULT_TIMEOUT_MS = 25000;

function groqConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    baseUrl: process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL,
    timeoutMs: Number(process.env.GROQ_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}

async function createChatCompletion({
  messages,
  temperature = 0.35,
  maxTokens = 3500,
  responseFormat,
  reasoningEffort,
}) {
  const { apiKey, model, baseUrl, timeoutMs } = groqConfig();

  if (!apiKey) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.code = 'GROQ_MISSING_KEY';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchImpl = await getFetch();
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error?.message || `Groq request failed with status ${response.status}`;
      const error = new Error(message);
      error.code = 'GROQ_API_ERROR';
      error.statusCode = response.status;
      throw error;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      const error = new Error('Groq returned an empty response');
      error.code = 'GROQ_EMPTY_RESPONSE';
      throw error;
    }

    return content;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Groq request timed out after ${timeoutMs}ms`);
      timeoutError.code = 'GROQ_TIMEOUT';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { createChatCompletion, groqConfig };
