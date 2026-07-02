import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import { khaltiConfig, khaltiPost } from "../config/khalti.js";
import { allPlans, findPlan, publicPlans } from "../utils/plans.js";
import { fail, ok } from "../utils/helpers.js";

const KHALTI_SANDBOX_IDS = ["9800000000", "9800000001", "9800000002", "9800000003", "9800000004", "9800000005"];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeKhaltiStatus(status) {
  if (status === "Completed") return "completed";
  if (status === "Pending" || status === "Initiated") return "pending";
  if (status === "Expired") return "expired";
  if (status === "User canceled") return "canceled";
  if (status === "Refunded" || status === "Partially Refunded") return "refunded";
  return "failed";
}

function subscriptionState(subscription) {
  if (!subscription) return { status: "none", isActive: false, level: "free", planName: "Free" };
  const now = new Date();
  const isActive = subscription.status === "active" && subscription.endsAt >= now;
  return {
    ...subscription.toObject(),
    isActive,
    daysRemaining: Math.max(Math.ceil((subscription.endsAt - now) / (24 * 60 * 60 * 1000)), 0)
  };
}

function hasActiveSubscription(subscription) {
  return subscription && subscription.status === "active" && subscription.endsAt >= new Date();
}

function normalizeKhaltiId(value) {
  return String(value || "").trim();
}

function validateKhaltiId(value, khalti) {
  const khaltiId = normalizeKhaltiId(value);
  if (!/^\d{10}$/.test(khaltiId)) {
    return "Enter a valid 10-digit Khalti ID.";
  }

  if (khalti.baseUrl.includes("dev.khalti.com") && !KHALTI_SANDBOX_IDS.includes(khaltiId)) {
    return `Use a Khalti sandbox ID between ${KHALTI_SANDBOX_IDS[0]} and ${KHALTI_SANDBOX_IDS[KHALTI_SANDBOX_IDS.length - 1]}.`;
  }

  return "";
}

function fallbackSandboxKhaltiId() {
  return KHALTI_SANDBOX_IDS[1];
}

function customerPhoneForCheckout(user, khalti, requestedKhaltiId) {
  const explicit = normalizeKhaltiId(requestedKhaltiId);
  if (explicit) return explicit;

  const profilePhone = normalizeKhaltiId(user?.phone);
  if (/^\d{10}$/.test(profilePhone)) return profilePhone;

  if (khalti.baseUrl.includes("dev.khalti.com")) {
    return fallbackSandboxKhaltiId();
  }

  return "";
}

export async function plans(_req, res) {
  ok(res, publicPlans(), "Plans loaded");
}

export async function myBilling(req, res) {
  const [subscription, payments] = await Promise.all([
    Subscription.findOne({ user: req.user._id }),
    Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10)
  ]);
  const active = hasActiveSubscription(subscription);
  const level = active ? req.user.billingLevel || subscription.level || "free" : "free";

  if (!active && req.user.billingLevel && req.user.billingLevel !== "free") {
    await User.findByIdAndUpdate(req.user._id, { billingLevel: "free" });
  }

  ok(res, { level, subscription: subscriptionState(subscription), payments, plans: allPlans() }, "Billing loaded");
}

