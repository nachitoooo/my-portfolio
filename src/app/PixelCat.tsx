"use client";
import { useEffect, useRef } from "react";
import { CHAR_FRAMES, CHAR_PAL, drawPx } from "./pixelArt";

const SC = 4;                 // pixel scale → 40px sprite on a 40×64 canvas
const SPRITE = 10 * SC;       // cat is 10×10 cells
const CANVAS_W = SPRITE;
const CANVAS_H = SPRITE + 24; // headroom for hearts / zzz
const CSS_W = CANVAS_W * 2;   // upscaled 2× for chunkier pixels

type CatState = "walk" | "idle" | "sleep" | "flee";
type Fx = { x: number; y: number; vy: number; life: number; kind: "heart" | "z" };

const HEART = [".K.K.", "KKKKK", ".KKK.", "..K.."];
const HEART_PAL = { K: "#ff7ddb" };

export default function PixelCat() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const st = {
      x: Math.random() * Math.max(50, window.innerWidth - CSS_W - 40) + 20,
      dir: (Math.random() < 0.5 ? -1 : 1) as 1 | -1,
      state: "walk" as CatState,
      timer: 200 + Math.random() * 300,
      frame: 0,
      tick: 0,
      mouse: { x: -9999, y: -9999 },
      fx: [] as Fx[],
    };

    const onMouse = (e: MouseEvent) => {
      st.mouse.x = e.clientX;
      st.mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouse);

    const onClick = () => {
      if (st.state === "sleep") {
        st.state = "walk";
        st.timer = 250 + Math.random() * 250;
      }
      for (let i = 0; i < 3; i++) {
        st.fx.push({
          x: 6 + Math.random() * (CANVAS_W - 18),
          y: 22 - Math.random() * 6,
          vy: -0.25 - Math.random() * 0.25,
          life: 70,
          kind: "heart",
        });
      }
    };
    canvas.addEventListener("click", onClick);

    let raf: number;
    function loop() {
      st.tick++;
      const vw = window.innerWidth;
      const catCx = st.x + CSS_W / 2;
      const catCy = window.innerHeight - (SPRITE * 2) / 2;
      const dx = st.mouse.x - catCx;
      const dist = Math.hypot(dx, st.mouse.y - catCy);

      // scaredy cat: run away from the cursor
      if (dist < 110 && st.state !== "flee") {
        st.state = "flee";
        st.dir = dx > 0 ? -1 : 1;
      }

      if (st.state === "flee") {
        st.x += st.dir * 4;
        if (dist > 220) {
          st.state = "walk";
          st.timer = 200 + Math.random() * 300;
        }
      } else if (st.state === "walk") {
        st.x += st.dir * 0.7;
        if (--st.timer <= 0) {
          if (Math.random() < 0.45) {
            st.state = "idle";
            st.timer = 150 + Math.random() * 250;
          } else {
            if (Math.random() < 0.4) st.dir = -st.dir as 1 | -1;
            st.timer = 250 + Math.random() * 400;
          }
        }
      } else if (st.state === "idle") {
        if (--st.timer <= 0) {
          if (Math.random() < 0.4) {
            st.state = "sleep";
            st.timer = 700 + Math.random() * 800;
          } else {
            st.state = "walk";
            st.timer = 250 + Math.random() * 400;
          }
        }
      } else if (st.state === "sleep") {
        if (st.tick % 55 === 0) {
          st.fx.push({ x: CANVAS_W - 14, y: 20, vy: -0.18, life: 110, kind: "z" });
        }
        if (--st.timer <= 0) {
          st.state = "walk";
          st.timer = 250 + Math.random() * 400;
        }
      }

      // keep inside the viewport
      if (st.x < 4) { st.x = 4; st.dir = 1; }
      if (st.x > vw - CSS_W - 4) { st.x = vw - CSS_W - 4; st.dir = -1; }

      // sprite frame: animate only while moving
      if (st.state === "walk" && st.tick % 9 === 0) st.frame++;
      if (st.state === "flee" && st.tick % 4 === 0) st.frame++;

      // ── draw ──
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      if (st.dir === -1) {
        ctx.translate(CANVAS_W, 0);
        ctx.scale(-1, 1);
      }
      // glow pass (blurred purple silhouette) so the black cat reads on the black bg
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 9;
      ctx.globalAlpha = st.state === "sleep" ? 0.3 : 0.5;
      drawPx(ctx, CHAR_FRAMES[st.frame % 4], CHAR_PAL, 0, CANVAS_H - SPRITE, SC);
      ctx.shadowBlur = 0;
      // crisp pass
      ctx.globalAlpha = st.state === "sleep" ? 0.85 : 1;
      drawPx(ctx, CHAR_FRAMES[st.frame % 4], CHAR_PAL, 0, CANVAS_H - SPRITE, SC);
      ctx.restore();
      ctx.globalAlpha = 1;

      // effects: hearts + zzz
      st.fx = st.fx.filter((f) => f.life > 0);
      for (const f of st.fx) {
        f.y += f.vy;
        f.life--;
        ctx.globalAlpha = Math.min(1, f.life / 45);
        if (f.kind === "heart") {
          drawPx(ctx, HEART, HEART_PAL, f.x, f.y, 2);
        } else {
          ctx.fillStyle = "#c084fc";
          ctx.font = 'bold 11px "Courier New", monospace';
          ctx.fillText("z", f.x, f.y);
        }
      }
      ctx.globalAlpha = 1;

      if (wrap) wrap.style.transform = `translateX(${Math.round(st.x)}px)`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        zIndex: 900,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: `${CSS_W}px`,
          height: `${CANVAS_H * 2}px`,
          imageRendering: "pixelated",
          pointerEvents: "auto",
          cursor: "grab",
          display: "block",
        }}
      />
    </div>
  );
}
