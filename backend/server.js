// backend/server.js - PRODUCTION READY
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// CRITICAL: Read PORT from Railway
const PORT = process.env.PORT || 4000;

console.log(`\n[STARTUP] Starting VELORA API...`);
console.log(`[CONFIG] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[CONFIG] PORT: ${PORT}`);

// Middleware - FIRST THING
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
console.log(`[STATIC] Configuring static files...`);
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/admin", express.static(path.join(__dirname, "../admin")));
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(`[STATIC] ✓ Static files ready`);

// Health check - IMMEDIATE RESPONSE
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    db: "PostgreSQL",
    port: PORT,
    time: new Date().toISOString()
  });
});

// Database & Routes - Load ONLY after server starts
let dbReady = false;

async function loadDatabase() {
  try {
    console.log(`[DB] Loading database module...`);
    const { initDB } = require("./data/db");
    const { router: productsRouter, seedProducts } = require("./routes/products");
    const ordersRouter = require("./routes/orders");
    const adminRouter = require("./routes/admin");
    const { router: authRouter } = require("./routes/auth");

    console.log(`[DB] Initializing database...`);
    await initDB();
    console.log(`[DB] ✓ Database initialized`);

    console.log(`[SEED] Seeding products...`);
    await seedProducts();
    console.log(`[SEED] ✓ Products seeded`);

    // Attach routes AFTER database is ready
    app.use("/api/products", productsRouter);
    app.use("/api/orders", ordersRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/auth", authRouter);

    // Newsletter
    app.post("/api/newsletter", async (req, res) => {
      try {
        const { email } = req.body || {};
        if (!email || !email.includes("@")) {
          return res.status(400).json({ error: "Invalid email" });
        }
        console.log(`[NEWSLETTER] ${email}`);
        res.json({ ok: true });
      } catch (err) {
        console.error(`[NEWSLETTER ERROR]`, err);
        res.status(500).json({ error: "Subscription failed" });
      }
    });

    dbReady = true;
    console.log(`[DB] ✓ All systems ready!`);
  } catch (err) {
    console.error(`[DB INIT ERROR]`, err.message);
    console.error(err);
    // Don't exit - let server continue to serve health checks
  }
}

// Root route
app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  } catch (err) {
    console.error(`[ROOT ERROR]`, err);
    res.status(500).send("Server error");
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Error handler - MUST BE LAST
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ 
    error: err.message || "Server error",
    status: "error"
  });
});

// Start server FIRST, then load database
async function start() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ VELORA API LISTENING ON PORT ${PORT}`);
      console.log(`🌐 URL: https://velora-production.up.railway.app`);
      console.log(`🔑 Admin: /admin (Key: maison-admin-2026)`);
      console.log(`${"=".repeat(60)}\n`);
      resolve(server);
    });

    server.on("error", (err) => {
      console.error(`[SERVER ERROR]`, err);
      process.exit(1);
    });
  });
}

// Main execution
(async () => {
  try {
    // Start server listening FIRST
    await start();
    
    // Then load database in background
    loadDatabase().catch(err => {
      console.error(`[BACKGROUND ERROR]`, err);
    });
  } catch (err) {
    console.error(`[FATAL ERROR]`, err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(`[SHUTDOWN] SIGTERM received`);
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(`[SHUTDOWN] SIGINT received`);
  process.exit(0);
});
