import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

export async function calculateReorderPoint(productId, leadTimeDays = 7) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inventory = await Inventory.findOne({ product: productId });
  const daily = await Sale.aggregate([
    { $match: { saleDate: { $gte: since }, "items.product": productId } },
    { $unwind: "$items" },
    { $match: { "items.product": productId } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } }, qty: { $sum: "$items.quantity" } } }
  ]);

  if (daily.length < 5) {
    return {
      reorderPoint: inventory?.reorderPoint || 0,
      shouldReorder: inventory ? inventory.currentStock <= inventory.reorderQuantity / 2 : false
    };
  }

  const quantities = daily.map((day) => day.qty);
  const avg = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
  const variance = quantities.reduce((sum, qty) => sum + Math.pow(qty - avg, 2), 0) / quantities.length;
  const stdDev = Math.sqrt(variance);
  const safetyStock = 1.65 * stdDev * Math.sqrt(leadTimeDays);
  const reorderPoint = Math.ceil(avg * leadTimeDays + safetyStock);

  return { reorderPoint, shouldReorder: inventory ? inventory.currentStock <= reorderPoint : false };
}

export async function abcAnalysis(owner) {
  const rows = await Sale.aggregate([
    { $match: { owner } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", revenue: { $sum: "$items.subtotal" } } },
    { $sort: { revenue: -1 } }
  ]);
  const total = rows.reduce((sum, row) => sum + row.revenue, 0) || 1;
  let cumulative = 0;

  return Promise.all(
    rows.map(async (row) => {
      const product = await Product.findById(row._id).lean();
      const revenueShare = row.revenue / total;
      cumulative += revenueShare;
      const classification = cumulative <= 0.7 ? "A" : cumulative <= 0.9 ? "B" : "C";
      return { product, class: classification, revenue: row.revenue, revenueShare };
    })
  );
}

export async function recommendations(owner) {
  const inventory = await Inventory.find({ owner }).populate("product").lean();
  const abc = await abcAnalysis(owner);
  const abcMap = new Map(abc.map((item) => [String(item.product?._id), item.class]));
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const alerts = [];

  function makeAlert(item, type, message) {
    return {
      type,
      message,
      productId: item.product._id,
      productName: item.product.name,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      sellingPrice: item.product.sellingPrice,
      stockValue: item.currentStock * item.product.sellingPrice
    };
  }

  for (const item of inventory) {
    if (!item.product) continue;
    const productId = String(item.product._id);
    const soldRecently = await Sale.exists({ owner, saleDate: { $gte: since }, "items.product": item.product._id });

    if (item.currentStock === 0) alerts.push(makeAlert(item, "urgent", `${item.product.name} is OUT OF STOCK.`));
    if (item.currentStock <= item.reorderPoint) alerts.push(makeAlert(item, "warning", `Reorder ${item.product.name}. Stock is critically low.`));
    if (abcMap.get(productId) === "A" && item.currentStock <= item.reorderPoint) {
      alerts.push(makeAlert(item, "urgent", `${item.product.name} is a top seller with low stock. Reorder immediately.`));
    }
    if (!soldRecently && item.currentStock > item.reorderQuantity) {
      alerts.push(makeAlert(item, "info", `${item.product.name} has no sales in 30 days. Consider a discount or promotion.`));
    }
  }

  return alerts;
}
