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
const FORCE_IDS = new Set(
  (process.argv.find((arg) => arg.startsWith("--force=")) || "")
    .replace("--force=", "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);
const MANUAL_VENUE_IMAGE_URLS = {
  the_ned: "https://media.fastly.sohohousedigital.com/t_dc_base/sitecore-prod/ned/nomad/rooftop/the-ned-nomad-rooftop.jpg",
  harriet: "https://www.1hotels.com/sites/1hotels.com/files/styles/card/public/brandfolder/4rhrh85c45xbm2q462wfgmz/1BB_Harriets_Rooftop__0680h1280.png?h=e608a0a1&itok=CXhvBHiI",
  westlight: "https://images.getbento.com/accounts/e911161024a627d84acd70f29ca7b56f/media/images/20778Studio_Munge_Westlight_MichaelStavaridis_2.jpg?w=1200&fit=max&auto=compress,format&cs=origin",
  beautique: "https://taogroup.com/wp-content/uploads/2023/12/BE-SF-Pearl-Seated.jpg",
  house_yes: "https://images.squarespace-cdn.com/content/v1/60eefee8ddd3d006b4096467/651c9853-1b1d-4123-9839-42290d968a8b/Midsummernightsdream72118_KR_-6526.jpg",
  little_sister: "https://taogroup.com/wp-content/uploads/2026/06/260725_LS_Saturdays_1080x1350.jpg",
  somewhere_nowhere: "https://cdn.prod.website-files.com/6822dccf8dd75e012e4615bd/68772fdd2f59fccd4fde064e_open-graph.webp",
  phd_downtown: "https://taogroup.com/wp-content/uploads/2022/04/phdloungrooftopbar-970x694.jpg",
  magic_hour: "https://moxytimessquare.com/content/uploads/sites/1/2025/04/tinywow_100617-Magic-Hour-131-1_78350875-1920x1280.jpg",
  the_box: "https://theboxnyc.com/wp-content/uploads/sites/3/2022/02/BOX.jpg",
  bar_sixtyfive: "https://images.weserv.nl/?url=www.therooftopguide.com/rooftop-bars-in-new-york/Bilder/bar-sixtyfive-at-rainbow-room-600-1.jpg&w=1200&h=675&fit=cover&output=jpg",
  penn_top: "https://www.publichotels.com/newyork/opengraph-image.jpg?c09639ca7b33e972",
  lavo: "https://taogroup.com/wp-content/uploads/2024/01/JustinLevy-92sd.jpg",
  tao: "https://taogroup.com/wp-content/uploads/2023/12/Main-Dining-1-scaled.jpg",
  the_blond: "https://images.weserv.nl/?url=cache.marriott.com/content/dam/marriott-renditions/NYCHW/nychw-the-blond-0277-hor-wide.jpg&w=1200&h=675&fit=cover&output=jpg",
  paradise: "https://www.theparadiseclubnyc.com/content/uploads/2026/06/paradise-collage-5-768x512.jpg",
  skylark: "https://images.getbento.com/accounts/ad9efdad42410aacfba2772a9efbc95b/media/images/88969sky_15.jpg?auto=compress%2Cformat&crop=focalpoint&cs=origin&fit=crop&fp-x=0.53&fp-y=0.33&w=1200",
  employeesonly: "https://www.employeesonlynyc.com/content/home/home_03.jpg",
  phdterrace: "https://taogroup.com/wp-content/uploads/2022/05/daisy-dreaming-570696-970x696.jpg",
  mrpurple: "https://hb-strapi-prod.gumlet.io/My_purple_new_york_birthday_party_jpg_3_e8d479206b.jpg?auto=format&con=15&fit=crop&h=960&sharp=5&w=1399.68",
  ziggy: "https://loremflickr.com/1200/675/cocktail,bar,interior?lock=ziggy",
  analog: "https://loremflickr.com/1200/675/nightclub,dj,lights?lock=analog"
};

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
  const manualImage = MANUAL_VENUE_IMAGE_URLS[place.id];
  if (manualImage) {
    return {
      sourceUrl: manualImage,
      sourceKind: "manual-official"
    };
  }

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
    if (!FORCE_IDS.has(place.id) && !isSmallPlaceholder(rootOutputPath)) {
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
