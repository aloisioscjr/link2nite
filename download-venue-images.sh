#!/usr/bin/env bash
set -euo pipefail

echo "Downloading / preparing Link2Nite venue images..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

mkdir -p images/venues

download() {
  local id="$1"
  local url="$2"
  echo "→ $id"
  curl -L "$url" -o "images/venues/${id}.jpg"
}

echo "Copying existing local hero images for 230 Fifth and Jane Ballroom..."
if [[ -f "230 rooftop.jpg" ]]; then
  cp "230 rooftop.jpg" "images/venues/230fifth.jpg"
else
  echo "  (warn) 230 rooftop.jpg not found, skipping copy."
fi

if [[ -f "jane ballroom.jpg" ]]; then
  cp "jane ballroom.jpg" "images/venues/jane_ballroom.jpg"
else
  echo "  (warn) jane ballroom.jpg not found, skipping copy."
fi

echo "Downloading venue placeholder images (dummyimage.com - direct JPEG, no redirect)..."

# dummyimage.com returns real JPEG directly (no redirect), so curl always gets image bytes
# Format: 800x450, dark bg color, light text. Each venue gets a different color.
dummyimg() {
  local id="$1"
  local hex="$2"
  echo "→ $id"
  curl -s "https://dummyimage.com/800x450/${hex}/94a3b8.jpg?text=${id}" -o "images/venues/${id}.jpg"
}

# Rooftops / skyline (dark blues and purples)
dummyimg "lebain" "1e3a5f"
dummyimg "skylark" "312e81"
dummyimg "mrpurple" "4c1d95"
dummyimg "phdterrace" "1e3a5f"
dummyimg "refinery" "0f172a"
dummyimg "the_ned" "312e81"
dummyimg "harriet" "1e293b"
dummyimg "westlight" "4c1d95"
dummyimg "bar_sixtyfive" "0f172a"
dummyimg "penn_top" "1e3a5f"
dummyimg "magic_hour" "312e81"

# Cocktail bars / lounges
dummyimg "employeesonly" "1e293b"
dummyimg "ziggy" "4c1d95"
dummyimg "beautique" "0f172a"
dummyimg "paul_baby" "1e3a5f"
dummyimg "little_sister" "312e81"
dummyimg "the_blond" "1e293b"

# Live music / jazz
dummyimg "bluenote" "1e3a5f"
dummyimg "django" "4c1d95"

# Party / clubs
dummyimg "house_yes" "4c1d95"
dummyimg "somewhere_nowhere" "0f172a"
dummyimg "phd_downtown" "1e3a5f"
dummyimg "lavo" "312e81"
dummyimg "tao" "0f172a"
dummyimg "analog" "1e293b"
dummyimg "paradise" "4c1d95"
dummyimg "the_box" "312e81"

echo "Done. Venue images are real JPEGs. Replace any file in images/venues/ with a real venue photo when you have one."
