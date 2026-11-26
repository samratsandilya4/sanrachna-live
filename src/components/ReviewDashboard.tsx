import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  AnnouncementItem,
  LiveToast,
  PrintMode,
  StudioTab,
  StudioTheme,
  SubmissionMetaLocal,
  SubmissionRow,
} from '../studio/types';
import { DEFAULT_META } from '../studio/helpers';
import PrintViews from '../studio/PrintViews';
import CommandPalette from '../studio/CommandPalette';
import ManuscriptWorkspace from '../studio/ManuscriptWorkspace';
import IssuePlannerAndBroadcast from '../studio/IssuePlannerAndBroadcast';
import '../studio/studioThemes.css';

interface ReviewDashboardProps {
  onExit?: () => void;
}

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

function StudioFloatingBubbles({ isDark }: { isDark: boolean }) {
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
        radius: Math.random() * Math.max(w, h) * 1.15,
        y: (Math.random() - 0.5) * h * 2,
        size: 1.6 + Math.random() * 4.2,
        angularSpeed: 0.0011 + Math.random() * 0.001,
        opacity: 0.14 + Math.random() * 0.24,
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
      const count = window.innerWidth < 768 ? 28 : 96;
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
        p.y -= 0.45;
        if (p.y < -height) {
          p.y = height;
          p.radius = Math.random() * Math.max(width, height) * 1.15;
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
        const alpha = Math.min(0.56, isDark ? p.opacity * 1.12 : p.opacity * 0.8);
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
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="no-print"
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

const PORTAL_CLOSED_KEY = 'sanrachna_submissions_closed_v1';
const STUDIO_THEME_KEY = 'sanrachna_studio_theme_v2';
const STUDIO_META_KEY = 'sanrachna_studio_meta_v1';

const STUDIO_NAV_ITEMS: { id: StudioTab; label: string; icon: string; badgeType?: 'submissions' | 'announcements' }[] = [
  { id: 'submissions', label: 'Manuscripts', icon: '📥', badgeType: 'submissions' },
  { id: 'toc', label: 'Issue TOC', icon: '📑' },
  { id: 'announcements', label: 'Marquee & Board', icon: '📢', badgeType: 'announcements' },
  { id: 'analytics', label: 'Insights', icon: '📊' },
  { id: 'controls', label: 'Controls', icon: '⚙' },
];

export default function ReviewDashboard({ onExit }: ReviewDashboardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<StudioTheme>(() => {
    try {
      return localStorage.getItem(STUDIO_THEME_KEY) === 'espresso' ? 'espresso' : 'parchment';
    } catch {
      return 'parchment';
    }
  });

  const [themePulse, setThemePulse] = useState<{ key: number; target: StudioTheme }>({
    key: 0,
    target: 'parchment',
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('submissions');
  const [printMode, setPrintMode] = useState<PrintMode>('none');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [railMorphed, setRailMorphed] = useState(false);

  // Auth
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Submissions & Local Editorial Metadata
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [subError, setSubError] = useState('');
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const [toasts, setToasts] = useState<LiveToast[]>([]);

  const [metaMap, setMetaMap] = useState<Record<string, SubmissionMetaLocal>>(() => {
    try {
      const raw = localStorage.getItem(STUDIO_META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Portal Controls
  const [submissionsClosed, setSubmissionsClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PORTAL_CLOSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [guidelinesUrl, setGuidelinesUrl] = useState('/Guidelines.pdf');
  const [templateUrl, setTemplateUrl] = useState('/template%20for%20submission.pdf');

  const pushToast = useCallback(
    (title: string, subtitle: string, tone: LiveToast['tone'] = 'gold') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const updateMeta = useCallback(
    (refId: string, updater: (prev: SubmissionMetaLocal) => SubmissionMetaLocal) => {
      setMetaMap((prev) => {
        const current = { ...DEFAULT_META, ...(prev[refId] || {}) };
        const next = { ...prev, [refId]: updater(current) };
        try {
          localStorage.setItem(STUDIO_META_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: StudioTheme = prev === 'parchment' ? 'espresso' : 'parchment';
      setThemePulse((p) => ({ key: p.key + 1, target: next }));
      try {
        localStorage.setItem(STUDIO_THEME_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--mx', `${e.clientX}px`);
    rootRef.current.style.setProperty('--my', `${e.clientY}px`);
  };

  useEffect(() => {
    const onScroll = () => {
      setRailMorphed(window.scrollY > 90);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.session?.user?.email ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoadingSub(true);
    setSubError('');
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setSubError(error.message);
    else setSubmissions((data as SubmissionRow[]) || []);
    setLoadingSub(false);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) {
      setAnnouncements(
        (data as any[]).map((a) => ({
          ...a,
          display_type:
            a.display_type === 'both' || a.display_type === 'ticker' ? a.display_type : 'notice',
        }))
      );
    }
  }, []);

  const fetchPortalSettings = useCallback(async () => {
    const { data } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('id', 'sanrachna_2026')
      .single();
    if (data) {
      setSubmissionsClosed(Boolean(data.submissions_closed));
      if (data.guidelines_url) setGuidelinesUrl(data.guidelines_url);
      if (data.template_url) setTemplateUrl(data.template_url);
    }
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetchSubmissions();
    fetchAnnouncements();
    fetchPortalSettings();

    const channel = supabase
      .channel('sanrachna-studio-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          const incoming = payload.new as SubmissionRow;
          setSubmissions((prev) =>
            prev.some((r) => r.reference_id === incoming.reference_id) ? prev : [incoming, ...prev]
          );
          pushToast(
            `New Entry: ${incoming.full_name}`,
            `${incoming.reference_id} • ${incoming.submission_type}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, fetchSubmissions, fetchAnnouncements, fetchPortalSettings, pushToast]);

  const selectedEntry = useMemo(
    () => submissions.find((s) => s.reference_id === selectedRef) || null,
    [submissions, selectedRef]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    if (error) setLoginError(error.message);
    else setLoginPassword('');
    setLoginLoading(false);
  };

  const handleSaveSubmission = async (
    refId: string,
    payload: { status: string; editorial_note: string | null; internal_note: string | null }
  ) => {
    const { error } = await supabase.from('submissions').update(payload).eq('reference_id', refId);
    if (error) return { ok: false, error: error.message };
    setSubmissions((prev) =>
      prev.map((r) => (r.reference_id === refId ? { ...r, ...payload } : r))
    );
    setReviewedInSession((n) => n + 1);
    return { ok: true };
  };

  const handleDeleteSubmission = async (refId: string) => {
    const { error } = await supabase.from('submissions').delete().eq('reference_id', refId);
    if (error) return { ok: false, error: error.message };
    setSubmissions((prev) => prev.filter((r) => r.reference_id !== refId));
    return { ok: true };
  };

  const handleBulkStatusChange = async (refIds: string[], nextStatus: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({ status: nextStatus })
      .in('reference_id', refIds);
    if (!error) {
      setSubmissions((prev) =>
        prev.map((r) => (refIds.includes(r.reference_id) ? { ...r, status: nextStatus } : r))
      );
      pushToast('Bulk Status Updated', `${refIds.length} entries set to ${nextStatus}`);
    }
  };

  const handleSaveAnnouncement = async (
    payload: {
      title: string;
      message: string;
      tag: AnnouncementItem['tag'];
      display_type: AnnouncementItem['display_type'];
      is_pinned: boolean;
    },
    editingId: string | null
  ) => {
    const { error } = editingId
      ? await supabase.from('announcements').update(payload).eq('id', editingId)
      : await supabase.from('announcements').insert([{ ...payload, is_active: true }]);
    if (error) return { ok: false, error: error.message };
    await fetchAnnouncements();
    return { ok: true };
  };

  const handleToggleAnnouncement = async (
    id: string,
    field: 'is_active' | 'is_pinned',
    nextVal: boolean
  ) => {
    await supabase.from('announcements').update({ [field]: !nextVal }).eq('id', id);
    await fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    await fetchAnnouncements();
  };

  const handleSavePortalControls = async () => {
    localStorage.setItem(PORTAL_CLOSED_KEY, String(submissionsClosed));
    const { error } = await supabase.from('portal_settings').upsert({
      id: 'sanrachna_2026',
      submissions_closed: submissionsClosed,
      guidelines_url: guidelinesUrl.trim(),
      template_url: templateUrl.trim(),
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const handleExit = () => {
    if (onExit) onExit();
    else window.location.href = '/';
  };

  const isEspresso = theme === 'espresso';
  const pendingCount = useMemo(
    () => submissions.filter((s) => (s.status || 'Received') === 'Received').length,
    [submissions]
  );

  const premiumLayer = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Noto+Serif+Devanagari:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        .sx2-root {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
          overflow-x: clip;
        }
        .sx2-root h1, .sx2-root h2, .sx2-root h3,
        .sx2-rail-title {
          font-family: 'Noto Serif Devanagari', 'Cormorant Garamond', 'Playfair Display', serif !important;
          line-height: 1.24;
        }
        .sx2-count, .sx2-session-top {
          font-variant-numeric: tabular-nums;
        }

        /* Royal Ambient Aura Layer */
        .sx2-royal-aura {
          position: fixed;
          top: -180px;
          left: 50%;
          transform: translateX(-50%);
          width: 860px;
          height: 420px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(88px);
          transition: background 0.65s ease;
        }

        /* Radial Light ↔ Dark Wave Curtain */
        @keyframes sx2RadialCurtain {
          0% {
            opacity: 0.92;
            clip-path: circle(0% at 15% 85%);
          }
          65% {
            opacity: 0.72;
            clip-path: circle(155% at 15% 85%);
          }
          100% {
            opacity: 0;
            clip-path: circle(170% at 15% 85%);
          }
        }
        .sx2-theme-curtain {
          position: fixed;
          inset: 0;
          z-index: 160;
          pointer-events: none;
          animation: sx2RadialCurtain 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Video-Style Arc & Staggered Rail Motion */
        @keyframes sx2RailArcShift {
          0% {
            transform: perspective(900px) translate3d(18px, -12px, 0) rotateZ(-1.5deg) scale(0.985);
          }
          70% {
            transform: perspective(900px) translate3d(-2px, 1px, 0) rotateZ(0.3deg) scale(1.008);
          }
          100% {
            transform: perspective(900px) translate3d(0, 0, 0) rotateZ(0deg) scale(1);
          }
        }
        .sx2-rail-morphed {
          animation: sx2RailArcShift 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
          border-color: rgba(212, 175, 55, 0.48) !important;
        }

        @keyframes sx2ToggleWaveIn {
          0% {
            opacity: 0.72;
            transform: translate3d(-10px, 0, 0) scale(0.96);
          }
          70% {
            opacity: 1;
            transform: translate3d(3px, 0, 0) scale(1.015);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        .sx2-rail .sx2-rail-item {
          position: relative;
          overflow: hidden;
          animation: sx2ToggleWaveIn 0.46s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), background 0.28s ease, border-color 0.28s ease, box-shadow 0.3s ease;
        }
        .sx2-rail .sx2-rail-item:nth-child(1) { animation-delay: 20ms; }
        .sx2-rail .sx2-rail-item:nth-child(2) { animation-delay: 65ms; }
        .sx2-rail .sx2-rail-item:nth-child(3) { animation-delay: 110ms; }
        .sx2-rail .sx2-rail-item:nth-child(4) { animation-delay: 155ms; }
        .sx2-rail .sx2-rail-item:nth-child(5) { animation-delay: 200ms; }

        .sx2-rail .sx2-rail-item:hover {
          transform: translate3d(5px, 0, 0);
        }
        .sx2-rail .sx2-rail-item.active {
          box-shadow: 0 10px 24px rgba(139, 30, 36, 0.26), inset 0 1px 1px rgba(212, 175, 55, 0.5);
        }
        .sx2-rail .sx2-rail-item.active .sx2-rail-emoji {
          display: inline-block;
          transform: scale(1.14) rotate(-4deg);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Zero-Flash GPU Sheet & Sheen Entry */
        @keyframes sx2SheetEntry {
          0% {
            opacity: 0;
            transform: perspective(1150px) translate3d(0, 20px, -18px) rotateX(3deg) scale(0.982);
          }
          100% {
            opacity: 1;
            transform: perspective(1150px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
          }
        }
        @keyframes sx2SheenSweep {
          0% {
            transform: translate3d(-140%, 0, 0) skewX(-22deg);
            opacity: 0;
          }
          25% {
            opacity: 0.52;
          }
          100% {
            transform: translate3d(260%, 0, 0) skewX(-22deg);
            opacity: 0;
          }
        }
        .sx2-lux-sheet {
          position: relative;
          overflow: hidden;
          animation: sx2SheetEntry 0.44s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .sx2-lux-sheet::before {
          content: '';
          position: absolute;
          inset: 0;
          width: 44%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.14) 45%,
            rgba(212, 175, 55, 0.2) 55%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 2;
          animation: sx2SheenSweep 1.05s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        @keyframes sx2LiveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.55; }
        }
        .sx2-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 10px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border: 1px solid rgba(212, 175, 55, 0.36);
          background: rgba(212, 175, 55, 0.1);
          color: #D4AF37;
        }
        .sx2-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
          animation: sx2LiveDot 2.2s ease-in-out infinite;
        }

        .sx2-btn-maroon, .sx2-btn-ghost, .sx2-rail-util, .sx2-rail-exit, .sx2-cmd-hint {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
        }
        .sx2-btn-maroon:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(139, 30, 36, 0.34);
        }
        .sx2-panel {
          border-color: rgba(212, 175, 55, 0.34) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.16);
        }
      `}</style>

      <div
        aria-hidden="true"
        className="sx2-royal-aura no-print"
        style={{
          background: isEspresso
            ? 'radial-gradient(circle, rgba(139,30,36,0.26) 0%, rgba(212,175,55,0.12) 48%, transparent 74%)'
            : 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(139,30,36,0.08) 48%, transparent 74%)',
        }}
      />

      {themePulse.key > 0 && (
        <div
          key={themePulse.key}
          aria-hidden="true"
          className="sx2-theme-curtain no-print"
          style={{
            background:
              themePulse.target === 'espresso'
                ? 'radial-gradient(circle at bottom left, rgba(18, 12, 16, 0.94) 0%, rgba(139, 30, 36, 0.34) 55%, rgba(12, 10, 14, 0.86) 100%)'
                : 'radial-gradient(circle at bottom left, rgba(250, 249, 245, 0.95) 0%, rgba(212, 175, 55, 0.3) 55%, rgba(250, 249, 245, 0.86) 100%)',
          }}
        />
      )}
    </>
  );

  if (!authChecked) {
    return (
      <div className="sx2-root sx2-center" data-theme={theme}>
        {premiumLayer}
        <StudioFloatingBubbles isDark={isEspresso} />
        <div className="sx2-paper-grain" />
        <div
          className="sx2-lux-sheet"
          style={{
            position: 'relative',
            zIndex: 4,
            fontFamily: "'Noto Serif Devanagari', 'Playfair Display', serif",
            fontSize: '21px',
            fontWeight: 700,
          }}
        >
          Opening संRACHNA Editorial Studio...
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div ref={rootRef} onMouseMove={handleMouseMove} className="sx2-root sx2-center" data-theme={theme}>
        {premiumLayer}
        <StudioFloatingBubbles isDark={isEspresso} />
        <div className="sx2-paper-grain" />
        <div className="sx2-spotlight" />
        <div
          className="sx2-panel sx2-fade sx2-lux-sheet"
          style={{
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            padding: '32px',
            zIndex: 5,
            border: '1px solid rgba(212, 175, 55, 0.5)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src="/gec-logo.png"
                alt="GEC Godda"
                className="sx2-rail-logo"
                style={{ width: '50px', height: '50px' }}
              />
              <img
                src="/sanrachna-official-logo.png"
                alt="संRACHNA"
                className="sx2-rail-logo"
                style={{ width: '50px', height: '50px' }}
              />
            </div>
            <span className="sx2-kicker">GOVERNMENT ENGINEERING COLLEGE, GODDA</span>
            <h1 style={{ fontSize: '26px', margin: '0 0 6px', fontWeight: 700 }}>
              संRACHNA Editorial Studio
            </h1>
            <p className="sx2-muted" style={{ margin: '0 0 20px' }}>
              Editorial Board Sign-In
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <input
                type="email"
                required
                className="sx2-input"
                placeholder="Editorial Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                required
                className="sx2-input"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              {loginError && (
                <div style={{ color: '#B91C1C', fontSize: '12.5px', fontWeight: 600 }}>{loginError}</div>
              )}
              <button type="submit" className="sx2-btn-maroon" disabled={loginLoading}>
                {loginLoading ? 'Signing In...' : 'Enter Studio →'}
              </button>
              <button type="button" className="sx2-btn-ghost" onClick={handleExit}>
                ← Back to Website
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (printMode !== 'none') {
    return (
      <PrintViews
        mode={printMode}
        entry={selectedEntry}
        allRows={submissions}
        onClose={() => setPrintMode('none')}
      />
    );
  }

  const sessionGoal = Math.max(1, pendingCount + reviewedInSession);
  const sessionPct = Math.min(100, Math.round((reviewedInSession / sessionGoal) * 100));

  return (
    <div ref={rootRef} onMouseMove={handleMouseMove} className="sx2-root" data-theme={theme}>
      {premiumLayer}
      <StudioFloatingBubbles isDark={isEspresso} />
      <div className="sx2-paper-grain no-print" />
      <div className="sx2-spotlight no-print" />

      <aside
        className={`sx2-rail no-print ${railMorphed ? 'sx2-rail-morphed' : ''}`}
        style={{ zIndex: 10 }}
      >
        <div>
          <div className="sx2-rail-brand">
            <img src="/sanrachna-official-logo.png" alt="संRACHNA" className="sx2-rail-logo" />
            <div>
              <div className="sx2-rail-title">संRACHNA</div>
              <div className="sx2-rail-sub">EDITORIAL STUDIO</div>
              <div className="sx2-live-pill">
                <span className="sx2-live-dot" />
                <span>Live • {pendingCount} New</span>
              </div>
            </div>
          </div>

          <div className="sx2-session-meter">
            <div className="sx2-session-top">
              <span>SESSION CURATED</span>
              <span>{reviewedInSession} updated</span>
            </div>
            <div className="sx2-mini-track">
              <div
                className="sx2-mini-fill"
                style={{
                  width: `${sessionPct}%`,
                  transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>

          <nav className="sx2-rail-nav">
            {STUDIO_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const badgeVal =
                item.badgeType === 'submissions'
                  ? submissions.length
                  : item.badgeType === 'announcements'
                  ? announcements.filter((a) => a.is_active).length
                  : null;

              return (
                <button
                  key={`${item.id}-${railMorphed ? 'morphed' : 'base'}`}
                  type="button"
                  className={`sx2-rail-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span>
                    <span className="sx2-rail-emoji">{item.icon}</span> {item.label}
                  </span>
                  {badgeVal !== null && <span className="sx2-count">{badgeVal}</span>}
                </button>
              );
            })}
          </nav>

          <button type="button" className="sx2-cmd-hint" onClick={() => setCmdOpen(true)}>
            <span>Quick Command</span>
            <kbd>Ctrl+K</kbd>
          </button>
        </div>

        <div className="sx2-rail-footer">
          <button type="button" className="sx2-rail-util" onClick={toggleTheme}>
            {theme === 'parchment' ? '☾ Espresso Dark' : '☀ Parchment Paper'}
          </button>
          <button type="button" className="sx2-rail-util" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
          <button type="button" className="sx2-rail-exit" onClick={handleExit}>
            ← Exit to Website
          </button>
        </div>
      </aside>

      <main className="sx2-content sx2-lux-sheet" key={activeTab} style={{ zIndex: 4 }}>
        <div style={{ position: 'relative', zIndex: 3 }}>
          {activeTab === 'submissions' ? (
            <ManuscriptWorkspace
              submissions={submissions}
              loading={loadingSub}
              error={subError}
              selectedRef={selectedRef}
              onSelectRef={setSelectedRef}
              metaMap={metaMap}
              onUpdateMeta={updateMeta}
              onSaveSubmission={handleSaveSubmission}
              onDeleteSubmission={handleDeleteSubmission}
              onBulkStatusChange={handleBulkStatusChange}
              onRefresh={fetchSubmissions}
              onOpenPrint={(m) => setPrintMode(m)}
            />
          ) : (
            <IssuePlannerAndBroadcast
              activeTab={activeTab}
              submissions={submissions}
              metaMap={metaMap}
              onUpdateMeta={updateMeta}
              announcements={announcements}
              onSaveAnnouncement={handleSaveAnnouncement}
              onToggleAnnouncement={handleToggleAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              submissionsClosed={submissionsClosed}
              onChangeSubmissionsClosed={setSubmissionsClosed}
              guidelinesUrl={guidelinesUrl}
              onChangeGuidelinesUrl={setGuidelinesUrl}
              templateUrl={templateUrl}
              onChangeTemplateUrl={setTemplateUrl}
              onSavePortalControls={handleSavePortalControls}
            />
          )}
        </div>
      </main>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        submissions={submissions}
        onSelectSubmission={setSelectedRef}
        onSwitchTab={setActiveTab}
        onToggleTheme={toggleTheme}
        onOpenPrint={setPrintMode}
        selectedRef={selectedRef}
      />

      {toasts.length > 0 && (
        <div className="sx2-toast-stack no-print">
          {toasts.map((t) => (
            <div key={t.id} className="sx2-toast sx2-lux-sheet">
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
