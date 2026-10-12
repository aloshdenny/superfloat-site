import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from "three";

export const GLYPH_COUNT = 8;
const SIZE = 128;

function strokes(c, s, lines) {
  c.beginPath();
  for (const [x1, y1, x2, y2] of lines) {
    c.moveTo(x1 * s, y1 * s);
    c.lineTo(x2 * s, y2 * s);
  }
  c.stroke();
}

// Lightest to heaviest ink: dot, dash, plus, cross, one, zero, empty bit cell, set bit cell.
// The glyph pass picks a slot by brightness, so this order is the brightness ramp.
const GLYPHS = [
  (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.08, 0, Math.PI * 2); c.fill(); },
  (c, s) => strokes(c, s, [[0.3, 0.5, 0.7, 0.5]]),
  (c, s) => strokes(c, s, [[0.28, 0.5, 0.72, 0.5], [0.5, 0.28, 0.5, 0.72]]),
  (c, s) => strokes(c, s, [[0.3, 0.3, 0.7, 0.7], [0.7, 0.3, 0.3, 0.7]]),
  (c, s) => strokes(c, s, [[0.36, 0.32, 0.52, 0.2], [0.52, 0.2, 0.52, 0.8], [0.34, 0.8, 0.7, 0.8]]),
  (c, s) => { c.beginPath(); c.roundRect(s * 0.3, s * 0.2, s * 0.4, s * 0.6, s * 0.16); c.stroke(); },
  (c, s) => c.strokeRect(s * 0.24, s * 0.24, s * 0.52, s * 0.52),
  (c, s) => c.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6),
];

export function createGlyphAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE * GLYPH_COUNT;
  canvas.height = SIZE;
  const c = canvas.getContext("2d");
  c.fillStyle = "#fff";
  c.strokeStyle = "#fff";
  c.lineWidth = SIZE * 0.12;
  c.lineCap = "round";
  c.lineJoin = "round";
  GLYPHS.forEach((draw, i) => {
    c.save();
    c.translate(i * SIZE, 0);
    draw(c, SIZE);
    c.restore();
  });
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}