export async function checkout(req, res) {
  const plan = findPlan(req.body.planId);
  if (!plan) return fail(res, "Plan not found", 404);
  const khalti = khaltiConfig();
  if (!khalti.isConfigured) return fail(res, khalti.missingMessage, 503, { code: "KHALTI_NOT_CONFIGURED" });
  const khaltiId = customerPhoneForCheckout(req.user, khalti, req.body.khaltiId);
  if (!khaltiId) return fail(res, "Add a valid 10-digit phone number to start Khalti checkout.", 400, { code: "INVALID_KHALTI_ID" });
  const khaltiIdError = validateKhaltiId(khaltiId, khalti);
  if (khaltiIdError) return fail(res, khaltiIdError, 400, { code: "INVALID_KHALTI_ID" });

  const purchaseOrderId = `INV-SUB-${req.user._id}-${Date.now()}`;
  const amountPaisa = plan.price * 100;
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";
  const payload = {
    return_url: `${clientOrigin}/billing/return`,
    website_url: clientOrigin,
    amount: amountPaisa,
    purchase_order_id: purchaseOrderId,
    purchase_order_name: `Inventra ${plan.name} Plan`,
    customer_info: {
      name: req.user.name,
      email: req.user.email,
      phone: khaltiId
    },
    amount_breakdown: [{ label: `${plan.name} monthly access`, amount: amountPaisa }],
    product_details: [
      {
        identity: plan.id,
        name: `Inventra ${plan.name}`,
        total_price: amountPaisa,
        quantity: 1,
        unit_price: amountPaisa
      }
    ],
    merchant_extra: String(req.user._id)
  };

  let data;
  try {
    data = await khaltiPost("/epayment/initiate/", payload);
  } catch (error) {
    return fail(res, error.message || "Khalti payment could not be started", error.statusCode || 502, error.data || { code: error.code });
  }

  if (!data.pidx || !data.payment_url) {
    return fail(res, "Khalti did not return a complete checkout session", 502, data);
  }

  const payment = await Payment.create({
    user: req.user._id,
    planId: plan.id,
    level: plan.level,
    planName: plan.name,
    amount: plan.price,
    amountPaisa,
    purchaseOrderId,
    pidx: data.pidx,
    paymentUrl: data.payment_url,
    raw: { ...data, khaltiId }
  });

  ok(res, { payment, paymentUrl: data.payment_url }, "Khalti checkout started", 201);
}

export async function verify(req, res) {
  const pidx = req.body.pidx || req.query.pidx;
  if (!pidx) return fail(res, "Missing Khalti payment id", 400);
  const khalti = khaltiConfig();
  if (!khalti.isConfigured) return fail(res, khalti.missingMessage, 503, { code: "KHALTI_NOT_CONFIGURED" });

  const payment = await Payment.findOne({ pidx, user: req.user._id });
  if (!payment) return fail(res, "Payment not found", 404);
  const wasAlreadyActivated = payment.status === "completed" && payment.paidAt;

  let data;
  try {
    data = await khaltiPost("/epayment/lookup/", { pidx });
  } catch (error) {
    return fail(res, error.message || "Khalti payment could not be verified", error.statusCode || 502, error.data || { code: error.code });
  }

  const status = normalizeKhaltiStatus(data.status);

  payment.status = status;
  payment.transactionId = data.transaction_id || payment.transactionId;
  payment.raw = { ...payment.raw, lookup: data };

  if (status === "completed") {
    const plan = findPlan(payment.planId);
    if (!plan) return fail(res, "Payment plan is no longer available", 400);
    if (Number(data.total_amount) !== payment.amountPaisa) {
      payment.status = "failed";
      await payment.save();
      return fail(res, "Payment amount did not match the selected plan", 409);
    }

    payment.paidAt = payment.paidAt || new Date();
    await payment.save();

    if (wasAlreadyActivated) {
      const subscription = await Subscription.findOne({ user: req.user._id });
      return ok(res, { payment, subscription: subscriptionState(subscription) }, "Subscription already activated");
    }

    const current = await Subscription.findOne({ user: req.user._id });
    const now = new Date();
    const startsAt = current?.endsAt > now ? current.endsAt : now;
    const subscription = await Subscription.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        planId: plan.id,
        level: plan.level,
        planName: plan.name,
        status: "active",
        startedAt: startsAt,
        endsAt: addDays(startsAt, plan.durationDays),
        lastPayment: payment._id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { billingLevel: plan.level });

    return ok(res, { payment, subscription: subscriptionState(subscription) }, "Subscription activated");
  }

  await payment.save();
  ok(res, { payment, subscription: subscriptionState(await Subscription.findOne({ user: req.user._id })) }, "Payment status updated");
}
