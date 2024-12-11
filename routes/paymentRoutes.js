// routes/paymentRoutes.js
const express = require("express");
const pool = require("../data/dataBase");

const router = express.Router();

router.post("/paydata", (req, res) => {
  const userDetails = req.body;
  if (!userDetails || !userDetails.email) {
    return res.status(400).json({
      status: "error",
      message: "Invalid input data. Email is required.",
    });
  }

  const {
    username,
    name,
    lastName,
    email,
    address,
    address2,
    country,
    state,
    zip,
    paymentMethod,
  } = userDetails;

  pool.query(
    "SELECT id FROM user_data WHERE email = ?",
    [email],
    (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ status: "error", message: "Error checking email." });

      const userId = rows.length > 0 ? rows[0].id : null;

      if (userId) {
        pool.query(
          "UPDATE user_data SET username = ?, name = ?, lastName = ? WHERE id = ?",
          [username, name, lastName, userId],
          (err) => {
            if (err)
              return res.status(500).json({
                status: "error",
                message: "Failed to update user data.",
              });
            pool.query(
              "INSERT INTO user_address (id, address, address2, country, state, zip) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE address = address, address2 = address2, country = country, state = state, zip = zip",
              [userId, address, address2, country, state, zip],
              (err) => {
                if (err)
                  return res.status(500).json({
                    status: "error",
                    message: "Failed to insert or update user address.",
                  });
                pool.query(
                  "INSERT INTO user_pay (id, payment_method) VALUES (?, ?) ON DUPLICATE KEY UPDATE payment_method = payment_method",
                  [userId, paymentMethod],
                  (err) => {
                    if (err)
                      return res.status(500).json({
                        status: "error",
                        message: "Failed to insert payment data.",
                      });
                    res.status(200).json({
                      status: "success",
                      message: "User details processed and saved successfully.",
                    });
                  }
                );
              }
            );
          }
        );
      }
    }
  );
});

module.exports = router;
