import { Router } from "express";
import { createSale, dailySummary, getSale, listSales, monthlySummary, saleRules } from "../controllers/saleController.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(protect);
router.get("/summary/daily", asyncHandler(dailySummary));
router.get("/summary/monthly", asyncHandler(monthlySummary));
router.post("/", saleRules, validate, asyncHandler(createSale));
router.get("/", asyncHandler(listSales));
router.get("/:id", asyncHandler(getSale));
export default router;
