import AuditLog from "../models/AuditLog.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import { fail } from "../utils/helpers.js";

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const normalized =
    value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function toCsv(headers, rows) {
  return [
    headers.map((header) => csvValue(header.label)).join(","),
    ...rows.map((row) =>
      headers.map((header) => csvValue(header.value(row))).join(","),
    ),
  ].join("\n");
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
}

async function writeAudit(user, { action, message, metadata }) {
  await AuditLog.create({
    actor: user._id,
    action,
    message,
    metadata,
  });
}

export async function exportUserData(req, res) {
  const type = req.params.type;
  const owner = req.user._id;
  const stamp = new Date().toISOString().slice(0, 10);

  await writeAudit(req.user, {
    action: "data.exported",
    message: `Exported ${type} data`,
    metadata: { type },
  });

  if (type === "products") {
    const rows = await Product.find({ owner }).sort({ createdAt: -1 }).lean();
    return sendCsv(
      res,
      `inventra-products-${stamp}.csv`,
      toCsv(
        [
          { label: "SKU", value: (row) => row.sku },
          { label: "Name", value: (row) => row.name },
          { label: "Category", value: (row) => row.category },
          { label: "Cost Price", value: (row) => row.costPrice },
          { label: "Selling Price", value: (row) => row.sellingPrice },
          { label: "Active", value: (row) => (row.isActive ? "yes" : "no") },
          { label: "Created", value: (row) => row.createdAt },
        ],
        rows,
      ),
    );
  }

  if (type === "sales") {
    const rows = await Sale.find({ owner })
      .populate("items.product")
      .sort({ saleDate: -1 })
      .lean();
    return sendCsv(
      res,
      `inventra-sales-${stamp}.csv`,
      toCsv(
        [
          { label: "Invoice", value: (row) => row.invoiceNumber },
          { label: "Sale Date", value: (row) => row.saleDate },
          { label: "Total", value: (row) => row.totalAmount },
          { label: "Discount", value: (row) => row.discount },
          { label: "Payment Method", value: (row) => row.paymentMethod },
          {
            label: "Items",
            value: (row) =>
              row.items
                .map(
                  (item) =>
                    `${item.product?.name || item.product} (${item.quantity})`,
                )
                .join("; "),
          },
        ],
        rows,
      ),
    );
  }

  if (type === "movements") {
    const rows = await StockMovement.find({ owner })
      .populate("product")
      .sort({ createdAt: -1 })
      .lean();
    return sendCsv(
      res,
      `inventra-movements-${stamp}.csv`,
      toCsv(
        [
          { label: "Product", value: (row) => row.product?.name },
          { label: "Type", value: (row) => row.movementType },
          { label: "Quantity", value: (row) => row.quantity },
          { label: "Reason", value: (row) => row.reason || "" },
          { label: "Date", value: (row) => row.createdAt },
        ],
        rows,
      ),
    );
  }

  return fail(res, "Unsupported export type", 400);
}
