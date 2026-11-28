import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';

/* ============================================================================
   TYPES & CONSTANTS
   ============================================================================ */

export interface CreatorPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

type WorldMode = 'STORM_LAMP' | 'MOON_LIGHTNING' | 'GOLDEN_MORNING';
type Phase = 'FLICKER' | 'SCENE';

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
   SCOPED CSS & FONTS (TRANSPARENT ROOT DURING POWER-CUT FLICKER)
   ============================================================================ */

const SCOPED_3D_CSS = `
.v3d-root, .v3d-root * {
  box-sizing: border-box;
}
.v3d-root {
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
  touch-action: none;
  font-family: "Cinzel", Georgia, serif;
}

@keyframes v3dRealBulbFlicker {
  0%   { background: rgba(0, 0, 0, 0); }
  10%  { background: rgba(0, 0, 0, 0.86); }
  20%  { background: rgba(255, 226, 165, 0.22); }
  32%  { background: rgba(0, 0, 0, 0.94); }
  45%  { background: rgba(0, 0, 0, 0.08); }
  58%  { background: rgba(0, 0, 0, 0.96); }
  70%  { background: rgba(210, 232, 255, 0.34); }
  84%  { background: rgba(0, 0, 0, 0.99); }
  100% { background: rgba(4, 6, 12, 1); }
}

.v3d-flicker-layer {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;
  animation: v3dRealBulbFlicker 0.62s steps(1, end) forwards;
}

.v3d-hud-top {
  position: fixed;
  top: 16px;
  left: 18px;
  right: 18px;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.v3d-hint {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(8, 7, 6, 0.56);
  border: 1px solid rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(242, 224, 184, 0.8);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
}

@media (max-width: 767px) {
  .v3d-hud-top {
    top: 12px;
    left: 12px;
    right: 12px;
  }
  .v3d-hint {
    font-size: 7.5px;
    letter-spacing: 0.14em;
    max-width: 92vw;
    white-space: normal;
    text-align: center;
    bottom: 10px;
  }
}
`;

let assetsInjected = false;
function ensureAssets() {
  if (assetsInjected || typeof document === 'undefined') return;
  assetsInjected = true;

  if (!document.getElementById('v3d-fonts')) {
    const link = document.createElement('link');
    link.id = 'v3d-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }

  if (!document.getElementById('v3d-css')) {
    const style = document.createElement('style');
    style.id = 'v3d-css';
    style.textContent = SCOPED_3D_CSS;
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
      bind: { value: handlers, enumerable: false, configurable: true },
      chargeRatio: { value: chargeRatio, enumerable: false, configurable: true },
      isCharging: { value: isCharging, enumerable: false, configurable: true },
    });
    return result;
  }, [handlers, chargeRatio, isCharging]);
}

/* ============================================================================
   PROCEDURAL SPATIAL AUDIO ENGINE (RAIN, THUNDER, PAPER, BRASS CHAIN, THUD)
   ============================================================================ */

class StormStudyAudio {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private rainSrc: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  public muted = false;

  private ensure(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.noiseBuf) {
        const len = this.ctx.sampleRate * 2;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + w * 0.029;
          b1 = 0.985 * b1 + w * 0.032;
          b2 = 0.95 * b2 + w * 0.048;
          data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.14) * 1.6));
        }
        this.noiseBuf = buf;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public startRain(level = 0.065, freq = 1050) {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf) return;
    if (this.rainSrc) {
      this.setRain(level, freq);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.65;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.6);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    this.rainSrc = src;
    this.rainFilter = filter;
    this.rainGain = gain;
  }

  public setRain(level: number, freq = 920) {
    if (!this.ctx || !this.rainGain || !this.rainFilter) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : Math.max(0.0001, level);
    this.rainGain.gain.setTargetAtTime(target, now, 0.25);
    this.rainFilter.frequency.setTargetAtTime(freq, now, 0.25);
  }

  public playThunder(power = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380 * power, now);
    filter.frequency.exponentialRampToValueAtTime(48, now + 1.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.26 * power, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 1.9);
  }

  public playChainKatak() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [2600, 1420].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.04;
      osc.type = i === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.28, t + 0.045);
      gain.gain.setValueAtTime(i === 0 ? 0.085 : 0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    });
  }

  public playPaper(soft = false) {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(soft ? 1250 : 1900, now);
    filter.frequency.exponentialRampToValueAtTime(620, now + 0.25);
    filter.Q.value = 1.25;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(soft ? 0.045 : 0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.3);
  }

  public playThud(heavy = true) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 125 : 172, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    gain.gain.setValueAtTime(heavy ? 0.18 : 0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playNibScratch() {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2700;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.14);
    gain.gain.setValueAtTime(0.022, now + 1.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 2.2);
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
      this.rainSrc?.stop();
    } catch {
      // ignore
    }
    this.rainSrc = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

/* ============================================================================
   PROCEDURAL PBR CANVAS TEXTURES (WOOD, BRICK, CITY WINDOWS, MAGAZINE, BOOK)
   ============================================================================ */

function createOakWoodTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#2d1c11';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y * 0.06) * 14 + Math.sin(y * 0.21) * 5;
    const shade = 28 + Math.floor((Math.sin((y + wave) * 0.14) * 0.5 + 0.5) * 26);
    ctx.fillStyle = `rgb(${shade + 18}, ${Math.floor(shade * 0.72) + 8}, ${Math.floor(shade * 0.45) + 4})`;
    ctx.fillRect(0, y, 512, 1);
  }

  // Plank seams & subtle vintage scratches
  ctx.strokeStyle = 'rgba(10, 5, 2, 0.55)';
  ctx.lineWidth = 2;
  for (let p = 1; p < 4; p++) {
    ctx.beginPath();
    ctx.moveTo(0, p * 128);
    ctx.lineTo(512, p * 128);
    ctx.stroke();
  }

  for (let i = 0; i < 450; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,215,170,0.03)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 18 + Math.random() * 70, 1);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2, 2);
  return { map, bump };
}

function createWallPlasterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#241c17';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle weathered vintage plaster mottling & brick hints
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 4 + Math.random() * 24;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(55, 42, 34, 0.08)' : 'rgba(10, 7, 5, 0.12)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aged wood wainscoting lines
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCityFacadeTextures(seed: number): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const cDiff = document.createElement('canvas');
  cDiff.width = 256;
  cDiff.height = 512;
  const ctxD = cDiff.getContext('2d')!;

  const cEm = document.createElement('canvas');
  cEm.width = 256;
  cEm.height = 512;
  const ctxE = cEm.getContext('2d')!;

  ctxD.fillStyle = '#111622';
  ctxD.fillRect(0, 0, 256, 512);
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, 256, 512);

  const cols = 4;
  const rows = 10;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const h = Math.sin(seed * 91.7 + r * 17.3 + col * 31.1) * 43758.5453;
      const frac = h - Math.floor(h);
      const wx = 18 + col * 58;
      const wy = 18 + r * 48;
      ctxD.fillStyle = '#090c14';
      ctxD.fillRect(wx, wy, 36, 30);

      if (frac > 0.62) {
        const warm = frac > 0.72;
        const color = warm ? '#ffbf69' : '#8ecae6';
        ctxD.fillStyle = color;
        ctxD.fillRect(wx + 2, wy + 2, 32, 26);
        ctxE.fillStyle = warm ? '#e8a246' : '#588cb0';
        ctxE.fillRect(wx + 2, wy + 2, 32, 26);
      }
    }
  }

  const map = new THREE.CanvasTexture(cDiff);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(cEm);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

function createMagazinePlaneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#efe2c6';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle paper aging
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = 'rgba(110, 82, 48, 0.05)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  ctx.fillStyle = 'rgba(120, 26, 32, 0.72)';
  ctx.font = '700 38px "Cinzel", Georgia, serif';
  ctx.fillText('संRACHNA', 38, 72);

  ctx.fillStyle = 'rgba(42, 30, 18, 0.55)';
  for (let row = 0; row < 20; row++) {
    const y = 104 + row * 19;
    ctx.fillRect(38, y, 190 + ((row * 37) % 35), 4);
    ctx.fillRect(275, y, 175 + ((row * 29) % 35), 4);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLeatherCoverTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 768;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 512, 768);
  g.addColorStop(0, '#5a161e');
  g.addColorStop(0.5, '#3b0c12');
  g.addColorStop(1, '#220609');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 768);

  // Fine leather pebble grain
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(255,220,180,0.03)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(Math.random() * 512, Math.random() * 768, 2, 2);
  }

  // Gold foil double border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 42, 440, 684);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 54, 416, 660);

  ctx.fillStyle = '#e5c16c';
  ctx.textAlign = 'center';
  ctx.font = '700 54px "Cinzel", Georgia, serif';
  ctx.fillText('संRACHNA', 256, 355);

  ctx.fillStyle = 'rgba(229, 193, 108, 0.78)';
  ctx.font = '600 18px "Cinzel", Georgia, serif';
  ctx.fillText('EDITION I  ·  MMXXVI', 256, 410);

  ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('सृजन से निर्माण तक', 256, 452);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawParchmentBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#f5e8cc');
  g.addColorStop(0.55, '#e7d3aa');
  g.addColorStop(1, '#d8be8e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Subtle paper fibers & deckle aging
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(118, 84, 42, 0.045)' : 'rgba(255, 250, 235, 0.05)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2);
  }

  // Soft aged vignette
  const vig = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    w * 0.28,
    w * 0.5,
    h * 0.5,
    w * 0.76
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(65, 42, 18, 0.24)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function createLeftBookplateTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d')!;
  drawParchmentBase(ctx, 1024, 1024);

  // Spine shadow on right edge
  const spine = ctx.createLinearGradient(860, 0, 1024, 0);
  spine.addColorStop(0, 'rgba(0,0,0,0)');
  spine.addColorStop(1, 'rgba(35, 20, 8, 0.34)');
  ctx.fillStyle = spine;
  ctx.fillRect(860, 0, 164, 1024);

  // Engraved archival border
  ctx.strokeStyle = 'rgba(110, 74, 36, 0.38)';
  ctx.lineWidth = 3;
  ctx.strokeRect(86, 86, 820, 852);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(102, 102, 788, 820);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(72, 46, 22, 0.72)';
  ctx.font = '600 22px "Cinzel", Georgia, serif';
  ctx.fillText('EX LIBRIS  ·  GEC GODDA', 496, 200);

  ctx.fillStyle = '#6f181f';
  ctx.font = '700 84px "Cinzel", Georgia, serif';
  ctx.fillText('संRACHNA', 496, 480);

  ctx.fillStyle = 'rgba(54, 34, 18, 0.78)';
  ctx.font = 'italic 36px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('सृजन से निर्माण तक', 496, 545);

  ctx.strokeStyle = 'rgba(139, 30, 36, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(356, 600);
  ctx.lineTo(636, 600);
  ctx.stroke();

  ctx.fillStyle = 'rgba(72, 46, 22, 0.75)';
  ctx.font = '600 24px "Cinzel", Georgia, serif';
  ctx.fillText('OFFICIAL ANNUAL MAGAZINE', 496, 665);
  ctx.fillText('EDITION I  ·  MMXXVI', 496, 710);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* Dynamic Right Page Painter (Supports Live Wet-Ink Calligraphy & Calling Card + Stamp) */
