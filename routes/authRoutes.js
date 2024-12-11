const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { generateToken, comparePassword } = require("../help/helpers");

const router = express.Router();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other SMTP services here
  auth: {
    user: process.env.EMAIL_USER, // Email from .env
    pass: process.env.EMAIL_PASS, // Password from .env
  },
});

// Function to send confirmation email
const sendConfirmationEmail = (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Account Confirmation",
    html: `<p>Please click the following link to confirm your account: 
           <a href="https://yoursite.com/confirm/${token}">Confirm Account</a></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error); // Log email sending error
    } else {
      console.log("Email sent:", info.response); // Log success
    }
  });
};

// Route to handle user login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Debugging log for login attempt
  console.log("Login attempt for email:", email);

  // Check for required fields
  if (!email || !password) {
    console.log("Login failed: Missing email or password."); // Log error for missing fields
    return res.status(400).json({ error: "Email and password are required." });
  }

  const query = `SELECT * FROM user_data WHERE email = ?`; // Correct column name

  console.log("Running query to find user:", query); // Log the query being run

  req.pool.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database query error:", err); // Log the error for debugging
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      console.log("User not found for email:", email); // Log when user is not found
      return res.status(404).json({ error: "User not found" });
    }

    const user = results[0];
    console.log("User found:", user); // Log user data for debugging

    try {
      const isMatch = await comparePassword(password, user.password);
      console.log("Password comparison result:", isMatch); // Log result of password comparison
      if (!isMatch) {
        console.log("Invalid credentials for email:", email); // Log when password doesn't match
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user, { expiresIn: "1h" });
      console.log("Token generated for user:", user.id); // Log token generation success
      res.status(200).json({ token });
    } catch (error) {
      console.error(
        "Error during password comparison or token generation:",
        error
      ); // Log any other error
      res.status(500).json({ error: "Authentication error" });
    }
  });
});

// Route to handle sending account confirmation email
router.post("/send-confirmation-email", (req, res) => {
  const { email, token } = req.body;

  // Debugging log for email sending
  console.log("Sending confirmation email to:", email);

  if (!email || !token) {
    console.log("Error: Missing email or token."); // Log error for missing fields
    return res.status(400).json({ error: "Email and token are required." });
  }

  sendConfirmationEmail(email, token);
  console.log("Confirmation email sent for:", email); // Log success for sending email
  res.status(200).json({ message: "Confirmation email sent." });
});

module.exports = router;
