const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const pool = require("../data/dataBase.js");
const { processUserDetails } = require("../help/helpers");

require("dotenv").config();

router.post("/register", async (req, res) => {
  const data = req.body;
  const { userId, name, email, borned, body, password } = data;
  const finalBody = body ?? null;

  if (!finalBody) {
    console.warn("Warning: finalBody is not defined. Continuing with null.");
  }

  console.log("Received register request with data:", data);

  if (!data || !data.email || !data.password) {
    console.error("Error: Email or password not provided in input data.");
    return res.status(400).json({
      status: "error",
      message: "Email and password are required.",
    });
  }

  const finalName = name ?? null;
  const finalBorned = borned ?? null;

  try {
    const existingUserQuery = "SELECT password FROM user_data WHERE email = ?";
    const [existingUser] = await pool.query(existingUserQuery, [email]);

    if (existingUser.length > 0) {
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser[0].password
      );
      if (passwordMatch) {
        return res.status(409).json({
          status: "error",
          message: "Password already exists for this email.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Parsed data with hashed password:", {
      finalName,
      email,
      finalBorned,
      hashedPassword,
      finalBody,
    });

    const query = `
      INSERT INTO user_data (name, email, borned, password)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
          name = COALESCE(VALUES(name), name), 
          email = VALUES(email), 
          borned = COALESCE(VALUES(borned), borned),
          password = VALUES(password)
    `;

    console.log("Executing SQL query:", query);
    console.log("With values:", [
      finalName,
      email,
      finalBorned,
      hashedPassword,
    ]);

    req.pool.query(
      query,
      [finalName, email, finalBorned, hashedPassword],
      (err, results) => {
        if (err) {
          console.error("SQL Error during insert or update:", err.message);
          return res.status(500).json({
            status: "error",
            message: "Something went wrong, please try again later.",
          });
        }

        console.log("Query result:", results);

        const userId = results.insertId > 0 ? results.insertId : null;

        if (!userId) {
          console.log(
            "No new user inserted. Fetching existing user ID for email:",
            email
          );

          req.pool.query(
            "SELECT id FROM user_data WHERE email = ?",
            [email],
            (err, rows) => {
              if (err || rows.length === 0) {
                console.error(
                  "Error retrieving user ID:",
                  err ? err.message : "No rows found."
                );
                return res.status(500).json({
                  status: "error",
                  message: "Failed to retrieve user ID.",
                });
              }
              const retrievedUserId = rows[0].id;
              console.log("Retrieved user ID:", retrievedUserId);

              finalBody
                ? processUserDetails(retrievedUserId, finalBody, res)
                : null;
            }
          );
        } else {
          console.log("New user inserted with ID:", userId);
          finalBody ? processUserDetails(userId, finalBody, res) : null;
        }
      }
    );
  } catch (err) {
    console.error("Error processing registration:", err.message);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
});

module.exports = router;
