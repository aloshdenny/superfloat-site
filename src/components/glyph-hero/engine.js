import {
  Clock,
  DirectionalLight,
  HalfFloatType,
  HemisphereLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createGlyphAtlas } from "./glyphAtlas.js";
import { EdgeFadeShader, GlyphShader } from "./glyphShader.js";
import { buildSubjects } from "./subjects.js";

const HOLD = 7;
const TRANSITION = 1.5;
const INTRO = 2.2;
const SCENE_SCALE = 0.75;
const CAMERA_DISTANCE = 6.4;

// Blue body, grey low tiers, cyan signal, violet for switches and echoes. bg matches --sf-bg.
const PALETTE = { bg: "#0a0d14", greyDim: "#232a3a", grey: "#485369", mid: "#3d74f2", hot: "#e3ecff", signal: "#4fe1ff", violet: "#a78bfa", boost: 1.35 };

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function createGlyphHero(canvas, { reducedMotion = false, onSubject = () => {} } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.3;
  scene.add(new HemisphereLight(0xdfe8ff, 0x10131a, 0.4));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  const rim = new DirectionalLight(0xffffff, 1.2);
  rim.position.set(4, 1.5, -3);
  const fill = new DirectionalLight(0xffffff, 0.5);
  fill.position.set(3, -2, 4);
  scene.add(key, rim, fill);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = CAMERA_DISTANCE;

  const subjects = buildSubjects();
  for (const s of subjects) {
    s.group.visible = false;
    scene.add(s.group);
  }

  // Scene A is the subject on show; scene B is only rendered while switching to the next one.
  const rtA = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const rtB = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const atlas = createGlyphAtlas();

  // The glyph pass reads the scene targets, not the composer's input, so it is given no input slot.
  const glyphPass = new ShaderPass(GlyphShader, "tUnused");
  const u = glyphPass.uniforms;
  u.tSceneA.value = rtA.texture;
  u.tSceneB.value = rtB.texture;
  u.tAtlas.value = atlas;

  const composer = new EffectComposer(renderer);
  composer.addPass(glyphPass);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.35, 0.15, 0.8);
  composer.addPass(bloom);
  const edgeFade = new ShaderPass(EdgeFadeShader);
  composer.addPass(edgeFade);
  composer.addPass(new OutputPass());

  u.uBg.value.set(PALETTE.bg);
  u.uGreyDim.value.set(PALETTE.greyDim);
  u.uGrey.value.set(PALETTE.grey);
  u.uMid.value.set(PALETTE.mid);
  u.uHot.value.set(PALETTE.hot);
  u.uSignal.value.set(PALETTE.signal);
  u.uViolet.value.set(PALETTE.violet);
  u.uBoost.value = PALETTE.boost;
  edgeFade.uniforms.uBg.value.set(PALETTE.bg);

  const clock = new Clock(false);
  let current = 0;
  let next = -1;
  let transitionStart = 0;
  let shownAt = -TRANSITION; // so every subject, the first included, is up for HOLD + TRANSITION
  let time = 0;
  let running = false;
  let frame = 0;
  let reduced = reducedMotion;


  function renderSubject(index, target) {
    subjects.forEach((s, i) => { s.group.visible = i === index; });
    subjects[index].update(time);
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0); // alpha marks where the subject is
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  }

  function draw(dt) {
    if (running && next === -1 && time - shownAt > HOLD) {
      next = (current + 1) % subjects.length;
      transitionStart = time;
      onSubject(next);
    }
    const progress = next === -1 ? 0 : Math.min((time - transitionStart) / TRANSITION, 1);
    renderSubject(current, rtA);
    if (next !== -1) renderSubject(next, rtB);
    u.uMix.value = next === -1 ? 0 : ease(progress);
    u.uTime.value = time;
    u.uIntro.value = reduced ? 1 : Math.min(time / INTRO, 1);
    composer.render(dt);
    if (next !== -1 && progress >= 1) {
      current = next;
      next = -1;
      shownAt = time;
    }
  }

  function loop() {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 1 / 20);
    time += dt;
    draw(dt);
  }

  function start() {
    if (running) return;
    if (reduced) {
      draw(0);
      return;
    }
    running = true;
    clock.start();
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    clock.stop();
  }

  function resize(width, height) {
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    const sw = Math.max(1, Math.round(width * dpr * SCENE_SCALE));
    const sh = Math.max(1, Math.round(height * dpr * SCENE_SCALE));
    rtA.setSize(sw, sh);
    rtB.setSize(sw, sh);
    const aspect = width / height;
    camera.aspect = aspect;
    camera.position.z = CAMERA_DISTANCE * Math.max(1, 1 / aspect);
    camera.updateProjectionMatrix();
    u.uResolution.value.set(width * dpr, height * dpr);
    u.uCell.value = (width < 640 ? 5 : 6.5) * dpr;
    if (!running) draw(0);
  }

  return {
    start,
    stop,
    resize,
    setReducedMotion(value) {
      reduced = value;
      if (value) {
        stop();
        if (next !== -1) current = next;
        next = -1;
        draw(0);
      }
    },
    dispose() {
      stop();
      subjects.forEach((s) => s.dispose());
      rtA.dispose();
      rtB.dispose();
      atlas.dispose();
      environment.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
