require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const detailsRoutes = require("./routes/detailsRoutes");
const registerRoutes = require("./routes/registerRoutes");
const stripeRoutes = require("./routes/stripeRoutes.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_DOMAIN
    : process.env.DEV_DOMAIN;
// Log para verificar el valor de SERVER_URL
console.log("SERVER_URL:", SERVER_URL);
const port = process.env.PORT || 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

const app = express();
const pool = mysql.createPool({
  connectionLimit: 2,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.static("public"));

app.use(async (req, res, next) => {
  if (!pool) {
    console.error("Database pool is not initialized");
    return res.status(500).json({ message: "Database pool is not available" });
  }

  try {
    await pool.promise().query("SELECT 1");
    req.pool = pool;
    next();
  } catch (err) {
    console.error("Error connecting to the database:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Body:", req.body);
  }
  next();
});

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", paymentRoutes);
app.use("/api", detailsRoutes);
app.use("/api", registerRoutes);
app.use("/api", stripeRoutes);

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Listen to the Server running on port ${SERVER_URL}`);
});

module.exports = pool.promise();
