const { getUsersCollection, ObjectId } = require("../config/db");
const { verifyToken } = require("../utils/auth");
const { syncUserUsageWindow } = require("../utils/usage");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const payload = verifyToken(token);
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.sub) });

    if (!user) {
      return res.status(401).json({ error: "User account was not found." });
    }

    req.user = await syncUserUsageWindow(usersCollection, user);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = {
  requireAuth
};
