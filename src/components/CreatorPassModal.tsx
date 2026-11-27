import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';

/* ============================================================================
   TYPES, CONSTANTS & EDITORIAL PALETTES
   ============================================================================ */

export interface CreatorPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

type ShaderMode = 'OBSIDIAN' | 'BLUEPRINT' | 'INK';
type PhysicsMode = 'FLUID' | 'VORTEX' | 'SWARM';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ThemeTokens {
  bgHex: string;
  bgRgb: RGB;
  particleRgb: RGB;
  accentRgb: RGB;
  gridRgb: RGB;
  textPrimary: string;
  textMuted: string;
  glassBg: string;
  glassBorder: string;
  pillActiveBg: string;
  pillActiveText: string;
  vignette: string;
  isLight: boolean;
}

const CREATOR_EMAIL = 'samratsandilya4@gmail.com';
const CREATOR_INSTAGRAM_URL = 'https://www.instagram.com/samrat.tiwary';
const CREATOR_INSTAGRAM_HANDLE = '@samrat.tiwary';
const CREATOR_LINKEDIN_URL = 'https://www.linkedin.com/in/samrat-sandilya';
const CREATOR_LINKEDIN_HANDLE = 'in/samrat-sandilya';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+#*<>';

const THEMES: Record<ShaderMode, ThemeTokens> = {
  OBSIDIAN: {
    bgHex: '#060608',
    bgRgb: { r: 6, g: 6, b: 8 },
    particleRgb: { r: 244, g: 242, b: 236 },
    accentRgb: { r: 196, g: 204, b: 218 },
    gridRgb: { r: 255, g: 255, b: 255 },
    textPrimary: '#F4F2EC',
    textMuted: 'rgba(244, 242, 236, 0.52)',
    glassBg: 'rgba(14, 15, 20, 0.62)',
    glassBorder: 'rgba(255, 255, 255, 0.13)',
    pillActiveBg: 'rgba(244, 242, 236, 0.14)',
    pillActiveText: '#FFFFFF',
    vignette:
      'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.72) 100%)',
    isLight: false,
  },
  BLUEPRINT: {
    bgHex: '#040B16',
    bgRgb: { r: 4, g: 11, b: 22 },
    particleRgb: { r: 214, g: 240, b: 255 },
    accentRgb: { r: 56, g: 189, b: 248 },
    gridRgb: { r: 56, g: 189, b: 248 },
    textPrimary: '#E0F2FE',
    textMuted: 'rgba(125, 211, 252, 0.62)',
    glassBg: 'rgba(6, 20, 40, 0.66)',
    glassBorder: 'rgba(56, 189, 248, 0.28)',
    pillActiveBg: 'rgba(56, 189, 248, 0.22)',
    pillActiveText: '#F0F9FF',
    vignette:
      'radial-gradient(ellipse at center, transparent 38%, rgba(2,6,14,0.82) 100%)',
    isLight: false,
  },
  INK: {
    bgHex: '#F4F1EA',
    bgRgb: { r: 244, g: 241, b: 234 },
    particleRgb: { r: 12, g: 12, b: 15 },
    accentRgb: { r: 72, g: 68, b: 62 },
    gridRgb: { r: 14, g: 14, b: 18 },
    textPrimary: '#0A0A0C',
    textMuted: 'rgba(10, 10, 12, 0.54)',
    glassBg: 'rgba(250, 248, 242, 0.72)',
    glassBorder: 'rgba(10, 10, 12, 0.14)',
    pillActiveBg: 'rgba(10, 10, 12, 0.1)',
    pillActiveText: '#0A0A0C',
    vignette:
      'radial-gradient(ellipse at center, transparent 48%, rgba(20,18,14,0.12) 100%)',
    isLight: true,
  },
};

/* ============================================================================
   COMPATIBLE SECRET TRIGGER HOOK (FOR App.tsx IMPORT)
   - Supports secret typing ("samrat"), Ctrl+Shift+S, or rapid multi-click
   ============================================================================ */

export function useCreatorPassTrigger(onTrigger?: () => void) {
  const callbackRef = useRef(onTrigger);
  callbackRef.current = onTrigger;
  const clickTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    let buffer = '';

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        callbackRef.current?.();
        return;
      }

      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-8);
        if (buffer.includes('samrat')) {
          buffer = '';
          callbackRef.current?.();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter(
      (t) => now - t < 1600
    );
    clickTimestampsRef.current.push(now);
    if (clickTimestampsRef.current.length >= 5) {
      clickTimestampsRef.current = [];
      callbackRef.current?.();
    }
  }, []);

  return handleSecretClick;
}

/* ============================================================================
   DYNAMIC EDITORIAL FONT LOADER (ZERO CONFIG)
   ============================================================================ */

let fontsInjected = false;
function ensureEditorialFonts() {
  if (fontsInjected || typeof document === 'undefined') return;
  fontsInjected = true;
  const id = 'monolith-editorial-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
}

/* ============================================================================
   WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL AUDIO FILES)
   ============================================================================ */

class MonolithAudioEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public playEntryBass() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(118, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.55);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  public playMechanicalTick(pitch = 920) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.32, now + 0.028);

    gain.gain.setValueAtTime(0.048, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playSoftHover() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.025);

    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.032);
  }

  public playHarmonicChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.035;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.045 / (idx * 0.4 + 1), start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  public playGravityPulse(dropping: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (dropping) {
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.34);
    } else {
      osc.frequency.setValueAtTime(48, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.32);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playShockwaveRelease() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.36);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playImplosionExit() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(42, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.36);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

