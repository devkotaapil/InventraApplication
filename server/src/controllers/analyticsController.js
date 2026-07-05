import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import {
  abcAnalysis,
  recommendations,
  smartStockPairing as computeSmartStockPairing,
} from "../utils/algorithms.js";
import { ok, pagination } from "../utils/helpers.js";

export async function dashboard(_req, res) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [products, lowStock, todaySales] = await Promise.all([
    Product.countDocuments({ owner: _req.user._id, isActive: true }),
    Inventory.countDocuments({
      owner: _req.user._id,
      $expr: { $lte: ["$currentStock", "$reorderPoint"] },
    }),
    Sale.aggregate([
      { $match: { owner: _req.user._id, saleDate: { $gte: today } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  ok(
    res,
    {
      products,
      lowStock,
      todaySales: todaySales[0]?.count || 0,
      revenue: todaySales[0]?.revenue || 0,
    },
    "Dashboard loaded",
  );
}

export async function topProducts(_req, res) {
  const data = await Sale.aggregate([
    { $unwind: "$items" },
    { $match: { owner: _req.user._id } },
    {
      $group: {
        _id: "$items.product",
        revenue: { $sum: "$items.subtotal" },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
  ok(res, data, "Top products loaded");
}

export async function revenueTrend(req, res) {
  const mode = req.query.mode || "daily";
  const format =
    mode === "monthly" ? "%Y-%m" : mode === "weekly" ? "%G-W%V" : "%Y-%m-%d";
  const data = await Sale.aggregate([
    { $match: { owner: req.user._id } },
    {
      $group: {
        _id: { $dateToString: { format, date: "$saleDate" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  ok(res, data, "Revenue trend loaded");
}

export async function categoryBreakdown(_req, res) {
  const data = await Sale.aggregate([
    { $unwind: "$items" },
    { $match: { owner: _req.user._id } },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category",
        revenue: { $sum: "$items.subtotal" },
      },
    },
    {
      lookUp: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $project:{
        _id: 1,
        revenue: 1,
        categoryName: "$categoryDetails.name",
      }
    },
    { $sort: { revenue: -1 } },
  ]);
  ok(res, data, "Category breakdown loaded");
}

export async function abc(_req, res) {
  ok(res, await abcAnalysis(_req.user._id), "ABC analysis loaded");
}

export async function smartStockPairing(_req, res) {
  ok(
    res,
    await computeSmartStockPairing(_req.user._id),
    "Smart stock pairing loaded",
  );
}

export async function recommendationList(_req, res) {
  ok(res, await recommendations(_req.user._id), "Recommendations loaded");
}

export async function movementList(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { owner: req.user._id };
  if (req.query.product) filter.product = req.query.product;
  if (req.query.type) filter.movementType = req.query.type;
  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .populate("product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StockMovement.countDocuments(filter),
  ]);
  ok(
    res,
    { items, total, page, pages: Math.ceil(total / limit) || 1 },
    "Movements loaded",
  );
}
