import React from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  Home,
  Lightbulb,
  PackageCheck,
  ReceiptText,
  Shield,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/dashboard", "Dashboard", Home, false],
  ["/products", "Products", Boxes, false],
  ["/inventory", "Inventory", PackageCheck, false],
  ["/sales", "Sales", ReceiptText, false],
  ["/analytics", "Analytics", BarChart3, "Basic"],
  ["/movements", "Movements", ClipboardList, "Basic"],
  ["/recommendations", "Recommendations", Lightbulb, "Pro"],
  ["/smart-pairing", "Smart Pairing", TrendingUp, "Pro"],
  ["/billing", "Billing", CreditCard, false],
];

export default function Sidebar() {
  const { user } = useAuth();
  const visibleLinks = user?.isAdmin ? [["/admin", "Admin", Shield]] : links;

  return (
    <aside className="bg-navy p-4 text-white lg:min-h-screen">
      <div className="mb-6 text-2xl font-black">Inventra</div>
      <nav className="flex gap-2 overflow-x-auto lg:grid">
        {visibleLinks.map(([to, label, Icon, level]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-10 shrink-0 items-center justify-between gap-2 rounded-lg px-3 text-sm font-semibold ${isActive ? "bg-white text-navy" : "text-white/80 hover:bg-white/10"}`
            }
          >
            <span className="flex items-center gap-2">
              <Icon size={18} />
              {label}
            </span>
            {level && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase">
                {level}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <TrendingUp className="mt-8 hidden text-white/20 lg:block" size={80} />
    </aside>
  );
}
