"use client";
import React, { useEffect, useRef, useState } from "react";

const SHOOTING_COUNT = 12;
const STATIC_STAR_COUNT = 220;
const CLOUD_COUNT = 7;

interface ShootingStar {
  x: number; y: number;
  length: number; speed: number;
  angle: number; opacity: number;
  width: number; progress: number;
}

interface StaticStar {
  x: number; y: number;
  r: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

interface Cloud {
  x: number; y: number;
  scaleX: number; scaleY: number;
  speed: number; opacity: number;
  kind: "large" | "wispy" | "mid";
}

function rb(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makeShooting(): ShootingStar {
  return {
    x: rb(-10, 110),
    y: rb(-5, 50),
    length: rb(120, 300),
    speed: rb(0.08, 0.25), 
    angle: rb(30, 50),
    opacity: rb(0.4, 0.9),
    width: rb(0.8, 2.2),
    progress: rb(0, 1),
  };
}

function makeStaticStar(): StaticStar {
  const palette = [
    "255,255,255",
    "200,215,255",
    "255,230,200",
    "210,200,255",
    "180,220,255",
  ];
  return {
    x: rb(0, 100),
    y: rb(0, 85),
    r: rb(0.4, 1.8),
    baseOpacity: rb(0.5, 1.0),
    twinkleSpeed: rb(0.4, 1.4),
    phase: rb(0, Math.PI * 2),
    color: palette[Math.floor(Math.random() * palette.length)],
  };
}

function makeCloud(offscreen = false, w = 1920, h = 900): Cloud {
  const kinds: Cloud["kind"][] = ["large", "wispy", "mid"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  return {
    x: offscreen ? -(rb(300, 600)) : rb(-300, w + 200),
    y: kind === "wispy"
      ? rb(h * 0.05, h * 0.30)
      : rb(h * 0.55, h * 0.92),
    scaleX: rb(0.8, 2.2),
    scaleY: rb(0.55, 1.1),
    speed: rb(0.04, 0.18), 
    opacity: kind === "wispy" ? rb(0.25, 0.55) : rb(0.82, 1.0),
    kind,
  };
}

function drawLargeCloud(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sx: number, sy: number,
  alpha: number
) {

  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.filter = "blur(18px)";
  ctx.fillStyle = "rgba(140,185,230,1)";
  const bubbles = [
    { dx: 0, dy: 12, rx: 90, ry: 40 },
    { dx: 110, dy: 0, rx: 110, ry: 55 },
    { dx: 240, dy: 8, rx: 95, ry: 48 },
    { dx: 340, dy: 18, rx: 80, ry: 38 },
    { dx: -60, dy: 18, rx: 70, ry: 32 },
  ];
  bubbles.forEach(({ dx, dy, rx, ry }) => {
    ctx.beginPath();
    ctx.ellipse(x + dx * sx, y + dy * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.filter = "none";
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(
    x + 140 * sx, y - 10 * sy, 0,
    x + 140 * sx, y + 30 * sy, 180 * Math.max(sx, sy)
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.6, "rgba(240,248,255,0.95)");
  grad.addColorStop(1, "rgba(200,230,255,0.7)");
  ctx.fillStyle = grad;
  ctx.shadowColor = "rgba(180,215,255,0.5)";
  ctx.shadowBlur = 20;

  const mainBubbles = [
    { dx: 0,   dy: 0,   rx: 70,  ry: 42 },
    { dx: 80,  dy: -30, rx: 90,  ry: 58 },
    { dx: 175, dy: -20, rx: 80,  ry: 50 },
    { dx: 255, dy: -10, rx: 70,  ry: 44 },
    { dx: 320, dy: 5,   rx: 58,  ry: 36 },
    { dx: -50, dy: 5,   rx: 55,  ry: 34 },
    { dx: 120, dy: 10,  rx: 65,  ry: 35 },
    { dx: 200, dy: 12,  rx: 60,  ry: 32 },
  ];
  mainBubbles.forEach(({ dx, dy, rx, ry }) => {
    ctx.beginPath();
    ctx.ellipse(x + dx * sx, y + dy * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawWispyCloud(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sx: number, sy: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.filter = "blur(3px)";

  const wisps = [
    { dx: 0,   dy: 0,  rx: 120, ry: 10 },
    { dx: 100, dy: -6, rx: 80,  ry: 7  },
    { dx: 200, dy: 2,  rx: 100, ry: 9  },
    { dx: -40, dy: 3,  rx: 60,  ry: 6  },
    { dx: 280, dy: -3, rx: 70,  ry: 8  },
  ];
  wisps.forEach(({ dx, dy, rx, ry }) => {
    ctx.beginPath();
    ctx.ellipse(x + dx * sx, y + dy * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.filter = "none";
  ctx.restore();
}

function drawMidCloud(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sx: number, sy: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(
    x + 60 * sx, y - 5 * sy, 0,
    x + 60 * sx, y + 20 * sy, 100 * Math.max(sx, sy)
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(215,235,255,0.75)");
  ctx.fillStyle = grad;
  ctx.shadowColor = "rgba(180,215,255,0.4)";
  ctx.shadowBlur = 12;

  const bs = [
    { dx: 0,   dy: 0,   rx: 48, ry: 28 },
    { dx: 55,  dy: -18, rx: 58, ry: 36 },
    { dx: 115, dy: -8,  rx: 50, ry: 30 },
    { dx: 160, dy: 4,   rx: 42, ry: 25 },
    { dx: -30, dy: 4,   rx: 38, ry: 22 },
  ];
  bs.forEach(({ dx, dy, rx, ry }) => {
    ctx.beginPath();
    ctx.ellipse(x + dx * sx, y + dy * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export type Theme = "day" | "night";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "night";
  return (localStorage.getItem("theme") as Theme) ?? "night";
}

interface DayNightBackgroundProps {
  onThemeChange?: (theme: Theme) => void;
}

const DayNightBackground: React.FC<DayNightBackgroundProps> = ({ onThemeChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shootingRef = useRef<ShootingStar[]>([]);
  const staticRef   = useRef<StaticStar[]>([]);
  const cloudsRef   = useRef<Cloud[]>([]);
  const animRef     = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const targetRef   = useRef<number>(0);
  const timeRef     = useRef<number>(0);

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const init = getInitialTheme();
    progressRef.current = init === "day" ? 1 : 0;
    targetRef.current   = init === "day" ? 1 : 0;
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "night" ? "day" : "night";
    setTheme(next);
    targetRef.current = next === "day" ? 1 : 0;
    localStorage.setItem("theme", next);
    onThemeChange?.(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    shootingRef.current = Array.from({ length: SHOOTING_COUNT }, makeShooting);
    staticRef.current   = Array.from({ length: STATIC_STAR_COUNT }, makeStaticStar);
    cloudsRef.current   = Array.from({ length: CLOUD_COUNT }, () =>
      makeCloud(false, window.innerWidth, window.innerHeight)
    );

    const draw = (ts: number) => {
      const dt = Math.min(ts - timeRef.current, 50);
      timeRef.current = ts;
      const w = canvas.width;
      const h = canvas.height;

      const p0 = progressRef.current;
      const tg = targetRef.current;
      if (Math.abs(p0 - tg) > 0.0005) {
        progressRef.current += (tg - p0) * 0.018;
      } else {
        progressRef.current = tg;
      }
      const p = progressRef.current; 

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      // nightime 
      const nTop = [18, 10, 45];
      const nBot = [70, 30, 90];
      // daytime
      const dTop = [30, 170, 230];
      const dBot = [135, 215, 255];

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, `rgb(${lerp(nTop[0],dTop[0],p)|0},${lerp(nTop[1],dTop[1],p)|0},${lerp(nTop[2],dTop[2],p)|0})`);
      bg.addColorStop(1, `rgb(${lerp(nBot[0],dBot[0],p)|0},${lerp(nBot[1],dBot[1],p)|0},${lerp(nBot[2],dBot[2],p)|0})`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const starFade = 1 - p;
      if (starFade > 0.01) {
        const t_s = ts * 0.001;
        staticRef.current.forEach((s) => {
          const twinkle = 0.5 + 0.5 * Math.sin(t_s * s.twinkleSpeed + s.phase);
          const op = s.baseOpacity * twinkle * starFade;
          if (op < 0.01) return;

          const glow = ctx.createRadialGradient(
            (s.x / 100) * w, (s.y / 100) * h, 0,
            (s.x / 100) * w, (s.y / 100) * h, s.r * 4
          );
          glow.addColorStop(0, `rgba(${s.color},${op})`);
          glow.addColorStop(1, `rgba(${s.color},0)`);
          ctx.beginPath();
          ctx.arc((s.x / 100) * w, (s.y / 100) * h, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc((s.x / 100) * w, (s.y / 100) * h, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color},${Math.min(op * 1.5, 1)})`;
          ctx.fill();
        });
      }

      // shooting stars effect
      if (starFade > 0.01) {
        shootingRef.current.forEach((star, i) => {
          star.progress += star.speed * (dt / 2000);
          if (star.progress >= 1) {
            shootingRef.current[i] = { ...makeShooting(), progress: 0 };
            return;
          }
          const rad    = (star.angle * Math.PI) / 180;
          const travel = star.progress * (w * 1.8);
          const sx2    = (star.x / 100) * w + Math.cos(rad) * travel;
          const sy2    = (star.y / 100) * h + Math.sin(rad) * travel;
          const tailX  = sx2 - Math.cos(rad) * star.length;
          const tailY  = sy2 - Math.sin(rad) * star.length;

          const fade =
            star.progress < 0.08 ? star.progress / 0.08
            : star.progress > 0.75 ? (1 - star.progress) / 0.25
            : 1;

          const g = ctx.createLinearGradient(tailX, tailY, sx2, sy2);
          g.addColorStop(0, `rgba(255,255,255,0)`);
          g.addColorStop(0.5, `rgba(210,190,255,${star.opacity * fade * starFade * 0.35})`);
          g.addColorStop(1, `rgba(255,255,255,${star.opacity * fade * starFade})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(sx2, sy2);
          ctx.strokeStyle = g;
          ctx.lineWidth = star.width;
          ctx.lineCap = "round";
          ctx.stroke();

          // bright stars
          ctx.beginPath();
          ctx.arc(sx2, sy2, star.width * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${star.opacity * fade * starFade * 0.95})`;
          ctx.fill();
        });
      }

      if (p > 0.01) {
        cloudsRef.current.forEach((cloud, i) => {
          cloud.x += cloud.speed * (dt / 16);
          if (cloud.x > w + 600) {
            cloudsRef.current[i] = makeCloud(true, w, h);
          }
          const alpha = cloud.opacity * p;
          if (cloud.kind === "large") {
            drawLargeCloud(ctx, cloud.x, cloud.y, cloud.scaleX, cloud.scaleY, alpha);
          } else if (cloud.kind === "wispy") {
            drawWispyCloud(ctx, cloud.x, cloud.y, cloud.scaleX, cloud.scaleY, alpha);
          } else {
            drawMidCloud(ctx, cloud.x, cloud.y, cloud.scaleX, cloud.scaleY, alpha);
          }
        });
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame((ts) => {
      timeRef.current = ts;
      draw(ts);
    });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const isDay = theme === "day";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ display: "block" }}
      />
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-700 ${
          isDay
            ? "bg-sky-600 hover:bg-sky-700 shadow-sky-500"
            : "bg-indigo-950 hover:bg-indigo-900 shadow-purple-800"
        }`}
        title={isDay ? "Switch to night" : "Switch to day"}
      >
        {isDay ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0012 21a9 9 0 009-8.21z" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </>
  );
};

export default DayNightBackground;