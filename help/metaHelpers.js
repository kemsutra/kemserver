const fs = require("fs");
const path = require("path");

// Load meta tags data from the JSON file
const metaTagsFilePath = path.join(__dirname, "../data/metaTags.json");
let metaTagsData;

try {
  const data = fs.readFileSync(metaTagsFilePath, "utf-8");
  metaTagsData = JSON.parse(data);
} catch (error) {
  console.error("Error reading meta tags data:", error);
  // Fallback to a default structure if the JSON file cannot be loaded
  metaTagsData = {
    Global: {
      title: "Welcome to Our Global Services",
      description: "Explore our global services offerings.",
      keywords: "services, global, services",
    },
  };
}

const getMetaTagsForCountry = (country) => {
  return metaTagsData[country] || metaTagsData["Global"];
};

module.exports = { getMetaTagsForCountry };
