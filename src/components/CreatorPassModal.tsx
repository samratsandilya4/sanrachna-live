import React, { useEffect, useRef, useState, useCallback } from 'react';

type LightingMode = 'storm-lamp' | 'moonlight' | 'morning';
type ScenePhase = 'intro' | 'desk';

export interface CreatorPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  hasIntroVideo?: boolean;
}

export function useCreatorPassTrigger(
  firstArg?: (() => void) | number,
  secondArg?: (() => void) | number,
  thirdArg?: unknown
) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [chargeRatio, setChargeRatio] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const unlockCallback =
    typeof firstArg === 'function'
      ? firstArg
      : typeof secondArg === 'function'
      ? secondArg
      : undefined;

  const callbackRef = useRef(unlockCallback);
  callbackRef.current = unlockCallback;

  const duration =
    typeof firstArg === 'number' && firstArg >= 200
      ? firstArg
      : typeof secondArg === 'number' && secondArg >= 200
      ? secondArg
      : typeof thirdArg === 'number' && thirdArg >= 200
      ? thirdArg
      : 1200;

  const cancelHold = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setChargeRatio(0);
  }, []);

  const startHold = useCallback(() => {
    cancelHold();
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (startTimeRef.current === null) return;
      const elapsed = now - startTimeRef.current;
      const ratio = Math.min(elapsed / duration, 1);
      setChargeRatio(ratio);

      if (ratio >= 1) {
        cancelHold();
        setIsOpen(true);
        callbackRef.current?.();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [cancelHold, duration]);

  useEffect(() => cancelHold, [cancelHold]);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const bind = {
    onMouseDown: startHold,
    onMouseUp: cancelHold,
    onMouseLeave: cancelHold,
    onTouchStart: startHold,
    onTouchEnd: cancelHold,
    onTouchCancel: cancelHold,
  };

  return {
    isOpen,
    setIsOpen,
    open: openModal,
    close: closeModal,
    openModal,
    closeModal,
    isHolding,
    chargeRatio,
    holdProgress: chargeRatio,
    bind,
    triggerProps: bind,
    handlers: bind,
  };
}

const ASSETS = {
  intro: '/creator-scene/intro-desktop.mp4',
  desktop: {
    video: '/creator-scene/loop-desktop.mp4',
    poster: '/creator-scene/desk-desktop.png',
    fallbackRatio: 16 / 9,
    chain: { left: 72, top: 0, width: 7.5, height: 37 },
    pen: { left: 32, top: 77, width: 13, height: 15 },
    plane: { left: 20, top: 62, width: 17, height: 13 },
    rightPage: {
      left: 56.5,
      top: 56.5,
      width: 24,
      height: 26,
      transform: 'perspective(850px) rotateX(34deg) rotateY(4deg) rotateZ(-17deg) skewX(15deg)',
    },
  },
  mobile: {
    video: '/creator-scene/loop-mobile.mp4',
    poster: '/creator-scene/desk-mobile.png',
    fallbackRatio: 9 / 16,
    chain: { left: 76, top: 0, width: 13, height: 30 },
    pen: { left: 12, top: 72, width: 27, height: 11 },
    plane: { left: 2, top: 58, width: 30, height: 12 },
    rightPage: {
      left: 55,
      top: 59,
      width: 38,
      height: 21,
      transform: 'perspective(700px) rotateX(35deg) rotateY(3deg) rotateZ(-18deg) skewX(12deg)',
    },
  },
};

class AmbienceAudio {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private isMuted = false;

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 640;
    bandpass.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = this.isMuted ? 0 : 0.14;

    noise.connect(bandpass);
    bandpass.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    noise.start();
  }

  setRainLevel(level: number) {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(this.isMuted ? 0 : level, this.ctx.currentTime, 0.4);
  }

  setMuted(muted: boolean, level: number) {
    this.isMuted = muted;
    this.setRainLevel(level);
  }

  playChainClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.045);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playPaperRustle(volume = 0.09, duration = 0.28) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const size = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / size) * Math.PI);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  playThunder(volume = 0.36) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const size = Math.floor(this.ctx.sampleRate * 2.2);
    const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < size; i++) {
      const env = Math.exp(-i / (this.ctx.sampleRate * 0.7));
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 5 * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 140;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  stop() {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.rainGain = null;
    }
  }
}

