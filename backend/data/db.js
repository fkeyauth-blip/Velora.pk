// backend/data/db.js - BETTER ERROR HANDLING
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL not set!");
  process.exit(1);
}

console.log("[DB] Connecting to:", process.env.DATABASE_URL.split("@")[1] || "database");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on("error", (err) => {
  console.error("[DB POOL ERROR]", err);
});

pool.on("connect", () => {
  console.log("[DB] Connected to PostgreSQL");
});

async function initDB() {
  try {
    // Test connection first
    const client = await pool.connect();
    console.log("[DB] Connection test successful");
    client.release();

    // Products table
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

    console.log("[DB] All tables created/verified");
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      console.log("[DB] Tables already exist");
    } else {
      throw err;
    }
  }
}

async function dbAll(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (err) {
    console.error("[DB QUERY ERROR]", sql, err.message);
    throw err;
  }
}

async function dbGet(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows[0];
  } catch (err) {
    console.error("[DB QUERY ERROR]", sql, err.message);
    throw err;
  }
}

async function dbRun(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return { changes: res.rowCount, lastID: res.rows[0]?.id };
  } catch (err) {
    console.error("[DB QUERY ERROR]", sql, err.message);
    throw err;
  }
}

module.exports = { pool, initDB, dbAll, dbGet, dbRun };
