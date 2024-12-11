const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const stripe = require("stripe")(
  "sk_test_51QPRv6RwTc0oih015LCjKU9SAmvzCYoAOaGUGQFWJ5AnOOIP0Baw5ee9cmrn4Xg5nnW8XV2sKw4YU9Vu1uR77BSG00dk7Mx569"
);

// Importing routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const detailsRoutes = require("./routes/detailsRoutes");
const registerRoutes = require("./routes/registerRoutes");
//const learningRoutes = require("./routes/learningRoutes");
const stripeRoutes = require("./routes/stripeRoutes.js");

const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.static("public"));

const YOUR_DOMAIN = "http://localhost:3000";
// Create a MySQL connection pool with the lowest concurrent connections
const pool = mysql.createPool({
  connectionLimit: 2, // Limit to 1 connection for the lowest concurrency
  host: "srv1524.hstgr.io",
  user: "u495597488_user",
  password: "k3BiNPo+233#",
  database: "u495597488_research",
  port: 3306,
});
// Middleware to handle MySQL connections with error handling
app.use((req, res, next) => {
  // Check if the pool is valid
  if (!pool) {
    console.error("Database pool is not initialized");
    return res.status(500).json({ message: "Database pool is not available" });
  }

  req.pool = pool; // Attach the pool to the req object

  // Optionally, you can check if the pool is in a usable state
  pool.query("SELECT 1", (err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }

    next();
  });
});

// Logging middleware for debugging
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
//app.use("/api", learningRoutes);
app.use("/api", stripeRoutes);
// Added this line for learning routes

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
