import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, CreditCard, RefreshCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import DataTable from "../components/DataTable";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function statusText(subscription) {
  if (!subscription || subscription.status === "none") return "Free level";
  if (subscription.isActive) return `${subscription.planName} - ${subscription.daysRemaining} days left`;
  return `${subscription.planName} expired`;
}

function levelLabel(level) {
  return `${(level || "free").charAt(0).toUpperCase()}${(level || "free").slice(1)}`;
}

export default function Billing() {
  const [billing, setBilling] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  async function load() {
    const res = await api.get("/billing/me");
    setBilling(res.data.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    if (!pidx) return;

    async function verifyPayment() {
      try {
        setVerifying(true);
        const res = await api.post("/billing/verify", { pidx });
        toast.success(res.data.message);
        await load();
        const subscription = res.data.data?.subscription;
        const returnTo = window.sessionStorage.getItem("inventra_billing_return_to");
        window.sessionStorage.removeItem("inventra_billing_return_to");

        if (subscription?.isActive) {
          if (returnTo) {
            navigate(returnTo, { replace: true });
            return;
          }

          const destination = subscription.level === "pro" ? "/recommendations" : subscription.level === "basic" ? "/analytics" : "/dashboard";
          navigate(destination, { replace: true });
          return;
        }

        navigate("/billing", { replace: true });
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not verify Khalti payment");
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [searchParams, navigate]);

  async function checkout(planId) {
    try {
      setLoadingPlan(planId);
      const res = await api.post("/billing/checkout", { planId });
      window.location.href = res.data.data.paymentUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start Khalti checkout");
    } finally {
      setLoadingPlan("");
    }
  }

  const plans = billing?.plans || [];
  const subscription = billing?.subscription;

  return (
    <div className="grid gap-4">
      <section className="card grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-black uppercase text-navy/50">Billing</p>
          <h1 className="mt-1 text-3xl font-black">{levelLabel(billing?.level)} level</h1>
          <p className="mt-2 text-sm text-navy/60">
            {subscription?.isActive ? `${statusText(subscription)}. Access ends on ${formatDate(subscription.endsAt)}.` : "Free users can use core tools. Upgrade to Basic or Pro for premium features."}
          </p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCcw size={17} /> Refresh
        </button>
      </section>

      {verifying && <p className="card text-sm font-bold text-navy/70">Verifying Khalti payment...</p>}

      <section className="card grid gap-2 text-sm text-navy/70">
        <p className="font-black uppercase text-navy/50">Khalti sandbox payment</p>
        <p>Press `Pay with Khalti` to open Khalti&apos;s hosted payment page.</p>
        <p>In sandbox, sign in there using a test wallet number from `9800000000` to `9800000005`, then use MPIN `1111` and OTP `987654` if Khalti asks for it.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <section className="card grid gap-4" key={plan.id}>
            <div>
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-2 text-sm leading-6 text-navy/60">{plan.description}</p>
            </div>
            <div>
              <strong className="text-4xl">Rs. {plan.price}</strong>
              <span className="ml-2 text-sm font-bold text-navy/50">/{plan.interval}</span>
            </div>
            <div className="grid gap-2">
              {plan.features.map((feature) => (
                <p className="flex items-start gap-2 text-sm font-semibold text-navy/70" key={feature}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                  {feature}
                </p>
              ))}
            </div>
            <button className="btn-primary" disabled={loadingPlan === plan.id} onClick={() => checkout(plan.id)}>
              <CreditCard size={17} />
              {loadingPlan === plan.id ? "Starting..." : billing?.level === plan.level ? "Renew with Khalti" : "Pay with Khalti"}
            </button>
          </section>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="font-bold">Recent Payments</h2>
        <DataTable
          columns={["Plan", "Level", "Amount", "Status", "Transaction", "Date"]}
          rows={billing?.payments || []}
          empty="No payment history yet"
          renderRow={(payment) => [
            payment.planName,
            payment.level || "-",
            `Rs. ${payment.amount}`,
            payment.status,
            payment.transactionId || payment.pidx || "-",
            formatDate(payment.createdAt)
          ]}
        />
      </section>
    </div>
  );
}
