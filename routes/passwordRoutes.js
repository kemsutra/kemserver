const express = require("express");
const bcrypt = require("bcrypt"); // For hashing passwords
const router = express.Router();

const pool = require("../data/dataBase.js"); // Assuming you create a shared DB connection module
const { processUserDetails } = require("../help/helpers"); // Moving common functions to helpers

require("dotenv").config();

router.post("/register", async (req, res) => {
  const data = req.body;
  const { userId, name, email, borned, body, password } = data; // Destructure without finalBody
  const finalBody = body ?? null; // Optional: allow null if not provided

  // Optional: Only log a warning if finalBody is missing
  if (!finalBody) {
    console.warn("Warning: finalBody is not defined. Continuing with null.");
  }

  // Debugging: Log incoming request body
  console.log("Received register request with data:", data);

  // Validate that email and password are provided
  if (!data || !data.email || !data.password) {
    console.error("Error: Email or password not provided in input data.");
    return res.status(400).json({
      status: "error",
      message: "Invalid input data. Email and password are required.",
    });
  }

  const finalName = name ?? null; // Optional: allow null if not provided
  const finalBorned = borned ?? null; // Optional: allow null if not provided

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds, you can adjust this

    // Debugging: Log the parsed data before executing query
    console.log("Parsed data with hashed password:", {
      finalName,
      email,
      finalBorned,
      hashedPassword,
      finalBody,
    });

    // Prepare the SQL query
    const query = `
          INSERT INTO user_data (name, email, borned, password)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
              name = COALESCE(VALUES(name), name), 
              email = VALUES(email), 
              borned = COALESCE(VALUES(borned), borned),
              password = VALUES(password)
      `;

    // Debugging: Log the query and values
    console.log("Executing SQL query:", query);
    console.log("With values:", [
      finalName,
      email,
      finalBorned,
      hashedPassword,
    ]);

    // Execute the SQL query
    req.pool.query(
      query,
      [finalName, email, finalBorned, hashedPassword], // Email and hashed password are mandatory
      (err, results) => {
        if (err) {
          console.error("SQL Error during insert or update:", err.message);
          return res.status(500).json({
            status: "error",
            message: "Failed to insert or update user data.",
          });
        }

        // Debugging: Log results from the query
        console.log("Query result:", results);

        const userId = results.insertId > 0 ? results.insertId : null;

        if (!userId) {
          // If no new user was inserted, get the existing user ID
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

              // Debugging: Log retrieved user ID
              console.log("Retrieved user ID:", retrievedUserId);

              //processUserDetails(retrievedUserId, finalBody, res); // Pass body to process
              finalBody
                ? processUserDetails(retrievedUserId, finalBody, res)
                : null;
            }
          );
        } else {
          // Debugging: Log that a new user was inserted
          console.log("New user inserted with ID:", userId);

          // Process user details for the new user
          //processUserDetails(userId, finalBody, res); // Pass body to process
          finalBody
            ? processUserDetails(retrievedUserId, finalBody, res)
            : null;
        }
      }
    );
  } catch (err) {
    // Catch any errors with hashing or database operations
    console.error("Error processing registration:", err.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to register user.",
    });
  }
});

module.exports = router;
