export const plans = [
  {
    id: "basic",
    level: "basic",
    name: "Basic",
    price: 499,
    interval: "month",
    durationDays: 30,
    description:
      "For active retailers who need deeper reporting after trying the free tools.",
    features: [
      "Everything in Free",
      "Analytics dashboard",
      "Revenue trends",
      "Top products",
      "Category breakdown",
    ],
  },
  {
    id: "pro",
    level: "pro",
    name: "Pro",
    price: 1999,
    interval: "month",
    durationDays: 30,
    description:
      "For larger shops that want stronger reporting and priority support.",
    features: [
      "Everything in Basic",
      "Smart recommendations",
      "Smart stock pairing",
      "Stock movement history",
      "CSV exports",
      "Priority support",
    ],
  },
];

export const freePlan = {
  id: "free",
  level: "free",
  name: "Free",
  price: 0,
  interval: "forever",
  durationDays: null,
  description:
    "For trying Inventra with your real shop workflow before paying.",
  features: [
    "Dashboard summary",
    "Product management",
    "Inventory and restocking",
    "Sales recording",
  ],
};

export function findPlan(planId) {
  return plans.find((plan) => plan.id === planId);
}

export function allPlans() {
  return plans;
}

export function publicPlans() {
  return [freePlan, ...plans];
}

export function paidLevels() {
  return plans.map((plan) => plan.level);
}
