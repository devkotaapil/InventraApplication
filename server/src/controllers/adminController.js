import mongoose from "mongoose";
import { body } from "express-validator";
import AuditLog from "../models/AuditLog.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import User from "../models/User.js";
import { escapeRegex, fail, ok, pagination } from "../utils/helpers.js";

export const updateUserRules = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("shopName").optional({ nullable: true }).isString(),
  body("phone").optional({ nullable: true }).isString()
];

export const suspensionRules = [
  body("isSuspended").isBoolean(),
  body("reason").optional({ nullable: true }).isString()
];

export const roleRules = [body("isAdmin").isBoolean()];

function userLabel(user) {
  return user?.shopName || user?.name || user?.email || "user";
}

async function writeAudit(actor, { targetUser, action, message, metadata }) {
  await AuditLog.create({
    actor: actor._id,
    targetUser,
    action,
    message,
    metadata
  });
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const normalized = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized;
}

function toCsv(headers, rows) {
  return [
    headers.map((header) => csvValue(header.label)).join(","),
    ...rows.map((row) => headers.map((header) => csvValue(header.value(row))).join(","))
  ].join("\n");
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
}

export async function adminSummary(_req, res) {
  const [users, admins, suspended, products, sales, inventory, lowStock, revenue] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isAdmin: true }),
    User.countDocuments({ isSuspended: true }),
    Product.countDocuments({ isActive: true }),
    Sale.countDocuments(),
    Inventory.countDocuments(),
    Inventory.countDocuments({ $expr: { $lte: ["$currentStock", "$reorderPoint"] } }),
    Sale.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }])
  ]);

  ok(
    res,
    {
      users,
      shops: users - admins,
      admins,
      suspended,
      products,
      sales,
      inventory,
      lowStock,
      revenue: revenue[0]?.total || 0
    },
    "Admin summary loaded"
  );
}

