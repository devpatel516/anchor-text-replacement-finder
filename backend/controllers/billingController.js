const Stripe = require("stripe");
const { getUsersCollection, ObjectId } = require("../config/db");
const {
  getCurrentUsagePeriod,
  getPlanLimit,
  sanitizeUser
} = require("../utils/usage");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function getFrontendBaseUrl(req) {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    req.headers.origin ||
    "http://localhost:5173"
  );
}

function getSuccessUrl(frontendBaseUrl) {
  return `${frontendBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
}

function getCancelUrl(frontendBaseUrl) {
  return `${frontendBaseUrl}/upgrade?billing=cancelled`;
}

async function promoteUserToPro(userId, details = {}) {
  const usersCollection = await getUsersCollection();
  const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
  const currentUser = await usersCollection.findOne({ _id: objectId });

  if (!currentUser) {
    return null;
  }

  const usagePeriod = getCurrentUsagePeriod();
  const analysisUsed =
    currentUser.usagePeriod === usagePeriod && Number.isFinite(currentUser.analysisUsed)
      ? currentUser.analysisUsed
      : 0;

  await usersCollection.updateOne(
    { _id: objectId },
    {
      $set: {
        plan: "pro",
        analysisLimit: getPlanLimit("pro"),
        analysisUsed,
        usagePeriod,
        stripeCustomerId: details.customerId || currentUser.stripeCustomerId || null,
        stripeSubscriptionId:
          details.subscriptionId || currentUser.stripeSubscriptionId || null,
        stripeCheckoutSessionId:
          details.checkoutSessionId || currentUser.stripeCheckoutSessionId || null,
        subscriptionStatus: details.subscriptionStatus || "active",
        planActivatedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  return usersCollection.findOne({ _id: objectId });
}

async function downgradeUserToFree(filters, subscriptionStatus) {
  const usersCollection = await getUsersCollection();
  const currentUser = await usersCollection.findOne(filters);

  if (!currentUser) {
    return null;
  }

  const usagePeriod = getCurrentUsagePeriod();
  const analysisUsed =
    currentUser.usagePeriod === usagePeriod && Number.isFinite(currentUser.analysisUsed)
      ? Math.min(currentUser.analysisUsed, getPlanLimit("free"))
      : 0;

  await usersCollection.updateOne(
    { _id: currentUser._id },
    {
      $set: {
        plan: "free",
        analysisLimit: getPlanLimit("free"),
        analysisUsed,
        usagePeriod,
        subscriptionStatus: subscriptionStatus || "canceled",
        updatedAt: new Date()
      }
    }
  );

  return usersCollection.findOne({ _id: currentUser._id });
}

async function syncCheckoutSession(sessionId, expectedUserId) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  const userId = session.client_reference_id || session.metadata?.userId;

  if (expectedUserId && userId !== String(expectedUserId)) {
    throw new Error("Checkout session does not belong to the authenticated user.");
  }

  const paymentCompleted =
    session.payment_status === "paid" ||
    session.status === "complete" ||
    ["active", "trialing"].includes(session.subscription?.status);

  if (!userId || !paymentCompleted) {
    return null;
  }

  return promoteUserToPro(userId, {
    customerId: session.customer ? String(session.customer) : null,
    subscriptionId: session.subscription ? String(session.subscription.id) : null,
    checkoutSessionId: session.id,
    subscriptionStatus: session.subscription?.status || "active"
  });
}

async function createCheckoutSession(req, res) {
  try {
    if (!stripe || !stripePriceId) {
      return res.status(500).json({ error: "Stripe billing is not configured." });
    }

    const frontendBaseUrl = getFrontendBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: getSuccessUrl(frontendBaseUrl),
      cancel_url: getCancelUrl(frontendBaseUrl),
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      customer_email: req.user.email,
      client_reference_id: String(req.user._id),
      metadata: {
        userId: String(req.user._id)
      }
    });

    return res.json({
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create checkout session." });
  }
}

async function confirmCheckoutSession(req, res) {
  try {
    const user = await syncCheckoutSession(req.params.sessionId, req.user._id);

    if (!user) {
      return res.status(400).json({ error: "Checkout session is not completed yet." });
    }

    return res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to confirm checkout session." });
  }
}

async function handleStripeWebhook(req, res) {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(400).send("Stripe webhook is not configured.");
  }

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
  } catch (error) {
    console.error(error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await syncCheckoutSession(event.data.object.id);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const usersCollection = await getUsersCollection();
        const currentUser = await usersCollection.findOne({
          stripeSubscriptionId: subscription.id
        });

        if (!currentUser) {
          break;
        }

        if (["active", "trialing"].includes(subscription.status)) {
          await promoteUserToPro(currentUser._id, {
            customerId: subscription.customer ? String(subscription.customer) : null,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status
          });
        } else {
          await downgradeUserToFree(
            { stripeSubscriptionId: subscription.id },
            subscription.status
          );
        }

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await downgradeUserToFree(
          { stripeSubscriptionId: subscription.id },
          subscription.status
        );
        break;
      }
      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Failed to process webhook.");
  }
}

module.exports = {
  confirmCheckoutSession,
  createCheckoutSession,
  handleStripeWebhook
};
