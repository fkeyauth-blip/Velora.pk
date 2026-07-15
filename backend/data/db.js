// backend/data/db.js - PostgreSQL Database Module
const { Pool } = require("pg");

// MUST have DATABASE_URL in environment
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable not set!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

async function initDB() {
  try {
    // Products table with showSizeGuide column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DECIMAL NOT NULL,
        saleprice DECIMAL,
        discount INTEGER,
        stock INTEGER DEFAULT 0,
        minorderqty INTEGER DEFAULT 1,
        sku TEXT,
        sizes TEXT,
        colors TEXT,
        description TEXT,
        images TEXT,
        isnew BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        showsizeguide BOOLEAN DEFAULT true,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        passwordhash TEXT NOT NULL,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userid TEXT REFERENCES users(id),
        customername TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal DECIMAL,
        total DECIMAL,
        paymentmethod TEXT,
        paymentstatus TEXT DEFAULT 'Pending Verification',
        sendernumber TEXT,
        transactionid TEXT,
        screenshotpath TEXT,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // Newsletter table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribedat TIMESTAMP DEFAULT NOW()
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