export async function listUsers(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = {};

  if (req.query.search) {
    const search = escapeRegex(String(req.query.search).trim().slice(0, 100));
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { shopName: { $regex: search, $options: "i" } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [products, sales, revenue, stockValue] = await Promise.all([
        Product.countDocuments({ owner: user._id, isActive: true }),
        Sale.countDocuments({ owner: user._id }),
        Sale.aggregate([{ $match: { owner: user._id } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Inventory.aggregate([
          { $match: { owner: user._id } },
          { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product" } },
          { $unwind: "$product" },
          { $group: { _id: null, total: { $sum: { $multiply: ["$currentStock", "$product.sellingPrice"] } } } }
        ])
      ]);

      return {
        ...user,
        products,
        sales,
        revenue: revenue[0]?.total || 0,
        stockValue: stockValue[0]?.total || 0
      };
    })
  );

  ok(res, { items: enriched, total, page, pages: Math.ceil(total / limit) || 1 }, "Users loaded");
}

export async function getUserDetails(req, res) {
  const user = await User.findById(req.params.id).select("-password").lean();
  if (!user) return res.status(404).json({ success: false, data: null, message: "User not found" });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [products, inventory, sales, movements, summary, recentRevenue, lowStock, stockValue, audits] = await Promise.all([
    Product.find({ owner: user._id, isActive: true }).sort({ createdAt: -1 }).limit(10).lean(),
    Inventory.find({ owner: user._id }).populate("product").sort({ updatedAt: -1 }).limit(10).lean(),
    Sale.find({ owner: user._id }).populate("items.product").sort({ saleDate: -1 }).limit(10).lean(),
    StockMovement.find({ owner: user._id }).populate("product").sort({ createdAt: -1 }).limit(10).lean(),
    Promise.all([
      Product.countDocuments({ owner: user._id, isActive: true }),
      Sale.countDocuments({ owner: user._id }),
      Inventory.countDocuments({ owner: user._id }),
      StockMovement.countDocuments({ owner: user._id })
    ]),
    Sale.aggregate([{ $match: { owner: user._id, saleDate: { $gte: thirtyDaysAgo } } }, { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }]),
    Inventory.countDocuments({ owner: user._id, $expr: { $lte: ["$currentStock", "$reorderPoint"] } }),
    Inventory.aggregate([
      { $match: { owner: user._id } },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $group: { _id: null, total: { $sum: { $multiply: ["$currentStock", "$product.sellingPrice"] } } } }
    ]),
    AuditLog.find({ targetUser: user._id }).populate("actor", "name email").sort({ createdAt: -1 }).limit(10).lean()
  ]);

  ok(
    res,
    {
      user,
      summary: {
        products: summary[0],
        sales: summary[1],
        inventory: summary[2],
        movements: summary[3],
        lowStock,
        revenue30Days: recentRevenue[0]?.total || 0,
        sales30Days: recentRevenue[0]?.count || 0,
        stockValue: stockValue[0]?.total || 0
      },
      products,
      inventory,
      sales,
      movements,
      audits
    },
    "User details loaded"
  );
}

export async function updateUser(req, res) {
  const before = await User.findById(req.params.id).select("-password");
  if (!before) return fail(res, "User not found", 404);

  const updates = {};
  for (const field of ["name", "email", "shopName", "phone"]) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
  await writeAudit(req.user, {
    targetUser: user._id,
    action: "user.updated",
    message: `Updated ${userLabel(user)} profile details`,
    metadata: { before: { name: before.name, email: before.email, shopName: before.shopName, phone: before.phone }, after: updates }
  });
  ok(res, user, "User updated");
}

export async function setUserSuspension(req, res) {
  if (String(req.user._id) === String(req.params.id)) return fail(res, "You cannot suspend your own admin account", 400);

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return fail(res, "User not found", 404);

  const isSuspended = Boolean(req.body.isSuspended);
  user.isSuspended = isSuspended;
  user.suspendedAt = isSuspended ? new Date() : undefined;
  user.suspendedReason = isSuspended ? req.body.reason || "Suspended by admin" : undefined;
  await user.save();

  await writeAudit(req.user, {
    targetUser: user._id,
    action: isSuspended ? "user.suspended" : "user.reactivated",
    message: `${isSuspended ? "Suspended" : "Reactivated"} ${userLabel(user)}`,
    metadata: { reason: user.suspendedReason }
  });
  ok(res, user, isSuspended ? "User suspended" : "User reactivated");
}

export async function setUserRole(req, res) {
  const isAdmin = Boolean(req.body.isAdmin);
  if (String(req.user._id) === String(req.params.id) && !isAdmin) return fail(res, "You cannot remove your own admin access", 400);

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return fail(res, "User not found", 404);

  const previousRole = user.isAdmin ? "admin" : "shop";
  user.isAdmin = isAdmin;
  await user.save();

  await writeAudit(req.user, {
    targetUser: user._id,
    action: "user.role_changed",
    message: `Changed ${userLabel(user)} role to ${isAdmin ? "admin" : "shop user"}`,
    metadata: { from: previousRole, to: isAdmin ? "admin" : "shop" }
  });
  ok(res, user, "User role updated");
}

export async function listAuditLogs(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = {};
  if (req.query.targetUser) filter.targetUser = req.query.targetUser;
  if (req.query.action) filter.action = req.query.action;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate("actor", "name email").populate("targetUser", "name email shopName").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter)
  ]);

  ok(res, { items, total, page, pages: Math.ceil(total / limit) || 1 }, "Audit logs loaded");
}

