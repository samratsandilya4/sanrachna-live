import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CreatorPassModalProps {
  open: boolean;
  onClose: () => void;
}

const LINKEDIN_URL = 'https://www.linkedin.com/in/samrat-sandilya';
const INSTAGRAM_URL = 'https://www.instagram.com/samrat.tiwary';

// Exact 310x470 side-notched press pass path (center punches + bottom stub notches)
const NOTCHED_PATH =
  'M 18 1 H 292 A 17 17 0 0 1 309 18 V 220 A 18 18 0 0 0 309 256 V 379 A 7 7 0 0 0 309 393 V 452 A 17 17 0 0 1 292 469 H 18 A 17 17 0 0 1 1 452 V 393 A 7 7 0 0 0 1 379 V 256 A 18 18 0 0 0 1 220 V 18 A 17 17 0 0 1 18 1 Z';

const CARD_MASK_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 470"><path d="${NOTCHED_PATH}" fill="white"/><circle cx="155" cy="28" r="10" fill="black"/></svg>`
);

const CARD_MASK_URL = `url("data:image/svg+xml,${CARD_MASK_SVG}")`;

const LINEN_TEXTURE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6"><path d="M0 0h6v1H0zM0 0h1v6H0z" fill="rgba(255,255,255,0.035)"/></svg>`
);

// ===========================================================================
// 1. STEALTH 10-SECOND HOLD TRIGGER HOOK (0-3s INVISIBLE, 3-10s CHARGE)
// ===========================================================================
export function useCreatorPassTrigger(
  onUnlock: () => void,
  holdMs = 10000,
  stealthMs = 3000
) {
  const [chargeRatio, setChargeRatio] = useState(0); // 0 during stealth (0-3s), ramps 0->1 from 3s-10s
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  const cancelHold = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
    unlockedRef.current = false;
    setChargeRatio(0);
  }, []);

  const startHold = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancelHold();
      startRef.current = performance.now();

      const tick = (now: number) => {
        if (startRef.current === null || unlockedRef.current) return;
        const elapsed = now - startRef.current;

        if (elapsed >= holdMs) {
          unlockedRef.current = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([18, 35, 28]);
            } catch {
              // ignore unsupported vibrate
            }
          }
          setChargeRatio(0);
          startRef.current = null;
          rafRef.current = null;
          onUnlockRef.current();
          return;
        }

        if (elapsed > stealthMs) {
          const visible = Math.min(1, (elapsed - stealthMs) / (holdMs - stealthMs));
          setChargeRatio(visible);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [cancelHold, holdMs, stealthMs]
  );

  useEffect(() => cancelHold, [cancelHold]);

  const bind = {
    onPointerDown: startHold,
    onPointerUp: cancelHold,
    onPointerLeave: cancelHold,
    onPointerCancel: cancelHold,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  return { bind, chargeRatio };
}

