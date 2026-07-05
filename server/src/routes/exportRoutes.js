import { Router } from "express";
import { param } from "express-validator";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireBillingLevel } from "../middleware/auth.js";
import { exportUserData } from "../controllers/exportController.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const exportRule = [param("type").isIn(["products", "sales", "movements"])];

router.use(protect);
router.use(requireBillingLevel(["pro"]));
router.get("/:type", exportRule, validate, asyncHandler(exportUserData));

export default router;
