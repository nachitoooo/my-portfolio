"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const PURPLE = "#c084fc";

/* ── Screen boot sequence ────────────────────────────────────── */

const SCRIPT = [
  "NACHO-OS v3.0",
  "> mount /portfolio",
  "fastapi ..... [ok]",
  "next.js ..... [ok]",
  "azure ....... [ok]",
  "ai-mods ..... [ok]",
  "",
  "hi, i'm nacho :)",
  "click me / [/]",
  "nacho@folio:~ %",
];
const LINE_COST = SCRIPT.map((l) => l.length + 6); // +6 ticks pause per line
const TOTAL_COST = LINE_COST.reduce((a, b) => a + b, 0);

type Screen = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  pos: number;
  acc: number;
};

function drawScreen(s: Screen) {
  s.pos += 2;
  if (s.pos > TOTAL_COST + 260) s.pos = 0; // hold prompt ~18s, then re-boot
  const { ctx, canvas } = s;
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#08020f";
  ctx.fillRect(0, 0, W, H);

  ctx.font = 'bold 17px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.shadowColor = PURPLE;
  ctx.shadowBlur = 3;

  let p = s.pos;
  let y = 14;
  for (let i = 0; i < SCRIPT.length; i++) {
    const line = SCRIPT[i];
    const done = p >= LINE_COST[i];
    const visible = done ? line : line.slice(0, Math.max(0, p));
    ctx.fillStyle = line.startsWith("hi") || line.startsWith("click") ? "#f3e8ff" : "#d8b4fe";
    ctx.fillText(visible, 12, y);
    if (!done || i === SCRIPT.length - 1) {
      if (Math.floor(s.pos / 8) % 2 === 0) {
        ctx.fillRect(14 + ctx.measureText(visible).width, y, 10, 16);
      }
      break;
    }
    p -= LINE_COST[i];
    y += 22;
  }
  ctx.shadowBlur = 0;

  // VHS glitch: shift a random horizontal slice
  if (Math.random() < 0.08) {
    const gy = Math.random() * H;
    const gh = 4 + Math.random() * 10;
    const dx = (Math.random() - 0.5) * 14;
    ctx.drawImage(canvas, 0, gy, W, gh, dx, gy, W, gh);
  }

  // phosphor noise
  ctx.fillStyle = "rgba(192,132,252,0.08)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  // scanlines
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let yy = 0; yy < H; yy += 4) ctx.fillRect(0, yy, W, 1);

  // vignette
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.9);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  s.tex.needsUpdate = true;
}

/* ── Monitor ─────────────────────────────────────────────────── */

function Monitor({ onActivate }: { onActivate?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const gl = useThree((s) => s.gl);

  const screen = useMemo<Screen>(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, ctx, tex, pos: 0, acc: 0 };
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useFrame((state, delta) => {
    screen.acc += delta;
    if (screen.acc > 1 / 14) {
      screen.acc = 0;
      drawScreen(screen);
    }
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, mouse.current.x * 0.45 + Math.sin(t * 0.4) * 0.06, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, mouse.current.y * 0.18 + Math.cos(t * 0.55) * 0.03, 0.06);
    g.position.y = 0.18 + Math.sin(t * 1.1) * 0.07;
    if (led.current) led.current.emissiveIntensity = 2 + Math.sin(t * 3) * 1.2;
  });

  return (
    <group
      ref={group}
      onClick={onActivate}
      onPointerOver={() => (gl.domElement.style.cursor = "pointer")}
      onPointerOut={() => (gl.domElement.style.cursor = "")}
    >
      {/* front bezel */}
      <mesh>
        <boxGeometry args={[3.7, 2.9, 0.55]} />
        <meshStandardMaterial color="#34344a" roughness={0.8} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.08, 0.279]}>
        <planeGeometry args={[3.0, 2.2]} />
        <meshBasicMaterial map={screen.tex} toneMapped={false} />
      </mesh>
      {/* rear bulge */}
      <mesh position={[0, 0, -0.9]}>
        <boxGeometry args={[3.0, 2.3, 1.4]} />
        <meshStandardMaterial color="#2a2a3d" roughness={0.9} />
      </mesh>
      {/* power LED */}
      <mesh position={[1.45, -1.18, 0.28]}>
        <boxGeometry args={[0.12, 0.12, 0.06]} />
        <meshStandardMaterial ref={led} color={PURPLE} emissive={PURPLE} emissiveIntensity={2} />
      </mesh>
      {/* vent slot */}
      <mesh position={[-1.2, -1.18, 0.28]}>
        <boxGeometry args={[0.9, 0.07, 0.06]} />
        <meshStandardMaterial color="#0d0d12" roughness={1} />
      </mesh>
      {/* stand neck */}
      <mesh position={[0, -1.6, -0.2]}>
        <boxGeometry args={[1.0, 0.3, 0.8]} />
        <meshStandardMaterial color="#2a2a3d" roughness={0.9} />
      </mesh>
      {/* stand base */}
      <mesh position={[0, -1.78, -0.1]}>
        <boxGeometry args={[2.2, 0.18, 1.4]} />
        <meshStandardMaterial color="#34344a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Floating sparks ─────────────────────────────────────────── */

function Sparks() {
  const geom = useRef<THREE.BufferGeometry>(null);
  const data = useMemo(() => {
    const n = 45;
    const pos = new Float32Array(n * 3);
    const spd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      pos[i * 3 + 2] = -1.5 + Math.random() * 2;
      spd[i] = 0.15 + Math.random() * 0.35;
    }
    return { n, pos, spd };
  }, []);

  useFrame((_, delta) => {
    const attr = geom.current?.attributes.position;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < data.n; i++) {
      arr[i * 3 + 1] += data.spd[i] * delta;
      if (arr[i * 3 + 1] > 2.4) arr[i * 3 + 1] = -2.4;
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geom}>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={PURPLE} size={0.06} transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

/* ── Export ──────────────────────────────────────────────────── */

export default function Crt3D({ onActivate }: { onActivate?: () => void }) {
  return (
    <div id="crt3d-wrap" aria-hidden>
      <Canvas
        dpr={0.8}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 5.4], fov: 36 }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 2, 4]} intensity={45} color={PURPLE} />
        <pointLight position={[-3, -1, 2]} intensity={14} color="#2c9080" />
        <Monitor onActivate={onActivate} />
        <Sparks />
      </Canvas>
    </div>
  );
}