// ===========================================================================
// 2. ISOLATED STUDIO GOLD DUST CANVAS (RUNS ONLY WHILE MODAL IS OPEN)
// ===========================================================================
function StudioDustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let mounted = true;
    let rafId: number | null = null;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = w < 768 ? 28 : 64;
    const specks = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.7 + Math.random() * 1.9,
      vy: 0.14 + Math.random() * 0.32,
      vx: (Math.random() - 0.5) * 0.22,
      alpha: 0.14 + Math.random() * 0.36,
      gold: Math.random() > 0.28,
    }));

    const frame = () => {
      if (!mounted) return;
      ctx.clearRect(0, 0, w, h);
      for (const s of specks) {
        s.y -= s.vy;
        s.x += s.vx;
        if (s.y < -10) {
          s.y = h + 10;
          s.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.fillStyle = s.gold
          ? `rgba(218, 182, 102, ${s.alpha})`
          : `rgba(190, 38, 62, ${s.alpha * 0.85})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    };

    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(frame);

    return () => {
      mounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
// 3. MAIN 3D PHYSICS HANGING CREATOR PASS MODAL (VARIANT 3A)
// ===========================================================================
export default function CreatorPassModal({ open, onClose }: CreatorPassModalProps) {
  const [closing, setClosing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [hoveredSocial, setHoveredSocial] = useState<'linkedin' | 'instagram' | null>(null);
  const [gyroNeedsPermission, setGyroNeedsPermission] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);

  // Direct DOM refs for butter-smooth 60fps physics without React re-renders
  const rigRef = useRef<HTMLDivElement>(null);
  const card3DRef = useRef<HTMLDivElement>(null);
  const sheenFrontRef = useRef<HTMLDivElement>(null);
  const sheenBackRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const strapOuterRef = useRef<SVGPathElement>(null);
  const strapStripeRef = useRef<SVGPathElement>(null);
  const strapWeaveRef = useRef<SVGPathElement>(null);

  const flippedRef = useRef(false);
  flippedRef.current = flipped;

  // Physics + Isolated Gyro + Pointer state
  const physRef = useRef({
    x: 0,
    y: -520,
    vx: 0,
    vy: 0,
    swing: -11,
    vSwing: 0,
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    gyroX: 0,
    gyroY: 0,
    glareX: 50,
    glareY: 30,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
    movedDist: 0,
    pointerId: -1,
    exiting: false,
  });

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    physRef.current.exiting = true;
    window.setTimeout(() => {
      setClosing(false);
      setFlipped(false);
      onClose();
    }, 340);
  }, [closing, onClose]);

  // Body scroll lock & Escape handler while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, handleClose]);

  // ISOLATED GYROSCOPE: Strictly active ONLY while modal is open; zero effect on website
  useEffect(() => {
    if (!open) return;

    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (DOE && typeof DOE.requestPermission === 'function' && !gyroEnabled) {
      setGyroNeedsPermission(true);
      return;
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const clampedGamma = Math.max(-28, Math.min(28, e.gamma));
      const clampedBeta = Math.max(-24, Math.min(24, e.beta - 45));
      physRef.current.gyroY = (clampedGamma / 28) * 16;
      physRef.current.gyroX = -(clampedBeta / 24) * 13;
    };

    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      physRef.current.gyroX = 0;
      physRef.current.gyroY = 0;
    };
  }, [open, gyroEnabled]);

  const requestIOSGyro = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    try {
      const res = await DOE?.requestPermission?.();
      if (res === 'granted') {
        setGyroEnabled(true);
        setGyroNeedsPermission(false);
      }
    } catch {
      setGyroNeedsPermission(false);
    }
  };

  // Main 60fps Spring-Pendulum + Lanyard Physics Loop
  useEffect(() => {
    if (!open) return;

    // Reset drop-in initial state for dramatic gravity entrance
    const p = physRef.current;
    p.x = 18;
    p.y = -480;
    p.vx = -2.2;
    p.vy = 14;
    p.swing = -10;
    p.vSwing = 0.6;
    p.rotX = 12;
    p.rotY = -10;
    p.targetRotX = 0;
    p.targetRotY = 0;
    p.dragging = false;
    p.exiting = false;

    let mounted = true;
    let rafId: number | null = null;

    const step = () => {
      if (!mounted) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isCompact = vh < 700 || vw < 420;
      const restTop = isCompact ? Math.max(88, vh * 0.14) : Math.max(122, vh * 0.18);

      if (p.exiting) {
        p.vy -= 4.2;
        p.y += p.vy;
        p.x *= 0.92;
        p.swing *= 0.9;
      } else if (!p.dragging) {
        // Spring return to equilibrium (0, 0)
        const k = 0.085;
        const damp = 0.86;
        const ax = -p.x * k;
        const ay = -p.y * k;
        p.vx = (p.vx + ax) * damp;
        p.vy = (p.vy + ay) * damp;
        p.x += p.vx;
        p.y += p.vy;

        // Coupled pendulum swing from horizontal acceleration & position
        const targetSwing = Math.max(-22, Math.min(22, -p.x * 0.095 - p.vx * 0.55));
        p.vSwing = (p.vSwing + (targetSwing - p.swing) * 0.11) * 0.85;
        p.swing += p.vSwing;
      } else {
        const targetSwing = Math.max(-24, Math.min(24, -p.x * 0.1));
        p.swing += (targetSwing - p.swing) * 0.18;
      }

      // Blend hover tilt + isolated mobile gyro
      const goalX = p.targetRotX + p.gyroX;
      const goalY = p.targetRotY + p.gyroY;
      p.rotX += (goalX - p.rotX) * 0.12;
      p.rotY += (goalY - p.rotY) * 0.12;

      const flipY = flippedRef.current ? 180 : 0;

      // Apply card rig translation + pendulum swing
      if (rigRef.current) {
        rigRef.current.style.transform = `translate3d(${p.x}px, ${restTop + p.y}px, 0) rotate(${p.swing}deg)`;
      }

      // Apply 3D tilt + flip
      if (card3DRef.current) {
        card3DRef.current.style.transform = `rotateX(${p.rotX}deg) rotateY(${p.rotY + flipY}deg)`;
      }

      // Dynamic holographic gold-crimson sheen follows tilt & cursor
      const gx = Math.max(0, Math.min(100, p.glareX + p.rotY * 1.8));
      const gy = Math.max(0, Math.min(100, p.glareY - p.rotX * 1.8));
      const sheenBg = `radial-gradient(360px circle at ${gx}% ${gy}%, rgba(255, 245, 224, 0.22) 0%, rgba(212, 175, 55, 0.14) 26%, rgba(168, 29, 50, 0.11) 52%, transparent 74%)`;
      if (sheenFrontRef.current) sheenFrontRef.current.style.background = sheenBg;
      if (sheenBackRef.current) sheenBackRef.current.style.background = sheenBg;

      // Overhead studio spotlight subtly tracks the swinging pass
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(calc(-50% + ${p.x * 0.32}px), 0, 0) rotate(${p.swing * 0.35}deg)`;
      }

      // Dynamic curved woven lanyard ribbon connecting top-center to moving clasp
      const anchorX = vw / 2;
      const claspX = vw / 2 + p.x;
      const claspY = restTop + p.y + 8;
      const ctrlX = anchorX + p.x * 0.35;
      const ctrlY = Math.max(20, claspY * 0.56);
      const pathD = `M ${anchorX} -40 Q ${ctrlX} ${ctrlY} ${claspX} ${claspY}`;

      if (strapOuterRef.current) strapOuterRef.current.setAttribute('d', pathD);
      if (strapStripeRef.current) strapStripeRef.current.setAttribute('d', pathD);
      if (strapWeaveRef.current) strapWeaveRef.current.setAttribute('d', pathD);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      mounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [open]);

  if (!open) return null;

  // Pointer drag + 3D hover handlers on card
  const onCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const p = physRef.current;
    p.dragging = true;
    p.pointerId = e.pointerId;
    p.dragStartX = e.clientX;
    p.dragStartY = e.clientY;
    p.dragOriginX = p.x;
    p.dragOriginY = p.y;
    p.movedDist = 0;
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const p = physRef.current;
    p.glareX = nx * 100;
    p.glareY = ny * 100;
    p.targetRotY = (nx - 0.5) * 24;
    p.targetRotX = -(ny - 0.5) * 18;

    if (p.dragging && p.pointerId === e.pointerId) {
      const dx = e.clientX - p.dragStartX;
      const dy = e.clientY - p.dragStartY;
      p.movedDist = Math.hypot(dx, dy);

      // Soft elastic clamp so lanyard feels taut & physical
      const maxX = Math.min(220, window.innerWidth * 0.36);
      const maxY = Math.min(170, window.innerHeight * 0.24);
      const nextX = p.dragOriginX + dx * 0.82;
      const nextY = p.dragOriginY + dy * 0.72;

      p.vx = nextX - p.x;
      p.vy = nextY - p.y;
      p.x = Math.max(-maxX, Math.min(maxX, nextX));
      p.y = Math.max(-90, Math.min(maxY, nextY));
    }
  };

  const onCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physRef.current;
    if (!p.dragging || p.pointerId !== e.pointerId) return;
    p.dragging = false;
    p.pointerId = -1;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore release error
    }

    // Crisp click/tap (< 8px movement) flips the card 180°
    if (p.movedDist < 8) {
      setFlipped((prev) => !prev);
      p.vSwing += flippedRef.current ? -2.4 : 2.4;
    }
  };

  const onCardPointerLeave = () => {
    const p = physRef.current;
    if (!p.dragging) {
      p.targetRotX = 0;
      p.targetRotY = 0;
      p.glareX = 50;
      p.glareY = 30;
    }
  };

  const cardSurfaceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    WebkitMaskImage: CARD_MASK_URL,
    maskImage: CARD_MASK_URL,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    backgroundColor: '#16171B',
    backgroundImage: `url("data:image/svg+xml,${LINEN_TEXTURE_SVG}"), linear-gradient(155deg, #24262C 0%, #17181D 46%, #0E0F13 100%)`,
    overflow: 'hidden',
    color: '#F3F1EC',
  };

  const renderNotchedRimSvg = (idSuffix: string) => (
    <svg
      viewBox="0 0 310 470"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      <defs>
        <linearGradient id={`cp-rim-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(224, 191, 128, 0.72)" />
          <stop offset="35%" stopColor="rgba(255, 255, 255, 0.22)" />
          <stop offset="68%" stopColor="rgba(168, 29, 50, 0.55)" />
          <stop offset="100%" stopColor="rgba(212, 175, 55, 0.58)" />
        </linearGradient>
      </defs>
      <path d={NOTCHED_PATH} fill="none" stroke={`url(#cp-rim-${idSuffix})`} strokeWidth="2" />
      {/* Top Metallic Grommet Ring */}
      <circle cx="155" cy="28" r="14.5" fill="none" stroke="#3B3E47" strokeWidth="5.5" />
      <circle cx="155" cy="28" r="16.5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <circle cx="155" cy="28" r="11.5" fill="none" stroke="rgba(0,0,0,0.78)" strokeWidth="1.5" />
    </svg>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Samrat Sandilya Founding Architect Pass"
      onClick={handleClose}
      className={closing ? 'cp-backdrop cp-backdrop-out' : 'cp-backdrop'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background:
          'radial-gradient(circle at 50% 18%, rgba(30, 22, 26, 0.88) 0%, rgba(7, 10, 18, 0.96) 58%, rgba(3, 5, 11, 0.99) 100%)',
        backdropFilter: 'blur(22px) saturate(150%)',
        WebkitBackdropFilter: 'blur(22px) saturate(150%)',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sacramento&display=swap');

        @keyframes cpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cpFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes cpOrbitSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes cpOrbitReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }

        .cp-backdrop { animation: cpFadeIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .cp-backdrop-out { animation: cpFadeOut 0.34s ease forwards; }

        .cp-social-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          color: #F3F1EC;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .cp-social-btn:hover {
          background: #F3F1EC;
          color: #111318;
          border-color: #E2C382;
          transform: translateY(-2px) scale(1.06);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
        }

        .cp-top-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.32);
          background: rgba(15, 18, 28, 0.72);
          color: rgba(243, 241, 236, 0.85);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.25s ease;
        }
        .cp-top-pill:hover {
          border-color: rgba(212, 175, 55, 0.8);
          color: #FFFFFF;
          background: rgba(168, 29, 50, 0.38);
        }
      `}</style>

      {/* Floating Studio Gold/Crimson Dust */}
      <StudioDustCanvas />

      {/* Overhead Volumetric Spotlight Beam */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          width: 'min(760px, 130vw)',
          height: '82vh',
          transformOrigin: 'top center',
          background:
            'conic-gradient(from 180deg at 50% 0%, transparent 142deg, rgba(224, 188, 120, 0.14) 166deg, rgba(255, 246, 224, 0.2) 180deg, rgba(168, 29, 50, 0.11) 194deg, transparent 218deg)',
          filter: 'blur(26px)',
          pointerEvents: 'none',
          zIndex: 2,
          willChange: 'transform',
        }}
      />

      {/* Faint Rotating Shunya (Zero) Orbital Rings */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '54%',
          left: '50%',
          width: 'min(540px, 92vw)',
          height: 'min(540px, 92vw)',
          borderRadius: '50%',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'cpOrbitSlow 52s linear infinite',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-3px',
            left: '50%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#D4AF37',
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.85)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '54%',
          left: '50%',
          width: 'min(390px, 72vw)',
          height: 'min(390px, 72vw)',
          borderRadius: '50%',
          border: '1px dashed rgba(168, 29, 50, 0.16)',
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'cpOrbitReverse 38s linear infinite',
        }}
      />

      {/* Top Controls (Close + Optional iOS Gyro Enable) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 30,
        }}
      >
        {gyroNeedsPermission && (
          <button type="button" onClick={requestIOSGyro} className="cp-top-pill">
            <span>ENABLE TILT</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Creator Pass"
          className="cp-top-pill"
          style={{ padding: '8px 13px' }}
        >
          <span>ESC ✕</span>
        </button>
      </div>

      {/* Dynamic Physics Woven Charcoal + Crimson Lanyard Strap */}
      <svg
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'visible',
        }}
      >
        {/* Dark Charcoal Outer Ribbon */}
        <path
          ref={strapOuterRef}
          d="M 0 -40 Q 0 50 0 120"
          fill="none"
          stroke="#22252C"
          strokeWidth="36"
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.65))' }}
        />
        {/* Deep Crimson Woven Center Stripe */}
        <path
          ref={strapStripeRef}
          d="M 0 -40 Q 0 50 0 120"
          fill="none"
          stroke="#7E1727"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        {/* Woven Fabric Cross-Ribbing Texture */}
        <path
          ref={strapWeaveRef}
          d="M 0 -40 Q 0 50 0 120"
          fill="none"
          stroke="rgba(255, 255, 255, 0.11)"
          strokeWidth="34"
          strokeDasharray="2 3"
          strokeLinecap="butt"
        />
      </svg>

      {/* Hanging Rig (Clasp + 3D Flippable Card) */}
      <div
        ref={rigRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          marginLeft: 'calc(min(310px, 84vw) / -2)',
          width: 'min(310px, 84vw)',
          transformOrigin: '50% 0%',
          zIndex: 15,
          willChange: 'transform',
        }}
      >
        {/* Brushed Gunmetal Swivel Clasp Assembly */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            width: '56px',
            height: '58px',
            margin: '0 auto -22px auto',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 56 58" width="56" height="58" fill="none">
            <defs>
              <linearGradient id="cp-gunmetal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E2026" />
                <stop offset="35%" stopColor="#5C616E" />
                <stop offset="65%" stopColor="#262930" />
                <stop offset="100%" stopColor="#14161A" />
              </linearGradient>
            </defs>
            {/* D-Ring Buckle */}
            <path
              d="M 10 6 H 46 C 46 18 39 24 28 24 C 17 24 10 18 10 6 Z"
              stroke="url(#cp-gunmetal)"
              strokeWidth="4.5"
              fill="none"
            />
            {/* Swivel Barrel */}
            <rect x="23" y="22" width="10" height="9" rx="3" fill="url(#cp-gunmetal)" />
            {/* Lobster Hook */}
            <path
              d="M 28 31 C 34 31 36 42 32 51 C 30 55 26 55 24 51 C 21 45 24 38 28 36"
              stroke="url(#cp-gunmetal)"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <circle cx="28" cy="26.5" r="2" fill="#9CA3AF" />
          </svg>
        </div>

        {/* 3D Perspective Stage */}
        <div
          onPointerDown={onCardPointerDown}
          onPointerMove={onCardPointerMove}
          onPointerUp={onCardPointerUp}
          onPointerLeave={onCardPointerLeave}
          style={{
            width: '100%',
            aspectRatio: '310 / 470',
            perspective: '1300px',
            cursor: 'grab',
            touchAction: 'none',
            filter: 'drop-shadow(0 32px 46px rgba(0, 0, 0, 0.72))',
          }}
        >
          <div
            ref={card3DRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            }}
          >
            {/* ============================================================= */}
            {/* FRONT FACE — VARIANT 3A                                       */}
            {/* ============================================================= */}
            <div style={cardSurfaceStyle}>
              {renderNotchedRimSvg('front')}

              {/* Left Matte Panel + Razor-Thin Crimson Vertical Accent Stripe */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: '12.5%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.22) 100%)',
                  zIndex: 2,
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '12.5%',
                  width: '4px',
                  background: 'linear-gradient(180deg, #C8233C 0%, #8E1628 52%, #B51E35 100%)',
                  boxShadow: '0 0 12px rgba(181, 30, 53, 0.45)',
                  zIndex: 3,
                }}
              />

              {/* Cursor / Gyro Reactive Holographic Sheen */}
              <div
                ref={sheenFrontRef}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 6,
                  mixBlendMode: 'screen',
                }}
              />

              {/* Front Content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 7,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20% 9% 6.5% 20.5%',
                  textAlign: 'left',
                }}
              >
                {/* Upper Metadata Block */}
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.22em',
                      color: 'rgba(243, 241, 236, 0.78)',
                      marginBottom: '18px',
                    }}
                  >
                    FOUNDING ARCHITECT
                  </div>

                  {/* Role Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      alignItems: 'baseline',
                      gap: '8px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.14em',
                        color: 'rgba(243, 241, 236, 0.45)',
                      }}
                    >
                      ROLE
                    </span>
                    <span
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#F5F3EE',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Lead Web Architect
                    </span>
                  </div>

                  {/* Pass ID Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      alignItems: 'baseline',
                      gap: '8px',
                      paddingTop: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.14em',
                        color: 'rgba(243, 241, 236, 0.45)',
                      }}
                    >
                      PASS ID
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '0.09em',
                        color: '#E6D6B3',
                      }}
                    >
                      SR-ARCH-001
                    </span>
                  </div>
                </div>

                {/* Middle Autograph Signature Section */}
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9.5px',
                      letterSpacing: '0.2em',
                      color: 'rgba(243, 241, 236, 0.65)',
                      marginBottom: '2px',
                    }}
                  >
                    DESIGNED &amp; CRAFTED BY
                  </div>

                  <div
                    style={{
                      fontFamily: "'Sacramento', cursive",
                      fontSize: 'clamp(40px, 11vw, 50px)',
                      lineHeight: 0.88,
                      color: '#F8F6F0',
                      fontWeight: 400,
                      margin: '6px 0 12px -4px',
                      textShadow: '0 2px 14px rgba(255, 255, 255, 0.14)',
                    }}
                  >
                    <span style={{ display: 'block' }}>Samrat</span>
                    <span style={{ display: 'block', paddingLeft: '14px' }}>Sandilya</span>
                  </div>

                  {/* Subtitle + Dot Matrix Accent */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '8.5px',
                        letterSpacing: '0.14em',
                        color: 'rgba(243, 241, 236, 0.5)',
                      }}
                    >
                      WEB ARCHITECT • SANRACHNA
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '32px',
                        height: '12px',
                        backgroundImage:
                          'radial-gradient(rgba(212, 175, 55, 0.45) 1px, transparent 1px)',
                        backgroundSize: '4px 4px',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </div>

                {/* Perforated Divider + Connect Stub */}
                <div>
                  <div
                    aria-hidden="true"
                    style={{
                      marginLeft: '-26%',
                      marginRight: '-12%',
                      borderTop: '1.5px dashed rgba(243, 241, 236, 0.22)',
                      marginBottom: '13px',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a
                        href={LINKEDIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Samrat Sandilya on LinkedIn"
                        className="cp-social-btn"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={() => setHoveredSocial('linkedin')}
                        onMouseLeave={() => setHoveredSocial(null)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                      </a>

                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Samrat Sandilya on Instagram"
                        className="cp-social-btn"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={() => setHoveredSocial('instagram')}
                        onMouseLeave={() => setHoveredSocial(null)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </a>
                    </div>

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        color: hoveredSocial ? '#E2C382' : 'rgba(243, 241, 236, 0.42)',
                        transition: 'color 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hoveredSocial === 'linkedin'
                        ? '/in/samrat-sandilya'
                        : hoveredSocial === 'instagram'
                        ? '@samrat.tiwary'
                        : 'TAP TO FLIP ↻'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* BACK FACE — CREATOR MANIFESTO & PERMANENT SPEC                */}
            {/* ============================================================= */}
            <div
              style={{
                ...cardSurfaceStyle,
                transform: 'rotateY(180deg)',
              }}
            >
              {renderNotchedRimSvg('back')}

              {/* Mirrored Crimson Accent Stripe on Right Edge */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '12.5%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.22) 100%)',
                  zIndex: 2,
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: '12.5%',
                  width: '4px',
                  background: 'linear-gradient(180deg, #C8233C 0%, #8E1628 52%, #B51E35 100%)',
                  boxShadow: '0 0 12px rgba(181, 30, 53, 0.45)',
                  zIndex: 3,
                }}
              />

              <div
                ref={sheenBackRef}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 6,
                  mixBlendMode: 'screen',
                }}
              />

              {/* Back Content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 7,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20% 20.5% 6.5% 9.5%',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9.5px',
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      color: '#E2C382',
                      marginBottom: '16px',
                    }}
                  >
                    CREATOR MANIFESTO // 001
                  </div>

                  {/* Timeless Editorial Quote */}
                  <blockquote
                    style={{
                      margin: 0,
                      paddingLeft: '12px',
                      borderLeft: '2px solid #B51E35',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: '21px',
                      lineHeight: 1.32,
                      color: '#F8F6F0',
                    }}
                  >
                    &ldquo;Architected from Shunya. Built beyond editions.&rdquo;
                  </blockquote>
                </div>

                {/* 2-Column Technical Spec Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px 12px',
                    paddingTop: '14px',
                    paddingBottom: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {[
                    { k: 'STACK', v: 'React • TS • Motion' },
                    { k: 'SYSTEM', v: 'Sanrachna Portal' },
                    { k: 'ORIGIN', v: 'GEC Godda • 2026' },
                    { k: 'STATUS', v: 'Permanent Archive' },
                  ].map((item) => (
                    <div key={item.k}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '8px',
                          letterSpacing: '0.16em',
                          color: 'rgba(243, 241, 236, 0.45)',
                          marginBottom: '3px',
                        }}
                      >
                        {item.k}
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#F3F1EC' }}>
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Perforated Bottom Stub — Micro-Barcode + Flip Back */}
                <div>
                  <div
                    aria-hidden="true"
                    style={{
                      marginLeft: '-12%',
                      marginRight: '-26%',
                      borderTop: '1.5px dashed rgba(243, 241, 236, 0.22)',
                      marginBottom: '12px',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      {/* Crisp Micro-Barcode */}
                      <div
                        aria-hidden="true"
                        style={{
                          width: '96px',
                          height: '18px',
                          backgroundImage:
                            'repeating-linear-gradient(90deg, rgba(243,241,236,0.85) 0 2px, transparent 2px 4px, rgba(243,241,236,0.85) 4px 5px, transparent 5px 8px, rgba(226,195,130,0.8) 8px 11px, transparent 11px 13px)',
                          marginBottom: '4px',
                        }}
                      />
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '8px',
                          letterSpacing: '0.12em',
                          color: 'rgba(243, 241, 236, 0.5)',
                        }}
                      >
                        SR-ARCH-001 // VERIFIED
                      </div>
                    </div>

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        color: '#E2C382',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ↻ FRONT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Hint */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10.5px',
          letterSpacing: '0.16em',
          color: 'rgba(243, 241, 236, 0.45)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        DRAG TO SWING • TAP TO FLIP
      </div>
    </div>
  );
}
