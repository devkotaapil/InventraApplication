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
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        qty: { $sum: "$items.quantity" },
      },
    },
  ]);

  if (daily.length < 5) {
    return {
      reorderPoint: inventory?.reorderPoint || 0,
      shouldReorder: inventory
        ? inventory.currentStock <= inventory.reorderQuantity / 2
        : false,
    };
  }

  const quantities = daily.map((day) => day.qty);
  const avg = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
  const variance =
    quantities.reduce((sum, qty) => sum + Math.pow(qty - avg, 2), 0) /
    quantities.length;
  const stdDev = Math.sqrt(variance);
  const safetyStock = 1.65 * stdDev * Math.sqrt(leadTimeDays);
  const reorderPoint = Math.ceil(avg * leadTimeDays + safetyStock);

  return {
    reorderPoint,
    shouldReorder: inventory ? inventory.currentStock <= reorderPoint : false,
  };
}

export async function abcAnalysis(owner) {
  const rows = await Sale.aggregate([
    { $match: { owner } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", revenue: { $sum: "$items.subtotal" } } },
    { $sort: { revenue: -1 } },
  ]);
  const total = rows.reduce((sum, row) => sum + row.revenue, 0) || 1;
  let cumulative = 0;

  return Promise.all(
    rows.map(async (row) => {
      const product = await Product.findById(row._id).lean();
      const revenueShare = row.revenue / total;
      cumulative += revenueShare;
      const classification =
        cumulative <= 0.7 ? "A" : cumulative <= 0.9 ? "B" : "C";
      return {
        product,
        class: classification,
        revenue: row.revenue,
        revenueShare,
      };
    }),
  );
}

export async function recommendations(owner) {
  const inventory = await Inventory.find({ owner }).populate("product").lean();
  const abc = await abcAnalysis(owner);
  const abcMap = new Map(
    abc.map((item) => [String(item.product?._id), item.class]),
  );
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
      stockValue: item.currentStock * item.product.sellingPrice,
    };
  }

  for (const item of inventory) {
    if (!item.product) continue;
    const productId = String(item.product._id);
    const soldRecently = await Sale.exists({
      owner,
      saleDate: { $gte: since },
      "items.product": item.product._id,
    });

    if (item.currentStock === 0)
      alerts.push(
        makeAlert(item, "urgent", `${item.product.name} is OUT OF STOCK.`),
      );
    if (item.currentStock <= item.reorderPoint)
      alerts.push(
        makeAlert(
          item,
          "warning",
          `Reorder ${item.product.name}. Stock is critically low.`,
        ),
      );
    if (
      abcMap.get(productId) === "A" &&
      item.currentStock <= item.reorderPoint
    ) {
      alerts.push(
        makeAlert(
          item,
          "urgent",
          `${item.product.name} is a top seller with low stock. Reorder immediately.`,
        ),
      );
    }
    if (!soldRecently && item.currentStock > item.reorderQuantity) {
      alerts.push(
        makeAlert(
          item,
          "info",
          `${item.product.name} has no sales in 30 days. Consider a discount or promotion.`,
        ),
      );
    }
  }

  return alerts;
}

export async function smartStockPairing(owner) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sales = await Sale.aggregate([
    { $match: { owner, saleDate: { $gte: since } } },
    { $project: { items: 1 } },
  ]);

  const transactions = sales.map((sale) =>
    Array.from(new Set(sale.items.map((item) => String(item.product)))),
  );
  const totalTransactions = transactions.length;
  if (!totalTransactions) return [];

  const itemCounts = new Map();
  const pairCounts = new Map();
  const itemQuantities = new Map();

  for (const sale of sales) {
    const productSet = new Set();
    for (const item of sale.items) {
      const productId = String(item.product);
      itemQuantities.set(
        productId,
        (itemQuantities.get(productId) || 0) + item.quantity,
      );
      productSet.add(productId);
    }

    const products = Array.from(productSet);
    for (const productId of products) {
      itemCounts.set(productId, (itemCounts.get(productId) || 0) + 1);
    }

    for (let i = 0; i < products.length; i += 1) {
      for (let j = i + 1; j < products.length; j += 1) {
        const [first, second] = [products[i], products[j]].sort();
        const key = `${first}|${second}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  if (!pairCounts.size) return [];

  const productIds = Array.from(new Set([...itemCounts.keys()]));
  const products = await Product.find({
    owner,
    _id: { $in: productIds },
  }).lean();
  const inventory = await Inventory.find({
    owner,
    product: { $in: productIds },
  }).lean();
  const productMap = new Map(
    products.map((product) => [String(product._id), product]),
  );
  const stockMap = new Map(
    inventory.map((item) => [String(item.product), item.currentStock || 0]),
  );

  const rules = [];
  for (const [key, supportCount] of pairCounts.entries()) {
    const [itemA, itemB] = key.split("|");
    const support = supportCount / totalTransactions;
    const confidenceAtoB = supportCount / (itemCounts.get(itemA) || 1);
    const confidenceBtoA = supportCount / (itemCounts.get(itemB) || 1);
    const supportA = (itemCounts.get(itemA) || 0) / totalTransactions;
    const supportB = (itemCounts.get(itemB) || 0) / totalTransactions;
    const lift = supportA * supportB > 0 ? support / (supportA * supportB) : 0;

    const currentA = stockMap.get(itemA) ?? 0;
    const currentB = stockMap.get(itemB) ?? 0;
    const demandA = itemQuantities.get(itemA) || 0;
    const demandB = itemQuantities.get(itemB) || 0;
    const lowA = demandA > 0 && currentA < demandA * 0.3;
    const lowB = demandB > 0 && currentB < demandB * 0.3;

    let action =
      "These products are frequently bought together. Consider pairing them in promotions or restocking them together.";
    if (lowA && lowB) {
      action =
        "Both items are low while often purchased together. Replenish this bundle promptly.";
    } else if (lowA) {
      action =
        "Primary product stock is low. Keep its pair stocked together for cross-selling.";
    } else if (lowB) {
      action =
        "Paired product stock is low. Consider promotions to balance inventory and sales.";
    }

    rules.push({
      id: key,
      itemA,
      itemB,
      itemAName: productMap.get(itemA)?.name || "Unknown",
      itemASku: productMap.get(itemA)?.sku || "-",
      itemBName: productMap.get(itemB)?.name || "Unknown",
      itemBSku: productMap.get(itemB)?.sku || "-",
      support: Number(support.toFixed(3)),
      confidenceAtoB: Number(confidenceAtoB.toFixed(3)),
      confidenceBtoA: Number(confidenceBtoA.toFixed(3)),
      lift: Number(lift.toFixed(3)),
      currentA,
      currentB,
      demandA,
      demandB,
      action,
      lowA,
      lowB,
    });
  }

  return rules.sort((a, b) => b.lift - a.lift).slice(0, 30);
}
