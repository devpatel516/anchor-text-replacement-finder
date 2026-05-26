const { getScansCollection, getUsersCollection } = require("../config/db");
const { hashPassword, signToken, verifyPassword } = require("../utils/auth");
const { getUserScanHistory } = require("../utils/scans");
const {
  getCurrentUsagePeriod,
  getPlanLimit,
  sanitizeUser,
  syncUserUsageWindow
} = require("../utils/usage");

function validateCredentials({ name, email, password }, isRegistration) {
  if (isRegistration && !String(name || "").trim()) {
    return "Name is required.";
  }

  if (!String(email || "").trim()) {
    return "Email is required.";
  }

  if (!String(password || "").trim()) {
    return "Password is required.";
  }

  if (String(password).length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const validationError = validateCredentials({ name, email, password }, true);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const usersCollection = await getUsersCollection();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: "An account already exists for that email." });
    }

    const now = new Date();
    const userDocument = {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      plan: "free",
      analysisUsed: 0,
      analysisLimit: getPlanLimit("free"),
      usagePeriod: getCurrentUsagePeriod(now),
      createdAt: now,
      updatedAt: now
    };

    const insertResult = await usersCollection.insertOne(userDocument);
    const savedUser = { ...userDocument, _id: insertResult.insertedId };
    const token = signToken(savedUser);

    return res.status(201).json({
      token,
      user: sanitizeUser(savedUser),
      scanHistory: []
    });
  } catch (error) {
    console.error(error);

    if (error?.code === 11000) {
      return res.status(409).json({ error: "An account already exists for that email." });
    }

    return res.status(500).json({ error: "Failed to create account." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const validationError = validateCredentials({ email, password }, false);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const usersCollection = await getUsersCollection();
    const scansCollection = await getScansCollection();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const syncedUser = await syncUserUsageWindow(usersCollection, user);
    const token = signToken(syncedUser);

    return res.json({
      token,
      user: sanitizeUser(syncedUser),
      scanHistory: await getUserScanHistory(scansCollection, syncedUser._id)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to sign in." });
  }
}

async function me(req, res) {
  const scansCollection = await getScansCollection();

  return res.json({
    user: sanitizeUser(req.user),
    scanHistory: await getUserScanHistory(scansCollection, req.user._id)
  });
}

module.exports = {
  login,
  me,
  register
};
