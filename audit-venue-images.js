const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();
const BETA_INDEX_PATH = path.join(ROOT, "beta", "index.html");
const VENUES_DIR = path.join(ROOT, "beta", "images", "venues");

function extractPlaces(html) {
  const startToken = "let places = [";
  const startIndex = html.indexOf(startToken);
  if (startIndex === -1) {
    throw new Error("Could not locate places array in beta/index.html");
  }

  const arrayStart = html.indexOf("[", startIndex);
  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;
  let arrayEnd = -1;

  for (let i = arrayStart; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error("Could not determine the end of the places array");
  }

  const arrayText = html.slice(arrayStart, arrayEnd + 1);
  return Function(`"use strict"; return (${arrayText});`)();
}

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

function main() {
  const html = fs.readFileSync(BETA_INDEX_PATH, "utf8");
  const places = extractPlaces(html);
  const rows = places.map((place) => {
    const filePath = path.join(VENUES_DIR, `${place.id}.jpg`);
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    const hash = exists ? hashFile(filePath) : "";
    return {
      id: place.id,
      name: place.name,
      website: place.website || "",
      ticketUrl: place.ticketUrl || "",
      image: place.image || "",
      exists,
      size,
      hash
    };
  });

  const duplicateGroups = new Map();
  for (const row of rows) {
    if (!row.hash) continue;
    if (!duplicateGroups.has(row.hash)) duplicateGroups.set(row.hash, []);
    duplicateGroups.get(row.hash).push(row);
  }

  console.log("=== Places ===");
  for (const row of rows) {
    console.log(
      JSON.stringify({
        id: row.id,
        name: row.name,
        website: row.website,
        ticketUrl: row.ticketUrl,
        image: row.image,
        size: row.size
      })
    );
  }

  console.log("");
  console.log("=== Duplicate image groups ===");
  let foundDuplicates = false;
  for (const [hash, group] of duplicateGroups.entries()) {
    if (group.length < 2) continue;
    foundDuplicates = true;
    console.log(`${hash} (${group[0].size} bytes)`);
    for (const row of group) {
      console.log(`  - ${row.id}: ${row.name}`);
    }
  }

  if (!foundDuplicates) {
    console.log("No duplicate files detected.");
  }
}

main();
