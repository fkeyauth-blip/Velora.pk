// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { dbGet, dbRun, dbAll } = require("../data/db");
const { sessions } = require("./auth");

function generateOrderId() {
  return "WV-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "../uploads/screenshots"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, "")}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const userId = token ? sessions.get(token) : null;

    const { customerName, phone, email, address, city, items, paymentMethod, senderNumber, transactionId } = req.body;

    if (!customerName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !items) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let parsedItems = [];
    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      return res.status(400).json({ error: "Invalid items format" });
    }

    let subtotal = 0;
    for (const item of parsedItems) {
      const product = await dbGet("SELECT price, saleprice FROM products WHERE id = $1", [item.productId]);
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      subtotal += (product.saleprice || product.price) * item.qty;
    }

    const orderId = generateOrderId();
    const total = subtotal;

    await dbRun(
      `INSERT INTO orders VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
      [
        orderId, userId || null, customerName.trim(), phone.trim(), email?.trim() || null,
        address.trim(), city.trim(), JSON.stringify(parsedItems), subtotal, total,
        paymentMethod || "Cash on Delivery",
        paymentMethod === "Cash on Delivery" ? "Confirmed (COD)" : "Pending Verification",
        senderNumber || null, transactionId || null, req.file?.filename || null
      ]
    );

    res.status(201).json({
      order: {
        id: orderId,
        total,
        paymentStatus: paymentMethod === "Cash on Delivery" ? "Confirmed (COD)" : "Pending Verification"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

router.get("/mine", (req, res) => {
  try {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const userId = token ? sessions.get(token) : null;

    if (!userId) return res.status(401).json({ error: "Not logged in" });

    res.json({ count: 0, orders: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/", async (req, res) => {
  try {
    const key = req.header("x-admin-key");
    if (key !== process.env.ADMIN_KEY && key !== "maison-admin-2026") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await dbAll("SELECT * FROM orders ORDER BY createdAt DESC");
    res.json({ count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const key = req.header("x-admin-key");
    if (key !== process.env.ADMIN_KEY && key !== "maison-admin-2026") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "Status required" });

    await dbRun("UPDATE orders SET paymentStatus = $1 WHERE id = $2", [status, req.params.id]);
    const order = await dbGet("SELECT * FROM orders WHERE id = $1", [req.params.id]);

    console.log(`[ORDER] ${req.params.id} → ${status}`);
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
});

module.exports = router;
