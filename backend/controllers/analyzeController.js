const axios = require("axios");
const { getScansCollection, getUsersCollection } = require("../config/db");
const crawlBlogPages = require("../services/crawlerService");
const extractContent = require("../services/extractorService");
const getSimilarWords = require("../services/similarWordsService");
const { createScanRecord } = require("../utils/scans");
const { incrementUserUsage, sanitizeUser } = require("../utils/usage");

const ANALYZE_API_URL = process.env.ANALYZE_API_URL || "http://127.0.0.1:8000/api/analyze";

function hasUsageRemaining(user) {
  return user.analysisUsed < user.analysisLimit;
}

function buildUsageLimitResponse(user) {
  return {
    error:
      user.plan === "pro"
        ? "Your monthly Pro analysis limit has been reached."
        : "Your 3 free analyses for this month are already used.",
    user: sanitizeUser(user)
  };
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function buildAnalysisPayload(urls, anchorText, anchorTextLink) {
  const result = [];

  for (const crawledUrl of urls) {
    const contentData = await extractContent(crawledUrl);
    result.push({
      url: crawledUrl,
      ...contentData,
      anchorText,
      anchorTextLink
    });
  }

  return result;
}

async function buildSimilarWordGroups(url, anchorText) {
  const similarWords = await getSimilarWords(anchorText);
  const limitedWords = similarWords.slice(0, 5);
  const searchGroups = [];

  for (const similarWord of limitedWords) {
    const searchQuery = crawlBlogPages.buildSiteQuery(url, similarWord);
    const crawledPages = (
      await crawlBlogPages(searchQuery, {
        isSearchQuery: true,
        maxResults: 2
      })
    ).slice(0, 2);

    searchGroups.push({
      similarWord,
      searchQuery,
      crawledPages
    });
  }

  return {
    similarWords: limitedWords,
    searchGroups
  };
}

async function buildExtractedPages(searchGroups) {
  const extractedPages = [];
  const failedPages = [];

  for (const group of searchGroups) {
    for (const crawledUrl of group.crawledPages) {
      try {
        const contentData = await extractContent(crawledUrl);
        extractedPages.push({
          similarWord: group.similarWord,
          searchQuery: group.searchQuery,
          url: crawledUrl,
          ...contentData
        });
      } catch (error) {
        failedPages.push({
          similarWord: group.similarWord,
          searchQuery: group.searchQuery,
          url: crawledUrl,
          error: error.message
        });
      }
    }
  }

  return {
    extractedPages,
    failedPages
  };
}

const extract = async (req, res) => {
  try {
    const { url, anchorText, anchorTextLink } = req.body;

    if (!url || !anchorText || !anchorTextLink) {
      return res.status(400).json({ error: "Input field is missing." });
    }

    if (!isValidUrl(url) || !isValidUrl(anchorTextLink)) {
      return res.status(400).json({ error: "A valid URL is required." });
    }

    if (!hasUsageRemaining(req.user)) {
      return res.status(403).json(buildUsageLimitResponse(req.user));
    }

    const urls = await crawlBlogPages(url, {
      keyword: anchorText
    });
    const result = await buildAnalysisPayload(urls, anchorText, anchorTextLink);
    const response = await axios.post(ANALYZE_API_URL, result, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const usersCollection = await getUsersCollection();
    const scansCollection = await getScansCollection();
    const updatedUser = await incrementUserUsage(usersCollection, req.user._id);
    const fullOutput = {
      ...response.data,
      crawledPages: urls
    };
    const savedScan = await createScanRecord(scansCollection, {
      userId: req.user._id,
      url,
      anchorText,
      anchorTextLink,
      matchedScenario: response.data.matched_scenario,
      before: response.data.before,
      after: response.data.after,
      crawledPages: urls,
      output: fullOutput
    });

    return res.json({
      ...fullOutput,
      user: sanitizeUser(updatedUser),
      savedScan
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract content." });
  }
};

const extractFromSimilarWords = async (req, res) => {
  try {
    const { url, anchorText } = req.body;

    if (!url || !anchorText) {
      return res.status(400).json({ error: "url and anchorText are required." });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "A valid url is required." });
    }

    const { similarWords, searchGroups } = await buildSimilarWordGroups(url, anchorText);

    if (similarWords.length === 0) {
      return res.status(502).json({ error: "Failed to generate similar words." });
    }

    const { extractedPages, failedPages } = await buildExtractedPages(searchGroups);

    return res.json({
      url,
      anchorText,
      similarWords,
      searchGroups,
      crawledPages: searchGroups.flatMap((group) => group.crawledPages),
      extractedPages,
      failedPages
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to extract similar-word pages." });
  }
};

module.exports = { extract, extractFromSimilarWords };
