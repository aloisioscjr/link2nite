const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BETA_INDEX_PATH = path.join(ROOT, "beta", "index.html");
const OUTPUT_DIRS = [
  path.join(ROOT, "beta", "images", "venues"),
  path.join(ROOT, "link2nite-repo", "beta", "images", "venues")
];
const PLACEHOLDER_MAX_BYTES = 20_000;
const MIN_NON_STOCK_PHOTO_BYTES = 30_000;

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

function isSmallPlaceholder(filePath) {
  if (!fs.existsSync(filePath)) return true;
  const stats = fs.statSync(filePath);
  return stats.size <= PLACEHOLDER_MAX_BYTES;
}

function buildStockQuery(place) {
  const haystack = `${place.type || ""} ${(place.tags || []).join(" ")}`.toLowerCase();
  if (haystack.includes("jazz")) return "jazz,club,bar";
  if (haystack.includes("piano")) return "piano,bar,interior";
  if (haystack.includes("speakeasy")) return "cocktail,bar,interior";
  if (haystack.includes("cocktail")) return "cocktail,bar,interior";
  if (haystack.includes("rooftop")) return "rooftop,bar,city";
  if (haystack.includes("nightclub") || haystack.includes("club") || haystack.includes("party") || haystack.includes("dj")) {
    return "nightclub,dj,lights";
  }
  if (haystack.includes("lounge")) return "lounge,bar,interior";
  if (haystack.includes("live music") || haystack.includes("live")) return "live,music,bar";
  return "bar,nightlife,interior";
}

function buildStockUrl(place) {
  return `https://loremflickr.com/1200/675/${buildStockQuery(place)}?lock=${encodeURIComponent(place.id)}`;
}

function wrapImageUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return "";
  if (normalized.includes("loremflickr.com/")) return normalized;
  const withoutProtocol = normalized.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=1200&h=675&fit=cover&output=jpg`;
}

function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"'<>]+)["']/i,
    /<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']og:image["']/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return new URL(match[1], baseUrl).toString();
      } catch {
        return match[1];
      }
    }
  }
  return "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; Link2NiteAssetRefresh/1.0)"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchBinary(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; Link2NiteAssetRefresh/1.0)"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function findOfficialImage(place) {
  const candidates = [place.website, place.ticketUrl]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  for (const candidate of [...new Set(candidates)]) {
    try {
      const html = await fetchText(candidate);
      const ogImage = extractOgImage(html, candidate);
      if (ogImage) {
        return ogImage;
      }
    } catch (error) {
      console.warn(`[venue-image] ${place.id}: failed to inspect ${candidate} (${error.message})`);
    }
  }
  return "";
}

async function resolveSource(place) {
  const officialImage = await findOfficialImage(place);
  if (officialImage) {
    return {
      sourceUrl: wrapImageUrl(officialImage),
      sourceKind: "official-og"
    };
  }

  const remoteImage = String(place.image || "").trim();
  if (/^https?:\/\//i.test(remoteImage) && !remoteImage.includes("source.unsplash.com")) {
    return {
      sourceUrl: wrapImageUrl(remoteImage),
      sourceKind: "remote-image"
    };
  }

  return {
    sourceUrl: buildStockUrl(place),
    sourceKind: "stock-fallback"
  };
}

async function downloadVenueImage(place) {
  const primary = await resolveSource(place);
  try {
    const buffer = await fetchBinary(primary.sourceUrl);
    if (primary.sourceKind !== "stock-fallback" && buffer.length < MIN_NON_STOCK_PHOTO_BYTES) {
      throw new Error(`Image too small (${buffer.length} bytes)`);
    }
    return { buffer, ...primary };
  } catch (primaryError) {
    const fallbackUrl = buildStockUrl(place);
    if (primary.sourceUrl === fallbackUrl) {
      throw primaryError;
    }
    console.warn(`[venue-image] ${place.id}: fallback to stock after ${primary.sourceKind} failed (${primaryError.message})`);
    const buffer = await fetchBinary(fallbackUrl);
    return {
      buffer,
      sourceUrl: fallbackUrl,
      sourceKind: "stock-fallback"
    };
  }
}

async function main() {
  const html = fs.readFileSync(BETA_INDEX_PATH, "utf8");
  const places = extractPlaces(html);
  const summary = {
    updated: [],
    skipped: []
  };

  for (const dir of OUTPUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const place of places) {
    const rootOutputPath = path.join(OUTPUT_DIRS[0], `${place.id}.jpg`);
    if (!isSmallPlaceholder(rootOutputPath)) {
      summary.skipped.push(place.id);
      continue;
    }

    const { buffer, sourceKind, sourceUrl } = await downloadVenueImage(place);
    for (const outputDir of OUTPUT_DIRS) {
      fs.writeFileSync(path.join(outputDir, `${place.id}.jpg`), buffer);
    }
    const sizeKb = Math.round(buffer.length / 1024);
    summary.updated.push({ id: place.id, sourceKind, sizeKb, sourceUrl });
    console.log(`[venue-image] updated ${place.id} via ${sourceKind} (${sizeKb} KB)`);
  }

  console.log("");
  console.log(`[venue-image] updated ${summary.updated.length} files; skipped ${summary.skipped.length} already-good files`);
}

main().catch((error) => {
  console.error("[venue-image] failed:", error);
  process.exitCode = 1;
});
