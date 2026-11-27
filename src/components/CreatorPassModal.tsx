import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';

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
    textMuted: 'rgba(244, 242, 236, 0.54)',
    glassBg: 'rgba(14, 15, 20, 0.66)',
    glassBorder: 'rgba(255, 255, 255, 0.14)',
    pillActiveBg: 'rgba(244, 242, 236, 0.15)',
    pillActiveText: '#FFFFFF',
    vignette:
      'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.74) 100%)',
    isLight: false,
  },
  BLUEPRINT: {
    bgHex: '#040B16',
    bgRgb: { r: 4, g: 11, b: 22 },
    particleRgb: { r: 214, g: 240, b: 255 },
    accentRgb: { r: 56, g: 189, b: 248 },
    gridRgb: { r: 56, g: 189, b: 248 },
    textPrimary: '#E0F2FE',
    textMuted: 'rgba(125, 211, 252, 0.65)',
    glassBg: 'rgba(6, 20, 40, 0.7)',
    glassBorder: 'rgba(56, 189, 248, 0.3)',
    pillActiveBg: 'rgba(56, 189, 248, 0.22)',
    pillActiveText: '#F0F9FF',
    vignette:
      'radial-gradient(ellipse at center, transparent 38%, rgba(2,6,14,0.84) 100%)',
    isLight: false,
  },
  INK: {
    bgHex: '#F4F1EA',
    bgRgb: { r: 244, g: 241, b: 234 },
    particleRgb: { r: 12, g: 12, b: 15 },
    accentRgb: { r: 72, g: 68, b: 62 },
    gridRgb: { r: 14, g: 14, b: 18 },
    textPrimary: '#0A0A0C',
    textMuted: 'rgba(10, 10, 12, 0.56)',
    glassBg: 'rgba(250, 248, 242, 0.78)',
    glassBorder: 'rgba(10, 10, 12, 0.14)',
    pillActiveBg: 'rgba(10, 10, 12, 0.11)',
    pillActiveText: '#0A0A0C',
    vignette:
      'radial-gradient(ellipse at center, transparent 48%, rgba(20,18,14,0.12) 100%)',
    isLight: true,
  },
};

/* ============================================================================
   SELF-CONTAINED SCOPED CSS (ZERO TAILWIND DEPENDENCY)
   ============================================================================ */

const MONOLITH_SCOPED_CSS = `
.cm-root, .cm-root * {
  box-sizing: border-box;
}
.cm-root {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  z-index: 2147483000 !important;
  overflow: hidden !important;
  user-select: none;
  -webkit-user-select: none;
  margin: 0;
  padding: 0;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
.cm-root button, .cm-root a {
  font-family: inherit;
  text-decoration: none;
  background: transparent;
  outline: none;
}
.cm-scroll {
  position: fixed;
  inset: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.cm-scroll::-webkit-scrollbar {
  display: none;
}
.cm-pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  animation: cmPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes cmPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.cm-desktop-only {
  display: flex;
}
.cm-mobile-only {
  display: none;
}
.cm-sm-show {
  display: inline-flex;
}
.cm-proof-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.cm-dock-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 9999px;
}
.cm-dock-divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  margin: 0 4px;
}
.cm-header {
  position: fixed;
  top: 22px;
  left: 28px;
  right: 28px;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}
.cm-controls-left {
  position: fixed;
  left: 28px;
  bottom: 94px;
  z-index: 40;
  flex-direction: column;
  gap: 8px;
}
.cm-controls-right {
  position: fixed;
  right: 28px;
  bottom: 94px;
  z-index: 40;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 9999px;
}
.cm-dock-wrap {
  position: fixed;
  bottom: 22px;
  left: 50%;
  z-index: 40;
  max-width: 95vw;
}
@media (max-width: 767px) {
  .cm-desktop-only {
    display: none !important;
  }
  .cm-mobile-only {
    display: flex !important;
  }
  .cm-sm-show {
    display: none !important;
  }
  .cm-proof-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .cm-header {
    top: 14px;
    left: 14px;
    right: 14px;
  }
  .cm-dock-wrap {
    bottom: 14px;
  }
  .cm-dock-inner {
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 18px;
  }
  .cm-dock-divider {
    display: none;
  }
}
`;

