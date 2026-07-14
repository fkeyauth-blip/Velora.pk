// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { dbGet, dbRun, dbAll } = require("../data/db");

const sessions = new Map();
const rateLimitMap = new Map();

function rateLimiter(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  
  const times = rateLimitMap.get(ip).filter(t => now - t < 15 * 60 * 1000);
  if (times.length >= 5) return false;
  
  times.push(now);
  rateLimitMap.set(ip, times);
  return true;
}

router.post("/signup", async (req, res) => {
  try {
    const ip = req.ip;
    if (!rateLimiter(ip)) return res.status(429).json({ error: "Too many requests" });

    const { name, phone, email, password } = req.body || {};
    if (!name?.trim() || phone?.trim().length < 7 || !password || password.length < 8) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const existing = await dbGet("SELECT id FROM users WHERE phone = $1 OR email = $2", [phone.trim(), email?.trim()]);
    if (existing) return res.status(400).json({ error: "Account exists" });

    const hash = await bcrypt.hash(password, 10);
    const userId = `u-${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    
    await dbRun(
      "INSERT INTO users VALUES ($1, $2, $3, $4, $5, NOW())",
      [userId, name.trim(), phone.trim(), email?.trim() || null, hash]
    );

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, userId);
    
    res.status(201).json({ 
      token, 
      user: { id: userId, name: name.trim(), phone: phone.trim(), email: email?.trim() }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const ip = req.ip;
    if (!rateLimiter(ip)) return res.status(429).json({ error: "Too many requests" });

    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ error: "Invalid input" });

    const user = await dbGet(
      "SELECT * FROM users WHERE phone = $1 OR email = $2",
      [identifier.trim(), identifier.trim().toLowerCase()]
    );
    
    if (!user || !(await bcrypt.compare(password, user.passwordhash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, user.id);
    
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", (req, res) => {
  try {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const userId = token ? sessions.get(token) : null;
    
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    res.json({ user: { id: userId } });
  } catch (err) {
    res.status(500).json({ error: "Auth check failed" });
  }
});

router.post("/logout", (req, res) => {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

module.exports = { router, sessions };
