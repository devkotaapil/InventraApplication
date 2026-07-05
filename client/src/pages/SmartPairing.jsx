import React, { useEffect, useState } from "react";
import api from "../api/api";
import DataTable from "../components/DataTable";

export default function SmartPairing() {
  const [pairings, setPairings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPairings() {
      setLoading(true);
      try {
        const res = await api.get("/analytics/smart-pairing");
        setPairings(res.data.data);
      } finally {
        setLoading(false);
      }
    }
    loadPairings();
  }, []);

  return (
    <div className="grid gap-4">
      <section className="card">
        <div className="flex flex-col gap-2">
          
          <h1 className="text-3xl font-black">Smart stock pairing</h1>
          <p className="max-w-2xl text-sm leading-6 text-navy/60">
            
          </p>
        </div>
      </section>

      <DataTable
        columns={[
          "Item A",
          "Item B",
          "Recommended Action",
        ]}
        rows={pairings}
        empty={
          loading
            ? "Loading market basket insights..."
            : "No market basket insights available."
        }
        renderRow={(row) => [
          `${row.itemAName}`,
          `${row.itemBName}`,
          row.action,
        ]}
      />
    </div>
  );
}
