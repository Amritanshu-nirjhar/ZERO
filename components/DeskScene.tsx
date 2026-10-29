"use client";

import type { MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { emit, SFX } from "./audio";
import { isReady, READY_EVENT } from "./useReady";

// World units = desk photo pixels / 100, origin at the photo centre (1376×768 photo).
export const PHOTO_W = 13.76;
export const PHOTO_H = 7.68;
// Centre of the cutting mat in the photo, as a fraction of width/height.
export const MAT_CENTER = { x: 0.503, y: 0.557 };
const PAPER_W = 5.2;
const PAPER_H = 3.8;

// Scroll timeline of the hero (fractions of hero progress), shared with the HTML overlays.
export const T = {
  crumple: [0.12, 0.36],
  lift: [0.36, 0.46],
  throw: [0.46, 0.53], // ball hits the mat at T.throw[1]
  settle: [0.53, 0.62],
  flick: [0.77, 0.85],
} as const;
// Where the ball lands, relative to the mat centre (world units), and as a % of the photo for overlays.
const LAND = { x: 1.9, y: -0.7 };
export const LAND_PCT = {
  x: MAT_CENTER.x * 100 + (LAND.x / PHOTO_W) * 100,
  y: MAT_CENTER.y * 100 - (LAND.y / PHOTO_H) * 100,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const range = (p: number, a: number, b: number) =>
  smooth(clamp01((p - a) / (b - a)));

// Small seeded PRNG so the crease pattern is the same on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Off-white stock with pixel grain, faint fibres and slightly aged edges.
function paperTexture() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1500;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f6f3ec";
  g.fillRect(0, 0, c.width, c.height);
  // Grain: one small noise tile repeated (per-pixel noise over the full sheet froze the main thread).
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tg = tile.getContext("2d")!;
  const timg = tg.createImageData(128, 128);
  for (let i = 0; i < timg.data.length; i += 4) {
    const v = Math.random() * 255;
    timg.data[i] = timg.data[i + 1] = timg.data[i + 2] = v;
    timg.data[i + 3] = 14;
  }
  tg.putImageData(timg, 0, 0);
  g.fillStyle = g.createPattern(tile, "repeat")!;
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const a = Math.random() * Math.PI;
    g.strokeStyle = `rgba(120, 105, 80, ${Math.random() * 0.06})`;
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(
      x + Math.cos(a) * 6,
      y + Math.sin(a) * 6,
      x + Math.cos(a + 0.4) * 12,
      y + Math.sin(a + 0.4) * 12,
    );
    g.stroke();
  }
  const edge = g.createRadialGradient(
    c.width / 2,
    c.height / 2,
    c.height * 0.45,
    c.width / 2,
    c.height / 2,
    c.width * 0.62,
  );
  edge.addColorStop(0, "rgba(160, 140, 105, 0)");
  edge.addColorStop(1, "rgba(160, 140, 105, 0.14)");
  g.fillStyle = edge;
  g.fillRect(0, 0, c.width, c.height);
  // Printed résumé chrome around the (HTML) headline, so the print crumples with the sheet.
  const W = c.width;
  const H = c.height;
  const ink = "rgba(40, 44, 40, 0.78)";
  const faint = "rgba(40, 44, 40, 0.16)";
  g.fillStyle = ink;
  g.font = "600 46px Georgia, serif";
  g.fillText("Alex Morgan", 130, 150);
  g.font = "26px ui-monospace, Menlo, monospace";
  g.fillStyle = "rgba(40,44,40,0.55)";
  g.fillText(
    "alex.morgan@email.com  ·  (555) 014-2290  ·  B.Sc. Computer Science",
    130,
    200,
  );
  g.fillRect(130, 232, W - 260, 3);
  // Body copy as faint grey bars (left column + right column), kept out of the centre.
  const rand = mulberry32(21);
  g.fillStyle = faint;
  for (let k = 0; k < 7; k++) {
    g.fillRect(130, 300 + k * 38, 260 + rand() * 180, 14);
    g.fillRect(
      W - 130 - (260 + rand() * 180),
      300 + k * 38,
      260 + rand() * 180,
      14,
    );
  }
  for (let k = 0; k < 5; k++) {
    g.fillRect(130, H - 420 + k * 38, 300 + rand() * 300, 14);
    g.fillRect(W - 130 - 420, H - 420 + k * 38, 260 + rand() * 160, 14);
  }
  g.font = "24px ui-monospace, Menlo, monospace";
  g.fillStyle = "rgba(40,44,40,0.4)";
  g.fillText("resume_FINAL_v7(3).pdf", 130, H - 110);
  g.fillText("page 1 / 1", W - 130 - 150, H - 110);
  // A coffee ring stain in the corner.
  g.strokeStyle = "rgba(140, 95, 45, 0.22)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(W - 330, 300, 120, 0.3, Math.PI * 1.85);
  g.stroke();
  g.strokeStyle = "rgba(140, 95, 45, 0.1)";
  g.lineWidth = 26;
  g.beginPath();
  g.arc(W - 326, 304, 110, 0, Math.PI * 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Bump map of crumpled facets: Voronoi cells, each a flat plane tilted a random way. Where two cells
// meet, the slope changes abruptly, which the bump shader renders as a sharp crease.
function crinkleTexture() {
  const N = 512;
  const G = 10; // jittered grid: one cell seed per grid square, so each pixel only checks 3×3 seeds
  const S = N / G;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  const img = g.createImageData(N, N);
  const rand = mulberry32(11);
  const cells = Array.from({ length: G * G }, (_, k) => ({
    x: ((k % G) + 0.15 + rand() * 0.7) * S,
    y: (Math.floor(k / G) + 0.15 + rand() * 0.7) * S,
    base: 90 + rand() * 76,
    gx: (rand() - 0.5) * 2.2,
    gy: (rand() - 0.5) * 2.2,
  }));
  for (let y = 0; y < N; y++) {
    const gyc = Math.floor(y / S);
    for (let x = 0; x < N; x++) {
      const gxc = Math.floor(x / S);
      let best = Infinity;
      let cell = cells[0];
      let ox = 0;
      let oy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          // Wrap around so the texture tiles without seams.
          const cx = (gxc + dx + G) % G;
          const cy = (gyc + dy + G) % G;
          const cl = cells[cy * G + cx];
          const px = cl.x + (gxc + dx - cx) * S;
          const py = cl.y + (gyc + dy - cy) * S;
          const d = (x - px) ** 2 + (y - py) ** 2;
          if (d < best) {
            best = d;
            cell = cl;
            ox = px;
            oy = py;
          }
        }
      }
      const v =
        cell.base + (x - ox) * cell.gx * 0.35 + (y - oy) * cell.gy * 0.35;
      const k = (y * N + x) * 4;
      img.data[k] =
        img.data[k + 1] =
        img.data[k + 2] =
          Math.max(0, Math.min(255, v));
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.anisotropy = 8;
  return t;
}

// Light "cookie": soft leaf-shaped blobs so the plant's dappled shade also falls across the paper.
function leafCookie() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 512, 512);
  const rand = mulberry32(3);
  for (let i = 0; i < 26; i++) {
    // Concentrated toward the upper-left, where the plant sits in the photo.
    const x = 40 + rand() * 300;
    const y = 30 + rand() * 260;
    const r = 18 + rand() * 40;
    g.save();
    g.translate(x, y);
    g.rotate(rand() * Math.PI);
    g.scale(1, 0.45);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A 3D sheet of paper lying on the desk photo. As `progress` goes 0→1 it crumples into a ball and is tossed away.
export default function DeskScene({
  progress,
  still,
}: {
  progress: MotionValue<number>;
  still: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, PHOTO_W / PHOTO_H, 0.1, 100);
    camera.position.z = PHOTO_H / 2 / Math.tan(THREE.MathUtils.degToRad(15));

    // Light roughly matches the photo: warm sun from the upper left.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 1.35));
    const sun = new THREE.SpotLight(0xfff4e2, 2.4, 0, 0.6, 0.6, 0);
    sun.position.set(-5, 7, 12);
    sun.map = leafCookie();
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);

    // Invisible desk surface that only shows the paper's shadow on top of the photo.
    const catcher = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 30),
      new THREE.ShadowMaterial({ opacity: 0.28 }),
    );
    catcher.receiveShadow = true;
    scene.add(catcher);

    const paperGeo = new THREE.PlaneGeometry(PAPER_W, PAPER_H, 110, 80);
    const orig = Float32Array.from(paperGeo.attributes.position.array);
    const paper = new THREE.Mesh(
      paperGeo,
      new THREE.MeshStandardMaterial({
        map: paperTexture(),
        bumpScale: 0,
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
    );
    paper.castShadow = true;
    paper.receiveShadow = true;
    const home = new THREE.Vector3(
      (MAT_CENTER.x - 0.5) * PHOTO_W,
      (0.5 - MAT_CENTER.y) * PHOTO_H,
      0,
    );
    scene.add(paper);
    sun.target.position.copy(home);

    // Crumpling = straight creases + flat facets, not smooth waves. Every crease is a random line (on the
    // sheet) or plane (on the ball) whose distance field is folded with |d|, which yields sharp, planar
    // folds. All of it is precomputed per vertex; each frame only blends between states.
    const rand = mulberry32(7);
    const count = paperGeo.attributes.position.count;
    const maxR = Math.hypot(PAPER_W / 2, PAPER_H / 2);
    const R = 0.8;

    const lines = Array.from({ length: 22 }, () => {
      const a = rand() * Math.PI;
      return {
        px: (rand() - 0.5) * PAPER_W,
        py: (rand() - 0.5) * PAPER_H,
        nx: Math.cos(a),
        ny: Math.sin(a),
        amp: (rand() - 0.5) * 0.5,
        w: 0.4 + rand() * 0.9,
      };
    });
    const planes = Array.from({ length: 55 }, () => {
      const v = new THREE.Vector3(
        rand() - 0.5,
        rand() - 0.5,
        rand() - 0.5,
      ).normalize();
      return {
        n: v,
        c: (rand() - 0.5) * 1.2,
        amp: (rand() - 0.5) * 0.9,
        w: 0.16 + rand() * 0.32,
      };
    });

    const flatZ = new Float32Array(count); // crease height on the sheet
    const rest = new Float32Array(count); // resting shape: bow, curled corner, old fold
    const curlMask = new Float32Array(count); // how much of `rest` is the flutter-able corner
    const shrink = new Float32Array(count); // per-vertex uneven in-plane squeeze
    const ball = new Float32Array(count * 3); // final crumpled-ball position
    const dir = new THREE.Vector3();
    let meanZ = 0;
    for (let i = 0; i < count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1];
      let z = 0;
      for (const l of lines) {
        const d = Math.abs((ox - l.px) * l.nx + (oy - l.py) * l.ny);
        z += l.amp * Math.max(0, l.w - d);
      }
      flatZ[i] = z;
      const nx = ox / (PAPER_W / 2);
      const ny = oy / (PAPER_H / 2);
      const curl = Math.max(0, (nx - ny) / 2 - 0.72) / 0.28; // bottom-right corner lifts
      const lift = Math.max(0, (-nx + ny) / 2 - 0.85) / 0.15; // top-left barely lifts
      curlMask[i] = Math.min(1, curl * 1.2);
      rest[i] =
        0.035 * nx * nx + // gentle bow from the printer
        0.32 * curl ** 2.2 +
        0.08 * lift ** 2 +
        0.05 * Math.max(0, 1 - Math.abs(ox - 0.15) * 1.4); // ridge where it was once folded in half
      meanZ += z / count;
      shrink[i] =
        0.55 +
        0.2 * Math.sin(ox * 1.7 + oy * 2.3) * Math.cos(oy * 1.1 - ox * 0.6);

      // Map the sheet onto a sphere (centre → front pole, edges → back), then push facets in/out by crease planes.
      const theta = Math.atan2(oy, ox);
      const phi = (Math.hypot(ox, oy) / maxR) * Math.PI * 0.97;
      dir.set(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      );
      let f = 0;
      for (const pl of planes)
        f += pl.amp * Math.max(0, pl.w - Math.abs(dir.dot(pl.n) - pl.c));
      const rad = R * (1 + f);
      // Slightly squashed, lopsided ball rather than a perfect sphere.
      ball[i * 3] = dir.x * rad * 1.12;
      ball[i * 3 + 1] = dir.y * rad * 0.94;
      ball[i * 3 + 2] = dir.z * rad * 0.88 + R;
    }

    let lastT = -1;
    // `breeze` gently flutters the curled corner while the sheet lies flat.
    const crumple = (t: number, breeze = 0) => {
      if (Math.abs(t - lastT) < 1e-4 && breeze === 0) return;
      lastT = t;
      const pos = paperGeo.attributes.position;
      const fold = smooth(clamp01(t / 0.55)); // creases deepen, edges curl, sheet shrinks
      const wrap = smooth(clamp01((t - 0.3) / 0.7)); // then it balls up
      for (let i = 0; i < count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1];
        const r = Math.hypot(ox, oy) / maxR;
        const k = 1 - fold * (1 - shrink[i]) * (0.4 + 0.6 * r);
        const fx = ox * k;
        const fy = oy * k;
        const fz =
          (1 - fold) *
            (rest[i] * (1 + breeze * curlMask[i]) + (flatZ[i] - meanZ) * 0.05) +
          fold * ((flatZ[i] - meanZ) * 1.6 + r * r * 1.4) +
          0.02;
        pos.setXYZ(
          i,
          fx + (ball[i * 3] - fx) * wrap,
          fy + (ball[i * 3 + 1] - fy) * wrap,
          fz + (ball[i * 3 + 2] - fz) * wrap,
        );
      }
      pos.needsUpdate = true;
      paperGeo.computeVertexNormals();
    };

    const resize = () => renderer.setSize(el.clientWidth, el.clientHeight);
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const mat = paper.material as THREE.MeshStandardMaterial;
    let lastC = 0;
    let thrown = false;
    // The drop-in starts once the loader has lifted.
    let start = isReady() ? performance.now() : Infinity;
    const onReady = () => (start = performance.now());
    window.addEventListener(READY_EVENT, onReady);
    // The crease bump map is expensive and only matters once crumpling starts: build it after the
    // loader is gone, when the browser is idle.
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    const buildBump = () =>
      idle(() => {
        const m = paper.material as THREE.MeshStandardMaterial;
        m.bumpMap = crinkleTexture();
        m.needsUpdate = true;
      });
    if (isReady()) buildBump();
    else window.addEventListener(READY_EVENT, buildBump, { once: true });
    const lerp = THREE.MathUtils.lerp;
    const tick = () => {
      const p = still ? 1 : progress.get(); // reduced motion: paper already gone, headline shown
      const c = range(p, ...T.crumple);
      const lift = range(p, ...T.lift);
      const thr = clamp01((p - T.throw[0]) / (T.throw[1] - T.throw[0]));
      const fall = thr * thr; // accelerates into the table
      if (thr > 0 && !thrown) emit(SFX.whoosh);
      thrown = thr > 0;
      const settle = clamp01((p - T.settle[0]) / (T.settle[1] - T.settle[0]));
      const flick = range(p, ...T.flick);
      const time = Math.max(0, (performance.now() - start) / 1000);
      // On load the sheet drops onto the mat with a small bounce.
      const drop = still ? 1 : clamp01((time - 0.2) / 1.1);
      const dropEase = 1 - (1 - drop) ** 3;
      const bounce = Math.sin(drop * Math.PI * 2.2) * (1 - drop) * 0.12;
      // A breeze: the curled corner flutters and the leaf shadows sway (only while the sheet is flat).
      const breeze =
        still || c > 0
          ? 0
          : Math.sin(time * 1.9) * 0.18 + Math.sin(time * 3.3) * 0.08;
      crumple(c, breeze);
      // Crinkle sound while the sheet is actively being crushed.
      if (Math.abs(c - lastC) > 0.004) {
        emit(SFX.crinkle, Math.abs(c - lastC));
        lastC = c;
      }
      sun.position.set(
        -5 + Math.sin(time * 0.7) * 0.35,
        7 + Math.cos(time * 0.9) * 0.25,
        12,
      );
      // Creases sharpen as it crumples.
      mat.bumpScale = c * 2.2;

      // Picked up toward the camera with a little wobble…
      let x = home.x + lift * -0.6;
      let y = home.y + lift * 0.5;
      let z = lift * 4.2;
      let rx = lift * 0.5 + Math.sin(lift * Math.PI) * 0.3;
      let ry = lift * -0.4;
      let rz = c * 0.9 + lift * 0.6;
      // …slammed down onto the landing spot…
      x = lerp(x, home.x + LAND.x, fall);
      y = lerp(y, home.y + LAND.y, fall);
      z = lerp(z, 0, fall);
      rx += fall * 2.4;
      ry += fall * 1.8;
      // …then a short hop and settle, rolling a bit further.
      z +=
        Math.sin(settle * Math.PI) * 0.7 * (1 - settle) +
        Math.sin(settle * Math.PI * 3) * 0.12 * (1 - settle) ** 2;
      x += settle * 0.45;
      rz -= settle * 0.8;
      // Squash on impact.
      const impact = thr >= 1 ? Math.exp(-settle * 18) : 0;
      // Finally flicked off the mat.
      x += flick * 9;
      y += flick * 1.2;
      rz -= flick * 9;

      x -= (1 - dropEase) * 1.4;
      z += (1 - dropEase) * 3.5 + Math.max(0, bounce);
      rz += (1 - dropEase) * 0.35;
      rx += (1 - dropEase) * -0.25;

      paper.position.set(x, y, z);
      paper.rotation.set(rx, ry, rz);
      paper.scale.set(1 + impact * 0.18, 1 + impact * 0.18, 1 - impact * 0.35);
      paper.visible = flick < 1;
      renderer.render(scene, camera);
      if (!still) raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener(READY_EVENT, onReady);
      window.removeEventListener(READY_EVENT, buildBump);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [progress, still]);

  return <div ref={host} aria-hidden="true" className="absolute inset-0" />;
}
