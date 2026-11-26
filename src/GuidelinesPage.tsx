import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Feather,
  FileCheck2,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Image,
  LayoutGrid,
  Lock,
  Mail,
  Mic,
  Newspaper,
  Palette,
  Radio,
  Scale,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Type,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

// ===========================================================================
// 1. FLOATING 3D BUBBLES CANVAS ENGINE
// ===========================================================================
interface BubbleParticle {
  angle: number;
  radius: number;
  y: number;
  size: number;
  angularSpeed: number;
  opacity: number;
  screenX: number;
  screenY: number;
  projectedScale: number;
  tone: 'gold' | 'crimson' | 'navy';
}

function Floating3DBubbles({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let mounted = true;
    let rafId: number | null = null;
    let width = 0;
    let height = 0;
    let particles: BubbleParticle[] = [];

    const fov = 440;
    const perspectiveDistance = 520;
    const depthRange = 280;

    const spawn = (w: number, h: number): BubbleParticle => {
      const r = Math.random();
      return {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * Math.max(w, h) * 1.18,
        y: (Math.random() - 0.5) * h * 2,
        size: 1.8 + Math.random() * 4.6,
        angularSpeed: 0.0012 + Math.random() * 0.0011,
        opacity: 0.16 + Math.random() * 0.28,
        screenX: 0,
        screenY: 0,
        projectedScale: 1,
        tone: r > 0.54 ? 'gold' : r > 0.18 ? 'crimson' : 'navy',
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = window.innerWidth < 768 ? 36 : 115;
      particles = Array.from({ length: count }, () => spawn(width, height));
    };

    const tick = () => {
      if (!mounted) return;
      if (document.hidden) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      for (const p of particles) {
        p.angle += p.angularSpeed;
        p.y -= 0.5;
        if (p.y < -height) {
          p.y = height;
          p.radius = Math.random() * Math.max(width, height) * 1.18;
        }
        const denom = Math.max(1, fov + perspectiveDistance + Math.sin(p.angle) * depthRange);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
      }

      particles.sort((a, b) => a.projectedScale - b.projectedScale);

      for (const p of particles) {
        const radius = Math.max(0.6, p.size * p.projectedScale);
        const alpha = Math.min(0.62, isDarkMode ? p.opacity * 1.15 : p.opacity * 0.82);
        ctx.beginPath();
        if (p.tone === 'gold') ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        else if (p.tone === 'crimson') ctx.fillStyle = `rgba(139, 30, 36, ${alpha})`;
        else ctx.fillStyle = `rgba(43, 76, 126, ${alpha})`;
        ctx.arc(p.screenX, p.screenY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

// ===========================================================================
// 2. MORPHING 2D SUN ↔ MOON ANIMATED THEME ICON
// ===========================================================================
function AnimatedThemeIcon({ isDark, maskId }: { isDark: boolean; maskId: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: '18px',
        height: '18px',
        color: isDark ? '#EBD28C' : '#8B1E24',
        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s ease',
        transform: isDark ? 'rotate(-28deg)' : 'rotate(90deg)',
        overflow: 'visible',
      }}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle
            cx={isDark ? '16' : '29'}
            cy={isDark ? '8' : '0'}
            r="8"
            fill="black"
            style={{ transition: 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </mask>
      </defs>

      <circle
        cx="12"
        cy="12"
        r={isDark ? '9.5' : '5'}
        fill="currentColor"
        mask={`url(#${maskId})`}
        style={{ transition: 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      <g
        stroke="currentColor"
        style={{
          transition: 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'scale(0.25) rotate(-45deg)' : 'scale(1) rotate(0deg)',
          transformOrigin: '12px 12px',
        }}
      >
        <line x1="12" y1="1.2" x2="12" y2="3.2" />
        <line x1="12" y1="20.8" x2="12" y2="22.8" />
        <line x1="4.3" y1="4.3" x2="5.7" y2="5.7" />
        <line x1="18.3" y1="18.3" x2="19.7" y2="19.7" />
        <line x1="1.2" y1="12" x2="3.2" y2="12" />
        <line x1="20.8" y1="12" x2="22.8" y2="12" />
        <line x1="4.3" y1="19.7" x2="5.7" y2="18.3" />
        <line x1="18.3" y1="5.7" x2="19.7" y2="4.3" />
      </g>
    </svg>
  );
}

// ===========================================================================
// 3. SCROLL REVEAL & ANIMATED SECTION HEADING
// ===========================================================================
function BlurReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -36px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(14px)',
        transform: visible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 28px, 0) scale(0.97)',
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, filter, transform',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}

function AnimatedSectionTitle({
  title,
  accent,
  subtitle,
  align = 'left',
  isDarkMode,
}: {
  title: string;
  accent?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  isDarkMode: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        textAlign: align,
        opacity: inView ? 1 : 0,
        filter: inView ? 'blur(0px)' : 'blur(12px)',
        transform: inView ? 'translate3d(0, 0, 0)' : 'translate3d(0, 24px, 0)',
        transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
          fontSize: 'clamp(34px, 4.5vw, 54px)',
          fontWeight: 700,
          lineHeight: 1.14,
          color: isDarkMode ? '#FAF9F5' : '#152238',
        }}
      >
        {title}{' '}
        {accent && (
          <span className={isDarkMode ? 'royal-accent-text-dark' : 'royal-accent-text-light'}>
            {accent}
          </span>
        )}
      </h2>

      <div
        style={{
          margin: align === 'center' ? '12px auto 0 auto' : '12px 0 0 0',
          height: '2.5px',
          width: inView ? '88px' : '0px',
          borderRadius: '999px',
          background: isDarkMode
            ? 'linear-gradient(90deg, #8B1E24 0%, #D4AF37 60%, #F5E6B8 100%)'
            : 'linear-gradient(90deg, #8B1E24 0%, #1E3A5F 55%, #C5A059 100%)',
          transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1) 180ms',
        }}
      />

      {subtitle && (
        <p
          style={{
            margin: align === 'center' ? '14px auto 0 auto' : '14px 0 0 0',
            maxWidth: '640px',
            fontSize: '15px',
            lineHeight: 1.7,
            color: isDarkMode ? '#A1A1AA' : '#4B5563',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// 4. KINETIC HERO WORD REVEAL (ZERO CLIPPING • ZERO THEME GLITCH)
// ===========================================================================
const HERO_CYCLE_WORDS = ['poetry.', 'stories.', 'frames.', 'ideas.'];

function KineticHeroWord({ isDarkMode }: { isDarkMode: boolean }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhase('out');
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_CYCLE_WORDS.length);
        setPhase('in');
      }, 380);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span style={{ display: 'inline-block', verticalAlign: 'baseline', overflow: 'visible' }}>
      <span
        key={`${index}-${phase}-${isDarkMode ? 'd' : 'l'}`}
        className={`kinetic-word ${phase === 'in' ? 'dia-word-in' : 'dia-word-out'} ${
          isDarkMode ? 'royal-accent-text-dark' : 'royal-accent-text-light'
        }`}
      >
        {HERO_CYCLE_WORDS[index]}
      </span>
    </span>
  );
}

// ===========================================================================
// 5. ROLLING ODOMETER DIGITS
// ===========================================================================
function DigitReel({ digit, height }: { digit: number; height: number }) {
  return (
    <span style={{ display: 'inline-block', height: `${height}px`, overflow: 'hidden', verticalAlign: 'top' }}>
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translate3d(0, -${digit * height}px, 0)`,
          transition: 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} style={{ height: `${height}px`, lineHeight: `${height}px`, display: 'block', textAlign: 'center' }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function AnimateDigits({
  value,
  minDigits = 3,
  fontSize = 34,
  color,
}: {
  value: number;
  minDigits?: number;
  fontSize?: number;
  color: string;
}) {
  const safeVal = Math.max(0, Math.floor(value));
  const padded = String(safeVal).padStart(minDigits, '0');
  const lineH = Math.round(fontSize * 1.15);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums',
        color,
        lineHeight: `${lineH}px`,
      }}
    >
      {padded.split('').map((ch, idx) => (
        <DigitReel key={`${padded.length}-${idx}`} digit={Number(ch)} height={lineH} />
      ))}
    </span>
  );
}

// ===========================================================================
// 6. SLIDING SPRING PILL SWITCHER
// ===========================================================================
function SlidingPillTabs<T extends string>({
  items,
  activeId,
  onSelect,
  isDarkMode,
  compact = false,
}: {
  items: { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
  isDarkMode: boolean;
  compact?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const sync = () => {
      const btn = btnRefs.current[activeId];
      const wrap = wrapRef.current;
      if (!btn || !wrap) return;
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [activeId, items.length]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        padding: compact ? '4px' : '5px',
        borderRadius: '999px',
        background: isDarkMode ? 'rgba(13, 20, 42, 0.72)' : 'rgba(255, 255, 255, 0.78)',
        border: `1px solid ${isDarkMode ? 'rgba(212, 175, 55, 0.24)' : 'rgba(139, 30, 36, 0.16)'}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: compact ? '4px' : '5px',
          bottom: compact ? '4px' : '5px',
          left: 0,
          width: `${pill.width}px`,
          transform: `translate3d(${pill.left}px, 0, 0)`,
          opacity: pill.ready ? 1 : 0,
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #8B1E24 0%, #5A1220 55%, #1E3A5F 100%)',
          border: '1px solid rgba(212, 175, 55, 0.65)',
          boxShadow: '0 6px 18px rgba(139, 30, 36, 0.32)',
          transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), width 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[item.id] = el;
            }}
            type="button"
            onClick={() => onSelect(item.id)}
            style={{
              position: 'relative',
              zIndex: 1,
              border: 'none',
              background: 'transparent',
              padding: compact ? '7px 14px' : '9px 18px',
              borderRadius: '999px',
              fontSize: compact ? '12px' : '12.5px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              color: isActive ? '#FAF9F5' : isDarkMode ? '#CBD5E1' : '#334155',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.28s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ===========================================================================
// 7. ANIMATED SEARCH INPUT
// ===========================================================================
const SEARCH_HINTS = [
  'Search "Poem" (25–50 lines)...',
  'Search "Articles" (700–900 words)...',
  'Search "Photography" (300 DPI)...',
  'Search "Campus News" or "Alumni"...',
];

function AnimatedSearchInput({
  value,
  onChange,
  isDarkMode,
}: {
  value: string;
  onChange: (val: string) => void;
  isDarkMode: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintIdx, setHintIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (value.length > 0) return;
    const target = SEARCH_HINTS[hintIdx];
    const speed = deleting ? 28 : 52;

    const timer = window.setTimeout(() => {
      if (!deleting && hintText.length < target.length) {
        setHintText(target.slice(0, hintText.length + 1));
      } else if (!deleting && hintText.length === target.length) {
        window.setTimeout(() => setDeleting(true), 1200);
      } else if (deleting && hintText.length > 0) {
        setHintText(target.slice(0, hintText.length - 1));
      } else {
        setDeleting(false);
        setHintIdx((prev) => (prev + 1) % SEARCH_HINTS.length);
      }
    }, speed);

    return () => window.clearTimeout(timer);
  }, [hintText, deleting, hintIdx, value]);

  return (
    <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '370px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 16px',
          borderRadius: '999px',
          background: isDarkMode ? 'rgba(13, 20, 42, 0.78)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: focused
            ? '1.5px solid #D4AF37'
            : `1px solid ${isDarkMode ? 'rgba(212,175,55,0.26)' : 'rgba(139,30,36,0.2)'}`,
          boxShadow: focused
            ? '0 0 0 4px rgba(212, 175, 55, 0.14), 0 12px 28px rgba(139, 30, 36, 0.2)'
            : '0 6px 18px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Search
          size={16}
          color={focused ? '#D4AF37' : isDarkMode ? '#A1A1AA' : '#8B1E24'}
          style={{
            flexShrink: 0,
            transform: focused ? 'scale(1.12) rotate(-6deg)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}
        />
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          {!value && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: isDarkMode ? 'rgba(250,249,245,0.48)' : 'rgba(75,85,99,0.7)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '100%',
              }}
            >
              {hintText}
              <span className="animated-caret">|</span>
            </span>
          )}
          <input
            type="text"
            value={value}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Search guideline categories"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: isDarkMode ? '#FAF9F5' : '#111827',
              fontSize: '13.5px',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            style={{
              border: 'none',
              background: 'rgba(212,175,55,0.2)',
              color: '#D4AF37',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// 8. FROSTED GLASS FOLDER CARDS
// ===========================================================================
interface FolderDoc {
  title: string;
  meta: string;
  tag: string;
  accent: string;
  href?: string;
  downloadName?: string;
}

function GlassFolderCard({
  title,
  subtitle,
  docs,
  isDarkMode,
  primaryActionLabel,
  onPrimaryAction,
}: {
  title: string;
  subtitle: string;
  docs: FolderDoc[];
  isDarkMode: boolean;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((prev) => !prev)}
      style={{
        position: 'relative',
        paddingTop: '78px',
        cursor: 'pointer',
        userSelect: 'none',
        perspective: '1100px',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '216px',
          borderRadius: '26px',
          background: isDarkMode
            ? 'linear-gradient(145deg, rgba(46, 16, 30, 0.92) 0%, rgba(16, 26, 52, 0.96) 100%)'
            : 'linear-gradient(145deg, #E9DFD1 0%, #D9CBB8 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: isDarkMode
            ? '0 26px 60px rgba(0, 0, 0, 0.5)'
            : '0 20px 46px rgba(30, 58, 95, 0.13)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            left: '22px',
            width: '124px',
            height: '26px',
            borderRadius: '14px 18px 0 0',
            background: 'linear-gradient(135deg, #8B1E24 0%, #52101A 100%)',
            border: '1px solid rgba(212, 175, 55, 0.55)',
            borderBottom: 'none',
          }}
        />

        <div style={{ position: 'absolute', inset: '10px 18px auto 18px', height: '140px' }}>
          {docs.map((doc, idx) => {
            const total = docs.length;
            const depthFromFront = total - 1 - idx;
            const closedY = -depthFromFront * 8;
            const closedScale = 1 - depthFromFront * 0.04;
            const openY = -18 - depthFromFront * 37;
            const openX = (idx - (total - 1) / 2) * 14;
            const openRotate = (idx - (total - 1) / 2) * 3.6;

            const cardInner = (
              <div
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '16px',
                  background: isDarkMode
                    ? idx === total - 1
                      ? 'linear-gradient(135deg, #FAF9F5 0%, #EFE8DC 100%)'
                      : 'linear-gradient(135deg, #1E2C50 0%, #131B36 100%)'
                    : idx === total - 1
                    ? 'linear-gradient(135deg, #FFFFFF 0%, #FAF5EC 100%)'
                    : 'linear-gradient(135deg, #F4EFE6 0%, #E7DDD0 100%)',
                  color: idx === total - 1 ? '#111827' : isDarkMode ? '#FAF9F5' : '#1E3A5F',
                  border: `1px solid ${idx === total - 1 ? 'rgba(212,175,55,0.72)' : 'rgba(212,175,55,0.34)'}`,
                  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.72, marginTop: '2px' }}>{doc.meta}</div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: doc.accent,
                    color: '#FAF9F5',
                    flexShrink: 0,
                  }}
                >
                  {doc.tag}
                </span>
              </div>
            );

            return (
              <div
                key={doc.title}
                onClick={(e) => {
                  if (doc.href) e.stopPropagation();
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  zIndex: idx + 2,
                  transform: isOpen
                    ? `translate3d(${openX}px, ${openY}px, 0) rotate(${openRotate}deg) scale(1)`
                    : `translate3d(0, ${closedY}px, 0) scale(${closedScale})`,
                  transition: `transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 35}ms`,
                  willChange: 'transform',
                }}
              >
                {doc.href ? (
                  <a href={doc.href} download={doc.downloadName} style={{ textDecoration: 'none', display: 'block' }}>
                    {cardInner}
                  </a>
                ) : (
                  cardInner
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '154px',
            zIndex: 20,
            borderRadius: '22px 22px 26px 26px',
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            background: isDarkMode
              ? 'linear-gradient(155deg, rgba(255, 255, 255, 0.13) 0%, rgba(15, 23, 46, 0.78) 100%)'
              : 'linear-gradient(155deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 243, 234, 0.76) 100%)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.55)',
            borderLeft: '1px solid rgba(212, 175, 55, 0.34)',
            borderRight: '1px solid rgba(212, 175, 55, 0.34)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.45)',
            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.32), 0 18px 36px rgba(0, 0, 0, 0.18)',
            transformOrigin: 'bottom center',
            transform: isOpen ? 'rotateX(-22deg) translateY(4px)' : 'rotateX(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: 700, color: isDarkMode ? '#FAF9F5' : '#1E3A5F', lineHeight: 1.15 }}>
              {title}
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? 'rgba(250,249,245,0.72)' : '#4B5563', marginTop: '4px' }}>
              {subtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction();
            }}
            aria-label={primaryActionLabel}
            title={primaryActionLabel}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              flexShrink: 0,
              border: '1px solid rgba(212, 175, 55, 0.72)',
              background: 'linear-gradient(135deg, #8B1E24 0%, #4E1018 100%)',
              color: '#F5E6B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(139, 30, 36, 0.36)',
              transform: isOpen ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 9. SCROLL-DRIVEN + HOVER SLIDING DISCLOSURES
// ===========================================================================
interface DisclosureItem {
  num: string;
  tag: string;
  title: string;
  summary: string;
  points: string[];
}

const DISCLOSURES_STACK: DisclosureItem[] = [
  {
    num: '01',
    tag: 'Entry Cap',
    title: 'Maximum Two Entries & Portal Exclusivity',
    summary: 'Every contributor may submit up to two (02) original entries per edition, strictly through the official Sanrachna portal.',
    points: ['Maximum 02 entries per author per edition', 'Late entries are not entertained under any circumstances', 'Open exclusively to GEC Godda students, faculty, staff & alumni'],
  },
  {
    num: '02',
    tag: 'Zero AI',
    title: 'Originality, Anti-Plagiarism & Zero-AI Policy',
    summary: 'Artificial Intelligence (AI) generated write-ups or artwork and any form of plagiarism are strictly prohibited.',
    points: ['100% self-authored manuscripts & self-created visuals only', 'Editorial & originality screening on every entry', 'Authors remain responsible for factual accuracy & citations'],
  },
  {
    num: '03',
    tag: 'Conduct',
    title: 'Respectful Content & Community Boundaries',
    summary: 'Submissions must uphold institutional dignity and avoid sensitive, promotional, or offensive material.',
    points: ['Religious, mythological & derogatory content strictly prohibited', 'No self-promotion, commercial ads, or political interviews', 'Destructive criticism forbidden; constructive ideas reviewed politely'],
  },
  {
    num: '04',
    tag: 'Editorial',
    title: 'Review Discretion, Edits & Copyright Ownership',
    summary: 'Submission does not guarantee publication. Copyright of all published work stays solely with संRACHNA.',
    points: ['Editorial Board may edit for grammar, spelling & length', 'Over-length drafts may be returned for author rewrite', 'Republication elsewhere strictly requires prior acknowledgement'],
  },
];

function SlidingScrollDisclosures({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [indicator, setIndicator] = useState<{ top: number; height: number }>({ top: 0, height: 155 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverLockRef = useRef<boolean>(false);

  const syncIndicator = (idx: number) => {
    const node = itemRefs.current[idx];
    const container = containerRef.current;
    if (!node || !container) return;
    setIndicator({ top: node.offsetTop, height: node.offsetHeight });
  };

  useEffect(() => {
    syncIndicator(activeIdx);
    const onResize = () => syncIndicator(activeIdx);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIdx]);

  useEffect(() => {
    let rafId: number | null = null;
    const evaluateClosestToCenter = () => {
      rafId = null;
      if (hoverLockRef.current) return;
      const viewportCenter = window.innerHeight * 0.48;
      let bestIdx = 0;
      let bestDist = Infinity;

      itemRefs.current.forEach((node, idx) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      setActiveIdx((prev) => (prev === bestIdx ? prev : bestIdx));
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(evaluateClosestToCenter);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    evaluateClosestToCenter();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => {
        hoverLockRef.current = false;
      }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: `${indicator.height}px`,
          transform: `translate3d(0, ${indicator.top}px, 0)`,
          transition: 'transform 0.52s cubic-bezier(0.16, 1, 0.3, 1), height 0.52s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, #4B1020 0%, #8B1E24 48%, #1E3A5F 100%)',
          border: '1px solid rgba(212, 175, 55, 0.78)',
          boxShadow: '0 24px 55px rgba(139, 30, 36, 0.34), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {DISCLOSURES_STACK.map((item, idx) => {
        const isActive = activeIdx === idx;
        return (
          <div
            key={item.num}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            onMouseEnter={() => {
              hoverLockRef.current = true;
              setActiveIdx(idx);
            }}
            onClick={() => setActiveIdx(idx)}
            style={{
              position: 'relative',
              zIndex: 2,
              borderRadius: '26px',
              padding: '26px 28px',
              cursor: 'pointer',
              border: isActive
                ? '1px solid transparent'
                : `1px solid ${isDarkMode ? 'rgba(212,175,55,0.18)' : 'rgba(30,58,95,0.14)'}`,
              background: isActive
                ? 'transparent'
                : isDarkMode
                ? 'rgba(13, 20, 42, 0.78)'
                : 'rgba(255, 255, 255, 0.85)',
              color: isActive ? '#FAF9F5' : isDarkMode ? '#FAF9F5' : '#111827',
              transform: isActive ? 'scale(1.01)' : 'scale(1)',
              transition: 'color 0.35s ease, background 0.35s ease, transform 0.35s ease',
              textAlign: 'left',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontSize: '26px', fontWeight: 700, color: isActive ? '#F5E6B8' : '#C5A059', lineHeight: 1 }}>
                  {item.num}
                </span>
                <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 700, color: isActive ? '#FFFFFF' : isDarkMode ? '#FAF9F5' : '#1E3A5F' }}>
                  {item.title}
                </h3>
              </div>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  background: isActive ? 'rgba(212, 175, 55, 0.24)' : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(139,30,36,0.08)',
                  color: isActive ? '#F5E6B8' : isDarkMode ? '#D4AF37' : '#8B1E24',
                }}
              >
                {item.tag}
              </span>
            </div>

            <p style={{ margin: '10px 0 14px 0', fontSize: '14px', lineHeight: 1.65, color: isActive ? 'rgba(250, 249, 245, 0.9)' : isDarkMode ? '#A1A1AA' : '#4B5563', maxWidth: '680px' }}>
              {item.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
              {item.points.map((pt, pIdx) => (
                <span key={pIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 600, color: isActive ? '#F5E6B8' : isDarkMode ? '#CBD5E1' : '#334155' }}>
                  <Check size={13} />
                  <span>{pt}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================================
// 10. OFFICIAL 12-CATEGORY DATA + CUSTOM ICON ANIMATIONS
// ===========================================================================
interface GuidelinesPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenSubmission: () => void;
}

type CategoryGroup = 'all' | 'writing' | 'media' | 'visual';
type FormatTab = 'english' | 'hindi' | 'visual';
type NavSectionId = 'bento-categories' | 'glass-folders' | 'formatting-studio' | 'editorial-ethics';
type CardTheme = 'crimson' | 'sapphire' | 'plum' | 'champagne';
type IconAnimKind = 'paper' | 'quill' | 'pulse' | 'sway' | 'flame' | 'float';

interface CategorySpec {
  id: string;
  number: string;
  name: string;
  hindiName: string;
  group: Exclude<CategoryGroup, 'all'>;
  domain: string;
  limitLabel: string;
  fileType: string;
  unit: 'words' | 'lines' | 'nos';
  min: number;
  max: number;
  featuredSpan?: boolean;
  cardTheme: CardTheme;
  iconAnim: IconAnimKind;
  icon: LucideIcon;
  summary: string;
  topics: string[];
  specialNote?: string;
  checklist: string[];
}

const CATEGORIES: CategorySpec[] = [
  {
    id: 'articles',
    number: '01',
    name: 'Articles',
    hindiName: 'लेख',
    group: 'writing',
    domain: 'Technical & Non-Technical',
    limitLabel: '700 – 900 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 700,
    max: 900,
    featuredSpan: true,
    cardTheme: 'crimson',
    iconAnim: 'paper',
    icon: FileText,
    summary:
      'In-depth scientific breakthroughs, engineering trends, research summaries, patents, and national or international perspectives.',
    topics: [
      'Scientific breakthroughs & new discoveries in Science and Technology',
      'Nobel Prize winners’ topics & great scientists’ contributions',
      'Research summaries, technical papers, trending research & patents',
      'Emerging trends in engineering fields',
      'National or international technical and non-technical topics',
    ],
    checklist: [
      'Word count strictly within 700 – 900 words',
      'A4 format (Bookman Old 11pt / KrutiDev or Mangal 14pt)',
      '100% original writing (0% AI & plagiarism)',
      'Author brief bio & 300 DPI author photo ready',
    ],
  },
  {
    id: 'journalism',
    number: '02',
    name: 'Journalism',
    hindiName: 'पत्रकारिता',
    group: 'media',
    domain: 'Interviews & Affairs',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    cardTheme: 'sapphire',
    iconAnim: 'pulse',
    icon: Mic,
    summary:
      'Crisp interviews and factual features highlighting great scientific personalities, technocrats, sportspersons, filmmakers, and current affairs.',
    topics: [
      'Interviews of great scientific personalities & technocrats',
      'Conversations with sportspersons & filmmakers',
      'Well-researched current affairs features',
    ],
    specialNote: 'Verify every quote, date, and interviewee credential accurately before submission.',
    checklist: [
      '250 – 500 words strictly maintained',
      'All quotes & facts verified',
      'Editable .doc/.docx with clear descriptive title',
      'Author brief bio & 300 DPI photo attached separately',
    ],
  },
  {
    id: 'mass-communication',
    number: '03',
    name: 'Mass Communication',
    hindiName: 'जनसंचार एवं समीक्षा',
    group: 'media',
    domain: 'Reviews & Critique',
    limitLabel: '400 – 600 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 400,
    max: 600,
    cardTheme: 'plum',
    iconAnim: 'pulse',
    icon: Radio,
    summary:
      'Thoughtful reviews and critical reflections on internationally acclaimed novels, movies, and impactful storytelling.',
    topics: [
      'Reviews of internationally acclaimed novels',
      'Critical reviews of internationally acclaimed movies',
      'Analytical perspectives on global literature & cinema',
    ],
    checklist: [
      '400 – 600 words limit followed',
      'Original, respectful critique free from hate',
      'A4 layout with 1.5 line spacing & 6pt paragraph spacing',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'biography',
    number: '04',
    name: 'Biography',
    hindiName: 'जीवनी एवं डायरी',
    group: 'writing',
    domain: 'Profiles & Diaries',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    cardTheme: 'champagne',
    iconAnim: 'float',
    icon: UserCheck,
    summary:
      'Inspiring life sketches of great scientists and iconic personalities alongside authentic diary entries.',
    topics: [
      'Biographies of great scientists & pioneers',
      'Life journeys of inspiring personalities',
      'Reflective and authentic diary entries',
    ],
    checklist: [
      '250 – 500 words limit followed',
      'Biographical dates & milestones verified',
      'Zero religious, mythological, or self-promotional content',
      'Editable .doc/.docx with bio & 300 DPI photo',
    ],
  },
  {
    id: 'poem',
    number: '05',
    name: 'Poem',
    hindiName: 'कविता',
    group: 'writing',
    domain: 'Technical & Literary',
    limitLabel: '25 – 50 lines',
    fileType: '.doc / .docx',
    unit: 'lines',
    min: 25,
    max: 50,
    featuredSpan: true,
    cardTheme: 'plum',
    iconAnim: 'quill',
    icon: Feather,
    summary:
      'Original Hindi or English poetry spanning Technical/Scientific and Non-Technical creative expression.',
    topics: [
      'Non-technical & literary poems in Hindi or English',
      'Scientific, technological, or "The Zero (शून्य)" themed verses',
      'Structured stanzas or expressive free verse',
    ],
    specialNote: 'Preserve stanza breaks cleanly inside your Word file; avoid sending screenshots or Canva posters.',
    checklist: [
      '25 – 50 lines strictly maintained',
      'Hindi in KrutiDev/Mangal (14pt) or English in Bookman Old (11pt)',
      '100% self-composed (no AI or forwarded verses)',
      'Clear title, author bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'essay-story',
    number: '06',
    name: 'Essay / Short Story',
    hindiName: 'निबंध एवं लघुकथा',
    group: 'writing',
    domain: 'Fiction & Essays',
    limitLabel: '300 – 600 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 300,
    max: 600,
    cardTheme: 'crimson',
    iconAnim: 'paper',
    icon: BookOpen,
    summary:
      'Original essays and short stories blending scientific curiosity with human narratives and campus reflections.',
    topics: [
      'Technical & scientific essays or speculative fiction',
      'Non-technical personal essays & original short stories',
      'Narratives around campus life, ethics, or "The Zero (शून्य)"',
    ],
    checklist: [
      '300 – 600 words strictly maintained',
      'A4 specs: 1" margins, 1.5 line spacing, 6pt after paragraph',
      'Free from religious, mythological, or hurtful targeting content',
      'Editable .doc/.docx with bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'campus-news',
    number: '07',
    name: 'Campus News',
    hindiName: 'परिसर समाचार',
    group: 'media',
    domain: 'Campus & Clubs',
    limitLabel: '500 – 700 words',
    fileType: '.doc + 300 DPI Img',
    unit: 'words',
    min: 500,
    max: 700,
    featuredSpan: true,
    cardTheme: 'sapphire',
    iconAnim: 'paper',
    icon: Newspaper,
    summary:
      'Official chronicles of GEC Godda—seminars, exhibitions, symposiums, placement highlights, awards, and official club event reports.',
    topics: [
      'Seminars, exhibitions, symposiums & technical workshops',
      'Placement highlights & institutional milestones',
      'Awards (College, District, State, National & International Level)',
      'Campus interviews (NO political or personal interviews)',
      'Official Club Event Reports',
    ],
    specialNote: 'Mandatory Rule: Any Club Event Report must be submitted by the Club Head ONLY. No political or personal interviews.',
    checklist: [
      '500 – 700 words limit followed',
      'Club Event Report submitted by Club Head ONLY',
      'No political or personal interviews included',
      'Event photos (300 DPI) uploaded separately, NOT inside Word doc',
    ],
  },
  {
    id: 'career-entrepreneurship',
    number: '08',
    name: 'Career & Entrepreneurship',
    hindiName: 'करियर एवं उद्यमिता',
    group: 'media',
    domain: 'Startups & Careers',
    limitLabel: '150 – 250 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 150,
    max: 250,
    cardTheme: 'champagne',
    iconAnim: 'float',
    icon: Briefcase,
    summary:
      'Concise startup spotlights from national, international, and nearby institutional innovation ecosystems.',
    topics: [
      'Startup spotlights in national & international arenas',
      'Entrepreneurship & innovation at nearby institutions',
      'Crisp career insights & founder takeaways',
    ],
    specialNote: 'Self-promotion or commercial brand promotion is strictly forbidden.',
    checklist: [
      '150 – 250 words crisp length maintained',
      'Zero self-promotion or commercial advertising',
      'Editable .doc/.docx formatted to A4 standards',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'alumni-corner',
    number: '12',
    name: 'Alumni Corner',
    hindiName: 'पूर्व छात्र संवाद',
    group: 'media',
    domain: 'Alumni Voices',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    cardTheme: 'crimson',
    iconAnim: 'float',
    icon: GraduationCap,
    summary:
      'Dedicated column for GEC Godda alumni to share career journeys, industry lessons, and cherished campus memories.',
    topics: [
      'Career journeys, higher studies & real-world insights',
      'Cherished campus memories from GEC Godda',
      'Mentorship advice for current undergraduate batches',
    ],
    checklist: [
      '250 – 500 words limit followed',
      'Batch & branch mentioned in brief author biography',
      'Editable .doc/.docx formatted to A4 specs',
      '300 DPI author photograph ready',
    ],
  },
  {
    id: 'artworks',
    number: '09',
    name: 'Drawing / Painting / Artworks',
    hindiName: 'चित्रकला एवं कलाकृति',
    group: 'visual',
    domain: 'Fine & Digital Arts',
    limitLabel: '1 – 2 nos',
    fileType: '.JPG / .PNG / .GIF',
    unit: 'nos',
    min: 1,
    max: 2,
    featuredSpan: true,
    cardTheme: 'champagne',
    iconAnim: 'sway',
    icon: Palette,
    summary:
      'Hand-drawn sketches, traditional paintings, original digital illustrations, visual riddles, and picture stories.',
    topics: [
      'Sketches in scientific as well as non-scientific arenas',
      'Original paintings & traditional artwork',
      'Original digital arts (strictly non-AI)',
      'Visual riddles & creative picture stories',
    ],
    specialNote: 'Do NOT embed images inside a Word document. Upload high-res 300 DPI files separately with a short description.',
    checklist: [
      '1 – 2 original works (max 2 entries per author total)',
      '300 DPI .jpg, .png, or .gif file (NOT inside Word doc)',
      'Short artwork description written clearly',
      'Artist brief bio & 300 DPI artist photo ready',
    ],
  },
  {
    id: 'photography',
    number: '10',
    name: 'Photography',
    hindiName: 'छायाचित्रण',
    group: 'visual',
    domain: 'Visual Storytelling',
    limitLabel: '1 – 2 nos',
    fileType: '.JPG / .PNG / .GIF',
    unit: 'nos',
    min: 1,
    max: 2,
    cardTheme: 'sapphire',
    iconAnim: 'pulse',
    icon: Camera,
    summary:
      'Scientific and non-scientific photographs paired with an appropriate caption and short story behind the frame.',
    topics: [
      'Scientific, engineering, or macro photography',
      'Campus life, architecture, nature & candid moments',
      'Visual interpretations of "The Zero (शून्य)"',
    ],
    specialNote: 'Include an appropriate caption & short description. Submit raw/300 DPI image files directly—never inside Word.',
    checklist: [
      '1 – 2 original self-clicked photographs',
      '300 DPI .jpg / .png / .gif file (no WhatsApp compression)',
      'Appropriate caption & short description included',
      'Photographer bio & 300 DPI author photo ready',
    ],
  },
  {
    id: 'remembrance',
    number: '11',
    name: 'Remembrance / Observance',
    hindiName: 'स्मृति एवं दिवस',
    group: 'writing',
    domain: 'Commemoration',
    limitLabel: '500 – 700 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 500,
    max: 700,
    cardTheme: 'plum',
    iconAnim: 'flame',
    icon: Flame,
    summary:
      'Dignified tributes honoring national commemoration days such as Vijay Diwas and historic observances.',
    topics: [
      'National commemoration days such as Vijay Diwas',
      'Historic scientific, civic, or institutional observances',
      'Respectful reflections honoring heritage & values',
    ],
    specialNote: 'Religious or mythological content is strictly prohibited.',
    checklist: [
      '500 – 700 words strictly maintained',
      'Historically accurate & free from religious/mythological content',
      'A4 format with bottom-centre page numbers',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
];

const QUICK_IDEA_MATCHES = [
  { label: 'Movie / Novel Review', targetId: 'mass-communication' },
  { label: 'Diary Entry', targetId: 'biography' },
  { label: 'Club Event Report', targetId: 'campus-news' },
  { label: 'Interview', targetId: 'journalism' },
  { label: 'Sketch / Riddle', targetId: 'artworks' },
  { label: 'Startup Spotlight', targetId: 'career-entrepreneurship' },
  { label: 'Vijay Diwas Tribute', targetId: 'remembrance' },
];

const EDITORIAL_STEPS = [
  {
    step: '01',
    title: 'Upload on Portal',
    desc: 'Format your manuscript or 300 DPI artwork and submit it directly through the official Sanrachna portal.',
    icon: Send,
  },
  {
    step: '02',
    title: 'Editorial & Originality Review',
    desc: 'Our Review Team checks originality, factual accuracy, category fit, and light copy-edits without changing your voice.',
    icon: FileCheck2,
  },
  {
    step: '03',
    title: 'Print & Digital Publication',
    desc: 'Selected pieces are typeset for Edition I and featured in both print and digital showcases with full contributor credit.',
    icon: Award,
  },
];

// ===========================================================================
// 11. BENTO TILE WITH SCROLL-HOVER WAVE + ANIMATED CATEGORY ICONS
// ===========================================================================
function getCardGradients(theme: CardTheme, isDarkMode: boolean) {
  if (isDarkMode) {
    switch (theme) {
      case 'crimson':
        return {
          bg: 'linear-gradient(150deg, rgba(139, 30, 36, 0.34) 0%, rgba(28, 14, 30, 0.88) 54%, rgba(11, 16, 36, 0.94) 100%)',
          aura: 'rgba(190, 18, 60, 0.24)',
          border: 'rgba(212, 175, 55, 0.28)',
          badgeBg: 'rgba(139, 30, 36, 0.36)',
        };
      case 'sapphire':
        return {
          bg: 'linear-gradient(150deg, rgba(30, 58, 95, 0.44) 0%, rgba(15, 25, 54, 0.88) 56%, rgba(9, 14, 30, 0.95) 100%)',
          aura: 'rgba(56, 114, 184, 0.24)',
          border: 'rgba(147, 197, 253, 0.22)',
          badgeBg: 'rgba(30, 58, 95, 0.45)',
        };
      case 'plum':
        return {
          bg: 'linear-gradient(150deg, rgba(88, 28, 58, 0.4) 0%, rgba(24, 15, 38, 0.88) 56%, rgba(10, 14, 30, 0.95) 100%)',
          aura: 'rgba(162, 54, 108, 0.22)',
          border: 'rgba(212, 175, 55, 0.26)',
          badgeBg: 'rgba(88, 28, 58, 0.42)',
        };
      case 'champagne':
        return {
          bg: 'linear-gradient(150deg, rgba(197, 160, 89, 0.22) 0%, rgba(22, 24, 44, 0.88) 54%, rgba(10, 14, 30, 0.95) 100%)',
          aura: 'rgba(212, 175, 55, 0.22)',
          border: 'rgba(212, 175, 55, 0.32)',
          badgeBg: 'rgba(212, 175, 55, 0.16)',
        };
    }
  } else {
    switch (theme) {
      case 'crimson':
        return {
          bg: 'linear-gradient(150deg, rgba(255, 247, 246, 0.96) 0%, rgba(249, 232, 230, 0.88) 55%, rgba(244, 235, 224, 0.9) 100%)',
          aura: 'rgba(139, 30, 36, 0.14)',
          border: 'rgba(139, 30, 36, 0.22)',
          badgeBg: 'rgba(139, 30, 36, 0.1)',
        };
      case 'sapphire':
        return {
          bg: 'linear-gradient(150deg, rgba(247, 250, 255, 0.96) 0%, rgba(232, 240, 250, 0.9) 55%, rgba(243, 238, 230, 0.9) 100%)',
          aura: 'rgba(30, 58, 95, 0.14)',
          border: 'rgba(30, 58, 95, 0.2)',
          badgeBg: 'rgba(30, 58, 95, 0.1)',
        };
      case 'plum':
        return {
          bg: 'linear-gradient(150deg, rgba(253, 247, 250, 0.96) 0%, rgba(244, 232, 240, 0.88) 55%, rgba(246, 239, 230, 0.9) 100%)',
          aura: 'rgba(88, 28, 58, 0.14)',
          border: 'rgba(88, 28, 58, 0.2)',
          badgeBg: 'rgba(88, 28, 58, 0.1)',
        };
      case 'champagne':
        return {
          bg: 'linear-gradient(150deg, rgba(255, 252, 244, 0.97) 0%, rgba(248, 240, 222, 0.9) 55%, rgba(242, 233, 215, 0.92) 100%)',
          aura: 'rgba(197, 160, 89, 0.2)',
          border: 'rgba(197, 160, 89, 0.34)',
          badgeBg: 'rgba(197, 160, 89, 0.18)',
        };
    }
  }
}

function BentoCategoryTile({
  cat,
  index,
  isDarkMode,
  onSelect,
}: {
  cat: CategorySpec;
  index: number;
  isDarkMode: boolean;
  onSelect: () => void;
}) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });
  const [inView, setInView] = useState(false);
  const [scrollFocused, setScrollFocused] = useState(false);
  const Icon = cat.icon;
  const palette = getCardGradients(cat.cardTheme, isDarkMode);

  useEffect(() => {
    const el = tileRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    // 1. One-time 3D unfold reveal
    const revealObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          revealObs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    // 2. Subtle scroll-hover wave when card crosses the middle band of viewport
    const focusObs = new IntersectionObserver(
      ([entry]) => {
        setScrollFocused(entry.isIntersecting);
      },
      { threshold: 0.45, rootMargin: '-22% 0px -22% 0px' }
    );

    revealObs.observe(el);
    focusObs.observe(el);
    return () => {
      revealObs.disconnect();
      focusObs.disconnect();
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };

  const staggerMs = (index % 4) * 75;
  const isElevated = spot.active || scrollFocused;

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onSelect}
      onMouseMove={handleMove}
      onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
      className={`bento-tile ${cat.featuredSpan ? 'bento-span-2' : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '26px',
        padding: '24px 24px 22px 24px',
        border: `1px solid ${
          spot.active
            ? 'rgba(212, 175, 55, 0.82)'
            : scrollFocused
            ? 'rgba(212, 175, 55, 0.52)'
            : palette.border
        }`,
        background: palette.bg,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow: spot.active
          ? isDarkMode
            ? '0 24px 56px rgba(139, 30, 36, 0.36), inset 0 1px 2px rgba(255,255,255,0.22)'
            : '0 22px 48px rgba(30, 58, 95, 0.16), inset 0 1px 2px rgba(255,255,255,1)'
          : scrollFocused
          ? isDarkMode
            ? '0 18px 42px rgba(139, 30, 36, 0.22), inset 0 1px 1px rgba(212,175,55,0.2)'
            : '0 16px 36px rgba(139, 30, 36, 0.11), inset 0 1px 2px rgba(255,255,255,0.95)'
          : isDarkMode
          ? '0 14px 36px rgba(0, 0, 0, 0.34)'
          : '0 10px 28px rgba(30, 58, 95, 0.07)',
        opacity: inView ? 1 : 0,
        filter: inView ? 'blur(0px)' : 'blur(10px)',
        transform: !inView
          ? 'perspective(1000px) translate3d(0, 44px, 0) rotateX(9deg) scale(0.94)'
          : spot.active
          ? 'perspective(1000px) translate3d(0, -7px, 0) rotateX(0deg) scale(1.012)'
          : scrollFocused
          ? 'perspective(1000px) translate3d(0, -3px, 0) rotateX(0deg) scale(1.005)'
          : 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg) scale(1)',
        transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${staggerMs}ms, filter 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${staggerMs}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${inView ? 0 : staggerMs}ms, border-color 0.35s ease, box-shadow 0.4s ease`,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '220px',
        fontFamily: 'inherit',
        willChange: 'transform, opacity, filter',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-45px',
          left: '-45px',
          width: '170px',
          height: '170px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${palette.aura} 0%, transparent 72%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: spot.active ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(290px circle at ${spot.x}px ${spot.y}px, ${
            isDarkMode ? 'rgba(212, 175, 55, 0.22)' : 'rgba(212, 175, 55, 0.26)'
          }, transparent 70%)`,
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '14px',
          top: '-12px',
          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
          fontSize: '92px',
          fontWeight: 700,
          lineHeight: 1,
          color: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(139, 30, 36, 0.07)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {cat.number}
      </span>

      {/* Top Row: Animated Category Icon Badge + Limit Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', position: 'relative', zIndex: 2 }}>
        <span
          className={`gp-icon-badge ${inView ? 'gp-icon-loaded' : ''}`}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isElevated
              ? 'linear-gradient(135deg, #8B1E24 0%, #D4AF37 100%)'
              : palette.badgeBg,
            color: isElevated ? '#FFFFFF' : isDarkMode ? '#F5E6B8' : '#8B1E24',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: isElevated ? '0 8px 20px rgba(139, 30, 36, 0.3)' : 'none',
            transition: 'all 0.35s ease',
          }}
        >
          <span className={`icon-anim-${cat.iconAnim}`} style={{ display: 'inline-flex' }}>
            <Icon size={19} />
          </span>
        </span>

        <span
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.3px',
            background: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255, 255, 255, 0.72)',
            color: isDarkMode ? '#F5E6B8' : '#8B1E24',
            border: '1px solid rgba(212, 175, 55, 0.36)',
          }}
        >
          {cat.limitLabel}
        </span>
      </div>

      {/* Middle Row: Title + Summary */}
      <div style={{ margin: '18px 0 16px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: isDarkMode ? '#D4AF37' : '#8B1E24', opacity: 0.88 }}>
          {cat.domain}
        </div>
        <h3
          style={{
            margin: '5px 0 0 0',
            fontFamily: "'Playfair Display', serif",
            fontSize: cat.featuredSpan ? '24px' : '20px',
            fontWeight: 700,
            color: isDarkMode ? '#FAF9F5' : '#152238',
            lineHeight: 1.22,
          }}
        >
          {cat.name}{' '}
          <span style={{ fontSize: '13.5px', fontWeight: 500, color: isDarkMode ? '#D4AF37' : '#8B1E24', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ({cat.hindiName})
          </span>
        </h3>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            lineHeight: 1.6,
            color: isDarkMode ? '#CBD5E1' : '#4B5563',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {cat.summary}
        </p>
      </div>

      {/* Bottom Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(139,30,36,0.12)'}`,
          fontSize: '11.5px',
          fontWeight: 700,
          color: isDarkMode ? '#E2E8F0' : '#334155',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span>{cat.fileType}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: isDarkMode ? '#F5E6B8' : '#8B1E24',
            transform: isElevated ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.3s ease',
          }}
        >
          <span>View Rules</span>
          <ArrowRight size={13} />
        </span>
      </div>
    </button>
  );
}

// ===========================================================================
// 12. MAIN PREMIUM GUIDELINES PAGE
// ===========================================================================
const RAIL_NAV_ITEMS: { id: NavSectionId; label: string; icon: LucideIcon }[] = [
  { id: 'bento-categories', label: 'Categories', icon: LayoutGrid },
  { id: 'glass-folders', label: 'Official Kit', icon: FolderOpen },
  { id: 'formatting-studio', label: 'Formatting', icon: Type },
  { id: 'editorial-ethics', label: 'Rules & Ethics', icon: Scale },
];

export default function GuidelinesPage({
  isDarkMode,
  onToggleTheme,
  onBack,
  onOpenSubmission,
}: GuidelinesPageProps) {
  const [activeNav, setActiveNav] = useState<NavSectionId>('bento-categories');
  const [activeGroup, setActiveGroup] = useState<CategoryGroup>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalCatId, setActiveModalCatId] = useState<string | null>(null);
  const [formatTab, setFormatTab] = useState<FormatTab>('english');
  const [specimenMode, setSpecimenMode] = useState<'ready' | 'rejected'>('ready');
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean[]>>({});
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDocked, setIsDocked] = useState(false);
  const [railHovered, setRailHovered] = useState(false);
  const [checklistShake, setChecklistShake] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Scroll progress + Active section + Smooth Left-Rail Dock transition
  useEffect(() => {
    const sections: NavSectionId[] = [
      'bento-categories',
      'glass-folders',
      'formatting-studio',
      'editorial-ethics',
    ];

    const onScroll = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(100, Math.max(0, (y / maxScroll) * 100)));
      setIsDocked(y > 180);

      const marker = window.innerHeight * 0.35;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= marker) {
          setActiveNav(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalCatId(null);
        setShowLockHint(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredCategories = CATEGORIES.filter((cat) => {
    const matchesGroup = activeGroup === 'all' || cat.group === activeGroup;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      cat.name.toLowerCase().includes(q) ||
      cat.hindiName.toLowerCase().includes(q) ||
      cat.domain.toLowerCase().includes(q) ||
      cat.limitLabel.toLowerCase().includes(q) ||
      cat.topics.some((t) => t.toLowerCase().includes(q));
    return matchesGroup && matchesQuery;
  });

  const modalCat = CATEGORIES.find((c) => c.id === activeModalCatId) ?? null;

  const toggleCheck = (catId: string, total: number, idx: number) => {
    setShowLockHint(false);
    setCheckedMap((prev) => {
      const existing = prev[catId] ?? Array(total).fill(false);
      return { ...prev, [catId]: existing.map((v, i) => (i === idx ? !v : v)) };
    });
  };

  const handleCopyRules = async (cat: CategorySpec) => {
    const text = [
      `संRACHNA (GEC Godda) — Official Guidelines`,
      `${cat.number}. ${cat.name} (${cat.hindiName})`,
      `Limit: ${cat.limitLabel} | Format: ${cat.fileType}`,
      ``,
      `Accepted Scope:`,
      ...cat.topics.map((t) => `• ${t}`),
      ``,
      cat.unit === 'nos'
        ? `Visual Spec: 300 DPI (.jpg, .png, .gif) uploaded separately—never inside Word doc.`
        : `Text Spec: A4 (8.27 x 11.69 in), 1" margins, 1.5 line spacing, 6pt after paragraph. English: Bookman Old 11pt (Heading 14pt Bold). Hindi: KrutiDev/Mangal 14pt (Heading 16pt).`,
      ``,
      `Theme: THE ZERO (शून्य) | Max 2 entries per author | Strictly 0% AI & Plagiarism.`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(cat.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const scrollToAnchor = (id: NavSectionId) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerDownload = (href: string, filename: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const socialChannels = [
    {
      name: 'GEC Godda Website',
      handle: 'gecgodda.ac.in',
      href: 'https://gecgodda.ac.in',
      svg: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      handle: '@sanrachna.magazine',
      href: 'https://instagram.com/sanrachna.magazine',
      svg: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      handle: '@sanrachna.magazine',
      href: 'https://youtube.com/@sanrachna.magazine',
      svg: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      handle: '@sanrachna.magazine',
      href: 'https://linkedin.com/company/sanrachna-magazine',
      svg: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
  ];

  const bg = isDarkMode ? '#070B19' : '#FAF9F5';
  const textMain = isDarkMode ? '#FAF9F5' : '#152238';
  const textSub = isDarkMode ? '#A1A1AA' : '#4B5563';
  const hairline = isDarkMode ? 'rgba(212, 175, 55, 0.22)' : 'rgba(139, 30, 36, 0.14)';

  return (
    <div
      className="san-awwwards-gp"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bg,
        color: textMain,
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        position: 'relative',
        overflowX: 'clip',
        transition: 'background-color 0.4s ease, color 0.4s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Noto+Serif+Devanagari:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        .san-awwwards-gp * { box-sizing: border-box; }

        /* Pure CSS Gradient Text Classes — Immune to Theme Switch Box Glitch */
        .royal-accent-text-dark {
          display: inline-block;
          font-style: italic;
          background-image: linear-gradient(115deg, #FFF5D6 0%, #D4AF37 45%, #E11D48 82%, #F5E6B8 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: royalFlow 6s ease infinite;
        }

        .royal-accent-text-light {
          display: inline-block;
          font-style: italic;
          background-image: linear-gradient(115deg, #8B1E24 0%, #9F1239 42%, #1E3A5F 78%, #A67C2E 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: royalFlow 6s ease infinite;
        }

        .kinetic-word {
          padding: 0.04em 0.14em 0.18em 0.04em;
          line-height: 1.24;
        }

        @keyframes diaWipeIn {
          0% { opacity: 0; filter: blur(10px); transform: translateY(10px) scale(0.97); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0) scale(1); }
        }
        @keyframes diaWipeOut {
          0% { opacity: 1; filter: blur(0px); transform: translateY(0); }
          100% { opacity: 0; filter: blur(10px); transform: translateY(-10px); }
        }
        .dia-word-in { animation: diaWipeIn 0.62s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .dia-word-out { animation: diaWipeOut 0.36s ease forwards; }

        @keyframes caretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .animated-caret { display: inline-block; margin-left: 2px; color: #D4AF37; font-weight: 700; animation: caretBlink 1s infinite; }

        @keyframes zeroOrbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes royalFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sheenPass {
          0% { transform: translateX(-140%) skewX(-24deg); }
          100% { transform: translateX(260%) skewX(-24deg); }
        }
        @keyframes modalPopIn {
          from { opacity: 0; filter: blur(12px); transform: translateY(24px) scale(0.96); }
          to { opacity: 1; filter: blur(0px); transform: translateY(0) scale(1); }
        }
        @keyframes footerHaloPulse {
          0%, 100% { opacity: 0.45; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.78; transform: translateX(-50%) scale(1.08); }
        }

        /* Bespoke Category Icon Load & Idle Micro-Animations */
        @keyframes iconDrawPop {
          0% { opacity: 0; transform: scale(0.55) rotate(-14deg); }
          65% { opacity: 1; transform: scale(1.1) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .gp-icon-badge.gp-icon-loaded {
          animation: iconDrawPop 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes animQuill {
          0%, 100% { transform: rotate(0deg) translate(0, 0); }
          35% { transform: rotate(-11deg) translate(1.5px, -2px); }
          65% { transform: rotate(7deg) translate(-1px, 1px); }
        }
        @keyframes animPaper {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2.5px) rotate(-3deg); }
        }
        @keyframes animPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.13); }
        }
        @keyframes animSway {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(10deg); }
          70% { transform: rotate(-10deg); }
        }
        @keyframes animFlame {
          0%, 100% { transform: scale(1) translateY(0); }
          40% { transform: scale(1.12, 1.16) translateY(-1.5px); }
          75% { transform: scale(0.95, 1.05) translateY(0.5px); }
        }
        @keyframes animFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        .icon-anim-quill { animation: animQuill 3.4s ease-in-out infinite; }
        .icon-anim-paper { animation: animPaper 3.6s ease-in-out infinite; }
        .icon-anim-pulse { animation: animPulse 2.8s ease-in-out infinite; }
        .icon-anim-sway  { animation: animSway  3.8s ease-in-out infinite; }
        .icon-anim-flame { animation: animFlame 2.4s ease-in-out infinite; }
        .icon-anim-float { animation: animFloat 3.2s ease-in-out infinite; }

        /* Modal Checklist Shake when locked button is clicked */
        @keyframes lockedShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .gp-shake {
          animation: lockedShake 0.44s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .gp-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 36px;
        }

        /* Extra left breathing room on desktop so left rail NEVER overlaps content */
        @media (min-width: 1120px) and (max-width: 1460px) {
          .gp-inner {
            padding-left: 96px;
            padding-right: 36px;
          }
        }

        /* Top Capsule Header (Morphs away smoothly on desktop when docked to left rail) */
        .gp-capsule-wrap {
          position: sticky;
          top: 14px;
          z-index: 80;
          padding: 0 20px;
          pointer-events: none;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, filter 0.45s ease;
        }

        @media (min-width: 1120px) {
          .gp-capsule-wrap.is-docked {
            opacity: 0;
            filter: blur(8px);
            transform: translate3d(-48px, -18px, 0) scale(0.94);
            pointer-events: none;
          }
        }

        .gp-capsule-nav {
          pointer-events: auto;
          max-width: 1200px;
          margin: 0 auto;
          padding: 9px 14px 9px 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: ${isDarkMode ? 'rgba(9, 14, 30, 0.82)' : 'rgba(255, 253, 249, 0.88)'};
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(212, 175, 55, 0.42);
          box-shadow: ${isDarkMode
            ? '0 18px 46px rgba(0, 0, 0, 0.56), inset 0 1px 1px rgba(255,255,255,0.14)'
            : '0 16px 40px rgba(30, 58, 95, 0.11), inset 0 1px 2px rgba(255,255,255,1)'};
        }

        /* DESKTOP LEFT-SHIFT FLOATING VERTICAL GLASS RAIL */
        .gp-left-rail {
          display: none;
        }
        .gp-topright-dock {
          display: none;
        }

        @media (min-width: 1120px) {
          .gp-left-rail {
            position: fixed;
            left: 18px;
            top: 50%;
            z-index: 95;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 10px;
            border-radius: 28px;
            background: ${isDarkMode ? 'rgba(9, 14, 30, 0.86)' : 'rgba(255, 253, 249, 0.92)'};
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid rgba(212, 175, 55, 0.45);
            box-shadow: ${isDarkMode
              ? '0 22px 54px rgba(0, 0, 0, 0.58), inset 0 1px 1px rgba(255,255,255,0.14)'
              : '0 18px 44px rgba(30, 58, 95, 0.14), inset 0 1px 2px rgba(255,255,255,1)'};
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, width 0.42s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .gp-topright-dock {
            position: fixed;
            top: 16px;
            right: 22px;
            z-index: 95;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 7px 10px;
            border-radius: 999px;
            background: ${isDarkMode ? 'rgba(9, 14, 30, 0.86)' : 'rgba(255, 253, 249, 0.92)'};
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid rgba(212, 175, 55, 0.46);
            box-shadow: ${isDarkMode
              ? '0 18px 42px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255,255,255,0.14)'
              : '0 14px 36px rgba(30, 58, 95, 0.14), inset 0 1px 2px rgba(255,255,255,1)'};
            transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          }
        }

        .gp-brand-wordmark {
          font-family: 'Noto Serif Devanagari', 'Rozha One', 'Playfair Display', serif;
          font-weight: 700;
          font-size: 19px;
          letter-spacing: 0.4px;
          color: ${isDarkMode ? '#EBD28C' : '#8B1E24'};
          line-height: 1.2;
        }

        .gp-glass-pill {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.44);
          background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: ${textMain};
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          font-family: inherit;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gp-glass-pill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent);
          transform: translateX(-140%) skewX(-24deg);
        }
        .gp-glass-pill:hover {
          transform: translateY(-2px);
          border-color: #EBD28C;
          background: linear-gradient(135deg, #8B1E24 0%, #4E1020 100%);
          color: #FFFFFF;
          box-shadow: 0 14px 30px rgba(139, 30, 36, 0.32);
        }
        .gp-glass-pill:hover::after {
          animation: sheenPass 0.8s ease;
        }

        .gp-magnetic-cta {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 26px;
          border-radius: 999px;
          border: 1px solid #EBD28C;
          background: linear-gradient(135deg, #8B1E24 0%, #9F1239 46%, #1E3A5F 100%);
          background-size: 200% 200%;
          animation: royalFlow 6s ease infinite;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 12px 30px rgba(139, 30, 36, 0.38), inset 0 1.5px 2px rgba(255,255,255,0.4);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gp-magnetic-cta::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
          transform: translateX(-140%) skewX(-24deg);
        }
        .gp-magnetic-cta:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 18px 40px rgba(139, 30, 36, 0.48), 0 0 24px rgba(212, 175, 55, 0.25);
        }
        .gp-magnetic-cta:hover::after {
          animation: sheenPass 0.8s ease;
        }

        .gp-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(139, 30, 36, 0.45) 25%, rgba(212, 175, 55, 0.72) 50%, rgba(30, 58, 95, 0.45) 75%, transparent 100%);
        }

        .gp-idea-chip {
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid ${hairline};
          background: ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)'};
          color: ${textSub};
          cursor: pointer;
          font-family: inherit;
          transition: all 0.28s ease;
        }
        .gp-idea-chip:hover {
          border-color: #D4AF37;
          color: ${isDarkMode ? '#F5E6B8' : '#8B1E24'};
          transform: translateY(-2px);
          background: ${isDarkMode ? 'rgba(212,175,55,0.12)' : 'rgba(139,30,36,0.07)'};
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }
        .bento-span-2 {
          grid-column: span 2;
        }

        .gp-folders-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px;
        }

        .gp-format-bento {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 28px;
          align-items: stretch;
        }

        .gp-journey-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .gp-disclosures-split {
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 40px;
          align-items: start;
        }

        .gp-sticky-desktop {
          position: sticky;
          top: 94px;
        }

        .gp-social-chip {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid ${hairline};
          background: ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.78)'};
          backdrop-filter: blur(14px);
          color: ${textMain};
          text-decoration: none;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gp-social-chip:hover {
          transform: translateY(-4px);
          border-color: #D4AF37;
          background: linear-gradient(135deg, rgba(139,30,36,0.92) 0%, rgba(30,58,95,0.92) 100%);
          color: #FFFFFF;
          box-shadow: 0 16px 34px rgba(139, 30, 36, 0.32);
        }
        .gp-social-chip:hover span {
          color: rgba(250, 249, 245, 0.88) !important;
        }

        .gp-footer-link {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 14px;
          font-weight: 600;
          color: ${textMain};
          cursor: pointer;
          font-family: inherit;
          transition: color 0.25s ease, transform 0.25s ease;
        }
        .gp-footer-link:hover {
          color: #D4AF37;
          transform: translateX(5px);
        }

        .gp-footer-cols {
          display: grid;
          grid-template-columns: 1.2fr 0.95fr 1.25fr;
          gap: 38px;
          align-items: stretch;
        }

        .gp-footer-socials-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 1119px) {
          .bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .gp-disclosures-split,
          .gp-format-bento,
          .gp-journey-grid,
          .gp-footer-cols {
            grid-template-columns: 1fr;
          }
          .gp-sticky-desktop {
            position: relative !important;
            top: auto !important;
          }
          .gp-hide-md {
            display: none !important;
          }
        }

        @media (max-width: 720px) {
          .gp-inner {
            padding: 0 18px;
          }
          .bento-grid,
          .gp-folders-grid,
          .gp-footer-socials-grid {
            grid-template-columns: 1fr;
          }
          .bento-span-2 {
            grid-column: span 1;
          }
          .gp-hide-sm {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Glowing Scroll Progress Thread */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #8B1E24 0%, #D4AF37 55%, #1E3A5F 100%)',
          boxShadow: '0 0 14px rgba(212, 175, 55, 0.8)',
          zIndex: 120,
          transition: 'width 0.1s linear',
        }}
      />

      {/* 3D Floating Bubbles Background */}
      <Floating3DBubbles isDarkMode={isDarkMode} />

      {/* Subtle Ambient Royal Auroras */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-180px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '860px',
            height: '460px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(139,30,36,0.28) 0%, rgba(30,58,95,0.22) 48%, transparent 74%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(139,30,36,0.08) 48%, transparent 74%)',
            filter: 'blur(85px)',
          }}
        />
      </div>

      {/* ================================================================= */}
      {/* DESKTOP LEFT-SHIFT FLOATING VERTICAL CAPSULE RAIL (ON SCROLL)     */}
      {/* ================================================================= */}
      <aside
        className="gp-left-rail"
        onMouseEnter={() => setRailHovered(true)}
        onMouseLeave={() => setRailHovered(false)}
        style={{
          width: railHovered ? '196px' : '62px',
          opacity: isDocked ? 1 : 0,
          transform: isDocked ? 'translate3d(0, -50%, 0) scale(1)' : 'translate3d(-90px, -50%, 0) scale(0.9)',
          pointerEvents: isDocked ? 'auto' : 'none',
        }}
      >
        {/* Home + Logo Row */}
        <button
          type="button"
          onClick={onBack}
          title="Back to Main Portal"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px',
            borderRadius: '18px',
            border: `1px solid ${hairline}`,
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(139,30,36,0.05)',
            color: textMain,
            cursor: 'pointer',
            overflow: 'hidden',
            fontFamily: 'inherit',
            transition: 'all 0.28s ease',
          }}
        >
          <img
            src="/sanrachna-official-logo.png"
            alt="Sanrachna Logo"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              objectFit: 'contain',
              backgroundColor: '#FFFFFF',
              padding: '3px',
              border: '1px solid rgba(212, 175, 55, 0.7)',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              opacity: railHovered ? 1 : 0,
              transform: railHovered ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 0.25s ease, transform 0.3s ease',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#EBD28C' : '#8B1E24', lineHeight: 1.1 }}>
              संRACHNA
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: textSub }}>← Back Home</div>
          </div>
        </button>

        <div style={{ height: '1px', background: hairline, margin: '2px 4px' }} />

        {/* Vertical Animated Section Nav Buttons */}
        {RAIL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToAnchor(item.id)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '10px',
                borderRadius: '16px',
                border: isActive ? '1px solid rgba(212, 175, 55, 0.72)' : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, #8B1E24 0%, #5A1220 55%, #1E3A5F 100%)'
                  : 'transparent',
                color: isActive ? '#FAF9F5' : textSub,
                boxShadow: isActive ? '0 8px 20px rgba(139, 30, 36, 0.32)' : 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                fontFamily: 'inherit',
                transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                <Icon size={18} />
              </span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  opacity: railHovered ? 1 : 0,
                  transform: railHovered ? 'translateX(0)' : 'translateX(-8px)',
                  transition: 'opacity 0.25s ease, transform 0.3s ease',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Vertical Scroll Progress Mini Gauge */}
        <div style={{ padding: '4px 6px 2px 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '4px', borderRadius: '999px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(139,30,36,0.12)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${scrollProgress}%`,
                background: 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                borderRadius: '999px',
                transition: 'width 0.15s linear',
              }}
            />
          </div>
          {railHovered && (
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#D4AF37', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(scrollProgress)}%
            </span>
          )}
        </div>
      </aside>

      {/* ================================================================= */}
      {/* DESKTOP PERSISTENT TOP-RIGHT ACTION PILL (THEME + SUBMIT)         */}
      {/* ================================================================= */}
      <div
        className="gp-topright-dock"
        style={{
          opacity: isDocked ? 1 : 0,
          transform: isDocked ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(20px, -16px, 0) scale(0.92)',
          pointerEvents: isDocked ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
          className="gp-glass-pill"
          style={{ width: '38px', height: '38px', padding: 0 }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <AnimatedThemeIcon isDark={isDarkMode} maskId="gp-moon-dock" />
        </button>

        <button
          type="button"
          onClick={onOpenSubmission}
          className="gp-magnetic-cta"
          style={{ padding: '9px 18px', fontSize: '11px' }}
        >
          <span>Submit</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ================================================================= */}
      {/* TOP FLOATING CAPSULE HEADER (AT PAGE TOP & ON MOBILE)             */}
      {/* ================================================================= */}
      <div className={`gp-capsule-wrap ${isDocked ? 'is-docked' : ''}`}>
        <header className="gp-capsule-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <button
              type="button"
              onClick={onBack}
              className="gp-glass-pill"
              style={{ padding: '8px 14px', fontSize: '11px' }}
            >
              <ArrowLeft size={14} />
              <span className="gp-hide-sm">Home</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <img
                src="/sanrachna-official-logo.png"
                alt="Sanrachna Logo"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  padding: '3px',
                  border: '1px solid rgba(212, 175, 55, 0.7)',
                }}
              />
              <span className="gp-brand-wordmark">संRACHNA</span>
            </div>
          </div>

          <div className="gp-hide-md">
            <SlidingPillTabs<NavSectionId>
              compact
              isDarkMode={isDarkMode}
              activeId={activeNav}
              onSelect={scrollToAnchor}
              items={[
                { id: 'bento-categories', label: 'Categories' },
                { id: 'glass-folders', label: 'Official Kit' },
                { id: 'formatting-studio', label: 'Formatting' },
                { id: 'editorial-ethics', label: 'Rules & Ethics' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="gp-glass-pill"
              style={{ width: '38px', height: '38px', padding: 0 }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatedThemeIcon isDark={isDarkMode} maskId="gp-moon-top" />
            </button>

            <button
              type="button"
              onClick={onOpenSubmission}
              className="gp-magnetic-cta"
              style={{ padding: '9px 18px', fontSize: '11px' }}
            >
              <span>Submit</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </header>
      </div>

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* ================================================================= */}
        {/* CINEMATIC HERO                                                    */}
        {/* ================================================================= */}
        <section
          className="gp-inner"
          style={{
            position: 'relative',
            paddingTop: '76px',
            paddingBottom: '92px',
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'min(520px, 88vw)',
              height: 'min(520px, 88vw)',
              borderRadius: '50%',
              border: `1px dashed ${isDarkMode ? 'rgba(212, 175, 55, 0.16)' : 'rgba(139, 30, 36, 0.14)'}`,
              pointerEvents: 'none',
              animation: 'zeroOrbitSpin 46s linear infinite',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#D4AF37',
                boxShadow: '0 0 18px #D4AF37',
              }}
            />
          </div>

          <BlurReveal>
            <h1
              style={{
                margin: '0 auto 20px auto',
                maxWidth: '940px',
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: 'clamp(44px, 7vw, 86px)',
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: textMain,
              }}
            >
              From <span style={{ fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif", fontWeight: 700 }}>शून्य</span> to{' '}
              <KineticHeroWord isDarkMode={isDarkMode} />
            </h1>

            <p
              style={{
                margin: '0 auto 32px auto',
                maxWidth: '670px',
                fontSize: 'clamp(15.5px, 1.8vw, 18.5px)',
                lineHeight: 1.78,
                color: textSub,
              }}
            >
              Edition I centres on <strong style={{ color: isDarkMode ? '#EBD28C' : '#8B1E24' }}>The Zero (शून्य)</strong> — a starting point, not a boundary. Whether it is a scientific breakthrough, a late-night poem, or a single photograph, find your category below and shape it for print.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => scrollToAnchor('bento-categories')}
                className="gp-magnetic-cta"
                style={{ padding: '14px 32px', fontSize: '13px' }}
              >
                <span>Explore 12 Categories</span>
                <ArrowRight size={15} />
              </button>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '18px', fontSize: '13px', fontWeight: 700 }}>
                <a
                  href="/Guidelines.pdf"
                  download="Sanrachna_Guidelines_2026.pdf"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: isDarkMode ? '#EBD28C' : '#8B1E24',
                    textDecoration: 'none',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(235,210,140,0.45)' : 'rgba(139,30,36,0.4)'}`,
                    paddingBottom: '2px',
                  }}
                >
                  <Download size={14} />
                  <span>Official Guidelines PDF</span>
                </a>
                <span style={{ opacity: 0.35 }}>•</span>
                <a
                  href="/Template for Submission.pdf"
                  download="Sanrachna_Template_2026.pdf"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: textMain,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${hairline}`,
                    paddingBottom: '2px',
                  }}
                >
                  <Download size={14} />
                  <span>Submission Template PDF</span>
                </a>
              </div>
            </div>
          </BlurReveal>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 01: 12 WAYS TO CONTRIBUTE (BENTO + ANIMATED ICONS)        */}
        {/* ================================================================= */}
        <section id="bento-categories" className="gp-inner" style={{ paddingTop: '78px', paddingBottom: '88px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '22px',
              marginBottom: '26px',
            }}
          >
            <AnimatedSectionTitle title="12 Ways to" accent="Contribute" isDarkMode={isDarkMode} />
            <AnimatedSearchInput value={searchQuery} onChange={setSearchQuery} isDarkMode={isDarkMode} />
          </div>

          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <SlidingPillTabs<CategoryGroup>
              isDarkMode={isDarkMode}
              activeId={activeGroup}
              onSelect={setActiveGroup}
              items={[
                { id: 'all', label: 'All 12' },
                { id: 'writing', label: 'Writing & Poetry' },
                { id: 'media', label: 'Campus & Media' },
                { id: 'visual', label: 'Art & Photo' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '30px', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: textSub, marginRight: '4px' }}>
              Quick match:
            </span>
            {QUICK_IDEA_MATCHES.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setShowLockHint(false);
                  setActiveModalCatId(chip.targetId);
                }}
                className="gp-idea-chip"
              >
                {chip.label} ↗
              </button>
            ))}
          </div>

          <div className="bento-grid">
            {filteredCategories.map((cat, idx) => (
              <BentoCategoryTile
                key={cat.id}
                cat={cat}
                index={idx}
                isDarkMode={isDarkMode}
                onSelect={() => {
                  setShowLockHint(false);
                  setActiveModalCatId(cat.id);
                }}
              />
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', fontSize: '15px', color: textSub }}>
              No matching category found for &ldquo;{searchQuery}&rdquo;. Try clearing your filter.
            </div>
          )}
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 02: DOWNLOADS & PRE-SUBMISSION GLASS FOLDERS              */}
        {/* ================================================================= */}
        <section id="glass-folders" className="gp-inner" style={{ paddingTop: '78px', paddingBottom: '90px' }}>
          <div style={{ marginBottom: '34px' }}>
            <AnimatedSectionTitle
              title="Downloads &"
              accent="Essentials"
              subtitle="Hover or tap either frosted folder to open the official PDFs and check the four essentials every contributor keeps ready."
              isDarkMode={isDarkMode}
            />
          </div>

          <BlurReveal delay={90}>
            <div className="gp-folders-grid">
              <GlassFolderCard
                title="Official Submission Kit"
                subtitle="Hover or tap to fan out & download PDFs"
                isDarkMode={isDarkMode}
                primaryActionLabel="Download Official Guidelines PDF"
                onPrimaryAction={() => triggerDownload('/Guidelines.pdf', 'Sanrachna_Guidelines_2026.pdf')}
                docs={[
                  { title: 'A4 Typography & 300 DPI Rules', meta: 'Bookman Old 11pt • KrutiDev/Mangal 14pt', tag: 'SPEC', accent: '#1E3A5F' },
                  { title: 'Template for Submission.pdf', meta: 'Official formatted A4 reference template', tag: 'PDF ↓', accent: '#581C3A', href: '/Template for Submission.pdf', downloadName: 'Sanrachna_Template_2026.pdf' },
                  { title: 'Sanrachna Guidelines 2026.pdf', meta: 'Complete official GEC Godda circular', tag: 'PDF ↓', accent: '#8B1E24', href: '/Guidelines.pdf', downloadName: 'Sanrachna_Guidelines_2026.pdf' },
                ]}
              />

              <GlassFolderCard
                title="Four Mandatory Essentials"
                subtitle="Keep these ready before uploading on the portal"
                isDarkMode={isDarkMode}
                primaryActionLabel="Open Submission Portal"
                onPrimaryAction={onOpenSubmission}
                docs={[
                  { title: '(d) Artwork / Photo Description', meta: 'Short caption & story for every visual entry', tag: 'VISUAL', accent: '#1E3A5F' },
                  { title: '(c) Clear Descriptive Title', meta: 'At top of article + separate supporting media', tag: 'TITLE', accent: '#581C3A' },
                  { title: '(b) Author Photograph (300 DPI)', meta: 'Sharp portrait image attached separately', tag: '300 DPI', accent: '#8B6D2E' },
                  { title: '(a) Brief Author Biography', meta: 'Name, Branch, Batch & short bio of contributor', tag: 'BIO', accent: '#8B1E24' },
                ]}
              />
            </div>
          </BlurReveal>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 03: FORMATTING STUDIO + REJECTED VS PRINT-READY A4 TOGGLE */}
        {/* ================================================================= */}
        <section id="formatting-studio" className="gp-inner" style={{ paddingTop: '78px', paddingBottom: '90px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '34px' }}>
            <AnimatedSectionTitle title="Formatting &" accent="Print Preview" isDarkMode={isDarkMode} />

            <SlidingPillTabs<FormatTab>
              isDarkMode={isDarkMode}
              activeId={formatTab}
              onSelect={setFormatTab}
              items={[
                { id: 'english', label: 'English Text' },
                { id: 'hindi', label: 'हिन्दी Text' },
                { id: 'visual', label: 'Images & 300 DPI' },
              ]}
            />
          </div>

          <BlurReveal delay={90}>
            <div className="gp-format-bento">
              <div
                style={{
                  borderRadius: '28px',
                  padding: '30px 32px',
                  border: `1px solid ${hairline}`,
                  background: isDarkMode
                    ? 'linear-gradient(155deg, rgba(16, 24, 48, 0.78) 0%, rgba(9, 13, 28, 0.9) 100%)'
                    : 'linear-gradient(155deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 241, 232, 0.86) 100%)',
                  backdropFilter: 'blur(20px)',
                  textAlign: 'left',
                }}
              >
                {(formatTab === 'english'
                  ? [
                      { k: 'Typeface', v: 'Bookman Old Style' },
                      { k: 'Heading / Sub-heading', v: '14pt Bold / 12pt Bold' },
                      { k: 'Body Size', v: '11pt Regular' },
                      { k: 'Page & Margins', v: 'A4 (8.27 × 11.69 in) • 1" each side' },
                      { k: 'Spacing & Numbering', v: '1.5 Line • 6pt after paragraph • Bottom Centre' },
                      { k: 'File Format', v: 'Editable .doc / .docx (.pdf only if necessary)' },
                    ]
                  : formatTab === 'hindi'
                  ? [
                      { k: 'हिन्दी फ़ॉन्ट', v: 'KrutiDev or Mangal' },
                      { k: 'Heading / Sub-heading', v: '16pt / 14pt' },
                      { k: 'Body Size', v: '14pt' },
                      { k: 'Page & Margins', v: 'A4 (8.27 × 11.69 in) • 1" each side' },
                      { k: 'Spacing & Numbering', v: '1.5 Line • 6pt after paragraph • Bottom Centre' },
                      { k: 'File Format', v: 'Editable .doc / .docx (.pdf only if necessary)' },
                    ]
                  : [
                      { k: 'Accepted Formats', v: 'JPEG (.jpg), .png, and .gif' },
                      { k: 'Resolution', v: '300 DPI minimum wherever possible' },
                      { k: 'Word Doc Rule', v: 'NEVER embed images inside a Word document' },
                      { k: 'Mandatory Context', v: 'Appropriate caption & short description' },
                      { k: 'Author Portrait', v: 'Separate 300 DPI contributor photo required' },
                    ]
                ).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '15px 0',
                      borderTop: idx === 0 ? 'none' : `1px solid ${hairline}`,
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '1.1px', textTransform: 'uppercase', color: isDarkMode ? '#D4AF37' : '#8B1E24' }}>
                      {item.k}
                    </span>
                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: textMain }}>{item.v}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: '28px',
                  padding: '26px',
                  border: `1px solid ${specimenMode === 'ready' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(225, 29, 72, 0.55)'}`,
                  background: isDarkMode
                    ? specimenMode === 'ready'
                      ? 'linear-gradient(155deg, rgba(16, 38, 42, 0.85) 0%, rgba(10, 15, 32, 0.94) 100%)'
                      : 'linear-gradient(155deg, rgba(58, 14, 24, 0.86) 0%, rgba(12, 14, 30, 0.94) 100%)'
                    : specimenMode === 'ready'
                    ? 'linear-gradient(155deg, #FFFFFF 0%, #F1F8F4 100%)'
                    : 'linear-gradient(155deg, #FFFDFD 0%, #FCECEE 100%)',
                  boxShadow: isDarkMode ? '0 26px 60px rgba(0, 0, 0, 0.5)' : '0 20px 48px rgba(30, 58, 95, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: specimenMode === 'ready' ? '#22C55E' : '#E11D48' }}>
                    <Eye size={14} />
                    <span>{specimenMode === 'ready' ? 'Print-Ready A4' : 'Common Mistakes'}</span>
                  </span>

                  <SlidingPillTabs<'ready' | 'rejected'>
                    compact
                    isDarkMode={isDarkMode}
                    activeId={specimenMode}
                    onSelect={setSpecimenMode}
                    items={[
                      { id: 'ready', label: 'Print-Ready' },
                      { id: 'rejected', label: 'Gets Rejected' },
                    ]}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    border: `1.5px dashed ${specimenMode === 'ready' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(225, 29, 72, 0.55)'}`,
                    borderRadius: '16px',
                    padding: specimenMode === 'ready' ? '24px 22px' : '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {specimenMode === 'ready' ? (
                    formatTab === 'english' ? (
                      <div style={{ fontFamily: "'Bookman Old Style', Georgia, serif" }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: textMain }}>
                          The Architecture of Zero (14pt Bold)
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#D4AF37', marginTop: '7px' }}>
                          Sub-heading in 12pt Bold
                        </div>
                        <p style={{ fontSize: '12.5px', lineHeight: 1.8, color: textSub, margin: '12px 0' }}>
                          Clean Bookman Old Style (11pt) with 1&quot; margins, 1.5 line spacing, and 6pt paragraph spacing saved in editable .doc or .docx format.
                        </p>
                        <div style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#22C55E', marginTop: '18px' }}>
                          — 1 — (Bottom Centre)
                        </div>
                      </div>
                    ) : formatTab === 'hindi' ? (
                      <div>
                        <div style={{ fontSize: '19px', fontWeight: 700, color: textMain }}>
                          शून्य से सृजन की ओर (16pt शीर्षक)
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#D4AF37', marginTop: '7px' }}>
                          उप-शीर्षक (14pt KrutiDev / Mangal)
                        </div>
                        <p style={{ fontSize: '14.5px', lineHeight: 1.85, color: textSub, margin: '12px 0' }}>
                          मुख्य लेख 14pt फ़ॉन्ट में, 1.5 लाइन स्पेसिंग और प्रत्येक पैराग्राफ के बाद 6pt स्पेसिंग के साथ A4 पृष्ठ पर तैयार करें।
                        </p>
                        <div style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#22C55E', marginTop: '18px' }}>
                          — १ — (Bottom Centre)
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                        <div
                          style={{
                            height: '120px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(20,83,75,0.28), rgba(212,175,55,0.24), rgba(30,58,95,0.34))',
                            border: '1px solid rgba(34, 197, 94, 0.45)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Image size={28} color="#22C55E" />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: textMain, marginTop: '8px' }}>
                            Standalone 300 DPI File (.JPG / .PNG)
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: textSub, marginTop: '12px', marginBottom: 0 }}>
                          Sent separately with caption &amp; short description—ready for high-resolution print.
                        </p>
                      </div>
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: 'auto 0' }}>
                      {(formatTab === 'visual'
                        ? [
                            'Images pasted inside a Word (.docx) document',
                            'Blurry WhatsApp-forwarded or screenshot artwork (below 300 DPI)',
                            'AI-generated illustrations or missing artwork caption',
                          ]
                        : [
                            'Unformatted wall of text with tight single spacing & missing 1" margins',
                            'Default Calibri / Arial fonts instead of Bookman Old or KrutiDev/Mangal',
                            'Screenshots of typed text or unedited AI-generated paragraphs',
                          ]
                      ).map((mistake, mIdx) => (
                        <div
                          key={mIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: isDarkMode ? 'rgba(225, 29, 72, 0.14)' : 'rgba(225, 29, 72, 0.08)',
                            border: '1px solid rgba(225, 29, 72, 0.3)',
                            fontSize: '13px',
                            color: textMain,
                            lineHeight: 1.5,
                          }}
                        >
                          <XCircle size={16} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{mistake}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BlurReveal>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 04: FROM PORTAL TO PRINT                                  */}
        {/* ================================================================= */}
        <section className="gp-inner" style={{ paddingTop: '78px', paddingBottom: '88px' }}>
          <div style={{ marginBottom: '36px' }}>
            <AnimatedSectionTitle
              title="From Portal"
              accent="to Print"
              subtitle="Every submission moves through a transparent three-stage journey curated by the Editorial & Review Team."
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="gp-journey-grid">
            {EDITORIAL_STEPS.map((st, idx) => {
              const StepIcon = st.icon;
              return (
                <BlurReveal key={st.step} delay={idx * 100}>
                  <div
                    style={{
                      position: 'relative',
                      height: '100%',
                      borderRadius: '26px',
                      padding: '28px 26px',
                      border: `1px solid ${hairline}`,
                      background: isDarkMode
                        ? 'linear-gradient(150deg, rgba(22, 32, 64, 0.72) 0%, rgba(10, 14, 30, 0.9) 100%)'
                        : 'linear-gradient(150deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 240, 231, 0.86) 100%)',
                      textAlign: 'left',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '4px',
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: '74px',
                        fontWeight: 700,
                        lineHeight: 1,
                        color: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(139, 30, 36, 0.07)',
                      }}
                    >
                      {st.step}
                    </span>

                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #8B1E24 0%, #1E3A5F 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.5)',
                        color: '#F5E6B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '18px',
                      }}
                    >
                      <StepIcon size={20} />
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: 700, color: textMain }}>
                      {st.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: textSub }}>
                      {st.desc}
                    </p>
                  </div>
                </BlurReveal>
              );
            })}
          </div>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 05: EDITORIAL RULES & ETHICS + CONTRIBUTOR HONOURS        */}
        {/* ================================================================= */}
        <section id="editorial-ethics" className="gp-inner" style={{ paddingTop: '78px', paddingBottom: '96px' }}>
          <div className="gp-disclosures-split">
            <div className="gp-sticky-desktop" style={{ textAlign: 'left' }}>
              <AnimatedSectionTitle
                title="Editorial Rules"
                accent="& Ethics"
                subtitle="Scroll or hover across each policy to see how संRACHNA upholds originality, fairness, and copyright."
                isDarkMode={isDarkMode}
              />

              <BlurReveal delay={120}>
                <div
                  style={{
                    marginTop: '28px',
                    borderRadius: '26px',
                    padding: '26px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: isDarkMode
                      ? 'linear-gradient(150deg, rgba(139, 30, 36, 0.28) 0%, rgba(22, 32, 62, 0.88) 60%, rgba(10, 14, 30, 0.96) 100%)'
                      : 'linear-gradient(150deg, rgba(255, 252, 246, 0.96) 0%, rgba(246, 236, 224, 0.92) 55%, rgba(235, 240, 249, 0.9) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.48)',
                    boxShadow: isDarkMode ? '0 22px 50px rgba(0, 0, 0, 0.4)' : '0 18px 42px rgba(30, 58, 95, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #D4AF37 0%, #8B6D2E 100%)',
                        color: '#070B19',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                      }}
                    >
                      <Award size={20} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px', fontWeight: 700, color: textMain, lineHeight: 1.2 }}>
                        Contributor Honours
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#EBD28C' : '#8B1E24', marginTop: '2px' }}>
                        Edition I • Official Recognition
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', lineHeight: 1.65, color: textSub }}>
                    Standout submissions earn the <strong style={{ color: textMain }}>Certificate of Editorial Distinction</strong> for the finest entry of the edition, alongside permanent publication credit.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {[
                      'Official print & digital byline with author biography',
                      'Editorial polish while preserving your original voice',
                      'Honour Roll E-Certificate for Best Content Submitter',
                    ].map((perk, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', fontWeight: 600, color: textMain }}>
                        <Sparkles size={13} color="#D4AF37" style={{ flexShrink: 0 }} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurReveal>
            </div>

            <SlidingScrollDisclosures isDarkMode={isDarkMode} />
          </div>
        </section>

        {/* ================================================================= */}
        {/* BALANCED FULL-BLEED CINEMATIC FOOTER (FIXED ANUSWAR + ZERO GAPS)  */}
        {/* ================================================================= */}
        <footer
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: isDarkMode
              ? 'linear-gradient(180deg, #070B19 0%, #0C1228 48%, #150B16 100%)'
              : 'linear-gradient(180deg, #FAF9F5 0%, #F3ECE2 55%, #E7D9C6 100%)',
            borderTop: '1.5px solid transparent',
            borderImage: 'linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1',
            paddingTop: '80px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              width: '720px',
              height: '280px',
              borderRadius: '50%',
              background: isDarkMode
                ? 'radial-gradient(circle, rgba(139,30,36,0.28) 0%, rgba(212,175,55,0.12) 48%, transparent 74%)'
                : 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(139,30,36,0.08) 48%, transparent 74%)',
              filter: 'blur(70px)',
              pointerEvents: 'none',
              animation: 'footerHaloPulse 7s ease-in-out infinite',
            }}
          />

          {/* Closing Editorial Quote + CTA */}
          <div className="gp-inner" style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingBottom: '60px' }}>
            <BlurReveal>
              <h2
                style={{
                  margin: '0 auto 14px auto',
                  maxWidth: '880px',
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 700,
                  lineHeight: 1.12,
                  color: textMain,
                }}
              >
                &ldquo;Inform, Engage, Celebrate Talent, and{' '}
                <span className={isDarkMode ? 'royal-accent-text-dark' : 'royal-accent-text-light'}>
                  Preserve Memories&rdquo;
                </span>
              </h2>

              <p style={{ margin: '0 auto 28px auto', maxWidth: '580px', fontSize: '15.5px', lineHeight: 1.72, color: textSub }}>
                Ready with your formatted manuscript, poetry, sketch, or photograph? Step into the official portal and share your creation with GEC Godda.
              </p>

              <button
                type="button"
                onClick={onOpenSubmission}
                className="gp-magnetic-cta"
                style={{ padding: '15px 34px', fontSize: '13.5px' }}
              >
                <span>Open Submission Portal</span>
                <ArrowRight size={16} />
              </button>
            </BlurReveal>
          </div>

          <div className="gp-inner">
            <div className="gp-divider" />
          </div>

          {/* Perfectly Balanced 3-Column Footer Grid */}
          <div className="gp-inner" style={{ position: 'relative', zIndex: 2, paddingTop: '52px', paddingBottom: '44px' }}>
            <div className="gp-footer-cols">
              {/* Column 1: Untouched Logos + || सृजन से निर्माण तक || + Poetic Motto */}
              <BlurReveal delay={0}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', textAlign: 'left', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <img
                        src="/gec-logo.png"
                        alt="GEC Godda Logo"
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'contain',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          padding: '4px',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                        }}
                      />
                      <div style={{ width: '1.5px', height: '38px', background: 'rgba(212, 175, 55, 0.45)' }} />
                      <img
                        src="/sanrachna-official-logo.png"
                        alt="Sanrachna Official Logo"
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'contain',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          padding: '5px',
                          border: '1px solid rgba(212, 175, 55, 0.7)',
                        }}
                      />
                      <div>
                        <div style={{ fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif", fontSize: '23px', fontWeight: 700, color: isDarkMode ? '#EBD28C' : '#8B1E24', lineHeight: 1.15 }}>
                          संRACHNA
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: isDarkMode ? '#D4AF37' : '#1E3A5F', marginTop: '2px', letterSpacing: '0.4px' }}>
                          || सृजन से निर्माण तक ||
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
                        fontSize: '17px',
                        fontWeight: 600,
                        lineHeight: 1.55,
                        color: textMain,
                        marginBottom: '10px',
                      }}
                    >
                      सृजन से विचार, विचारों से सपने,<br />
                      <span style={{ color: isDarkMode ? '#EBD28C' : '#8B1E24' }}>सपनों से निर्माण।</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: textSub }}>
                      Official Annual College Magazine of Government Engineering College, Godda • Edition I (Theme: <strong style={{ color: textMain }}>The Zero / शून्य</strong>).
                    </p>
                  </div>

                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: `1px solid ${hairline}`,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: textSub,
                    }}
                  >
                    Chhatra, Poreyahat, Godda, Jharkhand – 814153
                  </div>
                </div>
              </BlurReveal>

              {/* Column 2: Quick Navigation + Glass PDF Cards */}
              <BlurReveal delay={100}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', textAlign: 'left', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '15px' }}>
                      Handbook Navigation
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', alignItems: 'flex-start' }}>
                      {[
                        { label: '← Return to Main Portal', action: onBack },
                        { label: '12 Ways to Contribute', action: () => scrollToAnchor('bento-categories') },
                        { label: 'Downloads & Essentials', action: () => scrollToAnchor('glass-folders') },
                        { label: 'Formatting & Print Preview', action: () => scrollToAnchor('formatting-studio') },
                        { label: 'Editorial Rules & Ethics', action: () => scrollToAnchor('editorial-ethics') },
                      ].map((nav) => (
                        <button key={nav.label} type="button" onClick={nav.action} className="gp-footer-link">
                          {nav.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${hairline}` }}>
                    <a
                      href="/Guidelines.pdf"
                      download="Sanrachna_Guidelines_2026.pdf"
                      className="gp-glass-pill"
                      style={{ padding: '8px 14px', fontSize: '11px' }}
                    >
                      <Download size={13} />
                      <span>Guidelines PDF</span>
                    </a>
                    <a
                      href="/Template for Submission.pdf"
                      download="Sanrachna_Template_2026.pdf"
                      className="gp-glass-pill"
                      style={{ padding: '8px 14px', fontSize: '11px' }}
                    >
                      <Download size={13} />
                      <span>Template PDF</span>
                    </a>
                  </div>
                </div>
              </BlurReveal>

              {/* Column 3: Perfectly Symmetrical Channels (Full-Width Email + 2x2 Socials) */}
              <BlurReveal delay={180}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', textAlign: 'left', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '2px' }}>
                    Official Channels &amp; Editorial Desk
                  </div>

                  {/* Full-width Official Email Card */}
                  <a href="mailto:sanrachna.gecgodda@gmail.com" className="gp-social-chip">
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '11px',
                        background: 'rgba(212, 175, 55, 0.16)',
                        color: '#D4AF37',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Mail size={19} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, lineHeight: 1.2 }}>Official Editorial Email</div>
                      <span style={{ display: 'block', fontSize: '11.5px', color: textSub, marginTop: '2px' }}>
                        sanrachna.gecgodda@gmail.com
                      </span>
                    </div>
                  </a>

                  {/* Symmetrical 2x2 Social & College Website Grid (Zero Orphan Card!) */}
                  <div className="gp-footer-socials-grid">
                    {socialChannels.map((ch) => (
                      <a
                        key={ch.name}
                        href={ch.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gp-social-chip"
                      >
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: 'rgba(212, 175, 55, 0.14)',
                            color: '#D4AF37',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {ch.svg}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.2 }}>{ch.name}</div>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '10.5px',
                              color: textSub,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '2px',
                            }}
                          >
                            {ch.handle}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </BlurReveal>
            </div>
          </div>

          {/* Fixed Oversized संRACHNA Watermark (Full Top Breathing Room — Anuswar 100% Visible) */}
          <div style={{ position: 'relative', overflow: 'visible', borderTop: `1px solid ${hairline}` }}>
            <BlurReveal>
              <div
                aria-hidden="true"
                style={{
                  textAlign: 'center',
                  fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
                  fontSize: 'clamp(52px, 11.5vw, 148px)',
                  fontWeight: 700,
                  lineHeight: 1.28,
                  letterSpacing: '0.04em',
                  color: isDarkMode ? 'rgba(212, 175, 55, 0.065)' : 'rgba(139, 30, 36, 0.065)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  paddingTop: '28px',
                  paddingBottom: '4px',
                }}
              >
                संRACHNA
              </div>
            </BlurReveal>

            <div
              className="gp-inner"
              style={{
                paddingTop: '6px',
                paddingBottom: '26px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: textSub,
              }}
            >
              <div>
                © 2026 <strong style={{ color: '#D4AF37' }}>संRACHNA Magazine</strong> — Government Engineering College, Godda.
              </div>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="gp-glass-pill"
                style={{ padding: '7px 18px', fontSize: '11px' }}
              >
                <span>Back to Top ↑</span>
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* ================================================================= */}
      {/* FROSTED-GLASS MODAL WITH STRICT 4-CHECKBOX SUBMIT GATE            */}
      {/* ================================================================= */}
      {modalCat && (() => {
        const ModalIcon = modalCat.icon;
        const checks = checkedMap[modalCat.id] ?? modalCat.checklist.map(() => false);
        const doneCount = checks.filter(Boolean).length;
        const totalChecks = modalCat.checklist.length;
        const allReady = doneCount === totalChecks;
        const progressPct = Math.round((doneCount / totalChecks) * 100);
        const draft = draftMap[modalCat.id] ?? '';
        const liveCount =
          modalCat.unit === 'lines'
            ? draft.split(/\r?\n/).filter((l) => l.trim().length > 0).length
            : draft.trim()
            ? draft.trim().split(/\s+/).length
            : 0;
        const gaugePercent =
          modalCat.unit === 'nos' ? 100 : Math.min(100, Math.round((liveCount / modalCat.max) * 100));

        const handleAttemptSubmit = () => {
          if (!allReady) {
            setShowLockHint(true);
            setChecklistShake(false);
            window.requestAnimationFrame(() => setChecklistShake(true));
            window.setTimeout(() => setChecklistShake(false), 500);
            return;
          }
          setActiveModalCatId(null);
          setShowLockHint(false);
          onOpenSubmission();
        };

        return (
          <div
            onClick={() => {
              setActiveModalCatId(null);
              setShowLockHint(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: isDarkMode ? 'rgba(4, 7, 18, 0.78)' : 'rgba(18, 12, 16, 0.56)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '940px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '30px',
                padding: 'clamp(22px, 4vw, 38px)',
                background: isDarkMode
                  ? 'linear-gradient(155deg, rgba(16, 23, 46, 0.96) 0%, rgba(8, 12, 26, 0.98) 100%)'
                  : 'linear-gradient(155deg, rgba(255, 254, 250, 0.98) 0%, rgba(247, 240, 229, 0.98) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                boxShadow: '0 32px 90px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255,255,255,0.2)',
                animation: 'modalPopIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #8B1E24 0%, #1E3A5F 100%)',
                      border: '1px solid rgba(212,175,55,0.7)',
                      color: '#F5E6B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span className={`icon-anim-${modalCat.iconAnim}`} style={{ display: 'inline-flex' }}>
                      <ModalIcon size={24} />
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37' }}>
                      {modalCat.domain} • {modalCat.limitLabel}
                    </div>
                    <h3
                      style={{
                        margin: '4px 0 0 0',
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: 'clamp(26px, 3.6vw, 36px)',
                        fontWeight: 700,
                        color: textMain,
                        lineHeight: 1.15,
                      }}
                    >
                      {modalCat.name}{' '}
                      <span style={{ fontSize: '17px', color: '#D4AF37', fontWeight: 500 }}>({modalCat.hindiName})</span>
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyRules(modalCat)}
                    className="gp-glass-pill"
                    style={{ padding: '8px 14px', fontSize: '11px' }}
                  >
                    {copiedId === modalCat.id ? (
                      <>
                        <Check size={13} color="#22C55E" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalCatId(null);
                      setShowLockHint(false);
                    }}
                    aria-label="Close modal"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: `1px solid ${hairline}`,
                      background: 'transparent',
                      color: textMain,
                      fontSize: '17px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <p style={{ margin: '18px 0 20px 0', fontSize: '14.5px', lineHeight: 1.7, color: textSub }}>
                {modalCat.summary}
              </p>

              {modalCat.specialNote && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    borderLeft: '3px solid #D4AF37',
                    background: isDarkMode ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: textMain,
                  }}
                >
                  <AlertTriangle size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                  <span>{modalCat.specialNote}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '10px' }}>
                    Accepted Topics &amp; Scope
                  </div>
                  <ul style={{ margin: '0 0 22px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {modalCat.topics.map((t, i) => (
                      <li key={i} style={{ display: 'flex', gap: '9px', fontSize: '13.5px', lineHeight: 1.55, color: textMain }}>
                        <span style={{ color: '#D4AF37' }}>✦</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  {modalCat.unit !== 'nos' ? (
                    <div
                      style={{
                        padding: '18px',
                        borderRadius: '20px',
                        border: `1px solid ${hairline}`,
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(139,30,36,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                            Draft {modalCat.unit === 'lines' ? 'Line' : 'Word'} Counter
                          </div>
                          <div style={{ fontSize: '12px', color: textSub }}>
                            Target: <strong>{modalCat.limitLabel}</strong>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <AnimateDigits
                            value={liveCount}
                            minDigits={modalCat.unit === 'lines' ? 2 : 3}
                            fontSize={34}
                            color={
                              liveCount === 0
                                ? textMain
                                : liveCount > modalCat.max
                                ? '#E11D48'
                                : liveCount >= modalCat.min
                                ? '#22C55E'
                                : '#D4AF37'
                            }
                          />
                          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: textSub }}>
                            {modalCat.unit}
                          </div>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraftMap((prev) => ({ ...prev, [modalCat.id]: e.target.value }))}
                        placeholder={
                          modalCat.unit === 'lines'
                            ? 'Paste your poem here to count non-empty lines live...'
                            : `Paste your ${modalCat.name.toLowerCase()} draft here to check word count...`
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: `1px solid ${hairline}`,
                          background: isDarkMode ? 'rgba(7, 11, 25, 0.85)' : '#FFFFFF',
                          color: textMain,
                          fontSize: '13px',
                          lineHeight: 1.55,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />

                      <div style={{ marginTop: '10px', height: '6px', borderRadius: '999px', background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${gaugePercent}%`,
                            borderRadius: '999px',
                            background:
                              liveCount > modalCat.max
                                ? '#E11D48'
                                : liveCount >= modalCat.min
                                ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                                : 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                            transition: 'width 0.35s ease',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '18px',
                        border: `1px solid ${hairline}`,
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(139,30,36,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <Image size={22} color="#D4AF37" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '13px', color: textSub, lineHeight: 1.55 }}>
                        Submit <strong style={{ color: textMain }}>1–2 original 300 DPI files</strong> (.jpg, .png, .gif) directly with a caption—never inside Word.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Strict 4-Checkbox Gate + Progress Bar */}
                <div
                  className={checklistShake ? 'gp-shake' : ''}
                  style={{
                    padding: '22px',
                    borderRadius: '22px',
                    border: `1px solid ${
                      allReady
                        ? 'rgba(34,197,94,0.58)'
                        : showLockHint
                        ? 'rgba(225,29,72,0.65)'
                        : 'rgba(212,175,55,0.35)'
                    }`,
                    background: isDarkMode
                      ? 'linear-gradient(155deg, rgba(139,30,36,0.18) 0%, rgba(14,22,44,0.78) 100%)'
                      : 'linear-gradient(155deg, rgba(255,255,255,0.94) 0%, rgba(244,236,225,0.88) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.3s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#D4AF37' }}>
                        Before You Upload
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: allReady ? '#22C55E' : showLockHint ? '#E11D48' : textSub }}>
                        {doneCount}/{totalChecks} Checked
                      </span>
                    </div>

                    {/* Checklist Completion Bar */}
                    <div style={{ height: '5px', width: '100%', borderRadius: '999px', background: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(139,30,36,0.1)', overflow: 'hidden', marginBottom: '14px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          borderRadius: '999px',
                          background: allReady
                            ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                            : 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                          transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {modalCat.checklist.map((item, idx) => {
                        const checked = checks[idx];
                        const highlightMissing = showLockHint && !checked;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleCheck(modalCat.id, totalChecks, idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '13px',
                              border: checked
                                ? '1px solid rgba(34, 197, 94, 0.5)'
                                : highlightMissing
                                ? '1px solid rgba(225, 29, 72, 0.7)'
                                : `1px solid ${hairline}`,
                              background: checked
                                ? 'rgba(34, 197, 94, 0.1)'
                                : highlightMissing
                                ? 'rgba(225, 29, 72, 0.08)'
                                : 'transparent',
                              color: textMain,
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.25s ease',
                            }}
                          >
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                flexShrink: 0,
                                marginTop: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: checked ? '1px solid #22C55E' : highlightMissing ? '1.5px solid #E11D48' : `1.5px solid ${textSub}`,
                                background: checked ? '#22C55E' : 'transparent',
                                color: '#070B19',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {checked && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span style={{ fontSize: '12.5px', lineHeight: 1.5, opacity: checked ? 0.8 : 1 }}>
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {showLockHint && !allReady ? (
                      <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#E11D48' }}>
                        Please tick all {totalChecks} checkpoints above to unlock the portal.
                      </div>
                    ) : (
                      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: textSub }}>
                        <ShieldAlert size={15} color="#D4AF37" style={{ flexShrink: 0 }} />
                        <span>Strict Zero-AI &amp; Anti-Plagiarism screening applies.</span>
                      </div>
                    )}
                  </div>

                  {/* Strictly Gated Submit Button */}
                  <button
                    type="button"
                    onClick={handleAttemptSubmit}
                    aria-disabled={!allReady}
                    className={allReady ? 'gp-magnetic-cta' : ''}
                    style={
                      allReady
                        ? {
                            width: '100%',
                            marginTop: '18px',
                            padding: '14px 20px',
                            background: 'linear-gradient(135deg, #15803D 0%, #16A34A 52%, #0F766E 100%)',
                            borderColor: '#4ADE80',
                            boxShadow: '0 14px 32px rgba(22, 163, 74, 0.36)',
                          }
                        : {
                            width: '100%',
                            marginTop: '18px',
                            padding: '13px 18px',
                            borderRadius: '999px',
                            border: `1px dashed ${isDarkMode ? 'rgba(212,175,55,0.35)' : 'rgba(139,30,36,0.3)'}`,
                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(139,30,36,0.06)',
                            color: textSub,
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '0.7px',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'not-allowed',
                            fontFamily: 'inherit',
                            transition: 'all 0.25s ease',
                          }
                    }
                  >
                    {allReady ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit {modalCat.name} in Portal</span>
                        <ArrowRight size={15} />
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        <span>Tick All {totalChecks} Items to Unlock ({doneCount}/{totalChecks})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
