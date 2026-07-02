import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("If an account exists, a reset link has been sent.");
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset link");
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
            <h1 className="text-3xl font-black">Forgot password?</h1>
            <p className="text-sm text-navy/60">
              Enter your email to receive a reset link
            </p>
          </div>
        </div>

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="btn-primary mt-4" disabled={loading}>
          {loading ? (
            "Sending..."
          ) : (
            <>
              Send reset link <ArrowRight size={17} />
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
