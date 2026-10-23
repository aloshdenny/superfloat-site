# Investor deck

`Atreides_Investor_Deck.pptx` is published at superfloat.si/investors/pitch/. Nothing on the
site links to that page, and it asks search engines not to index it, so only people given the
link see it.

To update it, edit the `.pptx` and run `pitch/render.sh`. That rewrites the PDF and the
1920 × 1080 slide images in `public/investors/pitch/`. If the slide count changes, update the
slide list and alt text in `public/investors/pitch/index.html`. Merging to `main` deploys it.

`Atreides_Partner_Deck.pptx` is the earlier 13-slide partner version (no $1.7M round); its PDF stays in
`public/investors/pitch/` so old direct links keep working.
