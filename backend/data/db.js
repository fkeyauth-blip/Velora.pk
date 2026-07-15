// backend/data/db.js - PostgreSQL Database Module
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable not set!");
  process.exit(1);
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

async function initDB() {
  try {
    // Products table with NEW showSizeGuide column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DECIMAL NOT NULL,
        salePrice DECIMAL,
        discount INTEGER,
        stock INTEGER DEFAULT 0,
        minOrderQty INTEGER DEFAULT 1,
        sku TEXT,
        sizes TEXT,
        colors TEXT,
        description TEXT,
        images TEXT,
        isNew BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        showSizeGuide BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        passwordHash TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT REFERENCES users(id),
        customerName TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal DECIMAL,
        total DECIMAL,
        paymentMethod TEXT,
        paymentStatus TEXT DEFAULT 'Pending Verification',
        senderNumber TEXT,
        transactionId TEXT,
        screenshotPath TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Newsletter table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✓ PostgreSQL database initialized");
  } catch (err) {
    if (!err.message.includes("already exists")) {
      console.error("DB init error:", err);
    }
  }
}

async function dbAll(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  }
}

async function dbGet(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows[0];
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  }
}

async function dbRun(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return { changes: res.rowCount, lastID: res.rows[0]?.id };
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  }
}

module.exports = { pool, initDB, dbAll, dbGet, dbRun };
