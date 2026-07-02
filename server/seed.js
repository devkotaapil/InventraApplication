import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import AuditLog from "./src/models/AuditLog.js";
import Inventory from "./src/models/Inventory.js";
import Payment from "./src/models/Payment.js";
import Product from "./src/models/Product.js";
import Sale from "./src/models/Sale.js";
import StockMovement from "./src/models/StockMovement.js";
import Subscription from "./src/models/Subscription.js";
import User from "./src/models/User.js";
import { generateInvoiceNumber } from "./src/utils/helpers.js";

dotenv.config();
await connectDB();

await Promise.all([
  User.deleteMany({}),
  Product.deleteMany({}),
  Inventory.deleteMany({}),
  Sale.deleteMany({}),
  StockMovement.deleteMany({}),
  AuditLog.deleteMany({}),
  Payment.deleteMany({}),
  Subscription.deleteMany({})
]);

const admin = await User.create({ name: "Inventra Admin", email: "admin@inventra.com", password: "admin123", shopName: "Inventra Demo Store", isAdmin: true });

const productSeeds = [
  ["Basmati Rice 5kg", "Grocery", "bag", 550, 650],
  ["Sunflower Oil 1L", "Grocery", "bottle", 210, 260],
  ["Wheat Flour 2kg", "Grocery", "bag", 130, 170],
  ["Instant Noodles", "Grocery", "pack", 15, 25],
  ["Handwash 250ml", "Personal Care", "bottle", 85, 125],
  ["Toothpaste 150g", "Personal Care", "tube", 95, 140],
  ["Shampoo 180ml", "Personal Care", "bottle", 150, 220],
  ["AA Battery Pack", "Household", "pack", 90, 135],
  ["Dish Soap 500ml", "Household", "bottle", 75, 120],
  ["LED Bulb 9W", "Household", "piece", 130, 190]
];

const products = [];
for (const [name, category, unit, costPrice, sellingPrice] of productSeeds) {
  const prefix = category.slice(0, 3).toUpperCase();
  const sku = `INV-${prefix}-${String(admin._id).slice(-4).toUpperCase()}-${String(products.length + 1).padStart(4, "0")}`;
  const product = await Product.create({ owner: admin._id, name, category, unit, costPrice, sellingPrice, sku, description: `${name} retail item` });
  products.push(product);
  await Inventory.create({
    owner: admin._id,
    product: product._id,
    currentStock: 25 + Math.floor(Math.random() * 80),
    reorderPoint: 12,
    reorderQuantity: 30,
    lastRestocked: new Date()
  });
  await StockMovement.create({ owner: admin._id, product: product._id, movementType: "purchase", quantity: 50, reason: "Opening stock" });
}

for (let day = 29; day >= 0; day--) {
  const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
  const saleCount = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < saleCount; i++) {
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const chosen = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);
    const items = chosen.map((product) => {
      const quantity = 1 + Math.floor(Math.random() * 4);
      return { product: product._id, quantity, unitPrice: product.sellingPrice, subtotal: quantity * product.sellingPrice };
    });
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const sale = await Sale.create({
      owner: admin._id,
      invoiceNumber: await generateInvoiceNumber(admin._id, date),
      items,
      totalAmount,
      discount: 0,
      paymentMethod: ["cash", "card", "digital"][Math.floor(Math.random() * 3)],
      saleDate: date
    });
    for (const item of items) {
      await Inventory.updateOne({ owner: admin._id, product: item.product }, { $inc: { currentStock: -item.quantity } });
      await StockMovement.create({ owner: admin._id, product: item.product, movementType: "sale", quantity: -item.quantity, reason: "Seed sale", reference: sale._id, createdAt: date });
    }
  }
}

console.log("Seed complete");
console.log("Login: admin@inventra.com / admin123");
process.exit(0);