export async function exportData(req, res) {
  const type = req.params.type;
  const stamp = new Date().toISOString().slice(0, 10);
  await writeAudit(req.user, {
    action: "data.exported",
    message: `Exported ${type} data`,
    metadata: { type }
  });

  if (type === "users") {
    const rows = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    return sendCsv(
      res,
      `inventra-users-${stamp}.csv`,
      toCsv(
        [
          { label: "Name", value: (row) => row.name },
          { label: "Email", value: (row) => row.email },
          { label: "Shop", value: (row) => row.shopName },
          { label: "Phone", value: (row) => row.phone },
          { label: "Role", value: (row) => (row.isAdmin ? "admin" : "shop") },
          { label: "Billing Level", value: (row) => row.billingLevel || "free" },
          { label: "Suspended", value: (row) => (row.isSuspended ? "yes" : "no") },
          { label: "Last Login", value: (row) => row.lastLoginAt },
          { label: "Created", value: (row) => row.createdAt }
        ],
        rows
      )
    );
  }

  if (type === "products") {
    const rows = await Product.find().populate("owner", "name email shopName").sort({ createdAt: -1 }).lean();
    return sendCsv(
      res,
      `inventra-products-${stamp}.csv`,
      toCsv(
        [
          { label: "Shop", value: (row) => row.owner?.shopName || row.owner?.name },
          { label: "Owner Email", value: (row) => row.owner?.email },
          { label: "SKU", value: (row) => row.sku },
          { label: "Name", value: (row) => row.name },
          { label: "Category", value: (row) => row.category },
          { label: "Cost Price", value: (row) => row.costPrice },
          { label: "Selling Price", value: (row) => row.sellingPrice },
          { label: "Active", value: (row) => (row.isActive ? "yes" : "no") }
        ],
        rows
      )
    );
  }

  if (type === "inventory") {
    const rows = await Inventory.find().populate("owner", "name email shopName").populate("product").sort({ updatedAt: -1 }).lean();
    return sendCsv(
      res,
      `inventra-inventory-${stamp}.csv`,
      toCsv(
        [
          { label: "Shop", value: (row) => row.owner?.shopName || row.owner?.name },
          { label: "Owner Email", value: (row) => row.owner?.email },
          { label: "Product", value: (row) => row.product?.name },
          { label: "SKU", value: (row) => row.product?.sku },
          { label: "Current Stock", value: (row) => row.currentStock },
          { label: "Reorder Point", value: (row) => row.reorderPoint },
          { label: "Reorder Quantity", value: (row) => row.reorderQuantity },
          { label: "Stock Value", value: (row) => (row.currentStock || 0) * (row.product?.sellingPrice || 0) }
        ],
        rows
      )
    );
  }

  if (type === "sales") {
    const rows = await Sale.find().populate("owner", "name email shopName").sort({ saleDate: -1 }).lean();
    return sendCsv(
      res,
      `inventra-sales-${stamp}.csv`,
      toCsv(
        [
          { label: "Shop", value: (row) => row.owner?.shopName || row.owner?.name },
          { label: "Owner Email", value: (row) => row.owner?.email },
          { label: "Invoice", value: (row) => row.invoiceNumber },
          { label: "Items", value: (row) => row.items?.length || 0 },
          { label: "Total", value: (row) => row.totalAmount },
          { label: "Discount", value: (row) => row.discount },
          { label: "Payment", value: (row) => row.paymentMethod },
          { label: "Sale Date", value: (row) => row.saleDate }
        ],
        rows
      )
    );
  }

  if (type === "movements") {
    const rows = await StockMovement.find().populate("owner", "name email shopName").populate("product").sort({ createdAt: -1 }).lean();
    return sendCsv(
      res,
      `inventra-movements-${stamp}.csv`,
      toCsv(
        [
          { label: "Shop", value: (row) => row.owner?.shopName || row.owner?.name },
          { label: "Owner Email", value: (row) => row.owner?.email },
          { label: "Product", value: (row) => row.product?.name },
          { label: "Type", value: (row) => row.movementType },
          { label: "Quantity", value: (row) => row.quantity },
          { label: "Reason", value: (row) => row.reason },
          { label: "Created", value: (row) => row.createdAt }
        ],
        rows
      )
    );
  }

  return fail(res, "Unsupported export type", 400);
}

export async function systemHealth(_req, res) {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown";
  const [users, products, sales, auditLogs] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Sale.countDocuments(),
    AuditLog.countDocuments()
  ]);

  ok(
    res,
    {
      api: "online",
      database: dbState,
      databaseName: mongoose.connection.name,
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      collections: { users, products, sales, auditLogs }
    },
    "System health loaded"
  );
}
