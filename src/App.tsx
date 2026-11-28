import React, { useEffect, useState, useRef } from 'react';
import SubmissionForm from './components/ui/SubmissionForm';
import ReviewDashboard from './components/ReviewDashboard';
import CreatorPassModal, { useCreatorPassTrigger } from './components/CreatorPassModal';
import GuidelinesPage from './GuidelinesPage';
import { supabase } from './lib/supabase';

// ===========================================================================
// 1. FLOATING 3D PARTICLES ENGINE
// ===========================================================================

interface Particle {
  angle: number;
  radius: number;
  y: number;
  size: number;
  angularSpeed: number;
  opacity: number;
  screenX: number;
  screenY: number;
  projectedScale: number;
}

export interface Floating3DParticlesProps extends Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, "width" | "height"> {
  quantity?: number;
  color?: string;
  size?: number;
  opacity?: number;
  drift?: number;
  depth?: number;
}

const MOBILE_BREAKPOINT = 768;
const SPREAD_FACTOR = 1.2;
const MAX_DPR = 2;

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(139,92,246,${alpha})`;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

function deriveProjection(depth: number) {
  const t = Math.max(0, Math.min(1, depth));
  const fov = 800 - t * 600;
  const perspectiveDistance = 100 + t * 700;
  const depthRange = t * Math.min(400, fov + perspectiveDistance - 1);
  return { fov, perspectiveDistance, depthRange };
}

function spawnParticle(width: number, height: number, size: number, opacity: number): Particle {
  const sizeVariance = size * 0.4;
  const opacityVariance = 0.2;
  return {
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * Math.max(width, height) * SPREAD_FACTOR,
    y: (Math.random() - 0.5) * height * 2,
    size: Math.max(0.5, size - sizeVariance + Math.random() * sizeVariance * 2),
    angularSpeed: 0.0015 + Math.random() * 0.001,
    opacity: Math.min(1, Math.max(0, opacity - opacityVariance + Math.random() * opacityVariance * 2)),
    screenX: 0,
    screenY: 0,
    projectedScale: 1,
  };
}

function Floating3DParticles({
  quantity = 400,
  color = "#8B5CF6",
  size = 5,
  opacity = 0.3,
  drift = 0.8,
  depth = 0.5,
  className,
  style,
  ...canvasProps
}: Floating3DParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const stateRef = useRef({ mounted: false, paused: false, reducedMotion: false, rafId: null as number | null });
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const s = stateRef.current;
    s.mounted = true;
    s.paused = false;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let staticDirty = true;

    const { fov, perspectiveDistance, depthRange } = deriveProjection(depth);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => { s.reducedMotion = mq.matches; };
    syncReducedMotion();

    const draw = (p: Particle) => {
      const r = Math.max(0, p.size * p.projectedScale);
      if (r <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(colorRef.current, p.opacity);
      ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const staticFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      for (const p of particles) {
        const denom = Math.max(1, fov + perspectiveDistance);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
        draw(p);
      }
    };

    const tick = () => {
      if (!s.mounted) return;
      if (s.paused) { s.rafId = requestAnimationFrame(tick); return; }
      if (s.reducedMotion) {
        if (staticDirty) { staticDirty = false; staticFrame(); }
        s.rafId = requestAnimationFrame(tick);
        return;
      }
      staticDirty = true;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      for (const p of particles) {
        p.angle += p.angularSpeed;
        p.y -= drift;
        if (p.y < -height) {
          p.y = height;
          p.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR;
        } else if (p.y > height) {
          p.y = -height;
          p.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR;
        }
        const denom = Math.max(1, fov + perspectiveDistance + Math.sin(p.angle) * depthRange);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
      }

      particles.sort((a, b) => a.projectedScale - b.projectedScale);
      for (const p of particles) draw(p);
      s.rafId = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const count = isMobile ? Math.round(quantity * 0.2) : quantity;
      particles = Array.from({ length: Math.max(0, count) }, () => spawnParticle(width, height, size, opacity));
      staticDirty = true;
    };

    const onVisibilityChange = () => { s.paused = document.hidden; };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    if (typeof IntersectionObserver !== "undefined") {
      ioRef.current = new IntersectionObserver(([entry]) => { if (entry) s.paused = document.hidden || !entry.isIntersecting; }, { threshold: 0 });
      ioRef.current.observe(canvas);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    mq.addEventListener("change", syncReducedMotion);

    resize();
    s.rafId = requestAnimationFrame(tick);

    return () => {
      s.mounted = false;
      if (s.rafId !== null) { cancelAnimationFrame(s.rafId); s.rafId = null; }
      ro?.disconnect();
      if (!ro) window.removeEventListener("resize", resize);
      ioRef.current?.disconnect();
      ioRef.current = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mq.removeEventListener("change", syncReducedMotion);
    };
  }, [quantity, size, opacity, drift, depth]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className || ''}`}
      style={style}
      {...canvasProps}
    />
  );
}

// ===========================================================================
// 1B. ANIMATED SUN/MOON 2D MORPHING ICON
// ===========================================================================
const AnimatedThemeIcon = ({ isDark }: { isDark: boolean }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ 
        width: '20px', 
        height: '20px', 
        color: isDark ? '#D4AF37' : '#D97706', 
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
        transform: isDark ? 'rotate(-30deg)' : 'rotate(90deg)' 
      }}
    >
      <defs>
        <mask id="moon-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle cx={isDark ? "16" : "28"} cy={isDark ? "8" : "0"} r="8" fill="black" style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </mask>
      </defs>
      
      <circle 
        cx="12" 
        cy="12" 
        r={isDark ? "10" : "5"} 
        fill="currentColor" 
        mask="url(#moon-mask)" 
        style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} 
      />
      
      <g 
        stroke="currentColor" 
        style={{ 
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
          opacity: isDark ? 0 : 1, 
          transform: isDark ? 'scale(0.3)' : 'scale(1)', 
          transformOrigin: '12px 12px' 
        }}
      >
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
};

// ===========================================================================
// 2. IN-VIEW SCROLL REVEAL WITH BLUR
// ===========================================================================
const Reveal = ({
  children,
  delay = 0,
  margin = "0px 0px -80px 0px",
}: {
  children: React.ReactNode;
  delay?: number;
  margin?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
        else if (entry.boundingClientRect.top > 0) setInView(false);
      },
      { threshold: 0.12, rootMargin: margin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [margin]);

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        filter: inView ? 'blur(0px)' : 'blur(14px)',
        transform: inView ? 'translateY(0px) scale(1)' : 'translateY(36px) scale(0.96)',
        transition: `opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, filter, transform',
        height: 'auto',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

// ===========================================================================
// 2A. HIGH-END AMBIENT 3-COLOR GLOWING INK RIBBON
// ===========================================================================
const ScrollInkThread = ({ active }: { active: boolean }) => {
  const mainPathRef = useRef<SVGPathElement>(null);
  const goldRibbonRef = useRef<SVGPathElement>(null);
  const navyRibbonRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const nibOuterRef = useRef<SVGCircleElement>(null);
  const nibInnerRef = useRef<SVGCircleElement>(null);

  const [docHeight, setDocHeight] = useState(0);
  const [docWidth, setDocWidth] = useState(0);
  const [paths, setPaths] = useState({ main: '', gold: '', navy: '' });

  useEffect(() => {
    if (!active) return;

    const generateSmoothSilkPaths = () => {
      const w = document.documentElement.clientWidth || window.innerWidth;
      const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

      if (h < 200) return;

      setDocWidth(w);
      setDocHeight(h);

      const isMobile = w < 768;
      const leftMargin = isMobile ? w * 0.07 : w * 0.08;
      const rightMargin = isMobile ? w * 0.93 : w * 0.92;

      const buildRibbon = (ox: number, oy: number) => {
        const sx = rightMargin + ox;
        const sy = Math.min(40 + oy, h * 0.02);
        let d = `M ${sx} ${sy} `;
        const usableHeight = Math.max(120, h - sy - 40);
        const waves = 6;
        const stepY = usableHeight / waves;
        let currX = sx;
        let currY = sy;

        for (let i = 0; i < waves; i++) {
          const nextY = currY + stepY;
          const goingLeft = i % 2 === 0;
          const nextX = (goingLeft ? leftMargin : rightMargin) + ox;
          const cp1x = currX;
          const cp1y = currY + stepY * 0.48;
          const cp2x = nextX;
          const cp2y = currY + stepY * 0.52;
          d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextX} ${nextY} `;
          currX = nextX;
          currY = nextY;
        }
        return d;
      };

      setPaths({
        main: buildRibbon(0, 0),
        gold: buildRibbon(14, 10),
        navy: buildRibbon(-12, 18),
      });
    };

    const timer = setTimeout(generateSmoothSilkPaths, 150);
    window.addEventListener('resize', generateSmoothSilkPaths);

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => generateSmoothSilkPaths())
      : null;
    if (ro && document.body) ro.observe(document.body);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', generateSmoothSilkPaths);
      ro?.disconnect();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !paths.main) return;

    const mainEl = mainPathRef.current;
    const goldEl = goldRibbonRef.current;
    const navyEl = navyRibbonRef.current;
    const glowEl = glowPathRef.current;
    const nibOuter = nibOuterRef.current;
    const nibInner = nibInnerRef.current;

    if (!mainEl) return;

    const mainLen = mainEl.getTotalLength();
    const goldLen = goldEl ? goldEl.getTotalLength() : mainLen;
    const navyLen = navyEl ? navyEl.getTotalLength() : mainLen;

    mainEl.style.strokeDasharray = `${mainLen}`;
    if (glowEl) glowEl.style.strokeDasharray = `${mainLen}`;
    if (goldEl) goldEl.style.strokeDasharray = `${goldLen}`;
    if (navyEl) navyEl.style.strokeDasharray = `${navyLen}`;

    let rafId: number | null = null;
    let smoothProgress = 0.02;

    const renderFrame = () => {
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const rawRatio = Math.min(1, Math.max(0, scrollTop / maxScroll));
      const targetProgress = rawRatio;

      smoothProgress += (targetProgress - smoothProgress) * 0.15;
      const mainDraw = mainLen * smoothProgress;
      const mainOffset = Math.max(0, mainLen - mainDraw);

      mainEl.style.strokeDashoffset = `${mainOffset}`;
      if (glowEl) glowEl.style.strokeDashoffset = `${mainOffset}`;

      if (goldEl) {
        const goldP = Math.max(0, Math.min(1, smoothProgress * 0.985));
        goldEl.style.strokeDashoffset = `${Math.max(0, goldLen - goldLen * goldP)}`;
      }

      if (navyEl) {
        const navyP = Math.max(0, Math.min(1, smoothProgress * 0.97));
        navyEl.style.strokeDashoffset = `${Math.max(0, navyLen - navyLen * navyP)}`;
      }

      if (mainDraw > 0 && mainDraw <= mainLen) {
        const pt = mainEl.getPointAtLength(mainDraw);
        if (nibOuter) {
          nibOuter.setAttribute('cx', `${pt.x}`);
          nibOuter.setAttribute('cy', `${pt.y}`);
        }
        if (nibInner) {
          nibInner.setAttribute('cx', `${pt.x}`);
          nibInner.setAttribute('cy', `${pt.y}`);
        }
      }

      if (Math.abs(targetProgress - smoothProgress) > 0.0003) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        rafId = null;
      }
    };

    const handleScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [active, paths]);

  if (!active || !paths.main || docHeight <= 0) return null;

  return (
    <svg
      width={docWidth}
      height={docHeight}
      viewBox={`0 0 ${docWidth} ${docHeight}`}
      fill="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${docHeight}px`,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        <linearGradient id="triColorInkFlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1E24" />
          <stop offset="28%" stopColor="#D4AF37" />
          <stop offset="55%" stopColor="#1E3A5F" />
          <stop offset="80%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B1E24" />
        </linearGradient>
        <linearGradient id="goldSilkGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#8B1E24" />
          <stop offset="100%" stopColor="#1E3A5F" />
        </linearGradient>
      </defs>

      <path ref={glowPathRef} d={paths.main} stroke="url(#triColorInkFlow)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity="0.13" style={{ filter: 'blur(14px)' }} />
      <path ref={navyRibbonRef} d={paths.navy} stroke="#1E3A5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />
      <path ref={goldRibbonRef} d={paths.gold} stroke="url(#goldSilkGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.32" />
      <path ref={mainPathRef} d={paths.main} stroke="url(#triColorInkFlow)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.48" style={{ filter: 'drop-shadow(0 4px 12px rgba(139, 30, 36, 0.18))' }} />
      <circle ref={nibOuterRef} r="11" fill="#D4AF37" opacity="0.32" style={{ filter: 'blur(6px)' }} />
      <circle ref={nibInnerRef} r="5" fill="#8B1E24" stroke="#D4AF37" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.8))' }} />
    </svg>
  );
};

