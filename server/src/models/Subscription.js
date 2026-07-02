import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: String, required: true, trim: true },
    level: { type: String, enum: ["basic", "pro"], required: true },
    planName: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "expired", "canceled"], default: "active" },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    lastPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" }
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, endsAt: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
