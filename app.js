require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
//const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Importing routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const detailsRoutes = require("./routes/detailsRoutes");
const registerRoutes = require("./routes/registerRoutes");
const stripeRoutes = require("./routes/stripeRoutes.js");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log(
  "Stripe API Key:",
  process.env.STRIPE_SECRET_KEY ? "Loaded" : "Not Loaded"
);

const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_DOMAIN
    : process.env.DEV_DOMAIN;

const port = process.env.PORT || 3000;
const app = express();

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 2,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.SERVER_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.static("public"));

// Middleware to handle MySQL connections with error handling
app.use((req, res, next) => {
  if (!pool) {
    console.error("Database pool is not initialized");
    return res.status(500).json({ message: "Database pool is not available" });
  }

  req.pool = pool;

  pool.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }

    next();
  });
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
  console.log(`Server running on port ${port}`);
});

module.exports = pool.promise();
