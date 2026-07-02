import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const counterImage =
  "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", shopName: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    await register(form);
    toast.success("Account created. Please login.");
    navigate("/login");
  }

  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img className="h-full w-full object-cover" src={counterImage} alt="Friendly store counter" />
        <div className="absolute inset-0 bg-navy/50" />
        <div className="absolute bottom-10 left-10 max-w-lg text-white">
          <h2 className="text-4xl font-black leading-tight">Create a private inventory workspace for your own shop.</h2>
          <p className="mt-3 text-white/80">Every account gets separate products, sales, stock logs, analytics, and recommendations.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <form className="grid w-full max-w-md gap-3 rounded-xl border border-navy/10 bg-white p-6 shadow-lg" onSubmit={submit}>
          <div className="mb-2 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white">
              <Store />
            </div>
            <div>
              <h1 className="text-3xl font-black">Sign up</h1>
              <p className="text-sm text-navy/60">Create your account, then choose a plan</p>
            </div>
          </div>
          <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Shop name" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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
          <button className="btn-primary">Create account</button>
          <Link className="text-sm font-semibold underline" to="/login">Already have an account?</Link>
        </form>
      </section>
    </main>
  );
}
