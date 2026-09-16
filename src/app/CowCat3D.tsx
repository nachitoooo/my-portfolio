"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];
type Coat = "white" | "black" | "body" | "head";
type Mood = "walk" | "idle" | "sleep" | "pet" | "flee";

const WHITE = new THREE.Color("#f5f1e9");
const BLACK = new THREE.Color("#17171d");

// The same coat function colors the skin and each hair root, so the spots
// continue through the long fur instead of floating above it as decals.
function coatColor(coat: Coat, x: number, y: number, z: number) {
  const edge = Math.sin(x * 19 + y * 11) * 0.055 + Math.cos(z * 17 - y * 13) * 0.04;
  const dark = coat === "black" || (coat === "body" && (
    // The reference has a mostly black back and flanks, with a white belly.
    y > -0.3 + edge && x < 0.63 + edge || z < -0.25 && y > -0.5
  )) || (coat === "head" && (
    // Black mask around both eyes; the central white blaze widens upward.
    Math.abs(x + 0.025) > 0.2 + Math.max(y, 0) * 0.23 + edge * 0.4 && y > -0.23 + edge ||
    z < 0.1 && y > 0 ||
    // Tall, tapered black marking on the bridge of the nose.
    y > -0.39 && y < 0.43 + edge && Math.abs(x - 0.015) < 0.065 + (0.43 - y) * 0.27 + edge * 0.25 && z > 0.72
  ));
  return dark ? BLACK : WHITE;
}

