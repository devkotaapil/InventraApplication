import { body } from "express-validator";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import StockMovement from "../models/StockMovement.js";
import { fail, generateInvoiceNumber, ok, pagination } from "../utils/helpers.js";

export const saleRules = [
  body("items").isArray({ min: 1 }),
  body("items.*.product").notEmpty(),
  body("items.*.quantity").isInt({ min: 1 }),
  body("paymentMethod").optional().isIn(["cash", "card", "digital"])
];

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createSale(req, res) {
  const requestedQuantities = new Map();
  const session = await mongoose.startSession();

  for (const item of req.body.items) {
    requestedQuantities.set(item.product, (requestedQuantities.get(item.product) || 0) + Number(item.quantity));
  }

  try {
    let sale;

    await session.withTransaction(async () => {
      const saleItems = [];
      let total = 0;

      for (const [productId, quantity] of requestedQuantities.entries()) {
        const product = await Product.findOne({ _id: productId, owner: req.user._id }).session(session);
        if (!product || !product.isActive) throw httpError("Product not found", 404);

        const inventory = await Inventory.findOneAndUpdate(
          {
            owner: req.user._id,
            product: productId,
            currentStock: { $gte: quantity }
          },
          { $inc: { currentStock: -quantity } },
          { new: true, session }
        );

        if (!inventory) {
          throw httpError(`${product.name} does not have enough stock`, 409);
        }

        const subtotal = product.sellingPrice * quantity;
        total += subtotal;
        saleItems.push({ product: product._id, quantity, unitPrice: product.sellingPrice, subtotal });
      }

      const discount = Number(req.body.discount || 0);
      [sale] = await Sale.create(
        [
          {
            owner: req.user._id,
            invoiceNumber: await generateInvoiceNumber(req.user._id),
            items: saleItems,
            totalAmount: total - discount,
            discount,
            paymentMethod: req.body.paymentMethod || "cash"
          }
        ],
        { session }
      );

      await StockMovement.insertMany(
        saleItems.map((item) => ({
          owner: req.user._id,
          product: item.product,
          movementType: "sale",
          quantity: -item.quantity,
          reason: "Sale",
          reference: sale._id
        })),
        { session }
      );
    });

    ok(res, sale, "Sale recorded", 201);
  } catch (error) {
    if (error?.code === 11000) {
      return fail(res, "Could not complete the sale. Please try again.", 409);
    }

    if (error?.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

export async function listSales(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { owner: req.user._id };
  if (req.query.from || req.query.to) filter.saleDate = {};
  if (req.query.from) filter.saleDate.$gte = new Date(req.query.from);
  if (req.query.to) filter.saleDate.$lte = new Date(req.query.to);
  const [items, total] = await Promise.all([
    Sale.find(filter).populate("items.product").sort({ saleDate: -1 }).skip(skip).limit(limit),
    Sale.countDocuments(filter)
  ]);
  ok(res, { items, total, page, pages: Math.ceil(total / limit) || 1 }, "Sales loaded");
}

export async function getSale(req, res) {
  const sale = await Sale.findOne({ _id: req.params.id, owner: req.user._id }).populate("items.product");
  if (!sale) return fail(res, "Sale not found", 404);
  ok(res, sale, "Sale loaded");
}

export async function dailySummary(_req, res) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const data = await Sale.aggregate([{ $match: { owner: req.user._id, saleDate: { $gte: start } } }, { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }]);
  ok(res, data[0] || { total: 0, count: 0 }, "Daily summary loaded");
}

export async function monthlySummary(_req, res) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const data = await Sale.aggregate([{ $match: { owner: req.user._id, saleDate: { $gte: start } } }, { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }]);
  ok(res, data[0] || { total: 0, count: 0 }, "Monthly summary loaded");
}
