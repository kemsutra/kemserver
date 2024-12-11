// helpers.js
require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Function to clean answers by removing special characters
function cleanAnswer(answer) {
  if (typeof answer === "string") {
    return answer.replace(/[^\w\s]/gi, "");
  }
  return answer;
}

// Function to process answers and return the appropriate text and json
function processAnswer(answer) {
  if (answer === undefined || answer === null) {
    return { text: "Not answered", json: null };
  }

  if (typeof answer === "string" || typeof answer === "boolean") {
    return { text: cleanAnswer(answer.toString()), json: null };
  }

  if (Array.isArray(answer)) {
    const textArray = answer.map((item) => {
      if (typeof item === "object" && item.question && item.answer) {
        return `${item.question}${item.answer}`;
      }
      return cleanAnswer(item);
    });
    return { text: textArray.join(", "), json: JSON.stringify(answer) };
  }

  if (typeof answer === "object") {
    if (
      answer.fc_inputCurrent !== undefined &&
      answer.fc_inputObjective !== undefined &&
      answer.fc_unid !== undefined
    ) {
      const current = `Current: ${answer.fc_inputCurrent}`;
      const objective = `Objective: ${answer.fc_inputObjective}`;
      const unit = `Unit: ${answer.fc_unid}`;
      return {
        text: `${current}, ${objective}, ${unit}`,
        json: JSON.stringify(answer),
      };
    }

    if (answer.title) {
      return { text: cleanAnswer(answer.title), json: null };
    }
    return { text: "", json: JSON.stringify(answer) };
  }

  return { text: "", json: JSON.stringify(answer) };
}

// Function to generate JWT token for authenticated users
function generateToken(user, options = {}) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h", ...options } // Merging any additional options
  );
}

// Function to compare passwords during login
function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function processUserDetails(userId, body, res) {
  // Check if body is valid
  if (!body || !Array.isArray(body)) {
    console.error("Invalid body passed to processUserDetails:", body);
    return res.status(400).json({
      status: "error",
      message: "Invalid data provided.",
    });
  }

  const detailInserts = body.map((item) => {
    const processedAnswer = processAnswer(item.answer);
    return [
      userId,
      item.index,
      item.title,
      processedAnswer.text,
      processedAnswer.json,
    ];
  });

  console.log("Inserting or updating user details:", detailInserts);

  // Use Promise.all to handle multiple queries
  const queries = detailInserts.map((detail) => {
    return new Promise((resolve, reject) => {
      pool.query(
        `INSERT INTO user_details (user_id, question_index, question_title, answer_text, answer_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE question_title = VALUES(question_title), answer_text = VALUES(answer_text), answer_json = VALUES(answer_json)`,
        detail,
        (err) => {
          if (err) {
            console.error("Error inserting/updating user details:", err);
            return reject(err);
          }
          resolve();
        }
      );
    });
  });

  Promise.all(queries)
    .then(() => {
      console.log("User details inserted/updated successfully");
      res.status(200).json({
        status: "success",
        message: "Data processed and saved successfully",
      });
    })
    .catch((err) => {
      console.error("Error processing user details:", err);
      res.status(500).json({
        status: "error",
        message: "Error processing user details.",
        details: err.message, // Include error details
      });
    });
}

module.exports = {
  cleanAnswer,
  processAnswer,
  generateToken,
  comparePassword,
  processUserDetails,
};
