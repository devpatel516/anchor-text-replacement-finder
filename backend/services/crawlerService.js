const { chromium } = require("playwright");

const BLOCKED = [
  "/tag/",
  "/category/",
  "/author/",
  "/page/",
  "#",
  "?",
  "mailto:",
  "tel:",
];

const crawlBlogPages = async (blogUrl) => {
  const urlObj = new URL(blogUrl);

  const base = urlObj.origin;
  const allowedPath = urlObj.pathname;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(blogUrl, { waitUntil: "domcontentloaded" });

  const links = await page.$$eval("a", (elements) =>
    elements.map((el) => el.href)
  );

  await browser.close();

  const uniqueLinks = [...new Set(links)].filter((link) => {
    if (!link.startsWith("http")) return false;

    const parsed = new URL(link);

    // same domain only
    if (parsed.origin !== base) return false;

    // only current path and below
    if (!parsed.pathname.startsWith(allowedPath)) return false;

    if (BLOCKED.some((pattern) => link.includes(pattern))) return false;

    return true;
  });

//   console.log(`\nFound ${uniqueLinks.length} links on ${blogUrl}:`);

//   uniqueLinks.forEach((link, i) => {
//     console.log(`${i + 1}. ${link}`);
//   });

  return uniqueLinks;
};

//crawlBlogPages("https://www.geeksforgeeks.org/courses/");

module.exports = crawlBlogPages;
