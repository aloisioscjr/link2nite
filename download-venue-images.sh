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

echo "Downloading remaining venue images from Unsplash Source (best-effort)..."

# Rooftops / skyline
download "lebain" "https://source.unsplash.com/800x450/?le%20bain%20rooftop,nyc"
download "skylark" "https://source.unsplash.com/800x450/?the%20skylark%20rooftop,nyc"
download "mrpurple" "https://source.unsplash.com/800x450/?mr%20purple%20rooftop,nyc"
download "phdterrace" "https://source.unsplash.com/800x450/?phd%20terrace%20rooftop,nyc"
download "refinery" "https://source.unsplash.com/800x450/?refinery%20rooftop,nyc"
download "the_ned" "https://source.unsplash.com/800x450/?the%20ned%20nomad%20rooftop,nyc"
download "harriet" "https://source.unsplash.com/800x450/?brooklyn%20bridge%20rooftop,nyc"
download "westlight" "https://source.unsplash.com/800x450/?westlight%20rooftop,nyc"
download "bar_sixtyfive" "https://source.unsplash.com/800x450/?bar%20sixtyfive%20rockefeller,nyc"
download "penn_top" "https://source.unsplash.com/800x450/?public%20hotel%20rooftop,nyc"
download "magic_hour" "https://source.unsplash.com/800x450/?magic%20hour%20rooftop,nyc"

# Cocktail bars / lounges
download "employeesonly" "https://source.unsplash.com/800x450/?employees%20only%20bar,nyc"
download "ziggy" "https://source.unsplash.com/800x450/?west%20village%20cocktail%20bar,nyc"
download "beautique" "https://source.unsplash.com/800x450/?beauty%20and%20essex%20nyc"
download "paul_baby" "https://source.unsplash.com/800x450/?piano%20bar%20cocktails"
download "little_sister" "https://source.unsplash.com/800x450/?dim%20lounge%20bar,nyc"
download "the_blond" "https://source.unsplash.com/800x450/?the%20blond%20soho,nyc"

# Live music / jazz
download "bluenote" "https://source.unsplash.com/800x450/?blue%20note%20jazz%20club,nyc"
download "django" "https://source.unsplash.com/800x450/?the%20django%20jazz%20club,nyc"

# Party / clubs
download "house_yes" "https://source.unsplash.com/800x450/?house%20of%20yes%20club,brooklyn"
download "somewhere_nowhere" "https://source.unsplash.com/800x450/?somewhere%20nowhere%20rooftop,nyc"
download "phd_downtown" "https://source.unsplash.com/800x450/?phd%20downtown%20rooftop,nyc"
download "lavo" "https://source.unsplash.com/800x450/?lavo%20nightclub,nyc"
download "tao" "https://source.unsplash.com/800x450/?tao%20downtown%20restaurant%20club,nyc"
download "analog" "https://source.unsplash.com/800x450/?underground%20club,nyc"
download "paradise" "https://source.unsplash.com/800x450/?paradise%20club%20nyc"
download "the_box" "https://source.unsplash.com/800x450/?burlesque%20club%20nyc"

echo "Done. Check the images/venues/ folder and adjust/replace any photo you don't like."
