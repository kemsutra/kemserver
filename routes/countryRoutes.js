const express = require("express");
const router = express.Router();
const { getMetaTagsForCountry } = require("../help/metaHelpers"); // Make sure this path is correct

router.get("*", (req, res) => {
  const country = req.query.country || "Global"; // Implement actual country detection logic if needed
  const metaTags = getMetaTagsForCountry(country);

  res.render("index", {
    metaTitle: metaTags.title,
    metaDescription: metaTags.description,
    metaKeywords: metaTags.keywords,
  });
});

module.exports = router;
