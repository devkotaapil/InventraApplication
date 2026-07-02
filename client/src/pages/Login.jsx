import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const shopImage =
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      toast.success("Logged in");
      navigate(user?.isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center p-6">
        <form
          className="w-full max-w-md rounded-xl border border-navy/10 bg-white p-6 shadow-lg"
          onSubmit={submit}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white">
              <Store />
            </div>
            <div>
              <h1 className="text-3xl font-black">
                <Link to="/">Inventra</Link>
              </h1>
              <p className="text-sm text-navy/60">
                Sign in to your shop workspace
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            <input
              className="input"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <label className="relative block">
              <input
                className="input pr-12"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                className="absolute inset-y-0 right-3 inline-flex items-center text-navy/50 hover:text-navy"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <button className="btn-primary">
              Login <ArrowRight size={17} />
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-navy/70">
            <p>
              New shop?{" "}
              <Link className="font-bold text-navy underline" to="/register">
                Create an account
              </Link>
            </p>
            <Link
              className="font-bold text-navy underline"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <p className="mt-2 text-sm text-navy/70">
            Need to see plans first?{" "}
            <Link className="font-bold text-navy underline" to="/pricing">
              View pricing
            </Link>
          </p>
        </form>
      </section>
      <section className="relative hidden overflow-hidden lg:block">
        <img
          className="h-full w-full object-cover"
          src={shopImage}
          alt="Retail store shelves"
        />
        <div className="absolute inset-0 bg-navy/55" />
        <div className="absolute bottom-10 left-10 max-w-lg text-white">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
            Built for local retailers
          </p>
          <h2 className="text-4xl font-black leading-tight">
            Track stock, record sales, and understand your shop at a glance.
          </h2>
        </div>
      </section>
    </main>
  );
}