function renderRightPageCanvas(
  ctx: CanvasRenderingContext2D,
  opts: {
    page: 0 | 1;
    inkProgress: number; // 0..1
    wetness: number; // 1..0
    sealProgress: number; // 0..1
    copied: boolean;
    pinned: boolean;
  }
) {
  const W = 1024;
  const H = 1024;
  drawParchmentBase(ctx, W, H);

  // Spine shadow on left edge
  const spine = ctx.createLinearGradient(0, 0, 160, 0);
  spine.addColorStop(0, 'rgba(35, 20, 8, 0.34)');
  spine.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spine;
  ctx.fillRect(0, 0, 160, H);

  // Subtle decorative border
  ctx.strokeStyle = 'rgba(110, 74, 36, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(108, 76, 836, 872);

  if (opts.page === 0) {
    // ================= PAGE 0: WET INK CALLIGRAPHY =================
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(78, 52, 26, 0.72)';
    ctx.font = '600 21px "Cinzel", Georgia, serif';
    ctx.fillText('FOLIO I  ·  ARCHITECTURAL COLOPHON', 526, 152);

    ctx.strokeStyle = 'rgba(110, 74, 36, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(220, 178);
    ctx.lineTo(832, 178);
    ctx.stroke();

    // Animated clip for "Designed & Curated by" (0.0 -> 0.35)
    const subP = Math.min(1, opts.inkProgress / 0.35);
    if (subP > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(140, 290, 780 * subP, 90);
      ctx.clip();
      ctx.fillStyle = 'rgba(60, 38, 18, 0.82)';
      ctx.font = 'italic 42px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('Designed & Curated by', 526, 352);
      ctx.restore();
    }

    // Animated clip for "Samrat Sandilya" (0.28 -> 1.0)
    const nameP = Math.min(1, Math.max(0, (opts.inkProgress - 0.28) / 0.72));
    if (nameP > 0.01) {
      const revealRight = 135 + 785 * nameP;
      ctx.save();
      ctx.beginPath();
      ctx.rect(135, 390, revealRight - 135, 220);
      ctx.clip();

      // Deep sepia fountain ink
      ctx.fillStyle = '#1b1109';
      ctx.font = '400 116px "Great Vibes", "Cormorant Garamond", cursive, serif';
      ctx.fillText('Samrat Sandilya', 526, 515);

      // Wet ink specular sheen near the writing edge
      if (opts.wetness > 0.02) {
        const sheenX = revealRight - 95;
        const sheen = ctx.createLinearGradient(sheenX - 90, 410, sheenX + 90, 540);
        sheen.addColorStop(0, 'rgba(255, 240, 200, 0)');
        sheen.addColorStop(0.5, `rgba(255, 244, 212, ${(opts.wetness * 0.55).toFixed(3)})`);
        sheen.addColorStop(1, 'rgba(255, 240, 200, 0)');
        ctx.fillStyle = sheen;
        ctx.fillText('Samrat Sandilya', 526, 515);
      }

      // Flourish underline stroke
      ctx.strokeStyle = 'rgba(139, 30, 36, 0.62)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(270, 565);
      ctx.quadraticCurveTo(526, 550, 782, 565);
      ctx.stroke();

      ctx.restore();
    }

    if (opts.inkProgress > 0.85) {
      const subAlpha = Math.min(1, (opts.inkProgress - 0.85) / 0.15);
      ctx.fillStyle = `rgba(74, 48, 24, ${(0.76 * subAlpha).toFixed(3)})`;
      ctx.font = '600 22px "Cinzel", Georgia, serif';
      ctx.fillText('BUILT FROM SCRATCH  ·  संRACHNA', 526, 640);
    }

    // Embossed Crimson Wax Seal (Bottom-Left)
    if (opts.sealProgress > 0.01) {
      const s = opts.sealProgress;
      const scale = s < 0.7 ? 1.5 - (s / 0.7) * 0.56 : 0.94 + ((s - 0.7) / 0.3) * 0.06;
      ctx.save();
      ctx.translate(230, 825);
      ctx.scale(scale, scale);
      ctx.rotate(-0.12);

      // Seal drop shadow
      ctx.fillStyle = 'rgba(25, 8, 5, 0.34)';
      ctx.beginPath();
      ctx.arc(5, 7, 56, 0, Math.PI * 2);
      ctx.fill();

      // Irregular melted wax rim
      const waxGrad = ctx.createRadialGradient(-16, -18, 6, 0, 0, 58);
      waxGrad.addColorStop(0, '#c4323b');
      waxGrad.addColorStop(0.65, '#851820');
      waxGrad.addColorStop(1, '#4d0a0f');
      ctx.fillStyle = waxGrad;
      ctx.beginPath();
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        const rad = 54 + Math.sin(a * 3.1) * 4.5 + Math.cos(a * 5.2) * 2.5;
        const vx = Math.cos(ang) * rad;
        const vy = Math.sin(ang) * rad;
        if (a === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 196, 185, 0.36)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 39, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f5d6c6';
      ctx.font = '700 44px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', 0, 3);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';
    }

    // Bottom status + interactive ink buttons (UV-mapped for clicking!)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(72, 46, 22, 0.65)';
    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      opts.pinned ? 'Page pinned by brass weight' : 'Tap pen to rewrite ink',
      526,
      835
    );

    // Bottom-Right Page Flip Cue (UV zone: x 670..910, y 780..885)
    ctx.fillStyle = 'rgba(139, 30, 36, 0.1)';
    ctx.fillRect(676, 786, 232, 74);
    ctx.strokeStyle = 'rgba(139, 30, 36, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(676, 786, 232, 74);
    ctx.fillStyle = '#7c1a20';
    ctx.font = '700 22px "Cinzel", Georgia, serif';
    ctx.fillText('CONTACT  ↻', 792, 832);
  } else {
    // ================= PAGE 1: VINTAGE CALLING CARD IN POCKET =================
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(78, 52, 26, 0.72)';
    ctx.font = '600 22px "Cinzel", Georgia, serif';
    ctx.fillText('DIRECT CORRESPONDENCE', 526, 152);

    // Cream Calling Card
    const cardX = 186;
    const cardY = 205;
    const cardW = 680;
    const cardH = 540;

    ctx.fillStyle = 'rgba(20, 12, 4, 0.22)';
    ctx.fillRect(cardX + 8, cardY + 12, cardW, cardH);

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, '#fcf6e8');
    cardGrad.addColorStop(1, '#ede0c2');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    ctx.strokeStyle = 'rgba(92, 62, 32, 0.42)';
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = 'rgba(139, 30, 36, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cardX + 14, cardY + 14, cardW - 28, cardH - 28);

    ctx.fillStyle = '#1f150c';
    ctx.font = '700 38px "Cinzel", Georgia, serif';
    ctx.fillText('SAMRAT SANDILYA', 526, 286);

    ctx.fillStyle = 'rgba(64, 42, 22, 0.75)';
    ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('Designer & Architect  ·  संRACHNA', 526, 332);

    ctx.strokeStyle = 'rgba(92, 62, 32, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(235, 365);
    ctx.lineTo(817, 365);
    ctx.stroke();

    // Email Copy Box (x: 224..675, y: 405..485)
    ctx.fillStyle = 'rgba(139, 30, 36, 0.06)';
    ctx.fillRect(224, 405, 456, 80);
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = 'rgba(92, 62, 32, 0.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(224, 405, 456, 80);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1d130a';
    ctx.font = '600 27px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(CREATOR_EMAIL, 246, 455);

    // Mail Button (x: 694..828, y: 405..485)
    ctx.fillStyle = 'rgba(139, 30, 36, 0.1)';
    ctx.fillRect(694, 405, 134, 80);
    ctx.strokeStyle = 'rgba(139, 30, 36, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(694, 405, 134, 80);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7c1a20';
    ctx.font = '700 22px "Cinzel", Georgia, serif';
    ctx.fillText('MAIL ↗', 761, 454);

    // Instagram Row (x: 224..828, y: 515..592)
    ctx.fillStyle = 'rgba(92, 62, 32, 0.08)';
    ctx.fillRect(224, 515, 604, 78);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(72, 46, 22, 0.72)';
    ctx.font = '600 21px "Cinzel", Georgia, serif';
    ctx.fillText('INSTAGRAM', 248, 563);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1d130a';
    ctx.font = '600 29px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${CREATOR_INSTAGRAM_HANDLE}  ↗`, 804, 564);

    // LinkedIn Row (x: 224..828, y: 612..688)
    ctx.fillStyle = 'rgba(92, 62, 32, 0.08)';
    ctx.fillRect(224, 612, 604, 78);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(72, 46, 22, 0.72)';
    ctx.font = '600 21px "Cinzel", Georgia, serif';
    ctx.fillText('LINKEDIN', 248, 660);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1d130a';
    ctx.font = '600 29px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${CREATOR_LINKEDIN_HANDLE}  ↗`, 804, 661);

    // Stitched Paper Pocket Lip overlapping bottom of calling card
    const lipY = 716;
    const lipG = ctx.createLinearGradient(0, lipY, 0, lipY + 62);
    lipG.addColorStop(0, '#d8bf90');
    lipG.addColorStop(1, '#c5a670');
    ctx.fillStyle = lipG;
    ctx.fillRect(172, lipY, 708, 58);
    ctx.save();
    ctx.setLineDash([10, 7]);
    ctx.strokeStyle = 'rgba(82, 54, 24, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(182, lipY + 10);
    ctx.lineTo(870, lipY + 10);
    ctx.stroke();
    ctx.restore();

    // Red Rubber Stamp "COPIED ✦" slapped directly on 3D card
    if (opts.copied) {
      ctx.save();
      ctx.translate(526, 455);
      ctx.rotate(-0.18);
      ctx.fillStyle = 'rgba(252, 246, 232, 0.88)';
      ctx.fillRect(-165, -48, 330, 96);
      ctx.strokeStyle = '#8b1e24';
      ctx.lineWidth = 7;
      ctx.strokeRect(-165, -48, 330, 96);
      ctx.lineWidth = 2;
      ctx.strokeRect(-153, -36, 306, 72);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8b1e24';
      ctx.font = '700 44px "Cinzel", Georgia, serif';
      ctx.fillText('COPIED ✦', 0, 15);
      ctx.restore();
    }

    // Back to Signature Cue (x: 340..712, y: 815..890)
    ctx.strokeStyle = 'rgba(92, 62, 32, 0.42)';
    ctx.lineWidth = 2;
    ctx.strokeRect(336, 816, 380, 68);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60, 38, 18, 0.85)';
    ctx.font = '700 21px "Cinzel", Georgia, serif';
    ctx.fillText('←  BACK TO SIGNATURE', 526, 859);
  }
}

