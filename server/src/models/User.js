import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shopName: { type: String, trim: true },
    phone: { type: String, trim: true },
    isAdmin: { type: Boolean, default: false },
    billingLevel: {
      type: String,
      enum: ["free", "basic", "pro"],
      default: "free",
    },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedReason: { type: String, trim: true },
    lastLoginAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