// ===========================================================================
// 2B. SCROLL-SHIFTING SECTION HEADING
// ===========================================================================
const SectionHeading = ({
  title,
  kicker,
  align = 'left',
  isDark = false,
}: {
  title: string;
  kicker: string;
  align?: 'left' | 'right' | 'center';
  isDark?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
        else if (entry.boundingClientRect.top > 0) setInView(false);
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const effectiveAlign = isMobile ? 'center' : align;
  const initialOffsetX = isMobile ? '0px' : align === 'left' ? '90px' : align === 'right' ? '-90px' : '0px';
  const justifyContent = effectiveAlign === 'left' ? 'flex-start' : effectiveAlign === 'right' ? 'flex-end' : 'center';

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: justifyContent,
        textAlign: effectiveAlign,
        marginBottom: isMobile ? '32px' : '44px',
        width: '100%',
        opacity: inView ? 1 : 0,
        filter: inView ? 'blur(0px)' : 'blur(14px)',
        transform: inView ? 'translate3d(0px, 0px, 0px) scale(1)' : `translate3d(${initialOffsetX}, 28px, 0px) scale(0.95)`,
        transition: 'all 0.95s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity, filter',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          flexDirection: effectiveAlign === 'right' ? 'row-reverse' : 'row',
          marginBottom: '8px',
          position: 'relative',
          zIndex: 6,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            height: '2px',
            width: inView ? '38px' : '8px',
            background: 'linear-gradient(90deg, #8B1E24, #D4AF37)',
            borderRadius: '2px',
            transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
          }}
        />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: isDark ? '#D4AF37' : '#8B1E24' }}>
          {kicker}
        </span>
        {isMobile && (
          <span
            style={{
              display: 'inline-block',
              height: '2px',
              width: inView ? '38px' : '8px',
              background: 'linear-gradient(90deg, #D4AF37, #8B1E24)',
              borderRadius: '2px',
              transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
            }}
          />
        )}
      </div>

      <h2 className="continuous-heading" style={{ fontSize: 'clamp(30px, 4.5vw, 50px)', margin: 0, color: isDark ? '#FAF9F5' : undefined }}>
        {title}
      </h2>
    </div>
  );
};

// ===========================================================================
// 2C. CONTINUOUS 3D CLIP-PATH CAROUSEL FOR OBJECTIVES & VISIONS
// ===========================================================================
interface ObjectiveItem {
  num: string;
  tag: string;
  title: string;
  text: string;
  accent: string;
  bgGradient: string;
}

const Objectives3DCarousel = ({ items }: { items: ObjectiveItem[] }) => {
  const [position, setPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollBoostRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const baseSpeed = 0.34;
    const handleWindowScroll = () => {
      const currentY = window.scrollY;
      const deltaY = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;
      scrollBoostRef.current += deltaY * 0.0022;
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    const animate = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const delta = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const boostStep = scrollBoostRef.current * 0.12;
      scrollBoostRef.current *= 0.88;

      setPosition((prev) => {
        const next = (prev + delta * baseSpeed + boostStep) % items.length;
        return next < 0 ? next + items.length : next;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [items.length]);

  const count = items.length;
  const jumpToCard = (targetIdx: number) => setPosition(targetIdx);

  return (
    <div style={{ position: 'relative', width: '100%', padding: '16px 0 24px 0', userSelect: 'none' }}>
      <div style={{ position: 'relative', height: isMobile ? '350px' : '420px', width: '100%', perspective: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        {items.map((item, idx) => {
          let diff = idx - position;
          if (diff > count / 2) diff -= count;
          if (diff < -count / 2) diff += count;

          const absDiff = Math.abs(diff);
          const isVisible = absDiff <= 2.35;
          const spacing = isMobile ? 215 : 330;
          const translateX = diff * spacing;
          const translateZ = -absDiff * (isMobile ? 115 : 155);
          const rotateY = diff * (isMobile ? -18 : -24);
          const scale = Math.max(0.72, 1 - absDiff * 0.13);
          const opacity = absDiff > 2.1 ? 0 : Math.max(0.22, 1 - absDiff * 0.35);
          const zIndex = Math.round(100 - absDiff * 25);
          const isCenter = absDiff < 0.45;
          const clipInset = Math.min(12, absDiff * 5);

          return (
            <div
              key={item.num}
              onClick={() => jumpToCard(idx)}
              style={{
                position: 'absolute',
                width: isMobile ? '255px' : '340px',
                height: isMobile ? '325px' : '380px',
                borderRadius: '28px',
                padding: isMobile ? '24px 20px' : '34px 30px',
                background: item.bgGradient,
                color: '#FAF9F5',
                border: isCenter ? '1px solid rgba(212, 175, 55, 0.65)' : '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: isCenter ? '0 30px 70px rgba(17, 24, 39, 0.32), inset 0 1px 2px rgba(255, 255, 255, 0.35)' : '0 16px 35px rgba(17, 24, 39, 0.16)',
                transform: `translate3d(${translateX}px, 0px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                clipPath: `inset(${clipInset}% 0% ${clipInset}% 0% round 28px)`,
                opacity: isVisible ? opacity : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                zIndex,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                overflow: 'hidden',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity, clip-path',
              }}
            >
              <div style={{ position: 'absolute', right: '-10px', top: '-18px', fontSize: isMobile ? '115px' : '155px', fontWeight: 800, fontFamily: "'Playfair Display', serif", color: 'rgba(255, 255, 255, 0.08)', lineHeight: 1, pointerEvents: 'none', letterSpacing: '-4px' }}>
                {item.num}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', padding: '6px 12px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.14)', backdropFilter: 'blur(8px)', color: item.accent, border: '1px solid rgba(255,255,255,0.2)' }}>
                  {item.tag}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 800, color: item.accent }}>
                  {item.num}
                </span>
              </div>

              <div style={{ zIndex: 2, margin: 'auto 0' }}>
                <div style={{ width: isCenter ? '52px' : '28px', height: '2px', background: item.accent, marginBottom: '16px', transition: 'width 0.4s ease' }} />
                <h3 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '21px' : '26px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: isMobile ? '13.5px' : '15.5px', lineHeight: 1.65, color: 'rgba(250, 249, 245, 0.86)', fontWeight: 400 }}>
                  {item.text}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: '12px', fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', zIndex: 2 }}>
                <span>संRACHNA Vision</span>
                <span style={{ color: item.accent, fontWeight: 700 }}>Edition I • 2026</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '18px' }}>
        <button aria-label="Previous Slide" onClick={() => setPosition((prev) => (prev - 1 + count) % count)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(139, 30, 36, 0.25)', background: 'rgba(255,255,255,0.8)', color: '#8B1E24', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          ←
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {items.map((item, idx) => {
            let diff = Math.abs(idx - position);
            if (diff > count / 2) diff = count - diff;
            const isActive = diff < 0.5;
            return (
              <button key={item.num} aria-label={`Go to slide ${idx + 1}`} onClick={() => jumpToCard(idx)} style={{ width: isActive ? '28px' : '8px', height: '8px', borderRadius: '999px', border: 'none', background: isActive ? '#8B1E24' : 'rgba(139, 30, 36, 0.25)', cursor: 'pointer', transition: 'all 0.35s ease', padding: 0 }} />
            );
          })}
        </div>
        <button aria-label="Next Slide" onClick={() => setPosition((prev) => (prev + 1) % count)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(139, 30, 36, 0.25)', background: 'rgba(255,255,255,0.8)', color: '#8B1E24', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          →
        </button>
      </div>
    </div>
  );
};

// ===========================================================================
// 3. INTERACTIVE FAQ ACCORDION COMPONENT
// ===========================================================================
const FAQAccordion = ({ faqs }: { faqs: { q: string, a: string }[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <Reveal key={idx} delay={idx * 70}>
            <div 
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              style={{
                background: isOpen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(229, 228, 223, 0.8)',
                borderRadius: '24px',
                padding: isOpen ? '22px 26px' : '18px 26px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isOpen ? '0 12px 30px rgba(139, 30, 36, 0.08)' : '0 4px 15px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: 'clamp(16px, 2vw, 21px)', fontWeight: 600, color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {faq.q}
                </h3>
                <span style={{ fontSize: '24px', color: '#8B1E24', fontWeight: 300, transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', flexShrink: 0 }}>
                  +
                </span>
              </div>
              <div style={{ maxHeight: isOpen ? '220px' : '0px', opacity: isOpen ? 1 : 0, marginTop: isOpen ? '14px' : '0px', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <p style={{ margin: 0, fontSize: 'clamp(15px, 1.8vw, 17.5px)', color: '#52525B', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
};

// ===========================================================================
// 4. INTERACTIVE 3D LIQUID GLASS SOCIAL CONTACT CARD
// ===========================================================================
const SocialMorphCard = () => {
  const [activeTab, setActiveTab] = useState('website');
  const [isHovered, setIsHovered] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const timeoutRef = useRef<any>(null);

  const tabs = {
    website: {
      title: "Institution Website",
      subtitle: "Government Engineering College, Godda",
      link: "https://gecgodda.ac.in",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    },
    email: {
      title: "Official Email",
      subtitle: "sanrachna.gecgodda@gmail.com",
      link: "mailto:sanrachna.gecgodda@gmail.com",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    },
    instagram: {
      title: "Instagram",
      subtitle: "@sanrachna.magazine",
      link: "https://instagram.com/sanrachna.magazine",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
    },
    youtube: {
      title: "YouTube Channel",
      subtitle: "@sanrachna.magazine",
      link: "https://youtube.com/@sanrachna.magazine",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
    },
    linkedin: {
      title: "LinkedIn Page",
      subtitle: "@sanrachna.magazine",
      link: "https://linkedin.com/company/sanrachna-magazine",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
    }
  };

  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (activeTab !== key) {
      setActiveTab(key);
      setAnimKey((prev) => prev + 1);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => setIsHovered(false), 200);
  };

  const current = tabs[activeTab as keyof typeof tabs];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px auto 0', width: '100%' }} onMouseLeave={handleMouseLeave}>
      <div style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '32px', position: 'relative' }}>
        <a 
          href={current.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="social-card-container"
          style={{
            opacity: isHovered ? 1 : 0,
            filter: isHovered ? 'blur(0px)' : 'blur(10px)',
            transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            pointerEvents: isHovered ? 'auto' : 'none',
            visibility: isHovered ? 'visible' : 'hidden',
          }}
          onMouseEnter={() => { 
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current); 
            setIsHovered(true); 
          }}
        >
          <div key={animKey} className="social-fade-content" style={{ display: 'flex', alignItems: 'center', gap: '18px', width: '100%' }}>
            <div style={{ padding: '14px', background: 'rgba(139, 30, 36, 0.08)', borderRadius: '16px', color: '#8B1E24', display: 'flex', flexShrink: 0 }}>
              {current.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: 'clamp(17px, 2vw, 21px)', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {current.title}
              </h4>
              <p style={{ margin: 0, color: '#52525B', fontSize: 'clamp(13px, 1.5vw, 15px)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {current.subtitle}
              </p>
            </div>
          </div>
        </a>
      </div>

      <div className="social-icons-row" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {Object.keys(tabs).map((key) => (
          <button
            key={key}
            aria-label={`Open ${tabs[key as keyof typeof tabs].title}`}
            onMouseEnter={() => handleMouseEnter(key)}
            onClick={() => handleMouseEnter(key)}
            className={`liquid-social-btn ${isHovered && activeTab === key ? 'active' : ''}`}
            title={tabs[key as keyof typeof tabs].title}
          >
            {tabs[key as keyof typeof tabs].icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// ===========================================================================
// 5. INTERACTIVE TEAM FAN-STACK COMPONENT
// ===========================================================================
interface TeamMember {
  name: string;
  role: string;
  badge: string;
  bio: string;
  avatarVariant: number;
}

interface TeamGroup {
  id: string;
  category: string;
  subtitle: string;
  members: TeamMember[];
}

const MinimalistAvatar = ({ variant, isHighlighted, initials }: { variant: number; isHighlighted: boolean; initials: string }) => {
  const strokeColor = isHighlighted ? "#FAF9F5" : "#1E3A5F";
  const accentColor = isHighlighted ? "#D4AF37" : "#8B1E24";
  const bgCircle = isHighlighted ? "rgba(255,255,255,0.12)" : "rgba(139,30,36,0.08)";

  return (
    <div style={{ position: 'relative', width: '92px', height: '92px', margin: '0 auto 14px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="92" height="92" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill={bgCircle} stroke={accentColor} strokeWidth="1.5" strokeDasharray={variant % 2 === 0 ? "4 3" : "none"} />
        {variant % 4 === 0 && (
          <>
            <path d="M28 46 C28 26, 72 26, 72 46 C75 56, 68 62, 65 55 C60 36, 40 36, 35 55 C32 62, 25 56, 28 46 Z" fill={strokeColor} opacity="0.9" />
            <circle cx="50" cy="50" r="14" stroke={strokeColor} strokeWidth="2.2" fill="none" />
            <circle cx="45" cy="48" r="1.8" fill={strokeColor} />
            <circle cx="55" cy="48" r="1.8" fill={strokeColor} />
            <path d="M46 55 Q50 58 54 55" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M30 82 C34 69, 66 69, 70 82" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {variant % 4 === 1 && (
          <>
            <path d="M32 42 C34 25, 66 25, 68 42" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="49" r="14" stroke={strokeColor} strokeWidth="2.2" fill="none" />
            <rect x="40" y="45" width="8" height="6" rx="2" stroke={accentColor} strokeWidth="2" />
            <rect x="52" y="45" width="8" height="6" rx="2" stroke={accentColor} strokeWidth="2" />
            <line x1="48" y1="48" x2="52" y2="48" stroke={accentColor} strokeWidth="2" />
            <path d="M46 56 Q50 59 54 56" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M29 82 C34 68, 66 68, 71 82" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {variant % 4 === 2 && (
          <>
            <path d="M26 52 C24 27, 76 27, 74 52 C71 40, 29 40, 26 52 Z" fill={strokeColor} />
            <circle cx="50" cy="50" r="14" stroke={strokeColor} strokeWidth="2.2" fill="none" />
            <circle cx="45" cy="49" r="1.8" fill={strokeColor} />
            <circle cx="55" cy="49" r="1.8" fill={strokeColor} />
            <path d="M47 55 Q50 57 53 55" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M31 82 C35 70, 65 70, 69 82" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {variant % 4 === 3 && (
          <>
            <path d="M33 38 C42 24, 64 26, 68 41" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="14" stroke={strokeColor} strokeWidth="2.2" fill="none" />
            <circle cx="45" cy="48" r="1.8" fill={strokeColor} />
            <circle cx="55" cy="48" r="1.8" fill={strokeColor} />
            <path d="M45 55 Q50 59 55 55" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M30 82 C35 68, 65 68, 70 82" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          background: isHighlighted ? '#D4AF37' : '#8B1E24',
          color: isHighlighted ? '#4A1216' : '#FFFFFF',
          fontSize: '10px',
          fontWeight: 800,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(139,30,36,0.2)',
          letterSpacing: '0.5px',
        }}
      >
        {initials}
      </span>
    </div>
  );
};

const TeamFanStack = ({ group }: { group: TeamGroup }) => {
  const count = group.members.length;
  const defaultCenter = Math.floor((count - 1) / 2);
  const [isFanned, setIsFanned] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(defaultCenter);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getInitials = (name: string) => {
    const clean = name.replace(/^(Dr\.|Prof\.|Ms\.|Mr\.)\s+/i, '');
    const parts = clean.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      style={{
        padding: isMobileView ? '24px 14px' : '36px 24px',
        borderRadius: '28px',
        background: 'rgba(255, 255, 255, 0.65)',
        border: '1px solid rgba(229, 228, 223, 0.95)',
        boxShadow: '0 12px 35px rgba(139, 30, 36, 0.05), inset 0 1px 2px rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsFanned(true)}
      onMouseLeave={() => {
        setIsFanned(false);
        setActiveIndex(defaultCenter);
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobileView ? '20px' : '28px', zIndex: 2 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: 'rgba(139, 30, 36, 0.08)',
            color: '#8B1E24',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          <span>{group.category}</span>
          <span style={{ opacity: 0.6 }}>• {count} {count === 1 ? 'Member' : 'Members'}</span>
        </div>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#52525B', maxWidth: '520px' }}>
          {group.subtitle}
        </p>
      </div>

      {isMobileView ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', width: '100%' }}>
          {group.members.map((member, idx) => {
            const isActive = activeIndex === idx;
            return (
              <div
                key={member.name}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: '100%',
                  maxWidth: '290px',
                  borderRadius: '24px',
                  padding: '24px 22px',
                  background: isActive ? 'linear-gradient(155deg, #8B1E24 0%, #521014 100%)' : 'linear-gradient(155deg, #FFFDF9 0%, #F4EFE6 100%)',
                  color: isActive ? '#FAF9F5' : '#1E3A5F',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.65)' : '1px solid rgba(139, 30, 36, 0.18)',
                  boxShadow: isActive ? '0 20px 40px rgba(139, 30, 36, 0.25)' : '0 8px 20px rgba(139, 30, 36, 0.06)',
                  transform: isActive ? 'scale(1.02)' : 'scale(0.98)',
                  transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', background: isActive ? 'rgba(212, 175, 55, 0.22)' : 'rgba(139, 30, 36, 0.08)', color: isActive ? '#F6E05E' : '#8B1E24' }}>
                    {member.badge}
                  </span>
                </div>
                <MinimalistAvatar variant={member.avatarVariant} isHighlighted={isActive} initials={getInitials(member.name)} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#F6E05E' : '#8B1E24', marginBottom: '4px' }}>
                  {member.role}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: isActive ? '#FFFFFF' : '#1E3A5F' }}>
                  {member.name}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: isActive ? 'rgba(250, 249, 245, 0.88)' : '#52525B' }}>
                  {member.bio}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ position: 'relative', height: '360px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px' }}>
          {group.members.map((member, idx) => {
            const offset = idx - (count - 1) / 2;
            const isActive = activeIndex === idx;
            const collapsedX = offset * 28;
            const collapsedY = Math.abs(offset) * 10;
            const collapsedRotate = offset * 6;
            const collapsedScale = isActive ? 1 : 0.94 - Math.abs(offset) * 0.03;
            const spreadSpacing = count >= 4 ? 195 : count === 3 ? 220 : 235;
            const fannedX = offset * spreadSpacing;
            const fannedY = isActive ? -14 : Math.abs(offset) * 16;
            const fannedRotate = isActive ? 0 : offset * 7;
            const fannedScale = isActive ? 1.06 : 0.95;

            const translateX = isFanned ? fannedX : collapsedX;
            const translateY = isFanned ? fannedY : collapsedY;
            const rotateDeg = isFanned ? fannedRotate : collapsedRotate;
            const scaleVal = isFanned ? fannedScale : collapsedScale;
            const zIndexVal = isActive ? 40 : 20 - Math.round(Math.abs(offset) * 2);

            return (
              <div
                key={member.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  setIsFanned(true);
                  setActiveIndex(idx);
                }}
                style={{
                  position: 'absolute',
                  width: '245px',
                  minHeight: '305px',
                  borderRadius: '26px',
                  padding: '22px 20px',
                  background: isActive ? 'linear-gradient(155deg, #8B1E24 0%, #4E1014 100%)' : 'linear-gradient(155deg, #FFFDF9 0%, #F4EFE6 100%)',
                  color: isActive ? '#FAF9F5' : '#1E3A5F',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.7)' : '1px solid rgba(139, 30, 36, 0.18)',
                  boxShadow: isActive ? '0 28px 55px rgba(139, 30, 36, 0.28), 0 0 0 1px rgba(212,175,55,0.28)' : '0 14px 30px rgba(30, 58, 95, 0.08)',
                  transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotateDeg}deg) scale(${scaleVal})`,
                  transition: 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: zIndexVal,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    right: '18px',
                    background: 'linear-gradient(135deg, #8B1E24 0%, #5A1216 100%)',
                    color: '#FAF9F5',
                    border: '1px solid rgba(212, 175, 55, 0.65)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    boxShadow: '0 6px 16px rgba(139, 30, 36, 0.25)',
                    opacity: isActive && isFanned ? 1 : 0,
                    transform: isActive && isFanned ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none',
                  }}
                >
                  {member.badge}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: isActive ? '#F6E05E' : '#8B1E24' }}>
                    Sanrachna
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: isActive ? 'rgba(250, 249, 245, 0.7)' : '#71717A' }}>
                    {member.badge}
                  </span>
                </div>

                <MinimalistAvatar variant={member.avatarVariant} isHighlighted={isActive} initials={getInitials(member.name)} />

                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: isActive ? '#F6E05E' : '#8B1E24', marginBottom: '4px', letterSpacing: '0.3px' }}>
                    {member.role}
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: isActive ? '#FFFFFF' : '#1E3A5F', lineHeight: 1.2 }}>
                    {member.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5, color: isActive ? 'rgba(250, 249, 245, 0.88)' : '#52525B' }}>
                    {member.bio}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isMobileView && count > 1 && (
        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: isFanned ? '#8B1E24' : '#71717A', transition: 'color 0.3s ease' }}>
          {isFanned ? 'Hover a card to spotlight member' : 'Hover stack to fan out cards'}
        </div>
      )}
    </div>
  );
};

