import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  checkSetup,
  forgotPassword,
  forgotPasswordRules,
  login,
  loginRules,
  me,
  register,
  registerRules,
  resetPassword,
  resetPasswordRules,
  updateProfile,
  updateProfileRules,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/check-setup", asyncHandler(checkSetup));
router.post(
  "/register",
  authRateLimit,
  registerRules,
  validate,
  asyncHandler(register),
);
router.post("/login", authRateLimit, loginRules, validate, asyncHandler(login));
router.post(
  "/forgot-password",
  authRateLimit,
  forgotPasswordRules,
  validate,
  asyncHandler(forgotPassword),
);
router.post(
  "/reset-password",
  authRateLimit,
  resetPasswordRules,
  validate,
  asyncHandler(resetPassword),
);
router.get("/me", protect, asyncHandler(me));
router.put(
  "/me",
  protect,
  updateProfileRules,
  validate,
  asyncHandler(updateProfile),
);

export default router;
