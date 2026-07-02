import { Router } from "express";
import { param } from "express-validator";
import { adjust, listInventory, lowStock, restock, stockRules } from "../controllers/inventoryController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const productIdRule = [param("productId").isMongoId()];
router.use(protect);
router.get("/", asyncHandler(listInventory));
router.get("/low-stock", asyncHandler(lowStock));
router.put("/restock/:productId", productIdRule, stockRules, validate, asyncHandler(restock));
router.put("/adjust/:productId", productIdRule, stockRules, validate, asyncHandler(adjust));
export default router;