// ===========================================================================
// 6. DARK ROYAL MAGAZINE 404 ERROR VIEW
// ===========================================================================
const Error404View = ({ onBackHome }: { onBackHome: () => void }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 20% 20%, rgba(184,134,34,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(110,20,35,0.32), transparent 50%), linear-gradient(145deg, #24060C 0%, #140407 55%, #2C0810 100%)',
        color: '#FAF3E6',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        textAlign: 'center',
      }}
    >
      <Floating3DParticles
        color="#D4AF37"
        quantity={80}
        size={5}
        opacity={0.25}
        drift={0.5}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '540px',
          width: '100%',
          padding: '44px 36px',
          borderRadius: '18px',
          background: 'rgba(255, 250, 240, 0.04)',
          border: '1px solid rgba(212, 172, 59, 0.38)',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.28em',
            color: '#E6C466',
            marginBottom: '10px',
          }}
        >
          संRACHNA • GEC GODDA • EDITION I
        </div>

        <h1
          style={{
            fontSize: 'clamp(84px, 14vw, 140px)',
            margin: 0,
            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            lineHeight: 0.95,
            background: 'linear-gradient(135deg, #FFF3C4 0%, #D4A437 55%, #9B6B14 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 12px 28px rgba(212, 175, 55, 0.25))',
          }}
        >
          404
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '14px 0 16px',
          }}
        >
          <span style={{ width: '48px', height: '1px', background: 'rgba(212,172,59,0.5)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.26em', color: '#F5E0A3' }}>
            PAGE NOT FOUND
          </span>
          <span style={{ width: '48px', height: '1px', background: 'rgba(212,172,59,0.5)' }} />
        </div>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#DFD2BE',
            margin: '0 0 28px',
          }}
        >
          The ink hasn&apos;t reached this folio yet. Lagta hai aap kisi aise panne par aa gaye hain
          jiska nirmaan abhi baaki hai.
        </p>

        <button
          type="button"
          onClick={onBackHome}
          style={{
            padding: '12px 26px',
            borderRadius: '999px',
            border: '1px solid #E6C466',
            background: 'linear-gradient(135deg, #8A1B30 0%, #5A0D1C 100%)',
            color: '#FFFDF8',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.16em',
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
          }}
        >
          RETURN TO HOME PAGE →
        </button>
      </div>
    </div>
  );
};

// ===========================================================================
// 7. MAIN COMPLETE APPLICATION
// ===========================================================================
export default function App() {
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false); 
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [openSubmissionPortal, setOpenSubmissionPortal] = useState(false);
  const [creatorPassOpen, setCreatorPassOpen] = useState(false);
const creatorPassTrigger = useCreatorPassTrigger(() => {
  setMenuOpen(false);
  setCreatorPassOpen(true);
}, 5000, 2500);
 const [openReviewDesk, setOpenReviewDesk] = useState(
    () =>
      window.location.hash.toLowerCase() === '#review' ||
      window.location.pathname.toLowerCase() === '/review' ||
      window.location.pathname.toLowerCase() === '/studio' ||
      window.location.pathname.toLowerCase() === '/studio/'
  );
  const [creatorPassOpen, setCreatorPassOpen] = useState(false);
