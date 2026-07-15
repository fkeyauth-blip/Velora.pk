// backend/server.js - FIXED VERSION
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initDB } = require("./data/db");
const { router: productsRouter, seedProducts } = require("./routes/products");
const ordersRouter = require("./routes/orders");
const adminRouter = require("./routes/admin");
const { router: authRouter } = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 4000;

console.log(`[STARTUP] PORT: ${PORT}`);
console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - FIX: Better error handling
try {
  app.use("/images", express.static(path.join(__dirname, "../frontend/images")));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.static(path.join(__dirname, "../frontend")));
  app.use("/admin", express.static(path.join(__dirname, "../admin")));
  console.log("[STATIC] Static files configured");
} catch (err) {
  console.error("[STATIC ERROR]", err);
}

// API Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: "PostgreSQL", port: PORT });
});

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

// Newsletter
app.post("/api/newsletter", express.json(), async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Invalid email" });
    console.log(`[NEWSLETTER] ${email}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[NEWSLETTER ERROR]", err);
    res.status(500).json({ error: "Subscription failed" });
  }
});

// Root route - serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 404 handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// Initialize and start
async function start() {
  try {
    console.log("🔄 [DB] Initializing database...");
    await initDB();
    console.log("✓ [DB] Database initialized");

    console.log("📦 [SEED] Seeding products...");
    await seedProducts();
    console.log("✓ [SEED] Products seeded");

    const server = app.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`✅ VELORA API RUNNING`);
      console.log(`📊 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      console.log(`🔑 Admin: /admin (Key: maison-admin-2026)`);
      console.log(`${"=".repeat(50)}\n`);
    });

    server.on("error", (err) => {
      console.error("❌ [SERVER ERROR]", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ [STARTUP ERROR]", err.message);
    console.error(err);
    process.exit(1);
  }
}

start();
