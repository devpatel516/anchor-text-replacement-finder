const express = require("express");
const { extract, extractFromSimilarWords } = require("../controllers/analyzeController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/extract", requireAuth, extract);
router.post("/extract-similar-words", requireAuth, extractFromSimilarWords);

module.exports = router;
