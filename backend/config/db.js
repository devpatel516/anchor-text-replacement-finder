const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error("MONGODB_URI is required.");
}

if (!dbName) {
  throw new Error("MONGODB_DB_NAME is required.");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

let databasePromise;

async function getDb() {
  if (!databasePromise) {
    databasePromise = client.connect().then(async (connectedClient) => {
      const database = connectedClient.db(dbName);
      await database.collection("users").createIndex({ email: 1 }, { unique: true });
      await database.collection("scans").createIndex({ userId: 1, createdAt: -1 });
      return database;
    });
  }

  return databasePromise;
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection("users");
}

async function getScansCollection() {
  const db = await getDb();
  return db.collection("scans");
}

module.exports = {
  getDb,
  getScansCollection,
  getUsersCollection,
  ObjectId
};