export const CreatorPassModal: React.FC<CreatorPassModalProps> = ({
  isOpen = true,
  onClose,
  hasIntroVideo = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [phase, setPhase] = useState<ScenePhase>(hasIntroVideo ? 'intro' : 'desk');
  const [mode, setMode] = useState<LightingMode>('storm-lamp');
  const [showContact, setShowContact] = useState(false);
  const [inkVisible, setInkVisible] = useState(false);
  const [chainPulling, setChainPulling] = useState(false);
  const [lightningAlpha, setLightningAlpha] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [mediaRatio, setMediaRatio] = useState<number>(16 / 9);
  const [viewport, setViewport] = useState({ w: 1280, h: 720 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [curlOverlap, setCurlOverlap] = useState(0);

  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const deskVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<AmbienceAudio | null>(null);
  const handoffDoneRef = useRef(false);
  const flutterPlayedRef = useRef(false);

  const triggerInkReveal = useCallback(() => {
    setInkVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInkVisible(true));
    });
  }, []);

  // Lock background scroll & support Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    handoffDoneRef.current = !hasIntroVideo;
    flutterPlayedRef.current = false;
    setVideoFailed(false);
    setPhase(hasIntroVideo ? 'intro' : 'desk');
    setShowContact(false);
    setMode('storm-lamp');
    triggerInkReveal();
  }, [isOpen, hasIntroVideo, triggerInkReveal]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ w, h });
      const mobile = h > w || w < 768;
      setIsMobile(mobile);
      setVideoFailed(false);
      setMediaRatio(mobile ? ASSETS.mobile.fallbackRatio : ASSETS.desktop.fallbackRatio);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const audio = new AmbienceAudio();
    audioRef.current = audio;

    const unlock = () => audio.start();
    window.addEventListener('pointerdown', unlock, { once: true });
    audio.start();

    return () => {
      window.removeEventListener('pointerdown', unlock);
      audio.stop();
      audioRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const level = mode === 'morning' ? 0.025 : mode === 'moonlight' ? 0.19 : 0.14;
    audioRef.current?.setRainLevel(level);
  }, [mode]);

  // Sync left-page wind lift (2.85s - 4.05s) on desktop loop video
  useEffect(() => {
    if (!isOpen || phase !== 'desk' || isMobile || videoFailed) {
      setCurlOverlap(0);
      return;
    }

    let rafId = 0;
    const syncToVideo = () => {
      const v = deskVideoRef.current;
      if (v && !v.paused) {
        const t = v.currentTime;
        if (t < 1.0) flutterPlayedRef.current = false;

        if (t >= 2.85 && t < 3.15 && !flutterPlayedRef.current) {
          flutterPlayedRef.current = true;
          audioRef.current?.playPaperRustle(0.08, 0.55);
        }

        if (t >= 3.05 && t <= 4.05) {
          const progress = (t - 3.05) / 1.0;
          setCurlOverlap(Math.sin(progress * Math.PI));
        } else {
          setCurlOverlap((prev) => (prev !== 0 ? 0 : prev));
        }
      }
      rafId = requestAnimationFrame(syncToVideo);
    };

    rafId = requestAnimationFrame(syncToVideo);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, phase, isMobile, videoFailed]);

  const triggerIntroHandoff = useCallback(() => {
    if (handoffDoneRef.current) return;
    handoffDoneRef.current = true;

    setLightningAlpha(0.92);
    audioRef.current?.playThunder(0.42);
    deskVideoRef.current?.play().catch(() => {});

    window.setTimeout(() => {
      setPhase('desk');
      triggerInkReveal();
    }, 90);
    window.setTimeout(() => setLightningAlpha(0.18), 160);
    window.setTimeout(() => setLightningAlpha(0.55), 240);
    window.setTimeout(() => setLightningAlpha(0), 420);
  }, [triggerInkReveal]);

  useEffect(() => {
    if (!isOpen || phase !== 'desk' || mode === 'morning') return;
    let timerId = 0;
    const schedule = () => {
      const delay = (mode === 'moonlight' ? 5000 : 9500) + Math.random() * 6500;
      timerId = window.setTimeout(() => {
        setLightningAlpha(mode === 'moonlight' ? 0.6 : 0.35);
        window.setTimeout(() => setLightningAlpha(0.08), 80);
        window.setTimeout(() => setLightningAlpha(mode === 'moonlight' ? 0.45 : 0.25), 150);
        window.setTimeout(() => setLightningAlpha(0), 340);
        window.setTimeout(() => audioRef.current?.playThunder(0.32), 260);
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timerId);
  }, [isOpen, phase, mode]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || phase !== 'desk') return;
      const nx = (e.clientX / viewport.w - 0.5) * 2;
      const ny = (e.clientY / viewport.h - 0.5) * 2;
      setParallax({ x: -nx * 6, y: -ny * 4 });
    },
    [isMobile, phase, viewport]
  );

  const handleChainPull = () => {
    audioRef.current?.start();
    audioRef.current?.playChainClick();
    setChainPulling(true);
    window.setTimeout(() => setChainPulling(false), 240);
    setMode((prev) =>
      prev === 'storm-lamp' ? 'moonlight' : prev === 'moonlight' ? 'morning' : 'storm-lamp'
    );
  };

  const handlePenTap = () => {
    audioRef.current?.start();
    audioRef.current?.playPaperRustle(0.09, 0.24);
    triggerInkReveal();
  };

  const handlePlaneTap = () => {
    audioRef.current?.start();
    audioRef.current?.playPaperRustle(0.11, 0.22);
  };

  const handleContactToggle = () => {
    audioRef.current?.start();
    audioRef.current?.playPaperRustle(0.09, 0.22);
    setShowContact((s) => !s);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const level = mode === 'morning' ? 0.025 : mode === 'moonlight' ? 0.19 : 0.14;
    audioRef.current?.setMuted(next, level);
  };

  if (!isOpen) return null;

  const cfg = isMobile ? ASSETS.mobile : ASSETS.desktop;
  const vpRatio = viewport.w / Math.max(viewport.h, 1);
  const overscan = isMobile ? 1.03 : 1.07;
  const stageW = vpRatio > mediaRatio ? viewport.w * overscan : viewport.h * mediaRatio * overscan;
  const stageH = stageW / mediaRatio;

  const lightingFilter =
    mode === 'moonlight'
      ? 'brightness(0.55) contrast(1.18) saturate(0.6) hue-rotate(175deg)'
      : mode === 'morning'
      ? 'brightness(1.16) contrast(1.04) saturate(1.18) sepia(0.24)'
      : 'brightness(0.98) contrast(1.05) saturate(0.98)';

  const occludedLeftPct = (curlOverlap * 36).toFixed(1);

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#060504',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Minimal Corner Controls */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {phase === 'intro' && (
          <button
            type="button"
            onClick={triggerIntroHandoff}
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '999px',
              border: '1px solid rgba(217, 199, 163, 0.28)',
              background: 'rgba(0, 0, 0, 0.38)',
              color: 'rgba(245, 229, 196, 0.85)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute ambience' : 'Mute ambience'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid rgba(217, 199, 163, 0.25)',
            background: 'rgba(0, 0, 0, 0.35)',
            color: 'rgba(245, 229, 196, 0.85)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {muted ? '✕♪' : '♪'}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid rgba(217, 199, 163, 0.25)',
            background: 'rgba(0, 0, 0, 0.35)',
            color: 'rgba(245, 229, 196, 0.9)',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Optional Phase 1: Intro Flight Video */}
      {phase === 'intro' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={introVideoRef}
            src={ASSETS.intro}
            autoPlay
            muted
            playsInline
            preload="auto"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration && v.duration - v.currentTime <= 0.28) {
                triggerIntroHandoff();
              }
            }}
            onEnded={triggerIntroHandoff}
            onError={triggerIntroHandoff}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Aspect-Locked Living Desk Stage */}
      <div
        style={{
          width: `${stageW}px`,
          height: `${stageH}px`,
          position: 'relative',
          flexShrink: 0,
          transform: `translate3d(${parallax.x}px, ${parallax.y + (chainPulling ? 2 : 0)}px, 0)`,
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {!videoFailed ? (
          <video
            ref={deskVideoRef}
            key={cfg.video}
            src={cfg.video}
            poster={cfg.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setMediaRatio(v.videoWidth / v.videoHeight);
              }
            }}
            onError={() => setVideoFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              filter: lightingFilter,
              transition: 'filter 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        ) : (
          <img
            src={cfg.poster}
            alt="Sanrachna vintage desk"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setMediaRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              filter: lightingFilter,
              transition: 'filter 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}

        {/* Golden Morning Sunbeam Grade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: mode === 'morning' ? 0.52 : 0,
            transition: 'opacity 1s ease',
            background:
              'linear-gradient(128deg, rgba(255,214,132,0.5) 10%, rgba(255,190,95,0.16) 46%, transparent 75%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Subtle 35mm Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at center, transparent 52%, rgba(5,4,3,0.62) 100%)',
          }}
        />

        {/* RIGHT PAGE — Flat Ink Layer with Live Left-Page Curl Occlusion */}
        {phase === 'desk' && (
          <div
            style={{
              position: 'absolute',
              left: `${cfg.rightPage.left}%`,
              top: `${cfg.rightPage.top}%`,
              width: `${cfg.rightPage.width}%`,
              height: `${cfg.rightPage.height}%`,
              transform: cfg.rightPage.transform,
              transformOrigin: 'center center',
              mixBlendMode: 'multiply',
              clipPath: `inset(0% 0% 0% ${occludedLeftPct}%)`,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '6%',
              color: '#1f130a',
              boxSizing: 'border-box',
            }}
          >
            {curlOverlap > 0.02 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: `linear-gradient(95deg, rgba(20,11,5,${(
                    curlOverlap * 0.42
                  ).toFixed(2)}) 0%, rgba(20,11,5,${(curlOverlap * 0.14).toFixed(
                    2
                  )}) 48%, transparent 78%)`,
                }}
              />
            )}

            {!showContact ? (
              <div
                style={{
                  opacity: inkVisible ? 0.9 : 0,
                  clipPath: inkVisible ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  transition:
                    'opacity 1.3s ease-out, clip-path 1.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  margin: 'auto 0',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: 'clamp(8px, 1.05vw, 14px)',
                    letterSpacing: '0.04em',
                    opacity: 0.8,
                  }}
                >
                  Designed &amp; Curated by
                </span>

                <h2
                  style={{
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: 'clamp(18px, 3.2vw, 46px)',
                    lineHeight: 1.06,
                    color: '#180e07',
                    margin: '2% 0',
                    fontWeight: 400,
                  }}
                >
                  Samrat Sandilya
                </h2>

                <div
                  style={{
                    width: '70%',
                    height: '1px',
                    backgroundColor: 'rgba(36, 21, 10, 0.45)',
                    margin: '2% 0',
                  }}
                />

                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 'clamp(6px, 0.75vw, 10px)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.24em',
                    opacity: 0.75,
                  }}
                >
                  Built From Scratch · संRACHNA
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  margin: 'auto 0',
                  gap: '6px',
                  textAlign: 'left',
                  paddingLeft: '6%',
                  pointerEvents: 'auto',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(7px, 0.85vw, 11px)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    opacity: 0.75,
                  }}
                >
                  Correspondence
                </p>
                <a
                  href="mailto:samratsandilya4@gmail.com"
                  style={{
                    color: '#1f130a',
                    fontStyle: 'italic',
                    fontSize: 'clamp(9px, 1.1vw, 15px)',
                    textDecoration: 'underline',
                    opacity: 0.88,
                  }}
                >
                  Email ↗
                </a>
                <a
                  href="https://www.linkedin.com/in/samrat-sandilya"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#1f130a',
                    fontStyle: 'italic',
                    fontSize: 'clamp(9px, 1.1vw, 15px)',
                    textDecoration: 'underline',
                    opacity: 0.88,
                  }}
                >
                  LinkedIn ↗
                </a>
                <a
                  href="https://www.instagram.com/samrat.tiwary"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#1f130a',
                    fontStyle: 'italic',
                    fontSize: 'clamp(9px, 1.1vw, 15px)',
                    textDecoration: 'underline',
                    opacity: 0.88,
                  }}
                >
                  Instagram ↗
                </a>
              </div>
            )}

            {/* Bottom Row: Crimson Wax Seal + Contact Corner Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                pointerEvents: 'auto',
                paddingTop: '4px',
              }}
            >
              <div
                style={{
                  width: 'clamp(20px, 2.8vw, 36px)',
                  height: 'clamp(20px, 2.8vw, 36px)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'radial-gradient(circle at 35% 32%, #7c1f1f 0%, #4d0e0e 65%, #2b0606 100%)',
                  boxShadow:
                    'inset 0 1px 3px rgba(255,160,140,0.22), 0 2px 5px rgba(15,6,2,0.55)',
                  mixBlendMode: 'normal',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: 'rgba(201, 139, 131, 0.88)',
                    fontWeight: 600,
                    fontSize: 'clamp(9px, 1.2vw, 16px)',
                  }}
                >
                  S
                </span>
              </div>

              <button
                type="button"
                onClick={handleContactToggle}
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(7px, 0.85vw, 11px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(34, 20, 10, 0.88)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                {showContact ? '← Return' : 'Contact ↻'}
              </button>
            </div>
          </div>
        )}

        {/* Invisible Real-World Interactive Hitboxes */}
        {phase === 'desk' && (
          <>
            <button
              type="button"
              onClick={handleChainPull}
              title="Pull brass chain"
              aria-label="Pull brass chain to change lighting"
              style={{
                position: 'absolute',
                left: `${cfg.chain.left}%`,
                top: `${cfg.chain.top}%`,
                width: `${cfg.chain.width}%`,
                height: `${cfg.chain.height}%`,
                zIndex: 20,
                cursor: 'grab',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handlePenTap}
              title="Rewrite ink"
              aria-label="Replay calligraphy ink animation"
              style={{
                position: 'absolute',
                left: `${cfg.pen.left}%`,
                top: `${cfg.pen.top}%`,
                width: `${cfg.pen.width}%`,
                height: `${cfg.pen.height}%`,
                zIndex: 20,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handlePlaneTap}
              title="Paper plane"
              aria-label="Rustle paper plane"
              style={{
                position: 'absolute',
                left: `${cfg.plane.left}%`,
                top: `${cfg.plane.top}%`,
                width: `${cfg.plane.width}%`,
                height: `${cfg.plane.height}%`,
                zIndex: 20,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          </>
        )}
      </div>

      {/* Global Lightning Flash Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          pointerEvents: 'none',
          opacity: lightningAlpha,
          transition: 'opacity 75ms linear',
          background:
            'radial-gradient(circle at 42% 28%, rgba(225,238,255,0.98) 0%, rgba(145,182,235,0.45) 48%, transparent 82%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default CreatorPassModal;
