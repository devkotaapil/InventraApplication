import { Router } from "express";
import { body } from "express-validator";
import { checkout, myBilling, plans, verify } from "../controllers/billingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/plans", asyncHandler(plans));
router.use(protect);
router.get("/me", asyncHandler(myBilling));
router.post("/checkout", [body("planId").notEmpty()], validate, asyncHandler(checkout));
router.post("/verify", [body("pidx").notEmpty()], validate, asyncHandler(verify));

export default router;
