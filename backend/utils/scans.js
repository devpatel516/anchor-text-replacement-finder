function sanitizeScan(scan) {
  const output = scan.output || {};

  return {
    id: String(scan._id),
    url: scan.url,
    anchorText: scan.anchorText,
    anchorTextLink: scan.anchorTextLink,
    matchedScenario: scan.matchedScenario,
    before: scan.before,
    after: scan.after,
    crawledPages: Array.isArray(scan.crawledPages) ? scan.crawledPages : [],
    output: {
      ...output,
      crawledPages: Array.isArray(output.crawledPages)
        ? output.crawledPages
        : Array.isArray(scan.crawledPages)
          ? scan.crawledPages
          : []
    },
    createdAt: scan.createdAt
  };
}

async function getUserScanHistory(scansCollection, userId, limit = 50) {
  const scans = await scansCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return scans.map(sanitizeScan);
}

async function createScanRecord(scansCollection, payload) {
  const scanDocument = {
    userId: payload.userId,
    url: payload.url,
    anchorText: payload.anchorText,
    anchorTextLink: payload.anchorTextLink,
    matchedScenario: payload.matchedScenario,
    before: payload.before,
    after: payload.after,
    crawledPages: payload.crawledPages || [],
    output: payload.output || {},
    createdAt: new Date()
  };

  const insertResult = await scansCollection.insertOne(scanDocument);

  return sanitizeScan({
    ...scanDocument,
    _id: insertResult.insertedId
  });
}

module.exports = {
  createScanRecord,
  getUserScanHistory,
  sanitizeScan
};
