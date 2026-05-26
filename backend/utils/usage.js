const PLAN_LIMITS = {
  free: 3,
  pro: 100
};

function normalizePlan(plan) {
  return plan === "pro" ? "pro" : "free";
}

function getPlanLimit(plan) {
  return PLAN_LIMITS[normalizePlan(plan)];
}

function getCurrentUsagePeriod(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function getCurrentUsageCount(user) {
  return Number.isFinite(user?.analysisUsed) ? user.analysisUsed : 0;
}

function sanitizeUser(user) {
  const plan = normalizePlan(user?.plan);
  const analysisLimit = getPlanLimit(plan);
  const analysisUsed = getCurrentUsageCount(user);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    plan,
    analysisUsed,
    analysisLimit,
    analysesRemaining: Math.max(0, analysisLimit - analysisUsed),
    usagePeriod: user.usagePeriod || getCurrentUsagePeriod(),
    stripeCustomerId: user.stripeCustomerId || null,
    subscriptionStatus: user.subscriptionStatus || null
  };
}

async function syncUserUsageWindow(usersCollection, user) {
  const nextPlan = normalizePlan(user.plan);
  const nextLimit = getPlanLimit(nextPlan);
  const nextUsagePeriod = getCurrentUsagePeriod();
  const currentUsage = getCurrentUsageCount(user);
  const shouldResetUsage = user.usagePeriod !== nextUsagePeriod;
  const shouldSyncPlan =
    user.plan !== nextPlan ||
    user.analysisLimit !== nextLimit ||
    !Number.isFinite(user.analysisUsed);

  if (!shouldResetUsage && !shouldSyncPlan) {
    return {
      ...user,
      plan: nextPlan,
      analysisLimit: nextLimit,
      analysisUsed: currentUsage,
      usagePeriod: nextUsagePeriod
    };
  }

  const update = {
    plan: nextPlan,
    analysisLimit: nextLimit,
    usagePeriod: nextUsagePeriod,
    analysisUsed: shouldResetUsage ? 0 : currentUsage,
    updatedAt: new Date()
  };

  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: update
    }
  );

  return {
    ...user,
    ...update
  };
}

async function incrementUserUsage(usersCollection, userId) {
  const updatedUser = await usersCollection.findOneAndUpdate(
    { _id: userId },
    {
      $inc: { analysisUsed: 1 },
      $set: { updatedAt: new Date() }
    },
    {
      returnDocument: "after"
    }
  );

  return updatedUser?.value || updatedUser;
}

module.exports = {
  PLAN_LIMITS,
  getCurrentUsagePeriod,
  getPlanLimit,
  incrementUserUsage,
  normalizePlan,
  sanitizeUser,
  syncUserUsageWindow
};
