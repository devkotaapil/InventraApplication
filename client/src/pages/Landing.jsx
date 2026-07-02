import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Boxes, CheckCircle2, PackageCheck, ReceiptText, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const heroImage = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80";
const counterImage = "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1100&q=80";

export default function Landing() {
  const { authLoading, isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const prompted = useRef(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || prompted.current) return;

    prompted.current = true;
    const shouldLogout = window.confirm("You are already signed in. Do you want to log out and return to the home page?");

    if (shouldLogout) {
      logout();
      return;
    }

    navigate(user?.isAdmin ? "/admin" : "/dashboard", { replace: true });
  }, [authLoading, isAuthenticated, logout, navigate, user]);

  return (
    <main className="min-h-screen bg-cream text-navy">
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-white">
              <Store size={22} />
            </span>
            <span>
              <strong className="block text-xl font-black">Inventra</strong>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-navy/50">Retail OS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-navy/70 md:flex">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#analytics">Analytics</a>
            <Link to="/pricing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="btn-secondary" to="/login">Login</Link>
            <Link className="btn-primary hidden sm:inline-flex" to="/register">Sign up</Link>
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1fr_0.95fr]">
        <div className="flex items-center px-6 py-14 lg:px-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-navy/60">Inventory software for small shops</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Inventory, sales, and stock decisions for growing retailers.</h1>
            <p className="mt-5 max-w-xl text-lg text-navy/70">
              Inventra helps shop owners track products, record multi-item sales, restock faster, and understand what needs attention before shelves run empty.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/register">Start free</Link>
              <Link className="btn-secondary" to="/pricing">View pricing</Link>
              <Link className="btn-secondary" to="/login">Login to workspace</Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                [Boxes, "Product and stock tracking"],
                [ReceiptText, "Quick sales invoices"],
                [BarChart3, "Live analytics"],
                [ShieldCheck, "Separate shop accounts"]
              ].map(([Icon, text]) => (
                <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm" key={text}>
                  <Icon className="text-navy" size={20} />
                  <span className="text-sm font-bold">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative hidden overflow-hidden lg:block">
          <img className="h-full w-full object-cover" src={heroImage} alt="Retail store aisle" />
          <div className="absolute inset-0 bg-navy/35" />
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 py-16 md:grid-cols-3">
        {[
          [PackageCheck, "Stock control", "Track opening stock, restocks, reorder points, and total stock value in one place."],
          [ReceiptText, "Sales billing", "Create invoices with multiple items and view product-level invoice details instantly."],
          [TrendingUp, "Smart notes", "See subtle recommendations for low stock, inactive products, and urgent restocking."]
        ].map(([Icon, title, copy]) => (
          <section className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm" key={title}>
            <Icon className="mb-4 text-navy" size={28} />
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-navy/65">{copy}</p>
          </section>
        ))}
      </section>

      <section id="workflow" className="bg-white/60 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2">
          <img className="h-[420px] w-full rounded-xl object-cover shadow-sm" src={counterImage} alt="Store checkout counter" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-navy/50">Daily workflow</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Made for the real rhythm of a shop day.</h2>
            <div className="mt-6 grid gap-3">
              {["Add products with initial stock", "Record sales from searchable product input", "Restock from recommendations", "Review analytics and stock movements"].map((item) => (
                <div className="flex items-center gap-3 rounded-lg bg-cream p-3" key={item}>
                  <CheckCircle2 className="text-green-600" size={20} />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="mx-auto max-w-7xl px-5 py-16">
        <div className="rounded-2xl bg-navy p-8 text-white md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Ready when your shop is</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Start managing inventory with Inventra today.</h2>
              <p className="mt-3 max-w-2xl text-white/70">Create your shop account, add products, and begin recording sales in minutes.</p>
            </div>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-navy" to="/register">
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy/10 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-navy/60 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-black text-navy">
            <Store size={18} />
            Inventra
          </div>
          <p>Copyright © Team Inventra 2025</p>
        </div>
      </footer>
    </main>
  );
}
