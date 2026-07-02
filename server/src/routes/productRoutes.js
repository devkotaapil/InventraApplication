import { Router } from "express";
import { param } from "express-validator";
import { createProduct, deleteProduct, getProduct, listProducts, productRules, updateProduct } from "../controllers/productController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const idRule = [param("id").isMongoId()];
router.use(protect);
router.get("/", asyncHandler(listProducts));
router.post("/", productRules, validate, asyncHandler(createProduct));
router.get("/:id", idRule, validate, asyncHandler(getProduct));
router.put("/:id", idRule, productRules, validate, asyncHandler(updateProduct));
router.delete("/:id", idRule, validate, asyncHandler(deleteProduct));
export default router;
