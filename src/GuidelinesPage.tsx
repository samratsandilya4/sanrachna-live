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
  FileText,
  Flame,
  GraduationCap,
  Image,
  Mail,
  Mic,
  Moon,
  Newspaper,
  Palette,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
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
        size: 1.8 + Math.random() * 4.8,
        angularSpeed: 0.0012 + Math.random() * 0.0011,
        opacity: 0.16 + Math.random() * 0.3,
        screenX: 0,
        screenY: 0,
        projectedScale: 1,
        tone: r > 0.52 ? 'gold' : r > 0.16 ? 'crimson' : 'navy',
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
      const count = window.innerWidth < 768 ? 38 : 115;
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
        p.y -= 0.52;
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
        const alpha = Math.min(0.65, isDarkMode ? p.opacity * 1.15 : p.opacity * 0.85);
        ctx.beginPath();
        if (p.tone === 'gold') ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        else if (p.tone === 'crimson') ctx.fillStyle = `rgba(139, 30, 36, ${alpha})`;
        else ctx.fillStyle = `rgba(56, 114, 184, ${alpha})`;
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
// 2. BLUR-TO-SHARP SCROLL REVEAL WRAPPER
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
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
      }}
    >
      {children}
    </div>
  );
}

// ===========================================================================
// 3. VIDEO 1 EFFECT: DIA TEXT REVEAL (KINETIC SHIMMER-WIPE WORD CYCLE)
// ===========================================================================
const DIA_WORDS = ['publishing.', 'preserving.', 'celebrating.', 'remembering.'];

function DiaTextReveal({ isDarkMode }: { isDarkMode: boolean }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const holdTimer = window.setInterval(() => {
      setPhase('out');
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % DIA_WORDS.length);
        setPhase('in');
      }, 420);
    }, 2800);

    return () => window.clearInterval(holdTimer);
  }, []);

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'bottom',
      }}
    >
      <span
        key={`${index}-${phase}`}
        className={phase === 'in' ? 'dia-word-in' : 'dia-word-out'}
        style={{
          display: 'inline-block',
          fontStyle: 'italic',
          fontWeight: 700,
          background: isDarkMode
            ? 'linear-gradient(110deg, #FFF3C4 0%, #D4AF37 42%, #F43F5E 78%, #F6E05E 100%)'
            : 'linear-gradient(110deg, #8B1E24 0%, #C2410C 42%, #D4AF37 78%, #1E3A5F 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          paddingRight: '6px',
        }}
      >
        {DIA_WORDS[index]}
      </span>
    </span>
  );
}