let stylesAndFontsInjected = false;
function ensureMonolithAssets() {
  if (stylesAndFontsInjected || typeof document === 'undefined') return;
  stylesAndFontsInjected = true;

  if (!document.getElementById('monolith-editorial-fonts')) {
    const link = document.createElement('link');
    link.id = 'monolith-editorial-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }

  if (!document.getElementById('monolith-scoped-css')) {
    const style = document.createElement('style');
    style.id = 'monolith-scoped-css';
    style.textContent = MONOLITH_SCOPED_CSS;
    document.head.appendChild(style);
  }
}

/* ============================================================================
   SECRET HOLD-TO-CHARGE TRIGGER HOOK (COMPATIBLE WITH App.tsx)
   ============================================================================ */

export type CreatorPassTriggerResult = ((
  arg?: HTMLElement | React.SyntheticEvent | Event | null
) => void) & {
  chargeRatio: number;
  isCharging: boolean;
  onPointerDown: (e?: React.PointerEvent | PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onMouseDown: (e?: React.MouseEvent | MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e?: React.TouchEvent | TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  onContextMenu: (e: React.MouseEvent | Event) => void;
};

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
  const attachedElRef = useRef<HTMLElement | null>(null);

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

  const startChargeRef = useRef(startCharge);
  startChargeRef.current = startCharge;

  const stableDownHandler = useCallback(() => {
    startChargeRef.current();
  }, []);

  const stableCtxHandler = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const detachFromElement = useCallback(() => {
    const el = attachedElRef.current;
    if (!el) return;
    el.removeEventListener('pointerdown', stableDownHandler);
    el.removeEventListener('mousedown', stableDownHandler);
    el.removeEventListener('touchstart', stableDownHandler);
    el.removeEventListener('contextmenu', stableCtxHandler);
    attachedElRef.current = null;
  }, [stableDownHandler, stableCtxHandler]);

  const attachToElement = useCallback(
    (node: HTMLElement | null) => {
      if (node === attachedElRef.current) return;
      detachFromElement();
      if (!node) return;
      attachedElRef.current = node;
      node.addEventListener('pointerdown', stableDownHandler);
      node.addEventListener('mousedown', stableDownHandler);
      node.addEventListener('touchstart', stableDownHandler);
      node.addEventListener('contextmenu', stableCtxHandler);
    },
    [detachFromElement, stableDownHandler, stableCtxHandler]
  );

  useEffect(() => {
    return () => {
      cancelChargeRef.current();
      detachFromElement();
    };
  }, [detachFromElement]);

  // Keyboard secret ("samrat" or Ctrl+Shift+S)
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

  return useMemo(() => {
    const fn = ((arg?: HTMLElement | React.SyntheticEvent | Event | null) => {
      if (arg === null) {
        attachToElement(null);
        return;
      }
      if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement) {
        attachToElement(arg);
        return;
      }
      if (arg && typeof arg === 'object' && 'type' in arg) {
        const evtType = String(arg.type);
        if (
          evtType === 'pointerdown' ||
          evtType === 'mousedown' ||
          evtType === 'touchstart'
        ) {
          startCharge();
        }
      }
    }) as CreatorPassTriggerResult;

    Object.assign(fn, {
      onPointerDown: () => startCharge(),
      onPointerUp: () => cancelCharge(),
      onPointerLeave: () => cancelCharge(),
      onPointerCancel: () => cancelCharge(),
      onMouseDown: () => startCharge(),
      onMouseUp: () => cancelCharge(),
      onMouseLeave: () => cancelCharge(),
      onTouchStart: () => startCharge(),
      onTouchEnd: () => cancelCharge(),
      onTouchCancel: () => cancelCharge(),
      onContextMenu: (e: React.MouseEvent | Event) => {
        e.preventDefault();
      },
    });

    Object.defineProperties(fn, {
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

    return fn;
  }, [attachToElement, startCharge, cancelCharge, chargeRatio, isCharging]);
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
      gain.gain.linearRampToValueAtTime(
        0.045 / (idx * 0.4 + 1),
        start + 0.015
      );
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
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    ...style,
    transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0) scale(${pressed ? 0.96 : 1})`,
    transition:
      'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
  };

  const innerContent = (
    <>
      <span
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          opacity: sheen.active ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(120px circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.22), transparent 68%)`,
        }}
      />
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {children}
      </span>
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
   LIQUID SLIDING TOGGLE RAIL (SPRING CAPSULE)
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
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px',
        borderRadius: '9999px',
        border: `1px solid ${theme.glassBorder}`,
        backgroundColor: theme.glassBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'background-color 0.45s ease, border-color 0.45s ease',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: '4px',
          bottom: '4px',
          left: 0,
          borderRadius: '9999px',
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
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '4px 10px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '9px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
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
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '1.3em',
        lineHeight: '1.3em',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          transform: hovered ? 'translateY(-105%)' : 'translateY(0%)',
          opacity: hovered ? 0 : 1,
          filter: hovered ? 'blur(4px)' : 'blur(0px)',
          transition: `transform 0.34s ${ease}, opacity 0.3s ease, filter 0.32s ease`,
        }}
      >
        {primary}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
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
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
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
   SELF-DRAWING FOUNTAIN-PEN SVG SIGNATURE
   ============================================================================ */

