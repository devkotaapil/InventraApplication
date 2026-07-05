import { Router } from "express";
import {
  abc,
  categoryBreakdown,
  dashboard,
  recommendationList,
  revenueTrend,
  smartStockPairing,
  topProducts,
} from "../controllers/analyticsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireBillingLevel } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.get("/dashboard", asyncHandler(dashboard));
router.use(
  ["/top-products", "/revenue-trend", "/abc-analysis", "/category-breakdown"],
  requireBillingLevel(["basic", "pro"]),
);
router.use("/recommendations", requireBillingLevel("pro"));
router.get("/top-products", asyncHandler(topProducts));
router.get("/revenue-trend", asyncHandler(revenueTrend));
router.get("/abc-analysis", asyncHandler(abc));
router.get("/category-breakdown", asyncHandler(categoryBreakdown));
router.get(
  "/smart-pairing",
  requireBillingLevel("pro"),
  asyncHandler(smartStockPairing),
);
router.get("/recommendations", asyncHandler(recommendationList));
export default router;
