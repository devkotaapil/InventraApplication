import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/api";
import DataTable from "../components/DataTable";

export default function Analytics() {
  const [mode, setMode] = useState("daily");
  const [trend, setTrend] = useState([]);
  const [top, setTop] = useState([]);
  const [categories, setCategories] = useState([]);
  const [abc, setAbc] = useState([]);

  useEffect(() => {
    api
      .get(`/analytics/revenue-trend?mode=${mode}`)
      .then((res) => setTrend(res.data.data));
  }, [mode]);
  useEffect(() => {
    api.get("/analytics/top-products").then((res) => setTop(res.data.data));
    api
      .get("/analytics/category-breakdown")
      .then((res) => setCategories(res.data.data));
    api.get("/analytics/abc-analysis").then((res) => setAbc(res.data.data));
    
  }, []);

  return (
    <div className="grid gap-4">
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Revenue Trend</h2>
          <select
            className="input max-w-40"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line dataKey="revenue" stroke="#1E2A5E" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card h-80 p-2">
          <h2 className="mb-3 font-bold">Top Products</h2>
          <ResponsiveContainer className="p-4">
            <BarChart data={top}>
              <XAxis dataKey="product.name" />
              <YAxis className="text-sm" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#1E2A5E" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-80 p-2">
          <h2 className="mb-3 font-bold">Category Breakdown</h2>
          <ResponsiveContainer className="p-4">
            <PieChart>
              <Pie
                data={categories}
                dataKey="revenue"
                nameKey="_id"
                fill="#1E2A5E"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
      <DataTable
        columns={["Product", "Class", "Revenue", "Share"]}
        rows={abc}
        renderRow={(r) => [
          r.product?.name,
          r.class,
          `Rs. ${Math.round(r.revenue)}`,
          `${Math.round(r.revenueShare * 100)}%`,
        ]}
      />
    </div>
  );
}