/* 3D Folded Origami Paper Plane Geometry */
function createPaperPlaneGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  // Nose at (0, 0, 0.55), tail at z = -0.45
  const vertices = new Float32Array([
    // Left upper wing
    0, 0, 0.55, -0.42, 0.07, -0.42, -0.04, 0.01, -0.35,
    // Right upper wing
    0, 0, 0.55, 0.04, 0.01, -0.35, 0.42, 0.07, -0.42,
    // Left inner keel fold
    0, 0, 0.55, -0.04, 0.01, -0.35, 0, -0.14, -0.32,
    // Right inner keel fold
    0, 0, 0.55, 0, -0.14, -0.32, 0.04, 0.01, -0.35,
  ]);
  const uvs = new Float32Array([
    0.5, 1, 0, 0, 0.45, 0.1,
    0.5, 1, 0.55, 0.1, 1, 0,
    0.5, 1, 0.45, 0.1, 0.5, 0.15,
    0.5, 1, 0.5, 0.15, 0.55, 0.1,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/* ============================================================================
   MAIN COMPONENT: REAL-TIME THREE.JS 3D CINEMA + INTERACTIVE VINTAGE STUDY
   ============================================================================ */

export const CreatorPassModal: React.FC<CreatorPassModalProps> = ({
  isOpen = true,
  onClose,
  isDarkMode = true,
}) => {
  void isDarkMode;

  const [phase, setPhase] = useState<Phase>('FLICKER');
  const [introDone, setIntroDone] = useState(false);
  const [worldMode, setWorldMode] = useState<WorldMode>('STORM_LAMP');
  const [audioMuted, setAudioMuted] = useState(false);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<StormStudyAudio | null>(null);

  // Shared mutable state read inside the 60fps Three.js loop
  const simRef = useRef({
    skipRequested: false,
    worldMode: 'STORM_LAMP' as WorldMode,
    activePage: 0 as 0 | 1,
    pageFlipping: false,
    pageFlipDir: 1 as 1 | -1,
    pageFlipT: 0,
    inkProgress: 0,
    inkWetness: 1,
    inkWriting: false,
    sealProgress: 0,
    sealActive: false,
    copied: false,
    copiedUntil: 0,
    weightOnBook: false,
    windGust: 0,
    lightningFlash: 0,
    chainPull: 0,
    chainVel: 0,
    chainSway: 0,
    chainSwayVel: 0,
    planeDeskVx: 0,
    planeDeskVz: 0,
    planeDeskVrot: 0,
    pointerNdcX: 0,
    pointerNdcY: 0,
    pageDirty: true,
    bookOpenProgress: 0,
    introComplete: false,
  });

  useEffect(() => {
    ensureAssets();
  }, []);

  // Reset & start Power-Cut Flicker -> 3D Scene
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const audio = new StormStudyAudio();
    audio.muted = audioMuted;
    audioRef.current = audio;

    setPhase('FLICKER');
    setIntroDone(false);
    setWorldMode('STORM_LAMP');

    const s = simRef.current;
    s.skipRequested = false;
    s.worldMode = 'STORM_LAMP';
    s.activePage = 0;
    s.pageFlipping = false;
    s.pageFlipT = 0;
    s.inkProgress = 0;
    s.inkWetness = 1;
    s.inkWriting = false;
    s.sealProgress = 0;
    s.sealActive = false;
    s.copied = false;
    s.copiedUntil = 0;
    s.weightOnBook = false;
    s.windGust = 0;
    s.lightningFlash = 0;
    s.chainPull = 0;
    s.chainVel = 0;
    s.chainSway = 0;
    s.chainSwayVel = 0;
    s.planeDeskVx = 0;
    s.planeDeskVz = 0;
    s.planeDeskVrot = 0;
    s.pageDirty = true;
    s.bookOpenProgress = 0;
    s.introComplete = false;

    const flickerTimer = window.setTimeout(() => {
      setPhase('SCENE');
      audio.playThunder(1.15);
      audio.startRain(0.075, 1100);
    }, 600);

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

  const toggleMute = () => {
    setAudioMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  };

  const handleSkipIntro = () => {
    simRef.current.skipRequested = true;
  };

  /* ==========================================================================
     FULL THREE.JS 3D WORLD (STORMY CITY + HOUSE + BROKEN WINDOW + CURTAINS
     + ORIGAMI PLANE + OAK DESK + BANKER'S LAMP + 3D BOOK + PULL-CHAIN)
     ========================================================================== */

  useEffect(() => {
    if (!isOpen || phase !== 'SCENE') return;
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050811');
    scene.fog = new THREE.FogExp2('#070b15', 0.0155);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 220);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const regGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const regMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };
    const regTex = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    /* ---------------------- 1. LIGHTS ---------------------- */
    const hemiLight = new THREE.HemisphereLight('#5c7ea8', '#1c120b', 0.42);
    scene.add(hemiLight);

    const stormFlashLight = new THREE.DirectionalLight('#d8eeff', 0);
    stormFlashLight.position.set(14, 34, -42);
    scene.add(stormFlashLight);

    const moonSunLight = new THREE.DirectionalLight('#7fa8e8', 0.45);
    moonSunLight.position.set(4, 9, -18);
    moonSunLight.castShadow = true;
    moonSunLight.shadow.mapSize.set(1024, 1024);
    moonSunLight.shadow.camera.near = 1;
    moonSunLight.shadow.camera.far = 36;
    moonSunLight.shadow.camera.left = -6;
    moonSunLight.shadow.camera.right = 6;
    moonSunLight.shadow.camera.top = 6;
    moonSunLight.shadow.camera.bottom = -6;
    scene.add(moonSunLight);

    // Warm Brass Banker's Lamp SpotLight (inside study room)
    const deskLampSpot = new THREE.SpotLight(
      '#ffbe68',
      18,
      14,
      Math.PI * 0.36,
      0.62,
      1.35
    );
    deskLampSpot.position.set(-1.55, 1.72, -0.82);
    deskLampSpot.target.position.set(0.2, 0.05, 0.15);
    deskLampSpot.castShadow = true;
    deskLampSpot.shadow.mapSize.set(1024, 1024);
    deskLampSpot.shadow.bias = -0.0005;
    scene.add(deskLampSpot);
    scene.add(deskLampSpot.target);

    // Subtle warm fill inside room so window glows from outside the city!
    const roomBeaconLight = new THREE.PointLight('#ffaa48', 10, 18, 1.5);
    roomBeaconLight.position.set(0, 2.1, -2.5);
    scene.add(roomBeaconLight);

    /* ---------------------- 2. 3D STORMY CITY (z: -12 to -105) ---------------------- */
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // Wet Reflective Asphalt Street
    const roadGeo = regGeo(new THREE.PlaneGeometry(54, 125));
    const roadMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#090c14',
        roughness: 0.22,
        metalness: 0.48,
      })
    );
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -5.5, -55);
    cityGroup.add(road);

    // 4 Reusable Procedural Lit-Window Building Materials
    const facadeMats = [1, 2, 3, 4].map((seed) => {
      const { map, emissiveMap } = createCityFacadeTextures(seed);
      regTex(map);
      regTex(emissiveMap);
      return regMat(
        new THREE.MeshStandardMaterial({
          map,
          emissive: new THREE.Color('#ffd394'),
          emissiveMap,
          emissiveIntensity: 0.85,
          roughness: 0.82,
          metalness: 0.12,
        })
      );
    });

    const boxUnitGeo = regGeo(new THREE.BoxGeometry(1, 1, 1));
    const darkMetalMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#12151e',
        roughness: 0.6,
        metalness: 0.6,
      })
    );

    // Populate Left & Right City Corridor + Background Skyline
    for (let i = 0; i < 62; i++) {
      const side = i < 42 ? (i % 2 === 0 ? -1 : 1) : 0;
      const z =
        i < 42
          ? -12 - Math.floor(i / 2) * 4.3 + ((i * 7) % 3) * 0.4
          : -72 - ((i * 11) % 36);
      const x =
        side !== 0
          ? side * (8.5 + ((i * 13) % 14))
          : -34 + ((i - 42) / 20) * 68;
      const bw = 4.2 + ((i * 17) % 5);
      const bd = 4.2 + ((i * 19) % 5);
      const bh = 10 + ((i * 23) % 22);

      const bMesh = new THREE.Mesh(boxUnitGeo, facadeMats[i % facadeMats.length]);
      bMesh.scale.set(bw, bh, bd);
      bMesh.position.set(x, -5.5 + bh / 2, z);
      cityGroup.add(bMesh);

      // Rooftop antenna / water tank silhouette
      if (i % 3 === 0) {
        const ant = new THREE.Mesh(boxUnitGeo, darkMetalMat);
        ant.scale.set(0.14, 3.2, 0.14);
        ant.position.set(x, -5.5 + bh + 1.6, z);
        cityGroup.add(ant);
      }
    }

    // Glowing Streetlamps lining the rainy street
    const lampBulbGeo = regGeo(new THREE.SphereGeometry(0.24, 10, 10));
    const lampBulbMat = regMat(
      new THREE.MeshBasicMaterial({ color: '#ffca7a' })
    );
    const poleGeo = regGeo(new THREE.CylinderGeometry(0.08, 0.12, 6.2, 8));
    for (let s = 0; s < 10; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const sz = -16 - s * 7.5;
      const sx = side * 6.2;

      const pole = new THREE.Mesh(poleGeo, darkMetalMat);
      pole.position.set(sx, -2.4, sz);
      cityGroup.add(pole);

      const bulb = new THREE.Mesh(lampBulbGeo, lampBulbMat);
      bulb.position.set(sx - side * 0.6, 0.65, sz);
      cityGroup.add(bulb);

      if (s < 4) {
        const sl = new THREE.PointLight('#ffaa4c', 8, 16, 1.8);
        sl.position.set(sx - side * 0.6, 0.5, sz);
        cityGroup.add(sl);
      }
    }

    // 3D Jagged Lightning Bolt Mesh in Stormy Sky
    const boltPoints: number[] = [];
    let bx = 6;
    let by = 38;
    const bz = -68;
    for (let k = 0; k < 10; k++) {
      const nx = bx + (k % 2 === 0 ? -1 : 1) * (1.8 + (k % 3));
      const ny = by - 3.6;
      boltPoints.push(bx, by, bz, nx, ny, bz);
      if (k === 3 || k === 6) {
        boltPoints.push(nx, ny, bz, nx + (k === 3 ? -4 : 4.5), ny - 3.2, bz);
      }
      bx = nx;
      by = ny;
    }
    const boltGeo = regGeo(new THREE.BufferGeometry());
    boltGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(boltPoints, 3)
    );
    const boltMat = regMat(
      new THREE.LineBasicMaterial({
        color: '#e5f4ff',
        transparent: true,
        opacity: 0,
      })
    );
    const lightningBolt = new THREE.LineSegments(boltGeo, boltMat);
    scene.add(lightningBolt);

    /* ---------------------- 3. 3D VINTAGE HOUSE & BROKEN WINDOW (z = -4.2) ---------------------- */
    const wallTex = regTex(createWallPlasterTexture());
    const wallMat = regMat(
      new THREE.MeshStandardMaterial({
        map: wallTex,
        roughness: 0.92,
        metalness: 0.04,
      })
    );
    const woodFrameMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#22150d',
        roughness: 0.85,
        metalness: 0.08,
      })
    );

    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // Window Opening: x in [-2.05, 2.05], y in [0.95, 4.05] at z = -4.2
    const addWallSlab = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(regGeo(new THREE.BoxGeometry(w, h, d)), wallMat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      houseGroup.add(m);
    };
    // Back wall around window hole (4 slabs so hole is 100% physically open!)
    addWallSlab(6.0, 14.0, 0.5, -5.05, 1.5, -4.2); // Left of window
    addWallSlab(6.0, 14.0, 0.5, 5.05, 1.5, -4.2);  // Right of window
    addWallSlab(4.2, 6.5, 0.5, 0, -2.3, -4.2);     // Below window (down to street)
    addWallSlab(4.2, 4.5, 0.5, 0, 6.3, -4.2);      // Above window

    // Side & Ceiling room enclosure so interior feels cozy & real
    addWallSlab(0.4, 9.0, 11.0, -5.6, 2.5, 1.0);
    addWallSlab(0.4, 9.0, 11.0, 5.6, 2.5, 1.0);
    addWallSlab(12.0, 0.4, 11.0, 0, 6.8, 1.0);

    // Vintage Pitched Gable Roof visible from the stormy city outside
    const roofGeo = regGeo(new THREE.ConeGeometry(9.6, 4.6, 4));
    const roofMat = regMat(
      new THREE.MeshStandardMaterial({ color: '#141010', roughness: 0.92 })
    );
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 10.6, 0.5);
    houseGroup.add(roof);

    // Wooden Window Frame & Broken Mullions
    const frameBars: Array<[number, number, number, number, number]> = [
      [4.4, 0.2, 0.58, 0, 4.08], // Top frame
      [4.5, 0.24, 0.72, 0, 0.9], // Sill
      [0.2, 3.25, 0.58, -2.1, 2.5], // Left jamb
      [0.2, 3.25, 0.58, 2.1, 2.5], // Right jamb
      [0.09, 1.05, 0.14, 0, 3.52], // Snapped upper mullion
      [0.09, 0.85, 0.14, 0, 1.38], // Snapped lower mullion
      [1.1, 0.09, 0.14, -1.5, 2.5], // Snapped left crossbar
      [1.05, 0.09, 0.14, 1.52, 2.5], // Snapped right crossbar
    ];
    frameBars.forEach(([w, h, d, x, y]) => {
      const bar = new THREE.Mesh(
        regGeo(new THREE.BoxGeometry(w, h, d)),
        woodFrameMat
      );
      bar.position.set(x, y, -4.2);
      houseGroup.add(bar);
    });

    // 3D Jagged Broken Glass Shards around the smashed window edges
    const glassMat = regMat(
      new THREE.MeshPhysicalMaterial({
        color: '#b8dcff',
        transparent: true,
        opacity: 0.34,
        roughness: 0.08,
        metalness: 0.12,
        reflectivity: 0.9,
        side: THREE.DoubleSide,
      })
    );

    const addGlassShard = (pts: number[]) => {
      const g = regGeo(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, glassMat);
      houseGroup.add(mesh);
    };
    const gz = -4.22;
    addGlassShard([-2.02, 3.98, gz, -0.6, 3.98, gz, -1.55, 2.95, gz]);
    addGlassShard([-2.02, 3.98, gz, -1.55, 2.95, gz, -2.02, 2.15, gz]);
    addGlassShard([2.02, 3.98, gz, 0.72, 3.98, gz, 1.62, 3.05, gz]);
    addGlassShard([2.02, 3.98, gz, 1.62, 3.05, gz, 2.02, 2.25, gz]);
    addGlassShard([-2.02, 1.02, gz, -0.95, 1.02, gz, -1.78, 1.82, gz]);
    addGlassShard([2.02, 1.02, gz, 1.05, 1.02, gz, 1.75, 1.75, gz]);

    // 3D Billowing Sheer Curtains (Subdivided cloth meshes with live wind vertex waves!)
    const curtainMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#dfd5c3',
        transparent: true,
        opacity: 0.62,
        roughness: 0.92,
        side: THREE.DoubleSide,
      })
    );

    const makeCurtain = (xPos: number) => {
      const geo = regGeo(new THREE.PlaneGeometry(1.45, 3.35, 14, 18));
      const basePos = new Float32Array(geo.attributes.position.array);
      const mesh = new THREE.Mesh(geo, curtainMat);
      mesh.position.set(xPos, 2.48, -3.86);
      houseGroup.add(mesh);
      return { mesh, geo, basePos };
    };
    const leftCurtain = makeCurtain(-1.62);
    const rightCurtain = makeCurtain(1.62);

    // 3D Volumetric Morning Sunbeam Cones (visible in GOLDEN_MORNING mode)
    const sunbeamGroup = new THREE.Group();
    const beamMat = regMat(
      new THREE.MeshBasicMaterial({
        color: '#ffe0a3',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const beamGeo = regGeo(new THREE.CylinderGeometry(0.95, 2.55, 8.8, 24, 1, true));
    const beam1 = new THREE.Mesh(beamGeo, beamMat);
    beam1.position.set(-0.35, 1.45, -1.55);
    beam1.rotation.set(Math.PI * 0.34, 0, -0.18);
    sunbeamGroup.add(beam1);

    const beam2 = new THREE.Mesh(beamGeo, beamMat);
    beam2.position.set(0.85, 1.55, -1.65);
    beam2.rotation.set(Math.PI * 0.34, 0, -0.14);
    beam2.scale.set(0.75, 1, 0.75);
    sunbeamGroup.add(beam2);
    scene.add(sunbeamGroup);

    /* ---------------------- 4. 3D RAIN & DUST PARTICLES ---------------------- */
    const rainCount = 750;
    const rainPositions = new Float32Array(rainCount * 6);
    const rainSeeds = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 34;
      const ry = -3 + Math.random() * 28;
      const rz = -5.0 - Math.random() * 78;
      rainSeeds[i * 3] = rx;
      rainSeeds[i * 3 + 1] = ry;
      rainSeeds[i * 3 + 2] = rz;
      rainPositions[i * 6] = rx;
      rainPositions[i * 6 + 1] = ry;
      rainPositions[i * 6 + 2] = rz;
      rainPositions[i * 6 + 3] = rx - 0.14;
      rainPositions[i * 6 + 4] = ry - 0.95;
      rainPositions[i * 6 + 5] = rz;
    }
    const rainGeo = regGeo(new THREE.BufferGeometry());
    rainGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(rainPositions, 3)
    );
    const rainMat = regMat(
      new THREE.LineBasicMaterial({
        color: '#b8d4f5',
        transparent: true,
        opacity: 0.36,
      })
    );
    const rainLines = new THREE.LineSegments(rainGeo, rainMat);
    scene.add(rainLines);

    // Floating Indoor Dust Motes
    const dustCount = 120;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 6.5;
      dustPos[i * 3 + 1] = 0.2 + Math.random() * 3.4;
      dustPos[i * 3 + 2] = -3.6 + Math.random() * 5.6;
    }
    const dustGeo = regGeo(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = regMat(
      new THREE.PointsMaterial({
        color: '#ffe6b3',
        size: 0.032,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    /* ---------------------- 5. 3D WOODEN STUDY DESK & BANKER'S LAMP ---------------------- */
    const { map: oakMap, bump: oakBump } = createOakWoodTexture();
    regTex(oakMap);
    regTex(oakBump);

    const deskMat = regMat(
      new THREE.MeshStandardMaterial({
        map: oakMap,
        bumpMap: oakBump,
        bumpScale: 0.03,
        roughness: 0.62,
        metalness: 0.08,
      })
    );
    const deskTop = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(8.4, 0.24, 4.4)),
      deskMat
    );
    deskTop.position.set(0, -0.12, 0.15);
    deskTop.receiveShadow = true;
    scene.add(deskTop);

    // 3D Brass Banker's Lamp (Left-back of desk)
    const brassMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#cfa246',
        roughness: 0.26,
        metalness: 0.88,
      })
    );
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-2.15, 0, -1.02);
    scene.add(lampGroup);

    const lampBase = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.32, 0.4, 0.12, 24)),
      brassMat
    );
    lampBase.position.y = 0.06;
    lampBase.castShadow = true;
    lampGroup.add(lampBase);

    const lampStem = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.045, 0.055, 1.55, 16)),
      brassMat
    );
    lampStem.position.y = 0.84;
    lampStem.castShadow = true;
    lampGroup.add(lampStem);

    const lampArm = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 12)),
      brassMat
    );
    lampArm.rotation.z = -Math.PI * 0.34;
    lampArm.position.set(0.24, 1.62, 0.12);
    lampGroup.add(lampArm);

    const shadeMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#19543a',
        emissive: new THREE.Color('#2fa86b'),
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.15,
      })
    );
    const lampShade = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.22, 0.36, 0.72, 20, 1, false, 0, Math.PI)),
      shadeMat
    );
    lampShade.rotation.z = Math.PI / 2;
    lampShade.rotation.y = 0.42;
    lampShade.position.set(0.5, 1.68, 0.2);
    lampShade.castShadow = true;
    lampGroup.add(lampShade);

    const bulbGlowMat = regMat(
      new THREE.MeshBasicMaterial({ color: '#ffdf9e' })
    );
    const lampBulb = new THREE.Mesh(
      regGeo(new THREE.SphereGeometry(0.11, 14, 14)),
      bulbGlowMat
    );
    lampBulb.position.set(0.5, 1.58, 0.2);
    lampGroup.add(lampBulb);

    /* ---------------------- 6. 3D LEATHER-BOUND BOOK (OPENING + CURVED FLUTTERING PAGES) ---------------------- */
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 0.02, 0.22);
    scene.add(bookGroup);

    const pageW = 1.48;
    const pageH = 1.98;
    const coverTex = regTex(createLeatherCoverTexture());
    const coverMat = regMat(
      new THREE.MeshStandardMaterial({
        map: coverTex,
        roughness: 0.65,
        metalness: 0.14,
      })
    );
    const darkLeatherMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#2c080c',
        roughness: 0.72,
        metalness: 0.1,
      })
    );
    const pageEdgeMat = regMat(
      new THREE.MeshStandardMaterial({ color: '#d7c39a', roughness: 0.9 })
    );

    // Back Right Board
    const backBoard = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(pageW + 0.12, 0.06, pageH + 0.12)),
      darkLeatherMat
    );
    backBoard.position.set(pageW / 2 + 0.04, 0.03, 0);
    backBoard.castShadow = true;
    backBoard.receiveShadow = true;
    bookGroup.add(backBoard);

    // Right Stacked Page Block
    const rightBlock = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(pageW, 0.14, pageH)),
      pageEdgeMat
    );
    rightBlock.position.set(pageW / 2, 0.12, 0);
    rightBlock.castShadow = true;
    rightBlock.receiveShadow = true;
    bookGroup.add(rightBlock);

    // Spine Leather Cylinder
    const spineMesh = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.11, 0.11, pageH + 0.12, 16, 1, false, Math.PI / 2, Math.PI)),
      darkLeatherMat
    );
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, 0.08, 0);
    bookGroup.add(spineMesh);

    // Front Cover Pivot (rotates from 0 -> -Math.PI to open book!)
    const frontCoverPivot = new THREE.Group();
    frontCoverPivot.position.set(0, 0.21, 0);
    bookGroup.add(frontCoverPivot);

    const frontBoard = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(pageW + 0.12, 0.06, pageH + 0.12)),
      [
        darkLeatherMat,
        darkLeatherMat,
        coverMat, // top face
        darkLeatherMat,
        darkLeatherMat,
        darkLeatherMat,
      ]
    );
    frontBoard.position.set(pageW / 2 + 0.04, 0, 0);
    frontBoard.castShadow = true;
    frontBoard.receiveShadow = true;
    frontCoverPivot.add(frontBoard);

    // Left Bookplate Page attached to inside of Front Cover
    const leftPageTex = regTex(createLeftBookplateTexture());
    const leftPageMat = regMat(
      new THREE.MeshStandardMaterial({
        map: leftPageTex,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    const leftPageBlock = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(pageW, 0.1, pageH)),
      [
        pageEdgeMat,
        pageEdgeMat,
        pageEdgeMat,
        leftPageMat, // bottom face becomes top when cover rotates -PI!
        pageEdgeMat,
        pageEdgeMat,
      ]
    );
    leftPageBlock.position.set(pageW / 2, -0.07, 0);
    leftPageBlock.receiveShadow = true;
    frontCoverPivot.add(leftPageBlock);

    // Dynamic Right Page Canvas Texture (Wet Ink + Calling Card + Stamp)
    const rightPageCanvas = document.createElement('canvas');
    rightPageCanvas.width = 1024;
    rightPageCanvas.height = 1024;
    const rightPageCtx = rightPageCanvas.getContext('2d')!;
    const rightPageTex = regTex(new THREE.CanvasTexture(rightPageCanvas));
    rightPageTex.colorSpace = THREE.SRGBColorSpace;
    rightPageTex.anisotropy = 8;

    // Subdivided 3D Right Page Mesh (bends & flutters in wind!)
    const rightPageGeo = regGeo(new THREE.PlaneGeometry(pageW, pageH, 24, 16));
    rightPageGeo.rotateX(-Math.PI / 2);
    rightPageGeo.translate(pageW / 2, 0, 0);
    const rightPageBasePos = new Float32Array(
      rightPageGeo.attributes.position.array
    );

    const rightPageMat = regMat(
      new THREE.MeshStandardMaterial({
        map: rightPageTex,
        roughness: 0.86,
        metalness: 0.02,
        side: THREE.DoubleSide,
      })
    );
    const rightPageMesh = new THREE.Mesh(rightPageGeo, rightPageMat);
    rightPageMesh.position.set(0, 0.2, 0);
    rightPageMesh.receiveShadow = true;
    rightPageMesh.castShadow = true;
    bookGroup.add(rightPageMesh);

    // 3D Turning Page Sheet (animates smoothly across spine on CONTACT flip!)
    const turnPageGeo = regGeo(new THREE.PlaneGeometry(pageW, pageH, 24, 10));
    turnPageGeo.rotateX(-Math.PI / 2);
    turnPageGeo.translate(pageW / 2, 0, 0);
    const turnPageBasePos = new Float32Array(
      turnPageGeo.attributes.position.array
    );
    const turnPageMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#efe0be',
        roughness: 0.88,
        side: THREE.DoubleSide,
      })
    );
    const turnPageMesh = new THREE.Mesh(turnPageGeo, turnPageMat);
    turnPageMesh.position.set(0, 0.215, 0);
    turnPageMesh.visible = false;
    turnPageMesh.castShadow = true;
    bookGroup.add(turnPageMesh);

    /* ---------------------- 7. 3D INTERACTIVE PROPS (PLANE, PAPERWEIGHT, PEN, PULL-CHAIN) ---------------------- */

    // 3D Folded Magazine Paper Plane
    const planeTex = regTex(createMagazinePlaneTexture());
    const planeMat = regMat(
      new THREE.MeshStandardMaterial({
        map: planeTex,
        roughness: 0.82,
        side: THREE.DoubleSide,
      })
    );
    const paperPlane = new THREE.Mesh(
      regGeo(createPaperPlaneGeometry()),
      planeMat
    );
    paperPlane.castShadow = true;
    scene.add(paperPlane);

    // 3D Heavy Brass Paperweight (Cylinder + engraved top ring)
    const weightGroup = new THREE.Group();
    const weightDeskPos = new THREE.Vector3(-1.82, 0, 0.82);
    const weightBookPos = new THREE.Vector3(1.18, 0.21, 0.96);
    weightGroup.position.copy(weightDeskPos);
    scene.add(weightGroup);

    const weightBody = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 28)),
      brassMat
    );
    weightBody.position.y = 0.08;
    weightBody.castShadow = true;
    weightBody.receiveShadow = true;
    weightGroup.add(weightBody);

    const weightKnob = new THREE.Mesh(
      regGeo(new THREE.SphereGeometry(0.1, 18, 14)),
      brassMat
    );
    weightKnob.position.y = 0.2;
    weightKnob.castShadow = true;
    weightGroup.add(weightKnob);

    // 3D Vintage Fountain Pen (Tap to rewrite live ink!)
    const penGroup = new THREE.Group();
    penGroup.position.set(1.88, 0.045, -0.08);
    penGroup.rotation.y = 0.28;
    scene.add(penGroup);

    const penBodyMat = regMat(
      new THREE.MeshStandardMaterial({
        color: '#1b130e',
        roughness: 0.25,
        metalness: 0.3,
      })
    );
    const penBarrel = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.036, 0.028, 1.15, 14)),
      penBodyMat
    );
    penBarrel.rotation.x = Math.PI / 2;
    penBarrel.castShadow = true;
    penGroup.add(penBarrel);

    const penRing = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 14)),
      brassMat
    );
    penRing.rotation.x = Math.PI / 2;
    penRing.position.z = 0.15;
    penGroup.add(penRing);

    const penNib = new THREE.Mesh(
      regGeo(new THREE.ConeGeometry(0.028, 0.2, 10)),
      brassMat
    );
    penNib.rotation.x = Math.PI / 2;
    penNib.position.z = 0.66;
    penGroup.add(penNib);

    // 3D Hanging Brass Pull-Chain (Attached to Camera View Space so it's always reachable on Mobile & Desktop!)
    const chainPivot = new THREE.Group();
    camera.add(chainPivot);
    scene.add(camera);

    const chainInner = new THREE.Group();
    chainPivot.add(chainInner);

    const beadGeo = regGeo(new THREE.SphereGeometry(0.016, 10, 10));
    for (let b = 0; b < 18; b++) {
      const bead = new THREE.Mesh(beadGeo, brassMat);
      bead.position.y = -b * 0.038;
      chainInner.add(bead);
    }
    const acornMesh = new THREE.Mesh(
      regGeo(new THREE.CapsuleGeometry(0.042, 0.068, 8, 14)),
      brassMat
    );
    acornMesh.position.y = -18 * 0.038 - 0.04;
    chainInner.add(acornMesh);

    // Invisible generous hit cylinder around pull-chain for easy phone tapping/pulling
    const chainHitMesh = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 8)),
      regMat(
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      )
    );
    chainHitMesh.position.y = -0.42;
    chainInner.add(chainHitMesh);

    const updateChainPlacement = () => {
      const mobile = window.innerWidth < window.innerHeight;
      chainPivot.position.set(mobile ? 0.52 : 1.08, mobile ? 0.88 : 0.78, -2.05);
    };
    updateChainPlacement();
    chainPivot.visible = false;

    /* ---------------------- 8. FLIGHT SPLINE PATH (CITY -> BROKEN WINDOW -> DESK) ---------------------- */
    const flightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 11.5, -76),
      new THREE.Vector3(3.2, 7.6, -54),
      new THREE.Vector3(-2.6, 4.9, -32),
      new THREE.Vector3(0.4, 3.1, -13.5),
      new THREE.Vector3(0.0, 2.45, -4.2), // RIGHT THROUGH BROKEN WINDOW!
      new THREE.Vector3(-0.2, 1.85, -1.6),
      new THREE.Vector3(1.15, 0.85, 0.1),
      new THREE.Vector3(1.72, 0.08, 0.88), // LANDING ON OAK DESK!
    ]);

    /* ---------------------- 9. RAYCASTER & INTERACTION HANDLERS ---------------------- */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let draggingChain = false;
    let chainStartY = 0;
    let chainTriggered = false;
    let chainDragged = false;

    const cycleWorld = () => {
      const s = simRef.current;
      const next =
        WORLD_ORDER[(WORLD_ORDER.indexOf(s.worldMode) + 1) % WORLD_ORDER.length];
      s.worldMode = next;
      setWorldMode(next);
      audioRef.current?.playChainKatak();

      if (next === 'MOON_LIGHTNING') {
        s.lightningFlash = 1.0;
        audioRef.current?.playThunder(0.8);
        audioRef.current?.setRain(0.072, 1160);
      } else if (next === 'GOLDEN_MORNING') {
        audioRef.current?.setRain(0.006, 560);
      } else {
        audioRef.current?.setRain(0.048, 920);
      }
    };

    const copyEmailDirect = () => {
      const s = simRef.current;
      audioRef.current?.playThud(true);
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
      s.copied = true;
      s.copiedUntil = performance.now() + 2600;
      s.pageDirty = true;
    };

    const triggerPageFlip = (targetPage: 0 | 1) => {
      const s = simRef.current;
      if (s.pageFlipping || s.activePage === targetPage) return;
      s.pageFlipping = true;
      s.pageFlipDir = targetPage === 1 ? 1 : -1;
      s.pageFlipT = 0;
      turnPageMesh.visible = true;
      audioRef.current?.playPaper(false);
    };

    const updatePointerCoords = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      simRef.current.pointerNdcX = pointer.x;
      simRef.current.pointerNdcY = pointer.y;
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointerCoords(e.clientX, e.clientY);
      if (!simRef.current.introComplete) return;

      raycaster.setFromCamera(pointer, camera);
      const chainHits = raycaster.intersectObject(chainHitMesh, false);
      if (chainHits.length > 0) {
        draggingChain = true;
        chainStartY = e.clientY;
        chainTriggered = false;
        chainDragged = false;
        try {
          renderer.domElement.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointerCoords(e.clientX, e.clientY);
      const s = simRef.current;

      if (draggingChain) {
        const dy = Math.max(0, Math.min(90, e.clientY - chainStartY));
        if (dy > 5) chainDragged = true;
        s.chainPull = dy / 220;
        if (dy >= 42 && !chainTriggered) {
          chainTriggered = true;
          cycleWorld();
        }
        return;
      }

      if (!s.introComplete) return;

      // Hover cursor feedback
      raycaster.setFromCamera(pointer, camera);
      const interactables = [
        chainHitMesh,
        weightBody,
        weightKnob,
        paperPlane,
        penBarrel,
        rightPageMesh,
      ];
      const hits = raycaster.intersectObjects(interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    };

    const onPointerUp = () => {
      const s = simRef.current;
      if (draggingChain) {
        const wasTap = !chainDragged && !chainTriggered;
        draggingChain = false;
        if (wasTap) {
          s.chainPull = 0.24;
          cycleWorld();
        }
        s.chainSwayVel += 0.22;
      }
    };

    const onCanvasClick = (e: MouseEvent) => {
      const s = simRef.current;
      if (!s.introComplete || chainDragged) return;

      updatePointerCoords(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);

      // 1. Paperweight toggle (pin/unpin fluttering pages)
      if (raycaster.intersectObjects([weightBody, weightKnob], false).length > 0) {
        s.weightOnBook = !s.weightOnBook;
        s.pageDirty = true;
        audioRef.current?.playThud(s.weightOnBook);
        return;
      }

      // 2. Fallen Paper Plane flick
      if (raycaster.intersectObject(paperPlane, false).length > 0) {
        s.planeDeskVx = (Math.random() > 0.5 ? 1 : -1) * (0.045 + Math.random() * 0.04);
        s.planeDeskVz = (Math.random() - 0.5) * 0.05;
        s.planeDeskVrot = (Math.random() > 0.5 ? 1 : -1) * 0.18;
        audioRef.current?.playPaper(true);
        return;
      }

      // 3. Fountain Pen tap (rewrite wet ink calligraphy)
      if (raycaster.intersectObjects([penBarrel, penNib, penRing], false).length > 0) {
        if (s.activePage === 1) triggerPageFlip(0);
        s.inkProgress = 0;
        s.inkWetness = 1;
        s.inkWriting = true;
        s.sealProgress = 0;
        s.sealActive = false;
        s.pageDirty = true;
        audioRef.current?.playNibScratch();
        return;
      }

      // 4. Direct UV-Mapped Clicks on the 3D Curved Right Book Page!
      const pageHits = raycaster.intersectObject(rightPageMesh, false);
      if (pageHits.length > 0 && pageHits[0].uv) {
        const u = pageHits[0].uv.x;
        const v = pageHits[0].uv.y;
        const cx = u * 1024;
        const cy = (1 - v) * 1024;

        if (s.activePage === 0) {
          // Bottom-right CONTACT flip button
          if (cx >= 640 && cy >= 740) {
            triggerPageFlip(1);
          } else if (cx >= 360 && cx <= 640 && cy >= 760) {
            // Tap rewrite text
            s.inkProgress = 0;
            s.inkWetness = 1;
            s.inkWriting = true;
            s.sealProgress = 0;
            s.sealActive = false;
            s.pageDirty = true;
            audioRef.current?.playNibScratch();
          }
        } else {
          // Page 1: Calling Card interactive hit zones
          if (cx >= 210 && cx <= 685 && cy >= 390 && cy <= 500) {
            copyEmailDirect();
          } else if (cx >= 686 && cx <= 850 && cy >= 390 && cy <= 500) {
            window.location.href = `mailto:${CREATOR_EMAIL}`;
          } else if (cx >= 210 && cx <= 845 && cy >= 505 && cy <= 600) {
            window.open(CREATOR_INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
          } else if (cx >= 210 && cx <= 845 && cy >= 605 && cy <= 700) {
            window.open(CREATOR_LINKEDIN_URL, '_blank', 'noopener,noreferrer');
          } else if (cy >= 790) {
            triggerPageFlip(0);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('click', onCanvasClick);

    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      updateChainPlacement();
    };
    window.addEventListener('resize', onResize);

    // Redraw page once Google Fonts finish loading so Great Vibes renders crisply
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        simRef.current.pageDirty = true;
      });
    }

    /* ---------------------- 10. MAIN 60FPS ANIMATION LOOP ---------------------- */
    const startTime = performance.now();
    let prevTime = startTime;
    let flightProgress = 0; // 0..1
    let gustCooldown = 3.2;
    let rafId = 0;

    const tmpPos = new THREE.Vector3();
    const tmpAhead = new THREE.Vector3();
    const camTargetPos = new THREE.Vector3();
    const camLookTarget = new THREE.Vector3();
    const curLookAt = new THREE.Vector3(0, 2.5, -4.2);

    const skyStorm = new THREE.Color('#050811');
    const skyMoon = new THREE.Color('#060b18');
    const skyMorning = new THREE.Color('#b68352');
    const fogStorm = new THREE.Color('#070b15');
    const fogMorning = new THREE.Color('#c79662');

    // Initial closed book centering
    bookGroup.position.x = -pageW * 0.48;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;
      const elapsedSec = (now - startTime) / 1000;
      const s = simRef.current;

      /* ---- A. INTRO FLIGHT SEQUENCE (STORM CITY -> SLOW-MO BROKEN WINDOW -> DESK) ---- */
      if (!s.introComplete) {
        if (s.skipRequested) {
          flightProgress = 1;
        } else {
          // Brief dramatic slow-motion right as the plane passes through the broken window!
          const inWindowSlowMo = flightProgress > 0.52 && flightProgress < 0.67;
          const speed = inWindowSlowMo ? 0.085 : 0.185;
          flightProgress = Math.min(1, flightProgress + dt * speed);
        }

        // Timed lightning flashes during city flight & broken window pass
        if (
          (flightProgress > 0.05 && flightProgress < 0.08) ||
          (flightProgress > 0.54 && flightProgress < 0.58)
        ) {
          s.lightningFlash = Math.max(s.lightningFlash, 0.95);
        }

        // Plane position & realistic banking along 3D curve
        flightCurve.getPointAt(flightProgress, tmpPos);
        flightCurve.getPointAt(Math.min(1, flightProgress + 0.015), tmpAhead);
        paperPlane.position.copy(tmpPos);
        paperPlane.lookAt(tmpAhead);
        const bank = Math.sin(flightProgress * Math.PI * 3.5) * 0.42 * (1 - flightProgress);
        paperPlane.rotateZ(bank);

        // Camera smoothly tracks behind plane through the city & window, then arcs to hero desk view!
        if (flightProgress < 0.72) {
          const camT = Math.max(0, flightProgress - 0.085);
          flightCurve.getPointAt(camT, camTargetPos);
          camTargetPos.y += 0.65 * (1 - flightProgress * 0.4);
          camTargetPos.z -= 1.8 * (1 - flightProgress);
          camera.position.lerp(camTargetPos, 0.14);
          curLookAt.lerp(tmpAhead, 0.16);
          camera.lookAt(curLookAt);
        } else {
          const settleT = (flightProgress - 0.72) / 0.28;
          const ease = 1 - Math.pow(1 - settleT, 3);
          const mobile = window.innerWidth < window.innerHeight;
          const endCamX = mobile ? 0.55 : 0.0;
          const endCamY = mobile ? 2.75 : 2.52;
          const endCamZ = mobile ? 3.25 : 3.35;
          const endLookX = mobile ? 0.52 : 0.0;
          const endLookY = mobile ? 0.18 : 0.24;
          const endLookZ = mobile ? 0.08 : -0.28;

          // Sweep smoothly over the desk into the hero framing
          camTargetPos.set(
            THREE.MathUtils.lerp(0.6, endCamX, ease),
            THREE.MathUtils.lerp(2.2, endCamY, ease),
            THREE.MathUtils.lerp(-1.4, endCamZ, ease)
          );
          camLookTarget.set(endLookX, endLookY, endLookZ);
          camera.position.lerp(camTargetPos, 0.12);
          curLookAt.lerp(camLookTarget, 0.12);
          camera.lookAt(curLookAt);
        }

        if (flightProgress >= 1) {
          s.introComplete = true;
          setIntroDone(true);
          chainPivot.visible = true;
          paperPlane.position.set(1.72, 0.09, 0.88);
          paperPlane.rotation.set(0.08, -2.25, 0.04);
          audioRef.current?.setRain(0.048, 920);
          audioRef.current?.playPaper(false);
        }
      } else {
        /* ---- B. DESK HERO CAMERA + SUBTLE REALISTIC PARALLAX ---- */
        const mobile = window.innerWidth < window.innerHeight;
        const zoomInForCard = s.activePage === 1 ? 0.28 : 0;
        const baseCamX = mobile ? 0.62 : 0.0;
        const baseCamY = (mobile ? 2.65 : 2.48) - zoomInForCard * 0.45;
        const baseCamZ = (mobile ? 3.12 : 3.32) - zoomInForCard * 0.6;
        const baseLookX = mobile ? 0.6 : 0.0;
        const baseLookY = mobile ? 0.16 : 0.22;
        const baseLookZ = mobile ? 0.12 : -0.26;

        camTargetPos.set(
          baseCamX + s.pointerNdcX * (mobile ? 0.18 : 0.42),
          baseCamY + s.pointerNdcY * (mobile ? 0.12 : 0.24),
          baseCamZ
        );
        camLookTarget.set(baseLookX, baseLookY, baseLookZ);
        camera.position.lerp(camTargetPos, 0.075);
        curLookAt.lerp(camLookTarget, 0.085);
        camera.lookAt(curLookAt);

        /* ---- C. 3D BOOK OPENING & LIVE WET-INK CALLIGRAPHY ---- */
        if (s.bookOpenProgress < 1) {
          s.bookOpenProgress = Math.min(1, s.bookOpenProgress + dt * 0.92);
          const easeOpen = 1 - Math.pow(1 - s.bookOpenProgress, 3);
          frontCoverPivot.rotation.z = easeOpen * Math.PI;
          bookGroup.position.x = THREE.MathUtils.lerp(-pageW * 0.48, 0, easeOpen);

          if (s.bookOpenProgress >= 0.72 && !s.inkWriting && s.inkProgress === 0) {
            s.inkWriting = true;
            audioRef.current?.playNibScratch();
          }
        }

        if (s.inkWriting) {
          s.inkProgress = Math.min(1, s.inkProgress + dt * 0.44);
          s.pageDirty = true;
          if (s.inkProgress >= 1) {
            s.inkWriting = false;
            s.sealActive = true;
            audioRef.current?.playThud(false);
          }
        } else if (s.inkWetness > 0 && s.inkProgress >= 1) {
          // Wet ink dries slowly over 2 seconds!
          s.inkWetness = Math.max(0, s.inkWetness - dt * 0.45);
          s.pageDirty = true;
        }

        if (s.sealActive && s.sealProgress < 1) {
          s.sealProgress = Math.min(1, s.sealProgress + dt * 2.4);
          s.pageDirty = true;
        }

        if (s.copied && now > s.copiedUntil) {
          s.copied = false;
          s.pageDirty = true;
        }

        /* ---- D. 3D CURVED PAGE FLIP ANIMATION ---- */
        if (s.pageFlipping) {
          s.pageFlipT += dt * 1.95;
          const t = Math.min(1, s.pageFlipT);
          const angle = s.pageFlipDir === 1 ? t * Math.PI : (1 - t) * Math.PI;

          // Update curved 3D sheet vertices as it flips across the spine
          const posAttr = turnPageGeo.attributes.position as THREE.BufferAttribute;
          const arch = Math.sin(t * Math.PI) * 0.34;
          for (let i = 0; i < posAttr.count; i++) {
            const bx0 = turnPageBasePos[i * 3];
            const bz0 = turnPageBasePos[i * 3 + 2];
            const frac = bx0 / pageW;
            const bendY = Math.sin(frac * Math.PI) * arch;
            const rotX = bx0 * Math.cos(angle) - bendY * Math.sin(angle);
            const rotY = bx0 * Math.sin(angle) + bendY * Math.cos(angle);
            posAttr.setXYZ(i, rotX, rotY, bz0);
          }
          posAttr.needsUpdate = true;
          turnPageGeo.computeVertexNormals();

          if (t >= 0.48 && s.activePage !== (s.pageFlipDir === 1 ? 1 : 0)) {
            s.activePage = s.pageFlipDir === 1 ? 1 : 0;
            s.pageDirty = true;
          }
          if (t >= 1) {
            s.pageFlipping = false;
            turnPageMesh.visible = false;
          }
        }

        /* ---- E. WIND GUSTS & 3D FLUTTERING BOOK PAGE ---- */
        gustCooldown -= dt;
        if (gustCooldown <= 0) {
          gustCooldown = s.worldMode === 'GOLDEN_MORNING' ? 5.5 : 3.6 + Math.random() * 2.2;
          if (s.worldMode !== 'GOLDEN_MORNING') {
            s.windGust = 1.0;
            s.chainSwayVel += 0.14;
            if (!s.weightOnBook) {
              audioRef.current?.playPaper(true);
            }
            if (Math.random() < (s.worldMode === 'MOON_LIGHTNING' ? 0.72 : 0.35)) {
              s.lightningFlash = 1.0;
              audioRef.current?.playThunder(0.55);
            }
          }
        }
        s.windGust = Math.max(0, s.windGust - dt * 0.65);

        // Animate 3D Right Page curvature + wind flutter (stops when Brass Paperweight pins it!)
        const rpAttr = rightPageGeo.attributes.position as THREE.BufferAttribute;
        const flutterAmp = s.weightOnBook
          ? 0.004
          : 0.02 + s.windGust * 0.24 * (0.5 + 0.5 * Math.sin(elapsedSec * 7.5));
        for (let i = 0; i < rpAttr.count; i++) {
          const bx0 = rightPageBasePos[i * 3];
          const bz0 = rightPageBasePos[i * 3 + 2];
          const u = bx0 / pageW;
          const v = (bz0 + pageH / 2) / pageH;
          // Natural spine arch + lifted bottom-right corner in wind
          const spineArch = Math.sin(u * Math.PI) * 0.045;
          const cornerLift =
            Math.pow(u, 2.1) * Math.pow(v, 1.3) * flutterAmp;
          rpAttr.setY(i, spineArch + cornerLift);
        }
        rpAttr.needsUpdate = true;
        rightPageGeo.computeVertexNormals();

        /* ---- F. PAPERWEIGHT SMOOTH MOVE + PAPER PLANE DESK FRICTION ---- */
        weightGroup.position.lerp(
          s.weightOnBook ? weightBookPos : weightDeskPos,
          0.16
        );

        if (
          Math.abs(s.planeDeskVx) > 0.0005 ||
          Math.abs(s.planeDeskVz) > 0.0005 ||
          Math.abs(s.planeDeskVrot) > 0.001
        ) {
          paperPlane.position.x = THREE.MathUtils.clamp(
            paperPlane.position.x + s.planeDeskVx,
            1.42,
            2.65
          );
          paperPlane.position.z = THREE.MathUtils.clamp(
            paperPlane.position.z + s.planeDeskVz,
            -0.65,
            1.45
          );
          paperPlane.rotation.y += s.planeDeskVrot;
          s.planeDeskVx *= 0.91;
          s.planeDeskVz *= 0.91;
          s.planeDeskVrot *= 0.91;
        }

        /* ---- G. PULL-CHAIN SPRING PHYSICS ---- */
        if (!draggingChain) {
          const pullForce = -s.chainPull * 28 - s.chainVel * 6;
          s.chainVel += pullForce * dt;
          s.chainPull = Math.max(-0.04, s.chainPull + s.chainVel * dt);
        }
        const swayForce = -s.chainSway * 16 - s.chainSwayVel * 3.2;
        s.chainSwayVel += swayForce * dt;
        s.chainSway += s.chainSwayVel * dt;

        chainInner.position.y = -s.chainPull;
        chainPivot.rotation.z = s.chainSway;
      }

      /* ---- H. REDRAW DYNAMIC 3D BOOK PAGE TEXTURE WHEN DIRTY ---- */
      if (s.pageDirty) {
        s.pageDirty = false;
        renderRightPageCanvas(rightPageCtx, {
          page: s.activePage,
          inkProgress: s.inkProgress,
          wetness: s.inkWetness,
          sealProgress: s.sealProgress,
          copied: s.copied,
          pinned: s.weightOnBook,
        });
        rightPageTex.needsUpdate = true;
      }

      /* ---- I. 3D CURTAINS BILLOWING IN STORM WIND ---- */
      const windPower = s.worldMode === 'GOLDEN_MORNING' ? 0.14 : 0.45 + s.windGust * 0.55;
      [leftCurtain, rightCurtain].forEach((cObj, idx) => {
        const attr = cObj.geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < attr.count; i++) {
          const x0 = cObj.basePos[i * 3];
          const y0 = cObj.basePos[i * 3 + 1];
          // Top edge (y0 ~ +1.67) stays pinned to curtain rod; bottom blows inward (+Z)!
          const hangFrac = Math.max(0, (1.68 - y0) / 3.35);
          const wave =
            Math.sin(elapsedSec * 2.8 + y0 * 1.6 + x0 * 2.2 + idx * 1.4) *
            0.22 *
            windPower *
            hangFrac;
          const billowInward = (0.18 + windPower * 0.48) * hangFrac * hangFrac;
          attr.setZ(i, billowInward + wave);
        }
        attr.needsUpdate = true;
        cObj.geo.computeVertexNormals();
      });

      /* ---- J. LIVE 3-STAGE WORLD LIGHTING & RAIN/SUNBEAMS ---- */
      s.lightningFlash *= 0.86;
      const flash = s.worldMode === 'GOLDEN_MORNING' ? 0 : s.lightningFlash;

      stormFlashLight.intensity = flash * 16;
      boltMat.opacity = flash > 0.18 ? flash : 0;

      const isMorning = s.worldMode === 'GOLDEN_MORNING';
      const isMoon = s.worldMode === 'MOON_LIGHTNING';

      const targetSky = isMorning ? skyMorning : isMoon ? skyMoon : skyStorm;
      (scene.background as THREE.Color).lerp(targetSky, 0.05);
      if (flash > 0.25) {
        (scene.background as THREE.Color).setRGB(
          0.16 + flash * 0.42,
          0.22 + flash * 0.48,
          0.34 + flash * 0.54
        );
      }
      (scene.fog as THREE.FogExp2).color.lerp(
        isMorning ? fogMorning : fogStorm,
        0.05
      );

      // Desk Lamp ON in STORM_LAMP, OFF in MOON_LIGHTNING, soft in GOLDEN_MORNING
      const targetLampInt = isMoon ? 0 : isMorning ? 3.5 : 19;
      deskLampSpot.intensity = THREE.MathUtils.lerp(
        deskLampSpot.intensity,
        targetLampInt,
        0.12
      );
      shadeMat.emissiveIntensity = THREE.MathUtils.lerp(
        shadeMat.emissiveIntensity,
        isMoon ? 0.02 : isMorning ? 0.2 : 0.72,
        0.12
      );
      bulbGlowMat.color.set(isMoon ? '#24201c' : '#ffdf9e');
      roomBeaconLight.intensity = isMoon ? 0.4 : isMorning ? 5 : 9;

      // Sunlight / Moonlight through broken window
      moonSunLight.color.lerp(
        new THREE.Color(isMorning ? '#ffd48a' : '#8cb8f5'),
        0.06
      );
      moonSunLight.intensity = THREE.MathUtils.lerp(
        moonSunLight.intensity,
        isMorning ? 3.2 : isMoon ? 1.05 + flash * 3.5 : 0.48 + flash * 2.4,
        0.08
      );
      hemiLight.intensity = THREE.MathUtils.lerp(
        hemiLight.intensity,
        isMorning ? 1.15 : isMoon ? 0.28 + flash * 0.6 : 0.42 + flash * 0.4,
        0.08
      );

      // Volumetric 3D Sunbeams fade in during Golden Morning
      beamMat.opacity = THREE.MathUtils.lerp(
        beamMat.opacity,
        isMorning ? 0.14 : 0,
        0.05
      );

      // Rain falls outside in Storm & Moon modes, stops in Golden Morning
      rainMat.opacity = THREE.MathUtils.lerp(
        rainMat.opacity,
        isMorning ? 0 : 0.36 + flash * 0.25,
        0.06
      );
      if (rainMat.opacity > 0.01) {
        const rAttr = rainGeo.attributes.position as THREE.BufferAttribute;
        const dropSpeed = s.introComplete ? 24 : 30;
        for (let i = 0; i < rainCount; i++) {
          let ry = rainSeeds[i * 3 + 1] - dropSpeed * dt;
          if (ry < -5.5) ry = 23 + Math.random() * 4;
          rainSeeds[i * 3 + 1] = ry;
          const rx = rainSeeds[i * 3];
          const rz = rainSeeds[i * 3 + 2];
          rAttr.setXYZ(i * 2, rx, ry, rz);
          rAttr.setXYZ(i * 2 + 1, rx - 0.14, ry - 0.95, rz);
        }
        rAttr.needsUpdate = true;
      }

      // Gentle indoor dust drift
      dustPoints.rotation.y = Math.sin(elapsedSec * 0.12) * 0.08;
      dustMat.opacity = isMorning ? 0.62 : isMoon ? 0.15 + flash * 0.3 : 0.36;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('click', onCanvasClick);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, phase]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isMorning = worldMode === 'GOLDEN_MORNING';
  const isMoon = worldMode === 'MOON_LIGHTNING';

  const modalContent = (
    <div
      className="v3d-root"
      role="dialog"
      aria-modal="true"
      aria-label="Designed and Curated by Samrat Sandilya"
      style={{
        background: phase === 'FLICKER' ? 'transparent' : '#04060c',
      }}
    >
      {/* PHASE 1: REAL BULB POWER-CUT FLICKER OVER THE ACTUAL SANRACHNA WEBSITE */}
      {phase === 'FLICKER' && <div className="v3d-flicker-layer" />}

      {/* PHASE 2: FULLSCREEN REAL-TIME THREE.JS 3D CANVAS */}
      {phase === 'SCENE' && (
        <>
          <div
            ref={mountRef}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          />

          {/* MINIMAL TOP HUD (WORLD STATUS + AUDIO + CLOSE) */}
          <header className="v3d-hud-top">
            <div
              style={{
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'rgba(10, 9, 8, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#f0e0be',
                fontSize: '9px',
                letterSpacing: '0.2em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isMorning
                    ? '#f7c46c'
                    : isMoon
                    ? '#93c5fd'
                    : '#eab308',
                }}
              />
              <span>{WORLD_LABELS[worldMode]}</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: audioMuted ? 'rgba(240,224,190,0.45)' : '#f0e0be',
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
                background: 'rgba(10, 9, 8, 0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
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

          {/* SKIP FLIGHT BUTTON (ONLY DURING THE 3D FLIGHT INTRO) */}
          {!introDone && (
            <button
              type="button"
              onClick={handleSkipIntro}
              style={{
                position: 'fixed',
                bottom: '22px',
                right: '22px',
                zIndex: 45,
                padding: '7px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 224, 170, 0.35)',
                background: 'rgba(10, 12, 18, 0.62)',
                backdropFilter: 'blur(10px)',
                color: '#f2e4c4',
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: '9px',
                letterSpacing: '0.24em',
                cursor: 'pointer',
              }}
            >
              SKIP FLIGHT →
            </button>
          )}

          {/* SUBTLE BOTTOM INTERACTION GUIDE ONCE LANDED ON DESK */}
          {introDone && (
            <div className="v3d-hint">
              PULL BRASS CHAIN · TAP WEIGHT TO PIN PAGE · TAP PEN · TAP CONTACT ↻
            </div>
          )}
        </>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreatorPassModal;