// ===========================================================================
// 4. VIDEO 3 EFFECT: ANIMATE DIGITS (ROLLING VERTICAL ODOMETER)
// ===========================================================================
function DigitReel({ digit, height }: { digit: number; height: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        height: `${height}px`,
        overflow: 'hidden',
        verticalAlign: 'top',
        position: 'relative',
      }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translate3d(0, -${digit * height}px, 0)`,
          transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            style={{
              height: `${height}px`,
              lineHeight: `${height}px`,
              display: 'block',
              textAlign: 'center',
            }}
          >
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
// 5. VIDEO 4 EFFECT: ANIMATED INPUT WITH TYPEWRITER HINTS & SPRING GLOW
// ===========================================================================
const SEARCH_HINTS = [
  'Try "Poem" (25–50 lines)...',
  'Try "Articles" (700–900 words)...',
  'Try "Photography" (300 DPI)...',
  'Try "Campus News" or "Alumni"...',
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
    const speed = deleting ? 28 : 54;

    const timer = window.setTimeout(() => {
      if (!deleting && hintText.length < target.length) {
        setHintText(target.slice(0, hintText.length + 1));
      } else if (!deleting && hintText.length === target.length) {
        window.setTimeout(() => setDeleting(true), 1250);
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
    <div
      style={{
        position: 'relative',
        flex: '1 1 260px',
        maxWidth: '380px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 16px',
          borderRadius: '999px',
          background: isDarkMode ? 'rgba(14, 21, 42, 0.72)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: focused
            ? '1.5px solid #D4AF37'
            : `1px solid ${isDarkMode ? 'rgba(212,175,55,0.28)' : 'rgba(139,30,36,0.2)'}`,
          boxShadow: focused
            ? '0 0 0 4px rgba(212, 175, 55, 0.14), 0 12px 30px rgba(139, 30, 36, 0.2)'
            : '0 6px 18px rgba(0, 0, 0, 0.06)',
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
                color: isDarkMode ? 'rgba(250,249,245,0.45)' : 'rgba(82,82,91,0.65)',
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
// 6. VIDEO 5 EFFECT: FROSTED GLASS FOLDER CARDS (3D FLAP + FANNING DOCS)
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
        paddingTop: '72px',
        cursor: 'pointer',
        userSelect: 'none',
        perspective: '1100px',
      }}
    >
      {/* Folder Back Shell with macOS-style Tab */}
      <div
        style={{
          position: 'relative',
          height: '215px',
          borderRadius: '26px',
          background: isDarkMode
            ? 'linear-gradient(145deg, rgba(34, 22, 34, 0.92) 0%, rgba(16, 24, 48, 0.95) 100%)'
            : 'linear-gradient(145deg, #E8DCCB 0%, #D9C8B2 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: isDarkMode
            ? '0 26px 60px rgba(0, 0, 0, 0.5)'
            : '0 22px 50px rgba(139, 30, 36, 0.14)',
        }}
      >
        {/* Top Folder Ear Tab */}
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            left: '22px',
            width: '122px',
            height: '26px',
            borderRadius: '14px 18px 0 0',
            background: isDarkMode
              ? 'linear-gradient(135deg, #8B1E24 0%, #521014 100%)'
              : 'linear-gradient(135deg, #8B1E24 0%, #6B161B 100%)',
            border: '1px solid rgba(212, 175, 55, 0.55)',
            borderBottom: 'none',
          }}
        />

        {/* Fanning Stacked Paper/Media Sheets Inside Folder */}
        <div style={{ position: 'absolute', inset: '10px 18px auto 18px', height: '140px' }}>
          {docs.map((doc, idx) => {
            const total = docs.length;
            const depthFromFront = total - 1 - idx;
            const closedY = -depthFromFront * 8;
            const closedScale = 1 - depthFromFront * 0.04;
            const openY = -18 - depthFromFront * 36;
            const openX = (idx - (total - 1) / 2) * 14;
            const openRotate = (idx - (total - 1) / 2) * 3.8;

            const cardInner = (
              <div
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '16px',
                  background: isDarkMode
                    ? idx === total - 1
                      ? 'linear-gradient(135deg, #FAF9F5 0%, #EFE8DC 100%)'
                      : 'linear-gradient(135deg, #1E2949 0%, #141C36 100%)'
                    : idx === total - 1
                    ? 'linear-gradient(135deg, #FFFFFF 0%, #FAF5EC 100%)'
                    : 'linear-gradient(135deg, #F5EFE6 0%, #EAE0D0 100%)',
                  color: idx === total - 1 ? '#111827' : isDarkMode ? '#FAF9F5' : '#1E3A5F',
                  border: `1px solid ${idx === total - 1 ? 'rgba(212,175,55,0.7)' : 'rgba(212,175,55,0.35)'}`,
                  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.22)',
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
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: doc.accent,
                    color: '#FFFFFF',
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

        {/* Front Frosted Glass Flap (3D Perspective Tilt Open) */}
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
              ? 'linear-gradient(155deg, rgba(255, 255, 255, 0.14) 0%, rgba(16, 22, 44, 0.72) 100%)'
              : 'linear-gradient(155deg, rgba(255, 255, 255, 0.86) 0%, rgba(250, 245, 236, 0.74) 100%)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.55)',
            borderLeft: '1px solid rgba(212, 175, 55, 0.35)',
            borderRight: '1px solid rgba(212, 175, 55, 0.35)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.45)',
            boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.35), 0 18px 38px rgba(0, 0, 0, 0.2)',
            transformOrigin: 'bottom center',
            transform: isOpen ? 'rotateX(-22deg) translateY(4px)' : 'rotateX(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '21px',
                fontWeight: 800,
                color: isDarkMode ? '#FAF9F5' : '#1E3A5F',
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? 'rgba(250,249,245,0.72)' : '#52525B', marginTop: '4px' }}>
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
              border: '1px solid rgba(212, 175, 55, 0.7)',
              background: 'linear-gradient(135deg, #8B1E24 0%, #521014 100%)',
              color: '#F6E05E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(139, 30, 36, 0.38)',
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
// 7. VIDEO 2 EFFECT: SLIDING ROYAL GLOSSY HOVER STACK (DISCLOSURES & ETHICS)
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
    summary: 'Every contributor may submit up to two (02) original entries in an edition, strictly through the official Sanrachna portal.',
    points: ['Maximum 02 entries per author per edition', 'Late entries are not entertained under any circumstances', 'Open exclusively to GEC Godda students, faculty, staff & alumni'],
  },
  {
    num: '02',
    tag: 'Zero AI',
    title: 'Originality, Anti-Plagiarism & Zero-AI Policy',
    summary: 'Artificial Intelligence (AI) generated write-ups or artwork and any form of plagiarism are strictly prohibited.',
    points: ['100% self-authored manuscripts & self-created visuals only', 'Automated & manual review screening for originality', 'Authors remain responsible for factual accuracy & citations'],
  },
  {
    num: '03',
    tag: 'Conduct',
    title: 'Respectful Content & Community Boundaries',
    summary: 'Content must uphold institutional harmony and avoid sensitive, promotional, or offensive material.',
    points: ['Religious, mythological & derogatory content strictly prohibited', 'No self-promotion, commercial ads, or political interviews', 'Destructive criticism forbidden; constructive suggestions reviewed politely'],
  },
  {
    num: '04',
    tag: 'Editorial',
    title: 'Review Discretion, Edits & Copyright Ownership',
    summary: 'Submission does not guarantee publication. Published material copyright stays solely with संRACHNA.',
    points: ['Editorial Board may edit for grammar, spelling & length', 'Over-length drafts may be returned for author rewrite', 'Republication elsewhere strictly requires prior acknowledgement of संRACHNA'],
  },
];

function SlidingHoverDisclosures({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [indicator, setIndicator] = useState<{ top: number; height: number }>({ top: 0, height: 150 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const syncIndicator = (idx: number) => {
    const node = itemRefs.current[idx];
    const container = containerRef.current;
    if (!node || !container) return;
    setIndicator({
      top: node.offsetTop,
      height: node.offsetHeight,
    });
  };

  useEffect(() => {
    syncIndicator(activeIdx);
    const onResize = () => syncIndicator(activeIdx);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIdx]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sliding Glossy Royal Backdrop (Video 2 Effect) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: `${indicator.height}px`,
          transform: `translate3d(0, ${indicator.top}px, 0)`,
          transition: 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), height 0.48s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, #4E1014 0%, #8B1E24 52%, #1E3A5F 100%)',
          border: '1px solid rgba(212, 175, 55, 0.75)',
          boxShadow: '0 24px 55px rgba(139, 30, 36, 0.36), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {DISCLOSURES_STACK.map((item, idx) => {
        const isHovered = activeIdx === idx;
        return (
          <div
            key={item.num}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            onMouseEnter={() => setActiveIdx(idx)}
            onClick={() => setActiveIdx(idx)}
            style={{
              position: 'relative',
              zIndex: 2,
              borderRadius: '26px',
              padding: '26px 28px',
              cursor: 'pointer',
              border: isHovered
                ? '1px solid transparent'
                : `1px solid ${isDarkMode ? 'rgba(212,175,55,0.18)' : 'rgba(139,30,36,0.14)'}`,
              background: isHovered
                ? 'transparent'
                : isDarkMode
                ? 'rgba(14, 21, 42, 0.55)'
                : 'rgba(255, 255, 255, 0.72)',
              backdropFilter: isHovered ? 'none' : 'blur(14px)',
              color: isHovered ? '#FAF9F5' : isDarkMode ? '#FAF9F5' : '#111827',
              transition: 'color 0.35s ease, background 0.35s ease',
              textAlign: 'left',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: '26px',
                    fontWeight: 700,
                    color: isHovered ? '#F6E05E' : '#D4AF37',
                    lineHeight: 1,
                  }}
                >
                  {item.num}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(18px, 2.2vw, 22px)',
                    fontWeight: 700,
                    color: isHovered ? '#FFFFFF' : isDarkMode ? '#FAF9F5' : '#1E3A5F',
                  }}
                >
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
                  background: isHovered
                    ? 'rgba(212, 175, 55, 0.24)'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(139,30,36,0.08)',
                  color: isHovered ? '#F6E05E' : isDarkMode ? '#D4AF37' : '#8B1E24',
                }}
              >
                {item.tag}
              </span>
            </div>

            <p
              style={{
                margin: '10px 0 14px 0',
                fontSize: '14px',
                lineHeight: 1.65,
                color: isHovered ? 'rgba(250, 249, 245, 0.88)' : isDarkMode ? '#A1A1AA' : '#52525B',
                maxWidth: '680px',
              }}
            >
              {item.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
              {item.points.map((pt, pIdx) => (
                <span
                  key={pIdx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: isHovered ? '#F6E05E' : isDarkMode ? '#D4D4D8' : '#3F3F46',
                  }}
                >
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
// 8. OFFICIAL 12-CATEGORY DATA & BENTO METADATA
// ===========================================================================
interface GuidelinesPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenSubmission: () => void;
}

type CategoryGroup = 'all' | 'writing' | 'media' | 'visual';
type FormatTab = 'english' | 'hindi' | 'visual';

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
    icon: FileText,
    summary:
      'In-depth scientific breakthroughs, engineering trends, research summaries, patents, and national or international perspectives.',
    topics: [
      'Scientific breakthroughs & new discoveries in Science and Technology',
      'Nobel Prize winners’ topics & great scientists’ contributions',
      'Research summaries, technical papers, trending research & patents',
      'Emerging trends in engineering fields',
      'National or international technical and non-technical issues',
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
];

// ===========================================================================
// 9. CURSOR-REACTIVE SPOTLIGHT BENTO TILE
// ===========================================================================
function BentoCategoryTile({
  cat,
  isDarkMode,
  onSelect,
}: {
  cat: CategorySpec;
  isDarkMode: boolean;
  onSelect: () => void;
}) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });
  const Icon = cat.icon;

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

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
        border: `1px solid ${spot.active ? 'rgba(212, 175, 55, 0.72)' : isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 30, 36, 0.14)'}`,
        background: isDarkMode
          ? 'linear-gradient(155deg, rgba(17, 24, 48, 0.76) 0%, rgba(9, 13, 28, 0.88) 100%)'
          : 'linear-gradient(155deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 241, 232, 0.82) 100%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow: spot.active
          ? isDarkMode
            ? '0 24px 55px rgba(139, 30, 36, 0.28), inset 0 1px 2px rgba(255,255,255,0.2)'
            : '0 22px 48px rgba(139, 30, 36, 0.16), inset 0 1px 2px rgba(255,255,255,1)'
          : isDarkMode
          ? '0 14px 36px rgba(0, 0, 0, 0.34)'
          : '0 10px 30px rgba(30, 58, 95, 0.06)',
        transform: spot.active ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.35s ease',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '215px',
        fontFamily: 'inherit',
      }}
    >
      {/* Dynamic Cursor-Following Spotlight Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: spot.active ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(280px circle at ${spot.x}px ${spot.y}px, ${
            isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.22)'
          }, transparent 70%)`,
        }}
      />

      {/* Giant Watermark Number */}
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
          color: isDarkMode ? 'rgba(212, 175, 55, 0.07)' : 'rgba(139, 30, 36, 0.06)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {cat.number}
      </span>

      {/* Top Row: Icon + Limit Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', position: 'relative', zIndex: 2 }}>
        <span
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: spot.active
              ? 'linear-gradient(135deg, #8B1E24 0%, #D4AF37 100%)'
              : isDarkMode
              ? 'rgba(212, 175, 55, 0.14)'
              : 'rgba(139, 30, 36, 0.09)',
            color: spot.active ? '#FFFFFF' : isDarkMode ? '#F6E05E' : '#8B1E24',
            transition: 'all 0.35s ease',
          }}
        >
          <Icon size={19} />
        </span>

        <span
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.3px',
            background: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : 'rgba(139, 30, 36, 0.09)',
            color: isDarkMode ? '#F6E05E' : '#8B1E24',
            border: '1px solid rgba(212, 175, 55, 0.32)',
          }}
        >
          {cat.limitLabel}
        </span>
      </div>

      {/* Middle Row: Title + Summary */}
      <div style={{ margin: '18px 0 16px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37' }}>
          {cat.domain}
        </div>
        <h3
          style={{
            margin: '5px 0 0 0',
            fontFamily: "'Playfair Display', serif",
            fontSize: cat.featuredSpan ? '24px' : '20px',
            fontWeight: 700,
            color: isDarkMode ? '#FAF9F5' : '#1E3A5F',
            lineHeight: 1.2,
          }}
        >
          {cat.name}{' '}
          <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ({cat.hindiName})
          </span>
        </h3>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            lineHeight: 1.6,
            color: isDarkMode ? '#A1A1AA' : '#52525B',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {cat.summary}
        </p>
      </div>

      {/* Bottom Row: File Format + Open Cue */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(139,30,36,0.1)'}`,
          fontSize: '11.5px',
          fontWeight: 700,
          color: isDarkMode ? '#D4D4D8' : '#3F3F46',
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
            color: '#D4AF37',
            transform: spot.active ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.3s ease',
          }}
        >
          <span>Inspect Rules</span>
          <ArrowRight size={13} />
        </span>
      </div>
    </button>
  );
}

