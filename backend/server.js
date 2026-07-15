// backend/server.js - PostgreSQL Version
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

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:4000",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/admin", express.static(path.join(__dirname, "../admin")));

// API Health
app.get("/api/health", (req, res) => res.json({ status: "ok", db: "PostgreSQL" }));

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
    res.status(500).json({ error: "Subscription failed" });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// Initialize and start
sync function start() {
  try {
    console.log("Initializing database...");
    await initDB();
    
    console.log("Seeding products...");
    await seedProducts();
    
    app.listen(PORT, () => {
      console.log(`\n✅ VELORA API running on port ${PORT}`);
      console.log(`📖 Database: PostgreSQL (${process.env.DATABASE_URL.split("@")[1]?.split("/")[0]})`);
      console.log(`🌐 http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
}

start();
