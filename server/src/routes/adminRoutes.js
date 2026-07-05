import { Router } from "express";
import { param } from "express-validator";
import {
  adminSummary,
  exportData,
  getUserDetails,
  listAuditLogs,
  listUsers,
  roleRules,
  setUserRole,
  setUserSuspension,
  suspensionRules,
  systemHealth,
  updateUser,
  updateUserRules,
} from "../controllers/adminController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const userIdRule = [param("id").isMongoId()];
const exportRule = [
  param("type").isIn(["users", "products", "inventory", "sales", "movements"]),
];

router.use(protect, requireAdmin);
router.get("/summary", asyncHandler(adminSummary));
router.get("/health", asyncHandler(systemHealth));
router.get("/audit-logs", asyncHandler(listAuditLogs));
router.get("/exports/:type", exportRule, validate, asyncHandler(exportData));
router.get("/users", asyncHandler(listUsers));
router.get("/users/:id", userIdRule, validate, asyncHandler(getUserDetails));
router.put(
  "/users/:id",
  userIdRule,
  updateUserRules,
  validate,
  asyncHandler(updateUser),
);
router.put(
  "/users/:id/suspension",
  userIdRule,
  suspensionRules,
  validate,
  asyncHandler(setUserSuspension),
);
router.put(
  "/users/:id/role",
  userIdRule,
  roleRules,
  validate,
  asyncHandler(setUserRole),
);

export default router;
