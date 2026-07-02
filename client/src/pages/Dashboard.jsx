import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Boxes, Lightbulb, PackageMinus, ReceiptText } from "lucide-react";
import api from "../api/api";
import KPICard from "../components/KPICard";

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get("/analytics/dashboard").then((res) => setStats(res.data.data));
  }, []);

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-4">
        <Link to="/products"><KPICard icon={Boxes} label="Products" value={stats.products || 0} /></Link>
        <Link to="/sales"><KPICard icon={ReceiptText} label="Sales Today" value={stats.todaySales || 0} /></Link>
        <Link to="/sales"><KPICard icon={ReceiptText} label="Revenue Today" value={`Rs. ${stats.revenue || 0}`} /></Link>
        <Link to="/inventory"><KPICard icon={PackageMinus} label="Low Stock" value={stats.lowStock || 0} /></Link>
      </section>

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
      <Link className="btn-primary w-fit" to={to}>View plans</Link>
    </section>
  );
}
