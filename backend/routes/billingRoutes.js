const express = require("express");
const {
  confirmCheckoutSession,
  createCheckoutSession
} = require("../controllers/billingController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create-checkout-session", requireAuth, createCheckoutSession);
router.get("/checkout-session/:sessionId", requireAuth, confirmCheckoutSession);

module.exports = router;
