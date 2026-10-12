import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";

// Green-dominant surfaces come out of the glyph pass in the signal colour; neutral greys
// come out in the brightness ramp. Keep everything else grey.
const SIGNAL = new Color(0.32, 1, 0.22);
const IDLE = new Color(0.55, 0.56, 0.6);
const LEAD = new Color(0.9, 0.9, 0.93);

function roundedRect(width, height, r) {
  const x = -width / 2;
  const y = -height / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function slab(width, height, r, depth, bevel) {
  return new ExtrudeGeometry(roundedRect(width, height, r), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
}

function disposer(group) {
  return () => {
    const seen = new Set();
    group.traverse((o) => {
      for (const res of [o.geometry, ...[o.material].flat()]) {
        if (res && !seen.has(res)) {
          seen.add(res);
          res.dispose();
        }
      }
    });
  };
}

function wave(x, sharpness) {
  const d = x - Math.floor(x) - 0.5;
  return Math.exp(-d * d * sharpness);
}

// The sf mark, after the brand symbol: italic "sf" in a framed tile. The letters are tubes
// along hand-placed stroke paths (no font file), slanted for the italic.
const LETTER_S = [[-0.1, 0.12], [-0.2, 0.21], [-0.38, 0.23], [-0.54, 0.15], [-0.57, 0.01], [-0.46, -0.11], [-0.27, -0.22], [-0.17, -0.36], [-0.22, -0.52], [-0.4, -0.61], [-0.57, -0.56], [-0.64, -0.46]];
const LETTER_F = [[-0.08, -0.74], [-0.02, -0.86], [0.1, -0.84], [0.17, -0.7], [0.21, -0.3], [0.25, 0.2], [0.3, 0.56], [0.38, 0.72], [0.52, 0.78], [0.64, 0.72]];
const F_BAR = [[0.05, 0.22], [0.48, 0.22]];
const ITALIC = 0.2;

function buildMark() {
  const group = new Group();
  const S = 1.12;
  const tileGeo = slab(2 * S, 2 * S, 0.42, 0.22, 0.07);
  tileGeo.center();
  group.add(new Mesh(tileGeo, new MeshStandardMaterial({ color: 0x5c616b, roughness: 0.5, metalness: 0.25 })));

  const ink = new MeshStandardMaterial({ color: 0xb8ff8a, emissive: 0x2f9a10, roughness: 0.35, metalness: 0.05 });
  const frameShape = roundedRect(2 * S, 2 * S, 0.42);
  frameShape.holes.push(roundedRect(2 * S - 0.2, 2 * S - 0.2, 0.34));
  const frame = new Mesh(new ExtrudeGeometry(frameShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3, curveSegments: 10 }), ink);
  frame.position.z = 0.18;
  group.add(frame);

  const radius = 0.085;
  const z = 0.18 + radius;
  const cap = new SphereGeometry(radius, 16, 12);
  for (const stroke of [LETTER_S, LETTER_F, F_BAR]) {
    const points = stroke.map(([x, y]) => new Vector3(x + ITALIC * y, y, z));
    const curve = stroke.length > 2 ? new CatmullRomCurve3(points, false, "centripetal") : new LineCurve3(...points);
    group.add(new Mesh(new TubeGeometry(curve, stroke.length > 2 ? 96 : 8, radius, 12, false), ink));
    for (const end of [points[0], points[points.length - 1]]) {
      const m = new Mesh(cap, ink);
      m.position.copy(end);
      group.add(m);
    }
  }

  return {
    group,
    update(t) {
      group.rotation.set(-0.1 + Math.sin(t * 0.31) * 0.1, Math.sin(t * 0.42) * 0.45, 0);
      ink.emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 1.7);
    },
    dispose: disposer(group),
  };
}

