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
      const count = window.innerWidth < 768 ? 28 : 90;
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
        const alpha = Math.min(0.55, isDark ? p.opacity * 1.1 : p.opacity * 0.78);
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

  const premiumStyles = (
    <>
      <style>{`
        @keyframes studioThemeWave {
          0% {
            opacity: 0.88;
            clip-path: circle(0% at 14% 86%);
          }
          65% {
            opacity: 0.65;
            clip-path: circle(155% at 14% 86%);
          }
          100% {
            opacity: 0;
            clip-path: circle(170% at 14% 86%);
          }
        }
        .sx2-theme-curtain {
          position: fixed;
          inset: 0;
          z-index: 160;
          pointer-events: none;
          animation: studioThemeWave 0.82s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes sx2CardEntry {
          0% {
            opacity: 0;
            transform: perspective(1100px) translate3d(0, 18px, -16px) rotateX(3deg) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: perspective(1100px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
          }
        }
        @keyframes sx2SheenGlide {
          0% { transform: translateX(-140%) skewX(-22deg); }
          100% { transform: translateX(260%) skewX(-22deg); }
        }
        .sx2-lux-card {
          position: relative;
          overflow: hidden;
          animation: sx2CardEntry 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .sx2-rail .sx2-rail-item {
          position: relative;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease;
        }
        .sx2-rail .sx2-rail-item:hover {
          transform: translateX(4px);
        }
        .sx2-rail .sx2-rail-item.active {
          box-shadow: 0 10px 24px rgba(139, 30, 36, 0.24), inset 0 1px 1px rgba(212, 175, 55, 0.45);
        }
        .sx2-btn-maroon, .sx2-btn-ghost, .sx2-rail-util, .sx2-rail-exit {
          position: relative;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
        }
        .sx2-btn-maroon:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(139, 30, 36, 0.32);
        }
        .sx2-panel {
          border-color: rgba(212, 175, 55, 0.34) !important;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.16);
        }
      `}</style>
      {themePulse.key > 0 && (
        <div
          key={themePulse.key}
          aria-hidden="true"
          className="sx2-theme-curtain no-print"
          style={{
            background:
              themePulse.target === 'espresso'
                ? 'radial-gradient(circle at bottom left, rgba(20, 14, 18, 0.92) 0%, rgba(139, 30, 36, 0.34) 55%, rgba(15, 12, 16, 0.85) 100%)'
                : 'radial-gradient(circle at bottom left, rgba(250, 249, 245, 0.94) 0%, rgba(212, 175, 55, 0.3) 55%, rgba(250, 249, 245, 0.85) 100%)',
          }}
        />
      )}
    </>
  );

  if (!authChecked) {
    return (
      <div className="sx2-root sx2-center" data-theme={theme}>
        {premiumStyles}
        <StudioFloatingBubbles isDark={isEspresso} />
        <div className="sx2-paper-grain" />
        <div
          className="sx2-lux-card"
          style={{
            position: 'relative',
            zIndex: 4,
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
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
        {premiumStyles}
        <StudioFloatingBubbles isDark={isEspresso} />
        <div className="sx2-paper-grain" />
        <div className="sx2-spotlight" />
        <div
          className="sx2-panel sx2-fade sx2-lux-card"
          style={{
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            padding: '32px',
            zIndex: 5,
            border: '1px solid rgba(212, 175, 55, 0.48)',
          }}
        >
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
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '25px', margin: '0 0 6px' }}>
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

  const sessionGoal = Math.max(
    1,
    submissions.filter((s) => (s.status || 'Received') === 'Received').length + reviewedInSession
  );
  const sessionPct = Math.min(100, Math.round((reviewedInSession / sessionGoal) * 100));

  return (
    <div ref={rootRef} onMouseMove={handleMouseMove} className="sx2-root" data-theme={theme}>
      {premiumStyles}
      <StudioFloatingBubbles isDark={isEspresso} />
      <div className="sx2-paper-grain no-print" />
      <div className="sx2-spotlight no-print" />

      <aside className="sx2-rail no-print" style={{ zIndex: 10 }}>
        <div>
          <div className="sx2-rail-brand">
            <img src="/sanrachna-official-logo.png" alt="संRACHNA" className="sx2-rail-logo" />
            <div>
              <div className="sx2-rail-title">संRACHNA</div>
              <div className="sx2-rail-sub">EDITORIAL STUDIO</div>
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
            <button
              type="button"
              className={`sx2-rail-item ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              <span>📥 Manuscripts</span>
              <span className="sx2-count">{submissions.length}</span>
            </button>
            <button
              type="button"
              className={`sx2-rail-item ${activeTab === 'toc' ? 'active' : ''}`}
              onClick={() => setActiveTab('toc')}
            >
              <span>📑 Issue TOC</span>
            </button>
            <button
              type="button"
              className={`sx2-rail-item ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <span>📢 Marquee &amp; Board</span>
              <span className="sx2-count">{announcements.filter((a) => a.is_active).length}</span>
            </button>
            <button
              type="button"
              className={`sx2-rail-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span>📊 Insights</span>
            </button>
            <button
              type="button"
              className={`sx2-rail-item ${activeTab === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              <span>⚙ Controls</span>
            </button>
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

      <main className="sx2-content sx2-lux-card" key={activeTab} style={{ zIndex: 4 }}>
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
            <div key={t.id} className="sx2-toast sx2-lux-card">
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
