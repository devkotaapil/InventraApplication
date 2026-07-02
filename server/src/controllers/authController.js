import crypto from "crypto";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import { fail, ok } from "../utils/helpers.js";
import {
  sendLoginEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/mailer.js";
import { clearAuthRateLimit } from "../middleware/security.js";

export const registerRules = [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("shopName").optional().isString(),
  body("phone").optional().isString(),
  body("password").isLength({ min: 6 }),
];
export const loginRules = [
  body("email").isEmail(),
  body("password").notEmpty(),
];
export const forgotPasswordRules = [body("email").isEmail()];
export const resetPasswordRules = [
  body("token").notEmpty(),
  body("password").isLength({ min: 6 }),
];
export const updateProfileRules = [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("shopName").optional().isString(),
  body("phone").optional().isString(),
];

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export async function checkSetup(_req, res) {
  const users = await User.countDocuments();
  ok(res, { registered: users > 0, multiUser: true }, "Setup status loaded");
}

export async function register(req, res) {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    shopName: req.body.shopName,
    phone: req.body.phone,
    password: req.body.password,
  });
  sendWelcomeEmail(user).catch((error) => {
    console.error("Welcome email failed:", error.message);
  });
  clearAuthRateLimit(req);
  ok(
    res,
    {
      id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      phone: user.phone,
      isAdmin: user.isAdmin,
    },
    "Registration complete",
    201,
  );
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(req.body.password)))
    return fail(res, "Invalid email or password", 401);
  if (user.isSuspended)
    return fail(
      res,
      "This account has been suspended. Please contact support.",
      403,
    );
  user.lastLoginAt = new Date();
  await user.save();
  sendLoginEmail(user).catch((error) => {
    console.error("Login email failed:", error.message);
  });
  clearAuthRateLimit(req);
  ok(
    res,
    {
      token: tokenFor(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    },
    "Login successful",
  );
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) {
    return ok(
      res,
      null,
      "If an account exists for that email, a reset link has been sent.",
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(user, token);
  return ok(
    res,
    null,
    "If an account exists for that email, a reset link has been sent.",
  );
}

export async function resetPassword(req, res) {
  const user = await User.findOne({
    resetPasswordToken: req.body.token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return fail(res, "This reset link is invalid or has expired.", 400);
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return ok(res, null, "Your password has been updated successfully.");
}

export async function me(req, res) {
  ok(res, req.user, "User loaded");
}

export async function updateProfile(req, res) {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      shopName: req.body.shopName,
      phone: req.body.phone,
    },
    { new: true, runValidators: true },
  ).select("-password");
  ok(res, user, "Profile updated");
}
