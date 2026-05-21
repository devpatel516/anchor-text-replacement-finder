const express = require("express");
const cors = require("cors");
const analysisRoute = require("./routes/analyzeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", (req, res) => {
  res.send("Its working...");
});

app.use("/api", analysisRoute);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