/* ============================================================================
   MAGNETIC TACTILE BUTTON (PURE GPU CSS + SPECULAR LIGHT SHEEN)
   ============================================================================ */

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  style?: React.CSSProperties;
  strength?: number;
  title?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
  target,
  rel,
  className = '',
  style,
  strength = 0.28,
  title,
  buttonRef,
}) => {
  const internalRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);
  const [sheen, setSheen] = useState({ x: 50, y: 50, active: false });

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      internalRef.current = node;
      if (buttonRef && 'current' in buttonRef) {
        (
          buttonRef as React.MutableRefObject<HTMLButtonElement | null>
        ).current = node as HTMLButtonElement | null;
      }
    },
    [buttonRef]
  );

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = internalRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: dx * strength, y: dy * strength });
    setSheen({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  const handleLeave = () => {
    setOffset({ x: 0, y: 0 });
    setPressed(false);
    setSheen((prev) => ({ ...prev, active: false }));
    onMouseLeave?.();
  };

  const mergedStyle: React.CSSProperties = {
    ...style,
    transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0) scale(${pressed ? 0.96 : 1})`,
    transition:
      'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
  };

  const innerContent = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          opacity: sheen.active ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(120px circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.22), transparent 68%)`,
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  const commonProps = {
    style: mergedStyle,
    onMouseMove: handleMove,
    onMouseEnter: () => {
      setSheen((prev) => ({ ...prev, active: true }));
      onMouseEnter?.();
    },
    onMouseLeave: handleLeave,
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    className: `relative overflow-hidden select-none cursor-pointer ${className}`,
    title,
  };

  if (href) {
    return (
      <a
        ref={setRefs as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        {...commonProps}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      ref={setRefs as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      {...commonProps}
    >
      {innerContent}
    </button>
  );
};

/* ============================================================================
   LIQUID SLIDING TOGGLE RAIL (SPRING CAPSULE — ZERO EXTERNAL LIBS)
   ============================================================================ */

interface SlidingPillGroupProps<T extends string> {
  options: T[];
  value: T | null;
  onChange: (val: T) => void;
  theme: ThemeTokens;
}

function SlidingPillGroup<T extends string>({
  options,
  value,
  onChange,
  theme,
}: SlidingPillGroupProps<T>) {
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [capsule, setCapsule] = useState({ left: 0, width: 0, visible: false });

  useEffect(() => {
    if (!value) {
      setCapsule((prev) => ({ ...prev, visible: false }));
      return;
    }
    const el = btnRefs.current[value];
    if (el) {
      setCapsule({
        left: el.offsetLeft,
        width: el.offsetWidth,
        visible: true,
      });
    }
  }, [value, options]);

  return (
    <div
      className="relative flex items-center p-1 rounded-full border backdrop-blur-xl"
      style={{
        backgroundColor: theme.glassBg,
        borderColor: theme.glassBorder,
        transition: 'background-color 0.45s ease, border-color 0.45s ease',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 rounded-full"
        style={{
          left: 0,
          width: `${capsule.width}px`,
          transform: `translate3d(${capsule.left}px, 0, 0)`,
          opacity: capsule.visible ? 1 : 0,
          backgroundColor: theme.pillActiveBg,
          transition:
            'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), width 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease, background-color 0.35s ease',
        }}
      />
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            ref={(node) => {
              btnRefs.current[opt] = node;
            }}
            type="button"
            onClick={() => onChange(opt)}
            className="relative z-10 px-2.5 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase cursor-pointer"
            style={{
              color: active ? theme.pillActiveText : theme.textMuted,
              transition: 'color 0.3s ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   VERTICAL SLOT-ROLL LINK LABEL (PRIMARY -> EXACT HANDLE REVEAL)
   ============================================================================ */

interface SlotRollLabelProps {
  primary: string;
  secondary: string;
  hovered: boolean;
  underlineColor: string;
}

const SlotRollLabel: React.FC<SlotRollLabelProps> = ({
  primary,
  secondary,
  hovered,
  underlineColor,
}) => {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  return (
    <span className="relative inline-flex flex-col overflow-hidden h-[1.25em] leading-[1.25em]">
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap"
        style={{
          transform: hovered ? 'translateY(-105%)' : 'translateY(0%)',
          opacity: hovered ? 0 : 1,
          filter: hovered ? 'blur(4px)' : 'blur(0px)',
          transition: `transform 0.34s ${ease}, opacity 0.3s ease, filter 0.32s ease`,
        }}
      >
        {primary}
      </span>
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap"
        style={{
          transform: hovered ? 'translateY(-100%)' : 'translateY(15%)',
          opacity: hovered ? 1 : 0,
          filter: hovered ? 'blur(0px)' : 'blur(4px)',
          transition: `transform 0.34s ${ease}, opacity 0.3s ease, filter 0.32s ease`,
        }}
      >
        {secondary}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          transformOrigin: 'left center',
          transform: `scaleX(${hovered ? 1 : 0})`,
          backgroundColor: underlineColor,
          transition: `transform 0.34s ${ease}`,
        }}
      />
    </span>
  );
};

/* ============================================================================
   SELF-DRAWING FOUNTAIN-PEN SVG SIGNATURE (NATIVE PATHLENGTH ANIMATION)
   ============================================================================ */

const CreatorSignatureSVG: React.FC<{
  color: string;
  accent: string;
  active: boolean;
}> = ({ color, accent, active }) => {
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <svg
        viewBox="0 0 360 96"
        className="w-[210px] sm:w-[270px] h-auto overflow-visible"
        fill="none"
        aria-label="Samrat Signature"
      >
        <defs>
          <filter
            id="monolith-ink-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          pathLength={1}
          d="M 54 30 C 30 22, 18 42, 42 52 C 68 62, 54 84, 24 76 C 14 73, 18 62, 34 62 C 58 62, 82 40, 96 42 C 106 43, 92 64, 102 64 C 110 64, 118 46, 126 46 C 132 46, 126 64, 134 64 C 142 64, 148 47, 155 47 C 161 47, 156 64, 165 64 C 174 64, 182 46, 190 46 C 198 46, 194 64, 204 64 C 214 64, 224 44, 232 45 C 238 46, 230 64, 242 64 C 254 64, 270 30, 278 22 C 272 42, 266 66, 280 65 C 296 64, 314 54, 336 52"
          stroke={color}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#monolith-ink-glow)"
          strokeDasharray={1}
          strokeDashoffset={active ? 0 : 1}
          style={{
            opacity: active ? 0.94 : 0,
            transition:
              'stroke-dashoffset 2.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, opacity 0.6s ease',
          }}
        />
        <path
          pathLength={1}
          d="M 254 36 C 274 34, 294 31, 316 32"
          stroke={accent}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={active ? 0 : 1}
          style={{
            opacity: active ? 0.85 : 0,
            transition:
              'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1.75s, opacity 0.5s ease 1.7s',
          }}
        />
        <path
          pathLength={1}
          d="M 68 82 C 138 75, 226 73, 304 77"
          stroke={color}
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={active ? 0 : 1}
          style={{
            opacity: active ? 0.55 : 0,
            transition:
              'stroke-dashoffset 0.95s cubic-bezier(0.22, 1, 0.36, 1) 1.95s, opacity 0.5s ease 1.9s',
          }}
        />
      </svg>
    </div>
  );
};

/* ============================================================================
   MAIN COMPONENT: THE ARCHITECT'S MONOLITH (CREATOR PASS MODAL)
   ============================================================================ */

export const CreatorPassModal: React.FC<CreatorPassModalProps> = ({
  isOpen = true,
  onClose,
  isDarkMode = true,
}) => {
  // Core modal & choreography states
  const [mountedVisible, setMountedVisible] = useState(false);
  const [shaderMode, setShaderMode] = useState<ShaderMode>(
    isDarkMode ? 'OBSIDIAN' : 'INK'
  );
  const [physicsMode, setPhysicsMode] = useState<PhysicsMode>('FLUID');
  const [gravityOn, setGravityOn] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [xrayEnabled, setXrayEnabled] = useState(true);
  const [bulletTime, setBulletTime] = useState(false);
  const [isHoldingVortex, setIsHoldingVortex] = useState(false);
  const [isImploding, setIsImploding] = useState(false);

  // 0.8s Architectural Telemetry Intro Flash + Reality-Tear Shutters
  const [introActive, setIntroActive] = useState(true);
  const [shutterOpened, setShutterOpened] = useState(false);
  const [introPercent, setIntroPercent] = useState(0);

  // Scroll-driven Rack Focus (0 = Hero Monolith sharp, 1 = Signature/Telemetry sharp)
  const [scrollStage, setScrollStage] = useState(0);

  // Live Telemetry (Real DOM + Viewport + IST + FPS + Cursor)
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    domNodes: 0,
    viewport: '0 × 0',
    istTime: '--:--:-- IST',
    cursorX: 0,
    cursorY: 0,
    particles: 0,
  });

  // Contact Dock interactive states
  const [emailDisplay, setEmailDisplay] = useState(CREATOR_EMAIL);
  const [emailCopied, setEmailCopied] = useState(false);
  const [instaHovered, setInstaHovered] = useState(false);
  const [linkedinHovered, setLinkedinHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Gyroscope subtle tilt for mobile specular reflection & drift
  const [gyroTilt, setGyroTilt] = useState({ x: 0, y: 0 });

  // DOM & Engine Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const xrayLayerRef = useRef<HTMLDivElement | null>(null);
  const xrayRingRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<MonolithAudioEngine | null>(null);
  const scrambleTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  // Live mutable state bridge for 60fps Canvas RAF (zero React re-renders per frame)
  const engineStateRef = useRef({
    shaderMode: (isDarkMode ? 'OBSIDIAN' : 'INK') as ShaderMode,
    physicsMode: 'FLUID' as PhysicsMode,
    gravityOn: false,
    bulletTime: false,
    imploding: false,
    implodeTarget: { x: 0, y: 0 },
    pointer: {
      x: -9999,
      y: -9999,
      vx: 0,
      vy: 0,
      down: false,
      active: false,
    },
    lens: { x: -400, y: -400, radius: 118 },
    gyro: { x: 0, y: 0 },
    scrollTarget: 0,
    scrollCurrent: 0,
    shockwaves: [] as Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      strength: number;
      alpha: number;
    }>,
    fps: 60,
    particleCount: 0,
  });

  const theme = THEMES[shaderMode];

  // Sync with parent app's `isDarkMode` live
  useEffect(() => {
    const mapped: ShaderMode = isDarkMode ? 'OBSIDIAN' : 'INK';
    setShaderMode(mapped);
    engineStateRef.current.shaderMode = mapped;
  }, [isDarkMode]);

  useEffect(() => {
    engineStateRef.current.shaderMode = shaderMode;
  }, [shaderMode]);

  useEffect(() => {
    engineStateRef.current.physicsMode = physicsMode;
  }, [physicsMode]);

  useEffect(() => {
    engineStateRef.current.gravityOn = gravityOn;
  }, [gravityOn]);

  useEffect(() => {
    engineStateRef.current.bulletTime = bulletTime;
  }, [bulletTime]);

  // Inject editorial fonts & detect touch device
  useEffect(() => {
    ensureEditorialFonts();
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(coarse);
      if (coarse) setXrayEnabled(false);
    }
  }, []);

  // Init Web Audio Synth + Lock Body Scroll + Reality-Tear + 0.8s Telemetry Flash
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const audio = new MonolithAudioEngine();
    audio.muted = audioMuted;
    audioRef.current = audio;
    audio.playEntryBass();

    setIsImploding(false);
    engineStateRef.current.imploding = false;
    setIntroActive(true);
    setShutterOpened(false);
    setIntroPercent(0);
    setMountedVisible(false);

    const frameMount = requestAnimationFrame(() => {
      setMountedVisible(true);
    });
    const shutterTimer = window.setTimeout(() => {
      setShutterOpened(true);
    }, 140);

    const startTime = performance.now();
    const duration = 760;
    let rafIntro = 0;
    let endIntroTimer = 0;

    const tickIntro = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setIntroPercent(Math.round(eased * 100));
      if (progress < 1) {
        rafIntro = requestAnimationFrame(tickIntro);
      } else {
        endIntroTimer = window.setTimeout(() => setIntroActive(false), 110);
      }
    };
    rafIntro = requestAnimationFrame(tickIntro);

    return () => {
      cancelAnimationFrame(frameMount);
      cancelAnimationFrame(rafIntro);
      window.clearTimeout(shutterTimer);
      window.clearTimeout(endIntroTimer);
      document.body.style.overflow = prevOverflow;
      audio.dispose();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = audioMuted;
    }
  }, [audioMuted]);

  // Fire physical shockwave across the 10,000-particle canvas
  const triggerShockwave = useCallback(
    (x?: number, y?: number, strength = 24) => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      engineStateRef.current.shockwaves.push({
        x: x ?? w / 2,
        y: y ?? h / 2,
        radius: 12,
        maxRadius: Math.hypot(w, h) * 0.72,
        strength,
        alpha: 0.95,
      });
    },
    []
  );

  // Implosion Exit Choreography (0.42s suck-in to Close button + reverse bass sweep)
  const handleImplosionClose = useCallback(() => {
    if (isImploding) return;
    setIsImploding(true);
    const btnRect = closeBtnRef.current?.getBoundingClientRect();
    engineStateRef.current.implodeTarget = btnRect
      ? {
          x: btnRect.left + btnRect.width / 2,
          y: btnRect.top + btnRect.height / 2,
        }
      : {
          x: window.innerWidth - 54,
          y: 44,
        };
    engineStateRef.current.imploding = true;
    engineStateRef.current.gravityOn = false;
    setGravityOn(false);
    audioRef.current?.playImplosionExit();

    window.setTimeout(() => {
      onClose();
    }, 420);
  }, [isImploding, onClose]);

  // Keyboard shortcuts: ESC (Implode Close), G (Gravity Collapse), Spacebar Hold (0.1x Bullet-Time)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleImplosionClose();
        return;
      }
      if (
        (e.key === 'g' || e.key === 'G') &&
        !e.repeat &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        setGravityOn((prev) => {
          const next = !prev;
          audioRef.current?.playGravityPulse(next);
          if (!next) {
            triggerShockwave(
              window.innerWidth / 2,
              window.innerHeight * 0.55,
              16
            );
          }
          return next;
        });
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setBulletTime(true);
        audioRef.current?.playMechanicalTick(420);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setBulletTime(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isOpen, handleImplosionClose, triggerShockwave]);

  // Mobile Gyroscope Tilt Physics & Specular Reflection
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = Math.max(-35, Math.min(35, e.gamma ?? 0)) / 35;
      const beta = Math.max(-35, Math.min(35, (e.beta ?? 45) - 45)) / 35;
      engineStateRef.current.gyro.x = gamma;
      engineStateRef.current.gyro.y = beta;
      setGyroTilt({ x: gamma, y: beta });
    };
    window.addEventListener('deviceorientation', handleOrientation, {
      passive: true,
    });
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen]);

  // Real-Time Site Telemetry Scanner (Live DOM count, Viewport, IST Clock, FPS, Cursor XY)
  useEffect(() => {
    if (!isOpen) return;

    const updateTelemetry = () => {
      const now = new Date();
      const istTime =
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now) + ' IST';

      setTelemetry({
        fps: Math.round(engineStateRef.current.fps),
        domNodes: document.getElementsByTagName('*').length,
        viewport: `${window.innerWidth} × ${window.innerHeight}`,
        istTime,
        cursorX: Math.max(0, Math.round(engineStateRef.current.pointer.x)),
        cursorY: Math.max(0, Math.round(engineStateRef.current.pointer.y)),
        particles: engineStateRef.current.particleCount,
      });
    };

    updateTelemetry();
    const timer = window.setInterval(updateTelemetry, 220);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  // Scroll listener -> Drives both 3D Z-Axis Fly-Through & DSLR Rack-Focus Blur
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const raw =
      maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 0;
    engineStateRef.current.scrollTarget = raw;
    setScrollStage(raw);
  }, []);

  // Mechanical Cipher Scramble for Email Hover
  const runEmailScramble = useCallback(() => {
    if (emailCopied) return;
    audioRef.current?.playSoftHover();
    if (scrambleTimerRef.current) window.clearInterval(scrambleTimerRef.current);

    let iteration = 0;
    const target = CREATOR_EMAIL;
    scrambleTimerRef.current = window.setInterval(() => {
      setEmailDisplay(
        target
          .split('')
          .map((char, idx) => {
            if (char === '@' || char === '.') return char;
            if (idx < iteration) return target[idx];
            return SCRAMBLE_GLYPHS[
              Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)
            ];
          })
          .join('')
      );
      iteration += 0.85;
      if (iteration >= target.length) {
        if (scrambleTimerRef.current)
          window.clearInterval(scrambleTimerRef.current);
        setEmailDisplay(target);
      }
    }, 24);
  }, [emailCopied]);

  // Email Copy + Particle Shockwave + Harmonic Chime
  const handleCopyEmail = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerShockwave(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        28
      );
      audioRef.current?.playHarmonicChime();

      const copyFallback = () => {
        const ta = document.createElement('textarea');
        ta.value = CREATOR_EMAIL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch {
          // ignore
        }
        document.body.removeChild(ta);
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(CREATOR_EMAIL).catch(copyFallback);
      } else {
        copyFallback();
      }

      if (scrambleTimerRef.current)
        window.clearInterval(scrambleTimerRef.current);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      setEmailCopied(true);
      setEmailDisplay(CREATOR_EMAIL);

      copiedTimerRef.current = window.setTimeout(() => {
        setEmailCopied(false);
      }, 2600);
    },
    [triggerShockwave]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (scrambleTimerRef.current)
        window.clearInterval(scrambleTimerRef.current);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  /* ==========================================================================
     HIGH-DPI 60FPS CANVAS ENGINE
     ========================================================================== */

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let count = 0;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let pz = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let vz = new Float32Array(0);
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let tz = new Float32Array(0);
    let pSize = new Float32Array(0);
    let pAlpha = new Float32Array(0);
    let pSeed = new Float32Array(0);
    let pBounce = new Float32Array(0);

    const initialTheme = THEMES[engineStateRef.current.shaderMode];
    const curBg = { ...initialTheme.bgRgb };
    const curPart = { ...initialTheme.particleRgb };
    const curAccent = { ...initialTheme.accentRgb };
    const curGrid = { ...initialTheme.gridRgb };

    const sampleTypographyParticles = (isInitialBurst: boolean) => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const octx = off.getContext('2d');
      if (!octx) return;

      const isMobile = width < 640;
      const fontSize = isMobile
        ? Math.min(width * 0.185, 86)
        : Math.min(width * 0.128, 178);

      octx.clearRect(0, 0, width, height);
      octx.fillStyle = '#FFFFFF';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.font = `500 ${fontSize}px "Instrument Serif", "Cormorant Garamond", Georgia, serif`;

      const centerY = height * (isMobile ? 0.44 : 0.47);
      const lineGap = fontSize * 0.88;
      octx.fillText('SAMRAT', width / 2, centerY - lineGap * 0.5);
      octx.fillText('SANDILYA', width / 2, centerY + lineGap * 0.52);

      const img = octx.getImageData(0, 0, width, height).data;
      const points: number[] = [];

      const targetMax = isMobile ? 4600 : 10200;
      let step = 3;

      let roughHits = 0;
      for (let y = 0; y < height; y += 6) {
        for (let x = 0; x < width; x += 6) {
          if (img[(y * width + x) * 4 + 3] > 120) roughHits++;
        }
      }
      const estimatedAtStep3 = roughHits * 4;
      if (estimatedAtStep3 > targetMax * 1.35) step = 4;
      if (estimatedAtStep3 < targetMax * 0.55 && !isMobile) step = 2;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = img[(y * width + x) * 4 + 3];
          if (alpha > 115) {
            points.push(x, y, alpha / 255);
          }
        }
      }

      const totalFound = points.length / 3;
      const stride = totalFound > targetMax ? totalFound / targetMax : 1;
      const finalCount = Math.min(targetMax, Math.floor(totalFound / stride));

      const nextPx = new Float32Array(finalCount);
      const nextPy = new Float32Array(finalCount);
      const nextPz = new Float32Array(finalCount);
      const nextVx = new Float32Array(finalCount);
      const nextVy = new Float32Array(finalCount);
      const nextVz = new Float32Array(finalCount);
      const nextTx = new Float32Array(finalCount);
      const nextTy = new Float32Array(finalCount);
      const nextTz = new Float32Array(finalCount);
      const nextSize = new Float32Array(finalCount);
      const nextAlpha = new Float32Array(finalCount);
      const nextSeed = new Float32Array(finalCount);
      const nextBounce = new Float32Array(finalCount);

      for (let i = 0; i < finalCount; i++) {
        const srcIdx = Math.floor(i * stride) * 3;
        const x = points[srcIdx] + (Math.random() - 0.5) * 1.1;
        const y = points[srcIdx + 1] + (Math.random() - 0.5) * 1.1;
        const z = (Math.random() - 0.5) * 46;
        const a = points[srcIdx + 2];

        nextTx[i] = x;
        nextTy[i] = y;
        nextTz[i] = z;

        if (!isInitialBurst && i < count) {
          nextPx[i] = px[i];
          nextPy[i] = py[i];
          nextPz[i] = pz[i];
          nextVx[i] = vx[i];
          nextVy[i] = vy[i];
          nextVz[i] = vz[i];
        } else {
          const angle = Math.random() * Math.PI * 2;
          const dist = 120 + Math.random() * Math.max(width, height) * 0.45;
          nextPx[i] = width / 2 + Math.cos(angle) * dist;
          nextPy[i] = height / 2 + Math.sin(angle) * dist;
          nextPz[i] = (Math.random() - 0.5) * 320;
          nextVx[i] = 0;
          nextVy[i] = 0;
          nextVz[i] = 0;
        }

        nextSize[i] = isMobile
          ? 1.15 + Math.random() * 1.05
          : 1.05 + Math.random() * 1.25;
        nextAlpha[i] = 0.58 + a * 0.42;
        nextSeed[i] = Math.random() * Math.PI * 2;
        nextBounce[i] = 0.42 + Math.random() * 0.28;
      }

      count = finalCount;
      px = nextPx;
      py = nextPy;
      pz = nextPz;
      vx = nextVx;
      vy = nextVy;
      vz = nextVz;
      tx = nextTx;
      ty = nextTy;
      tz = nextTz;
      pSize = nextSize;
      pAlpha = nextAlpha;
      pSeed = nextSeed;
      pBounce = nextBounce;

      engineStateRef.current.particleCount = count;
    };

    sampleTypographyParticles(true);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        sampleTypographyParticles(false);
      });
    }

    let resizeTimer = 0;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sampleTypographyParticles(false);
      }, 160);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = performance.now();
    let frameAccumulator = 0;
    let frameCount = 0;
    let simTime = 0;
    let currentTimeScale = 1;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);

      const rawDt = Math.min(0.05, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      frameAccumulator += rawDt;
      frameCount++;
      if (frameAccumulator >= 0.35) {
        engineStateRef.current.fps = frameCount / frameAccumulator;
        frameAccumulator = 0;
        frameCount = 0;
      }

      const st = engineStateRef.current;

      const targetScale = st.bulletTime ? 0.1 : 1.0;
      currentTimeScale += (targetScale - currentTimeScale) * 0.14;
      const dt = rawDt * currentTimeScale;
      const stepFactor = dt * 60;
      simTime += dt;

      st.scrollCurrent += (st.scrollTarget - st.scrollCurrent) * 0.085;
      const scrollP = st.scrollCurrent;

      const targetTheme = THEMES[st.shaderMode];
      const colorLerp = 0.09;
      curBg.r += (targetTheme.bgRgb.r - curBg.r) * colorLerp;
      curBg.g += (targetTheme.bgRgb.g - curBg.g) * colorLerp;
      curBg.b += (targetTheme.bgRgb.b - curBg.b) * colorLerp;

      curPart.r += (targetTheme.particleRgb.r - curPart.r) * colorLerp;
      curPart.g += (targetTheme.particleRgb.g - curPart.g) * colorLerp;
      curPart.b += (targetTheme.particleRgb.b - curPart.b) * colorLerp;

      curAccent.r += (targetTheme.accentRgb.r - curAccent.r) * colorLerp;
      curAccent.g += (targetTheme.accentRgb.g - curAccent.g) * colorLerp;
      curAccent.b += (targetTheme.accentRgb.b - curAccent.b) * colorLerp;

      curGrid.r += (targetTheme.gridRgb.r - curGrid.r) * colorLerp;
      curGrid.g += (targetTheme.gridRgb.g - curGrid.g) * colorLerp;
      curGrid.b += (targetTheme.gridRgb.b - curGrid.b) * colorLerp;

      if (st.pointer.active) {
        st.lens.x += (st.pointer.x - st.lens.x) * 0.22;
        st.lens.y += (st.pointer.y - st.lens.y) * 0.22;
      }
      if (xrayLayerRef.current) {
        const rad = st.pointer.active ? (st.pointer.down ? 148 : 118) : 0;
        st.lens.radius += (rad - st.lens.radius) * 0.18;
        xrayLayerRef.current.style.clipPath = `circle(${st.lens.radius.toFixed(1)}px at ${st.lens.x.toFixed(1)}px ${st.lens.y.toFixed(1)}px)`;
      }
      if (xrayRingRef.current) {
        const size = st.lens.radius * 2;
        xrayRingRef.current.style.transform = `translate3d(${(st.lens.x - st.lens.radius).toFixed(1)}px, ${(st.lens.y - st.lens.radius).toFixed(1)}px, 0)`;
        xrayRingRef.current.style.width = `${size.toFixed(1)}px`;
        xrayRingRef.current.style.height = `${size.toFixed(1)}px`;
        xrayRingRef.current.style.opacity = st.lens.radius > 4 ? '1' : '0';
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = `rgb(${Math.round(curBg.r)}, ${Math.round(curBg.g)}, ${Math.round(curBg.b)})`;
      ctx.fillRect(0, 0, width, height);

      // Interactive 3D Magnetic Dot-Mesh / Wireframe Background
      const gridSpacing = width < 640 ? 44 : 52;
      const cols = Math.ceil(width / gridSpacing) + 1;
      const rows = Math.ceil(height / gridSpacing) + 1;
      const ptrX = st.pointer.x;
      const ptrY = st.pointer.y;
      const ptrSpeed = Math.min(35, Math.hypot(st.pointer.vx, st.pointer.vy));
      const meshR = Math.round(curGrid.r);
      const meshG = Math.round(curGrid.g);
      const meshB = Math.round(curGrid.b);
      const baseGridAlpha = st.shaderMode === 'BLUEPRINT' ? 0.15 : 0.08;

      ctx.lineWidth = 0.6;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = c * gridSpacing;
          const gy = r * gridSpacing;
          const wave =
            Math.sin(c * 0.35 + simTime * 0.9) *
            Math.cos(r * 0.35 + simTime * 0.7) *
            2.4;

          const dx = gx - ptrX;
          const dy = gy - ptrY;
          const distSq = dx * dx + dy * dy;
          let ox = st.gyro.x * 14;
          let oy = st.gyro.y * 14 + wave;
          let glow = 0;

          if (distSq < 210 * 210 && st.pointer.active) {
            const dist = Math.sqrt(distSq) || 1;
            const factor = (1 - dist / 210) * (1 + ptrSpeed * 0.025);
            const dir = st.pointer.down ? -1 : 1;
            ox += (dx / dist) * factor * 24 * dir;
            oy += (dy / dist) * factor * 24 * dir;
            glow = factor;
          }

          const fx = gx + ox;
          const fy = gy + oy;
          const dotAlpha = Math.min(0.75, baseGridAlpha + glow * 0.38);

          ctx.fillStyle = `rgba(${meshR}, ${meshG}, ${meshB}, ${dotAlpha.toFixed(3)})`;
          ctx.fillRect(fx - 0.85, fy - 0.85, 1.7 + glow * 1.1, 1.7 + glow * 1.1);

          if (glow > 0.22 || st.shaderMode === 'BLUEPRINT') {
            const lineAlpha =
              st.shaderMode === 'BLUEPRINT'
                ? 0.045 + glow * 0.16
                : glow * 0.12;
            ctx.strokeStyle = `rgba(${meshR}, ${meshG}, ${meshB}, ${lineAlpha.toFixed(3)})`;
            if (c < cols - 1) {
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(fx + gridSpacing, fy);
              ctx.stroke();
            }
            if (r < rows - 1) {
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(fx, fy + gridSpacing);
              ctx.stroke();
            }
          }
        }
      }

      // Active Shockwaves
      for (let s = st.shockwaves.length - 1; s >= 0; s--) {
        const sw = st.shockwaves[s];
        sw.radius += 22 * stepFactor;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${Math.round(curAccent.r)}, ${Math.round(curAccent.g)}, ${Math.round(curAccent.b)}, ${(sw.alpha * 0.34).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        if (sw.radius >= sw.maxRadius) {
          st.shockwaves.splice(s, 1);
        }
      }

      // Bottom Glass Dock Bounding Box for Real Gravity Bounce Collision
      const dockRect =
        st.gravityOn && dockRef.current
          ? dockRef.current.getBoundingClientRect()
          : null;

      // 3D Z-Axis Fly-Through Camera + Particle Physics
      const focalLength = 520;
      const camZ = scrollP * 430;
      const halfW = width * 0.5;
      const halfH = height * 0.5;

      const pR = Math.round(curPart.r);
      const pG = Math.round(curPart.g);
      const pB = Math.round(curPart.b);
      const aR = Math.round(curAccent.r);
      const aG = Math.round(curAccent.g);
      const aB = Math.round(curAccent.b);

      const isImplodingNow = st.imploding;
      const implodeX = st.implodeTarget.x;
      const implodeY = st.implodeTarget.y;
      const pMode = st.physicsMode;
      const grav = st.gravityOn;
      const vortexHold =
        st.pointer.down && st.pointer.active && !isImplodingNow;
      const gyroX = st.gyro.x * 26;
      const gyroY = st.gyro.y * 18;
      const floorY = height - 6;

      st.pointer.vx *= 0.88;
      st.pointer.vy *= 0.88;

      for (let i = 0; i < count; i++) {
        let x = px[i];
        let y = py[i];
        let z = pz[i];
        let ivx = vx[i];
        let ivy = vy[i];
        let ivz = vz[i];

        if (isImplodingNow) {
          const dx = implodeX - x;
          const dy = implodeY - y;
          const dist = Math.hypot(dx, dy) + 1;
          const pull = 0.24 * stepFactor;
          ivx = ivx * 0.86 + (dx * pull - (dy / dist) * 6.5 * stepFactor);
          ivy = ivy * 0.86 + (dy * pull + (dx / dist) * 6.5 * stepFactor);
          ivz = ivz * 0.88 + (0 - z) * 0.14 * stepFactor;
        } else if (grav) {
          ivy += 0.68 * stepFactor;
          ivx += st.gyro.x * 0.28 * stepFactor;

          if (st.pointer.active) {
            const dx = x - ptrX;
            const dy = y - ptrY;
            const d2 = dx * dx + dy * dy;
            if (d2 < 120 * 120) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / 120) * 2.4 * stepFactor;
              ivx += (dx / d) * f + st.pointer.vx * 0.08;
              ivy += (dy / d) * f - 1.2 * stepFactor;
            }
          }

          const nextX = x + ivx * stepFactor;
          const nextY = y + ivy * stepFactor;

          if (dockRect) {
            const pad = 3;
            const withinDockX =
              nextX >= dockRect.left - pad && nextX <= dockRect.right + pad;
            const withinDockY =
              nextY >= dockRect.top - pad && nextY <= dockRect.bottom + pad;

            if (withinDockX && withinDockY) {
              if (y <= dockRect.top + 8 && ivy > 0) {
                y = dockRect.top - pad;
                ivy = -Math.abs(ivy) * pBounce[i];
                ivx = ivx * 0.86 + (Math.random() - 0.5) * 1.4;
              } else if (x < dockRect.left) {
                x = dockRect.left - pad;
                ivx = -Math.abs(ivx) * 0.6;
              } else if (x > dockRect.right) {
                x = dockRect.right + pad;
                ivx = Math.abs(ivx) * 0.6;
              }
            }
          }

          if (nextY >= floorY) {
            y = floorY;
            ivy = -Math.abs(ivy) * (pBounce[i] * 0.82);
            ivx *= 0.91;
          }
          if (nextX < 4) {
            x = 4;
            ivx = Math.abs(ivx) * 0.65;
          } else if (nextX > width - 4) {
            x = width - 4;
            ivx = -Math.abs(ivx) * 0.65;
          }

          ivx *= 0.992;
          ivy *= 0.996;
          ivz *= 0.95;
        } else {
          const seed = pSeed[i];
          let driftX = gyroX;
          let driftY = gyroY;
          let driftZ = Math.sin(simTime * 1.2 + seed) * 6;

          if (pMode === 'SWARM') {
            driftX += Math.cos(simTime * 2.4 + seed * 3) * 5.2;
            driftY += Math.sin(simTime * 2.1 + seed * 2) * 5.2;
            driftZ += Math.cos(simTime * 1.8 + seed) * 14;
          } else if (pMode === 'VORTEX') {
            const ang = simTime * 1.1 + seed;
            driftX += Math.cos(ang) * 2.6;
            driftY += Math.sin(ang) * 2.6;
          } else {
            driftY += Math.sin(simTime * 1.35 + seed) * 1.4;
          }

          const springK = pMode === 'SWARM' ? 0.052 : 0.078;
          ivx += (tx[i] + driftX - x) * springK * stepFactor;
          ivy += (ty[i] + driftY - y) * springK * stepFactor;
          ivz += (tz[i] + driftZ - z) * 0.06 * stepFactor;

          if (st.pointer.active) {
            const dx = x - ptrX;
            const dy = y - ptrY;
            const distSq = dx * dx + dy * dy;

            if (vortexHold) {
              const dist = Math.sqrt(distSq) + 18;
              const pull =
                Math.min(26, 4200 / (dist + 60)) * 0.13 * stepFactor;
              ivx += (-dx / dist) * pull + (-dy / dist) * pull * 0.72;
              ivy += (-dy / dist) * pull + (dx / dist) * pull * 0.72;
              ivz += (120 - z) * 0.025 * stepFactor;
            } else {
              const radius =
                pMode === 'VORTEX' ? 195 : pMode === 'SWARM' ? 175 : 155;
              if (distSq < radius * radius) {
                const dist = Math.sqrt(distSq) || 1;
                const force = (1 - dist / radius) * stepFactor;

                if (pMode === 'FLUID') {
                  const push = force * 11.5;
                  ivx += (dx / dist) * push + st.pointer.vx * force * 0.22;
                  ivy += (dy / dist) * push + st.pointer.vy * force * 0.22;
                  ivz += force * 14;
                } else if (pMode === 'VORTEX') {
                  const swirl = force * 12.5;
                  ivx += (-dy / dist) * swirl + (dx / dist) * force * 3.2;
                  ivy += (dx / dist) * swirl + (dy / dist) * force * 3.2;
                  ivz += force * 18;
                } else {
                  const burst = force * 9.5;
                  ivx +=
                    (dx / dist) * burst +
                    Math.cos(seed + simTime * 6) * force * 4.5;
                  ivy +=
                    (dy / dist) * burst +
                    Math.sin(seed + simTime * 6) * force * 4.5;
                  ivz -= force * 16;
                }
              }
            }
          }

          const damping = Math.pow(pMode === 'SWARM' ? 0.85 : 0.82, stepFactor);
          ivx *= damping;
          ivy *= damping;
          ivz *= damping;
        }

        for (let s = 0; s < st.shockwaves.length; s++) {
          const sw = st.shockwaves[s];
          const sdx = x - sw.x;
          const sdy = y - sw.y;
          const sdist = Math.hypot(sdx, sdy) || 1;
          const band = Math.abs(sdist - sw.radius);
          if (band < 48) {
            const imp =
              (1 - band / 48) * sw.strength * sw.alpha * 0.55 * stepFactor;
            ivx += (sdx / sdist) * imp;
            ivy += (sdy / sdist) * imp;
            ivz += imp * 1.4;
          }
        }

        x += ivx * stepFactor;
        y += ivy * stepFactor;
        z += ivz * stepFactor;

        px[i] = x;
        py[i] = y;
        pz[i] = z;
        vx[i] = ivx;
        vy[i] = ivy;
        vz[i] = ivz;

        const relZ = focalLength + z - camZ;
        if (relZ <= 24) continue;

        const scale = focalLength / relZ;
        const sx = (x - halfW) * scale + halfW;
        const sy = (y - halfH) * scale + halfH;

        if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20)
          continue;

        const speed = Math.abs(ivx) + Math.abs(ivy);
        const energy = Math.min(1, speed * 0.085);
        const depthFade = Math.min(1, Math.max(0.08, (relZ - 24) / 180));
        const finalAlpha = Math.min(
          1,
          pAlpha[i] * depthFade * (1 - scrollP * 0.58)
        );
        const size = Math.min(5.2, pSize[i] * scale * (1 + energy * 0.35));

        const cr = Math.round(pR + (aR - pR) * energy);
        const cg = Math.round(pG + (aG - pG) * energy);
        const cb = Math.round(pB + (aB - pB) * energy);

        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${finalAlpha.toFixed(3)})`;
        ctx.fillRect(sx - size * 0.5, sy - size * 0.5, size, size);
      }

      if (vortexHold) {
        const grad = ctx.createRadialGradient(ptrX, ptrY, 4, ptrX, ptrY, 120);
        grad.addColorStop(0, `rgba(${aR}, ${aG}, ${aB}, 0.24)`);
        grad.addColorStop(0.45, `rgba(${aR}, ${aG}, ${aB}, 0.06)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ptrX, ptrY, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Pointer & Multi-Touch Handlers
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ptr = engineStateRef.current.pointer;
      if (ptr.active) {
        ptr.vx = e.clientX - ptr.x;
        ptr.vy = e.clientY - ptr.y;
      }
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.active = true;
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a')) return;

      const ptr = engineStateRef.current.pointer;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.active = true;
      ptr.down = true;
      setIsHoldingVortex(true);
      audioRef.current?.playMechanicalTick(310);
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ptr = engineStateRef.current.pointer;
      if (ptr.down) {
        ptr.down = false;
        setIsHoldingVortex(false);
        triggerShockwave(e.clientX, e.clientY, 30);
        audioRef.current?.playShockwaveRelease();
      }
    },
    [triggerShockwave]
  );

  const handlePointerLeave = useCallback(() => {
    const ptr = engineStateRef.current.pointer;
    ptr.active = false;
    ptr.down = false;
    setIsHoldingVortex(false);
  }, []);

  // Rack-Focus Computed Values (0 -> 1 scroll)
  const canvasBlurPx = useMemo(() => scrollStage * 15, [scrollStage]);
  const stage2Opacity = useMemo(
    () => Math.min(1, Math.max(0, (scrollStage - 0.18) / 0.52)),
    [scrollStage]
  );
  const stage2BlurPx = useMemo(
    () => Math.max(0, (1 - stage2Opacity) * 14),
    [stage2Opacity]
  );
  const stage2Y = useMemo(() => (1 - stage2Opacity) * 44, [stage2Opacity]);

  // Mode Switch Handlers
  const switchShader = (mode: ShaderMode) => {
    if (mode === shaderMode) return;
    setShaderMode(mode);
    audioRef.current?.playMechanicalTick(820);
  };

  const switchPhysics = (mode: PhysicsMode) => {
    if (mode === physicsMode && !gravityOn) return;
    setPhysicsMode(mode);
    if (gravityOn) setGravityOn(false);
    audioRef.current?.playMechanicalTick(980);
    triggerShockwave(window.innerWidth / 2, window.innerHeight * 0.47, 14);
  };

  const toggleGravity = () => {
    setGravityOn((prev) => {
      const next = !prev;
      audioRef.current?.playGravityPulse(next);
      if (!next) {
        triggerShockwave(window.innerWidth / 2, window.innerHeight * 0.65, 18);
      }
      return next;
    });
  };

  const toggleAudio = () => {
    setAudioMuted((prev) => {
      const next = !prev;
      if (!next && audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.playMechanicalTick(1100);
      }
      return next;
    });
  };

  const toggleXray = () => {
    setXrayEnabled((prev) => !prev);
    audioRef.current?.playMechanicalTick(740);
  };

  if (!isOpen) return null;

  const uiRevealStyle = (delaySec = 0): React.CSSProperties => ({
    opacity: introActive ? 0 : 1,
    transform: introActive ? 'translate3d(0, 14px, 0)' : 'translate3d(0, 0, 0)',
    filter: introActive ? 'blur(8px)' : 'blur(0px)',
    transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delaySec}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delaySec}s, filter 0.65s ease ${delaySec}s`,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Architected and Built by Samrat Sandilya"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      style={{
        backgroundColor: theme.bgHex,
        color: theme.textPrimary,
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        opacity: isImploding ? 0 : mountedVisible ? 1 : 0,
        transform: isImploding ? 'scale(0.985)' : 'scale(1)',
        filter: isImploding ? 'blur(10px)' : 'blur(0px)',
        transition:
          'opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1), filter 0.42s ease, background-color 0.55s cubic-bezier(0.22,1,0.36,1), color 0.45s ease',
        touchAction: 'pan-y',
      }}
    >
      {/* ================================================================
          1. LIVE 10,000-PARTICLE CANVAS + DSLR RACK-FOCUS BLUR
         ================================================================ */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          filter: `blur(${canvasBlurPx.toFixed(1)}px)`,
          transform: `scale(${(1 + scrollStage * 0.035).toFixed(4)})`,
          transition: 'filter 0.08s linear',
        }}
      />

      {/* Editorial Paper Grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: theme.isLight ? 0.055 : 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Cinematic Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: theme.vignette,
          transition: 'background 0.5s ease',
        }}
      />

      {/* ================================================================
          2. X-RAY ARCHITECTURAL CAD BLUEPRINT CURSOR LENS (60FPS RAF)
         ================================================================ */}
      {xrayEnabled && !isTouchDevice && (
        <>
          <div
            ref={xrayLayerRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
            style={{
              clipPath: 'circle(0px at -400px -400px)',
              backgroundColor: '#041226',
              backgroundImage:
                'linear-gradient(rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
              backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
            }}
          >
            <svg
              className="absolute inset-0 w-full h-full opacity-75"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="rgba(56,189,248,0.28)"
                strokeDasharray="4 6"
              />
              <line
                x1="0"
                y1="47%"
                x2="100%"
                y2="47%"
                stroke="rgba(56,189,248,0.28)"
                strokeDasharray="4 6"
              />
              <ellipse
                cx="50%"
                cy="47%"
                rx="34%"
                ry="24%"
                fill="none"
                stroke="rgba(125,211,252,0.34)"
                strokeWidth="1"
                strokeDasharray="6 6"
              />
              <rect
                x="14%"
                y="23%"
                width="72%"
                height="48%"
                fill="none"
                stroke="rgba(56,189,248,0.35)"
                strokeWidth="0.8"
              />
              <line
                x1="14%"
                y1="23%"
                x2="86%"
                y2="71%"
                stroke="rgba(56,189,248,0.18)"
                strokeWidth="0.8"
              />
            </svg>

            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                transform: `translateY(-3%) scale(${(1 + scrollStage * 0.08).toFixed(3)})`,
                opacity: Math.max(0.15, 1 - scrollStage * 0.9),
              }}
            >
              <div
                className="text-center leading-[0.88] tracking-tight"
                style={{
                  fontFamily:
                    '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
                  fontSize: 'min(12.8vw, 178px)',
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(125, 211, 252, 0.85)',
                }}
              >
                <div>SAMRAT</div>
                <div>SANDILYA</div>
              </div>
            </div>

            <div className="absolute top-[19%] left-[14.5%] text-[10px] tracking-[0.26em] text-sky-300/90 uppercase">
              [01] ARCHITECTED FROM SCRATCH
            </div>
            <div className="absolute top-[19%] right-[14.5%] text-[10px] tracking-[0.26em] text-sky-300/90 uppercase">
              [02] ZERO TEMPLATES // HAND-CODED
            </div>
            <div className="absolute bottom-[24%] left-[14.5%] text-[10px] tracking-[0.26em] text-sky-200/90 uppercase">
              BUILT BY SAMRAT — DOM:{telemetry.domNodes} // PARTICLES:
              {telemetry.particles}
            </div>
            <div className="absolute bottom-[24%] right-[14.5%] text-[10px] tracking-[0.26em] text-sky-200/90 uppercase">
              CAD X-RAY // {telemetry.viewport} // {telemetry.fps} FPS
            </div>
          </div>

          <div
            ref={xrayRingRef}
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-0 z-30 rounded-full"
            style={{
              width: 0,
              height: 0,
              opacity: 0,
              border: '1px solid rgba(125, 211, 252, 0.58)',
              boxShadow:
                'inset 0 0 26px rgba(56, 189, 248, 0.16), 0 0 24px rgba(56, 189, 248, 0.18)',
              willChange: 'transform, width, height',
            }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.22em] text-sky-300/90 whitespace-nowrap bg-[#041226]/80 px-1.5 py-0.5 rounded border border-sky-400/30">
              X-RAY // {telemetry.cursorX},{telemetry.cursorY}
            </span>
          </div>
        </>
      )}

      {/* ================================================================
          3. PROGRESSIVE EDGE BLUR MASKS (TOP & BOTTOM — ZERO HARD CUTS)
         ================================================================ */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 right-0 h-28 z-20"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, black 12%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 12%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 right-0 h-32 z-20"
        style={{
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          maskImage: 'linear-gradient(to top, black 18%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to top, black 18%, transparent 100%)',
        }}
      />

      {/* ================================================================
          4. SCROLL-DRIVEN RACK-FOCUS STAGE (3D FLY-THROUGH + SIGNATURE)
         ================================================================ */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative w-full h-[210vh]">
          <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between pointer-events-none px-4 pt-24 pb-36">
            <div
              className="flex items-center gap-3 text-[10px] sm:text-[11px] tracking-[0.38em] uppercase"
              style={{
                color: theme.textMuted,
                opacity: introActive ? 0 : Math.max(0, 1 - scrollStage * 2.2),
                transform: `translate3d(0, ${introActive ? -12 : -scrollStage * 28}px, 0)`,
                filter: `blur(${(introActive ? 8 : scrollStage * 10).toFixed(1)}px)`,
                transition: 'opacity 0.55s ease, transform 0.45s ease, filter 0.35s ease',
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor:
                    shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textPrimary,
                }}
              />
              ARCHITECTED &amp; BUILT BY
            </div>

            {/* Rack-Focus Stage 2: Signature + Live Proof Grid */}
            <div
              className="flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4"
              style={{
                opacity: stage2Opacity,
                filter: `blur(${stage2BlurPx.toFixed(1)}px)`,
                transform: `translate3d(0, ${stage2Y.toFixed(1)}px, 0)`,
                pointerEvents: stage2Opacity > 0.5 ? 'auto' : 'none',
              }}
            >
              <div
                className="text-[10px] tracking-[0.34em] uppercase mb-4"
                style={{ color: theme.textMuted }}
              >
                COLOPHON // SANRACHNA ARCHITECTURE
              </div>

              <CreatorSignatureSVG
                color={theme.textPrimary}
                accent={shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textMuted}
                active={stage2Opacity > 0.35}
              />

              <div
                className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 px-5 py-3.5 rounded-2xl border backdrop-blur-xl"
                style={{
                  backgroundColor: theme.glassBg,
                  borderColor: theme.glassBorder,
                }}
              >
                <div className="text-left">
                  <div
                    className="text-[9px] tracking-[0.22em] uppercase"
                    style={{ color: theme.textMuted }}
                  >
                    AUTHOR
                  </div>
                  <div className="text-[11px] font-medium mt-0.5 tracking-wider">
                    SAMRAT S.
                  </div>
                </div>
                <div className="text-left">
                  <div
                    className="text-[9px] tracking-[0.22em] uppercase"
                    style={{ color: theme.textMuted }}
                  >
                    DOM NODES
                  </div>
                  <div className="text-[11px] font-medium mt-0.5 tabular-nums">
                    {telemetry.domNodes}
                  </div>
                </div>
                <div className="text-left">
                  <div
                    className="text-[9px] tracking-[0.22em] uppercase"
                    style={{ color: theme.textMuted }}
                  >
                    PARTICLES
                  </div>
                  <div className="text-[11px] font-medium mt-0.5 tabular-nums">
                    {telemetry.particles.toLocaleString()}
                  </div>
                </div>
                <div className="text-left">
                  <div
                    className="text-[9px] tracking-[0.22em] uppercase"
                    style={{ color: theme.textMuted }}
                  >
                    CLOCK
                  </div>
                  <div className="text-[11px] font-medium mt-0.5 tabular-nums">
                    {telemetry.istTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Hint Strip */}
            <div
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] tracking-[0.22em] uppercase"
              style={{
                color: theme.textMuted,
                opacity: introActive
                  ? 0
                  : Math.max(0, 0.72 - scrollStage * 2.5),
                transform: `translate3d(0, ${(scrollStage * 18).toFixed(1)}px, 0)`,
                transition: 'opacity 0.4s ease',
              }}
            >
              <span>HOLD TO VORTEX</span>
              <span>·</span>
              <span>SCROLL TO FLY-THROUGH</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">[G] GRAVITY</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">[SPACE] 0.1× SLOW-MO</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          5. TOP HUD BAR: LIVE TELEMETRY + MAGNETIC CLOSE BUTTON
         ================================================================ */}
      <header
        className="fixed top-4 sm:top-6 left-4 sm:left-7 right-4 sm:right-7 z-40 flex items-start justify-between gap-3 pointer-events-none"
        style={{
          opacity: introActive ? 0 : 1,
          transform: introActive ? 'translate3d(0, -14px, 0)' : 'translate3d(0, 0, 0)',
          filter: introActive ? 'blur(8px)' : 'blur(0px)',
          transition:
            'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1), filter 0.6s ease',
        }}
      >
        <div
          className="pointer-events-auto flex flex-col gap-1 px-3.5 py-2 rounded-xl border backdrop-blur-xl text-[9px] sm:text-[10px] tracking-[0.18em] uppercase tabular-nums"
          style={{
            backgroundColor: theme.glassBg,
            borderColor: theme.glassBorder,
            transition: 'background-color 0.45s ease, border-color 0.45s ease',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: bulletTime
                    ? '#F59E0B'
                    : isHoldingVortex
                    ? '#38BDF8'
                    : '#22C55E',
                }}
              />
              {telemetry.fps} FPS
            </span>
            <span style={{ color: theme.textMuted }}>|</span>
            <span style={{ color: theme.textMuted }}>
              XY {telemetry.cursorX},{telemetry.cursorY}
            </span>
          </div>
          <div
            className="hidden sm:flex items-center gap-2.5 text-[9px]"
            style={{ color: theme.textMuted }}
          >
            <span>{telemetry.viewport}</span>
            <span>·</span>
            <span>DOM {telemetry.domNodes}</span>
            <span>·</span>
            <span>{telemetry.istTime}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div
            className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.22em] uppercase border backdrop-blur-xl text-amber-300 border-amber-400/40 bg-amber-500/10 pointer-events-none"
            style={{
              opacity: bulletTime ? 1 : 0,
              transform: bulletTime ? 'scale(1)' : 'scale(0.9)',
              filter: bulletTime ? 'blur(0px)' : 'blur(6px)',
              transition:
                'opacity 0.25s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1), filter 0.25s ease',
            }}
          >
            BULLET-TIME 0.1×
          </div>

          <MagneticButton
            buttonRef={closeBtnRef}
            onClick={handleImplosionClose}
            onMouseEnter={() => audioRef.current?.playSoftHover()}
            className="px-4 py-2 rounded-full border backdrop-blur-xl text-[10px] sm:text-[11px] tracking-[0.24em] uppercase"
            style={{
              backgroundColor: theme.glassBg,
              borderColor: theme.glassBorder,
              color: theme.textPrimary,
            }}
          >
            <span>CLOSE</span>
            <span className="text-xs leading-none opacity-75">✕</span>
          </MagneticButton>
        </div>
      </header>

      {/* ================================================================
          6. LIQUID SLIDING PLAYGROUND CONTROLS
         ================================================================ */}
      <aside
        className="fixed left-4 sm:left-7 bottom-24 z-40 hidden md:flex flex-col gap-2"
        style={uiRevealStyle(0.08)}
      >
        <SlidingPillGroup<ShaderMode>
          options={['OBSIDIAN', 'BLUEPRINT', 'INK']}
          value={shaderMode}
          onChange={switchShader}
          theme={theme}
        />
        <SlidingPillGroup<PhysicsMode>
          options={['FLUID', 'VORTEX', 'SWARM']}
          value={gravityOn ? null : physicsMode}
          onChange={switchPhysics}
          theme={theme}
        />
      </aside>

      {/* Right Hardware Utility Switches */}
      <aside
        className="fixed right-4 sm:right-7 bottom-24 z-40 hidden md:flex items-center gap-1.5 p-1 rounded-full border backdrop-blur-xl"
        style={{
          ...uiRevealStyle(0.1),
          backgroundColor: theme.glassBg,
          borderColor: theme.glassBorder,
        }}
      >
        <button
          type="button"
          onClick={toggleGravity}
          className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase cursor-pointer"
          style={{
            backgroundColor: gravityOn ? theme.pillActiveBg : 'transparent',
            color: gravityOn ? theme.pillActiveText : theme.textMuted,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          title="Toggle Gravity Collapse (Press G)"
        >
          GRAVITY {gravityOn ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={toggleXray}
          className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase cursor-pointer"
          style={{
            backgroundColor: xrayEnabled ? theme.pillActiveBg : 'transparent',
            color: xrayEnabled ? theme.pillActiveText : theme.textMuted,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          title="Toggle CAD X-Ray Cursor Lens"
        >
          X-RAY
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase cursor-pointer"
          style={{
            backgroundColor: !audioMuted ? theme.pillActiveBg : 'transparent',
            color: !audioMuted ? theme.pillActiveText : theme.textMuted,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          title="Toggle Synthesized Audio"
        >
          {audioMuted ? 'MUTED' : 'SOUND'}
        </button>
      </aside>

      {/* Compact Mobile Controls Strip */}
      <div
        className="fixed left-1/2 -translate-x-1/2 bottom-[92px] z-40 flex md:hidden items-center gap-1 p-1 rounded-full border backdrop-blur-xl max-w-[94vw] overflow-x-auto"
        style={{
          opacity: introActive ? 0 : 1,
          transition: 'opacity 0.5s ease',
          backgroundColor: theme.glassBg,
          borderColor: theme.glassBorder,
        }}
      >
        {(['OBSIDIAN', 'BLUEPRINT', 'INK'] as ShaderMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => switchShader(mode)}
            className="px-2 py-1 rounded-full text-[8px] tracking-[0.16em] uppercase whitespace-nowrap"
            style={{
              backgroundColor:
                shaderMode === mode ? theme.pillActiveBg : 'transparent',
              color:
                shaderMode === mode ? theme.pillActiveText : theme.textMuted,
            }}
          >
            {mode}
          </button>
        ))}
        <span className="opacity-25 text-[10px]">|</span>
        <button
          type="button"
          onClick={toggleGravity}
          className="px-2 py-1 rounded-full text-[8px] tracking-[0.16em] uppercase whitespace-nowrap"
          style={{
            backgroundColor: gravityOn ? theme.pillActiveBg : 'transparent',
            color: gravityOn ? theme.pillActiveText : theme.textMuted,
          }}
        >
          GRAV
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          className="px-2 py-1 rounded-full text-[8px] tracking-[0.16em] uppercase whitespace-nowrap"
          style={{
            color: !audioMuted ? theme.pillActiveText : theme.textMuted,
          }}
        >
          {audioMuted ? 'MUTE' : 'SFX'}
        </button>
      </div>

      {/* ================================================================
          7. FLOATING LIQUID-GLASS COMMAND DOCK (GRAVITY COLLISION SURFACE)
         ================================================================ */}
      <nav
        ref={dockRef}
        aria-label="Creator Direct Contact"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]"
        style={{
          opacity: introActive ? 0 : 1,
          transform: introActive
            ? 'translate3d(-50%, 24px, 0)'
            : 'translate3d(-50%, 0, 0)',
          filter: introActive ? 'blur(12px)' : 'blur(0px)',
          transition:
            'opacity 0.72s cubic-bezier(0.22,1,0.36,1) 0.12s, transform 0.72s cubic-bezier(0.22,1,0.36,1) 0.12s, filter 0.72s ease 0.12s',
        }}
      >
        <div
          className="relative flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl sm:rounded-full border backdrop-blur-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: theme.glassBg,
            borderColor: theme.glassBorder,
            boxShadow: theme.isLight
              ? '0 18px 50px -12px rgba(10,10,12,0.14), inset 0 1px 0 rgba(255,255,255,0.8)'
              : '0 22px 60px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14)',
            transition: 'background-color 0.45s ease, border-color 0.45s ease',
          }}
        >
          {/* Gyroscope & Ambient Specular Glass Shine */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(${105 + gyroTilt.x * 35}deg, transparent 20%, rgba(255,255,255,${theme.isLight ? '0.55' : '0.16'}) 50%, transparent 80%)`,
            }}
          />

          {/* Direct Email Copy Button with Cipher Scramble & Blur-Morph */}
          <MagneticButton
            onClick={handleCopyEmail}
            onMouseEnter={runEmailScramble}
            strength={0.2}
            className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] tracking-[0.14em]"
            style={{ color: theme.textPrimary }}
            title="Click to copy email"
          >
            <span className="relative inline-flex items-center whitespace-nowrap">
              <span
                className="inline-flex items-center gap-2"
                style={{
                  opacity: emailCopied ? 0 : 1,
                  filter: emailCopied ? 'blur(5px)' : 'blur(0px)',
                  transform: emailCopied ? 'translateY(-6px)' : 'translateY(0)',
                  transition:
                    'opacity 0.28s ease, filter 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      shaderMode === 'BLUEPRINT'
                        ? '#38BDF8'
                        : theme.textPrimary,
                  }}
                />
                <span>{emailDisplay}</span>
              </span>
              <span
                className="absolute inset-0 inline-flex items-center justify-center font-medium tracking-[0.2em] uppercase"
                style={{
                  opacity: emailCopied ? 1 : 0,
                  filter: emailCopied ? 'blur(0px)' : 'blur(5px)',
                  transform: emailCopied ? 'translateY(0)' : 'translateY(6px)',
                  color:
                    shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textPrimary,
                  transition:
                    'opacity 0.28s ease, filter 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                DIRECT LINE COPIED ✦
              </span>
            </span>
          </MagneticButton>

          {/* Direct Mailto Trigger */}
          <MagneticButton
            href={`mailto:${CREATOR_EMAIL}`}
            onMouseEnter={() => audioRef.current?.playSoftHover()}
            onClick={() => audioRef.current?.playMechanicalTick(950)}
            strength={0.25}
            className="px-2.5 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.2em] uppercase border"
            style={{
              borderColor: theme.glassBorder,
              color: theme.textMuted,
            }}
            title="Open Mail App"
          >
            MAIL ↗
          </MagneticButton>

          <span
            aria-hidden="true"
            className="hidden sm:inline-block w-[1px] h-4 mx-1"
            style={{ backgroundColor: theme.glassBorder }}
          />

          {/* Instagram Link with Vertical Slot-Roll Handle Reveal */}
          <MagneticButton
            href={CREATOR_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setInstaHovered(true);
              audioRef.current?.playMechanicalTick(1040);
            }}
            onMouseLeave={() => setInstaHovered(false)}
            strength={0.24}
            className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] tracking-[0.16em] uppercase"
            style={{ color: theme.textPrimary }}
          >
            <SlotRollLabel
              primary="INSTAGRAM ↗"
              secondary={`${CREATOR_INSTAGRAM_HANDLE} ↗`}
              hovered={instaHovered}
              underlineColor={
                shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textPrimary
              }
            />
          </MagneticButton>

          {/* LinkedIn Link with Vertical Slot-Roll Handle Reveal */}
          <MagneticButton
            href={CREATOR_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setLinkedinHovered(true);
              audioRef.current?.playMechanicalTick(1120);
            }}
            onMouseLeave={() => setLinkedinHovered(false)}
            strength={0.24}
            className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] tracking-[0.16em] uppercase"
            style={{ color: theme.textPrimary }}
          >
            <SlotRollLabel
              primary="LINKEDIN ↗"
              secondary={`${CREATOR_LINKEDIN_HANDLE} ↗`}
              hovered={linkedinHovered}
              underlineColor={
                shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textPrimary
              }
            />
          </MagneticButton>
        </div>
      </nav>

      {/* ================================================================
          8. REALITY-TEAR KINETIC SHUTTER + 0.8S ARCHITECTURAL TELEMETRY FLASH
         ================================================================ */}
      <div
        aria-hidden={!introActive}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
        style={{
          opacity: introActive ? 1 : 0,
          filter: introActive ? 'blur(0px)' : 'blur(14px)',
          transform: introActive ? 'scale(1)' : 'scale(1.04)',
          transition:
            'opacity 0.48s cubic-bezier(0.22,1,0.36,1), filter 0.48s ease, transform 0.48s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1/2 border-b border-white/10"
          style={{
            backgroundColor: theme.bgHex,
            transformOrigin: 'top center',
            transform: shutterOpened ? 'scaleY(0)' : 'scaleY(1)',
            transition: 'transform 0.62s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 border-t border-white/10"
          style={{
            backgroundColor: theme.bgHex,
            transformOrigin: 'bottom center',
            transform: shutterOpened ? 'scaleY(0)' : 'scaleY(1)',
            transition: 'transform 0.62s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        <div
          className="absolute left-0 right-0 h-[2px]"
          style={{
            transform: shutterOpened ? 'scaleX(1)' : 'scaleX(0)',
            opacity: shutterOpened ? 0 : 0.9,
            transition:
              'transform 0.52s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease',
            background:
              'linear-gradient(90deg, transparent, #38BDF8, #FFFFFF, #F43F5E, transparent)',
            boxShadow: '0 0 28px rgba(56,189,248,0.8)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-2 text-center px-6">
          <div className="flex items-center gap-4 text-[10px] sm:text-[11px] tracking-[0.34em] uppercase">
            <span>SYSTEM // SANRACHNA</span>
            <span className="opacity-35">·</span>
            <span>CRAFT // HAND-CODED</span>
          </div>
          <div
            className="text-4xl sm:text-5xl tabular-nums tracking-tight"
            style={{
              fontFamily:
                '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
            }}
          >
            {String(introPercent).padStart(2, '0')}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPassModal;
