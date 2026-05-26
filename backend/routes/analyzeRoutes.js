const express = require("express");
const { extract } = require("../controllers/analyzeController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/extract", requireAuth, extract);

module.exports = router;
