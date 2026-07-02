import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  async function submit(e) {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.password);
      toast.success("Password updated successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream p-6">
      <form
        className="w-full max-w-md rounded-xl border border-navy/10 bg-white p-6 shadow-lg"
        onSubmit={submit}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white">
            <Store />
          </div>
          <div>
            <h1 className="text-3xl font-black">Reset password</h1>
            <p className="text-sm text-navy/60">
              Choose a new password for your account
            </p>
          </div>
        </div>

        <label className="relative mb-3 block">
          <input
            className="input pr-12"
            placeholder="New password"
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

        <input
          className="input"
          placeholder="Confirm new password"
          type={showPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          required
        />

        <button className="btn-primary mt-4" disabled={loading}>
          {loading ? (
            "Updating..."
          ) : (
            <>
              Update password <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="mt-5 text-sm text-navy/70">
          Back to{" "}
          <Link className="font-bold text-navy underline" to="/login">
            login
          </Link>
        </p>
      </form>
    </main>
  );
}
