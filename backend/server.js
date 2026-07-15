// backend/server.js - FINAL PRODUCTION VERSION
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

console.log(`\n[STARTUP] Starting VELORA API...`);
console.log(`[CONFIG] PORT: ${PORT}`);
console.log(`[CONFIG] NODE_ENV: ${process.env.NODE_ENV}`);

// CORS - Allow all origins
app.use(cors({ origin: "*", credentials: true }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - CRITICAL ORDER
console.log(`[STATIC] Configuring static files...`);

// Serve frontend static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/admin", express.static(path.join(__dirname, "../admin")));
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log(`[STATIC] ✓ Paths configured`);

// API Health - BEFORE routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    db: "PostgreSQL",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Load and attach API routes
let dbReady = false;

async function setupRoutes() {
  try {
    console.log(`[ROUTES] Loading database...`);
    const { initDB } = require("./data/db");
    const { router: productsRouter, seedProducts } = require("./routes/products");
    const ordersRouter = require("./routes/orders");
    const adminRouter = require("./routes/admin");
    const { router: authRouter } = require("./routes/auth");

    console.log(`[DB] Initializing...`);
    await initDB();
    console.log(`[DB] ✓ Initialized`);

    console.log(`[SEED] Seeding products...`);
    await seedProducts();
    console.log(`[SEED] ✓ Seeded`);

    // Attach API routes
    app.use("/api/products", productsRouter);
    app.use("/api/orders", ordersRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/auth", authRouter);

    // Newsletter endpoint
    app.post("/api/newsletter", async (req, res) => {
      try {
        const { email } = req.body || {};
        if (!email || !email.includes("@")) {
          return res.status(400).json({ error: "Invalid email" });
        }
        console.log(`[NEWSLETTER] Subscribed: ${email}`);
        res.json({ ok: true });
      } catch (err) {
        console.error(`[NEWSLETTER ERROR]`, err);
        res.status(500).json({ error: "Subscription failed" });
      }
    });

    dbReady = true;
    console.log(`[ROUTES] ✓ All routes attached`);
  } catch (err) {
    console.error(`[ROUTES ERROR]`, err.message);
    // Continue anyway - allow health checks
  }
}

// SPA Fallback - serve index.html for all non-API routes
app.get(/^\/(?!api\/)/, (req, res, next) => {
  // Don't intercept API routes, admin panel, or files
  if (req.path.startsWith("/api") || 
      req.path.startsWith("/admin") ||
      req.path.includes(".") ||
      req.path === "/") {
    return next();
  }
  
  // Serve index.html for all other routes (SPA routing)
  const indexPath = path.join(__dirname, "../frontend/index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[SPA ERROR]`, err);
      res.status(500).send("Server error");
    }
  });
});

// Root route - explicitly serve homepage
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/index.html");
  console.log(`[ROOT] Serving: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[ROOT ERROR]`, err);
      res.status(500).json({ error: "Cannot load homepage" });
    }
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "API endpoint not found", path: req.path });
  } else {
    res.status(404).send("Page not found");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ 
    error: err.message || "Server error",
    path: req.path
  });
});

// Start server
async function start() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ VELORA API SERVER STARTED`);
      console.log(`📊 Listening on port: ${PORT}`);
      console.log(`🌐 Homepage: https://velora-production.up.railway.app`);
      console.log(`📱 Admin: https://velora-production.up.railway.app/admin`);
      console.log(`🔑 Admin Key: maison-admin-2026`);
      console.log(`📍 API: https://velora-production.up.railway.app/api/health`);
      console.log(`${"=".repeat(60)}\n`);
      resolve(server);
    });

    server.on("error", (err) => {
      console.error(`[SERVER ERROR]`, err);
      process.exit(1);
    });
  });
}

// Execute
(async () => {
  try {
    const server = await start();
    setupRoutes().catch(err => console.error(`[ROUTES SETUP ERROR]`, err));
  } catch (err) {
    console.error(`[FATAL]`, err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(`[SHUTDOWN] Received SIGTERM`);
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(`[SHUTDOWN] Received SIGINT`);
  process.exit(0);
});
