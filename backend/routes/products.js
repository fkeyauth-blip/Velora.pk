// backend/routes/products.js
const express = require("express");
const { dbAll, dbGet, dbRun } = require("../data/db");
const router = express.Router();

// Seed products with showSizeGuide
async function seedProducts() {
  const count = await dbGet("SELECT COUNT(*) as cnt FROM products");
  if (count.cnt === 0) {
    const products = [
      { id: "wv-001", name: "Camel Wool Tailored Overcoat", category: "Clothes", price: 24500, salePrice: 19600, discount: 20, stock: 15, minOrderQty: 2, sku: "WV-OW-001", sizes: '["XS","S","M","L","XL"]', colors: '["Camel","Charcoal"]', description: "Premium tailored overcoat", images: '["/images/products/coat-camel.svg"]', isNew: true, showSizeGuide: true },
      { id: "wv-002", name: "Merino Wool Crew Neck Knit", category: "Clothes", price: 8500, salePrice: null, discount: 0, stock: 30, minOrderQty: 3, sku: "WV-KN-002", sizes: '["S","M","L","XL"]', colors: '["Charcoal","Cream","Navy"]', description: "Soft merino wool knit", images: '["/images/products/knit-navy.svg"]', showSizeGuide: true },
      { id: "wv-003", name: "Classic Linen Blazer", category: "Clothes", price: 12000, salePrice: 9600, discount: 20, stock: 12, minOrderQty: 2, sku: "WV-BZ-003", sizes: '["XS","S","M","L","XL"]', colors: '["Ivory","Charcoal"]', description: "Tailored linen blazer", images: '["/images/products/blazer-ivory.svg"]', showSizeGuide: true },
      { id: "wv-004", name: "Silk Midi Dress", category: "Clothes", price: 15000, salePrice: 13500, discount: 10, stock: 8, minOrderQty: 1, sku: "WV-DR-004", sizes: '["XS","S","M","L"]', colors: '["Black","Champagne"]', description: "Elegant silk dress", images: '["/images/products/dress-black.svg"]', showSizeGuide: true },
      { id: "wv-005", name: "Premium Leather Belt", category: "Clothes", price: 5000, salePrice: null, discount: 0, stock: 50, minOrderQty: 2, sku: "WV-AC-005", sizes: '[]', colors: '["Black","Brown"]', description: "Italian leather belt", images: '["/images/products/bag-belt.svg"]', showSizeGuide: false },
      { id: "wv-006", name: "Cashmere Scarf", category: "Clothes", price: 8000, salePrice: 6400, discount: 20, stock: 25, minOrderQty: 2, sku: "WV-AC-006", sizes: '[]', colors: '["Gold","Ivory"]', description: "Pure cashmere", images: '["/images/products/bag-scarf.svg"]', showSizeGuide: false },
      { id: "wv-007", name: "Structured Tote Bag", category: "Clothes", price: 9000, salePrice: 7200, discount: 20, stock: 18, minOrderQty: 1, sku: "WV-AC-007", sizes: '[]', colors: '["Black","Tan"]', description: "Luxury tote", images: '["/images/products/bag-tote.svg"]', showSizeGuide: false },
      { id: "wv-008", name: "Minimal Loafers", category: "Clothes", price: 11000, salePrice: null, discount: 0, stock: 20, minOrderQty: 1, sku: "WV-FW-008", sizes: '["36","37","38","39","40","41","42"]', colors: '["Black","Camel"]', description: "Leather loafers", images: '["/images/products/shoe-loafer.svg"]', showSizeGuide: true },
      { id: "wv-009", name: "White Button-Up Shirt", category: "Clothes", price: 6500, salePrice: 5200, discount: 20, stock: 40, minOrderQty: 3, sku: "WV-TO-009", sizes: '["XS","S","M","L","XL"]', colors: '["White"]', description: "Classic shirt", images: '["/images/products/shirt-white.svg"]', showSizeGuide: true },
      { id: "wv-010", name: "Wide-Leg Trousers", category: "Clothes", price: 8000, salePrice: null, discount: 0, stock: 25, minOrderQty: 2, sku: "WV-BO-010", sizes: '["XS","S","M","L","XL"]', colors: '["Black","Cream"]', description: "Tailored trousers", images: '["/images/products/pant-black.svg"]', showSizeGuide: true },
      { id: "wv-011", name: "Silk Tie", category: "Clothes", price: 3500, salePrice: null, discount: 0, stock: 60, minOrderQty: 5, sku: "WV-AC-011", sizes: '[]', colors: '["Navy","Burgundy"]', description: "Italian silk", images: '["/images/products/tie-navy.svg"]', showSizeGuide: false },
      { id: "wv-012", name: "Wool Beanie", category: "Clothes", price: 2500, salePrice: 2000, discount: 20, stock: 80, minOrderQty: 5, sku: "WV-AC-012", sizes: '[]', colors: '["Charcoal","Cream"]', description: "Merino wool beanie", images: '["/images/products/hat-beanie.svg"]', showSizeGuide: false }
    ];
    
    for (const p of products) {
      await dbRun(
        `INSERT INTO products VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
        [p.id, p.name, p.category, p.price, p.salePrice, p.discount, p.stock, p.minOrderQty, p.sku, p.sizes, p.colors, p.description, p.images, p.isNew || false, p.featured || false, p.showSizeGuide !== false]
      );
    }
    console.log("✓ Default products seeded");
  }
}

router.get("/", async (req, res) => {
  try {
    let products = await dbAll("SELECT * FROM products ORDER BY createdAt DESC");
    const { category, search, sort, inStock } = req.query;

    if (category && category !== "All") {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (inStock === "true") {
      products = products.filter(p => p.stock > 0);
    }

    if (sort === "price-asc") products.sort((a, b) => (a.saleprice || a.price) - (b.saleprice || b.price));
    else if (sort === "price-desc") products.sort((a, b) => (b.saleprice || b.price) - (a.saleprice || a.price));
    else if (sort === "newest") products.sort((a, b) => b.isnew - a.isnew);
    else if (sort === "name-asc") products.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const rows = await dbAll("SELECT DISTINCT category FROM products ORDER BY category");
    res.json({ categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await dbGet("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed to load product" });
  }
});

module.exports = { router, seedProducts };
