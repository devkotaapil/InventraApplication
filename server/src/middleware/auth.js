import jwt from "jsonwebtoken";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, data: null, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ success: false, data: null, message: "Unauthorized" });
    if (user.isSuspended) return res.status(403).json({ success: false, data: null, message: "Account suspended" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, data: null, message: "Invalid token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, data: null, message: "Admin access required" });
  }

  next();
}

export function requireBillingLevel(levels) {
  return async (req, res, next) => {
    try {
      if (req.user?.isAdmin) return next();

      const allowedLevels = Array.isArray(levels) ? levels : [levels];
      const userLevel = req.user?.billingLevel || "free";

      if (!allowedLevels.includes(userLevel)) {
        return res.status(402).json({
          success: false,
          data: { code: "SUBSCRIPTION_REQUIRED", requiredLevels: allowedLevels, currentLevel: userLevel },
          message: "Please upgrade your Inventra plan to use this feature."
        });
      }

      if (userLevel === "free") return next();

      const subscription = await Subscription.findOne({ user: req.user._id });
      const isActive = subscription && subscription.status === "active" && subscription.endsAt >= new Date();

      if (!isActive) {
        await User.findByIdAndUpdate(req.user._id, { billingLevel: "free" });
        return res.status(402).json({
          success: false,
          data: { code: "SUBSCRIPTION_REQUIRED", requiredLevels: allowedLevels, currentLevel: "free" },
          message: "Your Inventra plan has expired. Please renew to continue using this feature."
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
