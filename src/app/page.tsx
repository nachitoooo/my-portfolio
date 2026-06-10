"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const CvModal = dynamic(() => import("./CvModal"), { ssr: false });

type Lang = "en" | "es";

/* ── Animated components ─────────────────────────────────────── */

function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    type Drop = { x: number; y: number; speed: number; len: number; opacity: number };
    const drops: Drop[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 4 + Math.random() * 6,
      len: 10 + Math.random() * 20,
      opacity: 0.2 + Math.random() * 0.5,
    }));
    let raf: number;
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#c084fc";
      drops.forEach((d) => {
        ctx.globalAlpha = d.opacity;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} id="rain-canvas" />;
}

function FpsCounter() {
  const [fps, setFps] = useState(0);
  const lastRef = useRef(0);
  const countRef = useRef(0);
  useEffect(() => {
    let raf: number;
    function loop(now: number) {
      countRef.current++;
      if (now - lastRef.current >= 1000) {
        setFps(countRef.current);
        countRef.current = 0;
        lastRef.current = now;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span id="fps">{fps}</span>;
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", open);
  }, [open]);
  return (
    <>
      <button id="mobile-menu-toggle" type="button" aria-controls="menutd" aria-expanded={open} onClick={() => setOpen(!open)}>
        MENU
      </button>
      <div id="mobile-menu-backdrop" onClick={() => setOpen(false)} style={{ display: open ? "block" : "none" }} />
    </>
  );
}

/* ── Loading screen ─────────────────────────────────────────── */

const LS = 5; // pixel scale — bigger for more detail

const CHAR_PAL: Record<string, string> = {
  K: "#1a1a1a",   // black fur + eye
  k: "#333333",   // paw shadow
  W: "#f5f5f5",   // white face
  w: "#d8d8d8",   // belly off-white
  N: "#ff8888",   // pink nose
};

// 10w × 10h — 4-frame walk cycle, profile (cat faces RIGHT, tail at LEFT)
// Tail tip sways L→R each frame; belly has black patches
const CAT_TAILS = [
  ["..K.......", ".KK....K.."],   // f0: tip center-right
  [".K........", "KKK....K.."],   // f1: tip left
  ["..K.......", ".KK....K.."],   // f2: tip center-right
  ["...K......", ".KKK...K.."],   // f3: tip far right
];
const CAT_BODY_ROWS = [
  "KKK...KWK.",   // tail base + head outline (W = white face)
  "KKKKKKwKNK",   // body top + face (K = black eye, N = pink nose)
  ".KwwKwwKKK",   // belly with black patch at col 4 + chin
  ".KwKwwwKK.",   // belly with black patch at col 3
  ".KKKKKKK..",   // body bottom
];
const CHAR_FRAMES = [
  [...CAT_TAILS[0], ...CAT_BODY_ROWS, ".K.K..K.K.", ".K.K..K.K.", ".k.k..k.k."],
  [...CAT_TAILS[1], ...CAT_BODY_ROWS, "..KK..KK..", "..KK..KK..", "..kk..kk.."],
  [...CAT_TAILS[2], ...CAT_BODY_ROWS, ".K.K..K.K.", ".K.K..K.K.", ".k.k..k.k."],
  [...CAT_TAILS[3], ...CAT_BODY_ROWS, "..KK..KK..", "..KK..KK..", "..kk..kk.."],
];


const CON_PAL: Record<string, string> = {
  C: "#9040e0", c: "#5c18a8",  // controller body / shadow
  D: "#18083a", d: "#3010a0",  // dark well / dpad arm
  B: "#c084fc", b: "#e0b0ff",  // face button / highlight
};

// 12w × 10h — PlayStation-style controller, 2-frame (buttons blink)
const CON_FRAMES = [
  [
    "..CCCCCCCC..",
    ".CcCCCCCCcC.",
    "CcDDDDDDDDcC",
    "CcD.dBd.BdcC",
    "CcDdddD.ddcC",
    "CcD.dBd.BdcC",
    "CcDDDDDDDDcC",
    ".CcCCCCCCcC.",
    "...CC....CC.",
    "...CC....CC.",
  ],
  [
    "..CCCCCCCC..",
    ".CcCCCCCCcC.",
    "CcDDDDDDDDcC",
    "CcD.dbd.bdcC",
    "CcDdddD.ddcC",
    "CcD.dbd.bdcC",
    "CcDDDDDDDDcC",
    ".CcCCCCCCcC.",
    "...CC....CC.",
    "...CC....CC.",
  ],
];

function drawPx(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  pal: Record<string, string>,
  x: number, y: number, sc: number
) {
  for (let ry = 0; ry < grid.length; ry++) {
    for (let rx = 0; rx < grid[ry].length; rx++) {
      const col = pal[grid[ry][rx]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + rx * sc), Math.round(y + ry * sc), sc, sc);
      }
    }
  }
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const _cv = canvasRef.current;
    if (!_cv) return;
    const _cx = _cv.getContext("2d");
    if (!_cx) return;
    const canvas: HTMLCanvasElement = _cv;
    const ctx: CanvasRenderingContext2D = _cx;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const charH = CHAR_FRAMES[0].length;
    const charW = CHAR_FRAMES[0][0].length;
    let charX = window.innerWidth / 2 - (charW * LS) / 2;
    const groundY = Math.round(window.innerHeight * 0.58);

    type Spark = { x: number; y: number; vy: number; size: number; alpha: number };
    const sparks: Spark[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * window.innerWidth,
      y: groundY - Math.random() * window.innerHeight * 0.5,
      vy: -0.4 - Math.random() * 1.2,
      size: 1.5 + Math.random() * 2.5,
      alpha: Math.random() * 0.6,
    }));

    let fi = 0, tick = 0, raf: number;
    const FPS = 10;
    let last = 0;

    function loop(now: number) {
      if (now - last > 1000 / FPS) {
        const w = canvas.width;
        ctx.clearRect(0, 0, w, canvas.height);

        // glowing ground line
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(0, groundY, w, 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(192,132,252,0.10)";
        ctx.fillRect(0, groundY + 2, w, 8);

        // sparkles rising from ground
        sparks.forEach(sp => {
          sp.y += sp.vy;
          sp.alpha -= 0.012;
          if (sp.alpha <= 0 || sp.y < 0) {
            sp.x = Math.random() * w;
            sp.y = groundY;
            sp.alpha = 0.3 + Math.random() * 0.5;
            sp.vy = -0.4 - Math.random() * 1.2;
          }
          ctx.globalAlpha = Math.max(0, sp.alpha);
          ctx.fillStyle = "#c084fc";
          ctx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
        });
        ctx.globalAlpha = 1;

        // console floating ahead with glow
        const conX = charX + (charW + 5) * LS + Math.sin(tick / 1.8) * LS * 3;
        const conY = groundY - 22 * LS + Math.sin(tick / 1.3) * LS * 4;
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 22;
        drawPx(ctx, CON_FRAMES[tick % 2], CON_PAL, conX, conY, LS);
        ctx.shadowBlur = 0;

        // character shadow on ground
        ctx.fillStyle = "rgba(80,0,140,0.25)";
        ctx.fillRect(charX + LS * 2, groundY + 2, charW * LS - LS * 4, 5);

        // character glow pass (blurred silhouette drawn first, THEN crisp pixels on top)
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 0.35;
        drawPx(ctx, CHAR_FRAMES[fi % 4], CHAR_PAL, charX, groundY - charH * LS, LS);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // character crisp — no glow so face stays visible
        drawPx(ctx, CHAR_FRAMES[fi % 4], CHAR_PAL, charX, groundY - charH * LS, LS);

        // BOOTING text
        const dots = ".".repeat((tick % 3) + 1) + " ".repeat(2 - (tick % 3));
        ctx.fillStyle = "#c084fc";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 16;
        ctx.font = `${LS * 3}px "Pixel NES", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`BOOTING${dots}`, w / 2, groundY + LS * 13);
        ctx.shadowBlur = 0;

        charX += LS * 2;
        if (charX > w + charW * LS) charX = -charW * LS;
        fi++; tick++;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const fadeAt = setTimeout(() => { setFading(true); setTimeout(onDone, 500); }, 1500);

    return () => { cancelAnimationFrame(raf); clearTimeout(fadeAt); window.removeEventListener("resize", resize); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backdropFilter: "blur(7px) brightness(0.45)",
      background: "rgba(8, 2, 20, 0.4)",
      opacity: fading ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: fading ? "none" : "all",
    }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/* ── Translations ────────────────────────────────────────────── */

const techMarquee = [
  "Python", "TypeScript", "JavaScript", "FastAPI", "Django REST",
  "React", "Next.js", "React Native", "PostgreSQL", "Supabase",
  "Azure", "Vercel", "Groq AI", "Tailwind CSS", "Git",
] as const;

function buildT(lang: Lang) {
  const isEs = lang === "es";
  return {
    heading: isEs ? "¡Hola, soy Ignacio Aristegui!" : "Hey, I'm Ignacio Aristegui!",
    intro2: isEs
      ? "Experiencia con infraestructura cloud (Azure), PostgreSQL e integraciones de IA. Historial comprobado entregando productos SaaS y sistemas de negocio en entornos startup."
      : "Experienced with cloud infrastructure (Azure), PostgreSQL, and AI integrations. Track record delivering SaaS products and business systems in startup environments.",
    factsLabel: isEs ? "Datos rápidos:" : "Quick facts:",
    facts: isEs
      ? [
          "Basado en Argentina · abierto a reubicación.",
          "Actualmente estudiando Informática en la Universidad Nacional de La Plata.",
          "Trabajando en Dowl — FastAPI + Next.js + Azure.",
          "Idiomas: Español (nativo) · Inglés (B2).",
        ]
      : [
          "Based in Argentina · open to relocation.",
          "Currently studying Computer Science at Universidad Nacional de La Plata.",
          "Working at Dowl — FastAPI + Next.js + Azure.",
          "Languages: Spanish (native) · English (B2).",
        ],
    navAbout: isEs ? "✩ Sobre mí" : "✩ About",
    navExperience: isEs ? "✩ Experiencia" : "✩ Experience",
    navProjects: isEs ? "✩ Proyectos" : "✩ Projects",
    navSkills: "✩ Skills",
    sectionExperience: isEs ? "Experiencia" : "Experience",
    sectionProjects: isEs ? "Proyectos" : "Projects",
    statusCurrently: isEs ? "Actualmente" : "Currently",
    statusLabel: isEs ? "Empleado!" : "Employed!",
    statusSub: isEs ? "Abierto a nuevas oportunidades" : "Open to new opportunities",
    contactHeader: isEs ? "Contactame:" : "Contact me:",
    currentWorkHeader: isEs ? "◇ Trabajo actual:" : "◇ Current work:",
    currentWorkPeriod: isEs ? "Octubre 2025 - Presente" : "October 2025 - Present",
    currentWorkDesc: isEs
      ? "Full-stack con FastAPI + Next.js, desplegando en Microsoft Azure."
      : "FastAPI + Next.js full-stack, deploying on Microsoft Azure.",
    educationHeader: isEs ? "◇ Educación:" : "◇ Education:",
    eduUnlp: isEs ? "Informática · 2025–Presente" : "Computer Science · 2025–Present",
    eduEst: isEs ? "Técnico Secundario · 2017–2023" : "Tech Secondary · 2017–2023",
    checkboxRain: isEs ? "Desactivar lluvia" : "Disable rain",
    checkboxSnow: isEs ? "Desactivar nieve" : "Disable snow",
    footerRole: isEs ? "Desarrollador de Software" : "Software Developer",
    techStackLabel: isEs ? "Stack tecnológico:" : "Tech stack:",
    eduLabel: isEs ? "Educación:" : "Education:",
    openToReloc: isEs ? "Abierto a reubicación" : "Open to relocation",
    experience: isEs
      ? [
          {
            company: "Dowl",
            role: "Software Developer",
            period: "Octubre 2025 – Presente",
            bullets: [
              "Desarrollo de aplicaciones full-stack con FastAPI (Python) y Next.js (TypeScript); despliegue en Microsoft Azure.",
              "Diseño de APIs RESTful con PostgreSQL para lógica de negocio compleja y modelado de datos.",
              "Desarrollo de aplicación móvil multiplataforma con React Native.",
            ],
          },
          {
            company: "Mechquote – Cotización Industrial con IA",
            role: "Software Developer",
            period: "Junio 2024 – Noviembre 2024",
            bullets: [
              "Automatización de flujos de presupuestación industrial mediante integración de IA, reduciendo el tiempo de procesamiento manual.",
              "Diseño de pipelines de procesamiento de datos escalables y APIs REST para generación de cotizaciones en tiempo real.",
            ],
          },
          {
            company: "StoreSys",
            role: "Desarrollador Front-End",
            period: "Febrero 2024 – Septiembre 2024",
            bullets: [
              "Construí una app web de facturación integrada con el sistema de facturación electrónica de Argentina (ARCA) usando React y TypeScript.",
            ],
          },
          {
            company: "Superintendencia de Servicios Públicos Domiciliarios",
            role: "Desarrollador Desktop",
            period: "Junio 2024",
            bullets: [
              "Desarrollé una aplicación de gestión y visualización de datos de escritorio usando Python, PyQt, Pandas y Matplotlib.",
            ],
          },
          {
            company: "Freelance",
            role: "Desarrollador Full-Stack",
            period: "Septiembre 2023 – Junio 2024",
            bullets: [
              "Entregué soluciones web personalizadas para 4+ clientes (medicina, fitness, e-commerce) con Next.js, React e integraciones de pago.",
            ],
          },
        ]
      : [
          {
            company: "Dowl",
            role: "Software Developer",
            period: "October 2025 – Present",
            bullets: [
              "Building full-stack applications with FastAPI (Python) and Next.js (TypeScript); deploying on Microsoft Azure.",
              "Designing RESTful APIs with PostgreSQL for complex business logic and data modeling.",
              "Developing a cross-platform mobile application using React Native.",
            ],
          },
          {
            company: "Mechquote – AI-Powered Industrial Quoting",
            role: "Software Developer",
            period: "June 2024 – November 2024",
            bullets: [
              "Automated industrial budgeting workflows through AI integration, reducing manual processing time.",
              "Designed scalable data processing pipelines and REST APIs for real-time quote generation.",
            ],
          },
          {
            company: "StoreSys",
            role: "Front-End Developer",
            period: "February 2024 – September 2024",
            bullets: [
              "Built a web invoicing app integrated with Argentina's electronic billing system (ARCA) using React and TypeScript.",
            ],
          },
          {
            company: "Superintendencia de Servicios Públicos Domiciliarios",
            role: "Desktop Developer",
            period: "June 2024",
            bullets: [
              "Built a desktop data management and visualization application using Python, PyQt, Pandas, and Matplotlib.",
            ],
          },
          {
            company: "Freelance",
            role: "Full-Stack Developer",
            period: "September 2023 – June 2024",
            bullets: [
              "Delivered custom web solutions for 4+ clients (medical, fitness, e-commerce) with Next.js, React, and payment integrations.",
            ],
          },
        ],
    projects: isEs
      ? [
          {
            name: "SaaS ERP para PYMEs – ARCA Integrado",
            stack: "Django REST · PostgreSQL · ARCA",
            bullets: [
              "Sistema de gestión comercial full-stack para PYMEs argentinas con facturación electrónica (ARCA).",
              "Módulos de ventas, inventario, gestión de clientes/proveedores, informes de IVA y seguimiento de entregas.",
            ],
          },
          {
            name: "PC Builder – Comparador de Hardware con IA",
            stack: "Next.js · TypeScript · Supabase · Python · Groq API",
            bullets: [
              "Scraping de tiendas de hardware, almacena datos en Supabase y usa Groq AI para recomendar configuraciones óptimas.",
              "Alertas de precio por email automatizadas, carrito de compras, guardado de configuraciones generadas por IA.",
            ],
          },
        ]
      : [
          {
            name: "SaaS ERP for SMEs – ARCA Integrated",
            stack: "Django REST · PostgreSQL · ARCA",
            bullets: [
              "Full-stack commercial management system for Argentine SMEs with electronic invoicing (ARCA).",
              "Modules for sales, inventory, client/supplier management, VAT reporting, and delivery tracking.",
            ],
          },
          {
            name: "PC Builder – AI Hardware Price Comparator",
            href: "https://pc-builder-interface.vercel.app",
            stack: "Next.js · TypeScript · Supabase · Python · Groq API",
            bullets: [
              "Scrapes hardware stores, stores data in Supabase, and uses Groq AI to recommend optimal PC builds.",
              "Automated email price alerts, shopping cart, AI-generated build saving.",
            ],
          },
        ],
    skillGroups: isEs
      ? [
          { label: "Lenguajes", items: "Python · TypeScript · JavaScript" },
          { label: "Backend", items: "FastAPI · Django REST · REST APIs · Web Scraping" },
          { label: "Frontend", items: "React · Next.js · React Native · Tailwind · Bootstrap" },
          { label: "Bases de datos", items: "PostgreSQL · Supabase · SQLite" },
          { label: "Cloud", items: "Microsoft Azure · Vercel · Git" },
          { label: "Integraciones", items: "Groq AI · ARCA · PayPal API · Mercado Pago API" },
        ]
      : [
          { label: "Languages", items: "Python · TypeScript · JavaScript" },
          { label: "Backend", items: "FastAPI · Django REST · REST APIs · Web Scraping" },
          { label: "Frontend", items: "React · Next.js · React Native · Tailwind · Bootstrap" },
          { label: "Databases", items: "PostgreSQL · Supabase · SQLite" },
          { label: "Cloud", items: "Microsoft Azure · Vercel · Git" },
          { label: "Integrations", items: "Groq AI · ARCA · PayPal API · Mercado Pago API" },
        ],
  };
}

/* ── Terminal easter egg ─────────────────────────────────────── */

type TermLine = { kind: "in" | "out" | "err"; text: string };

const CMD: Record<string, (args: string[]) => string[]> = {
  help: () => [
    "commands:",
    "  whoami      — about me",
    "  ls          — list projects",
    "  ls projects — list projects",
    "  contact     — reach me",
    "  cv          — download my CV",
    "  clear       — clear screen",
    "  exit        — close terminal",
  ],
  whoami: () => [
    "Ignacio Aristegui — Full-Stack Developer",
    "Based in Argentina · open to relocation",
    "Stack: FastAPI · Next.js · TypeScript · PostgreSQL · Azure",
    "Working at Dowl (Oct 2025 – Present)",
    "Studying CS @ Universidad Nacional de La Plata",
  ],
  ls: (args) => {
    if (args[0] && args[0] !== "projects")
      return [`ls: ${args[0]}: No such file or directory`];
    return [
      "projects/",
      "├── dowl/         [FastAPI · Next.js · Azure]      [private]",
      "├── sustant/      [Next.js · Supabase]              sustant.vercel.app",
      "├── atlantic/     [React · Django REST]             atlanticsoftware.vercel.app",
      "└── portfolio/    [Next.js · pixel art]             you are here :)",
    ];
  },
  contact: () => [
    "email:    ignacioaristegui025@gmail.com",
    "linkedin: linkedin.com/in/ignacio-aristegui-6635b4270",
    "github:   github.com/nachitoooo",
  ],
  cv: () => [
    "opening CV download...",
    "→ /cv/ignacio-aristegui-cv.pdf",
    "",
    'tip: click "View CV" in the sidebar to preview it here.',
  ],
};

function Terminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<TermLine[]>([
    { kind: "out", text: 'nacho@portfolio ~ % type "help" for commands' },
  ]);
  const [input, setInput] = useState("");
  const [cmdHist, setCmdHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function run(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

    if (cmd === "exit" || cmd === "q") { onClose(); return; }
    if (cmd === "clear") {
      setLines([]);
      setCmdHist(h => [trimmed, ...h]);
      setInput(""); setHistIdx(-1);
      return;
    }
    if (cmd === "cv") {
      const a = document.createElement("a");
      a.href = "/cv/ignacio-aristegui-cv.pdf";
      a.download = "ignacio-aristegui-cv.pdf";
      a.click();
    }

    const next: TermLine[] = [...lines, { kind: "in", text: trimmed }];
    const handler = CMD[cmd];
    if (handler) {
      handler(args).forEach(t => next.push({ kind: "out", text: t }));
    } else {
      next.push({ kind: "err", text: `command not found: ${cmd}  (try "help")` });
    }
    setLines(next);
    setCmdHist(h => [trimmed, ...h]);
    setInput(""); setHistIdx(-1);
  }

  const S = {
    overlay: {
      position: "fixed" as const, inset: 0, zIndex: 9999,
      background: "rgba(8,2,20,0.9)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    window: {
      width: "min(680px, 94vw)", maxHeight: "68vh", display: "flex",
      flexDirection: "column" as const,
      background: "#06010e",
      border: "2px solid #6b21a8",
      boxShadow: "0 0 48px #c084fc33, 0 0 0 1px #3b0764",
      fontFamily: '"Pixel NES", monospace', fontSize: "11px",
    },
    titleBar: {
      background: "#150430", borderBottom: "1px solid #6b21a8",
      padding: "6px 12px", display: "flex",
      justifyContent: "space-between", alignItems: "center",
    },
    body: { flex: 1, overflowY: "auto" as const, padding: "12px", lineHeight: 2.2 },
    inputRow: {
      borderTop: "1px solid #3b0764", padding: "8px 12px",
      display: "flex", alignItems: "center", gap: "8px",
    },
    inputEl: {
      flex: 1, background: "transparent", border: "none", outline: "none",
      color: "#e2c4ff", fontFamily: "inherit", fontSize: "11px",
      caretColor: "#c084fc",
    },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.window} onClick={e => e.stopPropagation()}>
        <div style={S.titleBar}>
          <span style={{ color: "#c084fc" }}>nacho@portfolio:~</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>[ × ]</button>
        </div>
        <div style={S.body}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.kind === "in" ? "#e2c4ff" : l.kind === "err" ? "#ff6b8a" : "#c084fc" }}>
              {l.kind === "in" && <span style={{ color: "#6b21a8", marginRight: "8px" }}>❯</span>}
              {l.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={S.inputRow}>
          <span style={{ color: "#6b21a8" }}>❯</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { run(input); }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const idx = Math.min(histIdx + 1, cmdHist.length - 1);
                setHistIdx(idx); setInput(cmdHist[idx] ?? "");
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const idx = Math.max(histIdx - 1, -1);
                setHistIdx(idx); setInput(idx === -1 ? "" : cmdHist[idx]);
              }
            }}
            style={S.inputEl}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("en");
  const [rainEnabled, setRainEnabled] = useState(true);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [termOpen, setTermOpen] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);
  const t = buildT(lang);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setTermOpen(v => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const navLinks = [
    { href: "#about", label: t.navAbout },
    { href: "#experience", label: t.navExperience },
    { href: "#projects", label: t.navProjects },
    { href: "#skills", label: t.navSkills },
    { href: "https://github.com/nachitoooo", label: "✩ GitHub", ext: true },
    { href: "https://www.linkedin.com/in/ignacio-aristegui-6635b4270/", label: "✩ LinkedIn", ext: true },
    { href: "mailto:ignacioaristegui025@gmail.com", label: "✩ E-mail" },
  ];

  const globeBtn = (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
      style={{
        background: "rgba(0,0,0,0.7)",
        border: "2px solid #383838",
        borderRadius: "4px",
        color: "#2c9080",
        fontFamily: '"Pixel NES", sans-serif',
        fontSize: "11px",
        padding: "3px 10px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px",
        transition: "border-color 0.3s",
      }}
    >
      <span style={{ fontSize: "14px" }}>🌍</span>
      <span>{lang === "en" ? "EN → ES" : "ES → EN"}</span>
    </button>
  );

  return (
    <>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      {termOpen && <Terminal onClose={() => setTermOpen(false)} />}
      {cvOpen && <CvModal onClose={() => setCvOpen(false)} lang={lang} />}
      <a className="skip-to" href="#about">Skip to content</a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/bg.png" id="bg" alt="" />
      <div id="snow" style={{ display: snowEnabled ? undefined : "none" }} />
      <FpsCounter />
      {rainEnabled && <RainCanvas />}
      <MobileMenu />

      <div id="container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/wires.png" id="wires" width={922} height={126} alt="" />

        {/* Logo + globe toggle */}
        <Link href="/" id="logo-link">
          <div id="logo" style={{ fontFamily: '"Pixel NES", sans-serif', fontSize: "45px", color: "#c084fc", letterSpacing: "4px", filter: "drop-shadow(0 0 0.75rem rgba(192,132,252,0.5))", paddingBottom: "4px" }}>
            NACHO
          </div>
        </Link>
        <div style={{ paddingLeft: "2px", marginBottom: "4px" }}>{globeBtn}</div>

        <div id="main-layout">

          {/* ── LEFT COLUMN ────────────────────────────────────── */}
          <div id="maintd" className="rain-hitbox">
            <div id="cursors" />

            {/* About */}
            <div className="box rain-hitbox" id="mainbox">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img style={{ verticalAlign: "sub", marginRight: "5px" }} src="/images/moon.png" className="moon-icon" alt="" />
              <h2 style={{ display: "inline" }} id="about">{t.heading}</h2>
              <br />
              <p>
                {lang === "en"
                  ? <>Software Developer with 3+ years of experience building full-stack web applications. Proficient in <span style={{ color: "#c084fc" }}>Python</span>, <span style={{ color: "#c084fc" }}>TypeScript</span>, <span style={{ color: "#c084fc" }}>FastAPI</span>, <span style={{ color: "#c084fc" }}>Django</span>, <span style={{ color: "#c084fc" }}>React</span>, and <span style={{ color: "#c084fc" }}>Next.js</span>.</>
                  : <>Desarrollador de Software con más de 3 años de experiencia construyendo aplicaciones web full-stack. Especializado en <span style={{ color: "#c084fc" }}>Python</span>, <span style={{ color: "#c084fc" }}>TypeScript</span>, <span style={{ color: "#c084fc" }}>FastAPI</span>, <span style={{ color: "#c084fc" }}>Django</span>, <span style={{ color: "#c084fc" }}>React</span> y <span style={{ color: "#c084fc" }}>Next.js</span>.</>
                }
              </p>
              <p>{t.intro2}</p>
              <span>{t.factsLabel}<br /></span>
              <ul style={{ marginBlockStart: "5px" }}>
                {t.facts.map((f, i) => <li key={i}>{f}</li>)}
                <li>
                  {lang === "en"
                    ? <>Reach me at <a href="mailto:ignacioaristegui025@gmail.com">ignacioaristegui025@gmail.com</a> or <a href="https://www.linkedin.com/in/ignacio-aristegui-6635b4270/" target="_blank" rel="noopener">LinkedIn</a>.</>
                    : <>Contactame en <a href="mailto:ignacioaristegui025@gmail.com">ignacioaristegui025@gmail.com</a> o <a href="https://www.linkedin.com/in/ignacio-aristegui-6635b4270/" target="_blank" rel="noopener">LinkedIn</a>.</>
                  }
                </li>
              </ul>
            </div>

            {/* Skills marquee */}
            <div style={{ marginTop: "10px" }}>
              {/* @ts-expect-error marquee deprecated */}
              <marquee onMouseOver={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {stop():void}).stop()} onMouseOut={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {start():void}).start()}>
                <span style={{ color: "white" }}>
                  ✩ STACK:{" "}
                  {techMarquee.map((tech, i) => (
                    <span key={tech}>
                      <span style={{ color: "#c084fc" }}>{tech}</span>
                      {i < techMarquee.length - 1 && <span style={{ color: "#383838" }}> · </span>}
                    </span>
                  ))}
                </span>
              {/* @ts-expect-error marquee deprecated */}
              </marquee>
            </div>

            {/* Experience */}
            <div className="box" style={{ marginTop: "10px" }} id="experience">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img style={{ verticalAlign: "sub", marginRight: "5px" }} src="/images/moon.png" className="moon-icon" alt="" />
              <h2 style={{ display: "inline" }}>{t.sectionExperience}</h2>
              <br /><br />
              {t.experience.map((job) => (
                <div key={job.company} style={{ marginBottom: "16px" }}>
                  <span className="blog-arrow">{">"}</span>
                  <b style={{ color: "#c084fc" }}> {job.company}</b>
                  <span style={{ color: "#2c9080" }}> — {job.role}</span>
                  <br />
                  <span style={{ color: "gray", fontSize: "13px" }}>{job.period}</span>
                  <ul style={{ marginBlockStart: "4px", marginBlockEnd: "0" }}>
                    {job.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="box rain-hitbox" style={{ marginTop: "10px" }} id="projects">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img style={{ verticalAlign: "sub", marginRight: "5px" }} src="/images/moon.png" className="moon-icon" alt="" />
              <h2 style={{ display: "inline" }}>{t.sectionProjects}</h2>
              <br /><br />
              {t.projects.map((p) => (
                <div key={p.name} style={{ marginBottom: "20px" }}>
                  <a target="_blank" rel="noopener" href={p.href}>
                    <h3>☾ {p.name}</h3>
                  </a>
                  <br />
                  <span style={{ color: "#c084fc", fontSize: "13px" }}>{p.stack}</span>
                  <ul style={{ marginBlockStart: "4px" }}>
                    {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}

            </div>

            {/* Skills / Terminal */}
            <div className="box terminal" style={{ marginTop: "10px" }} id="skills">
              <b id="hotel">skills</b>
              <span>
                {t.techStackLabel}<br /><br />
                <table>
                  <tbody>
                    {t.skillGroups.map((g) => (
                      <tr key={g.label}>
                        <td style={{ width: "120px", paddingBottom: "4px" }}>
                          <span style={{ color: "#c084fc" }}>[{g.label}]</span>
                        </td>
                        <td style={{ paddingBottom: "4px" }}>
                          <span style={{ color: "lightgray" }}>{g.items}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <br />
                {t.eduLabel}<br /><br />
                <span style={{ color: "#c084fc" }}>[UNLP]</span>{" "}
                <span style={{ color: "lightgray" }}>{t.eduUnlp}</span><br />
                <span style={{ color: "#c084fc" }}>[E.E.S.T. N°1]</span>{" "}
                <span style={{ color: "lightgray" }}>{t.eduEst}</span>
              </span>
            </div>

            {/* WebTiles kept for fun */}
            
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────── */}
          <div id="menutd" style={{ maxWidth: "225px" }}>

            {/* Nav */}
            <div className="box rain-hitbox" id="linksdiv">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img style={{ verticalAlign: "top", marginRight: "5px", position: "relative" }} src="/images/warpstar.png" id="kirby" alt="" />
              <h2 style={{ display: "inline" }}>Links</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/electricity_on.png" id="switch" alt="" />
              <br /><br />
              {navLinks.map((link) => (
                <span key={link.label}>
                  <a
                    className="navlink"
                    href={link.href}
                    target={"ext" in link && link.ext ? "_blank" : undefined}
                    rel={"ext" in link && link.ext ? "noopener" : undefined}
                  >
                    {link.label}
                  </a>
                  <br />
                </span>
              ))}
              <br />
              {globeBtn}
            </div>

            {/* Availability */}
            <div className="box centerbox" style={{ marginTop: "10px", padding: "14px 15px 16px" }}>
              <span style={{ fontSize: "12px", color: "gray", display: "block", marginBottom: "6px" }}>{t.statusCurrently}</span>
              <h2 id="status" style={{ color: "#c084fc", textShadow: "0 0 10px #c084fc55, 0 0 20px #c084fc33, 0 0 30px #c084fc22", marginBottom: "8px" }}>
                {t.statusLabel}
              </h2>
              <span style={{ fontSize: "12px", color: "gray", display: "block" }}>{t.statusSub}</span>
            </div>

            {/* Contact card */}
            <div className="box" style={{ marginTop: "10px", marginBottom: "10px" }}>
              <div className="blob" id="pulser" />
              <b>{t.contactHeader}</b><br /><br />
              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                
                <div style={{ marginTop: "6px" }}>
                  <a href="https://www.linkedin.com/in/ignacio-aristegui-6635b4270/" target="_blank" rel="noopener">↗ LinkedIn</a>
                </div>
                <div style={{ marginTop: "4px" }}>
                  <a href="https://github.com/nachitoooo" target="_blank" rel="noopener">↗ GitHub</a>
                </div>
                <div style={{ marginTop: "4px", color: "gray" }}>
                  📍 Argentina · {t.openToReloc}
                </div>
              </div>
            </div>

            {/* CV Box */}
            <div className="box" style={{ marginTop: "10px", textAlign: "center" }}>
              <div style={{ color: "#c084fc", fontFamily: '"Pixel NES", sans-serif', fontSize: "9px", marginBottom: "10px", letterSpacing: "1px", opacity: 0.8 }}>
                ★ CURRICULUM VITAE ★
              </div>
              <button
                onClick={() => setCvOpen(true)}
                style={{
                  display: "block",
                  width: "100%",
                  background: "rgba(192,132,252,0.08)",
                  border: "2px solid #c084fc",
                  borderRadius: "4px",
                  color: "#c084fc",
                  fontFamily: '"Pixel NES", sans-serif',
                  fontSize: "10px",
                  padding: "9px 8px",
                  cursor: "pointer",
                  marginBottom: "8px",
                  animation: "cvGlow 2.8s ease-in-out infinite",
                  letterSpacing: "0.5px",
                }}
              >
                📄 {lang === "en" ? "View CV" : "Ver CV"}
              </button>
              <a
                href="/cv/ignacio-aristegui-cv.pdf"
                download="ignacio-aristegui-cv.pdf"
                style={{ display: "block", fontSize: "12px", color: "gray", textShadow: "none" }}
              >
                ↓ {lang === "en" ? "Download PDF" : "Descargar PDF"}
              </a>
            </div>

            <a className="skip-to" href="#projects">Skip to projects</a>

            {/* Tech marquee */}
            {/* @ts-expect-error marquee deprecated */}
            <marquee scrollamount={3} loop="infinite" onMouseOver={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {stop():void}).stop()} onMouseOut={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {start():void}).start()} id="buttons-misc">
              {["Python", "TypeScript", "FastAPI", "Django", "React", "Next.js", "Azure", "PostgreSQL", "Supabase", "Groq AI", "React Native", "Tailwind"].map((tech, i) => (
                <span key={i} style={{ display: "inline-block", background: "#000000a8", border: "1px solid #383838", borderRadius: "3px", padding: "2px 6px", margin: "2px", fontSize: "11px", color: "#c084fc", textShadow: "none" }}>
                  {tech}
                </span>
              ))}
            {/* @ts-expect-error marquee deprecated */}
            </marquee>

            <i id="cool-sites">&lt;-- stack</i>

            {/* @ts-expect-error marquee deprecated */}
            <marquee scrollamount={2} loop="infinite" onMouseOver={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {stop():void}).stop()} onMouseOut={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement & {start():void}).start()} direction="right" id="buttons-sites">
              {["JavaScript", "REST APIs", "Git", "Vercel", "PyQt", "Pandas", "Matplotlib", "Bootstrap", "HTML5", "CSS3", "SQLite", "Mercado Pago API"].map((tech, i) => (
                <span key={i} style={{ display: "inline-block", background: "#000000a8", border: "1px solid #383838", borderRadius: "3px", padding: "2px 6px", margin: "2px", fontSize: "11px", color: "white", textShadow: "none" }}>
                  {tech}
                </span>
              ))}
            {/* @ts-expect-error marquee deprecated */}
            </marquee>

            {/* Current work */}
            <div id="pre-tweet" />
            <div className="box" style={{ marginTop: "10px" }}>
              <span style={{ fontWeight: "bold", color: "var(--link-color)" }}>{t.currentWorkHeader}</span>
              <br /><br />
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://dowl.ar/wp-content/uploads/2024/05/cropped-logo-blanco-dowl.webp" width={32} height={32} alt="" style={{ float: "left", marginRight: "10px", imageRendering: "auto", borderRadius: "50%", marginTop: "3px" }} />
                <span>
                  <b style={{ color: "var(--link-color)" }}>Dowl</b>
                  <span style={{ color: "gray", fontSize: "12px" }}> · {t.currentWorkPeriod}</span>
                </span>
                <p style={{ marginTop: "4px", marginBottom: 0, fontSize: "13px" }}>
                  {t.currentWorkDesc}
                </p>
              </div>
            </div>

            {/* Edu box */}
            <div className="box" style={{ marginTop: "10px" }}>
              <span style={{ fontWeight: "bold", color: "var(--link-color)" }}>{t.educationHeader}</span>
              <br /><br />
              <span style={{ fontSize: "13px", lineHeight: "1.8" }}>
                <b style={{ color: "#c084fc" }}>UNLP</b><br />
                <span style={{ color: "gray" }}>{t.eduUnlp}</span><br /><br />
                <b style={{ color: "#c084fc" }}>E.E.S.T. N°1</b><br />
                <span style={{ color: "gray" }}>{t.eduEst}</span>
              </span>
            </div>

            {/* Settings */}
            <div className="box" style={{ marginTop: "10px" }}>
              <label style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={!rainEnabled} onChange={(e) => setRainEnabled(!e.target.checked)} /> {t.checkboxRain}
              </label>
              <label style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={!snowEnabled} onChange={(e) => setSnowEnabled(!e.target.checked)} /> {t.checkboxSnow}
              </label>
              <button
                onClick={() => setTermOpen(true)}
                style={{ marginTop: "8px", background: "none", border: "none", padding: 0, color: "gray", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", opacity: 0.6 }}
              >
                [ / ] terminal
              </button>
            </div>

          </div>
        </div>

        <footer style={{ marginTop: "20px", paddingBottom: "20px" }}>
          <span style={{ color: "gray", fontSize: "13px" }}>
            Ignacio Aristegui · {t.footerRole} · Argentina<br />
            <a href="mailto:ignacioaristegui025@gmail.com" style={{ color: "var(--link-color)" }}>
              ignacioaristegui025@gmail.com
            </a>
            {" · "}
            <a href="https://github.com/nachitoooo" target="_blank" rel="noopener" style={{ color: "var(--link-color)" }}>
              github.com/nachitoooo
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}
