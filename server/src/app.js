import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import { securityHeaders } from "./middleware/security.js";
import movementRoutes from "./routes/movementRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(securityHeaders);

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { service: "inventra-api" }, message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/movements", movementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, data: err.errors || null, message: err.message || "Server error" });
});

export default app;