const creatorTrigger = useCreatorPassTrigger(() => setCreatorPassOpen(true), 1200);
  const [guidelinesOpen, setGuidelinesOpen] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/guidelines'
  );
  useEffect(() => {
    const syncReviewRoute = () => {
      const isStudio =
        window.location.hash.toLowerCase() === '#review' ||
        window.location.pathname.toLowerCase() === '/review' ||
        window.location.pathname.toLowerCase() === '/studio' ||
        window.location.pathname.toLowerCase() === '/studio/';
      if (isStudio) setOpenReviewDesk(true);
    };
    window.addEventListener('hashchange', syncReviewRoute);
    window.addEventListener('popstate', syncReviewRoute);
    return () => {
      window.removeEventListener('hashchange', syncReviewRoute);
      window.removeEventListener('popstate', syncReviewRoute);
    };
  }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanrachna_theme') !== 'light';
    } catch {
      return true;
    }
  });

  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<number | null>(null);

  const handleSecretLogoTap = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) window.clearTimeout(logoTapTimerRef.current);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      window.history.replaceState(null, '', '/studio');
      setOpenReviewDesk(true);
      return;
    }

    logoTapTimerRef.current = window.setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2500);
  };

  const [liveNotices, setLiveNotices] = useState<
    { id: string; title: string; message: string; tag: string; display_type: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, message, tag, display_type')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (active && data) setLiveNotices(data);
    })();
    return () => {
      active = false;
    };
  }, [openReviewDesk]);

  const liveTickerText = liveNotices
    .filter((n) => n.display_type === 'ticker' || n.display_type === 'both')
    .map((n) => `${n.title.toUpperCase()} • ${n.message.toUpperCase()}`)
    .join('  ✦  ');

  const liveBoardNotices = liveNotices.filter(
    (n) => n.display_type === 'notice' || n.display_type === 'both' || !n.display_type
  );

  useEffect(() => {
    localStorage.setItem('sanrachna_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const zoomThreshold = 500;

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (hasEntered) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          if (currentScroll >= zoomThreshold * 0.98) {
            setHasEntered(true);
            window.scrollTo(0, 0); 
          } else {
            setScrollY(currentScroll);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasEntered]);

  useEffect(() => {
    if (!hasEntered) return;
    const onMainScroll = () => {
      setShowFloatingActions(window.scrollY > 130);
    };
    window.addEventListener('scroll', onMainScroll, { passive: true });
    onMainScroll();
    return () => window.removeEventListener('scroll', onMainScroll);
  }, [hasEntered]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const isStudioRoute = currentPath === '/studio' || currentPath === '/studio/';
  const is404Route =
  currentPath !== '/' &&
  currentPath !== '' &&
  !currentPath.includes('index.html') &&
  !isStudioRoute &&
  !guidelinesOpen &&
  !openReviewDesk;

  if (is404Route) {
    return (
      <Error404View onBackHome={() => {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }
      }} />
    );
  }

  const progress = hasEntered ? 1 : Math.min(Math.max(scrollY / zoomThreshold, 0), 1);
  const easeIn = progress * progress * progress; 
  const portalScale = 1 + (easeIn * 40); 
  const rotateZ = progress * -10; 
  const rotateX = progress * 50;  
  const blurAmount = easeIn * 15; 
  const portalOpacity = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1;
  const contentOpacity = hasEntered ? 1 : (progress > 0.5 ? Math.min((progress - 0.5) / 0.5, 1) : 0);

  const themeBg = isDarkMode ? '#070B19' : '#FAF9F5';
  const themeText = isDarkMode ? '#FAF9F5' : '#111827';
  const themeSubText = isDarkMode ? '#A1A1AA' : '#3F3F46';

  const teamGroups: TeamGroup[] = [
    {
      id: 'faculty',
      category: 'Leadership & Faculty In-Charge',
      subtitle: 'Guiding the institutional vision, academic integrity, and publication standards of Sanrachna.',
      members: [
        { name: 'Dr. Madan Gopal Tiary', role: 'Director, GEC Godda', badge: 'Patron', bio: 'Inspiring academic excellence, research culture, and holistic student development across the institution.', avatarVariant: 1 },
        { name: 'Dr. Amit Kumar Choudhary', role: 'Faculty In-Charge, Sanrachna', badge: 'Faculty Lead', bio: 'Spearheading the official student committee formation and overseeing the annual magazine publication.', avatarVariant: 3 },
        { name: 'Ms. Sumbul', role: 'Faculty In-Charge, Sanrachna', badge: 'Faculty Mentor', bio: 'Mentoring literary curation, editorial review, and creative expression across student submissions.', avatarVariant: 0 },
        { name: 'Prof. Gourav Banerjee', role: 'Faculty In-Charge, Sanrachna', badge: 'Faculty Mentor', bio: 'Advising on publication workflow, structural quality, and institutional documentation.', avatarVariant: 2 },
      ],
    },
    {
      id: 'editor',
      category: 'Editorial Leadership',
      subtitle: 'Leading the student editorial board and ensuring overall publication excellence.',
      members: [
        { name: 'Priya Kumari', role: 'Editor', badge: 'Chief Editor', bio: 'Oversees complete magazine curation, editorial tone, aesthetic consistency, and final publishing standards.', avatarVariant: 0 },
      ],
    },
    {
      id: 'review',
      category: 'Review & Evaluation Team',
      subtitle: 'Ensuring literary quality, grammatical precision, originality, and ethical compliance.',
      members: [
        { name: 'Anannya Singh', role: 'Coordinator — Review', badge: 'Review Team', bio: 'Leads manuscript evaluation, proofreading, plagiarism screening, and editorial refinement.', avatarVariant: 2 },
        { name: 'Samrat Sandilya', role: 'Coordinator — Review', badge: 'Review Team', bio: 'Directs final quality control, structural editing, ethics verification, and publication readiness.', avatarVariant: 1 },
      ],
    },
    {
      id: 'photography',
      category: 'Photography Team',
      subtitle: 'Capturing campus milestones, institutional events, and visual stories across GEC Godda.',
      members: [
        { name: 'Akanksha Chouhan', role: 'Coordinator — Photography', badge: 'Photography', bio: 'Curates high-resolution visual coverage, campus photojournalism, and photographic submissions.', avatarVariant: 0 },
        { name: 'Nitu Kumari', role: 'Coordinator — Photography', badge: 'Photography', bio: 'Manages event documentation, visual storytelling, and archival photography for the magazine.', avatarVariant: 2 },
      ],
    },
    {
      id: 'fine-arts',
      category: 'Fine Arts Team',
      subtitle: 'Showcasing illustrations, traditional paintings, sketches, and creative visual artistry.',
      members: [
        { name: 'Aliya Naaz', role: 'Coordinator — Fine Arts', badge: 'Fine Arts', bio: 'Curates student artwork, illustrations, and thematic visual aesthetics for the annual edition.', avatarVariant: 0 },
        { name: 'Satyam Pandey', role: 'Coordinator — Fine Arts', badge: 'Fine Arts', bio: 'Oversees artistic direction, creative illustrations, and fine art evaluations.', avatarVariant: 3 },
      ],
    },
    {
      id: 'graphic-content',
      category: 'Graphic Content Team',
      subtitle: 'Crafting digital layouts, typography systems, and visual design for print and digital editions.',
      members: [
        { name: 'Rukhsar Parween', role: 'Coordinator — Graphic Content', badge: 'Graphic Design', bio: 'Designs magazine layouts, visual graphics, and modern typographic compositions.', avatarVariant: 2 },
        { name: 'Sachin Kumar Mahato', role: 'Coordinator — Graphic Content', badge: 'Graphic Design', bio: 'Leads digital illustration, page structuring, and visual branding across the publication.', avatarVariant: 1 },
      ],
    },
    {
      id: 'public-relations',
      category: 'Public Relations Team',
      subtitle: 'Managing campus outreach, official communications, and contributor engagement.',
      members: [
        { name: 'Anubhav Kumar', role: 'Coordinator — Public Relation', badge: 'Public Relations', bio: 'Coordinates campus-wide announcements, student outreach, and contributor communications.', avatarVariant: 3 },
        { name: 'Prince Kumar', role: 'Coordinator — Public Relation', badge: 'Public Relations', bio: 'Manages external affairs, departmental coordination, and promotional campaigns.', avatarVariant: 1 },
      ],
    },
  ];

  const filteredTeamGroups = selectedTeamFilter === 'all' ? teamGroups : teamGroups.filter((g) => g.id === selectedTeamFilter);

  const objectivesList: ObjectiveItem[] = [
    { num: '01', tag: 'Creative Expression', title: 'Literary & Technical Excellence', text: 'Encourage literary, creative, artistic, and technical writing across all engineering disciplines.', accent: '#D4AF37', bgGradient: 'linear-gradient(155deg, #1E3A5F 0%, #0F1E36 100%)' },
    { num: '02', tag: 'Campus Spotlight', title: 'Sparking Innovation', text: 'Showcase student and faculty achievements while sparking a culture of creativity and research innovation.', accent: '#F6E05E', bgGradient: 'linear-gradient(155deg, #8B1E24 0%, #4A0E13 100%)' },
    { num: '03', tag: 'Institutional Legacy', title: 'Preserving Annual Chronicles', text: 'Preserve the annual institutional record of GEC Godda and strengthen bonds across our campus community.', accent: '#D4AF37', bgGradient: 'linear-gradient(155deg, #6B1D2F 0%, #2C1018 100%)' },
    { num: '04', tag: 'Skill Mastery', title: 'Editorial & Design Craft', text: 'Build practical student skills in writing, editing, graphic design, photography, and modern publishing.', accent: '#9AE6B4', bgGradient: 'linear-gradient(155deg, #1E4E3A 0%, #0F291E 100%)' },
    { num: '05', tag: 'Hybrid Publishing', title: 'Print & Digital Editions', text: 'Publish curated editions regularly in both tactile physical print and accessible interactive digital formats.', accent: '#FBD38D', bgGradient: 'linear-gradient(155deg, #5A2D18 0%, #2B140A 100%)' },
    { num: '06', tag: 'Unified Voices', title: 'Championing Perspectives', text: "Champion diverse student, faculty, and alumni perspectives while elevating the college's national image.", accent: '#D4AF37', bgGradient: 'linear-gradient(155deg, #273859 0%, #141E33 100%)' },
  ];

  const faqs = [
    { q: 'Who can submit to संRACHNA?', a: 'All currently enrolled students, faculty, staff, and alumni of GEC Godda are welcome to contribute.' },
    { q: 'What is the theme for 2026?', a: 'The theme is "The Zero (शून्य)" representing new beginnings and boundless potential.' },
    { q: 'What file formats do you accept?', a: 'Text submissions should be in .doc/.docx formats. Images and artworks should be high-resolution JPEG/PNG.' },
    { q: 'How to submit?', a: 'You can submit your work directly through our official Google Form portal.' }
  ];

  return (
    <>
      <div
        style={{
          margin: 0,
          padding: 0,
          width: '100%',
          backgroundColor: themeBg,
          color: themeText,
          minHeight: '100dvh',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          position: 'relative',
          overflowX: 'clip',
          transition: 'background-color 0.4s ease, color 0.4s ease',
          display: (openSubmissionPortal || guidelinesOpen) ? 'none' : 'block'
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Rozha+One&display=swap');
          
          * { box-sizing: border-box; }
          html, body, #root { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important; 
            max-width: none !important; 
            overflow-x: clip !important; 
          }

          @keyframes continuousGradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes premiumSweep {
            0% { background-position: 0% center; }
            100% { background-position: -200% center; }
          }

          .continuous-heading {
            font-family: "'Playfair Display', serif";
            background: linear-gradient(135deg, #8B1E24 0%, #D4AF37 35%, #1E3A5F 70%, #8B1E24 100%);
            background-size: 250% 250%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: inline-block;
            padding: 10px 0;
            margin: 0;
            animation: continuousGradientFlow 5s ease infinite;
            filter: drop-shadow(0 4px 10px rgba(139, 30, 36, 0.22));
          }

          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
          .marquee-bar {
            overflow: hidden; white-space: nowrap; width: 100%;
            background: linear-gradient(90deg, #8B1E24 0%, #D4AF37 50%, #1E3A5F 100%);
            background-size: 250% 250%;
            animation: continuousGradientFlow 6s ease infinite;
            padding: 10px 0; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.25);
            box-shadow: 0 10px 30px rgba(139,30,36,0.35), inset 0 1px 3px rgba(255,255,255,0.4);
            position: relative; z-index: 45;
          }
          .marquee-track {
            display: inline-block; animation: marquee 30s linear infinite;
            font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;
          }

          .editorial-header {
            position: relative; background: ${isDarkMode ? 'rgba(7, 11, 25, 0.9)' : 'rgba(250, 249, 245, 0.92)'};
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-bottom: 2px solid transparent;
            border-image: linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03); z-index: 40;
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 40px; width: 100%; gap: 15px;
            flex-wrap: nowrap;
          }

          .header-content-wrapper {
            display: flex; align-items: center; gap: clamp(10px, 1.5vw, 20px);
            flex: 1 1 auto; min-width: 0; 
          }
          
          .header-logos { display: flex; align-items: center; flex-shrink: 0; }
          .header-logo-img { height: clamp(45px, 6vw, 65px); width: auto; object-fit: contain; mix-blend-mode: multiply; }
          .header-separator { width: 2px; height: clamp(35px, 5vw, 55px); background: rgba(139, 30, 36, 0.4); margin: 0 clamp(8px, 1.5vw, 16px); border-radius: 2px; }

          .sanrachna-logo-wrapper {
             width: clamp(60px, 8vw, 85px);
             height: clamp(45px, 6vw, 65px);
             display: flex; align-items: center; justify-content: center;
             overflow: hidden; mix-blend-mode: multiply; background: transparent;
          }

          .header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
          }

          .desktop-header-grid {
            display: grid;
            grid-template-columns: max-content max-content;
            column-gap: 10px;
            row-gap: 4px;
            align-items: center;
          }

          .header-title {
            margin: 0;
            font-size: clamp(16px, 1.8vw, 23px);
            font-weight: 800;
            font-family: 'Playfair Display', serif;
            color: ${isDarkMode ? '#FAF9F5' : '#1E3A5F'};
            line-height: 1.15;
            white-space: nowrap;
          }

          .desktop-sanrachna-cell {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            white-space: nowrap;
            line-height: 1.15;
          }

          .desktop-v-divider {
            color: rgba(139, 30, 36, 0.45);
            font-weight: 400;
            font-size: clamp(16px, 1.8vw, 23px);
          }

          .sanrachna-brown-brand {
            font-family: 'Rozha One', 'Playfair Display', serif;
            font-weight: 800;
            font-size: clamp(16px, 1.8vw, 23px);
            background: linear-gradient(90deg, #8B1E24 0%, #5A1216 30%, #D4AF37 50%, #8B1E24 75%, #5A1216 100%);
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: premiumThemeShine 5s linear infinite;
            display: inline-block;
          }

          .header-subtitle {
            margin: 0;
            font-size: clamp(7.2px, 0.8vw, 10.3px);
            color: ${isDarkMode ? '#A1A1AA' : '#52525B'};
            letter-spacing: 0.18px;
            text-transform: uppercase;
            font-weight: 600;
            line-height: 1.3;
            white-space: nowrap;
            width: 100%;
            text-align: justify;
            text-align-last: justify;
          }

          .desktop-slogan-cell {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            white-space: nowrap;
            line-height: 1.3;
          }

          .desktop-v-divider-sub {
            color: rgba(139, 30, 36, 0.45);
            font-weight: 600;
            font-size: clamp(10px, 1vw, 13px);
          }

          .header-slogan-text {
            margin: 0;
            font-size: clamp(10px, 1vw, 13px);
            color: #8B1E24;
            letter-spacing: 0.8px;
            font-weight: 700;
            font-family: 'Plus Jakarta Sans', sans-serif;
            white-space: nowrap;
          }

          .mobile-header-stack {
            display: none;
          }

          @keyframes mobileLineFlow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }

          .nav-container { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

          @keyframes strokeDrawLoop {
            0% { stroke-dashoffset: 70; opacity: 0.4; }
            50% { stroke-dashoffset: 0; opacity: 1; }
            100% { stroke-dashoffset: -70; opacity: 0.4; }
          }

          @keyframes lineGrowShrink {
            0%, 100% { width: 14px; opacity: 0.6; }
            50% { width: 22px; opacity: 1; }
          }

          .animated-draw-path {
            stroke-dasharray: 70;
            animation: strokeDrawLoop 4s ease-in-out infinite;
          }

          .glass-icon-btn {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(12px); border: 1.5px solid rgba(212, 175, 55, 0.45);
            cursor: pointer; width: 44px; height: 44px; display: flex; flex-direction: column; justify-content: center;
            align-items: center; gap: 5px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.9);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); outline: none; flex-shrink: 0;
          }
          .glass-icon-btn:hover {
            border-color: #8B1E24; background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.95)'};
            box-shadow: 0 8px 22px rgba(139,30,36,0.2), inset 0 2px 4px rgba(255,255,255,1); transform: translateY(-3px) scale(1.05);
          }
          
          .hamburger-line { 
            height: 2px; background: linear-gradient(90deg, #8B1E24, #D4AF37); border-radius: 2px; display: block; 
            transition: all 0.3s ease; animation: lineGrowShrink 3s ease-in-out infinite;
          }
          .hamburger-line:nth-child(2) { animation-delay: 0.4s; }
          .hamburger-line:nth-child(3) { animation-delay: 0.8s; }

          .announcements-btn, .theme-toggle-btn {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)'}; border: 1.5px solid rgba(212, 175, 55, 0.45); cursor: pointer; color: ${isDarkMode ? '#D4AF37' : '#1E3A5F'}; 
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center;
            width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }
          .announcements-btn:hover, .theme-toggle-btn:hover { 
            background: rgba(139,30,36,0.1); border-color: #8B1E24; color: #8B1E24; transform: translateY(-3px) scale(1.05);
          }

          .floating-action-dock {
            position: fixed;
            top: 18px;
            right: 24px;
            z-index: 120;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            border-radius: 999px;
            background: ${isDarkMode ? 'rgba(7, 11, 25, 0.85)' : 'linear-gradient(135deg, rgba(250, 249, 245, 0.85) 0%, rgba(255, 255, 255, 0.6) 100%)'};
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(212, 175, 55, 0.5);
            box-shadow: 0 14px 35px rgba(17, 24, 39, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.9);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .page-section {
            padding: 72px 40px;
            border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(229, 228, 223, 0.7)'};
            max-width: 1320px;
            margin: 0 auto;
          }

          .about-body-wrap {
            font-size: clamp(17px, 2vw, 22px);
            line-height: 1.8;
            color: ${isDarkMode ? '#D4D4D8' : '#3F3F46'};
            max-width: 980px;
            text-align: left;
          }

          .guidelines-intro-text {
            font-size: clamp(16.5px, 1.9vw, 21px);
            color: ${isDarkMode ? '#D4D4D8' : '#3F3F46'};
            max-width: 900px;
            line-height: 1.7;
            margin: 0 0 32px 0;
            text-align: left;
          }

          .guidelines-btn-group {
            display: flex;
            gap: 20px;
            justify-content: flex-start;
            flex-wrap: wrap;
            margin-bottom: 40px;
          }

          .guideline-row {
            display: flex;
            flex-wrap: wrap;
            gap: 32px;
            padding: 36px 0;
            text-align: left;
          }

          .portal-section-wrap {
            text-align: right;
          }

          .portal-intro-text {
            font-size: clamp(16.5px, 1.9vw, 21px);
            color: ${isDarkMode ? '#D4D4D8' : '#3F3F46'};
            max-width: 850px;
            line-height: 1.7;
            margin: 0 0 36px auto;
          }

          .portal-btn-row {
            display: flex;
            justify-content: flex-end;
          }

          @media (max-width: 768px) {
            .editorial-header { padding: 12px 16px; gap: 12px; }
            .header-content-wrapper { gap: 10px; flex: 1; min-width: 0; }
            .desktop-header-grid { display: none !important; }
            
            .mobile-header-stack {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
              width: 100%;
              text-align: left;
              padding-right: 5px;
            }
            .mobile-college-title {
              margin: 0;
              font-size: clamp(10px, 2.8vw, 13px);
              font-weight: 800;
              font-family: 'Playfair Display', serif;
              color: ${isDarkMode ? '#FAF9F5' : '#1E3A5F'};
              line-height: 1.25;
              white-space: normal;
            }
            .mobile-animated-line {
              width: 80%;
              max-width: 140px;
              height: 1.5px;
              margin: 5px 0 4px 0;
              border-radius: 2px;
              background: linear-gradient(90deg, #8B1E24 0%, #D4AF37 50%, #8B1E24 100%);
              background-size: 200% 100%;
              animation: mobileLineFlow 2.5s linear infinite;
            }
            .mobile-sanrachna-brown {
              font-family: 'Rozha One', 'Playfair Display', serif;
              font-weight: 800;
              font-size: clamp(12.5px, 3.5vw, 15px);
              letter-spacing: 0.5px;
              background: linear-gradient(90deg, #8B1E24 0%, #5A1216 30%, #D4AF37 50%, #8B1E24 75%, #5A1216 100%);
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
              animation: premiumThemeShine 5s linear infinite;
              line-height: 1.15;
            }
            .header-logo-img { height: 32px; }
            .header-separator { height: 26px; margin: 0 4px; }
            .sanrachna-logo-wrapper { height: 32px; width: 42px; }
            
            .nav-container { gap: 8px; flex-shrink: 0; }
            .glass-icon-btn, .announcements-btn, .theme-toggle-btn { width: 34px; height: 34px; }
            .floating-action-dock { top: 16px; right: 16px; padding: 6px 10px; gap: 8px; }
            
            .page-section { padding: 52px 20px; }
            .about-body-wrap { text-align: center; }
            .guidelines-intro-text { text-align: center; margin: 0 auto 28px auto; }
            .guidelines-btn-group { justify-content: center; }
            .guideline-row { gap: 16px; padding: 28px 0; }
            .portal-section-wrap { text-align: center; }
            .portal-intro-text { text-align: center; margin: 0 auto 28px auto; }
            .portal-btn-row { justify-content: center; }
          }

          @keyframes portalShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
          .portal-top-text { font-family: 'Rozha One', 'Playfair Display', serif; background: linear-gradient(90deg, rgba(255,255,255,0.8) 0%, #D4AF37 50%, rgba(255,255,255,0.8) 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: portalShine 3s linear infinite; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
          .portal-subtitle { background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, #ffffff 50%, rgba(255,255,255,0.7) 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: portalShine 4s linear infinite; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6)); }
          .portal-scroll-text { background: linear-gradient(90deg, #ffffff 0%, #D4AF37 50%, #ffffff 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: portalShine 2s linear infinite; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8)); }
          .portal-main-title { font-family: 'Rozha One', 'Playfair Display', serif; background: linear-gradient(90deg, #ffffff 0%, #D4AF37 30%, #ffffff 50%, #D4AF37 70%, #ffffff 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: portalShine 4s linear infinite; filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)); padding-bottom: 10px; }
          @keyframes scrollBounceGlow { 0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); } 50% { transform: translateY(8px); filter: drop-shadow(0 0 25px #ffffff) drop-shadow(0 0 10px #D4AF37); } }
          .portal-scroll-arrow { color: #ffffff; animation: scrollBounceGlow 2s infinite ease-in-out; }

          @keyframes premiumThemeShine { 0% { background-position: 0% center; } 100% { background-position: -200% center; } }
          .theme-welcome-text {
            font-family: 'Rozha One', 'Playfair Display', serif;
            background: linear-gradient(90deg, #8B1E24 0%, #1E3A5F 25%, #D4AF37 50%, #1E3A5F 75%, #8B1E24 100%);
            background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text;
            animation: premiumThemeShine 6s linear infinite; padding-bottom: 8px; display: inline-block;
          }

          .liquid-glass-btn {
             position: relative; overflow: hidden; background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(250, 249, 245, 0.65)'};
             backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
             border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 30px; 
             padding: 14px 28px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
             color: ${isDarkMode ? '#FAF9F5' : '#1E3A5F'}; cursor: pointer; z-index: 1; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
             box-shadow: 0 8px 25px rgba(30, 58, 95, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.95);
             text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-align: center;
          }
          
          .liquid-glass-btn::after {
             content: ''; position: absolute; top: 0; left: -150%; width: 50%; height: 100%;
             background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
             transform: skewX(-25deg); transition: none; z-index: -1;
          }
          
          .liquid-glass-btn:hover {
             background: rgba(139, 30, 36, 0.95); color: #ffffff; border-color: #8B1E24;
             transform: translateY(-5px); box-shadow: 0 15px 30px rgba(139, 30, 36, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }
          
          .liquid-glass-btn:hover::after { left: 200%; transition: left 0.8s ease-in-out; }

          .btn-green-tint { background: rgba(47, 133, 90, 0.15); border-color: rgba(47, 133, 90, 0.4); color: #2F855A; }
          .btn-green-tint:hover { background: rgba(47, 133, 90, 0.95); color: #fff; border-color: rgba(47, 133, 90, 1); box-shadow: 0 15px 30px rgba(47, 133, 90, 0.4); }

          .animated-close-btn { transition: all 0.3s ease; font-size: 24px; color: ${isDarkMode ? '#FAF9F5' : '#111827'}; background: transparent; border: none; cursor: pointer; outline: none; }
          .animated-close-btn:hover { transform: rotate(90deg) scale(1.1); color: #8B1E24; }

          .glass-modal {
            background: ${isDarkMode ? 'rgba(7, 11, 25, 0.95)' : 'rgba(250, 249, 245, 0.92)'}; backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 25px 60px rgba(0,0,0,0.18), inset 0 2px 6px rgba(255,255,255,1); border-radius: 24px; color: ${isDarkMode ? '#FAF9F5' : '#111827'};
          }

          .explore-text-shine {
             background: linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24);
             background-size: 300% auto; -webkit-background-clip: text; color: transparent;
             animation: premiumSweep 4s linear infinite; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
          }

          .sidebar-item {
             padding: 16px 20px; border-radius: 12px; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
             border-left: 4px solid transparent; text-align: left; background: transparent;
          }
          
          .sidebar-item:hover {
             transform: translateX(12px); background: rgba(139, 30, 36, 0.04);
             border-left: 4px solid #8B1E24; box-shadow: 2px 4px 12px rgba(0,0,0,0.03);
          }

          .sidebar-panel.open .sidebar-item { opacity: 0; }
          .sidebar-panel.open .sidebar-item:nth-child(1) { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.1s; }
          .sidebar-panel.open .sidebar-item:nth-child(2) { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.15s; }
          .sidebar-panel.open .sidebar-item:nth-child(3) { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.2s; }
          .sidebar-panel.open .sidebar-item:nth-child(4) { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.25s; }
          .sidebar-panel.open .sidebar-item:nth-child(5) { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s; }

          @keyframes slideInRight {
            from { opacity: 0; filter: blur(8px); transform: translateX(40px); }
            to { opacity: 1; filter: blur(0px); transform: translateX(0); }
          }

          .social-card-container {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)'};
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(229, 228, 223, 0.9); border-radius: 24px; padding: 22px 26px;
            width: 100%; max-width: 450px; margin: 0 auto;
            box-shadow: 0 15px 35px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: left; text-decoration: none; color: ${isDarkMode ? '#FAF9F5' : '#111827'};
          }
          .social-card-container:hover {
            transform: translateY(-5px) scale(1.02) !important;
            box-shadow: 0 20px 40px rgba(139, 30, 36, 0.1), inset 0 2px 4px rgba(255,255,255,1);
            border-color: rgba(139, 30, 36, 0.3);
          }

          .liquid-social-btn {
            width: 58px; height: 58px; border-radius: 18px;
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            border: 1.5px solid rgba(212, 175, 55, 0.5);
            display: flex; align-items: center; justify-content: center;
            color: ${isDarkMode ? '#D4AF37' : '#1E3A5F'}; cursor: pointer; outline: none;
            box-shadow: 0 8px 20px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.9);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            transform: perspective(600px) translateZ(0);
          }
          .liquid-social-btn:hover {
            transform: perspective(600px) translateZ(25px) translateY(-6px);
            color: #FAF9F5; background: linear-gradient(135deg, #8B1E24 0%, #D4AF37 100%);
            border-color: #D4AF37;
            box-shadow: 0 16px 35px rgba(139, 30, 36, 0.35), inset 0 2px 4px rgba(255,255,255,0.6);
          }
          .liquid-social-btn.active {
            color: #FAF9F5; background: #8B1E24; border-color: #D4AF37;
            transform: perspective(600px) translateZ(15px) translateY(-3px);
            box-shadow: 0 12px 28px rgba(139, 30, 36, 0.3);
          }

          .social-fade-content { animation: slideFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; width: 100%; }
          @keyframes slideFadeIn {
            from { opacity: 0; filter: blur(6px); transform: translateY(10px); }
            to { opacity: 1; filter: blur(0px); transform: translateY(0); }
          }

          .team-filter-pill {
            border: 1px solid rgba(139, 30, 36, 0.2);
            background: rgba(255, 255, 255, 0.75);
            color: #3F3F46;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.6px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
          }
          .team-filter-pill:hover { border-color: #8B1E24; color: #8B1E24; transform: translateY(-2px); }
          .team-filter-pill.active {
            background: linear-gradient(135deg, #8B1E24 0%, #5A1216 100%);
            color: #FFFFFF; border-color: rgba(212, 175, 55, 0.5);
            box-shadow: 0 8px 20px rgba(139, 30, 36, 0.25);
          }
        `}</style>

        {!hasEntered && (
          <>
            <div
              style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: '#0B132B', overflow: 'hidden', zIndex: 50, opacity: portalOpacity,
              }}
            >
              <video
                src="/sanrachna-intro.mp4" autoPlay loop muted playsInline aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, filter: 'brightness(0.65)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(11,19,43,0.3) 0%, rgba(11,19,43,0.85) 100%)', zIndex: 2 }} />

              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3,
                  transform: `perspective(1200px) scale(${portalScale}) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
                  filter: `blur(${blurAmount}px)`, transformOrigin: 'center center', willChange: 'transform, filter', backfaceVisibility: 'hidden',
                }}
              >
                <div className="cinematic-reveal-1" style={{ position: 'absolute', top: '36px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', opacity: Math.max(0, 1 - progress * 2.5) }}>
                  <span className="portal-top-text">GEC GODDA</span>
                  <span className="portal-top-text">|| सृजन से निर्माण तक ||</span>
                </div>

                <div className="cinematic-reveal-2" style={{ textAlign: 'center', padding: '0 20px', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.7))' }}>
                    <h1 className="portal-main-title" style={{ fontSize: 'clamp(52px, 13vw, 160px)', fontWeight: 800, letterSpacing: '-2px', margin: 0, lineHeight: 1.1 }}>
                      संRACHNA
                    </h1>
                  </div>
                  <p className="portal-subtitle" style={{ margin: '15px 0 0 0', fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 500, letterSpacing: '1.5px', opacity: Math.max(0, 1 - progress * 3) }}>
                    The Official Annual College Magazine
                  </p>
                </div>

                <div className="cinematic-reveal-3" style={{ position: 'absolute', bottom: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', opacity: Math.max(0, 1 - progress * 3) }}>
                  <span className="portal-scroll-text">Scroll to enter</span>
                  <span className="portal-scroll-arrow" style={{ fontSize: '22px' }}>↓</span>
                </div>
              </div>
            </div>
            <div style={{ height: `${zoomThreshold}px`, width: '100%', pointerEvents: 'none' }} />
          </>
        )}

        {hasEntered && (
          <div
            className="floating-action-dock"
            style={{
              opacity: showFloatingActions ? 1 : 0,
              transform: showFloatingActions ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, -24px, 0) scale(0.9)',
              filter: showFloatingActions ? 'blur(0px)' : 'blur(8px)',
              pointerEvents: showFloatingActions ? 'auto' : 'none',
            }}
          >
            <button
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle-btn"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <AnimatedThemeIcon isDark={isDarkMode} />
            </button>

            <button
              aria-label="Open Announcements"
              onClick={() => setAnnouncementsOpen(true)}
              className="announcements-btn"
              title="Official Announcements"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
                <path className="animated-draw-path" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path className="animated-draw-path" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <circle cx="18" cy="6" r="3" fill="#8B1E24" stroke="#FAF9F5" strokeWidth="1"></circle>
              </svg>
            </button>

            <button
              aria-label="Toggle Navigation Menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="glass-icon-btn"
              title="Toggle Navigation Menu"
            >
              <span className="hamburger-line" style={{ transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span className="hamburger-line" style={{ opacity: menuOpen ? 0 : 1 }} />
              <span className="hamburger-line" style={{ transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        )}

        <div style={{ opacity: contentOpacity, position: 'relative', zIndex: 10 }}>
          
          {hasEntered && (
            <Floating3DParticles 
              color="#8B1E24" quantity={150} size={4} opacity={0.3} drift={0.6} depth={0.7} 
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }} 
            />
          )}

          <ScrollInkThread active={hasEntered} />

          <div className="marquee-bar" onClick={() => setAnnouncementsOpen(true)} title="Click to view all announcements">
            <div className="marquee-track">
              <span>
                📢{' '}
                {liveTickerText ||
                  'OFFICIAL ANNOUNCEMENT: Submissions Open for Inaugural Edition 2026 • Theme: The Zero (शून्य) • Send your original articles, poetry, and artwork to sanrachna.gecgodda@gmail.com • Click here for complete details & guidelines'}{' '}
                &nbsp;&bull;&nbsp;{' '}
              </span>
              <span>
                📢{' '}
                {liveTickerText ||
                  'OFFICIAL ANNOUNCEMENT: Submissions Open for Inaugural Edition 2026 • Theme: The Zero (शून्य) • Send your original articles, poetry, and artwork to sanrachna.gecgodda@gmail.com • Click here for complete details & guidelines'}{' '}
                &nbsp;&bull;&nbsp;{' '}
              </span>
            </div>
          </div>

          <header className="editorial-header">
            <div className="header-content-wrapper">
              <div className="header-logos">
                <img src="/gec-logo.png" alt="GEC Godda Logo" className="header-logo-img" />
                <div className="header-separator" />
                <div className="sanrachna-logo-wrapper">
                  <img
                    src="/sanrachna-official-logo.png"
                    alt="Sanrachna Logo"
                    onClick={handleSecretLogoTap}
                    style={{ height: '95px', width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
                  />
                </div>
              </div>
              
              <div className="header-text">
                <div className="desktop-header-grid">
                  <h2 className="header-title" style={{ color: isDarkMode ? '#FAF9F5' : '#1E3A5F' }}>Government Engineering College, Godda</h2>
                  <div className="desktop-sanrachna-cell">
                    <span className="desktop-v-divider">|</span>
                    <span className="sanrachna-brown-brand">संRACHNA</span>
                  </div>

                  <p className="header-subtitle" style={{ color: isDarkMode ? '#A1A1AA' : '#52525B' }}>Department of Higher, Technical Education and Skill Development</p>
                  <div className="desktop-slogan-cell">
                    <span className="desktop-v-divider-sub">|</span>
                    <span className="header-slogan-text">सृजन से निर्माण तक</span>
                  </div>
                </div>

                <div className="mobile-header-stack">
                  <h2 className="mobile-college-title" style={{ color: isDarkMode ? '#FAF9F5' : '#1E3A5F' }}>Government Engineering College, Godda</h2>
                  <div className="mobile-animated-line" />
                  <span className="mobile-sanrachna-brown">संRACHNA</span>
                </div>
              </div>
            </div>

            <div className="nav-container">
              <button aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle-btn" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <AnimatedThemeIcon isDark={isDarkMode} />
              </button>

              <button aria-label="Open Announcements" onClick={() => setAnnouncementsOpen(true)} className="announcements-btn" title="Announcements">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
                  <path className="animated-draw-path" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path className="animated-draw-path" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  <circle cx="18" cy="6" r="3" fill="#8B1E24" stroke="#FAF9F5" strokeWidth="1"></circle>
                </svg>
              </button>
              
              <button aria-label="Toggle Navigation Menu" onClick={() => setMenuOpen(!menuOpen)} className="glass-icon-btn" title="Toggle Menu">
                <span className="hamburger-line" style={{ transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
                <span className="hamburger-line" style={{ opacity: menuOpen ? 0 : 1 }} />
                <span className="hamburger-line" style={{ transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </header>

          <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
            
            <section id="home" className="page-section" style={{ borderTop: 'none', textAlign: 'center', maxWidth: '1100px' }}>
              <Reveal delay={0} margin="0px 0px -40px 0px">
                <h1 style={{ fontSize: 'clamp(34px, 5vw, 64px)', fontWeight: 700, lineHeight: 1.2, margin: '0 0 24px 0', color: themeText }}>
                  Welcome to <span className="theme-welcome-text">संRACHNA !</span>
                </h1>
              </Reveal>

              <Reveal delay={120} margin="0px 0px -40px 0px">
                <p style={{ fontSize: 'clamp(17px, 2.2vw, 24px)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, lineHeight: 1.7, margin: '0 0 28px 0', color: themeSubText }}>
                  Sanrachna is the official college magazine of Government Engineering College, Godda. Preserving academic achievements, creative writing, and institutional milestones across physical and digital editions.
                </p>
              </Reveal>

              <Reveal delay={240} margin="0px 0px -40px 0px">
                <p style={{ fontSize: 'clamp(15.5px, 2vw, 21px)', lineHeight: 1.85, color: themeSubText, margin: '0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Before these pages unfold into technical notes, cultural chronicles, and artistic expressions, take a moment to breathe it in. This digital canvas exists to capture the unspoken thoughts, midnight musings, and raw creativity shaping our campus life. You are holding a piece of our collective identity—turn the page and see what your peers have dreamed up !
                </p>
              </Reveal>
            </section>

            <section id="about" className="page-section">
              <SectionHeading kicker="Institutional Identity" title="About संRACHNA" align="left" isDark={isDarkMode} />
              <div className="about-body-wrap">
                <Reveal delay={100}>
                  <p style={{ marginBottom: '22px', color: themeSubText }}>
                    संRACHNA seamlessly brings together the vibrant voices of our students, faculties, staffs, and alumnies into one unified platform.
                  </p>
                </Reveal>
                <Reveal delay={200}>
                  <p style={{ marginBottom: '22px', color: themeSubText }}>
                    We proudly showcase every face of campus life highlighting <strong style={{ color: themeText }}>Academic</strong> excellence, <strong style={{ color: themeText }}>Cultural</strong> vibrancy, <strong style={{ color: themeText }}>Sports</strong>, <strong style={{ color: themeText }}>Creative</strong> and <strong style={{ color: themeText }}>Technical</strong> innovations, deeply personal <strong style={{ color: themeText }}>Experiences</strong>, and significant <strong style={{ color: themeText }}>Community achievements</strong>.
                  </p>
                </Reveal>
                <Reveal delay={300}>
                  <p style={{ fontWeight: 600, color: '#D4AF37', fontSize: 'clamp(18px, 2.2vw, 24px)', margin: 0 }}>
                    Ultimately, it preserves the memory as a lasting institutional record.
                  </p>
                </Reveal>
              </div>
            </section>

            <section id="objectives" className="page-section" style={{ overflow: 'hidden' }}>
              <SectionHeading kicker="Our Core Pillars" title="Objectives & Visions" align="right" isDark={isDarkMode} />
              <Reveal delay={100}>
                <Objectives3DCarousel items={objectivesList} />
              </Reveal>
            </section>

            <section id="submissions" className="page-section">
              <SectionHeading kicker="Publication Standards" title="Guidelines & Ethics" align="left" isDark={isDarkMode} />
              <Reveal>
                <div style={{ marginBottom: '44px' }}>
                  <p className="guidelines-intro-text" style={{ color: themeSubText }}>
                    Please review the complete guidelines, category word limits, formatting rules, and submission template below before submitting your work through our official portal.
                  </p>

                  <div className="guidelines-btn-group">
                    <a href="/Guidelines.pdf" download="Sanrachna_Guidelines_2026.pdf" className="liquid-glass-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Download Official Guidelines
                    </a>
                    <a href="/Template for Submission.pdf" download="Sanrachna_Template_2026.pdf" className="liquid-glass-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Download Template (PDF)
                    </a>
                  </div>
                </div>
              </Reveal>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Reveal delay={40}>
                  <div className="guideline-row" style={{ borderTop: '1px solid rgba(139, 30, 36, 0.2)' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(22px, 2.5vw, 26px)', fontFamily: "'Playfair Display', serif", color: '#8B1E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Formatting Rules</h3>
                    </div>
                    <div style={{ flex: '2 1 540px' }}>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)' }}>
                        <li>• <strong style={{ color: themeText }}>Language:</strong> हिन्दी / English.</li>
                        <li>• <strong style={{ color: themeText }}>Fonts:</strong> KrutiDev or Mangal (Hindi) / Bookman Old Style (English).</li>
                        <li>• <strong style={{ color: themeText }}>Font Sizes:</strong> Text: 14pt (Hindi) / 11pt (English). Heading: 16pt (Hindi) / 14pt Bold (English).</li>
                        <li>• <strong style={{ color: themeText }}>Page Specs:</strong> A4 Size, 1.5 Line Spacing, 6pt spacing after each paragraph.</li>
                        <li>• <strong style={{ color: themeText }}>Images:</strong> Resolution 300 dpi (.jpg, .png). Do not embed images inside word documents.</li>
                      </ul>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={80}>
                  <div className="guideline-row" style={{ borderTop: '1px solid rgba(139, 30, 36, 0.2)' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(22px, 2.5vw, 26px)', fontFamily: "'Playfair Display', serif", color: '#8B1E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Eligibility</h3>
                    </div>
                    <div style={{ flex: '2 1 540px' }}>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)' }}>
                        <li>• Enrolled students at GEC Godda.</li>
                        <li>• Faculty & their wards.</li>
                        <li>• Administrative staff & their wards.</li>
                        <li>• Alumnies.</li>
                      </ul>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={120}>
                  <div className="guideline-row" style={{ borderTop: '1px solid rgba(30, 58, 95, 0.2)' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(22px, 2.5vw, 26px)', fontFamily: "'Playfair Display', serif", color: '#1E3A5F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Accepted Contributions</h3>
                    </div>
                    <div style={{ flex: '2 1 540px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)', flex: '1 1 240px' }}>
                        <li>• Articles (700-900 words)</li>
                        <li>• Journalism (250-500 words)</li>
                        <li>• Mass Communication (400-600 words)</li>
                        <li>• Biography (250-500 words)</li>
                        <li>• Poem (25-50 lines)</li>
                        <li>• Essay/Short Story (300-600 words)</li>
                      </ul>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)', flex: '1 1 240px' }}>
                        <li>• Campus News (500-700 words)</li>
                        <li>• Career & Entrepreneurship (150-250)</li>
                        <li>• Drawing/Painting/Artworks (1-2 nos)</li>
                        <li>• Photography (1-2 nos)</li>
                        <li>• Remembrance/Observance (500-700)</li>
                        <li>• Alumni Corner (250-500 words)</li>
                      </ul>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={160}>
                  <div className="guideline-row" style={{ borderTop: '1px solid rgba(47, 133, 90, 0.2)' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(22px, 2.5vw, 26px)', fontFamily: "'Playfair Display', serif", color: '#2F855A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Submission Rules</h3>
                    </div>
                    <div style={{ flex: '2 1 540px' }}>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)' }}>
                        <li>• Original & unpublished work only.</li>
                        <li>• Submissions through the official Google Form portal only.</li>
                        <li>• Maximum of two (02) entries per author.</li>
                        <li style={{ marginTop: '10px', color: themeText, fontWeight: 600 }}>DISCLOSURE: Editorial Board decision regarding edits and publication will be final.</li>
                      </ul>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div className="guideline-row" style={{ borderTop: '1px solid rgba(214, 158, 46, 0.3)', borderBottom: '1px solid rgba(214, 158, 46, 0.3)' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(22px, 2.5vw, 26px)', fontFamily: "'Playfair Display', serif", color: '#D69E2E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Originality & Ethics</h3>
                    </div>
                    <div style={{ flex: '2 1 540px' }}>
                      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: themeSubText, lineHeight: 2, fontSize: 'clamp(15.5px, 1.8vw, 19px)' }}>
                        <li>• Zero tolerance for plagiarism. Artificial Intelligence (AI) works are strictly prohibited.</li>
                        <li>• Religious, mythological, and self-promotional contents are strictly forbidden.</li>
                        <li>• Authors own the responsibility of accuracy, citations, and permissions.</li>
                      </ul>
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>

            <section id="submission-portal" className="page-section portal-section-wrap">
              <SectionHeading kicker="Send Your Work" title="Submission Portal" align="right" isDark={isDarkMode} />
              <Reveal delay={100}>
                <p className="portal-intro-text" style={{ color: themeSubText }}>
                  Ready to showcase your talent? Once you have formatted your work according to the official guidelines and template, upload your entries securely through our official submission portal.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="portal-btn-row">
                  <button
                    type="button"
                    onClick={() => setOpenSubmissionPortal(true)}
                    className="liquid-glass-btn btn-green-tint"
                    style={{ fontSize: '15px', padding: '16px 36px' }}
                  >
                    Open Submission Portal →
                  </button>
                </div>
              </Reveal>
            </section>

            <section id="faq" className="page-section">
              <SectionHeading kicker="Common Queries" title="Frequently Asked Questions" align="left" isDark={isDarkMode} />
              <FAQAccordion faqs={faqs} />
            </section>

            <section id="contact" className="page-section" style={{ paddingBottom: '56px' }}>
              <SectionHeading kicker="Connect & Collaborate" title="Get in Touch with Us!" align="right" isDark={isDarkMode} />
              <Reveal delay={120}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <p style={{ fontSize: 'clamp(16px, 1.8vw, 20px)', color: themeSubText, maxWidth: '700px', textAlign: 'center', lineHeight: '1.7', margin: '0 0 24px 0' }}>
                    Have inquiries about manuscript guidelines, publication timelines, or editorial collaborations? Connect with our editorial team through any of the channels below.
                  </p>
                  <SocialMorphCard />
                </div>
              </Reveal>
            </section>

          </main>

          {/* =========================================================================== */}
          {/* PREMIUM THEME-ALIGNED EDITORIAL FOOTER                                      */}
          {/* =========================================================================== */}
          <footer
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: isDarkMode ? '#050814' : 'linear-gradient(180deg, #FAF9F5 0%, #F5EFE6 45%, #EBE0D0 100%)',
              borderTop: '2px solid transparent',
              borderImage: 'linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1',
              padding: '64px 0 0 0',
              margin: 0,
              zIndex: 10,
            }}
          >
            <style>{`
              .theme-footer-grid {
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 40px 44px 40px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                flex-wrap: wrap;
                gap: 40px;
                position: relative;
                z-index: 5;
              }
              .theme-footer-left {
                max-width: 540px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
              }
              .theme-footer-right {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                text-align: right;
                gap: 8px;
              }
              .theme-footer-link {
                background: transparent;
                border: none;
                padding: 4px 0;
                font-size: 15px;
                font-weight: 600;
                color: ${isDarkMode ? '#D4D4D8' : '#3F3F46'};
                cursor: pointer;
                transition: all 0.25s ease;
                font-family: 'Plus Jakarta Sans', sans-serif;
                text-decoration: none;
              }
              .theme-footer-link:hover {
                color: #D4AF37;
                transform: translateX(-4px);
              }
              @keyframes pulseCta {
                0%, 100% { transform: translateY(0); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2); }
                50% { transform: translateY(-4px); box-shadow: 0 16px 35px rgba(212, 175, 55, 0.4); }
              }
              .footer-cta-pulse { animation: pulseCta 4s ease-in-out infinite; }

              @media (max-width: 768px) {
                .theme-footer-grid {
                  padding: 0 20px 32px 20px;
                  flex-direction: column;
                  align-items: center;
                  text-align: center;
                  gap: 28px;
                }
                .theme-footer-left {
                  align-items: center;
                  text-align: center;
                }
                .theme-footer-right {
                  align-items: center;
                  text-align: center;
                  width: 100%;
                }
                .theme-footer-link:hover {
                  transform: translateY(-2px);
                }
              }
            `}</style>

            <div className="theme-footer-grid">
              <div className="theme-footer-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '70px',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      mixBlendMode: 'multiply',
                      background: 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/sanrachna-official-logo.png"
                      alt="Sanrachna Official Logo"
                      onClick={handleSecretLogoTap}
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        objectFit: 'contain', 
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        padding: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                  <div style={{ width: '2px', height: '44px', background: 'rgba(212, 175, 55, 0.4)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                    <span className="sanrachna-brown-brand" style={{ fontSize: '28px', lineHeight: 1.1 }}>संRACHNA</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.8px', marginTop: '3px' }}>
                      सृजन से निर्माण तक
                    </span>
                  </div>
                </div>

                <h3 style={{ margin: '8px 0 20px 0', fontSize: 'clamp(23px, 3.2vw, 34px)', fontFamily: "'Rozha One', 'Playfair Display', serif", fontWeight: 500, lineHeight: 1.4, color: isDarkMode ? '#FAF9F5' : '#1E3A5F' }}>
                  सृजन से विचार, विचारों से सपने,<br />
                  <span style={{ color: '#8B1E24' }}>सपनों से निर्माण</span> <span style={{ color: '#D4AF37' }}>।</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setOpenSubmissionPortal(true)}
                  className="liquid-glass-btn footer-cta-pulse"
                  style={{ background: '#D4AF37', color: '#070B19', borderColor: '#D4AF37' }}
                >
                  <span>Submit Your Creation →</span>
                </button>
              </div>

              <div className="theme-footer-right">
                <button onClick={() => scrollToSection('home')} className="theme-footer-link">Home Overview</button>
                <button onClick={() => scrollToSection('about')} className="theme-footer-link">About संRACHNA</button>
                <button onClick={() => scrollToSection('objectives')} className="theme-footer-link">Objectives & Visions</button>
                <button onClick={() => scrollToSection('submissions')} className="theme-footer-link">Guidelines & Ethics</button>
                <button onClick={() => setTeamOpen(true)} className="theme-footer-link">Editorial Board & Teams</button>
                <button onClick={() => setAnnouncementsOpen(true)} className="theme-footer-link">Official Announcements</button>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.2)', fontSize: '13px', color: isDarkMode ? '#A1A1AA' : '#52525B', lineHeight: 1.7 }}>
                  <div><strong style={{ color: isDarkMode ? '#FAF9F5' : '#111827' }}>Edition I (2026):</strong> Theme — The Zero (शून्य)</div>
                  <div><strong style={{ color: isDarkMode ? '#FAF9F5' : '#111827' }}>Contributions:</strong> Open for all Students & Faculty</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <a href="/Guidelines.pdf" download="Sanrachna_Guidelines_2026.pdf" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #D4AF37' }}>
                      Guidelines PDF ↓
                    </a>
                    <a href="/Template for Submission.pdf" download="Sanrachna_Template_2026.pdf" style={{ color: isDarkMode ? '#FAF9F5' : '#1E3A5F', fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${isDarkMode ? '#FAF9F5' : '#1E3A5F'}` }}>
                      Template PDF ↓
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: isDarkMode ? '#03050B' : 'rgba(235, 224, 208, 0.95)',
                borderTop: '1px solid rgba(212, 175, 55, 0.25)',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: isDarkMode ? '#A1A1AA' : '#1E3A5F',
              }}
            >
              <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  © 2026 <strong style={{ color: '#D4AF37' }}>संRACHNA Magazine</strong> — Government Engineering College, Godda.
                </div>
                <button
                  aria-label="Back to top"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="liquid-glass-btn"
                  style={{ padding: '8px 22px', fontSize: '12px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#FAF9F5', borderColor: '#D4AF37', color: isDarkMode ? '#FAF9F5' : '#1E3A5F' }}
                >
                  Back to Top ↑
                </button>
              </div>
            </div>
          </footer>

        </div>

        {/* SIDEBAR OVERLAY & PANEL */}
        <div 
          className="sidebar-overlay" 
          onClick={() => setMenuOpen(false)} 
          style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
            zIndex: 190, opacity: menuOpen ? 1 : 0, visibility: menuOpen ? 'visible' : 'hidden', transition: 'all 0.4s ease'
          }}
        />
        
        <div 
          className={`sidebar-panel ${menuOpen ? 'open' : ''}`}
          style={{ 
            position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: '420px',
            backgroundColor: isDarkMode ? 'rgba(7, 11, 25, 0.98)' : 'rgba(250, 249, 245, 0.95)', backdropFilter: 'blur(25px)', zIndex: 200,
            borderLeft: '1px solid rgba(229, 228, 223, 0.8)', boxShadow: '-10px 0 50px rgba(0,0,0,0.1)',
            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto', color: themeText
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <span
  {...creatorPassTrigger.bind}
  className="explore-text-shine"
  style={{
    position: 'relative',
    display: 'inline-block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    paddingBottom: '5px',
  }}
>
  Explore संRACHNA
  {creatorPassTrigger.chargeRatio > 0 && (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: '2px',
        width: `${Math.round(creatorPassTrigger.chargeRatio * 100)}%`,
        borderRadius: '999px',
        background: 'linear-gradient(90deg, #A81D32, #D4AF37)',
        boxShadow: '0 0 10px rgba(212, 175, 55, 0.85)',
      }}
    />
  )}
</span>
            <button aria-label="Close Sidebar" onClick={() => setMenuOpen(false)} className="animated-close-btn">✕</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="sidebar-item" onClick={() => { setGuidelinesOpen(true); setMenuOpen(false); }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: themeText, fontFamily: "'Playfair Display', serif" }}>Guidelines & Rules</h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeSubText }}>Review submission criteria, fonts, and ethics.</p>
            </div>
            
            <div className="sidebar-item" onClick={() => { setTeamOpen(true); setMenuOpen(false); }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: themeText, fontFamily: "'Playfair Display', serif" }}>Editorial Board</h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeSubText }}>Meet the faculty and student team.</p>
            </div>
            
            <div
              className="sidebar-item"
              onClick={() => {
                setOpenSubmissionPortal(true);
                setMenuOpen(false);
              }}
            >
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: themeText, fontFamily: "'Playfair Display', serif" }}>
                Submit Contribution
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeSubText }}>
                Upload your entries directly via portal.
              </p>
            </div>

            <div className="sidebar-item" onClick={() => { setComingSoonOpen(true); setMenuOpen(false); }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#D4AF37', fontFamily: "'Playfair Display', serif" }}>Download Digital Edition</h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeSubText }}>Get the official 2026 digital magazine.</p>
            </div>
            
            <div className="sidebar-item" onClick={() => scrollToSection('contact')}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: themeText, fontFamily: "'Playfair Display', serif" }}>Contact Us</h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeSubText }}>Get in touch with the editorial team.</p>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139,30,36,0.1), rgba(212,175,55,0.1))', borderRadius: '12px', border: '1px solid rgba(229, 228, 223, 0.8)' }}>
              <strong style={{ display: 'block', fontSize: '14px', color: themeText, marginBottom: '4px' }}>Edition I • 2026</strong>
              <span style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 600 }}>Theme: The Zero (शून्य)</span>
            </div>
          </div>
        </div>

        {/* EDITORIAL BOARD MODAL */}
        {teamOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(30, 15, 18, 0.55)', backdropFilter: 'blur(12px)',
              zIndex: 150, display: 'flex', justifyContent: 'center', alignItems: 'center',
              padding: '20px', boxSizing: 'border-box'
            }}
            onClick={() => setTeamOpen(false)}
          >
            <div
              className="glass-modal"
              style={{ width: '100%', maxWidth: '1120px', maxHeight: '92vh', padding: 'clamp(24px, 4vw, 48px)', boxSizing: 'border-box', overflowY: 'auto', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button aria-label="Close Team Modal" onClick={() => setTeamOpen(false)} className="animated-close-btn" style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  The Faces Behind The Pages
                </div>
                <h2 className="elegant-heading" style={{ fontSize: 'clamp(28px, 4vw, 38px)', margin: '0 0 12px 0' }}>
                  Editorial Board & Committees
                </h2>
                <p style={{ margin: '0 auto', maxWidth: '640px', fontSize: '14.5px', color: themeSubText, lineHeight: 1.6 }}>
                  Official Student & Faculty Committee of Sanrachna at Government Engineering College, Godda. Hover or tap on any team stack below to fan out the cards.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                {[
                  { id: 'all', label: 'All Teams' },
                  { id: 'faculty', label: 'Faculty In-Charge' },
                  { id: 'editor', label: 'Chief Editor' },
                  { id: 'review', label: 'Review Team' },
                  { id: 'photography', label: 'Photography Team' },
                  { id: 'fine-arts', label: 'Fine Arts Team' },
                  { id: 'graphic-content', label: 'Graphic Content Team' },
                  { id: 'public-relations', label: 'Public Relations Team' },
                ].map((tab) => (
                  <button key={tab.id} aria-label={`Filter by ${tab.label}`} onClick={() => setSelectedTeamFilter(tab.id)} className={`team-filter-pill ${selectedTeamFilter === tab.id ? 'active' : ''}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {filteredTeamGroups.map((group) => (
                  <TeamFanStack key={group.id} group={group} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS MODAL */}
        {announcementsOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(17, 24, 39, 0.5)', backdropFilter: 'blur(8px)', zIndex: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }} onClick={() => setAnnouncementsOpen(false)}>
            <div className="glass-modal" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', padding: 'clamp(28px, 4vw, 48px)', boxSizing: 'border-box', overflowY: 'auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close Announcements Modal" onClick={() => setAnnouncementsOpen(false)} className="animated-close-btn" style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Official Notice Board</div>
              <h2 className="elegant-heading" style={{ fontSize: '28px', margin: '0 0 24px 0' }}>Announcements & Updates</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', color: themeSubText, lineHeight: 1.7 }}>
                {liveBoardNotices.length > 0 ? (
                  liveBoardNotices.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '24px',
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(229, 228, 223, 0.8)',
                        borderRadius: '16px',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '4px' }}>
                        {item.tag}
                      </div>
                      <strong style={{ color: themeText }}>{item.title}</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{item.message}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ padding: '24px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(229, 228, 223, 0.8)', borderRadius: '16px' }}>
                      <strong style={{ color: themeText }}>Submissions Open for Edition I (2026)</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>The Editorial Board invites original literary, technical, and artistic contributions from all students, faculty, and staff of GEC Godda.</p>
                    </div>
                    <div style={{ padding: '24px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(229, 228, 223, 0.8)', borderRadius: '16px' }}>
                      <strong style={{ color: themeText }}>Theme of the Year: The Zero (शून्य)</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>Exploring new beginnings, boundless potential, and foundational origins in science and arts.</p>
                    </div>
                    <div style={{ padding: '24px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(229, 228, 223, 0.8)', borderRadius: '16px' }}>
                      <strong style={{ color: themeText }}>Submission Guidelines & Template</strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>Download the official guidelines and submission template PDF files directly from the website's Guidelines section to format your entries correctly.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMING SOON MODAL */}
        {comingSoonOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(10px)', zIndex: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }} onClick={() => setComingSoonOpen(false)}>
            <div className="glass-modal" style={{ width: '100%', maxWidth: '600px', padding: 'clamp(36px, 5vw, 60px) clamp(24px, 4vw, 48px)', boxSizing: 'border-box', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close Coming Soon Modal" onClick={() => setComingSoonOpen(false)} className="animated-close-btn" style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h2 className="elegant-heading" style={{ fontSize: '36px', margin: '0 0 16px 0' }}>Coming Soon</h2>
              <p style={{ fontSize: '18px', color: themeSubText, lineHeight: 1.6, margin: '0 0 30px 0' }}>
                The digital edition of संRACHNA (2026) is currently under compilation. It will be available for download here once the final publication is released.
              </p>
              <button onClick={() => setComingSoonOpen(false)} className="liquid-glass-btn" style={{ padding: '12px 32px' }}>
                Got it, Thanks!
              </button>
            </div>
          </div>
        )}
      </div>

      {openSubmissionPortal && (
        <SubmissionForm onBack={() => setOpenSubmissionPortal(false)} />
      )}
      {openReviewDesk && (
        <ReviewDashboard
          onExit={() => {
            window.history.replaceState(null, '', '/');
            setOpenReviewDesk(false);
          }}
        />
      )}{guidelinesOpen && (
        <GuidelinesPage
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          onBack={() => {
            setGuidelinesOpen(false);
            if (window.location.pathname.toLowerCase().startsWith('/guidelines')) {
              window.history.pushState({}, '', '/');
              setCurrentPath('/');
            }
          }}
          onOpenSubmission={() => {
            setGuidelinesOpen(false);
            setOpenSubmissionPortal(true);
          }}
        />
      )}
      {creatorPassOpen && (
  <CreatorPassModal
    onClose={() => setCreatorPassOpen(false)}
    isDarkMode={isDarkMode}
  />
)}
      <div
  {...creatorTrigger.bind}
  style={{
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    paddingBottom: '4px',
  }}
  title="Press & hold to open Creator Desk"
>
  © 2026 <strong style={{ color: '#D4AF37' }}>संRACHNA Magazine</strong> — Government Engineering College, Godda.
  <span
    style={{
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: '2px',
      width: `${Math.round(creatorTrigger.chargeRatio * 100)}%`,
      background: 'linear-gradient(90deg, #8B1E24, #D4AF37)',
      transition: creatorTrigger.chargeRatio === 0 ? 'width 0.2s ease' : 'none',
    }}
  />
</div>
    </>
  );
}
