import { Color, Vector2 } from "three";
import { GLYPH_COUNT } from "./glyphAtlas.js";

const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Full-screen pass that redraws the 3D render as a grid of glyphs.
// - Each cell reads the scene's brightness at its centre and draws the glyph of matching weight.
//   Dim tiers are grey, the body is blue, highlights run to near-white.
// - Green-dominant pixels (the subjects' "signal" parts) take the signal colour.
// - Around the subject (where the render's alpha says nothing is drawn), enlarged copies of it
//   ("echoes") leave a halo of faint grey glyphs.
// - During a subject switch, cells flip from scene A to scene B in a sweep from the centre.
export const GlyphShader = {
  uniforms: {
    tSceneA: { value: null },
    tSceneB: { value: null },
    tAtlas: { value: null },
    uResolution: { value: new Vector2(1, 1) },
    uCell: { value: 13 },
    uTime: { value: 0 },
    uMix: { value: 0 },
    uIntro: { value: 1 },
    uGain: { value: 1.0 },
    uBoost: { value: 1 },
    uBg: { value: new Color() },
    uGreyDim: { value: new Color() },
    uGrey: { value: new Color() },
    uMid: { value: new Color() },
    uHot: { value: new Color() },
    uSignal: { value: new Color() },
    uViolet: { value: new Color() },
  },

  vertexShader: fullscreenVertex,

  fragmentShader: /* glsl */ `
    uniform sampler2D tSceneA;
    uniform sampler2D tSceneB;
    uniform sampler2D tAtlas;
    uniform vec2 uResolution;
    uniform float uCell;
    uniform float uTime;
    uniform float uMix;
    uniform float uIntro;
    uniform float uGain;
    uniform float uBoost;
    uniform vec3 uBg;
    uniform vec3 uGreyDim;
    uniform vec3 uGrey;
    uniform vec3 uMid;
    uniform vec3 uHot;
    uniform vec3 uSignal;
    uniform vec3 uViolet;
    varying vec2 vUv;

    #define GLYPHS ${GLYPH_COUNT.toFixed(1)}
    #define TIERS 7.0
    #define BAND 0.22
    #define VARIATION 0.15
    #define EMPTY 0.2 // brightness below which a covered cell stays blank, so dark gaps read as gaps
    const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    // Tiers 1-4 are dot, dash, plus, cross; tier 5 is a bit that flips between 1 and 0
    // now and then; tiers 6-7 are the empty and set bit cells.
    float glyphFor(float tier, vec2 cell) {
      if (tier < 4.5) return tier - 1.0;
      if (tier < 5.5) {
        float rate = 0.2 + 0.8 * hash(cell + 7.1);
        return 4.0 + step(0.5, hash(cell + floor(uTime * rate + hash(cell) * 9.0)));
      }
      return tier;
    }

    vec4 sceneAt(vec2 uv, float useB) {
      return mix(texture2D(tSceneA, uv), texture2D(tSceneB, uv), useB);
    }

    float brightness(vec4 c) {
      return pow(max(dot(c.rgb, LUMA), 0.0), 0.4545) * uGain;
    }

    void main() {
      vec2 cellF = vUv * uResolution / uCell;
      vec2 cell = floor(cellF);
      vec2 local = fract(cellF);
      vec2 cellUv = (cell + 0.5) * uCell / uResolution;
      float h = hash(cell);
      float aspect = uResolution.x / uResolution.y;
      float radius = length((cellUv - 0.5) * vec2(aspect, 1.0)) / (0.5 * max(aspect, 1.0));

      float start = mix(h, clamp(radius, 0.0, 1.0), 0.6) * (1.0 - BAND);
      float k = clamp((uMix - start) / BAND, 0.0, 1.0);
      float useB = step(0.5, k);
      float scramble = (uMix > 0.0 && uMix < 1.0) ? 1.0 - abs(k * 2.0 - 1.0) : 0.0;

      vec4 scene = sceneAt(cellUv, useB);
      float covered = step(0.5, scene.a);
      float lum = brightness(scene) * covered;
      float sig = clamp((scene.g - max(scene.r, scene.b)) * 2.5, 0.0, 1.0);
      float tier = lum < EMPTY ? 0.0 : clamp(floor(lum * TIERS + (hash(cell + 3.7) - 0.5) * 0.7 + 0.5), 1.0, TIERS);
      float glyph = glyphFor(tier, cell);
      if (tier > 0.5 && hash(cell + 11.3) < VARIATION) glyph = glyphFor(1.0 + floor(hash(cell + 5.9) * TIERS), cell);
      float alpha = 1.0;
      float echo = 0.0;

      if (tier < 0.5) {
        // Outside the subject only, two enlarged copies of it, breathing slightly, fill the space around it.
        for (int i = 0; i < 2; i++) {
          if (covered > 0.5) break;
          float fi = float(i);
          float s = mix(0.86, 0.74, fi) + 0.015 * sin(uTime * 0.5 + fi * 2.0);
          vec4 copy = sceneAt(0.5 + (cellUv - 0.5) * s, useB);
          echo = max(echo, brightness(copy) * step(0.5, copy.a) * mix(0.55, 0.3, fi));
        }
        if (echo > 0.06) {
          tier = 1.0 + floor(echo * 4.0);
          glyph = glyphFor(tier, cell);
        } else {
          // Elsewhere, a faint field of dots that twinkles slowly.
          glyph = 0.0;
          alpha = step(0.64, h) * (0.1 + 0.1 * sin(uTime * 0.9 + h * 40.0));
        }
      }
      if (scramble > 0.08) {
        glyph = floor(hash(cell + floor(uTime * 22.0)) * GLYPHS);
        tier = max(tier, 3.0);
        alpha = 1.0;
      }

      float appearAt = clamp(radius * 0.75 + h * 0.25, 0.0, 1.0) * 0.8;
      float appear = smoothstep(appearAt, appearAt + 0.12, uIntro);
      float flash = appear * (1.0 - smoothstep(appearAt + 0.12, appearAt + 0.35, uIntro));

      float scale = mix(0.3, 0.94, appear);
      vec2 g = (local - 0.5) / scale + 0.5;
      vec2 atlasUv = vec2((glyph + clamp(g.x, 0.0, 1.0)) / GLYPHS, clamp(g.y, 0.0, 1.0));
      vec2 perGlyph = vec2(1.0 / GLYPHS, 1.0) / scale;
      float ink = textureGrad(tAtlas, atlasUv, dFdx(cellF) * perGlyph, dFdy(cellF) * perGlyph).a;
      ink *= step(0.0, g.x) * step(g.x, 1.0) * step(0.0, g.y) * step(g.y, 1.0);
      ink *= alpha * appear;

      float weight = tier / TIERS;
      vec3 color = mix(uGreyDim, uGrey, smoothstep(0.1, 0.4, weight));
      color = mix(color, uMid, smoothstep(0.4, 0.7, weight));
      color = mix(color, uHot, smoothstep(0.75, 1.0, weight));
      color = mix(color, uSignal * uBoost, sig);
      if (echo > 0.06) color = mix(uGreyDim, uViolet, 0.3);
      color = mix(color, uViolet * uBoost, max(flash, scramble));

      gl_FragColor = vec4(mix(uBg, color, ink), 1.0);
    }
  `,
};

// Last pass before output: fades the stage, glow included, into the page background at its edges.
export const EdgeFadeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBg: { value: new Color() },
  },
  vertexShader: fullscreenVertex,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uBg;
    varying vec2 vUv;
    void main() {
      vec2 e = smoothstep(vec2(0.0), vec2(0.12), vUv) * smoothstep(vec2(1.0), vec2(0.88), vUv);
      gl_FragColor = vec4(mix(uBg, texture2D(tDiffuse, vUv).rgb, e.x * e.y), 1.0);
    }
  `,
};