const CreatorSignatureSVG: React.FC<{
  color: string;
  accent: string;
  active: boolean;
}> = ({ color, accent, active }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 360 96"
        style={{
          width: '240px',
          maxWidth: '72vw',
          height: 'auto',
          overflow: 'visible',
        }}
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
   MAIN COMPONENT: THE ARCHITECT'S MONOLITH (PORTAL-MOUNTED, ZERO TAILWIND)
   ============================================================================ */

export const CreatorPassModal: React.FC<CreatorPassModalProps> = ({
  isOpen = true,
  onClose,
  isDarkMode = true,
}) => {
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

  const [introActive, setIntroActive] = useState(true);
  const [shutterOpened, setShutterOpened] = useState(false);
  const [introPercent, setIntroPercent] = useState(0);

  const [scrollStage, setScrollStage] = useState(0);

  const [telemetry, setTelemetry] = useState({
    fps: 60,
    domNodes: 0,
    viewport: '0 × 0',
    istTime: '--:--:-- IST',
    cursorX: 0,
    cursorY: 0,
    particles: 0,
  });

  const [emailDisplay, setEmailDisplay] = useState(CREATOR_EMAIL);
  const [emailCopied, setEmailCopied] = useState(false);
  const [instaHovered, setInstaHovered] = useState(false);
  const [linkedinHovered, setLinkedinHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [gyroTilt, setGyroTilt] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const xrayLayerRef = useRef<HTMLDivElement | null>(null);
  const xrayRingRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<MonolithAudioEngine | null>(null);
  const scrambleTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    ensureMonolithAssets();
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(coarse);
      if (coarse) setXrayEnabled(false);
    }
  }, []);

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = audioMuted;
    }
  }, [audioMuted]);

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

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const raw =
      maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 0;
    engineStateRef.current.scrollTarget = raw;
    setScrollStage(raw);
  }, []);

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

  if (!isOpen || typeof document === 'undefined') return null;

  const uiRevealStyle = (delaySec = 0): React.CSSProperties => ({
    opacity: introActive ? 0 : 1,
    transform: introActive ? 'translate3d(0, 14px, 0)' : 'translate3d(0, 0, 0)',
    filter: introActive ? 'blur(8px)' : 'blur(0px)',
    transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delaySec}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delaySec}s, filter 0.65s ease ${delaySec}s`,
  });

  const modalContent = (
    <div
      className="cm-root"
      role="dialog"
      aria-modal="true"
      aria-label="Architected and Built by Samrat Sandilya"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{
        backgroundColor: theme.bgHex,
        color: theme.textPrimary,
        opacity: isImploding ? 0 : mountedVisible ? 1 : 0,
        transform: isImploding ? 'scale(0.985)' : 'scale(1)',
        filter: isImploding ? 'blur(10px)' : 'blur(0px)',
        transition:
          'opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1), filter 0.42s ease, background-color 0.55s cubic-bezier(0.22,1,0.36,1), color 0.45s ease',
        touchAction: 'pan-y',
      }}
    >
      {/* 1. LIVE 10,000-PARTICLE CANVAS + DSLR RACK-FOCUS BLUR */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          filter: `blur(${canvasBlurPx.toFixed(1)}px)`,
          transform: `scale(${(1 + scrollStage * 0.035).toFixed(4)})`,
          transition: 'filter 0.08s linear',
        }}
      />

      {/* Editorial Paper Grain */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          opacity: theme.isLight ? 0.055 : 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Cinematic Vignette */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          background: theme.vignette,
          transition: 'background 0.5s ease',
        }}
      />

      {/* 2. X-RAY ARCHITECTURAL CAD BLUEPRINT CURSOR LENS (60FPS RAF) */}
      {xrayEnabled && !isTouchDevice && (
        <>
          <div
            ref={xrayLayerRef}
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'fixed',
              inset: 0,
              zIndex: 25,
              overflow: 'hidden',
              clipPath: 'circle(0px at -400px -400px)',
              backgroundColor: '#041226',
              backgroundImage:
                'linear-gradient(rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
              backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
            }}
          >
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0.75,
              }}
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
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(-3%) scale(${(1 + scrollStage * 0.08).toFixed(3)})`,
                opacity: Math.max(0.15, 1 - scrollStage * 0.9),
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  lineHeight: 0.88,
                  letterSpacing: '-0.02em',
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

            <div
              style={{
                position: 'absolute',
                top: '19%',
                left: '14.5%',
                fontSize: '10px',
                letterSpacing: '0.26em',
                color: 'rgba(125,211,252,0.9)',
                textTransform: 'uppercase',
              }}
            >
              [01] ARCHITECTED FROM SCRATCH
            </div>
            <div
              style={{
                position: 'absolute',
                top: '19%',
                right: '14.5%',
                fontSize: '10px',
                letterSpacing: '0.26em',
                color: 'rgba(125,211,252,0.9)',
                textTransform: 'uppercase',
              }}
            >
              [02] ZERO TEMPLATES // HAND-CODED
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '24%',
                left: '14.5%',
                fontSize: '10px',
                letterSpacing: '0.26em',
                color: 'rgba(186,230,253,0.9)',
                textTransform: 'uppercase',
              }}
            >
              BUILT BY SAMRAT — DOM:{telemetry.domNodes} // PARTICLES:
              {telemetry.particles}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '24%',
                right: '14.5%',
                fontSize: '10px',
                letterSpacing: '0.26em',
                color: 'rgba(186,230,253,0.9)',
                textTransform: 'uppercase',
              }}
            >
              CAD X-RAY // {telemetry.viewport} // {telemetry.fps} FPS
            </div>
          </div>

          <div
            ref={xrayRingRef}
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 30,
              borderRadius: '9999px',
              width: 0,
              height: 0,
              opacity: 0,
              border: '1px solid rgba(125, 211, 252, 0.58)',
              boxShadow:
                'inset 0 0 26px rgba(56, 189, 248, 0.16), 0 0 24px rgba(56, 189, 248, 0.18)',
              willChange: 'transform, width, height',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-22px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '9px',
                letterSpacing: '0.22em',
                color: 'rgba(125,211,252,0.92)',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(4,18,38,0.82)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(56,189,248,0.32)',
              }}
            >
              X-RAY // {telemetry.cursorX},{telemetry.cursorY}
            </span>
          </div>
        </>
      )}

      {/* 3. PROGRESSIVE EDGE BLUR MASKS (TOP & BOTTOM — ZERO HARD CUTS) */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '112px',
          zIndex: 20,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, black 12%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 12%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '128px',
          zIndex: 20,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          maskImage: 'linear-gradient(to top, black 18%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to top, black 18%, transparent 100%)',
        }}
      />

      {/* 4. SCROLL-DRIVEN RACK-FOCUS STAGE (3D FLY-THROUGH + SIGNATURE) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="cm-scroll"
      >
        <div style={{ position: 'relative', width: '100%', height: '210vh' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              height: '100vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none',
              padding: '96px 16px 148px',
            }}
          >
            {/* Top Editorial Micro-Label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '10px',
                letterSpacing: '0.38em',
                textTransform: 'uppercase',
                color: theme.textMuted,
                opacity: introActive ? 0 : Math.max(0, 1 - scrollStage * 2.2),
                transform: `translate3d(0, ${introActive ? -12 : -scrollStage * 28}px, 0)`,
                filter: `blur(${(introActive ? 8 : scrollStage * 10).toFixed(1)}px)`,
                transition:
                  'opacity 0.55s ease, transform 0.45s ease, filter 0.35s ease',
              }}
            >
              <span
                className="cm-pulse-dot"
                style={{
                  backgroundColor:
                    shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textPrimary,
                }}
              />
              ARCHITECTED &amp; BUILT BY
            </div>

            {/* Rack-Focus Stage 2: Signature + Live System Proof Grid */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                maxWidth: '580px',
                width: '100%',
                margin: '0 auto',
                padding: '0 16px',
                opacity: stage2Opacity,
                filter: `blur(${stage2BlurPx.toFixed(1)}px)`,
                transform: `translate3d(0, ${stage2Y.toFixed(1)}px, 0)`,
                pointerEvents: stage2Opacity > 0.5 ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  color: theme.textMuted,
                }}
              >
                COLOPHON // SANRACHNA ARCHITECTURE
              </div>

              <CreatorSignatureSVG
                color={theme.textPrimary}
                accent={shaderMode === 'BLUEPRINT' ? '#38BDF8' : theme.textMuted}
                active={stage2Opacity > 0.35}
              />

              <div
                className="cm-proof-grid"
                style={{
                  marginTop: '28px',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  border: `1px solid ${theme.glassBorder}`,
                  backgroundColor: theme.glassBg,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  width: '100%',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: theme.textMuted,
                    }}
                  >
                    AUTHOR
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      marginTop: '3px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    SAMRAT S.
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: theme.textMuted,
                    }}
                  >
                    DOM NODES
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      marginTop: '3px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {telemetry.domNodes}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: theme.textMuted,
                    }}
                  >
                    PARTICLES
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      marginTop: '3px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {telemetry.particles.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: theme.textMuted,
                    }}
                  >
                    CLOCK
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      marginTop: '3px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {telemetry.istTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Hint Strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px 14px',
                fontSize: '9px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
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
              <span className="cm-sm-show">·</span>
              <span className="cm-sm-show">[G] GRAVITY</span>
              <span className="cm-sm-show">·</span>
              <span className="cm-sm-show">[SPACE] 0.1× SLOW-MO</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TOP HUD BAR: LIVE TELEMETRY + MAGNETIC CLOSE BUTTON */}
      <header
        className="cm-header"
        style={{
          opacity: introActive ? 0 : 1,
          transform: introActive
            ? 'translate3d(0, -14px, 0)'
            : 'translate3d(0, 0, 0)',
          filter: introActive ? 'blur(8px)' : 'blur(0px)',
          transition:
            'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1), filter 0.6s ease',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px 14px',
            borderRadius: '12px',
            border: `1px solid ${theme.glassBorder}`,
            backgroundColor: theme.glassBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
            transition: 'background-color 0.45s ease, border-color 0.45s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
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
            className="cm-sm-show"
            style={{
              alignItems: 'center',
              gap: '10px',
              fontSize: '9px',
              color: theme.textMuted,
            }}
          >
            <span>{telemetry.viewport}</span>
            <span>·</span>
            <span>DOM {telemetry.domNodes}</span>
            <span>·</span>
            <span>{telemetry.istTime}</span>
          </div>
        </div>

        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              border: '1px solid rgba(251, 191, 36, 0.42)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#FCD34D',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              pointerEvents: 'none',
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
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: `1px solid ${theme.glassBorder}`,
              backgroundColor: theme.glassBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: theme.textPrimary,
              fontSize: '10px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            <span>CLOSE</span>
            <span style={{ fontSize: '12px', lineHeight: 1, opacity: 0.78 }}>
              ✕
            </span>
          </MagneticButton>
        </div>
      </header>

      {/* 6. LIQUID SLIDING PLAYGROUND CONTROLS (DESKTOP) */}
      <aside
        className="cm-desktop-only cm-controls-left"
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

      <aside
        className="cm-desktop-only cm-controls-right"
        style={{
          ...uiRevealStyle(0.1),
          border: `1px solid ${theme.glassBorder}`,
          backgroundColor: theme.glassBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <button
          type="button"
          onClick={toggleGravity}
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
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
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
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
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backgroundColor: !audioMuted ? theme.pillActiveBg : 'transparent',
            color: !audioMuted ? theme.pillActiveText : theme.textMuted,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          title="Toggle Synthesized Audio"
        >
          {audioMuted ? 'MUTED' : 'SOUND'}
        </button>
      </aside>

      {/* COMPACT MOBILE CONTROLS STRIP */}
      <div
        className="cm-mobile-only"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: '104px',
          zIndex: 40,
          alignItems: 'center',
          gap: '4px',
          padding: '4px 6px',
          borderRadius: '9999px',
          border: `1px solid ${theme.glassBorder}`,
          backgroundColor: theme.glassBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          maxWidth: '94vw',
          overflowX: 'auto',
          opacity: introActive ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        {(['OBSIDIAN', 'BLUEPRINT', 'INK'] as ShaderMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => switchShader(mode)}
            style={{
              padding: '4px 8px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '8px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor:
                shaderMode === mode ? theme.pillActiveBg : 'transparent',
              color:
                shaderMode === mode ? theme.pillActiveText : theme.textMuted,
            }}
          >
            {mode}
          </button>
        ))}
        <span style={{ opacity: 0.28, fontSize: '10px' }}>|</span>
        <button
          type="button"
          onClick={toggleGravity}
          style={{
            padding: '4px 8px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '8px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            backgroundColor: gravityOn ? theme.pillActiveBg : 'transparent',
            color: gravityOn ? theme.pillActiveText : theme.textMuted,
          }}
        >
          GRAV
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          style={{
            padding: '4px 8px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '8px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            color: !audioMuted ? theme.pillActiveText : theme.textMuted,
          }}
        >
          {audioMuted ? 'MUTE' : 'SFX'}
        </button>
      </div>

      {/* 7. FLOATING LIQUID-GLASS COMMAND DOCK (GRAVITY COLLISION SURFACE) */}
      <nav
        ref={dockRef}
        aria-label="Creator Direct Contact"
        className="cm-dock-wrap"
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
          className="cm-dock-inner"
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.glassBorder}`,
            backgroundColor: theme.glassBg,
            backdropFilter: 'blur(26px)',
            WebkitBackdropFilter: 'blur(26px)',
            boxShadow: theme.isLight
              ? '0 18px 50px -12px rgba(10,10,12,0.16), inset 0 1px 0 rgba(255,255,255,0.85)'
              : '0 22px 60px -12px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'background-color 0.45s ease, border-color 0.45s ease',
          }}
        >
          {/* Gyroscope & Ambient Specular Glass Shine */}
          <div
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              opacity: 0.42,
              background: `linear-gradient(${105 + gyroTilt.x * 35}deg, transparent 20%, rgba(255,255,255,${theme.isLight ? '0.55' : '0.16'}) 50%, transparent 80%)`,
            }}
          />

          {/* Direct Email Copy Button */}
          <MagneticButton
            onClick={handleCopyEmail}
            onMouseEnter={runEmailScramble}
            strength={0.2}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: theme.textPrimary,
            }}
            title="Click to copy email"
          >
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: emailCopied ? 0 : 1,
                  filter: emailCopied ? 'blur(5px)' : 'blur(0px)',
                  transform: emailCopied ? 'translateY(-6px)' : 'translateY(0)',
                  transition:
                    'opacity 0.28s ease, filter 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor:
                      shaderMode === 'BLUEPRINT'
                        ? '#38BDF8'
                        : theme.textPrimary,
                  }}
                />
                <span>{emailDisplay}</span>
              </span>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
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
            style={{
              padding: '5px 10px',
              borderRadius: '9999px',
              fontSize: '9px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: `1px solid ${theme.glassBorder}`,
              color: theme.textMuted,
            }}
            title="Open Mail App"
          >
            MAIL ↗
          </MagneticButton>

          <span
            aria-hidden="true"
            className="cm-dock-divider"
            style={{ backgroundColor: theme.glassBorder }}
          />

          {/* Instagram Link */}
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
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.textPrimary,
            }}
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

          {/* LinkedIn Link */}
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
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.textPrimary,
            }}
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

      {/* 8. REALITY-TEAR KINETIC SHUTTER + 0.8S ARCHITECTURAL TELEMETRY FLASH */}
      <div
        aria-hidden={!introActive}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: introActive ? 1 : 0,
          visibility: introActive ? 'visible' : 'hidden',
          filter: introActive ? 'blur(0px)' : 'blur(14px)',
          transform: introActive ? 'scale(1)' : 'scale(1.04)',
          transition:
            'opacity 0.48s cubic-bezier(0.22,1,0.36,1), filter 0.48s ease, transform 0.48s cubic-bezier(0.22,1,0.36,1), visibility 0.48s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: theme.bgHex,
            transformOrigin: 'top center',
            transform: shutterOpened ? 'scaleY(0)' : 'scaleY(1)',
            transition: 'transform 0.62s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: theme.bgHex,
            transformOrigin: 'bottom center',
            transform: shutterOpened ? 'scaleY(0)' : 'scaleY(1)',
            transition: 'transform 0.62s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            transform: shutterOpened ? 'scaleX(1)' : 'scaleX(0)',
            opacity: shutterOpened ? 0 : 0.9,
            transition:
              'transform 0.52s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease',
            background:
              'linear-gradient(90deg, transparent, #38BDF8, #FFFFFF, #F43F5E, transparent)',
            boxShadow: '0 0 28px rgba(56,189,248,0.8)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '10px',
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
            }}
          >
            <span>SYSTEM // SANRACHNA</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>CRAFT // HAND-CODED</span>
          </div>
          <div
            style={{
              fontSize: '44px',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
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

  return createPortal(modalContent, document.body);
};

export default CreatorPassModal;