function makeCat() {
  const root = new THREE.Group();
  const coatMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const furMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  let seed = 71;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function smooth(parent: THREE.Group, position: Vec3, scale: Vec3, color: string) {
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
      materials.set(color, material);
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function fluffy(parent: THREE.Group, position: Vec3, radii: Vec3, coat: Coat, count: number, length: number) {
    const group = new THREE.Group();
    group.position.set(...position);
    parent.add(group);
    const skin = new THREE.SphereGeometry(1, 48, 32);
    const colors: number[] = [];
    const vertices = skin.getAttribute("position");
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const color = coatColor(coat, x, y, z);
      colors.push(color.r, color.g, color.b);
      vertices.setXYZ(i, x * radii[0], y * radii[1], z * radii[2]);
    }
    skin.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    skin.computeVertexNormals();
    group.add(new THREE.Mesh(skin, coatMaterial));

    // Thousands of tapered, slightly bent locks, batched into one mesh per
    // body part. No individual hair objects, textures, or external models.
    const positions: number[] = [], normals: number[] = [], shades: number[] = [];
    const normal = new THREE.Vector3(), tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0), across = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < count; i++) {
      const y = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const ring = Math.sqrt(1 - y * y);
      const x = Math.cos(angle) * ring, z = Math.sin(angle) * ring;
      normal.set(x / radii[0], y / radii[1], z / radii[2]).normalize();
      tangent.crossVectors(normal, Math.abs(normal.y) > 0.95 ? across : up).normalize();
      const base = new THREE.Vector3(x * radii[0], y * radii[1], z * radii[2]);
      const hairLength = length * (0.55 + random() * 0.8);
      const width = 0.009 + random() * 0.008;
      const tip = base.clone().addScaledVector(normal, hairLength);
      tip.y -= hairLength * 0.28;
      tip.x += (random() - 0.5) * hairLength * 0.4;
      const color = coatColor(coat, x, y, z).clone().multiplyScalar(0.82 + random() * 0.25);
      for (const vertex of [base.clone().addScaledVector(tangent, -width), base.clone().addScaledVector(tangent, width), tip]) {
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        shades.push(color.r, color.g, color.b);
      }
    }
    const fur = new THREE.BufferGeometry();
    fur.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    fur.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    fur.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    group.add(new THREE.Mesh(fur, furMaterial));
    return group;
  }

  function line(parent: THREE.Group, points: Vec3[], color: string, radius = 0.009) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const geometry = new THREE.TubeGeometry(curve, 12, radius, 5, false);
    const material = new THREE.MeshBasicMaterial({ color });
    parent.add(new THREE.Mesh(geometry, material));
  }

  const body = fluffy(root, [-0.22, 0.93, 0], [0.86, 0.58, 0.46], "body", 6200, 0.16);
  fluffy(root, [0.39, 0.99, 0.16], [0.49, 0.6, 0.51], "white", 3000, 0.22);
  const paws = [-0.68, 0.45].flatMap((x) => [-0.27, 0.3].map((z) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.58, z);
    root.add(leg);
    fluffy(leg, [0, -0.22, 0], [0.2, 0.33, 0.2], "white", 600, 0.09);
    smooth(leg, [0.055, -0.41, 0.055], [0.24, 0.14, 0.23], "#f5f1e9");
    return leg;
  }));

  const tail = new THREE.Group();
  tail.position.set(-0.94, 1.02, -0.12);
  root.add(tail);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    fluffy(tail, [-0.37 * Math.sin(t * 2.1), t * 1.13, -0.08 * t],
      [0.21 - t * 0.055, 0.24, 0.2 - t * 0.04], "black", 480, 0.15);
  }

  const head = new THREE.Group();
  head.position.set(0.56, 1.53, 0.18);
  root.add(head);
  fluffy(head, [0, 0, 0], [0.55, 0.48, 0.43], "head", 4200, 0.12);
  fluffy(head, [-0.37, -0.2, 0.1], [0.22, 0.21, 0.26], "white", 750, 0.18);
  fluffy(head, [0.37, -0.2, 0.1], [0.22, 0.21, 0.26], "white", 750, 0.18);
  // Distinct black chin tuft, separated from the nose by the white muzzle.
  fluffy(head, [0.035, -0.405, 0.39], [0.23, 0.165, 0.13], "black", 700, 0.07);

  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.32, 0.35, 0);
    ear.rotation.z = -side * 0.2;
    head.add(ear);
    const shape = new THREE.Shape();
    shape.moveTo(-0.2, 0);
    shape.quadraticCurveTo(-0.15, 0.3, 0, 0.49);
    shape.quadraticCurveTo(0.17, 0.29, 0.2, 0);
    shape.closePath();
    const outer = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3, steps: 1,
    }), new THREE.MeshStandardMaterial({ color: "#17171d", roughness: 1 }));
    ear.add(outer);
    const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: "#51484e", side: THREE.DoubleSide }));
    inner.scale.set(0.62, 0.67, 1);
    inner.position.set(0, 0.055, 0.17);
    ear.add(inner);
    fluffy(ear, [0, 0.04, 0.1], [0.19, 0.09, 0.08], "black", 240, 0.08);
    for (let i = 0; i < 5; i++) {
      const y = 0.09 + i * 0.047;
      line(ear, [[-0.1, y, 0.18], [-0.015, y + 0.035, 0.2], [0.075, y + 0.07, 0.18]], "#88858a", 0.003);
    }
    for (let i = 0; i < 3; i++) {
      line(ear, [[0, 0.41, 0.03], [(i - 1) * 0.035, 0.55 + i * 0.025, 0.03]], "#77747e", 0.006);
    }
  }

  const eyes: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.245, 0.055, 0.385);
    head.add(eye);
    smooth(eye, [0, 0, 0], [0.143, 0.139, 0.066], "#24232a");
    smooth(eye, [0, 0, 0.035], [0.113, 0.113, 0.054], "#b9b77c");
    smooth(eye, [0.006, 0, 0.08], [0.077, 0.091, 0.025], "#101820");
    smooth(eye, [-0.031, 0.041, 0.097], [0.028, 0.028, 0.012], "#ffffff");
    eyes.push(eye);
    fluffy(head, [side * 0.145, -0.21, 0.41], [0.19, 0.14, 0.115], "white", 420, 0.045);
    for (let i = 0; i < 5; i++) {
      line(head, [[side * 0.15, -0.18, 0.53], [side * 0.4, -0.23 + i * 0.035, 0.55],
        [side * (0.82 - i * 0.035), -0.37 + i * 0.105, 0.46]], "#ede8e3", 0.004);
    }
  }
  fluffy(head, [0.01, -0.075, 0.435], [0.095, 0.135, 0.045], "black", 280, 0.022);
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.09, 0.035);
  noseShape.quadraticCurveTo(0, 0.065, 0.09, 0.035);
  noseShape.quadraticCurveTo(0.07, -0.005, 0, -0.075);
  noseShape.quadraticCurveTo(-0.07, -0.005, -0.09, 0.035);
  const nose = new THREE.Mesh(new THREE.ExtrudeGeometry(noseShape, {
    depth: 0.025, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2, steps: 1,
  }), new THREE.MeshStandardMaterial({ color: "#100f14", roughness: 0.55 }));
  nose.position.set(0, -0.16, 0.53);
  head.add(nose);
  line(head, [[0, -0.21, 0.51], [0, -0.265, 0.49], [-0.065, -0.28, 0.475]], "#3c3239");
  line(head, [[0, -0.265, 0.49], [0.065, -0.28, 0.475]], "#3c3239");

  return { root, body, paws, tail, head, eyes };
}