// ===========================================================================
// 10. MAIN AWWWARDS-GRADE GUIDELINES PAGE
// ===========================================================================
export default function GuidelinesPage({
  isDarkMode,
  onToggleTheme,
  onBack,
  onOpenSubmission,
}: GuidelinesPageProps) {
  const [activeGroup, setActiveGroup] = useState<CategoryGroup>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalCatId, setActiveModalCatId] = useState<string | null>(null);
  const [formatTab, setFormatTab] = useState<FormatTab>('english');
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean[]>>({});
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalCatId(null);
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

  const scrollToAnchor = (id: string) => {
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

  // Official Social Links matching main App.tsx
  const socialChannels = [
    {
      name: 'GEC Godda Website',
      handle: 'gecgodda.ac.in',
      href: 'https://gecgodda.ac.in',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      name: 'Official Email',
      handle: 'sanrachna.gecgodda@gmail.com',
      href: 'mailto:sanrachna.gecgodda@gmail.com',
      svg: <Mail size={20} />,
    },
    {
      name: 'Instagram',
      handle: '@sanrachna.magazine',
      href: 'https://instagram.com/sanrachna.magazine',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
  ];

  // Theme Colors
  const bg = isDarkMode ? '#070B19' : '#FAF9F5';
  const textMain = isDarkMode ? '#FAF9F5' : '#111827';
  const textSub = isDarkMode ? '#A1A1AA' : '#52525B';
  const hairline = isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 30, 36, 0.14)';

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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        .san-awwwards-gp * { box-sizing: border-box; }

        @keyframes diaWipeIn {
          0% {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(10px) scale(0.97);
            background-position: 100% 50%;
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0) scale(1);
            background-position: 0% 50%;
          }
        }

        @keyframes diaWipeOut {
          0% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(-10px);
          }
        }

        .dia-word-in {
          animation: diaWipeIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .dia-word-out {
          animation: diaWipeOut 0.4s ease forwards;
        }

        @keyframes caretBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animated-caret {
          display: inline-block;
          margin-left: 2px;
          color: #D4AF37;
          font-weight: 700;
          animation: caretBlink 1s infinite;
        }

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

        .gp-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* Dynamic Island Floating Capsule Header */
        .gp-capsule-wrap {
          position: sticky;
          top: 14px;
          z-index: 80;
          padding: 0 20px;
          pointer-events: none;
        }

        .gp-capsule-nav {
          pointer-events: auto;
          max-width: 1180px;
          margin: 0 auto;
          padding: 10px 16px 10px 18px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: ${isDarkMode ? 'rgba(9, 14, 30, 0.78)' : 'rgba(255, 253, 249, 0.84)'};
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(212, 175, 55, 0.42);
          box-shadow: ${isDarkMode
            ? '0 18px 46px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255,255,255,0.14)'
            : '0 16px 40px rgba(30, 58, 95, 0.1), inset 0 1px 2px rgba(255,255,255,1)'};
        }

        .gp-nav-link {
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: ${textSub};
          cursor: pointer;
          padding: 7px 12px;
          border-radius: 999px;
          transition: all 0.25s ease;
        }
        .gp-nav-link:hover {
          color: #D4AF37;
          background: ${isDarkMode ? 'rgba(212,175,55,0.1)' : 'rgba(139,30,36,0.06)'};
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
          border: 1px solid rgba(212, 175, 55, 0.45);
          background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'};
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
          border-color: #F6E05E;
          background: linear-gradient(135deg, #8B1E24 0%, #521014 100%);
          color: #FFFFFF;
          box-shadow: 0 14px 32px rgba(139, 30, 36, 0.34);
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
          padding: 12px 24px;
          border-radius: 999px;
          border: 1px solid #F6E05E;
          background: linear-gradient(135deg, #8B1E24 0%, #B91C1C 45%, #D4AF37 100%);
          background-size: 200% 200%;
          animation: royalFlow 5s ease infinite;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 12px 30px rgba(139, 30, 36, 0.4), inset 0 1.5px 2px rgba(255,255,255,0.45);
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
          box-shadow: 0 18px 40px rgba(212, 175, 55, 0.38);
        }
        .gp-magnetic-cta:hover::after {
          animation: sheenPass 0.8s ease;
        }

        .gp-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(139, 30, 36, 0.45) 25%, rgba(212, 175, 55, 0.72) 50%, rgba(30, 58, 95, 0.45) 75%, transparent 100%);
        }

        /* Asymmetric Bento Grid */
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
          grid-template-columns: 1.1fr 0.9fr;
          gap: 28px;
          align-items: stretch;
        }

        .gp-disclosures-split {
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 44px;
          align-items: start;
        }

        .gp-filter-chip {
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid ${hairline};
          background: ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.78)'};
          color: ${textSub};
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s ease;
        }
        .gp-filter-chip:hover {
          border-color: #D4AF37;
          color: ${textMain};
        }
        .gp-filter-chip.active {
          background: linear-gradient(135deg, #8B1E24 0%, #521014 100%);
          border-color: #F6E05E;
          color: #FFFFFF;
          box-shadow: 0 8px 22px rgba(139, 30, 36, 0.32);
        }

        /* Full-bleed Footer Social Icon Cards */
        .gp-social-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          border-radius: 18px;
          border: 1px solid ${hairline};
          background: ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)'};
          backdrop-filter: blur(14px);
          color: ${textMain};
          text-decoration: none;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gp-social-chip:hover {
          transform: translateY(-4px);
          border-color: #D4AF37;
          background: linear-gradient(135deg, rgba(139,30,36,0.9) 0%, rgba(30,58,95,0.9) 100%);
          color: #FFFFFF;
          box-shadow: 0 16px 34px rgba(139, 30, 36, 0.32);
        }
        .gp-social-chip:hover span {
          color: rgba(250, 249, 245, 0.85) !important;
        }

        .gp-footer-cols {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1.35fr;
          gap: 44px;
          align-items: start;
        }

        @media (max-width: 1080px) {
          .bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .gp-disclosures-split,
          .gp-format-bento,
          .gp-footer-cols {
            grid-template-columns: 1fr;
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
          .gp-folders-grid {
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
          background: 'linear-gradient(90deg, #8B1E24 0%, #D4AF37 55%, #F6E05E 100%)',
          boxShadow: '0 0 14px rgba(212, 175, 55, 0.85)',
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
              ? 'radial-gradient(circle, rgba(139,30,36,0.28) 0%, rgba(212,175,55,0.12) 45%, transparent 72%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(139,30,36,0.08) 45%, transparent 72%)',
            filter: 'blur(85px)',
          }}
        />
      </div>

      {/* ================================================================= */}
      {/* FLOATING DYNAMIC-ISLAND GLASS HEADER WITH SANRACHNA LOGO          */}
      {/* ================================================================= */}
      <div className="gp-capsule-wrap">
        <header className="gp-capsule-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onBack}
              className="gp-glass-pill"
              style={{ padding: '8px 15px', fontSize: '11px' }}
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
              <span
                style={{
                  fontFamily: "'Rozha One', 'Playfair Display', serif",
                  fontSize: '19px',
                  color: '#D4AF37',
                  letterSpacing: '0.4px',
                }}
              >
                संRACHNA
              </span>
            </div>
          </div>

          <nav className="gp-hide-md" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button type="button" onClick={() => scrollToAnchor('bento-categories')} className="gp-nav-link">
              12 Categories
            </button>
            <button type="button" onClick={() => scrollToAnchor('glass-folders')} className="gp-nav-link">
              Official Kit
            </button>
            <button type="button" onClick={() => scrollToAnchor('formatting-studio')} className="gp-nav-link">
              Formatting
            </button>
            <button type="button" onClick={() => scrollToAnchor('editorial-ethics')} className="gp-nav-link">
              Disclosures
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="gp-glass-pill"
              style={{ width: '38px', height: '38px', padding: 0 }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={15} color="#F6E05E" /> : <Moon size={15} color="#1E3A5F" />}
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
        {/* CINEMATIC HERO WITH ORBITING SHUNYA RING + DIA TEXT REVEAL        */}
        {/* ================================================================= */}
        <section
          className="gp-inner"
          style={{
            position: 'relative',
            paddingTop: '72px',
            paddingBottom: '88px',
            textAlign: 'center',
          }}
        >
          {/* Rotating Geometric "The Zero (शून्य)" Orbital Ring */}
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '2.6px',
                textTransform: 'uppercase',
                color: '#D4AF37',
                marginBottom: '22px',
              }}
            >
              <span style={{ width: '28px', height: '1px', background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
              <span>Government Engineering College, Godda • Editorial Handbook</span>
              <span style={{ width: '28px', height: '1px', background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
            </div>

            <h1
              style={{
                margin: '0 auto 22px auto',
                maxWidth: '940px',
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: 'clamp(44px, 7.2vw, 88px)',
                fontWeight: 700,
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                color: textMain,
              }}
            >
              Craft worth <DiaTextReveal isDarkMode={isDarkMode} />
            </h1>

            <p
              style={{
                margin: '0 auto 34px auto',
                maxWidth: '680px',
                fontSize: 'clamp(15.5px, 1.8vw, 19px)',
                lineHeight: 1.75,
                color: textSub,
              }}
            >
              Edition I Theme — <strong style={{ color: '#D4AF37' }}>THE ZERO (शून्य)</strong>{' '}
              <span style={{ opacity: 0.72 }}>(related to, but not restricted to)</span>. Explore all 12 official categories, test your draft with live odometer counters, and prepare print-ready submissions.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={() => scrollToAnchor('bento-categories')}
                className="gp-magnetic-cta"
              >
                <span>Explore 12 Categories</span>
                <ArrowRight size={15} />
              </button>

              <a
                href="/Guidelines.pdf"
                download="Sanrachna_Guidelines_2026.pdf"
                className="gp-glass-pill"
              >
                <Download size={14} />
                <span>Guidelines PDF</span>
              </a>

              <a
                href="/Template for Submission.pdf"
                download="Sanrachna_Template_2026.pdf"
                className="gp-glass-pill"
              >
                <Download size={14} />
                <span>Template PDF</span>
              </a>
            </div>
          </BlurReveal>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 01: ASYMMETRIC BENTO GRID (12 CATEGORIES) + ANIMATED INPUT */}
        {/* ================================================================= */}
        <section id="bento-categories" className="gp-inner" style={{ paddingTop: '76px', paddingBottom: '84px' }}>
          <BlurReveal>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '22px',
                marginBottom: '28px',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                  01 • Interactive Editorial Bento
                </div>
                <h2
                  style={{
                    margin: '6px 0 0 0',
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: 'clamp(34px, 4.4vw, 52px)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    color: textMain,
                  }}
                >
                  Choose Your Submission Category
                </h2>
              </div>

              <AnimatedSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              {(
                [
                  { id: 'all', label: 'All 12 Categories' },
                  { id: 'writing', label: 'Writing & Poetry' },
                  { id: 'media', label: 'Campus & Media' },
                  { id: 'visual', label: 'Art & Photography' },
                ] as { id: CategoryGroup; label: string }[]
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveGroup(chip.id)}
                  className={`gp-filter-chip ${activeGroup === chip.id ? 'active' : ''}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </BlurReveal>

          {/* 12-Category Asymmetric Cursor-Spotlight Bento Grid */}
          <div className="bento-grid">
            {filteredCategories.map((cat) => (
              <BentoCategoryTile
                key={cat.id}
                cat={cat}
                isDarkMode={isDarkMode}
                onSelect={() => setActiveModalCatId(cat.id)}
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
        {/* SECTION 02: INTERACTIVE GLASS FOLDER CARDS (VIDEO 5 EFFECT)       */}
        {/* ================================================================= */}
        <section id="glass-folders" className="gp-inner" style={{ paddingTop: '76px', paddingBottom: '88px' }}>
          <BlurReveal>
            <div style={{ textAlign: 'left', marginBottom: '36px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                02 • Interactive Editorial Folders
              </div>
              <h2
                style={{
                  margin: '6px 0 8px 0',
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontSize: 'clamp(34px, 4.4vw, 52px)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color: textMain,
                }}
              >
                Downloads &amp; Pre-Submission Kit
              </h2>
              <p style={{ margin: 0, maxWidth: '640px', fontSize: '15px', color: textSub, lineHeight: 1.65 }}>
                Hover or tap either frosted-glass folder to fan out the official PDFs and the 4 mandatory items every contributor must keep ready.
              </p>
            </div>
          </BlurReveal>

          <BlurReveal delay={100}>
            <div className="gp-folders-grid">
              <GlassFolderCard
                title="Official Submission Kit"
                subtitle="Hover or tap to fan out & download PDFs"
                isDarkMode={isDarkMode}
                primaryActionLabel="Download Official Guidelines PDF"
                onPrimaryAction={() => triggerDownload('/Guidelines.pdf', 'Sanrachna_Guidelines_2026.pdf')}
                docs={[
                  {
                    title: 'A4 Typography & 300 DPI Rules',
                    meta: 'Bookman Old 11pt • KrutiDev/Mangal 14pt',
                    tag: 'SPEC',
                    accent: '#1E3A5F',
                  },
                  {
                    title: 'Template for Submission.pdf',
                    meta: 'Official formatted A4 reference template',
                    tag: 'PDF ↓',
                    accent: '#B45309',
                    href: '/Template for Submission.pdf',
                    downloadName: 'Sanrachna_Template_2026.pdf',
                  },
                  {
                    title: 'Sanrachna Guidelines 2026.pdf',
                    meta: 'Complete official GEC Godda circular',
                    tag: 'PDF ↓',
                    accent: '#8B1E24',
                    href: '/Guidelines.pdf',
                    downloadName: 'Sanrachna_Guidelines_2026.pdf',
                  },
                ]}
              />

              <GlassFolderCard
                title="Pre-Submission Essentials"
                subtitle="4 mandatory items required before uploading"
                isDarkMode={isDarkMode}
                primaryActionLabel="Open Submission Portal"
                onPrimaryAction={onOpenSubmission}
                docs={[
                  {
                    title: '(d) Artwork / Photo Description',
                    meta: 'Short caption & story for every visual entry',
                    tag: 'VISUAL',
                    accent: '#1E3A5F',
                  },
                  {
                    title: '(c) Clear Descriptive Title',
                    meta: 'At top of article + separate supporting media',
                    tag: 'TITLE',
                    accent: '#6B21A8',
                  },
                  {
                    title: '(b) Author Photograph (300 DPI)',
                    meta: 'Sharp portrait image attached separately',
                    tag: '300 DPI',
                    accent: '#B45309',
                  },
                  {
                    title: '(a) Brief Author Biography',
                    meta: 'Name, Branch, Batch & short bio of contributor',
                    tag: 'BIO',
                    accent: '#8B1E24',
                  },
                ]}
              />
            </div>
          </BlurReveal>
        </section>

        <div className="gp-inner">
          <div className="gp-divider" />
        </div>

        {/* ================================================================= */}
        {/* SECTION 03: FORMATTING STUDIO & LIVE MORPHING A4 SPECIMEN         */}
        {/* ================================================================= */}
        <section id="formatting-studio" className="gp-inner" style={{ paddingTop: '76px', paddingBottom: '88px' }}>
          <BlurReveal>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px', marginBottom: '34px' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                  03 • Typography &amp; Print Blueprint
                </div>
                <h2
                  style={{
                    margin: '6px 0 0 0',
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: 'clamp(34px, 4.4vw, 52px)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    color: textMain,
                  }}
                >
                  Formatting &amp; Live A4 Preview
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(
                  [
                    { id: 'english', label: 'English Text' },
                    { id: 'hindi', label: 'हिन्दी Text' },
                    { id: 'visual', label: 'Images & 300 DPI' },
                  ] as { id: FormatTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormatTab(tab.id)}
                    className={`gp-filter-chip ${formatTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </BlurReveal>

          <BlurReveal delay={100}>
            <div className="gp-format-bento">
              {/* Left: Flowing Editorial Specification Ledger */}
              <div
                style={{
                  borderRadius: '28px',
                  padding: '30px 32px',
                  border: `1px solid ${hairline}`,
                  background: isDarkMode
                    ? 'linear-gradient(155deg, rgba(16, 23, 46, 0.72) 0%, rgba(9, 13, 28, 0.86) 100%)'
                    : 'linear-gradient(155deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 243, 234, 0.85) 100%)',
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
                    <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                      {item.k}
                    </span>
                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: textMain }}>{item.v}</span>
                  </div>
                ))}
              </div>

              {/* Right: Live Morphing A4 Glass Specimen */}
              <div
                style={{
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: isDarkMode
                    ? 'linear-gradient(155deg, rgba(24, 32, 62, 0.88) 0%, rgba(10, 14, 30, 0.94) 100%)'
                    : 'linear-gradient(155deg, #FFFFFF 0%, #F5EDE0 100%)',
                  boxShadow: isDarkMode
                    ? '0 26px 60px rgba(0, 0, 0, 0.5)'
                    : '0 22px 52px rgba(139, 30, 36, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4AF37' }}>
                    <Eye size={14} />
                    <span>Live A4 Specimen</span>
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: textSub }}>1&quot; Margins • A4</span>
                </div>

                <div
                  style={{
                    flex: 1,
                    border: '1px dashed rgba(212, 175, 55, 0.45)',
                    borderRadius: '16px',
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {formatTab === 'english' && (
                    <div style={{ fontFamily: "'Bookman Old Style', Georgia, serif" }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: textMain }}>
                        The Architecture of Zero (14pt Bold)
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#D4AF37', marginTop: '7px' }}>
                        Sub-heading in 12pt Bold
                      </div>
                      <p style={{ fontSize: '12.5px', lineHeight: 1.8, color: textSub, margin: '12px 0' }}>
                        Manuscript text styled in Bookman Old Style (11pt) with 1.5 line spacing and 6pt spacing after each paragraph, prepared in editable .doc or .docx format.
                      </p>
                      <div style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#D4AF37', marginTop: '20px' }}>
                        — 1 — (Bottom Centre)
                      </div>
                    </div>
                  )}

                  {formatTab === 'hindi' && (
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
                      <div style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#D4AF37', marginTop: '20px' }}>
                        — १ — (Bottom Centre)
                      </div>
                    </div>
                  )}

                  {formatTab === 'visual' && (
                    <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                      <div
                        style={{
                          height: '124px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(139,30,36,0.3), rgba(212,175,55,0.28), rgba(30,58,95,0.34))',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Image size={30} color="#D4AF37" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: textMain, marginTop: '8px' }}>
                          Standalone 300 DPI Image (.JPG / .PNG / .GIF)
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: textSub, marginTop: '14px', marginBottom: 0 }}>
                        Upload artwork, photos &amp; author portraits separately—never pasted inside Word files.
                      </p>
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
        {/* SECTION 04: STICKY SPLIT + SLIDING HOVER STACK (VIDEO 2 EFFECT)   */}
        {/* ================================================================= */}
        <section id="editorial-ethics" className="gp-inner" style={{ paddingTop: '76px', paddingBottom: '96px' }}>
          <div className="gp-disclosures-split">
            {/* Left Sticky Editorial Column */}
            <div style={{ position: 'sticky', top: '104px', textAlign: 'left' }}>
              <BlurReveal>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                  04 • Ethics &amp; Disclosures
                </div>
                <h2
                  style={{
                    margin: '8px 0 14px 0',
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: 'clamp(34px, 4.4vw, 52px)',
                    fontWeight: 700,
                    lineHeight: 1.06,
                    color: textMain,
                  }}
                >
                  Standards That Protect Every Voice
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '15px', lineHeight: 1.7, color: textSub }}>
                  Glide across each card to inspect संRACHNA&apos;s official policies on originality, conduct, review rights, and publication copyright.
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 18px',
                    borderRadius: '18px',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    background: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(139, 30, 36, 0.06)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isDarkMode ? '#F6E05E' : '#8B1E24',
                  }}
                >
                  <Award size={18} />
                  <span>E-Certificate to the Best Content Submitter</span>
                </div>
              </BlurReveal>
            </div>

            {/* Right: Video 2 Sliding Glossy Hover Stack */}
            <BlurReveal delay={120}>
              <SlidingHoverDisclosures isDarkMode={isDarkMode} />
            </BlurReveal>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FULL-BLEED CINEMATIC FOOTER (NO DABBA • LOGOS + ALL 5 LINKS)      */}
        {/* ================================================================= */}
        <footer
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: isDarkMode
              ? 'linear-gradient(180deg, #070B19 0%, #0A0F24 45%, #120912 100%)'
              : 'linear-gradient(180deg, #FAF9F5 0%, #F3EBE0 55%, #E8D9C5 100%)',
            borderTop: '1.5px solid transparent',
            borderImage: 'linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1',
            paddingTop: '84px',
          }}
        >
          {/* Closing Editorial Hero Statement (Full-Bleed, Open & Airy) */}
          <div className="gp-inner" style={{ textAlign: 'center', paddingBottom: '68px' }}>
            <BlurReveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '2.4px', textTransform: 'uppercase', color: '#D4AF37' }}>
                <Sparkles size={14} />
                <span>Team संRACHNA • Government Engineering College, Godda</span>
              </div>

              <h2
                style={{
                  margin: '16px auto 14px auto',
                  maxWidth: '880px',
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontSize: 'clamp(32px, 5vw, 58px)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color: textMain,
                }}
              >
                &ldquo;Inform, Engage, Celebrate Talent, and Preserve Memories&rdquo;
              </h2>

              <p style={{ margin: '0 auto 30px auto', maxWidth: '580px', fontSize: '15.5px', lineHeight: 1.7, color: textSub }}>
                Ready with your formatted manuscript, poetry, sketch, or photograph? Step into the official portal and share your creation with the campus.
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

          {/* 3-Column Brand, Quick Links & All 5 Official Channels */}
          <div className="gp-inner" style={{ paddingTop: '56px', paddingBottom: '56px' }}>
            <div className="gp-footer-cols">
              {/* Column 1: Both Official Logos + Institutional Identity */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
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
                    <div style={{ fontFamily: "'Rozha One', 'Playfair Display', serif", fontSize: '24px', color: '#D4AF37', lineHeight: 1.05 }}>
                      संRACHNA
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: textSub, marginTop: '2px' }}>
                      सृजन से निर्माण तक
                    </div>
                  </div>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', lineHeight: 1.7, color: textSub }}>
                  The official annual college magazine of Government Engineering College, Godda. Edition I — Theme: <strong style={{ color: '#D4AF37' }}>The Zero (शून्य)</strong>.
                </p>
                <div style={{ fontSize: '12px', color: textSub, opacity: 0.85 }}>
                  Chhatra, Poreyahat, Godda, Jharkhand – 814153
                </div>
              </div>

              {/* Column 2: Quick Navigation & Downloads */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '16px' }}>
                  Handbook Navigation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                  {[
                    { label: '← Return to Main Portal', action: onBack },
                    { label: '12 Submission Categories', action: () => scrollToAnchor('bento-categories') },
                    { label: 'Downloads & Pre-Submission Kit', action: () => scrollToAnchor('glass-folders') },
                    { label: 'Formatting & Live A4 Preview', action: () => scrollToAnchor('formatting-studio') },
                    { label: 'Ethics, Copyright & Disclosures', action: () => scrollToAnchor('editorial-ethics') },
                  ].map((nav) => (
                    <button
                      key={nav.label}
                      type="button"
                      onClick={nav.action}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: textMain,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {nav.label}
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <a href="/Guidelines.pdf" download="Sanrachna_Guidelines_2026.pdf" style={{ color: '#D4AF37', fontSize: '13px', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #D4AF37' }}>
                      Guidelines PDF ↓
                    </a>
                    <a href="/Template for Submission.pdf" download="Sanrachna_Template_2026.pdf" style={{ color: textMain, fontSize: '13px', fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${textMain}` }}>
                      Template PDF ↓
                    </a>
                  </div>
                </div>
              </div>

              {/* Column 3: ALL 5 Official Channels with Icons */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '16px' }}>
                  Official Channels &amp; Connect
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '10px' }}>
                  {socialChannels.map((ch) => (
                    <a
                      key={ch.name}
                      href={ch.href}
                      target={ch.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={ch.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className="gp-social-chip"
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
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
                        <div style={{ fontSize: '12.5px', fontWeight: 700, lineHeight: 1.2 }}>{ch.name}</div>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
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
            </div>
          </div>

          {/* Subtle Oversized Editorial Watermark + Bottom Copyright Strip */}
          <div style={{ position: 'relative', overflow: 'hidden', borderTop: `1px solid ${hairline}` }}>
            <div
              aria-hidden="true"
              style={{
                textAlign: 'center',
                fontFamily: "'Rozha One', 'Playfair Display', serif",
                fontSize: 'clamp(56px, 13vw, 170px)',
                lineHeight: 0.85,
                letterSpacing: '0.04em',
                color: isDarkMode ? 'rgba(212, 175, 55, 0.05)' : 'rgba(139, 30, 36, 0.055)',
                userSelect: 'none',
                pointerEvents: 'none',
                paddingTop: '14px',
              }}
            >
              संRACHNA
            </div>

            <div
              className="gp-inner"
              style={{
                paddingTop: '16px',
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
      {/* FROSTED-GLASS SPOTLIGHT MODAL + ANIMATE DIGITS (VIDEO 3 EFFECT)   */}
      {/* ================================================================= */}
      {modalCat && (() => {
        const ModalIcon = modalCat.icon;
        const checks = checkedMap[modalCat.id] ?? modalCat.checklist.map(() => false);
        const doneCount = checks.filter(Boolean).length;
        const allReady = doneCount === modalCat.checklist.length;
        const draft = draftMap[modalCat.id] ?? '';
        const liveCount =
          modalCat.unit === 'lines'
            ? draft.split(/\r?\n/).filter((l) => l.trim().length > 0).length
            : draft.trim()
            ? draft.trim().split(/\s+/).length
            : 0;
        const gaugePercent =
          modalCat.unit === 'nos' ? 100 : Math.min(100, Math.round((liveCount / modalCat.max) * 100));

        return (
          <div
            onClick={() => setActiveModalCatId(null)}
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
              {/* Header Bar */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #8B1E24 0%, #521014 100%)',
                      border: '1px solid rgba(212,175,55,0.7)',
                      color: '#F6E05E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ModalIcon size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#D4AF37' }}>
                      Category {modalCat.number} • {modalCat.domain}
                    </div>
                    <h3
                      style={{
                        margin: '4px 0 0 0',
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: 'clamp(26px, 3.6vw, 36px)',
                        fontWeight: 700,
                        color: textMain,
                        lineHeight: 1.1,
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
                    onClick={() => setActiveModalCatId(null)}
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

              {/* Special Notice if present */}
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

              {/* Split Body: Left Topics + Rolling Odometer Counter | Right Readiness Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '10px' }}>
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

                  {/* Video 3 Effect: Live Rolling Odometer Word / Line Counter */}
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
                          <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#D4AF37' }}>
                            Live {modalCat.unit === 'lines' ? 'Line' : 'Word'} Odometer
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
                                ? '#EF4444'
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
                            ? 'Paste your poem here to watch the live odometer count lines...'
                            : `Paste your ${modalCat.name.toLowerCase()} draft here to count words live...`
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
                                ? '#EF4444'
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

                {/* Right Side: Interactive Checklist + Portal CTA */}
                <div
                  style={{
                    padding: '22px',
                    borderRadius: '22px',
                    border: `1px solid ${allReady ? 'rgba(34,197,94,0.55)' : 'rgba(212,175,55,0.35)'}`,
                    background: isDarkMode
                      ? 'linear-gradient(155deg, rgba(139,30,36,0.16) 0%, rgba(14,20,40,0.72) 100%)'
                      : 'linear-gradient(155deg, rgba(255,255,255,0.94) 0%, rgba(244,236,225,0.88) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#D4AF37' }}>
                        Pre-Flight Checklist
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: allReady ? '#22C55E' : textSub }}>
                        {doneCount}/{modalCat.checklist.length} Ready
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {modalCat.checklist.map((item, idx) => {
                        const checked = checks[idx];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleCheck(modalCat.id, modalCat.checklist.length, idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '13px',
                              border: checked ? '1px solid rgba(34, 197, 94, 0.5)' : `1px solid ${hairline}`,
                              background: checked ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                              color: textMain,
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
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
                                border: checked ? '1px solid #22C55E' : `1.5px solid ${textSub}`,
                                background: checked ? '#22C55E' : 'transparent',
                                color: '#070B19',
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

                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: textSub }}>
                      <ShieldAlert size={15} color="#D4AF37" style={{ flexShrink: 0 }} />
                      <span>Strict Zero-AI &amp; Anti-Plagiarism screening applies.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalCatId(null);
                      onOpenSubmission();
                    }}
                    className="gp-magnetic-cta"
                    style={{ width: '100%', marginTop: '20px', padding: '14px 20px' }}
                  >
                    {allReady && <CheckCircle2 size={16} />}
                    <span>Submit {modalCat.name} in Portal</span>
                    <ArrowRight size={15} />
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
