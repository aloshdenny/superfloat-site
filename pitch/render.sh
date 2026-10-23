#!/bin/sh
# Rebuild superfloat.si/investors/pitch/ from pitch/Atreides_Investor_Deck.pptx.
# Needs LibreOffice (soffice), poppler (pdftoppm) and cwebp.
set -eu
cd "$(dirname "$0")/.."
out=public/investors/pitch
tmp=$(mktemp -d)
soffice --headless --convert-to pdf --outdir "$out" pitch/Atreides_Investor_Deck.pptx
pdftoppm -png -scale-to-x 1920 -scale-to-y 1080 "$out/Atreides_Investor_Deck.pdf" "$tmp/s"
rm -f "$out"/slides/*.webp
for f in "$tmp"/s-*.png; do
  n=${f##*-}
  cwebp -quiet -q 82 "$f" -o "$out/slides/${n%.png}.webp"
done
rm -rf "$tmp"
