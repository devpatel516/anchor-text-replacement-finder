require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { getDb } = require("./config/db");
const { handleStripeWebhook } = require("./controllers/billingController");
const analysisRoute = require("./routes/analyzeRoutes");
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");

const app = express();

app.use(cors({ origin: true }));
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("Its working...");
});

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api", analysisRoute);

const port = Number(process.env.PORT) || 5000;

getDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
