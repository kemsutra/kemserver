const express = require("express");
const { processAnswer, cleanAnswer } = require("../help/helpers");

const router = express.Router();

router.post("/saveDetails", (req, res) => {
  const { userId, details } = req.body;

  if (!userId || !details || !Array.isArray(details)) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const insertQueries = details.map((detail) => {
    const { index, title, answer } = detail;

    const processedAnswer = processAnswer(answer);
    const query = `INSERT INTO user_details (user_id, question_index, question_title, answer_text, answer_json) 
                   VALUES (?, ?, ?, ?, ?)`;

    return new Promise((resolve, reject) => {
      req.pool.query(
        query,
        [
          userId,
          index,
          cleanAnswer(title),
          processedAnswer.text,
          processedAnswer.json,
        ],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  });

  Promise.all(insertQueries)
    .then(() => res.status(201).json({ message: "Details saved successfully" }))
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error saving details" });
    });
});

module.exports = router;
