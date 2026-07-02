import React, { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/billing/plans").then((res) => setPlans(res.data.data));
  }, []);

  async function choosePlan(plan) {
    if (plan.level === "free") {
      navigate(isAuthenticated ? "/dashboard" : "/register");
      return;
    }

    if (!isAuthenticated) {
      navigate("/register");
      return;
    }

    try {
      setLoadingPlan(plan.id);
      const res = await api.post("/billing/checkout", { planId: plan.id });
      window.location.href = res.data.data.paymentUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start Khalti checkout");
    } finally {
      setLoadingPlan("");
    }
  }

  const paidPlans = plans.filter((plan) => plan.level !== "free");

  return (
    <main className="min-h-screen bg-cream text-navy">
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-white"><Store size={22} /></span>
            <span>
              <strong className="block text-xl font-black">Inventra</strong>
              <span className="block text-xs font-bold uppercase text-navy/50">Retail OS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-navy/70 md:flex">
            <Link to="/">Home</Link>
            <Link to="/#features">Features</Link>
            <Link to="/#workflow">Workflow</Link>
            <Link to="/#analytics">Analytics</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="btn-secondary md:hidden" to="/">Home</Link>
            <Link className="btn-secondary" to="/login">Login</Link>
            <Link className="btn-primary hidden sm:inline-flex" to="/register">Create account</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase text-navy/50">Simple monthly pricing</p>
          <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Start with the basics, upgrade when your shop needs more.</h1>
          <p className="mt-4 text-lg text-navy/65">Core inventory tools are free to try. Paid plans unlock advanced analytics, recommendations, and movement insights.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="card flex min-h-[360px] flex-col border-navy/20">
            <div className="mb-4">
              <h2 className="text-2xl font-black">Free</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-navy/60">For trying Inventra with your real shop workflow before paying.</p>
            </div>
            <div className="mb-5">
              <strong className="text-4xl">Rs. 0</strong>
              <span className="ml-2 text-sm font-bold text-navy/50">/forever</span>
            </div>
            <div className="grid flex-1 gap-2">
              {["Dashboard summary", "Product management", "Inventory and restocking", "Sales recording"].map((feature) => (
                <p className="flex items-start gap-2 text-sm font-semibold text-navy/70" key={feature}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                  {feature}
                </p>
              ))}
            </div>
            <Link className="btn-secondary mt-5" to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Open dashboard" : "Create account"}
            </Link>
          </section>

          {paidPlans.map((plan) => (
            <section className="card flex min-h-[360px] flex-col" key={plan.id}>
              <div className="mb-4">
                <h2 className="text-2xl font-black">{plan.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-navy/60">{plan.description}</p>
              </div>
              <div className="mb-5">
                <strong className="text-4xl">Rs. {plan.price}</strong>
                <span className="ml-2 text-sm font-bold text-navy/50">/{plan.interval}</span>
              </div>
              <div className="grid flex-1 gap-2">
                {plan.features.map((feature) => (
                  <p className="flex items-start gap-2 text-sm font-semibold text-navy/70" key={feature}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                    {feature}
                  </p>
                ))}
              </div>
              <button className="btn-primary mt-5" disabled={loadingPlan === plan.id} onClick={() => choosePlan(plan)}>
                <CreditCard size={17} />
                {isAuthenticated ? (loadingPlan === plan.id ? "Starting..." : "Pay with Khalti") : "Create account"}
              </button>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
