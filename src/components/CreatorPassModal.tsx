import React, { useEffect, useRef, useState, useCallback } from 'react';

type LightingMode = 'storm-lamp' | 'moonlight' | 'morning';
type ScenePhase = 'intro' | 'desk';

export interface CreatorPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  hasIntroVideo?: boolean;
}

// Hold-to-charge trigger hook used in App.tsx
export function useCreatorPassTrigger(holdDurationMs = 1400) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const cancelHold = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    cancelHold();
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (startTimeRef.current === null) return;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / holdDurationMs, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        cancelHold();
        setIsOpen(true);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [cancelHold, holdDurationMs]);

  useEffect(() => cancelHold, [cancelHold]);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const triggerProps = {
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
    holdProgress,
    triggerProps,
    handlers: triggerProps,
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
      if (this.ctx.state === 'suspended') this.ctx.resume();
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
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 1900;
    hp.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(hp);
    hp.connect(gain);
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
      this.ctx.close();
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

  useEffect(() => {
    if (!isOpen) return;
    handoffDoneRef.current = !hasIntroVideo;
    flutterPlayedRef.current = false;
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

  useEffect(() => {
    if (!isOpen || phase !== 'desk' || isMobile) {
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
  }, [isOpen, phase, isMobile]);

  const triggerIntroHandoff = useCallback(() => {
    if (handoffDoneRef.current) return;
    handoffDoneRef.current = true;

    setLightningAlpha(0.92);
    audioRef.current?.playThunder(0.42);
    deskVideoRef.current?.play().catch(() => {});

    setTimeout(() => {
      setPhase('desk');
      triggerInkReveal();
    }, 90);
    setTimeout(() => setLightningAlpha(0.18), 160);
    setTimeout(() => setLightningAlpha(0.55), 240);
    setTimeout(() => setLightningAlpha(0), 420);
  }, [triggerInkReveal]);

  useEffect(() => {
    if (!isOpen || phase !== 'desk' || mode === 'morning') return;
    let timerId: number;
    const schedule = () => {
      const delay = (mode === 'moonlight' ? 5000 : 9500) + Math.random() * 6500;
      timerId = window.setTimeout(() => {
        setLightningAlpha(mode === 'moonlight' ? 0.6 : 0.35);
        setTimeout(() => setLightningAlpha(0.08), 80);
        setTimeout(() => setLightningAlpha(mode === 'moonlight' ? 0.45 : 0.25), 150);
        setTimeout(() => setLightningAlpha(0), 340);
        setTimeout(() => audioRef.current?.playThunder(0.32), 260);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timerId);
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
    setTimeout(() => setChainPulling(false), 240);
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
      className="fixed inset-0 z-[9999] bg-[#060504] overflow-hidden select-none flex items-center justify-center transition-opacity duration-500"
    >
      {/* Minimal Corner Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5">
        {phase === 'intro' && (
          <button
            onClick={triggerIntroHandoff}
            className="px-2.5 h-8 rounded-full text-[11px] uppercase tracking-[0.18em] text-[#d9c7a3]/65 hover:text-[#f5e5c4] bg-black/30 backdrop-blur-[2px] transition-colors"
          >
            Skip
          </button>
        )}
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute ambience' : 'Mute ambience'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#d9c7a3]/65 hover:text-[#f5e5c4] bg-black/30 backdrop-blur-[2px] transition-colors text-xs"
        >
          {muted ? '✕♪' : '♪'}
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#d9c7a3]/70 hover:text-[#f5e5c4] bg-black/30 backdrop-blur-[2px] transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Optional Phase 1: Intro Flight Video */}
      {phase === 'intro' && (
        <div className="fixed inset-0 z-30 bg-black flex items-center justify-center">
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
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Aspect-Locked Living Desk Video Stage */}
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
          style={{
            filter: lightingFilter,
            transition: 'filter 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="w-full h-full object-cover pointer-events-none"
        />

        {/* Golden Morning Sunbeam Grade */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            opacity: mode === 'morning' ? 0.52 : 0,
            background:
              'linear-gradient(128deg, rgba(255,214,132,0.5) 10%, rgba(255,190,95,0.16) 46%, transparent 75%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Subtle 35mm Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 52%, rgba(5,4,3,0.62) 100%)',
          }}
        />

        {/* RIGHT PAGE ONLY — Flat Ink Layer with Live Left-Page Curl Occlusion */}
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
            }}
            className="pointer-events-none flex flex-col justify-between p-[6%] text-[#1f130a]"
          >
            {curlOverlap > 0.02 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
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
                  transition: 'opacity 1.3s ease-out, clip-path 1.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="flex flex-col items-center justify-center text-center my-auto"
              >
                <span
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="italic text-[clamp(8px,1.05vw,14px)] tracking-wide opacity-80"
                >
                  Designed &amp; Curated by
                </span>

                <h2
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-[clamp(18px,3.2vw,46px)] leading-[1.06] text-[#180e07] my-[2%]"
                >
                  Samrat Sandilya
                </h2>

                <div className="w-[70%] h-[1px] bg-[#24150a]/45 my-[2%]" />

                <span
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="text-[clamp(6px,0.75vw,10px)] uppercase tracking-[0.24em] opacity-75"
                >
                  Built From Scratch · संRACHNA
                </span>
              </div>
            ) : (
              <div
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="flex flex-col justify-center my-auto space-y-[4%] text-left pl-[6%] pointer-events-auto"
              >
                <p className="text-[clamp(7px,0.85vw,11px)] uppercase tracking-[0.22em] opacity-75">
                  Correspondence
                </p>
                <a
                  href="mailto:samratsandilya4@gmail.com"
                  className="block italic text-[clamp(9px,1.1vw,15px)] underline decoration-[#26160b]/40 hover:opacity-100 opacity-85"
                >
                  Email ↗
                </a>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="block italic text-[clamp(9px,1.1vw,15px)] underline decoration-[#26160b]/40 hover:opacity-100 opacity-85"
                >
                  GitHub ↗
                </a>
                <a
                  href="https://www.linkedin.com/in/samrat-sandilya"
                  target="_blank"
                  rel="noreferrer"
                  className="block italic text-[clamp(9px,1.1vw,15px)] underline decoration-[#26160b]/40 hover:opacity-100 opacity-85"
                >
                  LinkedIn ↗
                </a>
              </div>
            )}

            {/* Bottom Row: Wax Seal + Contact Corner Toggle */}
            <div className="flex items-end justify-between pointer-events-auto pt-1">
              <div
                className="w-[clamp(20px,2.8vw,36px)] h-[clamp(20px,2.8vw,36px)] rounded-full flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 35% 32%, #7c1f1f 0%, #4d0e0e 65%, #2b0606 100%)',
                  boxShadow:
                    'inset 0 1px 3px rgba(255,160,140,0.22), 0 2px 5px rgba(15,6,2,0.55)',
                  mixBlendMode: 'normal',
                }}
              >
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className="text-[#c98b83]/85 font-semibold text-[clamp(9px,1.2vw,16px)]"
                >
                  S
                </span>
              </div>

              <button
                onClick={handleContactToggle}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="text-[clamp(7px,0.85vw,11px)] uppercase tracking-[0.2em] text-[#22140a]/85 hover:text-[#0d0703] cursor-pointer px-1 py-0.5"
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
              onClick={handleChainPull}
              title="Pull brass chain"
              style={{
                left: `${cfg.chain.left}%`,
                top: `${cfg.chain.top}%`,
                width: `${cfg.chain.width}%`,
                height: `${cfg.chain.height}%`,
              }}
              className="absolute z-20 cursor-grab active:cursor-grabbing bg-transparent focus:outline-none"
            />
            <button
              onClick={handlePenTap}
              title="Rewrite ink"
              style={{
                left: `${cfg.pen.left}%`,
                top: `${cfg.pen.top}%`,
                width: `${cfg.pen.width}%`,
                height: `${cfg.pen.height}%`,
              }}
              className="absolute z-20 cursor-pointer bg-transparent focus:outline-none"
            />
            <button
              onClick={handlePlaneTap}
              title="Paper plane"
              style={{
                left: `${cfg.plane.left}%`,
                top: `${cfg.plane.top}%`,
                width: `${cfg.plane.width}%`,
                height: `${cfg.plane.height}%`,
              }}
              className="absolute z-20 cursor-pointer bg-transparent focus:outline-none"
            />
          </>
        )}
      </div>

      {/* Global Lightning Flash Overlay */}
      <div
        className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-75"
        style={{
          opacity: lightningAlpha,
          background:
            'radial-gradient(circle at 42% 28%, rgba(225,238,255,0.98) 0%, rgba(145,182,235,0.45) 48%, transparent 82%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default CreatorPassModal;
