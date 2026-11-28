import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';

/* ============================================================================
   TYPES & CONSTANTS
   ============================================================================ */

export interface CreatorPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

type WorldMode = 'STORM_LAMP' | 'MOON_LIGHTNING' | 'GOLDEN_MORNING';
type StagePhase = 'FLICKER' | 'INTRO' | 'DESK';

const CREATOR_EMAIL = 'samratsandilya4@gmail.com';
const CREATOR_INSTAGRAM_URL = 'https://www.instagram.com/samrat.tiwary';
const CREATOR_INSTAGRAM_HANDLE = '@samrat.tiwary';
const CREATOR_LINKEDIN_URL = 'https://www.linkedin.com/in/samrat-sandilya';
const CREATOR_LINKEDIN_HANDLE = 'in/samrat-sandilya';

const WORLD_ORDER: WorldMode[] = [
  'STORM_LAMP',
  'MOON_LIGHTNING',
  'GOLDEN_MORNING',
];

const WORLD_LABELS: Record<WorldMode, string> = {
  STORM_LAMP: 'STORM · LAMP ON',
  MOON_LIGHTNING: 'NIGHT · LIGHTNING',
  GOLDEN_MORNING: 'DAWN · SUNBEAMS',
};

/* ============================================================================
   SELF-CONTAINED SCOPED CSS (ZERO TAILWIND DEPENDENCY, MOBILE + DESKTOP)
   ============================================================================ */

const VINTAGE_SCOPED_CSS = `
.vs-root, .vs-root * {
  box-sizing: border-box;
}
.vs-root {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  z-index: 2147483000 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  user-select: none;
  -webkit-user-select: none;
  background: #06070a;
  font-family: "Cormorant Garamond", Georgia, serif;
}
.vs-root button, .vs-root a {
  font-family: inherit;
  text-decoration: none;
  outline: none;
}

@keyframes vsPowerFlicker {
  0% { opacity: 0; }
  12% { opacity: 0.92; background: #1a1510; }
  26% { opacity: 0.12; background: #000; }
  42% { opacity: 0.96; background: #0d0b08; }
  62% { opacity: 0.2; background: #000; }
  82% { opacity: 1; background: #030407; }
  100% { opacity: 1; background: #030407; }
}

@keyframes vsInkReveal {
  0% { clip-path: inset(0 100% 0 0); filter: blur(1.4px); }
  72% { clip-path: inset(0 0% 0 0); filter: blur(0px); }
  100% { clip-path: inset(0 0% 0 0); filter: blur(0px); }
}

@keyframes vsWetSheen {
  0% { background-position: -140% 0; opacity: 0.95; }
  65% { background-position: 140% 0; opacity: 0.55; }
  100% { background-position: 180% 0; opacity: 0; }
}

@keyframes vsSealStamp {
  0% { transform: scale(2.1) rotate(-18deg); opacity: 0; filter: blur(6px); }
  60% { transform: scale(0.92) rotate(-6deg); opacity: 1; filter: blur(0px); }
  80% { transform: scale(1.04) rotate(-8deg); opacity: 1; }
  100% { transform: scale(1) rotate(-7deg); opacity: 1; }
}

@keyframes vsInkStampSlam {
  0% { transform: translate(-50%, -50%) scale(2.4) rotate(-22deg); opacity: 0; }
  55% { transform: translate(-50%, -50%) scale(0.92) rotate(-11deg); opacity: 0.96; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(-12deg); opacity: 0.9; }
}

@keyframes vsCurtainSway {
  0%, 100% { transform: skewX(-1.5deg) translateX(0px); }
  45% { transform: skewX(5.5deg) translateX(16px); }
  70% { transform: skewX(1.5deg) translateX(4px); }
}

@keyframes vsPageFlutter {
  0% { transform: rotateY(0deg) skewY(0deg); }
  35% { transform: rotateY(-17deg) skewY(-1.6deg); }
  65% { transform: rotateY(-9deg) skewY(-0.8deg); }
  100% { transform: rotateY(0deg) skewY(0deg); }
}

.vs-ink-name {
  display: inline-block;
  position: relative;
  font-family: "Great Vibes", "Cormorant Garamond", cursive, serif;
  line-height: 1.08;
  animation: vsInkReveal 2.35s cubic-bezier(0.25, 0.85, 0.35, 1) forwards;
}

.vs-ink-name::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  background: linear-gradient(108deg, transparent 22%, rgba(255, 240, 200, 0.65) 48%, transparent 72%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  pointer-events: none;
  animation: vsWetSheen 3.2s ease-out forwards;
}

.vs-ink-sub {
  display: inline-block;
  animation: vsInkReveal 1.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.vs-wax-seal {
  animation: vsSealStamp 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.vs-stamp-copied {
  animation: vsInkStampSlam 0.34s cubic-bezier(0.18, 0.9, 0.3, 1.15) forwards;
}

.vs-book-stage {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 68px 18px 88px;
  pointer-events: none;
  perspective: 1800px;
}

.vs-book-wrap {
  position: relative;
  width: min(790px, 88vw);
  height: min(448px, 58dvh);
  pointer-events: auto;
  transform-style: preserve-3d;
}

.vs-hud-top {
  position: fixed;
  top: 16px;
  left: 20px;
  right: 20px;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.vs-chain-anchor {
  position: fixed;
  top: 0;
  right: 118px;
  z-index: 50;
  touch-action: none;
  cursor: grab;
}
.vs-chain-anchor:active {
  cursor: grabbing;
}

.vs-hint-bar {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 35;
  font-family: "Cinzel", Georgia, serif;
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  text-align: center;
  padding: 5px 14px;
  border-radius: 999px;
}

@media (max-width: 767px) {
  .vs-book-stage {
    padding: 62px 12px 104px;
  }
  .vs-book-wrap {
    width: min(368px, 90vw);
    height: min(455px, 60dvh);
  }
  .vs-hud-top {
    top: 12px;
    left: 12px;
    right: 12px;
  }
  .vs-chain-anchor {
    right: 76px;
  }
  .vs-hint-bar {
    font-size: 8px;
    letter-spacing: 0.16em;
    bottom: 10px;
    max-width: 92vw;
    white-space: normal;
  }
}
`;

let vintageAssetsInjected = false;
function ensureVintageAssets() {
  if (vintageAssetsInjected || typeof document === 'undefined') return;
  vintageAssetsInjected = true;

  if (!document.getElementById('vs-vintage-fonts')) {
    const link = document.createElement('link');
    link.id = 'vs-vintage-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }

  if (!document.getElementById('vs-vintage-css')) {
    const style = document.createElement('style');
    style.id = 'vs-vintage-css';
    style.textContent = VINTAGE_SCOPED_CSS;
    document.head.appendChild(style);
  }
}

/* ============================================================================
   SECRET HOLD-TO-CHARGE TRIGGER HOOK (100% COMPATIBLE WITH App.tsx)
   ============================================================================ */

export interface CreatorPassTriggerHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  onContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

export interface CreatorPassTriggerResult extends CreatorPassTriggerHandlers {
  bind: CreatorPassTriggerHandlers;
  chargeRatio: number;
  isCharging: boolean;
}

export function useCreatorPassTrigger(
  onTrigger?: () => void,
  holdMs = 10000,
  revealDelayMs = 3000
): CreatorPassTriggerResult {
  const totalHoldMs = Math.max(400, holdMs);
  const delayMs =
    revealDelayMs >= 0 && revealDelayMs < totalHoldMs ? revealDelayMs : 0;

  const callbackRef = useRef(onTrigger);
  callbackRef.current = onTrigger;

  const chargeRafRef = useRef<number>(0);
  const chargeStartRef = useRef<number>(0);
  const chargeActiveRef = useRef<boolean>(false);

  const [chargeRatio, setChargeRatio] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  const cancelChargeRef = useRef<() => void>(() => {});

  const cancelCharge = useCallback(() => {
    if (!chargeActiveRef.current) return;
    chargeActiveRef.current = false;
    cancelAnimationFrame(chargeRafRef.current);
    window.removeEventListener('pointerup', cancelChargeRef.current);
    window.removeEventListener('pointercancel', cancelChargeRef.current);
    window.removeEventListener('mouseup', cancelChargeRef.current);
    window.removeEventListener('touchend', cancelChargeRef.current);
    window.removeEventListener('touchcancel', cancelChargeRef.current);
    window.removeEventListener('blur', cancelChargeRef.current);
    setIsCharging(false);
    setChargeRatio(0);
  }, []);

  cancelChargeRef.current = cancelCharge;

  const startCharge = useCallback(() => {
    if (chargeActiveRef.current) return;
    chargeActiveRef.current = true;
    chargeStartRef.current = performance.now();
    setIsCharging(true);

    window.addEventListener('pointerup', cancelChargeRef.current);
    window.addEventListener('pointercancel', cancelChargeRef.current);
    window.addEventListener('mouseup', cancelChargeRef.current);
    window.addEventListener('touchend', cancelChargeRef.current);
    window.addEventListener('touchcancel', cancelChargeRef.current);
    window.addEventListener('blur', cancelChargeRef.current);

    const tick = (now: number) => {
      if (!chargeActiveRef.current) return;
      const elapsed = now - chargeStartRef.current;

      if (elapsed >= totalHoldMs) {
        cancelChargeRef.current();
        callbackRef.current?.();
        return;
      }

      if (elapsed >= delayMs) {
        const ratio = Math.min(
          1,
          (elapsed - delayMs) / (totalHoldMs - delayMs)
        );
        setChargeRatio(ratio);
      } else {
        setChargeRatio(0);
      }

      chargeRafRef.current = requestAnimationFrame(tick);
    };

    chargeRafRef.current = requestAnimationFrame(tick);
  }, [totalHoldMs, delayMs]);

  useEffect(() => {
    return () => {
      cancelChargeRef.current();
    };
  }, []);

  // Keyboard shortcut ("samrat" or Ctrl+Shift+S)
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
        buffer = (buffer + e.key.toLowerCase()).slice(-12);
        if (buffer.includes('samrat')) {
          buffer = '';
          callbackRef.current?.();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handlers = useMemo<CreatorPassTriggerHandlers>(
    () => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        startCharge();
      },
      onPointerUp: () => cancelCharge(),
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
        let captured = false;
        try {
          captured = e.currentTarget.hasPointerCapture(e.pointerId);
        } catch {
          captured = false;
        }
        if (!captured && e.pointerType === 'mouse') {
          cancelCharge();
        }
      },
      onPointerCancel: () => cancelCharge(),
      onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        startCharge();
      },
      onMouseUp: () => cancelCharge(),
      onTouchStart: () => startCharge(),
      onTouchEnd: () => cancelCharge(),
      onTouchCancel: () => cancelCharge(),
      onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
      },
    }),
    [startCharge, cancelCharge]
  );

  return useMemo(() => {
    const result = { ...handlers } as CreatorPassTriggerResult;
    Object.defineProperties(result, {
      bind: {
        value: handlers,
        enumerable: false,
        configurable: true,
      },
      chargeRatio: {
        value: chargeRatio,
        enumerable: false,
        configurable: true,
      },
      isCharging: {
        value: isCharging,
        enumerable: false,
        configurable: true,
      },
    });
    return result;
  }, [handlers, chargeRatio, isCharging]);
}