export default function CowCat3D({ lang = "es", mode = "companion", onReady }: {
  lang?: "es" | "en";
  mode?: "companion" | "boot";
  onReady?: () => void;
}) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current, effect = effectRef.current;
    if (!wrap || !canvas || !effect) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      wrap.hidden = true;
      onReady?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2, 2, 1.85, -1.5, 0.1, 30);
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 1.25, 0);
    scene.add(new THREE.HemisphereLight("#fff6ed", "#6f648a", 2.3));
    const key = new THREE.DirectionalLight("#fff3de", 2.5);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#c4a2f5", 2);
    rim.position.set(3, 2, -3);
    scene.add(rim);
    const cat = makeCat();
    scene.add(cat.root);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state = { x: 24, direction: 1, mood: "idle" as Mood, remaining: 2.5, time: 0, pet: 0, width: 180, viewport: window.innerWidth };
    let reduced = motion.matches, frame = 0, last = 0;
    function resize() {
      state.width = wrap!.clientWidth;
      state.viewport = window.innerWidth;
      state.x = Math.max(0, Math.min(state.x, state.viewport - state.width));
      renderer.setSize(state.width, wrap!.clientHeight, false);
      if (mode === "companion") wrap!.style.transform = `translate3d(${state.x}px, 0, 0)`;
      renderer.render(scene, camera);
    }
    function pet() {
      state.mood = "pet";
      state.remaining = 3;
      state.pet = 2;
      effect!.textContent = "♥";
      effect!.className = "cow-cat-effect is-loved";
      renderer.render(scene, camera);
    }
    function flee(event: PointerEvent) {
      if (mode === "boot" || reduced || event.pointerType !== "mouse" || state.mood === "pet" || wrap === document.activeElement) return;
      const center = state.x + state.width / 2;
      // Allow a direct hover/click; only a fast approach startles the cat.
      if (event.clientY > window.innerHeight - 110 && Math.abs(event.clientX - center) < 100 && Math.hypot(event.movementX, event.movementY) > 15) {
        state.mood = "flee";
        state.direction = event.clientX > center ? -1 : 1;
        state.remaining = 0.8;
      }
    }
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      if (now - last < 1000 / 30) return;
      const dt = Math.min((now - (last || now)) / 1000, 0.06);
      last = now;
      state.time += dt;
      state.pet = Math.max(0, state.pet - dt);
      if (reduced) {
        if (state.pet === 0) effect!.textContent = "";
        return;
      }
      const focused = wrap === document.activeElement;
      state.remaining -= dt;
      if (mode === "boot") {
        state.mood = "walk";
      } else if (state.remaining <= 0) {
        state.mood = state.mood === "walk" ? (Math.random() < 0.4 ? "sleep" : "idle") : "walk";
        state.remaining = state.mood === "sleep" ? 12 : 4 + Math.random() * 5;
      }
      const walking = !focused && (state.mood === "walk" || state.mood === "flee");
      const sleeping = state.mood === "sleep" && !focused;
      if (walking && mode === "companion") state.x += state.direction * dt * (state.mood === "flee" ? 150 : 26);
      const right = Math.max(0, state.viewport - state.width);
      if (state.x >= right) { state.x = right; state.direction = -1; }
      if (state.x <= 0) { state.x = 0; state.direction = 1; }
      if (mode === "companion") wrap!.style.transform = `translate3d(${state.x.toFixed(1)}px, 0, 0)`;
      const t = state.time;
      const stride = t * (state.mood === "flee" ? 17 : 7);
      cat.root.scale.x = THREE.MathUtils.damp(cat.root.scale.x, state.direction, 9, dt);
      cat.root.scale.y = THREE.MathUtils.damp(cat.root.scale.y, sleeping ? 0.72 : 1, 5, dt);
      cat.root.position.y = walking ? Math.abs(Math.sin(stride)) * 0.035 : Math.sin(t * 2) * 0.013;
      cat.body.scale.y = 1 + Math.sin(t * 2) * 0.016;
      cat.head.rotation.z = THREE.MathUtils.damp(cat.head.rotation.z, state.mood === "pet" ? -0.14 : sleeping ? -0.18 : Math.sin(t * 1.5) * 0.035, 6, dt);
      cat.tail.rotation.z = Math.sin(t * 2.2) * 0.13;
      cat.tail.rotation.x = Math.sin(t * 1.7) * 0.18;
      cat.paws.forEach((paw, index) => {
        paw.rotation.z = walking ? Math.sin(stride + (index === 0 || index === 3 ? 0 : Math.PI)) * 0.3 : 0;
      });
      const blink = sleeping ? 0.07 : state.mood === "pet" ? 0.5 : t % 4.8 > 4.62 ? 0.08 : 1;
      cat.eyes.forEach((eye) => { eye.scale.y = THREE.MathUtils.damp(eye.scale.y, blink, 28, dt); });
      if (state.pet === 0) {
        effect!.textContent = sleeping ? "z z z" : "";
        effect!.className = "cow-cat-effect";
      }
      renderer.render(scene, camera);
    }
    function restart() {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(animate);
    }
    function preference() {
      reduced = motion.matches;
      cat.root.scale.set(state.direction, 1, 1);
      cat.eyes.forEach((eye) => { eye.scale.y = 1; });
      renderer.render(scene, camera);
    }
    resize();
    onReady?.();
    restart();
    wrap.addEventListener("click", pet);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", flee, { passive: true });
    document.addEventListener("visibilitychange", restart);
    motion.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame);
      wrap.removeEventListener("click", pet);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", flee);
      document.removeEventListener("visibilitychange", restart);
      motion.removeEventListener("change", preference);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, [mode, onReady]);

  return (
    <button ref={wrapRef} className={`cow-cat${mode === "boot" ? " cow-cat--boot" : ""}`} type="button"
      tabIndex={mode === "boot" ? -1 : undefined} aria-hidden={mode === "boot" ? true : undefined}
      aria-label={lang === "es" ? "Acariciar al gato vaquita" : "Pet the fluffy cow cat"}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span ref={effectRef} className="cow-cat-effect" aria-hidden="true" />
    </button>
  );
}
