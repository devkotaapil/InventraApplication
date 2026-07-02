import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

export function ok(res, data, message = "OK", status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function fail(res, message, status = 400, data = null) {
  return res.status(status).json({ success: false, data, message });
}

export function pagination(req) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ownerCode(owner) {
  return String(owner).slice(-4).toUpperCase();
}

export async function generateSku(owner, category) {
  const prefix = category.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "GEN";
  const count = await Product.countDocuments({ owner, category: new RegExp(`^${category}$`, "i") });
  return `INV-${prefix}-${ownerCode(owner)}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateInvoiceNumber(owner, date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const time = date.toISOString().slice(11, 19).replaceAll(":", "");
  const milli = String(date.getMilliseconds()).padStart(3, "0");
  const random = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `INV-${stamp}-${ownerCode(owner)}-${time}${milli}${random}`;
}