/* ============================================================================
   REAL-TIME PROCEDURAL AUDIO ENGINE (RAIN, THUNDER, PAPER, BRASS CHAIN, STAMP)
   ============================================================================ */

class VintageAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
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
      if (!this.noiseBuffer) {
        const len = this.ctx.sampleRate * 2;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.95 * b2 + white * 0.048;
          data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.14) * 1.6));
        }
        this.noiseBuffer = buf;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public startRainAmbience(level = 0.055) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    if (this.rainSource) {
      this.setRainLevel(level);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 980;
    filter.Q.value = 0.65;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    this.rainSource = src;
    this.rainFilter = filter;
    this.rainGain = gain;
  }

  public setRainLevel(level: number, freq = 980) {
    if (!this.ctx || !this.rainGain || !this.rainFilter) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : Math.max(0.0001, level);
    this.rainGain.gain.cancelScheduledValues(now);
    this.rainGain.gain.setTargetAtTime(target, now, 0.25);
    this.rainFilter.frequency.setTargetAtTime(freq, now, 0.25);
  }

  public playThunder(intensity = 1) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340 * intensity, now);
    filter.frequency.exponentialRampToValueAtTime(52, now + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24 * intensity, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 1.8);
  }

  public playChainSwitch() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Metallic brass clink + crisp toggle katak
    const freqs = [2450, 1480];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.042;
      osc.type = idx === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.28, t + 0.045);

      gain.gain.setValueAtTime(idx === 0 ? 0.08 : 0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    });
  }

  public playPaperFlip(soft = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(soft ? 1300 : 1850, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + 0.24);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(soft ? 0.045 : 0.11, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.3);
  }

  public playWoodThud(heavy = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 128 : 175, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    gain.gain.setValueAtTime(heavy ? 0.17 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playNibScratch() {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.15);
    gain.gain.setValueAtTime(0.022, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 2.15);
  }

  public setMuted(m: boolean) {
    this.muted = m;
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(
        m ? 0.0001 : 0.045,
        this.ctx.currentTime,
        0.15
      );
    }
  }

  public dispose() {
    try {
      this.rainSource?.stop();
    } catch {
      // ignore
    }
    this.rainSource = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

/* ============================================================================
   MAIN COMPONENT: VINTAGE STORM DESK & LIVING BOOK (MOBILE + LAPTOP)
   ============================================================================ */

export const CreatorPassModal: React.FC<CreatorPassModalProps> = ({
  isOpen = true,
  onClose,
  isDarkMode = true,
}) => {
  void isDarkMode;

  const [phase, setPhase] = useState<StagePhase>('FLICKER');
  const [worldMode, setWorldMode] = useState<WorldMode>('STORM_LAMP');
  const [isMobile, setIsMobile] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoAvailable, setVideoAvailable] = useState(true);

  // Book & ink state
  const [bookOpened, setBookOpened] = useState(false);
  const [activePage, setActivePage] = useState<0 | 1>(0);
  const [inkReplayKey, setInkReplayKey] = useState(0);
  const [sealStamped, setSealStamped] = useState(false);
  const [windGustTick, setWindGustTick] = useState(0);

  // Interactive Calling Card & Copy Stamp
  const [cardPullY, setCardPullY] = useState(0);
  const [emailCopied, setEmailCopied] = useState(false);

  // Pull-Chain Physics
  const [chainPullY, setChainPullY] = useState(0);
  const [chainSwayDeg, setChainSwayDeg] = useState(0);
  const chainDragRef = useRef({
    active: false,
    startY: 0,
    triggered: false,
    moved: false,
  });

  // Brass Paperweight Drag State
  const [weightPos, setWeightPos] = useState({ x: 0, y: 0, initialized: false });
  const [weightOnBook, setWeightOnBook] = useState(false);
  const weightDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  // Fallen Paper Plane Physics State (desk prop)
  const [planeState, setPlaneState] = useState({
    x: 0,
    y: 0,
    rot: -24,
    initialized: false,
  });
    const planePhysicsRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: -24,
    vrot: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: false,
    initialized: false,
  });
  });

  // Refs
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const introCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bookRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<VintageAudioEngine | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  const worldRef = useRef<WorldMode>('STORM_LAMP');
  const lightningFlashRef = useRef<number>(0);
  const pointerNormRef = useRef({ x: 0, y: 0 });
  const weightOnBookRef = useRef(false);

  useEffect(() => {
    worldRef.current = worldMode;
    if (audioRef.current) {
      if (worldMode === 'GOLDEN_MORNING') {
        audioRef.current.setRainLevel(0.008, 620);
      } else if (worldMode === 'MOON_LIGHTNING') {
        audioRef.current.setRainLevel(0.068, 1120);
      } else {
        audioRef.current.setRainLevel(0.048, 920);
      }
    }
  }, [worldMode]);

  useEffect(() => {
    weightOnBookRef.current = weightOnBook;
  }, [weightOnBook]);

  // Ensure fonts, CSS, and responsive flag
  useEffect(() => {
    ensureVintageAssets();
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      const w = window.innerWidth;
      const h = window.innerHeight;
      setWeightPos((prev) =>
        prev.initialized
          ? prev
          : {
              x: mobile ? 20 : Math.max(36, w * 0.08),
              y: mobile ? h - 88 : h - 110,
              initialized: true,
            }
      );

      if (!planePhysicsRef.current.initialized) {
        const px = mobile ? w - 92 : w - Math.max(130, w * 0.14);
        const py = mobile ? h - 88 : h - 112;
        planePhysicsRef.current.x = px;
        planePhysicsRef.current.y = py;
        planePhysicsRef.current.rot = -22;
        planePhysicsRef.current.initialized = true;
        setPlaneState({ x: px, y: py, rot: -22, initialized: true });
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const enterDeskScene = useCallback(() => {
    setPhase('DESK');
    audioRef.current?.startRainAmbience(0.048);
    window.setTimeout(() => {
      setBookOpened(true);
      audioRef.current?.playPaperFlip(false);
      window.setTimeout(() => {
        audioRef.current?.playNibScratch();
      }, 360);
      window.setTimeout(() => {
        setSealStamped(true);
        audioRef.current?.playWoodThud(false);
      }, 2150);
    }, 420);
  }, []);

  // Lifecycle when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const audio = new VintageAudioEngine();
    audio.muted = audioMuted;
    audioRef.current = audio;

    setPhase('FLICKER');
    setWorldMode('STORM_LAMP');
    setBookOpened(false);
    setActivePage(0);
    setSealStamped(false);
    setEmailCopied(false);
    setWeightOnBook(false);
    setCardPullY(0);
    setVideoAvailable(true);
    setInkReplayKey((k) => k + 1);

    const flickerTimer = window.setTimeout(() => {
      setPhase('INTRO');
      audio.playThunder(1.05);
      audio.startRainAmbience(0.075);
    }, 420);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(flickerTimer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      audio.dispose();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Periodic Wind Gusts on the Desk (flutters page corner & sways chain unless pinned)
  useEffect(() => {
    if (!isOpen || phase !== 'DESK') return;

    const gustInterval = window.setInterval(() => {
      if (worldRef.current === 'GOLDEN_MORNING') {
        setChainSwayDeg(2.2);
        window.setTimeout(() => setChainSwayDeg(0), 1100);
        return;
      }

      setChainSwayDeg(6.5);
      window.setTimeout(() => setChainSwayDeg(-3.5), 550);
      window.setTimeout(() => setChainSwayDeg(0), 1300);

      if (!weightOnBookRef.current) {
        setWindGustTick((t) => t + 1);
        audioRef.current?.playPaperFlip(true);
      }

      // Occasional distant lightning flash
      if (Math.random() < (worldRef.current === 'MOON_LIGHTNING' ? 0.72 : 0.36)) {
        lightningFlashRef.current = 1;
        if (Math.random() < 0.6) {
          audioRef.current?.playThunder(0.55);
        }
      }
    }, 4400);

    return () => window.clearInterval(gustInterval);
  }, [isOpen, phase]);

  /* ==========================================================================
     FALLBACK PROCEDURAL CINEMATIC INTRO CANVAS (STORMY CITY -> PLANE -> WINDOW -> DESK)
     Plays seamlessly if /creator-intro.mp4 is not uploaded yet!
     ========================================================================== */

  useEffect(() => {
    if (!isOpen || phase !== 'INTRO' || videoAvailable) return;
    const canvas = introCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Procedural stormy city rooftops
    const buildings = Array.from({ length: 26 }, (_, i) => ({
      x: (i / 25) * w * 1.15 - w * 0.08,
      bw: 36 + ((i * 37) % 68),
      bh: h * (0.2 + ((i * 53) % 28) / 100),
      lights: Array.from({ length: 6 }, (__, j) => ({
        rx: ((j * 19) % 70) / 100,
        ry: ((j * 29) % 75) / 100,
        lit: (i + j) % 3 === 0,
      })),
    }));

    const raindrops = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 12 + Math.random() * 20,
      sp: 14 + Math.random() * 14,
    }));

    const duration = 4300;
    const start = performance.now();
    let rafId = 0;
    let thunderPlayed2 = false;

    const drawFrame = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);

      if (t > 0.56 && !thunderPlayed2) {
        thunderPlayed2 = true;
        audioRef.current?.playPaperFlip(true);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Lightning spikes at 0.08 and 0.54
      const flash1 = Math.max(0, 1 - Math.abs(t - 0.09) * 18);
      const flash2 = Math.max(0, 1 - Math.abs(t - 0.55) * 14) * 0.85;
      const flash = Math.min(1, flash1 + flash2);

      // Zoom camera progressively toward the broken window (t: 0 -> 0.72) then dive to desk (0.72 -> 1)
      const cityZoom = 1 + Math.pow(Math.min(1, t / 0.75), 2.2) * 2.4;

      // Storm Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(
        0,
        flash > 0.2
          ? `rgb(${24 + flash * 90}, ${34 + flash * 105}, ${54 + flash * 125})`
          : '#060a14'
      );
      skyGrad.addColorStop(0.55, '#0d1524');
      skyGrad.addColorStop(1, '#120f12');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Jagged Lightning Bolt in Distance
      if (flash > 0.25) {
        ctx.strokeStyle = `rgba(225, 240, 255, ${flash * 0.92})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        let lx = w * (t < 0.3 ? 0.26 : 0.72);
        let ly = 0;
        ctx.moveTo(lx, ly);
        for (let s = 0; s < 8; s++) {
          lx += (s % 2 === 0 ? 1 : -1) * (14 + ((s * 13) % 24));
          ly += h * 0.065;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      // City Skyline Layer (zooms past as we fly toward the old house)
      ctx.save();
      ctx.translate(w / 2, h * 0.52);
      ctx.scale(cityZoom, cityZoom);
      ctx.translate(-w / 2, -h * 0.52);

      const skylineBase = h * 0.78;
      buildings.forEach((b) => {
        ctx.fillStyle = flash > 0.3 ? '#151f33' : '#080c16';
        ctx.fillRect(b.x, skylineBase - b.bh, b.bw, b.bh + h * 0.3);

        b.lights.forEach((l) => {
          if (!l.lit) return;
          ctx.fillStyle = 'rgba(245, 185, 92, 0.42)';
          ctx.fillRect(
            b.x + 6 + l.rx * (b.bw - 14),
            skylineBase - b.bh + 10 + l.ry * (b.bh - 20),
            3.5,
            5
          );
        });
      });

      // Center Vintage House with Glowing Broken Window
      const houseW = Math.min(w * 0.38, 280);
      const houseH = h * 0.44;
      const hx = w / 2 - houseW / 2;
      const hy = skylineBase - houseH;

      ctx.fillStyle = '#0c0b10';
      ctx.beginPath();
      ctx.moveTo(hx - 16, hy + 28);
      ctx.lineTo(w / 2, hy - 34);
      ctx.lineTo(hx + houseW + 16, hy + 28);
      ctx.lineTo(hx + houseW, hy + 28);
      ctx.lineTo(hx + houseW, skylineBase + 40);
      ctx.lineTo(hx, skylineBase + 40);
      ctx.lineTo(hx, hy + 28);
      ctx.closePath();
      ctx.fill();

      // Warm Glowing Vintage Window
      const winW = houseW * 0.38;
      const winH = houseH * 0.34;
      const wx = w / 2 - winW / 2;
      const wy = hy + houseH * 0.24;

      const winGlow = ctx.createRadialGradient(
        w / 2,
        wy + winH / 2,
        6,
        w / 2,
        wy + winH / 2,
        winW * 1.4
      );
      winGlow.addColorStop(0, 'rgba(255, 206, 128, 0.92)');
      winGlow.addColorStop(0.45, 'rgba(220, 145, 62, 0.32)');
      winGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = winGlow;
      ctx.fillRect(wx - winW, wy - winH, winW * 3, winH * 3);

      // Window Frame + Broken Glass Shards
      ctx.fillStyle = '#261a10';
      ctx.fillRect(wx, wy, winW, winH);
      ctx.fillStyle = 'rgba(255, 198, 118, 0.78)';
      ctx.fillRect(wx + 4, wy + 4, winW - 8, winH - 8);

      // Broken jagged dark cutout inside window
      ctx.fillStyle = '#1b1109';
      ctx.beginPath();
      ctx.moveTo(wx + winW * 0.22, wy + winH * 0.18);
      ctx.lineTo(wx + winW * 0.78, wy + winH * 0.26);
      ctx.lineTo(wx + winW * 0.68, wy + winH * 0.84);
      ctx.lineTo(wx + winW * 0.26, wy + winH * 0.74);
      ctx.closePath();
      ctx.fill();

      // Window Mullions
      ctx.strokeStyle = '#1a120b';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, winW, winH);
      ctx.beginPath();
      ctx.moveTo(wx + winW / 2, wy);
      ctx.lineTo(wx + winW / 2, wy + winH);
      ctx.moveTo(wx, wy + winH / 2);
      ctx.lineTo(wx + winW, wy + winH / 2);
      ctx.stroke();

      ctx.restore();

      // Flying Folded Magazine Paper Aeroplane (arcs from lower-left -> broken window -> desk)
      const planeP = Math.min(1, Math.max(0, (t - 0.08) / 0.82));
      const px =
        w * 0.14 +
        Math.sin(planeP * Math.PI * 0.85) * w * 0.38 +
        planeP * w * 0.36;
      const py =
        h * 0.78 -
        Math.sin(planeP * Math.PI) * h * 0.38 +
        Math.pow(planeP, 3) * h * 0.26;
      const pScale =
        planeP < 0.65
          ? 1.5 - planeP * 0.9
          : 0.92 + (planeP - 0.65) * 1.4;
      const pRot = -0.45 + planeP * 0.72;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pRot);
      ctx.scale(pScale, pScale);

      // Folded vintage parchment paper plane
      ctx.fillStyle = '#efe5d0';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(-26, -15);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d4c3a3';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-22, 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#b49f7d';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Slanted Rain Streaks
      ctx.strokeStyle =
        flash > 0.3
          ? 'rgba(215, 232, 255, 0.45)'
          : 'rgba(170, 196, 230, 0.26)';
      ctx.lineWidth = 1;
      for (let i = 0; i < raindrops.length; i++) {
        const r = raindrops[i];
        r.x -= r.sp * 0.25;
        r.y += r.sp;
        if (r.y > h) {
          r.y = -20;
          r.x = Math.random() * (w + 120);
        }
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 4, r.y + r.len);
        ctx.stroke();
      }

      // Smooth warm transition into wooden desk at end of intro (t > 0.78)
      if (t > 0.78) {
        const fade = (t - 0.78) / 0.22;
        ctx.fillStyle = `rgba(18, 12, 8, ${fade.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();

      if (t < 1) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        enterDeskScene();
      }
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, phase, videoAvailable, enterDeskScene]);

  /* ==========================================================================
     LIVE DESK ATMOSPHERE CANVAS (BROKEN WINDOW + STORMY CITY + WOODEN DESK + SUNBEAMS)
     ========================================================================== */

  useEffect(() => {
    if (!isOpen || phase !== 'DESK') return;
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const rain = Array.from({ length: 95 }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: 10 + Math.random() * 18,
      speed: 0.012 + Math.random() * 0.014,
    }));

    const dust = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.3) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00018,
      phase: Math.random() * Math.PI * 2,
    }));

    const cityTowers = Array.from({ length: 24 }, (_, i) => ({
      xFrac: i / 23,
      wFrac: 0.032 + ((i * 17) % 35) / 1000,
      hFrac: 0.09 + ((i * 29) % 16) / 100,
      hasWarmLight: i % 2 === 0,
    }));

    let rafId = 0;
    let time = 0;

    const render = () => {
      rafId = requestAnimationFrame(render);
      time += 0.016;
      lightningFlashRef.current *= 0.88;
      const flash = lightningFlashRef.current;
      const mode = worldRef.current;
      const px = pointerNormRef.current.x;
      const py = pointerNormRef.current.y;

      ctx.save();
      ctx.scale(dpr, dpr);

      const horizonY = h * 0.44;

      // 1. Vintage Room Wall & Window Backdrop
      const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY + 30);
      if (mode === 'GOLDEN_MORNING') {
        wallGrad.addColorStop(0, '#2a2118');
        wallGrad.addColorStop(1, '#1d150f');
      } else if (mode === 'MOON_LIGHTNING') {
        wallGrad.addColorStop(0, flash > 0.15 ? '#1b273b' : '#060a12');
        wallGrad.addColorStop(1, '#080c15');
      } else {
        wallGrad.addColorStop(0, '#120e0b');
        wallGrad.addColorStop(1, '#0d0907');
      }
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, horizonY + 30);

      // 2. Broken Vintage Window Opening (Centered behind desk)
      const winW = Math.min(w * 0.72, 680);
      const winH = horizonY * 0.86;
      const winX = w / 2 - winW / 2 - px * 10;
      const winY = horizonY - winH - 6 - py * 5;

      ctx.save();
      ctx.beginPath();
      ctx.rect(winX, winY, winW, winH);
      ctx.clip();

      // Outside Sky
      const skyGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
      if (mode === 'GOLDEN_MORNING') {
        skyGrad.addColorStop(0, '#6e5842');
        skyGrad.addColorStop(0.55, '#c9945a');
        skyGrad.addColorStop(1, '#e8be82');
      } else if (mode === 'MOON_LIGHTNING') {
        skyGrad.addColorStop(
          0,
          `rgb(${10 + flash * 125}, ${18 + flash * 145}, ${36 + flash * 170})`
        );
        skyGrad.addColorStop(1, '#13223b');
      } else {
        skyGrad.addColorStop(
          0,
          `rgb(${8 + flash * 100}, ${14 + flash * 120}, ${26 + flash * 145})`
        );
        skyGrad.addColorStop(1, '#182235');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Distant City Silhouette visible through the broken window
      const cityFloor = winY + winH;
      cityTowers.forEach((b, idx) => {
        const bx = winX + b.xFrac * winW - px * 6;
        const bw = b.wFrac * winW;
        const bh = b.hFrac * h;
        ctx.fillStyle =
          mode === 'GOLDEN_MORNING'
            ? 'rgba(54, 37, 25, 0.75)'
            : flash > 0.25
            ? 'rgba(20, 32, 52, 0.92)'
            : 'rgba(7, 11, 20, 0.92)';
        ctx.fillRect(bx, cityFloor - bh, bw, bh);

        if (b.hasWarmLight && mode !== 'GOLDEN_MORNING') {
          ctx.fillStyle =
            mode === 'MOON_LIGHTNING'
              ? 'rgba(180, 214, 255, 0.35)'
              : 'rgba(248, 192, 102, 0.48)';
          ctx.fillRect(bx + bw * 0.28, cityFloor - bh * 0.72, 2.5, 3.5);
          if (idx % 3 === 0) {
            ctx.fillRect(bx + bw * 0.56, cityFloor - bh * 0.48, 2.5, 3.5);
          }
        }
      });

      // Lightning Fork Outside Window
      if (flash > 0.22 && mode !== 'GOLDEN_MORNING') {
        ctx.strokeStyle = `rgba(232, 245, 255, ${flash * 0.9})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let lx = winX + winW * 0.64;
        let ly = winY;
        ctx.moveTo(lx, ly);
        for (let k = 0; k < 6; k++) {
          lx += (k % 2 === 0 ? -1 : 1) * 14;
          ly += winH / 6;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      // Rain Streaks Outside Window (in storm modes)
      if (mode !== 'GOLDEN_MORNING') {
        ctx.strokeStyle =
          mode === 'MOON_LIGHTNING'
            ? 'rgba(186, 218, 255, 0.34)'
            : 'rgba(170, 196, 232, 0.24)';
        ctx.lineWidth = 0.95;
        for (let i = 0; i < rain.length; i++) {
          const r = rain[i];
          r.y += r.speed;
          r.x -= r.speed * 0.22;
          if (r.y > 1) {
            r.y = 0;
            r.x = Math.random() * 1.15;
          }
          const rx = winX + r.x * winW;
          const ry = winY + r.y * winH;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + r.len);
          ctx.stroke();
        }
      }

      // Cracked Vintage Glass Shards along window edges
      ctx.fillStyle =
        mode === 'GOLDEN_MORNING'
          ? 'rgba(255, 238, 200, 0.16)'
          : `rgba(185, 222, 255, ${0.1 + flash * 0.22})`;
      ctx.strokeStyle =
        mode === 'GOLDEN_MORNING'
          ? 'rgba(255, 236, 196, 0.38)'
          : `rgba(204, 232, 255, ${0.28 + flash * 0.4})`;
      ctx.lineWidth = 1;

      // Top-left broken shard
      ctx.beginPath();
      ctx.moveTo(winX, winY);
      ctx.lineTo(winX + winW * 0.28, winY);
      ctx.lineTo(winX + winW * 0.14, winY + winH * 0.34);
      ctx.lineTo(winX, winY + winH * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top-right broken shard
      ctx.beginPath();
      ctx.moveTo(winX + winW, winY);
      ctx.lineTo(winX + winW * 0.72, winY);
      ctx.lineTo(winX + winW * 0.84, winY + winH * 0.38);
      ctx.lineTo(winX + winW, winY + winH * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bottom-left jagged shard
      ctx.beginPath();
      ctx.moveTo(winX, winY + winH);
      ctx.lineTo(winX + winW * 0.22, winY + winH);
      ctx.lineTo(winX + winW * 0.08, winY + winH * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Window Wooden Frame & Mullions
      ctx.strokeStyle = '#1b120b';
      ctx.lineWidth = 10;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(winX + winW * 0.5, winY);
      ctx.lineTo(winX + winW * 0.5, winY + winH);
      ctx.moveTo(winX, winY + winH * 0.48);
      ctx.lineTo(winX + winW, winY + winH * 0.48);
      ctx.stroke();

      ctx.restore();

      // 3. Textured Vintage Wooden Desk Surface
      const deskGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      if (mode === 'GOLDEN_MORNING') {
        deskGrad.addColorStop(0, '#3a2719');
        deskGrad.addColorStop(0.45, '#2b1c12');
        deskGrad.addColorStop(1, '#1a1009');
      } else if (mode === 'MOON_LIGHTNING') {
        deskGrad.addColorStop(0, '#0f141e');
        deskGrad.addColorStop(0.5, '#0b0e16');
        deskGrad.addColorStop(1, '#06080d');
      } else {
        deskGrad.addColorStop(0, '#24170f');
        deskGrad.addColorStop(0.45, '#19100a');
        deskGrad.addColorStop(1, '#0e0805');
      }
      ctx.fillStyle = deskGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Subtle Wood Grain Planks
      ctx.strokeStyle =
        mode === 'MOON_LIGHTNING'
          ? 'rgba(130, 165, 210, 0.05)'
          : 'rgba(255, 210, 160, 0.055)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 18; g++) {
        const gy = horizonY + Math.pow(g / 17, 1.45) * (h - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          w * 0.33,
          gy + Math.sin(g * 1.4) * 4,
          w * 0.66,
          gy - Math.cos(g * 1.1) * 4,
          w,
          gy
        );
        ctx.stroke();
      }

      // Desk Top Edge Bevel
      ctx.fillStyle =
        mode === 'GOLDEN_MORNING'
          ? 'rgba(255, 214, 150, 0.14)'
          : mode === 'MOON_LIGHTNING'
          ? 'rgba(150, 195, 255, 0.1)'
          : 'rgba(240, 185, 110, 0.1)';
      ctx.fillRect(0, horizonY, w, 2);

      // 4. Lighting Pools (Warm Tungsten Lamp / Lightning / Golden Morning Sunbeams)
      if (mode === 'STORM_LAMP') {
        const lampGlow = ctx.createRadialGradient(
          w * 0.5 + px * 24,
          h * 0.48 + py * 18,
          20,
          w * 0.5,
          h * 0.56,
          Math.max(w, h) * 0.62
        );
        lampGlow.addColorStop(0, 'rgba(255, 192, 102, 0.24)');
        lampGlow.addColorStop(0.48, 'rgba(218, 134, 48, 0.09)');
        lampGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lampGlow;
        ctx.fillRect(0, 0, w, h);
      } else if (mode === 'GOLDEN_MORNING') {
        // Volumetric diagonal morning sunbeams through the broken window
        ctx.save();
        const beamGrad = ctx.createLinearGradient(
          winX + winW * 0.2,
          winY,
          w * 0.78,
          h
        );
        beamGrad.addColorStop(0, 'rgba(255, 224, 158, 0.26)');
        beamGrad.addColorStop(0.6, 'rgba(255, 206, 128, 0.09)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(winX + winW * 0.12, winY + 10);
        ctx.lineTo(winX + winW * 0.68, winY + 10);
        ctx.lineTo(w * 0.96, h);
        ctx.lineTo(w * 0.24, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (flash > 0.04) {
        ctx.fillStyle = `rgba(190, 225, 255, ${flash * 0.22})`;
        ctx.fillRect(0, 0, w, h);
      }

      // 5. Floating Dust Motes in Light
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        d.x = (d.x + d.vx + 1) % 1;
        d.y = (d.y + d.vy + Math.sin(time + d.phase) * 0.00012 + 1) % 1;
        const alpha =
          (mode === 'GOLDEN_MORNING'
            ? 0.42
            : mode === 'STORM_LAMP'
            ? 0.22
            : 0.12 + flash * 0.25) *
          (0.5 + 0.5 * Math.sin(time * 1.4 + d.phase));

        ctx.fillStyle =
          mode === 'MOON_LIGHTNING'
            ? `rgba(190, 220, 255, ${alpha.toFixed(3)})`
            : `rgba(255, 232, 185, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen, phase]);

  /* ==========================================================================
     PAPER PLANE DESK SLIDE/SPIN PHYSICS LOOP
     ========================================================================== */

  useEffect(() => {
    if (!isOpen || phase !== 'DESK') return;
    let rafId = 0;

    const stepPlane = () => {
      rafId = requestAnimationFrame(stepPlane);
      const p = planePhysicsRef.current;
      if (!p.dragging && (Math.abs(p.vx) > 0.08 || Math.abs(p.vy) > 0.08 || Math.abs(p.vrot) > 0.08)) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.vrot *= 0.92;

        if (p.x < 24) {
          p.x = 24;
          p.vx = Math.abs(p.vx) * 0.55;
        } else if (p.x > w - 84) {
          p.x = w - 84;
          p.vx = -Math.abs(p.vx) * 0.55;
        }
        const minY = h * 0.45;
        if (p.y < minY) {
          p.y = minY;
          p.vy = Math.abs(p.vy) * 0.55;
        } else if (p.y > h - 68) {
          p.y = h - 68;
          p.vy = -Math.abs(p.vy) * 0.55;
        }

        setPlaneState({ x: p.x, y: p.y, rot: p.rot, initialized: true });
      }
    };

    rafId = requestAnimationFrame(stepPlane);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, phase]);

  /* ==========================================================================
     INTERACTIVE HANDLERS: PULL-CHAIN, PAPERWEIGHT, PAPER PLANE, CALLING CARD
     ========================================================================== */

  const cycleWorldMode = useCallback(() => {
    audioRef.current?.playChainSwitch();
    setWorldMode((prev) => {
      const next =
        WORLD_ORDER[(WORLD_ORDER.indexOf(prev) + 1) % WORLD_ORDER.length];
      if (next === 'MOON_LIGHTNING') {
        lightningFlashRef.current = 0.95;
        audioRef.current?.playThunder(0.75);
      }
      return next;
    });
  }, []);

  const handleChainDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    chainDragRef.current = {
      active: true,
      startY: e.clientY,
      triggered: false,
      moved: false,
    };
  };

  const handleChainMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!chainDragRef.current.active) return;
    const dy = Math.max(0, Math.min(82, e.clientY - chainDragRef.current.startY));
    if (dy > 5) chainDragRef.current.moved = true;
    setChainPullY(dy);
    if (dy >= 42 && !chainDragRef.current.triggered) {
      chainDragRef.current.triggered = true;
      cycleWorldMode();
    }
  };

  const handleChainUp = () => {
    if (!chainDragRef.current.active) return;
    const wasTap = !chainDragRef.current.moved && !chainDragRef.current.triggered;
    chainDragRef.current.active = false;
    if (wasTap) {
      setChainPullY(36);
      cycleWorldMode();
      window.setTimeout(() => setChainPullY(0), 140);
    } else {
      setChainPullY(0);
    }
    setChainSwayDeg(8);
    window.setTimeout(() => setChainSwayDeg(-5), 240);
    window.setTimeout(() => setChainSwayDeg(0), 620);
  };

  const handleWeightDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    weightDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: weightPos.x,
      origY: weightPos.y,
      moved: false,
    };
  };

  const handleWeightMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!weightDragRef.current.active) return;
    const dx = e.clientX - weightDragRef.current.startX;
    const dy = e.clientY - weightDragRef.current.startY;
    if (Math.hypot(dx, dy) > 6) weightDragRef.current.moved = true;
    setWeightPos({
      x: Math.max(8, Math.min(window.innerWidth - 68, weightDragRef.current.origX + dx)),
      y: Math.max(64, Math.min(window.innerHeight - 68, weightDragRef.current.origY + dy)),
      initialized: true,
    });
  };

  const handleWeightUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!weightDragRef.current.active) return;
    weightDragRef.current.active = false;
    const bookRect = bookRef.current?.getBoundingClientRect();

    // Quick tap toggles placing/removing paperweight on the book corner
    if (!weightDragRef.current.moved && bookRect) {
      if (!weightOnBook) {
        setWeightPos({
          x: bookRect.right - 68,
          y: bookRect.bottom - 72,
          initialized: true,
        });
        setWeightOnBook(true);
        audioRef.current?.playWoodThud(true);
      } else {
        setWeightPos({
          x: isMobile ? 20 : Math.max(36, window.innerWidth * 0.08),
          y: isMobile ? window.innerHeight - 88 : window.innerHeight - 110,
          initialized: true,
        });
        setWeightOnBook(false);
        audioRef.current?.playWoodThud(false);
      }
      return;
    }

    if (bookRect) {
      const cx = e.clientX;
      const cy = e.clientY;
      const inside =
        cx >= bookRect.left - 12 &&
        cx <= bookRect.right + 12 &&
        cy >= bookRect.top - 12 &&
        cy <= bookRect.bottom + 12;
      setWeightOnBook(inside);
      audioRef.current?.playWoodThud(inside);
    }
  };

  const handlePlaneDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const p = planePhysicsRef.current;
    p.dragging = true;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.vx = 0;
    p.vy = 0;
    p.moved = false;
  };

  const handlePlaneMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = planePhysicsRef.current;
    if (!p.dragging) return;
    const dx = e.clientX - p.lastX;
    const dy = e.clientY - p.lastY;
    if (Math.hypot(dx, dy) > 4) p.moved = true;
    p.x = Math.max(16, Math.min(window.innerWidth - 78, p.x + dx));
    p.y = Math.max(window.innerHeight * 0.44, Math.min(window.innerHeight - 64, p.y + dy));
    p.vx = dx * 0.85;
    p.vy = dy * 0.85;
    p.vrot = dx * 0.45;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    setPlaneState({ x: p.x, y: p.y, rot: p.rot, initialized: true });
  };

  const handlePlaneUp = () => {
    const p = planePhysicsRef.current;
    if (!p.dragging) return;
    p.dragging = false;
    if (!p.moved) {
      // Flick impulse on tap
      p.vx = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 5);
      p.vy = -(2 + Math.random() * 4);
      p.vrot = (Math.random() > 0.5 ? 1 : -1) * 9;
    }
    audioRef.current?.playPaperFlip(true);
  };

  const handleFlipPage = (nextPage: 0 | 1) => {
    if (activePage === nextPage) return;
    setActivePage(nextPage);
    audioRef.current?.playPaperFlip(false);
  };

  const handleReplayInk = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSealStamped(false);
    setInkReplayKey((k) => k + 1);
    audioRef.current?.playNibScratch();
    window.setTimeout(() => {
      setSealStamped(true);
      audioRef.current?.playWoodThud(false);
    }, 2100);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioRef.current?.playWoodThud(true);

    const fallback = () => {
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
      navigator.clipboard.writeText(CREATOR_EMAIL).catch(fallback);
    } else {
      fallback();
    }

    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    setEmailCopied(true);
    copiedTimerRef.current = window.setTimeout(() => {
      setEmailCopied(false);
    }, 2400);
  };

  const toggleAudio = () => {
    setAudioMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  };

  const handleRootPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerNormRef.current.x = e.clientX / window.innerWidth - 0.5;
    pointerNormRef.current.y = e.clientY / window.innerHeight - 0.5;
  };

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const isMorning = worldMode === 'GOLDEN_MORNING';
  const isMoon = worldMode === 'MOON_LIGHTNING';

  const parchmentBg = isMorning
    ? 'linear-gradient(145deg, #f8efd9 0%, #ead8b5 58%, #dfca9e 100%)'
    : isMoon
    ? 'linear-gradient(145deg, #bcc6d6 0%, #99a6bc 60%, #8392ab 100%)'
    : 'linear-gradient(145deg, #f2e4c4 0%, #e1cb9e 58%, #d2b682 100%)';

  const inkColor = isMoon ? '#0e1726' : '#1f150c';
  const mutedInk = isMoon ? 'rgba(14,23,38,0.68)' : 'rgba(54,36,20,0.68)';

  /* Reusable Calling Card Block */
  const renderCallingCard = () => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px 14px' : '22px 24px',
      }}
    >
      <div
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize: '9px',
          letterSpacing: '0.28em',
          color: mutedInk,
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        DIRECT CORRESPONDENCE
      </div>

      {/* Paper Pocket + Tucked Pullable Vintage Calling Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '286px',
          paddingTop: '14px',
        }}
      >
        <div
          onClick={() => setCardPullY((y) => (y === 0 ? -14 : 0))}
          style={{
            position: 'relative',
            zIndex: 2,
            borderRadius: '6px',
            padding: isMobile ? '16px 14px' : '18px 18px',
            background: isMoon
              ? 'linear-gradient(155deg, #d8e1ee 0%, #bac8db 100%)'
              : 'linear-gradient(155deg, #fbf5e6 0%, #ede0c2 100%)',
            border: '1px solid rgba(92, 62, 32, 0.34)',
            boxShadow:
              '0 10px 26px rgba(15, 10, 5, 0.28), inset 0 0 0 3px rgba(139, 30, 36, 0.08)',
            transform: `translateY(${cardPullY}px)`,
            transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            cursor: 'pointer',
          }}
        >
          {/* Red Ink Stamp Overlay when Email Copied */}
          {emailCopied && (
            <div
              className="vs-stamp-copied"
              style={{
                position: 'absolute',
                top: '48%',
                left: '50%',
                zIndex: 10,
                padding: '5px 14px',
                border: '2.5px solid #8b1e24',
                borderRadius: '4px',
                color: '#8b1e24',
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.26em',
                backgroundColor: 'rgba(251, 245, 230, 0.86)',
                boxShadow: 'inset 0 0 0 1px rgba(139,30,36,0.38)',
                pointerEvents: 'none',
              }}
            >
              COPIED ✦
            </div>
          )}

          <div
            style={{
              textAlign: 'center',
              borderBottom: '1px solid rgba(92, 62, 32, 0.22)',
              paddingBottom: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: inkColor,
              }}
            >
              SAMRAT SANDILYA
            </div>
            <div
              style={{
                fontSize: '11px',
                fontStyle: 'italic',
                color: mutedInk,
                marginTop: '2px',
              }}
            >
              Designer &amp; Architect · संRACHNA
            </div>
          </div>

          {/* Email Tap-to-Stamp Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              onClick={handleCopyEmail}
              style={{
                flex: 1,
                textAlign: 'left',
                border: '1px dashed rgba(92, 62, 32, 0.35)',
                background: 'rgba(139, 30, 36, 0.05)',
                borderRadius: '4px',
                padding: '7px 9px',
                color: inkColor,
                fontSize: isMobile ? '11.5px' : '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title="Tap to copy email"
            >
              {CREATOR_EMAIL}
            </button>
            <a
              href={`mailto:${CREATOR_EMAIL}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '7px 9px',
                borderRadius: '4px',
                border: '1px solid rgba(92, 62, 32, 0.35)',
                color: '#8b1e24',
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              MAIL ↗
            </a>
          </div>

          {/* Instagram & LinkedIn */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <a
              href={CREATOR_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 9px',
                borderRadius: '4px',
                background: 'rgba(92, 62, 32, 0.06)',
                color: inkColor,
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ fontFamily: '"Cinzel", serif', fontSize: '9.5px', letterSpacing: '0.14em', color: mutedInk }}>
                INSTAGRAM
              </span>
              <span>{CREATOR_INSTAGRAM_HANDLE} ↗</span>
            </a>

            <a
              href={CREATOR_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 9px',
                borderRadius: '4px',
                background: 'rgba(92, 62, 32, 0.06)',
                color: inkColor,
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ fontFamily: '"Cinzel", serif', fontSize: '9.5px', letterSpacing: '0.14em', color: mutedInk }}>
                LINKEDIN
              </span>
              <span>{CREATOR_LINKEDIN_HANDLE} ↗</span>
            </a>
          </div>
        </div>

        {/* Stitched Parchment Pocket Lip at Bottom */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            zIndex: 3,
            marginTop: '-16px',
            height: '28px',
            borderRadius: '0 0 8px 8px',
            background: isMoon
              ? 'linear-gradient(180deg, #8b9bb3 0%, #7a8aa3 100%)'
              : 'linear-gradient(180deg, #d7be8f 0%, #c7aa76 100%)',
            borderTop: '1px dashed rgba(82, 54, 24, 0.45)',
            boxShadow: '0 -3px 10px rgba(0,0,0,0.16)',
          }}
        />
      </div>

      {/* Turn Back Button */}
      <button
        type="button"
        onClick={() => handleFlipPage(0)}
        style={{
          marginTop: '14px',
          padding: '5px 12px',
          borderRadius: '999px',
          border: '1px solid rgba(92, 62, 32, 0.3)',
          background: 'transparent',
          color: mutedInk,
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize: '9px',
          letterSpacing: '0.2em',
          cursor: 'pointer',
        }}
      >
        ← BACK TO SIGNATURE
      </button>
    </div>
  );

  /* Reusable Live Wet-Ink Calligraphy Page */
  const renderSignaturePage = () => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '22px 18px 18px' : '28px 26px 22px',
        textAlign: 'center',
      }}
    >
      {/* Top Archival Ornament */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontFamily: '"Cinzel", Georgia, serif',
          fontSize: '9px',
          letterSpacing: '0.28em',
          color: mutedInk,
        }}
      >
        <span style={{ flex: 1, height: '1px', background: 'rgba(92,62,32,0.22)' }} />
        <span>FOLIO I · संRACHNA</span>
        <span style={{ flex: 1, height: '1px', background: 'rgba(92,62,32,0.22)' }} />
      </div>

      {/* Live Wet-Ink Calligraphy Reveal */}
      <div key={inkReplayKey} style={{ margin: 'auto 0', padding: '6px 0' }}>
        <div
          className="vs-ink-sub"
          style={{
            fontSize: isMobile ? '13.5px' : '15px',
            fontStyle: 'italic',
            letterSpacing: '0.14em',
            color: mutedInk,
            marginBottom: '10px',
          }}
        >
          Designed &amp; Curated by
        </div>

        <div style={{ lineHeight: 1.02 }}>
          <span
            className="vs-ink-name"
            data-text="Samrat Sandilya"
            style={{
              fontSize: isMobile ? 'clamp(38px, 11vw, 50px)' : 'clamp(46px, 4.8vw, 60px)',
              color: inkColor,
              textShadow: isMoon
                ? '0 1px 12px rgba(190,225,255,0.2)'
                : '0 1px 2px rgba(45, 25, 10, 0.14)',
            }}
          >
            Samrat Sandilya
          </span>
        </div>

        <div
          style={{
            width: '110px',
            height: '1px',
            margin: '14px auto 10px',
            background:
              'linear-gradient(90deg, transparent, rgba(139,30,36,0.55), transparent)',
          }}
        />

        <div
          style={{
            fontFamily: '"Cinzel", Georgia, serif',
            fontSize: '9px',
            letterSpacing: '0.26em',
            color: mutedInk,
          }}
        >
          BUILT FROM SCRATCH · EDITION I
        </div>
      </div>

      {/* Bottom Row: Wax Seal + Tappable Fountain Pen + Turn Page Corner */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Crimson Wax Seal */}
        <div
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sealStamped && (
            <div
              className="vs-wax-seal"
              title="Creator's Seal"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 35% 30%, #b52b34 0%, #7d151c 65%, #4a090e 100%)',
                boxShadow:
                  '0 4px 10px rgba(30, 8, 8, 0.45), inset 0 2px 4px rgba(255, 190, 190, 0.35), inset 0 -2px 5px rgba(30, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(185, 65, 65, 0.5)',
                color: '#f3d4c4',
                fontFamily: '"Cinzel", serif',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              S
            </div>
          )}
        </div>

        {/* Tappable Fountain Pen (Replays Live Ink) */}
        <button
          type="button"
          onClick={handleReplayInk}
          title="Tap pen to rewrite ink"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            color: mutedInk,
            fontSize: '10px',
            fontStyle: 'italic',
          }}
        >
          <svg width="26" height="14" viewBox="0 0 40 16" fill="none">
            <path
              d="M2 8L12 4H35C37 4 38 6 38 8C38 10 37 12 35 12H12L2 8Z"
              fill="#2a1b12"
              stroke="#c9a24b"
              strokeWidth="1"
            />
            <path d="M2 8L11 5.5V10.5L2 8Z" fill="#d9b45a" />
            <circle cx="8" cy="8" r="1" fill="#2a1b12" />
          </svg>
          <span>rewrite</span>
        </button>

        {/* Page Flip Trigger */}
        <button
          type="button"
          onClick={() => handleFlipPage(1)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(139, 30, 36, 0.35)',
            background: 'rgba(139, 30, 36, 0.08)',
            color: '#7c1a20',
            fontFamily: '"Cinzel", Georgia, serif',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            cursor: 'pointer',
          }}
        >
          CONTACT ↻
        </button>
      </div>
    </div>
  );

  const modalContent = (
    <div
      className="vs-root"
      role="dialog"
      aria-modal="true"
      aria-label="Designed and Curated by Samrat Sandilya"
      onPointerMove={handleRootPointerMove}
    >
      {/* PHASE 1: POWER-CUT FLICKER */}
      {phase === 'FLICKER' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            animation: 'vsPowerFlicker 0.42s linear forwards',
          }}
        />
      )}

      {/* PHASE 2: HYBRID CINEMA INTRO (AUTO-PLAYS /creator-intro.mp4 IF PRESENT, ELSE LIVE CANVAS INTRO) */}
      {phase === 'INTRO' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: '#05070d',
          }}
        >
          {videoAvailable ? (
            <video
              ref={videoRef}
              src="/creator-intro.mp4"
              autoPlay
              playsInline
              muted={audioMuted}
              onEnded={enterDeskScene}
              onError={() => setVideoAvailable(false)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <canvas
              ref={introCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          )}

          {/* Subtle Skip Intro Button */}
          <button
            type="button"
            onClick={enterDeskScene}
            style={{
              position: 'fixed',
              bottom: '22px',
              right: '22px',
              zIndex: 75,
              padding: '7px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 224, 170, 0.35)',
              background: 'rgba(10, 12, 18, 0.6)',
              backdropFilter: 'blur(10px)',
              color: '#f2e4c4',
              fontFamily: '"Cinzel", Georgia, serif',
              fontSize: '9px',
              letterSpacing: '0.24em',
              cursor: 'pointer',
            }}
          >
            SKIP INTRO →
          </button>
        </div>
      )}

      {/* PHASE 3: LIVE INTERACTIVE VINTAGE DESK & BOOK */}
      {phase === 'DESK' && (
        <>
          {/* Live Atmosphere Canvas (Broken Window, City, Rain, Sunbeams, Wood Desk) */}
          <canvas
            ref={bgCanvasRef}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          {/* Swaying Vintage Curtain Edge on Left */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: isMobile ? '52px' : '125px',
              height: '52%',
              zIndex: 4,
              pointerEvents: 'none',
              background: isMorning
                ? 'linear-gradient(90deg, rgba(240,218,180,0.28) 0%, rgba(240,218,180,0.06) 65%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(160,180,205,0.14) 0%, rgba(120,135,160,0.04) 65%, transparent 100%)',
              transformOrigin: 'top left',
              animation: isMorning
                ? 'none'
                : 'vsCurtainSway 4.8s ease-in-out infinite',
            }}
          />

          {/* Cinematic Vignette */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 5,
              pointerEvents: 'none',
              background: isMorning
                ? 'radial-gradient(ellipse at center, transparent 48%, rgba(26,16,8,0.48) 100%)'
                : 'radial-gradient(ellipse at center, transparent 36%, rgba(4,4,6,0.78) 100%)',
              transition: 'background 0.7s ease',
            }}
          />

          {/* TOP MINIMAL HUD (ATMOSPHERE + MUTE + CLOSE) */}
          <header className="vs-hud-top">
            <div
              style={{
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'rgba(14, 11, 8, 0.62)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                backdropFilter: 'blur(12px)',
                color: '#ecdcb8',
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: isMobile ? '8px' : '9px',
                letterSpacing: '0.2em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isMorning
                    ? '#f5c26b'
                    : isMoon
                    ? '#93c5fd'
                    : '#eab308',
                }}
              />
              <span>{WORLD_LABELS[worldMode]}</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <button
                type="button"
                onClick={toggleAudio}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: audioMuted ? 'rgba(236,220,184,0.45)' : '#ecdcb8',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  letterSpacing: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {audioMuted ? 'MUTE' : 'SFX'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                pointerEvents: 'auto',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(212, 175, 55, 0.32)',
                background: 'rgba(14, 11, 8, 0.66)',
                backdropFilter: 'blur(12px)',
                color: '#f2e4c4',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </header>

          {/* HANGING BRASS PULL-CHAIN (LIVE 3-STAGE WORLD THEME LEVER) */}
          <div
            className="vs-chain-anchor"
            onPointerDown={handleChainDown}
            onPointerMove={handleChainMove}
            onPointerUp={handleChainUp}
            onPointerCancel={handleChainUp}
            title="Pull chain down to change room lighting & weather"
            style={{
              transformOrigin: 'top center',
              transform: `rotate(${chainSwayDeg}deg)`,
              transition: chainDragRef.current.active
                ? 'none'
                : 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translateY(${chainPullY}px)`,
                transition: chainDragRef.current.active
                  ? 'none'
                  : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Brass Beaded Cord */}
              <div
                style={{
                  width: '4px',
                  height: isMobile ? '78px' : '112px',
                  marginTop: '-24px',
                  backgroundImage:
                    'radial-gradient(circle, #e7c572 42%, #7d5b1f 75%, transparent 78%)',
                  backgroundSize: '4px 7px',
                  backgroundRepeat: 'repeat-y',
                  filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.65))',
                }}
              />
              {/* Weighted Brass Acorn Pull */}
              <div
                style={{
                  width: '20px',
                  height: '32px',
                  borderRadius: '10px 10px 12px 12px',
                  background:
                    'linear-gradient(110deg, #6e4e18 0%, #e8c775 38%, #f8e5ac 52%, #8c6520 82%, #4a330e 100%)',
                  border: '1px solid rgba(255, 232, 168, 0.45)',
                  boxShadow:
                    '0 8px 16px rgba(0, 0, 0, 0.6), inset 0 2px 3px rgba(255, 250, 225, 0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '2px',
                    background: 'rgba(64, 42, 10, 0.55)',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <span
                style={{
                  marginTop: '6px',
                  fontFamily: '"Cinzel", Georgia, serif',
                  fontSize: '7.5px',
                  letterSpacing: '0.2em',
                  color: 'rgba(242, 224, 182, 0.72)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                }}
              >
                PULL
              </span>
            </div>
          </div>

          {/* CENTERPIECE: 3D LEATHER-BOUND VINTAGE BOOK */}
          <div className="vs-book-stage">
            <div ref={bookRef} className="vs-book-wrap">
              {/* Soft Contact Shadow on Wooden Desk */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '14px -10px -20px -10px',
                  borderRadius: '18px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  filter: 'blur(24px)',
                  transform: 'translateZ(-20px)',
                }}
              />

              {/* Hardcover Leather Backboard */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  background:
                    'linear-gradient(145deg, #4b141a 0%, #2b090d 55%, #1a0508 100%)',
                  border: '1.5px solid rgba(212, 175, 55, 0.36)',
                  boxShadow:
                    '0 22px 55px rgba(0,0,0,0.68), inset 0 0 24px rgba(0,0,0,0.55)',
                  padding: isMobile ? '10px 10px 10px 14px' : '12px',
                  display: 'flex',
                }}
              >
                {/* DESKTOP: TWO-PAGE SPREAD | MOBILE: SINGLE SPACIOUS FOLIO */}
                {!isMobile ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 0 18px rgba(40, 22, 8, 0.38)',
                    }}
                  >
                    {/* LEFT PAGE (Archival Bookplate) */}
                    <div
                      style={{
                        position: 'relative',
                        background: parchmentBg,
                        borderRight: '1px solid rgba(60, 38, 16, 0.28)',
                        boxShadow: 'inset -18px 0 26px rgba(40, 22, 8, 0.22)',
                        padding: '28px 26px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'center',
                        transition: 'background 0.65s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          border: '1px solid rgba(110, 74, 36, 0.26)',
                          padding: '20px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: '"Cinzel", Georgia, serif',
                            fontSize: '9px',
                            letterSpacing: '0.28em',
                            color: mutedInk,
                          }}
                        >
                          EX LIBRIS · GEC GODDA
                        </div>

                        <div>
                          <div
                            style={{
                              fontFamily: '"Cinzel", Georgia, serif',
                              fontSize: '30px',
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                              color: isMoon ? '#142033' : '#6f181f',
                            }}
                          >
                            संRACHNA
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontStyle: 'italic',
                              color: mutedInk,
                              marginTop: '6px',
                            }}
                          >
                            सृजन से निर्माण तक
                          </div>
                          <div
                            style={{
                              width: '54px',
                              height: '1px',
                              margin: '16px auto',
                              background: 'rgba(139,30,36,0.45)',
                            }}
                          />
                          <div
                            style={{
                              fontFamily: '"Cinzel", serif',
                              fontSize: '9.5px',
                              letterSpacing: '0.24em',
                              color: mutedInk,
                            }}
                          >
                            EDITION I · MMXXVI
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '11.5px',
                            fontStyle: 'italic',
                            color: mutedInk,
                          }}
                        >
                          {weightOnBook
                            ? 'Pages pinned by brass weight'
                            : 'Wind drifting through the broken window…'}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PAGE (Flippable between Signature & Calling Card + Wind Flutter) */}
                    <div
                      key={`gust-${windGustTick}`}
                      style={{
                        position: 'relative',
                        background: parchmentBg,
                        boxShadow:
                          'inset 18px 0 26px rgba(40, 22, 8, 0.22), 4px 0 0 #d5c199, 7px 0 0 #c1aa7e',
                        transformOrigin: 'left center',
                        animation:
                          windGustTick > 0 && !weightOnBook && bookOpened
                            ? 'vsPageFlutter 1.45s ease-in-out'
                            : 'none',
                        transition: 'background 0.65s ease',
                      }}
                    >
                      {activePage === 0
                        ? renderSignaturePage()
                        : renderCallingCard()}
                    </div>

                    {/* Center Spine Gutter */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        width: '18px',
                        transform: 'translateX(-50%)',
                        background:
                          'linear-gradient(90deg, transparent, rgba(25, 14, 5, 0.36) 50%, transparent)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                ) : (
                  /* MOBILE SINGLE SPACIOUS FOLIO */
                  <div
                    key={`mgust-${windGustTick}`}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '3px 6px 6px 3px',
                      background: parchmentBg,
                      boxShadow:
                        'inset 16px 0 22px rgba(40, 22, 8, 0.24), 3px 0 0 #d6c298, 6px 0 0 #bfa77b',
                      transformOrigin: 'left center',
                      animation:
                        windGustTick > 0 && !weightOnBook && bookOpened
                          ? 'vsPageFlutter 1.45s ease-in-out'
                          : 'none',
                      transition: 'background 0.65s ease',
                    }}
                  >
                    {activePage === 0
                      ? renderSignaturePage()
                      : renderCallingCard()}
                  </div>
                )}

                {/* 3D OPENING FRONT LEATHER COVER (Swings open cleanly on entry) */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '10px',
                    background:
                      'linear-gradient(145deg, #5e1820 0%, #360b10 55%, #1d0508 100%)',
                    border: '2px solid rgba(212, 175, 55, 0.48)',
                    boxShadow: 'inset 0 0 36px rgba(0,0,0,0.55)',
                    transformOrigin: 'left center',
                    transform: bookOpened
                      ? 'rotateY(-165deg)'
                      : 'rotateY(0deg)',
                    opacity: bookOpened ? 0 : 1,
                    pointerEvents: bookOpened ? 'none' : 'auto',
                    transition:
                      'transform 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease 0.55s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e5c16c',
                  }}
                >
                  <div
                    style={{
                      border: '1px solid rgba(229, 193, 108, 0.45)',
                      padding: '28px 34px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"Cinzel", Georgia, serif',
                        fontSize: 'clamp(22px, 4vw, 34px)',
                        letterSpacing: '0.18em',
                      }}
                    >
                      संRACHNA
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        letterSpacing: '0.28em',
                        marginTop: '8px',
                        opacity: 0.75,
                        fontFamily: '"Cinzel", serif',
                      }}
                    >
                      EDITION I · 2026
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DRAGGABLE HEAVY BRASS PAPERWEIGHT (PIN DOWN WIND-FLUTTERING PAGES) */}
          {weightPos.initialized && (
            <div
              onPointerDown={handleWeightDown}
              onPointerMove={handleWeightMove}
              onPointerUp={handleWeightUp}
              onPointerCancel={handleWeightUp}
              title={
                weightOnBook
                  ? 'Drag off book to release pages'
                  : 'Drag onto book (or tap) to pin fluttering pages'
              }
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 38,
                width: isMobile ? '52px' : '60px',
                height: isMobile ? '52px' : '60px',
                transform: `translate3d(${weightPos.x}px, ${weightPos.y}px, 0)`,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 34% 30%, #f7e4aa 0%, #c89d42 42%, #6d4d17 82%, #3a2608 100%)',
                border: '1.5px solid rgba(255, 232, 165, 0.48)',
                boxShadow: weightOnBook
                  ? '0 6px 14px rgba(0,0,0,0.58), inset 0 2px 4px rgba(255,255,255,0.4)'
                  : '0 14px 24px rgba(0,0,0,0.68), inset 0 2px 4px rgba(255,255,255,0.45)',
                cursor: 'grab',
                touchAction: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2c1c06',
                fontFamily: '"Cinzel", Georgia, serif',
              }}
            >
              <div
                style={{
                  width: '74%',
                  height: '74%',
                  borderRadius: '50%',
                  border: '1px solid rgba(56, 36, 8, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>
                  ✦
                </span>
                <span style={{ fontSize: '6.5px', letterSpacing: '0.14em', marginTop: '2px' }}>
                  {weightOnBook ? 'PINNED' : 'WEIGHT'}
                </span>
              </div>
            </div>
          )}

          {/* INTERACTIVE FALLEN MAGAZINE-PAGE PAPER PLANE (TAP OR FLICK TO SLIDE) */}
          {planeState.initialized && (
            <div
              onPointerDown={handlePlaneDown}
              onPointerMove={handlePlaneMove}
              onPointerUp={handlePlaneUp}
              onPointerCancel={handlePlaneUp}
              title="Flick or tap paper plane"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 34,
                width: isMobile ? '66px' : '78px',
                height: isMobile ? '46px' : '54px',
                transform: `translate3d(${planeState.x}px, ${planeState.y}px, 0) rotate(${planeState.rot.toFixed(1)}deg)`,
                cursor: 'grab',
                touchAction: 'none',
                filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.58))',
              }}
            >
              <svg viewBox="0 0 90 54" width="100%" height="100%" fill="none">
                <polygon
                  points="86,16 6,6 24,25"
                  fill={isMoon ? '#c9d4e3' : '#f1e5ca'}
                />
                <polygon
                  points="86,16 24,25 14,46"
                  fill={isMoon ? '#a5b4c9' : '#d8c59e'}
                />
                <polygon
                  points="86,16 24,25 32,33"
                  fill={isMoon ? '#8293ad' : '#b7a076'}
                />
                {/* Faint magazine print lines on wing */}
                <line
                  x1="28"
                  y1="14"
                  x2="58"
                  y2="16"
                  stroke="rgba(70,48,28,0.28)"
                  strokeWidth="1.2"
                />
                <line
                  x1="26"
                  y1="18"
                  x2="50"
                  y2="19.5"
                  stroke="rgba(70,48,28,0.22)"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}

          {/* SUBTLE BOTTOM INTERACTION WHISPER */}
          <div
            className="vs-hint-bar"
            style={{
              background: 'rgba(10, 8, 6, 0.5)',
              color: 'rgba(242, 224, 184, 0.72)',
              border: '1px solid rgba(212, 175, 55, 0.16)',
              backdropFilter: 'blur(8px)',
            }}
          >
            PULL CHAIN FOR LIGHTING · DRAG WEIGHT ON BOOK · FLICK PAPER PLANE
          </div>
        </>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreatorPassModal;
