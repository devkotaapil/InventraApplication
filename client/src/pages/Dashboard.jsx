import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  Lightbulb,
  PackageMinus,
  ReceiptText,
} from "lucide-react";
import api from "../api/api";
import KPICard from "../components/KPICard";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get("/analytics/dashboard").then((res) => setStats(res.data.data));
  }, []);

  const planLabel = user?.billingLevel ? user.billingLevel : "free";
  const planName = planLabel.charAt(0).toUpperCase() + planLabel.slice(1);

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-4">
        <Link to="/products">
          <KPICard icon={Boxes} label="Products" value={stats.products || 0} />
        </Link>
        <Link to="/sales">
          <KPICard
            icon={ReceiptText}
            label="Sales Today"
            value={stats.todaySales || 0}
          />
        </Link>
        <Link to="/sales">
          <KPICard
            icon={ReceiptText}
            label="Revenue Today"
            value={`Rs. ${stats.revenue || 0}`}
          />
        </Link>
        <Link to="/inventory">
          <KPICard
            icon={PackageMinus}
            label="Low Stock"
            value={stats.lowStock || 0}
          />
        </Link>
      </section>

      <section className="rounded-3xl border border-navy/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-navy/40">
          Billing plan
        </p>
        <h2 className="mt-2 text-3xl font-black text-navy">{planName}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-navy/70">
          You are currently on the {planName} plan. You can use features as per
          your plan access.
        </p>
      </section>

      {planLabel === "pro" && (
        <section className="rounded-3xl border border-navy/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-navy/40">
                Export data
              </p>
              <h2 className="mt-2 text-2xl font-black text-navy">
                Download shop reports
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const res = await api.get("/exports/products", {
                    responseType: "blob",
                  });
                  const url = window.URL.createObjectURL(
                    new Blob([res.data], { type: "text/csv" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `inventra-products-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                Products
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const res = await api.get("/exports/sales", {
                    responseType: "blob",
                  });
                  const url = window.URL.createObjectURL(
                    new Blob([res.data], { type: "text/csv" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `inventra-sales-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                Sales
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const res = await api.get("/exports/movements", {
                    responseType: "blob",
                  });
                  const url = window.URL.createObjectURL(
                    new Blob([res.data], { type: "text/csv" }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `inventra-movements-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                Movements
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <FeatureCard
          icon={BarChart3}
          title="Advanced analytics"
          copy="Unlock revenue trends, top products, category breakdowns, and ABC analysis when you are ready to go deeper."
          to="/billing"
        />
        <FeatureCard
          icon={Lightbulb}
          title="Smart recommendations"
          copy="Upgrade to see low-stock priorities, inactive-product notes, and movement history for better restocking decisions."
          to="/billing"
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, copy, to }) {
  return (
    <section className="card grid gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-navy text-white">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-navy/45">Premium</p>
          <h2 className="font-black">{title}</h2>
        </div>
      </div>
      <p className="text-sm leading-6 text-navy/65">{copy}</p>
      <Link className="btn-primary w-fit" to={to}>
        View plans
      </Link>
    </section>
  );
}
