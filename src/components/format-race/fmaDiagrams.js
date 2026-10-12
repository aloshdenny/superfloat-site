// Datapath diagrams for the race's front face, one band per pipeline stage (same order as UNITS[*].stages).
// Coordinates are in a 360-wide SVG; band -1 is the input row and band n the output row.
// Node kinds: io (pill), reg (register box), op (operator circle). `exponent` marks exponent hardware.

export const BAND_TOP = 58;
export const BAND_H = 84;
export const DIAGRAM_W = 360;
export const MAX_BANDS = 5;
export const DIAGRAM_H = BAND_TOP + MAX_BANDS * BAND_H + 48;

export const DIAGRAMS = {
  SF16: {
    bands: [{ name: "Operands" }, { name: "Multiply" }, { name: "Accumulate" }],
    nodes: [
      { id: "a", band: -1, x: 130, kind: "io", label: "a" },
      { id: "w", band: -1, x: 230, kind: "io", label: "w" },
      { id: "ra", band: 0, x: 130, kind: "reg", label: "a", sub: "Q1.15" },
      { id: "rw", band: 0, x: 230, kind: "reg", label: "w", sub: "Q1.15" },
      { id: "xor", band: 1, x: 110, kind: "op", label: "⊕", sub: "sign" },
      { id: "mul", band: 1, x: 210, kind: "op", label: "×", sub: "15 × 15" },
      { id: "add", band: 2, x: 170, kind: "op", label: "+", sub: "saturate" },
      { id: "acc", band: 2, x: 286, kind: "reg", label: "acc", w: 64 },
      { id: "c", band: 3, x: 286, kind: "io", label: "C" },
    ],
    edges: [["a", "ra"], ["w", "rw"], ["ra", "xor"], ["rw", "xor"], ["ra", "mul"], ["rw", "mul"], ["xor", "add"], ["mul", "add"], ["add", "acc"], ["acc", "c"]],
    loop: { from: "acc", to: "add", label: "1-cycle loop" },
  },
  BF16: {
    bands: [{ name: "Operands" }, { name: "Multiply" }, { name: "Align", exponent: true }, { name: "Add" }, { name: "Normalize + round", exponent: true }],
    nodes: [
      { id: "a", band: -1, x: 130, kind: "io", label: "a" },
      { id: "w", band: -1, x: 230, kind: "io", label: "w" },
      { id: "ra", band: 0, x: 130, kind: "reg", label: "a", sub: "1 / 8 / 7" },
      { id: "rw", band: 0, x: 230, kind: "reg", label: "w", sub: "1 / 8 / 7" },
      { id: "xor", band: 1, x: 90, kind: "op", label: "⊕", sub: "sign" },
      { id: "eadd", band: 1, x: 175, kind: "op", label: "E+", sub: "exp add", exponent: true },
      { id: "mul", band: 1, x: 260, kind: "op", label: "×", sub: "8 × 8" },
      { id: "cmp", band: 2, x: 140, kind: "op", label: "CMP", sub: "exp compare", exponent: true },
      { id: "shr", band: 2, x: 230, kind: "op", label: "≫", sub: "barrel shift", exponent: true },
      { id: "add", band: 3, x: 200, kind: "op", label: "+", sub: "mantissa" },
      { id: "lzd", band: 4, x: 84, kind: "op", label: "LZD", sub: "lead zeros", exponent: true },
      { id: "shl", band: 4, x: 160, kind: "op", label: "≪", sub: "normalize", exponent: true },
      { id: "rnd", band: 4, x: 236, kind: "op", label: "RND", sub: "round", exponent: true },
      { id: "acc", band: 4, x: 310, kind: "reg", label: "acc", w: 56 },
      { id: "c", band: 5, x: 310, kind: "io", label: "C" },
    ],
    edges: [
      ["a", "ra"], ["w", "rw"], ["ra", "xor"], ["rw", "xor"], ["ra", "eadd"], ["rw", "eadd"], ["ra", "mul"], ["rw", "mul"],
      ["eadd", "cmp"], ["xor", "cmp"], ["mul", "shr"], ["cmp", "shr"], ["shr", "add"], ["add", "lzd"], ["lzd", "shl"], ["shl", "rnd"], ["rnd", "acc"], ["acc", "c"],
    ],
    loop: { from: "acc", to: "shr", label: "3-cycle loop" },
  },
};

export const bandTop = (band) => BAND_TOP + band * BAND_H;
export function nodeY(band, bandCount) {
  if (band < 0) return 26;
  if (band >= bandCount) return bandTop(bandCount) + 20;
  return bandTop(band) + 48;
}

// Half-extents of a node's shape, for routing wires to its edges.
export function nodeSize(node) {
  if (node.kind === "op") return { hw: 19, hh: 19 };
  if (node.kind === "reg") return { hw: (node.w ?? 84) / 2, hh: node.sub ? 17 : 14 };
  return { hw: 22, hh: 12 };
}
