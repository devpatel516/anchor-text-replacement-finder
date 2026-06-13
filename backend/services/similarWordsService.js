const axios = require("axios");

const SIMILAR_WORDS_API_URL =
  process.env.SIMILAR_WORDS_API_URL || "http://127.0.0.1:8000/api/similar-words";

async function getSimilarWords(anchorText) {
  const response = await axios.post(
    SIMILAR_WORDS_API_URL,
    { anchorText },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!Array.isArray(response.data?.similarWords)) {
    return [];
  }

  return [...new Set(response.data.similarWords.map((word) => String(word || "").trim()))]
    .filter(Boolean)
    .slice(0, 5);
}

module.exports = getSimilarWords;
