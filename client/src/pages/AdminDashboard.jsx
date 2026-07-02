import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Boxes, CircleDollarSign, Download, HeartPulse, ReceiptText, Search, Shield, ShieldCheck, Store, Users } from "lucide-react";
import api from "../api/api";
import DataTable from "../components/DataTable";
import KPICard from "../components/KPICard";
import Modal from "../components/Modal";

const exportTypes = ["users", "products", "inventory", "sales", "movements"];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function userStatus(user) {
  return user.isSuspended ? "Suspended" : "Active";
}

function statusClass(user) {
  if (user.isSuspended) return "bg-red-50 text-red-700 ring-red-200";
  return "bg-green-50 text-green-700 ring-green-200";
}

function billingLevel(user) {
  return user?.billingLevel || "free";
}

function billingClass(user) {
  const level = billingLevel(user);
  if (level === "pro") return "bg-navy text-white ring-navy";
  if (level === "basic") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function formatLevel(level) {
  return `${(level || "free").charAt(0).toUpperCase()}${(level || "free").slice(1)}`;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [health, setHealth] = useState(null);
  const [audits, setAudits] = useState([]);
  const [editForm, setEditForm] = useState(null);

  async function load() {
    const [summaryRes, usersRes, healthRes, auditRes] = await Promise.all([
      api.get("/admin/summary"),
      api.get(`/admin/users?limit=100&search=${encodeURIComponent(search)}`),
      api.get("/admin/health"),
      api.get("/admin/audit-logs?limit=25")
    ]);
    setSummary(summaryRes.data.data);
    setUsers(usersRes.data.data.items);
    setHealth(healthRes.data.data);
    setAudits(auditRes.data.data.items);
  }

  useEffect(() => {
    load();
  }, []);

  async function openUser(user) {
    const res = await api.get(`/admin/users/${user._id}`);
    setSelected(res.data.data);
    setEditForm({
      name: res.data.data.user.name || "",
      email: res.data.data.user.email || "",
      shopName: res.data.data.user.shopName || "",
      phone: res.data.data.user.phone || ""
    });
  }

  async function refreshUser(userId) {
    await load();
    if (selected?.user?._id === userId) {
      const res = await api.get(`/admin/users/${userId}`);
      setSelected(res.data.data);
      setEditForm({
        name: res.data.data.user.name || "",
        email: res.data.data.user.email || "",
        shopName: res.data.data.user.shopName || "",
        phone: res.data.data.user.phone || ""
      });
    }
  }

  async function saveUser(e) {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${selected.user._id}`, editForm);
      toast.success("User updated");
      await refreshUser(selected.user._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update user");
    }
  }

  async function setRole(user, isAdmin) {
    try {
      await api.put(`/admin/users/${user._id}/role`, { isAdmin });
      toast.success("Role updated");
      await refreshUser(user._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update role");
    }
  }

  async function setSuspension(user, isSuspended) {
    const reason = isSuspended ? window.prompt("Reason for suspension?", "Policy or support review") : "";
    if (isSuspended && reason === null) return;

    try {
      await api.put(`/admin/users/${user._id}/suspension`, { isSuspended, reason });
      toast.success(isSuspended ? "User suspended" : "User reactivated");
      await refreshUser(user._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update account status");
    }
  }

  async function exportData(type) {
    try {
      const res = await api.get(`/admin/exports/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventra-${type}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} export started`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not export data");
    }
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        <KPICard icon={Users} label="Total Users" value={summary.users || 0} />
        <KPICard icon={Store} label="Shop Users" value={summary.shops || 0} />
        <KPICard icon={ShieldCheck} label="Admins" value={summary.admins || 0} />
        <KPICard icon={Shield} label="Suspended" value={summary.suspended || 0} />
        <KPICard icon={Boxes} label="Products" value={summary.products || 0} />
        <KPICard icon={ReceiptText} label="Sales" value={summary.sales || 0} />
        <KPICard icon={CircleDollarSign} label="Revenue" value={`Rs. ${summary.revenue || 0}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          <div className="card grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-navy/50">User Management</p>
                <h2 className="text-2xl font-black">Shops and admins</h2>
                <p className="mt-1 text-sm text-navy/60">Review accounts, open shop details, and manage access from one cleaner list.</p>
              </div>
              <form className="flex w-full gap-2 md:max-w-md" onSubmit={(event) => { event.preventDefault(); load(); }}>
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" size={17} />
                  <input className="input pl-9" placeholder="Search name, email, or shop" value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
                <button className="btn-primary">Search</button>
              </form>
            </div>
          </div>

          <section className="grid gap-3">
            {users.length ? users.map((user) => (
              <article className="card grid gap-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(340px,2fr)_auto] lg:items-center" key={user._id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-black">{user.shopName || user.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(user)}`}>{userStatus(user)}</span>
                    <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-black text-navy/70 ring-1 ring-navy/10">
                      {user.isAdmin ? "Admin" : "Shop user"}
                    </span>
                    {!user.isAdmin && <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${billingClass(user)}`}>{formatLevel(billingLevel(user))}</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-navy/60">{user.name} - {user.email}</p>
                  <p className="mt-1 text-xs font-semibold text-navy/45">Last login: {formatDate(user.lastLoginAt)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <UserMetric label="Products" value={user.products || 0} />
                  <UserMetric label="Sales" value={user.sales || 0} />
                  <UserMetric label="Revenue" value={`Rs. ${user.revenue || 0}`} />
                  <UserMetric label="Stock Value" value={`Rs. ${user.stockValue || 0}`} />
                </div>

                <div className="flex gap-2 lg:justify-end">
                  <button className="btn-primary w-full lg:w-auto" onClick={() => openUser(user)}>Manage</button>
                </div>
              </article>
            )) : (
              <p className="card text-sm text-navy/60">No users found</p>
            )}
          </section>
        </div>

        <aside className="grid gap-4">
          <section className="card">
            <div className="mb-3 flex items-center gap-2">
              <HeartPulse size={20} />
              <h2 className="font-bold">System Health</h2>
            </div>
            <div className="grid gap-2 text-sm">
              <HealthRow label="API" value={health?.api || "loading"} />
              <HealthRow label="Database" value={health?.database || "loading"} />
              <HealthRow label="Uptime" value={`${health?.uptimeSeconds || 0}s`} />
              <HealthRow label="Environment" value={health?.environment || "-"} />
              <HealthRow label="Audit Logs" value={health?.collections?.auditLogs || 0} />
            </div>
          </section>

          <section className="card">
            <div className="mb-3 flex items-center gap-2">
              <Download size={20} />
              <h2 className="font-bold">Exports</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {exportTypes.map((type) => (
                <button className="btn-secondary capitalize" key={type} onClick={() => exportData(type)}>
                  <Download size={16} /> {type}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="grid gap-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent Audit Logs</h2>
          <button className="btn-secondary" onClick={load}>Refresh</button>
        </div>
        <DataTable
          columns={["Action", "Message", "Actor", "Target", "Date"]}
          rows={audits}
          empty="No audit activity yet"
          renderRow={(audit) => [
            audit.action,
            audit.message,
            audit.actor?.name || audit.actor?.email || "-",
            audit.targetUser?.shopName || audit.targetUser?.name || audit.targetUser?.email || "-",
            formatDate(audit.createdAt)
          ]}
        />
      </section>

      {selected && (
        <Modal title={`${selected.user.name} - ${selected.user.shopName || "Admin account"}`} onClose={() => setSelected(null)} maxWidth="max-w-5xl">
          <div className="grid max-h-[76vh] gap-4 overflow-y-auto pr-2">
            <section className="rounded-lg border border-navy/10 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black">{selected.user.shopName || selected.user.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(selected.user)}`}>{userStatus(selected.user)}</span>
                    <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-black text-navy/70 ring-1 ring-navy/10">
                      {selected.user.isAdmin ? "Admin" : "Shop user"}
                    </span>
                    {!selected.user.isAdmin && <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${billingClass(selected.user)}`}>{formatLevel(billingLevel(selected.user))}</span>}
                  </div>
                  <p className="mt-1 text-sm text-navy/60">{selected.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => setRole(selected.user, !selected.user.isAdmin)}>
                    {selected.user.isAdmin ? "Make Shop User" : "Make Admin"}
                  </button>
                  <button className={selected.user.isSuspended ? "btn-primary" : "btn-secondary"} onClick={() => setSuspension(selected.user, !selected.user.isSuspended)}>
                    {selected.user.isSuspended ? "Reactivate Account" : "Suspend Account"}
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              <MiniStat label="Products" value={selected.summary?.products || 0} />
              <MiniStat label="30 Day Sales" value={selected.summary?.sales30Days || 0} />
              <MiniStat label="30 Day Revenue" value={`Rs. ${selected.summary?.revenue30Days || 0}`} />
              <MiniStat label="Stock Value" value={`Rs. ${selected.summary?.stockValue || 0}`} />
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <form className="grid gap-3 rounded-lg bg-cream p-3 md:grid-cols-2" onSubmit={saveUser}>
                <div className="md:col-span-2">
                  <h3 className="font-black">Profile details</h3>
                  <p className="text-sm text-navy/60">Update basic shop contact information.</p>
                </div>
                <Field label="Name">
                  <input className="input" value={editForm?.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" value={editForm?.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                </Field>
                <Field label="Shop">
                  <input className="input" value={editForm?.shopName || ""} onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className="input" value={editForm?.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </Field>
                <button className="btn-primary md:col-span-2">Save Profile</button>
              </form>

              <div className="grid content-start gap-2 rounded-lg bg-cream p-3 text-sm">
                <h3 className="font-black">Account snapshot</h3>
                <InfoLine label="Role" value={selected.user.isAdmin ? "Admin" : "Shop user"} />
                {!selected.user.isAdmin && <InfoLine label="Use Level" value={formatLevel(billingLevel(selected.user))} />}
                <InfoLine label="Status" value={userStatus(selected.user)} />
                <InfoLine label="Joined" value={formatDate(selected.user.createdAt)} />
                <InfoLine label="Last Login" value={formatDate(selected.user.lastLoginAt)} />
                {selected.user.suspendedReason && <InfoLine label="Reason" value={selected.user.suspendedReason} />}
              </div>
            </section>

            <AdminMiniTable title="Recent Products" columns={["Name", "Category", "Price"]} rows={selected.products} renderRow={(p) => [p.name, p.category, `Rs. ${p.sellingPrice}`]} />
            <AdminMiniTable title="Recent Sales" columns={["Invoice", "Total", "Date"]} rows={selected.sales} renderRow={(s) => [s.invoiceNumber, `Rs. ${s.totalAmount}`, formatDate(s.saleDate)]} />
            <AdminMiniTable title="Inventory Snapshot" columns={["Product", "Stock", "Reorder"]} rows={selected.inventory} renderRow={(i) => [i.product?.name || "Product", i.currentStock, i.reorderPoint]} />
            <AdminMiniTable title="Recent Movements" columns={["Product", "Type", "Qty", "Date"]} rows={selected.movements} renderRow={(m) => [m.product?.name || "Product", m.movementType, m.quantity, formatDate(m.createdAt)]} />
            <AdminMiniTable title="User Audit Logs" columns={["Action", "Message", "Actor", "Date"]} rows={selected.audits} renderRow={(a) => [a.action, a.message, a.actor?.name || "-", formatDate(a.createdAt)]} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-navy/70">
      {label}
      {children}
    </label>
  );
}

function HealthRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-cream px-3 py-2">
      <span className="font-semibold text-navy/60">{label}</span>
      <strong className="text-right capitalize">{value}</strong>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="font-semibold text-navy/60">{label}</span>
      <strong className="text-right">{value}</strong>
    </p>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-cream p-3">
      <p className="text-xs font-bold uppercase text-navy/50">{label}</p>
      <strong className="text-xl">{value}</strong>
    </div>
  );
}

function UserMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-cream px-3 py-2">
      <p className="text-xs font-bold uppercase text-navy/45">{label}</p>
      <strong className="block truncate text-sm">{value}</strong>
    </div>
  );
}

function AdminMiniTable({ title, columns, rows, renderRow }) {
  return (
    <section>
      <h3 className="mb-2 font-black">{title}</h3>
      <DataTable columns={columns} rows={rows || []} renderRow={renderRow} empty="No records" />
    </section>
  );
}
