import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import api from "./api/api";
import { useAuth } from "./context/AuthContext";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Inventory from "./pages/Inventory";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Movements from "./pages/Movements";
import Pricing from "./pages/Pricing";
import Products from "./pages/Products";
import Recommendations from "./pages/Recommendations";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Sales from "./pages/Sales";

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function ShopPage({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-cream font-bold text-navy">
        Loading...
      </div>
    );
  if (user?.isAdmin) return <Navigate to="/admin" replace />;

  return <ProtectedPage>{children}</ProtectedPage>;
}

function PaidShopPage({ children, levels = ["basic", "pro"] }) {
  const { user, authLoading } = useAuth();
  const [billing, setBilling] = React.useState(null);
  const [billingLoading, setBillingLoading] = React.useState(true);
  const currentPath = window.location.pathname;

  React.useEffect(() => {
    if (!user || user.isAdmin) {
      setBillingLoading(false);
      return;
    }

    setBillingLoading(true);
    api
      .get("/billing/me")
      .then((res) => setBilling(res.data.data))
      .catch(() => setBilling(null))
      .finally(() => setBillingLoading(false));
  }, [user]);

  if (authLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-cream font-bold text-navy">
        Loading...
      </div>
    );
  if (user?.isAdmin) return <Navigate to="/admin" replace />;
  if (billingLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-cream font-bold text-navy">
        Checking subscription...
      </div>
    );
  if (!levels.includes(billing?.level) || !billing?.subscription?.isActive) {
    window.sessionStorage.setItem("inventra_billing_return_to", currentPath);
    return <Navigate to="/billing" replace />;
  }

  return <ProtectedPage>{children}</ProtectedPage>;
}

function AdminPage() {
  const { user, authLoading } = useAuth();

  if (authLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-cream font-bold text-navy">
        Loading...
      </div>
    );
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ProtectedPage>
      <AdminDashboard />
    </ProtectedPage>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/" element={<Landing />} />
      <Route
        path="/billing"
        element={
          <ProtectedPage>
            <Billing />
          </ProtectedPage>
        }
      />
      <Route
        path="/billing/return"
        element={
          <ProtectedPage>
            <Billing />
          </ProtectedPage>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ShopPage>
            <Dashboard />
          </ShopPage>
        }
      />
      <Route
        path="/products"
        element={
          <ShopPage>
            <Products />
          </ShopPage>
        }
      />
      <Route
        path="/inventory"
        element={
          <ShopPage>
            <Inventory />
          </ShopPage>
        }
      />
      <Route
        path="/sales"
        element={
          <ShopPage>
            <Sales />
          </ShopPage>
        }
      />
      <Route
        path="/analytics"
        element={
          <PaidShopPage levels={["basic", "pro"]}>
            <Analytics />
          </PaidShopPage>
        }
      />
      <Route
        path="/recommendations"
        element={
          <PaidShopPage levels={["pro"]}>
            <Recommendations />
          </PaidShopPage>
        }
      />
      <Route
        path="/movements"
        element={
          <PaidShopPage levels={["pro"]}>
            <Movements />
          </PaidShopPage>
        }
      />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
