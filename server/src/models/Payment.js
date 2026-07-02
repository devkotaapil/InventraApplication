import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["khalti"], default: "khalti" },
    planId: { type: String, required: true, trim: true },
    level: { type: String, enum: ["basic", "pro"], required: true },
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaisa: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["initiated", "pending", "completed", "failed", "expired", "canceled", "refunded"],
      default: "initiated"
    },
    purchaseOrderId: { type: String, required: true, unique: true },
    pidx: { type: String, trim: true },
    paymentUrl: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    paidAt: { type: Date },
    raw: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ pidx: 1 });

export default mongoose.model("Payment", paymentSchema);
