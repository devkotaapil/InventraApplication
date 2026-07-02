import { Router } from "express";
import { movementList } from "../controllers/analyticsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireBillingLevel } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.use(requireBillingLevel("pro"));
router.get("/", asyncHandler(movementList));
export default router;
