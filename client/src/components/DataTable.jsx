import React from "react";

export default function DataTable({
  columns,
  rows,
  renderRow,
  empty = "No data",
}) {
  if (!rows?.length)
    return <p className="card text-sm text-navy/60">{empty}</p>;

  return (
    <div className="card">
      <div className="hidden md:block max-h-[68vh] overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-navy/60">
              {columns.map((col) => (
                <th className="border-b border-navy/10 p-3" key={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row._id || row.id || row.invoiceNumber || rowIndex}>
                {renderRow(row).map((cell, index) => (
                  <td className="border-b border-navy/10 p-3" key={index}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {rows.map((row, rowIndex) => {
          const cells = renderRow(row);
          return (
            <div
              key={row._id || row.id || row.invoiceNumber || rowIndex}
              className="rounded-3xl border border-navy/10 bg-slate-50 p-4 shadow-sm"
            >
              {columns.map((col, colIndex) => (
                <div className="mb-3 last:mb-0" key={col}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/50">
                    {col}
                  </div>
                  <div className="mt-1 text-sm text-navy">
                    {cells[colIndex]}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
