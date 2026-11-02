"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { LS, CON_PAL, CON_FRAMES, drawPx } from "./pixelArt";

const CvModal = dynamic(() => import("./CvModal"), { ssr: false });
const Crt3D = dynamic(() => import("./Crt3D"), { ssr: false });
const CowCat3D = dynamic(() => import("./CowCat3D"), { ssr: false });

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

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fading, setFading] = useState(false);
  const [catReady, setCatReady] = useState(false);
  const onCatReady = useCallback(() => setCatReady(true), []);

  useEffect(() => {
    // Give the actual 3D model time on screen, even on a cold chunk load.
    // The fallback still lets the page open if WebGL or the chunk is unavailable.
    let doneAt: ReturnType<typeof setTimeout>;
    const fadeAt = setTimeout(() => {
      setFading(true);
      doneAt = setTimeout(onDone, 500);
    }, catReady ? 1500 : 6000);
    return () => { clearTimeout(fadeAt); clearTimeout(doneAt); };
  }, [catReady, onDone]);

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

    const groundY = () => Math.round(canvas.height * 0.58);

    type Spark = { x: number; y: number; vy: number; size: number; alpha: number };
    const sparks: Spark[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * window.innerWidth,
      y: groundY() - Math.random() * window.innerHeight * 0.5,
      vy: -0.4 - Math.random() * 1.2,
      size: 1.5 + Math.random() * 2.5,
      alpha: Math.random() * 0.6,
    }));

    let tick = 0, raf: number;
    const FPS = 10;
    let last = 0;

    function loop(now: number) {
      if (now - last > 1000 / FPS) {
        const w = canvas.width;
        const ground = groundY();
        ctx.clearRect(0, 0, w, canvas.height);

        // glowing ground line
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(0, ground, w, 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(192,132,252,0.10)";
        ctx.fillRect(0, ground + 2, w, 8);

        // sparkles rising from ground
        sparks.forEach(sp => {
          sp.y += sp.vy;
          sp.alpha -= 0.012;
          if (sp.alpha <= 0 || sp.y < 0) {
            sp.x = Math.random() * w;
            sp.y = ground;
            sp.alpha = 0.3 + Math.random() * 0.5;
            sp.vy = -0.4 - Math.random() * 1.2;
          }
          ctx.globalAlpha = Math.max(0, sp.alpha);
          ctx.fillStyle = "#c084fc";
          ctx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
        });
        ctx.globalAlpha = 1;

        // console floating ahead with glow
        const conX = Math.min(w / 2 + 90, w - CON_FRAMES[0][0].length * LS - 12) + Math.sin(tick / 1.8) * 6;
        const conY = ground - 22 * LS + Math.sin(tick / 1.3) * LS * 4;
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 22;
        drawPx(ctx, CON_FRAMES[tick % 2], CON_PAL, conX, conY, LS);
        ctx.shadowBlur = 0;

        // Ground shadow under the shared Three.js cat.
        ctx.fillStyle = "rgba(80,0,140,0.25)";
        ctx.fillRect(w / 2 - 55, ground + 2, 110, 5);

        // BOOTING text
        const dots = ".".repeat((tick % 3) + 1) + " ".repeat(2 - (tick % 3));
        ctx.fillStyle = "#c084fc";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 16;
        ctx.font = `${LS * 3}px "Pixel NES", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`BOOTING${dots}`, w / 2, ground + LS * 13);
        ctx.shadowBlur = 0;

        tick++;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div role="status" aria-label="Booting" style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backdropFilter: "blur(7px) brightness(0.45)",
      background: "rgba(8, 2, 20, 0.4)",
      opacity: fading ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: fading ? "none" : "all",
    }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div className="boot-cat-stage">
        <CowCat3D mode="boot" onReady={onCatReady} />
      </div>
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
    checkbox3d: isEs ? "Desactivar 3D" : "Disable 3D",
    checkboxCat: isEs ? "Desactivar gato" : "Disable cat",
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
            name: "HonyCars – CRM con IA para Concesionarias",
            href: "https://honycars.com",
            stack: "FastAPI · Next.js · PostgreSQL · Redis · Docker · Groq AI",
            bullets: [
              "SaaS multi-tenant en producción que diseñé y desarrollé de punta a punta, para que las concesionarias no pierdan consultas: aislamiento entre empresas con Row Level Security de PostgreSQL.",
              "Centraliza los leads de WhatsApp (Cloud API de Meta), Mercado Libre, Instagram, la web y planillas; un asistente con IA contesta por WhatsApp al instante.",
              "Reparto en tiempo real entre vendedores según el horario de cada sucursal, seguimiento con SLA, push en la PWA, presupuestos, stock, ventas y reportes por rol. Workers en segundo plano con ARQ + Redis.",
            ],
          },
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
            name: "HonyCars – AI-Powered CRM for Car Dealerships",
            href: "https://honycars.com",
            stack: "FastAPI · Next.js · PostgreSQL · Redis · Docker · Groq AI",
            bullets: [
              "Multi-tenant SaaS in production that I designed and built end to end, so dealerships stop losing leads; tenant isolation enforced with PostgreSQL Row Level Security.",
              "Unifies leads from WhatsApp (Meta Cloud API), Mercado Libre, Instagram, web forms and spreadsheets; an AI assistant replies on WhatsApp instantly.",
              "Real-time lead assignment across salespeople based on each branch's business hours, SLA tracking, PWA push notifications, quotes, inventory, sales and role-based reports. Background jobs with ARQ + Redis.",
            ],
          },
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
    "  whoami       — about me",
    "  neofetch     — system info",
    "  ls           — list projects",
    "  contact      — reach me",
    "  cv           — download my CV",
    "  snake        — play snake",
    "  matrix       — follow the purple rabbit",
    "  sudo hire-me — acquire a developer",
    "  clear        — clear screen",
    "  exit         — close terminal",
  ],
  neofetch: () => [
    "   /\\_/\\      nacho@portfolio",
    "  ( o.o )     ----------------",
    "   > ^ <      os:      NACHO-OS v3.0 (pixel edition)",
    "              host:    vercel edge runtime",
    "              shell:   next.js 16 + react 19",
    "              uptime:  3+ years coding",
    "              lang:    python · typescript",
    "              stack:   fastapi · next.js · postgres · azure",
    "              theme:   crt-purple phosphor [#c084fc]",
    "              status:  employed @ dowl · open to offers",
  ],
  sudo: (args) =>
    args.join(" ") === "hire-me"
      ? [
          "[sudo] password for recruiter: ********",
          "access granted.",
          "initiating hiring protocol...",
          "  → cv:    /cv/ignacio-aristegui-cv.pdf",
          "  → email: ignacioaristegui025@gmail.com",
          "done. nacho is now on your team. handle with care :)",
        ]
      : ["user is not in the sudoers file. this incident will be reported."],
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
      "├── honycars/     [FastAPI · Next.js · Postgres]    honycars.com",
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

function SnakeGame({ onExit }: { onExit: (score: number) => void }) {
  const GW = 26;
  const GH = 14;
  const [, force] = useState(0);
  const state = useRef({
    snake: [[8, 7], [7, 7], [6, 7]] as [number, number][],
    dir: [1, 0] as [number, number],
    nextDir: [1, 0] as [number, number],
    food: [17, 7] as [number, number],
    score: 0,
  });

  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      const st = state.current;
      if (e.key === "Escape") {
        e.stopPropagation();
        onExit(st.score);
        return;
      }
      const dirs: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      };
      const nd = dirs[e.key];
      if (nd) {
        e.preventDefault();
        if (nd[0] !== -st.dir[0] || nd[1] !== -st.dir[1]) st.nextDir = nd;
      }
    };
    window.addEventListener("keydown", keys, true);

    const iv = setInterval(() => {
      const st = state.current;
      st.dir = st.nextDir;
      const head: [number, number] = [st.snake[0][0] + st.dir[0], st.snake[0][1] + st.dir[1]];
      const hitWall = head[0] < 0 || head[0] >= GW || head[1] < 0 || head[1] >= GH;
      const hitSelf = st.snake.some((c) => c[0] === head[0] && c[1] === head[1]);
      if (hitWall || hitSelf) {
        clearInterval(iv);
        onExit(st.score);
        return;
      }
      st.snake.unshift(head);
      if (head[0] === st.food[0] && head[1] === st.food[1]) {
        st.score += 10;
        do {
          st.food = [Math.floor(Math.random() * GW), Math.floor(Math.random() * GH)];
        } while (st.snake.some((c) => c[0] === st.food[0] && c[1] === st.food[1]));
      } else {
        st.snake.pop();
      }
      force((n) => n + 1);
    }, 110);

    return () => {
      window.removeEventListener("keydown", keys, true);
      clearInterval(iv);
    };
  }, [onExit]);

  const st = state.current;
  const rows: string[] = [];
  for (let y = 0; y < GH; y++) {
    let row = "";
    for (let x = 0; x < GW; x++) {
      if (st.snake[0][0] === x && st.snake[0][1] === y) row += "▓";
      else if (st.snake.some((c) => c[0] === x && c[1] === y)) row += "█";
      else if (st.food[0] === x && st.food[1] === y) row += "♦";
      else row += " ";
    }
    rows.push(row);
  }

  return (
    <div style={{ padding: "12px" }}>
      <div style={{ color: "#c084fc", marginBottom: "8px" }}>
        SNAKE · score: {st.score} · arrows/wasd · ESC quits
      </div>
      <pre style={{ margin: 0, lineHeight: 1.15, color: "#c084fc", fontSize: "14px", fontFamily: '"Perfect DOS VGA 437 Win", monospace', textShadow: "0 0 8px #c084fc66" }}>
        {"┌" + "─".repeat(GW) + "┐\n" + rows.map((r) => "│" + r + "│").join("\n") + "\n└" + "─".repeat(GW) + "┘"}
      </pre>
    </div>
  );
}

function MatrixRain({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const FS = 14;
    const cols = Math.max(1, Math.floor(canvas.width / FS));
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const glyphs = "アィカサタナハマヤラワ0123456789ABCDEF<>/{};=+-*";

    const iv = setInterval(() => {
      ctx.fillStyle = "rgba(6,1,14,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FS}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        const y = drops[i] * FS;
        ctx.fillStyle = Math.random() < 0.12 ? "#f3e8ff" : "#c084fc";
        ctx.fillText(ch, i * FS, y);
        drops[i]++;
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      }
    }, 50);

    const key = (e: KeyboardEvent) => {
      e.stopPropagation();
      onExit();
    };
    window.addEventListener("keydown", key, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener("keydown", key, true);
    };
  }, [onExit]);

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} onClick={onExit} style={{ width: "100%", height: "300px", display: "block" }} />
      <span style={{ position: "absolute", bottom: "6px", right: "10px", color: "#6b21a8", fontSize: "10px" }}>
        press any key to exit
      </span>
    </div>
  );
}

function Terminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<TermLine[]>([
    { kind: "out", text: 'nacho@portfolio ~ % type "help" for commands' },
  ]);
  const [input, setInput] = useState("");
  const [cmdHist, setCmdHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [mode, setMode] = useState<"shell" | "snake" | "matrix">("shell");
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (mode === "shell") inputRef.current?.focus(); }, [mode]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && modeRef.current === "shell") onClose(); };
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
    if (cmd === "snake" || cmd === "matrix") {
      setLines((prev) => [
        ...prev,
        { kind: "in", text: trimmed },
        { kind: "out", text: cmd === "snake" ? "launching snake... (arrows/wasd · ESC quits)" : "entering the matrix... (any key exits)" },
      ]);
      setCmdHist(h => [trimmed, ...h]);
      setInput(""); setHistIdx(-1);
      setMode(cmd);
      return;
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
        {mode === "snake" ? (
          <SnakeGame
            onExit={(score) => {
              setMode("shell");
              setLines((p) => [...p, { kind: "out", text: `snake: game over — score ${score}` }]);
            }}
          />
        ) : mode === "matrix" ? (
          <MatrixRain
            onExit={() => {
              setMode("shell");
              setLines((p) => [...p, { kind: "out", text: "you took the purple pill. welcome back." }]);
            }}
          />
        ) : (
          <>
            <div style={S.body}>
              {lines.map((l, i) => (
                <div key={i} style={{ whiteSpace: "pre", color: l.kind === "in" ? "#e2c4ff" : l.kind === "err" ? "#ff6b8a" : "#c084fc" }}>
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
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => setLoading(false), []);
  const [lang, setLang] = useState<Lang>("en");
  const [rainEnabled, setRainEnabled] = useState(true);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [threeEnabled, setThreeEnabled] = useState(true);
  const [catEnabled, setCatEnabled] = useState(true);
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
      {loading && <LoadingScreen onDone={finishLoading} />}
      {termOpen && <Terminal onClose={() => setTermOpen(false)} />}
      {cvOpen && <CvModal onClose={() => setCvOpen(false)} lang={lang} />}
      <a className="skip-to" href="#about">Skip to content</a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/bg.png" id="bg" alt="" />
      <div id="snow" style={{ display: snowEnabled ? undefined : "none" }} />
      <FpsCounter />
      {rainEnabled && <RainCanvas />}
      {!loading && catEnabled && <CowCat3D lang={lang} />}
      <MobileMenu />

      <div id="container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/wires.png" id="wires" width={922} height={126} alt="" />

        {/* Logo + globe toggle + 3D CRT */}
        <div id="hero">
          <div id="hero-left">
            <Link href="/" id="logo-link">
              <div id="logo" style={{ fontFamily: '"Pixel NES", sans-serif', fontSize: "45px", color: "#c084fc", letterSpacing: "4px", filter: "drop-shadow(0 0 0.75rem rgba(192,132,252,0.5))", paddingBottom: "4px" }}>
                NACHO
              </div>
            </Link>
            <div style={{ paddingLeft: "2px", marginBottom: "4px" }}>{globeBtn}</div>
          </div>
          {threeEnabled && <Crt3D onActivate={() => setTermOpen(true)} />}
        </div>

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
                  {p.href && (
                    <>
                      <br />
                      <a target="_blank" rel="noopener" href={p.href} style={{ fontSize: "13px" }}>
                        ↗ {p.href.replace(/^https?:\/\//, "")}
                      </a>
                    </>
                  )}
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
                <img src="https://instagram.faep8-2.fna.fbcdn.net/v/t51.2885-19/449409004_2478856872323960_216651685709042175_n.jpg?_nc_cat=104&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy40NDQuQzMifQ%3D%3D&_nc_ohc=TCvkdhNC-qIQ7kNvwHjx5rF&_nc_oc=AdrN6Mke5YGteTrnZkQBrYIO6qjOu_u7qygNAJiDptnQJUv2qlKFlRgQwET--77zCuU&_nc_zt=24&_nc_ht=instagram.faep8-2.fna&_nc_ss=7b6a8&oh=00_AQJgscKlOm0cYYwqak1F_oX1Ia-gzunBb59rgV3bOvNK3w&oe=6AB0B179" width={32} height={32} alt="" style={{ float: "left", marginRight: "10px", imageRendering: "auto", borderRadius: "50%", marginTop: "3px" }} />
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
              <label style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={!threeEnabled} onChange={(e) => setThreeEnabled(!e.target.checked)} /> {t.checkbox3d}
              </label>
              <label style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={!catEnabled} onChange={(e) => setCatEnabled(!e.target.checked)} /> {t.checkboxCat}
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