// The chip: a quad flat package carrying the four Atreides tiles, each an 8 x 8 grid of
// processing elements (256 MACs) with its own activity wave, and a pulse running round the leads.
function buildChip() {
  const group = new Group();
  const spin = new Group();
  group.add(spin);
  const body = 1.85;

  const substrate = slab(body, body, 0.06, 0.12, 0.02);
  substrate.center();
  spin.add(new Mesh(substrate, new MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.85, metalness: 0.05 })));

  const tileSize = 0.72;
  const tileGeo = slab(tileSize, tileSize, 0.04, 0.05, 0.015);
  const tileMat = new MeshStandardMaterial({ color: 0x3a404c, roughness: 0.6, metalness: 0.3 });
  const centres = [[-0.4, 0.4], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4]];
  for (const [x, y] of centres) {
    const tile = new Mesh(tileGeo, tileMat);
    tile.position.set(x, y, 0.06);
    spin.add(tile);
  }

  const n = 8;
  const pitch = (tileSize - 0.08) / n;
  const pes = new InstancedMesh(new BoxGeometry(pitch * 0.68, pitch * 0.68, 0.05), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2 }), 4 * n * n);
  const dummy = new Object3D();
  centres.forEach(([x, y], k) => {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        dummy.position.set(x + (c - (n - 1) / 2) * pitch, y + ((n - 1) / 2 - r) * pitch, 0.155);
        dummy.updateMatrix();
        pes.setMatrixAt(k * n * n + r * n + c, dummy.matrix);
      }
    }
  });
  spin.add(pes);

  const marker = new CylinderGeometry(0.05, 0.05, 0.02, 20);
  marker.rotateX(Math.PI / 2);
  const pin1 = new Mesh(marker, new MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.9 }));
  pin1.position.set(-0.84, 0.84, 0.09);
  spin.add(pin1);

  const perSide = 12;
  const leads = new InstancedMesh(new BoxGeometry(0.075, 0.3, 0.035), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.45 }), perSide * 4);
  const around = [];
  const leadPitch = body / (perSide + 1);
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    for (let i = 0; i < perSide; i++) {
      const x = -body / 2 + leadPitch * (i + 1);
      const y = body / 2 + 0.12;
      dummy.position.set(x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle), -0.02);
      dummy.rotation.set(0, 0, angle);
      dummy.updateMatrix();
      leads.setMatrixAt(around.length, dummy.matrix);
      leads.setColorAt(around.length, LEAD);
      around.push((side + i / perSide) / 4);
    }
  }
  spin.add(leads);
  const tint = new Color();

  return {
    group,
    update(t) {
      group.rotation.set(-0.95 + Math.sin(t * 0.3) * 0.08, Math.sin(t * 0.25) * 0.15, 0);
      spin.rotation.z = t * 0.22;
      around.forEach((p, i) => leads.setColorAt(i, tint.copy(LEAD).lerp(SIGNAL, wave(p - t * 0.18, 180))));
      leads.instanceColor.needsUpdate = true;
      for (let k = 0; k < 4; k++) {
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const w = wave((r + c) / (2 * n) - t * 0.3 + k * 0.27, 40);
            pes.setColorAt(k * n * n + r * n + c, tint.copy(IDLE).lerp(SIGNAL, w));
          }
        }
      }
      pes.instanceColor.needsUpdate = true;
    },
    dispose: disposer(group),
  };
}

// The array: 16 x 16 processing elements with a systolic wavefront crossing them corner to corner.
function buildArray() {
  const group = new Group();
  const spin = new Group();
  group.add(spin);
  const n = 16;
  const size = 2.6;
  const pitch = size / n;

  const plate = new Mesh(new BoxGeometry(size + 0.16, size + 0.16, 0.06), new MeshStandardMaterial({ color: 0x15181f, roughness: 1, metalness: 0 }));
  plate.position.z = -0.03;
  spin.add(plate);

  const cell = pitch * 0.58;
  const cubes = new InstancedMesh(new BoxGeometry(cell, cell, 1), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.2 }), n * n);
  spin.add(cubes);
  const dummy = new Object3D();
  const tint = new Color();

  return {
    group,
    update(t) {
      group.rotation.set(-0.85, 0, 0);
      spin.rotation.z = -0.62 + Math.sin(t * 0.2) * 0.35;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const w = wave((r + c) / (2 * n) - t * 0.16, 60);
          const height = 0.08 + 0.16 * w;
          dummy.position.set((c - (n - 1) / 2) * pitch, ((n - 1) / 2 - r) * pitch, height / 2);
          dummy.scale.set(1, 1, height);
          dummy.updateMatrix();
          cubes.setMatrixAt(r * n + c, dummy.matrix);
          cubes.setColorAt(r * n + c, tint.copy(IDLE).lerp(SIGNAL, w));
        }
      }
      cubes.instanceMatrix.needsUpdate = true;
      cubes.instanceColor.needsUpdate = true;
    },
    dispose: disposer(group),
  };
}

// Same order as SUBJECTS in GlyphHero.jsx.
export function buildSubjects() {
  return [buildMark(), buildChip(), buildArray()];
}
