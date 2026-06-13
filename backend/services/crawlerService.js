const dotenv = require("dotenv");
const { tavily } = require("@tavily/core");

dotenv.config();

const client = tavily({
  apiKey: process.env.SEARCH_API_KEY
});

function tokenizeSlug(value) {
  return String(value || "")
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSiteTarget(rawUrl) {
  const parsedUrl = new URL(rawUrl);
  const cleanedPath = parsedUrl.pathname.replace(/\/$/, "");

  return `${parsedUrl.host}${cleanedPath}`;
}

function getFallbackKeyword(rawUrl) {
  const parsedUrl = new URL(rawUrl);
  const pathTokens = tokenizeSlug(parsedUrl.pathname);

  if (pathTokens.length > 0) {
    return pathTokens.join(" ");
  }

  const hostWithoutWww = parsedUrl.hostname.replace(/^www\./i, "");
  const hostParts = hostWithoutWww.split(".");
  const domainToken = hostParts.length > 1 ? hostParts[hostParts.length - 2] : hostParts[0];
  const domainKeywords = tokenizeSlug(domainToken);

  if (domainKeywords.length > 0) {
    return domainKeywords.join(" ");
  }

  return "website";
}

function buildSiteQuery(rawUrl, keyword = "") {
  const siteTarget = getSiteTarget(rawUrl);
  const cleanedKeyword = String(keyword || "").trim() || getFallbackKeyword(rawUrl);

  return `site:${siteTarget} ${cleanedKeyword}`;
}

async function crawlBlogPages(input, options = {}) {
  const { isSearchQuery = false, keyword = "", maxResults = 10, searchDepth = "advanced" } = options;
  const searchQuery = isSearchQuery ? String(input || "").trim() : buildSiteQuery(input, keyword);

  if (!searchQuery) {
    return [];
  }

  const response = await client.search(searchQuery, {
    searchDepth,
    maxResults
  });

  return [...new Set((response.results || []).map((result) => result.url).filter(Boolean))];
}

crawlBlogPages.buildSiteQuery = buildSiteQuery;

module.exports = crawlBlogPages;
