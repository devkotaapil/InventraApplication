import React, { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, LogOut, Settings, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

export default function Navbar() {
  const { user, logout, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", shopName: user?.shopName || "", phone: user?.phone || "" });

  async function save(e) {
    e.preventDefault();
    await updateProfile(form);
    toast.success("Profile updated");
    setEditing(false);
    setOpen(false);
  }

  return (
    <header className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{user?.isAdmin ? "Admin Dashboard" : user?.shopName || "Retail Management"}</h1>
        <p className="text-sm text-navy/60">Welcome back, {user?.isAdmin ? "Admin User" : user?.name || "Retailer"}</p>
      </div>
      <div className="relative">
        <button className="btn-secondary" onClick={() => setOpen((value) => !value)}>
          <UserRound size={17} /> Account
        </button>
        {open && (
          <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-navy/10 bg-white p-4 shadow-lg">
            <p className="font-bold">{user?.name}</p>
            <p className="text-sm text-navy/60">{user?.email}</p>
            {user?.shopName && <p className="mt-1 text-sm text-navy/70">{user.shopName}</p>}
            <div className="mt-4 grid gap-2">
              {!user?.isAdmin && (
                <Link className="btn-secondary justify-start" to="/billing" onClick={() => setOpen(false)}>
                  <CreditCard size={16} /> Billing
                </Link>
              )}
              <button className="btn-secondary justify-start" onClick={() => setEditing(true)}>
                <Settings size={16} /> Change info
              </button>
              <button className="btn-secondary justify-start" onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <Modal title="Update your profile" onClose={() => setEditing(false)}>
          <form className="grid gap-3" onSubmit={save}>
            <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="input" placeholder="Shop name" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <button className="btn-primary">Save changes</button>
          </form>
        </Modal>
      )}
    </header>
  );
}
