import { body } from "express-validator";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { escapeRegex, fail, generateSku, ok, pagination } from "../utils/helpers.js";

export const productRules = [
  body("name").notEmpty(),
  body("category").notEmpty(),
  body("costPrice").isFloat({ min: 0 }),
  body("sellingPrice").isFloat({ min: 0 })
];

export async function listProducts(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { owner: req.user._id, isActive: true };
  if (req.query.search) filter.$text = { $search: String(req.query.search).trim().slice(0, 100) };
  if (req.query.category) filter.category = new RegExp(`^${escapeRegex(String(req.query.category).trim().slice(0, 100))}$`, "i");

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  ok(res, { items, total, page, pages: Math.ceil(total / limit) || 1 }, "Products loaded");
}

export async function createProduct(req, res) {
  const sku = req.body.sku || (await generateSku(req.user._id, req.body.category));
  const product = await Product.create({
    owner: req.user._id,
    name: req.body.name,
    sku,
    category: req.body.category,
    unit: req.body.unit,
    costPrice: req.body.costPrice,
    sellingPrice: req.body.sellingPrice,
    description: req.body.description,
    isActive: req.body.isActive
  });
  await Inventory.create({
    owner: req.user._id,
    product: product._id,
    currentStock: Number(req.body.currentStock || 0),
    reorderPoint: Number(req.body.reorderPoint || 10),
    reorderQuantity: Number(req.body.reorderQuantity || 20)
  });
  if (Number(req.body.currentStock || 0) > 0) {
    await StockMovement.create({
      owner: req.user._id,
      product: product._id,
      movementType: "purchase",
      quantity: Number(req.body.currentStock),
      reason: "Opening stock"
    });
  }
  ok(res, product, "Product created", 201);
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
  if (!product || !product.isActive) return fail(res, "Product not found", 404);
  ok(res, product, "Product loaded");
}

export async function updateProduct(req, res) {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    {
      name: req.body.name,
      category: req.body.category,
      unit: req.body.unit,
      costPrice: req.body.costPrice,
      sellingPrice: req.body.sellingPrice,
      description: req.body.description,
      isActive: req.body.isActive
    },
    { new: true, runValidators: true }
  );
  if (!product) return fail(res, "Product not found", 404);
  ok(res, product, "Product updated");
}

export async function deleteProduct(req, res) {
  const product = await Product.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { isActive: false }, { new: true });
  if (!product) return fail(res, "Product not found", 404);
  ok(res, product, "Product archived");
}
