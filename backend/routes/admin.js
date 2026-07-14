// backend/routes/admin.js - WITH NEW FEATURE: showSizeGuide
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { dbGet, dbRun, dbAll } = require("../data/db");

const ADMIN_KEY = process.env.ADMIN_KEY || "maison-admin-2026";

const uploadImages = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "../../frontend/images/products"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 7 }
});

router.post("/login", (req, res) => {
  const { key } = req.body || {};
  if (key === ADMIN_KEY) return res.json({ ok: true });
  res.status(401).json({ ok: false, error: "Invalid key" });
});

function authAdmin(req, res, next) {
  const key = req.header("x-admin-key");
  if (key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/stats", authAdmin, async (req, res) => {
  try {
    const totalOrders = await dbGet("SELECT COUNT(*) as cnt FROM orders");
    const pendingOrders = await dbGet("SELECT COUNT(*) as cnt FROM orders WHERE paymentstatus = 'Pending Verification'");
    const totalProducts = await dbGet("SELECT COUNT(*) as cnt FROM products");
    const lowStock = await dbGet("SELECT COUNT(*) as cnt FROM products WHERE stock > 0 AND stock <= 10");
    
    const revenue = await dbGet("SELECT SUM(total) as total FROM orders WHERE paymentstatus IN ('Approved', 'Confirmed (COD)')");
    
    res.json({
      totalOrders: totalOrders.cnt,
      pendingCount: pendingOrders.cnt,
      totalProducts: totalProducts.cnt,
      lowStock: lowStock.cnt,
      totalRevenue: revenue.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Stats failed" });
  }
});

router.get("/products", authAdmin, async (req, res) => {
  try {
    const products = await dbAll("SELECT * FROM products");
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

// ADD PRODUCT - WITH NEW showSizeGuide FEATURE
router.post("/products", authAdmin, uploadImages.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "images", maxCount: 6 }
]), async (req, res) => {
  try {
    const { name, description, price, salePrice, category, sizes, colors, stock, minOrderQty, sku, featured, showSizeGuide } = req.body;
    
    if (!name?.trim() || !category?.trim() || !price || !req.files?.coverImage?.[0]) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = `wv-${Date.now().toString(36)}`;
    const coverPath = `/images/products/${req.files.coverImage[0].filename}`;
    const imagePaths = (req.files.images || []).map(f => `/images/products/${f.filename}`);
    const allImages = [coverPath, ...imagePaths];

    let parsedSizes = [];
    let parsedColors = [];
    try {
      parsedSizes = sizes ? JSON.parse(sizes) : [];
      parsedColors = colors ? JSON.parse(colors) : [];
    } catch {}

    // NEW LOGIC: If no sizes, automatically set showSizeGuide to false
    const shouldShowGuide = parsedSizes.length > 0 && showSizeGuide !== "false";

    await dbRun(
      `INSERT INTO products VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
      [
        id, name.trim(), category.trim(), Number(price), salePrice ? Number(salePrice) : null,
        salePrice ? Math.round((1 - Number(salePrice) / Number(price)) * 100) : 0,
        Number(stock) || 0, Number(minOrderQty) || 1, sku || id,
        JSON.stringify(parsedSizes), JSON.stringify(parsedColors),
        description?.trim() || "", JSON.stringify(allImages),
        0, featured === "true" ? 1 : 0, shouldShowGuide
      ]
    );

    res.status(201).json({ product: { id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Product creation failed" });
  }
});

// EDIT PRODUCT - WITH showSizeGuide UPDATE
router.patch("/products/:id", authAdmin, async (req, res) => {
  try {
    const { stock, showSizeGuide, sizes } = req.body || {};
    
    if (stock !== undefined) {
      if (typeof stock !== "number" || stock < 0) return res.status(400).json({ error: "Invalid stock" });
      await dbRun("UPDATE products SET stock = $1 WHERE id = $2", [stock, req.params.id]);
    }

    if (showSizeGuide !== undefined) {
      // Update showSizeGuide setting
      const parsedSizes = sizes ? JSON.parse(sizes) : [];
      const shouldShow = parsedSizes.length > 0 && showSizeGuide !== "false";
      await dbRun("UPDATE products SET showSizeGuide = $1 WHERE id = $2", [shouldShow, req.params.id]);
    }

    const product = await dbGet("SELECT * FROM products WHERE id = $1", [req.params.id]);
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

router.patch("/products/:id/stock", authAdmin, async (req, res) => {
  try {
    const { stock } = req.body || {};
    if (typeof stock !== "number" || stock < 0) return res.status(400).json({ error: "Invalid stock" });

    await dbRun("UPDATE products SET stock = $1 WHERE id = $2", [stock, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/products/:id", authAdmin, async (req, res) => {
  try {
    await dbRun("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

router.get("/categories", authAdmin, async (req, res) => {
  try {
    const rows = await dbAll("SELECT DISTINCT category FROM products ORDER BY category");
    res.json({ categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
