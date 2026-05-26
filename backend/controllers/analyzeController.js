const axios = require("axios");
const { getScansCollection, getUsersCollection } = require("../config/db");
const crawlBlogPages = require("../services/crawlerService");
const extractContent = require("../services/extractorService");
const { createScanRecord } = require("../utils/scans");
const { incrementUserUsage, sanitizeUser } = require("../utils/usage");

const extract = async (req, res) => {
  try {
    const { url, anchorText, anchorTextLink } = req.body;

    if (!url || !anchorText || !anchorTextLink) {
      return res.status(400).json({ error: "Input field is missing." });
    }

    if (req.user.analysisUsed >= req.user.analysisLimit) {
      return res.status(403).json({
        error:
          req.user.plan === "pro"
            ? "Your monthly Pro analysis limit has been reached."
            : "Your 3 free analyses for this month are already used.",
        user: sanitizeUser(req.user)
      });
    }

    const result = [];
    const urls = await crawlBlogPages(url);

    for (const crawledUrl of urls) {
      const contentData = await extractContent(crawledUrl);
      result.push({
        url: crawledUrl,
        ...contentData,
        anchorText,
        anchorTextLink
      });
    }

    const response = await axios.post("http://127.0.0.1:8000/api/analyze", result, {
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

module.exports = { extract };
