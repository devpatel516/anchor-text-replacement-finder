const axios = require("axios");
const cheerio = require("cheerio");
const extractContent = async (url) => {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  $("script").remove();
  $("style").remove();
  $("nav").remove();
  $("footer").remove();

  const title = $("title").text();

  let content = "";

  $("p").each((_, el) => {
    content += $(el).text() + "\n";
  });
    //console.log(title);
    //console.log(content);
  return {
    title,
    content,
  };
};

// extractContent("https://www.geeksforgeeks.org/blogs/geeksforgeeks-practice-best-online-coding-platform/");

module.exports = extractContent;