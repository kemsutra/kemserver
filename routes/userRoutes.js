// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const pool = require("../data/dataBase"); // Assuming you create a shared DB connection module
const { processUserDetails } = require("../help/helpers"); // Moving common functions to helpers

require("dotenv").config();

router.post("/data", (req, res) => {
  const data = req.body;

  // Validate input data
  if (!data || !data.name || !data.email || !data.body) {
    return res.status(400).json({
      status: "error",
      message: "Invalid input data. Name, email, and body are required.",
    });
  }

  const { name, email, borned, body } = data;
  const finalName = name ?? "Default Name";
  const finalEmail = email ?? "default@mail.com";
  const finalBorned = borned ?? "01/01/1990";

  // Get a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: "Database connection failed" });
    }

    connection.query(
      `INSERT INTO user_data (name, email, borned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), borned = VALUES(borned)`,
      [finalName, finalEmail, finalBorned],
      (err, results) => {
        // Release the connection back to the pool
        connection.release();

        if (err) {
          return res.status(500).json({
            status: "error",
            message: "Failed to insert or update user data.",
          });
        }

        const userId = results.insertId > 0 ? results.insertId : null;

        if (!userId) {
          connection.query(
            "SELECT id FROM user_data WHERE email = ?",
            [finalEmail],
            (err, rows) => {
              if (err || rows.length === 0) {
                return res.status(500).json({
                  status: "error",
                  message: "Failed to retrieve user ID.",
                });
              }
              const retrievedUserId = rows[0].id;
              processUserDetails(retrievedUserId, body, res);
            }
          );
        } else {
          processUserDetails(userId, body, res);
        }
      }
    );
  });
});

module.exports = router;
