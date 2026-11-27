import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Command,
  Inbox,
  ListOrdered,
  LogOut,
  Megaphone,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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

// ===========================================================================
// 1. FLOATING 3D BUBBLES CANVAS ENGINE (SAME AS GUIDELINES PAGE)
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

function StudioFloatingBubbles({ isDarkMode }: { isDarkMode: boolean }) {
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
        size: 1.8 + Math.random() * 4.5,
        angularSpeed: 0.0012 + Math.random() * 0.0011,
        opacity: 0.16 + Math.random() * 0.28,
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
      const count = window.innerWidth < 768 ? 32 : 108;
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
        p.y -= 0.48;
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
        const alpha = Math.min(0.6, isDarkMode ? p.opacity * 1.15 : p.opacity * 0.82);
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
  }, [isDarkMode]);

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

// ===========================================================================
// 2. MORPHING 2D SUN ↔ MOON ANIMATED THEME ICON
// ===========================================================================
function StudioThemeIcon({ isDark, maskId }: { isDark: boolean; maskId: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: '18px',
        height: '18px',
        color: isDark ? '#EBD28C' : '#8B1E24',
        transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s ease',
        transform: isDark ? 'rotate(-28deg) scale(1.05)' : 'rotate(90deg) scale(1)',
        overflow: 'visible',
      }}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle
            cx={isDark ? '16' : '29'}
            cy={isDark ? '8' : '0'}
            r="8"
            fill="black"
            style={{ transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </mask>
      </defs>

      <circle
        cx="12"
        cy="12"
        r={isDark ? '9.5' : '5'}
        fill="currentColor"
        mask={`url(#${maskId})`}
        style={{ transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      <g
        stroke="currentColor"
        style={{
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'scale(0.2) rotate(-60deg)' : 'scale(1) rotate(0deg)',
          transformOrigin: '12px 12px',
        }}
      >
        <line x1="12" y1="1.2" x2="12" y2="3.2" />
        <line x1="12" y1="20.8" x2="12" y2="22.8" />
        <line x1="4.3" y1="4.3" x2="5.7" y2="5.7" />
        <line x1="18.3" y1="18.3" x2="19.7" y2="19.7" />
        <line x1="1.2" y1="12" x2="3.2" y2="12" />
        <line x1="20.8" y1="12" x2="22.8" y2="12" />
        <line x1="4.3" y1="19.7" x2="5.7" y2="18.3" />
        <line x1="18.3" y1="5.7" x2="19.7" y2="4.3" />
      </g>
    </svg>
  );
}

// ===========================================================================
// 3. ROLLING ODOMETER DIGITS FOR LIVE STATS
// ===========================================================================
function DigitReel({ digit, height }: { digit: number; height: number }) {
  return (
    <span style={{ display: 'inline-block', height: `${height}px`, overflow: 'hidden', verticalAlign: 'top' }}>
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translate3d(0, -${digit * height}px, 0)`,
          transition: 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
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

function StudioAnimateDigits({
  value,
  minDigits = 2,
  fontSize = 26,
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
// 4. SINGLE-ROW SLIDING PILL TABS (ZERO AUTO-SCROLL BUG)
// ===========================================================================
interface StudioPillItem {
  id: StudioTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

function StudioSlidingPillTabs({
  items,
  activeId,
  onSelect,
  isDarkMode,
  compact = false,
}: {
  items: StudioPillItem[];
  activeId: StudioTab;
  onSelect: (id: StudioTab) => void;
  isDarkMode: boolean;
  compact?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const sync = () => {
      const btn = btnRefs.current[activeId];
      const wrap = wrapRef.current;
      if (!btn || !wrap) return;
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [activeId, items.length]);

  return (
    <div className="st-tabs-scroll-outer">
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: '4px',
          padding: compact ? '4px' : '5px',
          borderRadius: '999px',
          background: isDarkMode ? 'rgba(13, 20, 42, 0.78)' : 'rgba(255, 255, 255, 0.86)',
          border: `1px solid ${isDarkMode ? 'rgba(212, 175, 55, 0.28)' : 'rgba(139, 30, 36, 0.18)'}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: compact ? '4px' : '5px',
            bottom: compact ? '4px' : '5px',
            left: 0,
            width: `${pill.width}px`,
            transform: `translate3d(${pill.left}px, 0, 0)`,
            opacity: pill.ready ? 1 : 0,
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #8B1E24 0%, #5A1220 55%, #1E3A5F 100%)',
            border: '1px solid rgba(212, 175, 55, 0.68)',
            boxShadow: '0 6px 18px rgba(139, 30, 36, 0.34)',
            transition:
              'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), width 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                btnRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => onSelect(item.id)}
              style={{
                position: 'relative',
                zIndex: 1,
                border: 'none',
                background: 'transparent',
                padding: compact ? '7px 13px' : '8px 15px',
                borderRadius: '999px',
                fontSize: compact ? '12px' : '12.5px',
                fontWeight: 700,
                letterSpacing: '0.25px',
                color: isActive ? '#FAF9F5' : isDarkMode ? '#CBD5E1' : '#334155',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.28s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    background: isActive
                      ? 'rgba(212, 175, 55, 0.26)'
                      : isDarkMode
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(139, 30, 36, 0.1)',
                    color: isActive ? '#F5E6B8' : isDarkMode ? '#EBD28C' : '#8B1E24',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// 5. MAIN PREMIUM EDITORIAL STUDIO DASHBOARD
// ===========================================================================
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

  const [themePulseKey, setThemePulseKey] = useState(0);
  const [themePulseTarget, setThemePulseTarget] = useState<StudioTheme>(theme);

  const [activeTab, setActiveTab] = useState<StudioTab>('submissions');
  const [printMode, setPrintMode] = useState<PrintMode>('none');
  const [cmdOpen, setCmdOpen] = useState(false);

  // Scroll & Video-Style Morph State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDocked, setIsDocked] = useState(false);
  const [railHovered, setRailHovered] = useState(false);

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

  const isDarkMode = theme === 'espresso';

  const pushToast = useCallback(
    (title: string, subtitle: string, tone: LiveToast['tone'] = 'gold') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, tone }]);
      window.setTimeout(() => {
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
      setThemePulseTarget(next);
      setThemePulseKey((k) => k + 1);
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

  // Scroll listener for progress thread & horizontal-to-left-rail morph
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(100, Math.max(0, (y / maxScroll) * 100)));
      setIsDocked(y > 110);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cmd/Ctrl + K Command Palette shortcut
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

  const pendingCount = useMemo(
    () => submissions.filter((s) => (s.status || 'Received') === 'Received').length,
    [submissions]
  );

  const activeAnnouncementsCount = useMemo(
    () => announcements.filter((a) => a.is_active).length,
    [announcements]
  );

  const navItems: StudioPillItem[] = useMemo(
    () => [
      { id: 'submissions', label: 'Manuscripts', icon: Inbox, badge: submissions.length },
      { id: 'toc', label: 'Issue TOC', icon: ListOrdered },
      { id: 'announcements', label: 'Marquee & Board', icon: Megaphone, badge: activeAnnouncementsCount },
      { id: 'analytics', label: 'Insights', icon: BarChart3 },
      { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
    ],
    [submissions.length, activeAnnouncementsCount]
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

  const bg = isDarkMode ? '#070B19' : '#FAF9F5';
  const textMain = isDarkMode ? '#FAF9F5' : '#152238';
  const textSub = isDarkMode ? '#A1A1AA' : '#4B5563';
  const hairline = isDarkMode ? 'rgba(212, 175, 55, 0.24)' : 'rgba(139, 30, 36, 0.16)';

  const sessionGoal = Math.max(1, pendingCount + reviewedInSession);
  const sessionPct = Math.min(100, Math.round((reviewedInSession / sessionGoal) * 100));

  const sharedStyles = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Noto+Serif+Devanagari:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        /* Guidelines-Grade Root Override & Typography Polish */
        .sx2-root.st-awwwards {
          display: block !important;
          min-height: 100vh !important;
          width: 100% !important;
          background: ${bg} !important;
          color: ${textMain} !important;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif !important;
          position: relative;
          overflow-x: clip;
          transition: background-color 0.65s cubic-bezier(0.16, 1, 0.3, 1), color 0.5s ease;
        }
        .sx2-root.st-awwwards.sx2-center {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 24px 16px !important;
        }
        .sx2-root.st-awwwards * {
          box-sizing: border-box;
        }
        .sx2-root.st-awwwards h1,
        .sx2-root.st-awwwards h2,
        .sx2-root.st-awwwards h3 {
          font-family: 'Cormorant Garamond', 'Playfair Display', 'Noto Serif Devanagari', serif;
          letter-spacing: -0.01em;
        }

        /* Harmonize child studio panels with GuidelinesPage royal glass palette */
        .sx2-root.st-awwwards[data-theme='espresso'] {
          --bg: #070B19;
          --surface: rgba(14, 21, 44, 0.84);
          --surface-2: rgba(18, 27, 54, 0.9);
          --card: rgba(14, 21, 44, 0.84);
          --ink: #FAF9F5;
          --muted: #A1A1AA;
          --border: rgba(212, 175, 55, 0.24);
          --accent: #D4AF37;
        }
        .sx2-root.st-awwwards[data-theme='parchment'] {
          --bg: #FAF9F5;
          --surface: rgba(255, 253, 249, 0.9);
          --surface-2: rgba(248, 242, 233, 0.92);
          --card: rgba(255, 253, 249, 0.92);
          --ink: #152238;
          --muted: #4B5563;
          --border: rgba(139, 30, 36, 0.16);
          --accent: #8B1E24;
        }

        .sx2-root.st-awwwards .sx2-panel {
          border-radius: 24px !important;
          border: 1px solid ${hairline} !important;
          background: ${isDarkMode
            ? 'linear-gradient(155deg, rgba(16, 24, 48, 0.84) 0%, rgba(9, 13, 28, 0.92) 100%)'
            : 'linear-gradient(155deg, rgba(255, 254, 250, 0.94) 0%, rgba(247, 241, 232, 0.9) 100%)'} !important;
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow: ${isDarkMode
            ? '0 22px 54px rgba(0, 0, 0, 0.44), inset 0 1px 1px rgba(255,255,255,0.12)'
            : '0 16px 40px rgba(30, 58, 95, 0.09), inset 0 1px 2px rgba(255,255,255,0.95)'} !important;
        }

        .sx2-root.st-awwwards .sx2-input {
          border-radius: 14px !important;
          border: 1px solid ${hairline} !important;
          background: ${isDarkMode ? 'rgba(7, 11, 25, 0.78)' : 'rgba(255, 255, 255, 0.92)'} !important;
          color: ${textMain} !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .sx2-root.st-awwwards .sx2-input:focus {
          outline: none !important;
          border-color: #D4AF37 !important;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.16) !important;
        }

        /* Horizontal Single-Row Scroll Container (Zero Mobile Line-Wrap) */
        .st-tabs-scroll-outer {
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .st-tabs-scroll-outer::-webkit-scrollbar {
          display: none;
        }

        /* Cinematic Theme Switch Radial Curtain Wave */
        @keyframes stThemeRadialWave {
          0% {
            opacity: 0.92;
            clip-path: circle(0% at calc(100% - 76px) 36px);
          }
          65% {
            opacity: 0.72;
            clip-path: circle(155% at calc(100% - 76px) 36px);
          }
          100% {
            opacity: 0;
            clip-path: circle(170% at calc(100% - 76px) 36px);
          }
        }
        .st-theme-curtain {
          position: fixed;
          inset: 0;
          z-index: 160;
          pointer-events: none;
          animation: stThemeRadialWave 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Zero-Flash 60fps Luxury 3D Sheet Entry + Gold Sheen Sweep */
        @keyframes stLuxurySheetIn {
          0% {
            opacity: 0;
            transform: perspective(1200px) translate3d(0, 24px, -20px) rotateX(4deg) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: perspective(1200px) translate3d(0, 0, 0) rotateX(0deg) scale(1);
          }
        }
        @keyframes stSheenSweep {
          0% { transform: translate3d(-135%, 0, 0) skewX(-22deg); opacity: 0; }
          25% { opacity: 0.52; }
          100% { transform: translate3d(260%, 0, 0) skewX(-22deg); opacity: 0; }
        }
        .st-luxury-sheet {
          position: relative;
          overflow: hidden;
          animation: stLuxurySheetIn 0.44s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .st-luxury-sheet::before {
          content: '';
          position: absolute;
          inset: 0;
          width: 46%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.14) 45%,
            rgba(212, 175, 55, 0.22) 55%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 4;
          animation: stSheenSweep 1.05s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }

        @keyframes stWorkspaceIn {
          0% { opacity: 0; transform: translate3d(0, 14px, 0) scale(0.992); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .st-workspace-enter {
          animation: stWorkspaceIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }

        /* Video-Style Staggered Left Rail Entrance & Active Glow */
        @keyframes stRailToggleArcIn {
          0% {
            opacity: 0;
            transform: translate3d(28px, -24px, 0) scale(0.76) rotate(-8deg);
          }
          70% {
            opacity: 1;
            transform: translate3d(-2px, 2px, 0) scale(1.04) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }
        .st-rail-item-docked {
          animation: stRailToggleArcIn 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes stRailActiveGlow {
          0%, 100% { box-shadow: 0 8px 20px rgba(139, 30, 36, 0.34), 0 0 0 0 rgba(212, 175, 55, 0.36); }
          50% { box-shadow: 0 10px 24px rgba(139, 30, 36, 0.46), 0 0 0 4px rgba(212, 175, 55, 0.14); }
        }
        .st-rail-btn-active {
          animation: stRailActiveGlow 2.8s ease-in-out infinite;
        }

        @keyframes stLiveDotPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.65); }
          50% { transform: scale(1.18); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
        .st-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22C55E;
          display: inline-block;
          animation: stLiveDotPulse 2.2s ease-in-out infinite;
        }

        @keyframes stIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        .st-icon-pulse { animation: stIconPulse 2.6s ease-in-out infinite; }

        @keyframes stZeroOrbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes stRoyalFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes stSheenPass {
          0% { transform: translateX(-140%) skewX(-24deg); }
          100% { transform: translateX(260%) skewX(-24deg); }
        }
        @keyframes stSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .st-spin { animation: stSpin 0.9s linear infinite; }

        .st-brand-wordmark {
          font-family: 'Noto Serif Devanagari', 'Rozha One', 'Playfair Display', serif;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.4px;
          color: ${isDarkMode ? '#EBD28C' : '#8B1E24'};
          line-height: 1.24;
          white-space: nowrap;
        }

        .st-glass-pill {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 15px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.44);
          background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: ${textMain};
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .st-glass-pill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent);
          transform: translateX(-140%) skewX(-24deg);
        }
        .st-glass-pill:hover {
          transform: translateY(-2px);
          border-color: #EBD28C;
          background: linear-gradient(135deg, #8B1E24 0%, #4E1020 100%);
          color: #FFFFFF;
          box-shadow: 0 12px 26px rgba(139, 30, 36, 0.3);
        }
        .st-glass-pill:hover::after {
          animation: stSheenPass 0.78s ease;
        }

        .st-magnetic-cta {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 999px;
          border: 1px solid #EBD28C;
          background: linear-gradient(135deg, #8B1E24 0%, #9F1239 46%, #1E3A5F 100%);
          background-size: 200% 200%;
          animation: stRoyalFlow 6s ease infinite;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.85px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 12px 28px rgba(139, 30, 36, 0.36), inset 0 1.5px 2px rgba(255,255,255,0.38);
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .st-magnetic-cta:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 16px 36px rgba(139, 30, 36, 0.46), 0 0 20px rgba(212, 175, 55, 0.24);
        }

        /* Top Capsule Header + Video-Style Left Rail Dock */
        .st-capsule-wrap {
          position: sticky;
          top: 12px;
          z-index: 80;
          padding: 0 14px;
          pointer-events: none;
          transform-origin: left center;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease;
        }
        @media (min-width: 1120px) {
          .st-capsule-wrap.is-docked {
            opacity: 0;
            transform: perspective(900px) translate3d(-135px, 115px, -56px) rotateZ(-6deg) scale(0.76);
            pointer-events: none;
          }
        }
        .st-capsule-nav {
          pointer-events: auto;
          max-width: 1360px;
          margin: 0 auto;
          padding: 8px 12px 8px 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: ${isDarkMode ? 'rgba(9, 14, 30, 0.86)' : 'rgba(255, 253, 249, 0.92)'};
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(212, 175, 55, 0.46);
          box-shadow: ${isDarkMode
            ? '0 18px 46px rgba(0, 0, 0, 0.56), inset 0 1px 1px rgba(255,255,255,0.14)'
            : '0 14px 36px rgba(30, 58, 95, 0.11), inset 0 1px 2px rgba(255,255,255,1)'};
        }

        .st-left-rail,
        .st-topright-dock {
          display: none;
        }

        @media (min-width: 1120px) {
          .st-left-rail {
            position: fixed;
            left: 16px;
            top: 50%;
            z-index: 95;
            display: flex;
            flex-direction: column;
            gap: 7px;
            padding: 12px 10px;
            border-radius: 28px;
            background: ${isDarkMode ? 'rgba(9, 14, 30, 0.9)' : 'rgba(255, 253, 249, 0.95)'};
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid rgba(212, 175, 55, 0.5);
            box-shadow: ${isDarkMode
              ? '0 22px 54px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.14)'
              : '0 18px 44px rgba(30, 58, 95, 0.14), inset 0 1px 2px rgba(255,255,255,1)'};
            transform-origin: left center;
            transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease, width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .st-topright-dock {
            position: fixed;
            top: 16px;
            right: 20px;
            z-index: 95;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 999px;
            background: ${isDarkMode ? 'rgba(9, 14, 30, 0.9)' : 'rgba(255, 253, 249, 0.95)'};
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid rgba(212, 175, 55, 0.5);
            box-shadow: ${isDarkMode
              ? '0 18px 42px rgba(0, 0, 0, 0.56), inset 0 1px 1px rgba(255,255,255,0.14)'
              : '0 14px 36px rgba(30, 58, 95, 0.14), inset 0 1px 2px rgba(255,255,255,1)'};
            transition: transform 0.52s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.38s ease;
          }
        }

        .st-shell {
          position: relative;
          z-index: 5;
          max-width: 1360px;
          margin: 0 auto;
          padding: 20px 28px 48px 28px;
        }
        @media (min-width: 1120px) and (max-width: 1520px) {
          .st-shell {
            padding-left: 92px;
            padding-right: 28px;
          }
        }

        .st-pulse-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 22px;
          margin-bottom: 20px;
          border-radius: 24px;
          border: 1px solid ${hairline};
          background: ${isDarkMode
            ? 'linear-gradient(145deg, rgba(139, 30, 36, 0.22) 0%, rgba(15, 24, 50, 0.86) 55%, rgba(9, 14, 30, 0.92) 100%)'
            : 'linear-gradient(145deg, rgba(255, 253, 248, 0.96) 0%, rgba(246, 237, 224, 0.9) 55%, rgba(238, 242, 250, 0.88) 100%)'};
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow: ${isDarkMode
            ? '0 18px 42px rgba(0, 0, 0, 0.38), inset 0 1px 1px rgba(255,255,255,0.14)'
            : '0 12px 32px rgba(30, 58, 95, 0.08), inset 0 1px 2px rgba(255,255,255,1)'};
        }

        .st-stats-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 18px;
        }

        .st-mobile-tabs {
          display: none;
          margin-bottom: 16px;
        }

        .sx2-root.st-awwwards .sx2-content {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          background: transparent !important;
        }

        .sx2-root.st-awwwards .sx2-toast {
          border-radius: 18px !important;
          border: 1px solid rgba(212, 175, 55, 0.52) !important;
          border-left: 4px solid #D4AF37 !important;
          background: ${isDarkMode ? 'rgba(11, 18, 38, 0.94)' : 'rgba(255, 253, 248, 0.96)'} !important;
          color: ${textMain} !important;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28) !important;
          animation: stWorkspaceIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (max-width: 1119px) {
          .st-hide-md { display: none !important; }
          .st-mobile-tabs { display: block; }
        }

        @media (max-width: 720px) {
          .st-hide-sm { display: none !important; }
          .st-shell { padding: 14px 14px 36px 14px; }
          .st-capsule-wrap { top: 10px; padding: 0 10px; }
          .st-capsule-nav { padding: 7px 10px; gap: 7px; }
          .st-brand-wordmark { font-size: 16.5px; }
          .st-pulse-strip { padding: 14px 16px; gap: 12px; }
          .st-stats-row { gap: 14px; }
        }
      `}</style>

      {/* Cinematic Radial Theme Curtain */}
      {themePulseKey > 0 && (
        <div
          key={themePulseKey}
          aria-hidden="true"
          className="st-theme-curtain no-print"
          style={{
            background:
              themePulseTarget === 'espresso'
                ? 'radial-gradient(circle at top right, rgba(7, 11, 25, 0.95) 0%, rgba(139, 30, 36, 0.34) 55%, rgba(7, 11, 25, 0.86) 100%)'
                : 'radial-gradient(circle at top right, rgba(250, 249, 245, 0.95) 0%, rgba(212, 175, 55, 0.32) 55%, rgba(250, 249, 245, 0.86) 100%)',
          }}
        />
      )}

      {/* Top Glowing Scroll Progress Thread */}
      <div
        aria-hidden="true"
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #8B1E24 0%, #D4AF37 55%, #1E3A5F 100%)',
          boxShadow: '0 0 14px rgba(212, 175, 55, 0.8)',
          zIndex: 130,
          transition: 'width 0.1s linear',
        }}
      />

      {/* Guidelines-Grade 3D Floating Bubbles */}
      <StudioFloatingBubbles isDarkMode={isDarkMode} />

      {/* Subtle Ambient Royal Auroras */}
      <div
        aria-hidden="true"
        className="no-print"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-180px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '460px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(139,30,36,0.28) 0%, rgba(30,58,95,0.22) 48%, transparent 74%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(139,30,36,0.08) 48%, transparent 74%)',
            filter: 'blur(85px)',
          }}
        />
      </div>
    </>
  );

  // =========================================================================
  // AUTH CHECK LOADING SCREEN
  // =========================================================================
  if (!authChecked) {
    return (
      <div className="sx2-root st-awwwards sx2-center" data-theme={theme}>
        {sharedStyles}
        <div className="sx2-paper-grain no-print" />
        <div
          className="st-luxury-sheet"
          style={{
            position: 'relative',
            zIndex: 6,
            padding: '26px 34px',
            borderRadius: '24px',
            border: `1px solid ${hairline}`,
            background: isDarkMode ? 'rgba(13, 20, 42, 0.88)' : 'rgba(255, 253, 249, 0.94)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: "'Noto Serif Devanagari', 'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: isDarkMode ? '#EBD28C' : '#8B1E24' }}>
            Opening संRACHNA Editorial Studio...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LUXURY GLASS EDITORIAL SIGN-IN SCREEN
  // =========================================================================
  if (!userEmail) {
    return (
      <div
        ref={rootRef}
        onMouseMove={handleMouseMove}
        className="sx2-root st-awwwards sx2-center"
        data-theme={theme}
      >
        {sharedStyles}
        <div className="sx2-paper-grain no-print" />
        <div className="sx2-spotlight no-print" />

        {/* Theme Toggle on Login Screen */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Studio Theme"
          className="st-glass-pill no-print"
          style={{
            position: 'fixed',
            top: '18px',
            right: '18px',
            width: '40px',
            height: '40px',
            padding: 0,
            zIndex: 50,
          }}
          title={isDarkMode ? 'Switch to Parchment Light' : 'Switch to Royal Dark'}
        >
          <StudioThemeIcon isDark={isDarkMode} maskId="st-moon-login" />
        </button>

        {/* Orbiting Golden "Zero" Ring */}
        <div
          aria-hidden="true"
          className="no-print"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: 'min(540px, 92vw)',
            height: 'min(540px, 92vw)',
            borderRadius: '50%',
            border: `1px dashed ${isDarkMode ? 'rgba(212, 175, 55, 0.18)' : 'rgba(139, 30, 36, 0.15)'}`,
            pointerEvents: 'none',
            zIndex: 2,
            animation: 'stZeroOrbit 48s linear infinite',
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

        <div
          className="sx2-panel st-luxury-sheet"
          style={{
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            padding: '36px 32px',
            position: 'relative',
            zIndex: 6,
            border: '1px solid rgba(212, 175, 55, 0.52)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img
                src="/gec-logo.png"
                alt="GEC Godda"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  padding: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.55)',
                }}
              />
              <div style={{ width: '1.5px', height: '34px', background: 'rgba(212, 175, 55, 0.45)' }} />
              <img
                src="/sanrachna-official-logo.png"
                alt="संRACHNA"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  padding: '5px',
                  border: '1px solid rgba(212, 175, 55, 0.72)',
                }}
              />
            </div>

            <span
              style={{
                display: 'inline-block',
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '1.6px',
                textTransform: 'uppercase',
                color: '#D4AF37',
                marginBottom: '6px',
              }}
            >
              GOVERNMENT ENGINEERING COLLEGE, GODDA
            </span>

            <h1
              style={{
                fontFamily: "'Noto Serif Devanagari', 'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: '30px',
                fontWeight: 700,
                lineHeight: 1.24,
                margin: '0 0 6px 0',
                color: textMain,
              }}
            >
              <span style={{ color: isDarkMode ? '#EBD28C' : '#8B1E24' }}>संRACHNA</span> Editorial Studio
            </h1>

            <p style={{ margin: '0 0 22px 0', fontSize: '13.5px', color: textSub }}>
              Editorial &amp; Review Board Sign-In
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                required
                className="sx2-input"
                placeholder="Editorial Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ padding: '12px 14px', fontSize: '14px' }}
              />
              <input
                type="password"
                required
                className="sx2-input"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ padding: '12px 14px', fontSize: '14px' }}
              />
              {loginError && (
                <div
                  style={{
                    color: '#E11D48',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(225, 29, 72, 0.1)',
                    border: '1px solid rgba(225, 29, 72, 0.3)',
                  }}
                >
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                className="st-magnetic-cta"
                disabled={loginLoading}
                style={{ width: '100%', padding: '13px 20px', marginTop: '4px' }}
              >
                {loginLoading ? 'Signing In...' : 'Enter Studio →'}
              </button>
              <button
                type="button"
                className="st-glass-pill"
                onClick={handleExit}
                style={{ width: '100%', padding: '11px 18px' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Website</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN AUTHENTICATED EDITORIAL STUDIO
  // =========================================================================
  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      className="sx2-root st-awwwards"
      data-theme={theme}
    >
      {sharedStyles}
      <div className="sx2-paper-grain no-print" />
      <div className="sx2-spotlight no-print" />

      {/* ================================================================= */}
      {/* DESKTOP LEFT-SHIFT VERTICAL CAPSULE RAIL (VIDEO MORPH EFFECT)     */}
      {/* ================================================================= */}
      <aside
        className="st-left-rail no-print"
        onMouseEnter={() => setRailHovered(true)}
        onMouseLeave={() => setRailHovered(false)}
        style={{
          width: railHovered ? '216px' : '62px',
          opacity: isDocked ? 1 : 0,
          transform: isDocked
            ? 'translate3d(0, -50%, 0) scale(1)'
            : 'translate3d(34px, -72%, 0) scale(0.84)',
          pointerEvents: isDocked ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={handleExit}
          title="Exit to Main Website"
          className={isDocked ? 'st-rail-item-docked' : ''}
          style={{
            animationDelay: '0ms',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px',
            borderRadius: '18px',
            border: `1px solid ${hairline}`,
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(139,30,36,0.05)',
            color: textMain,
            cursor: 'pointer',
            overflow: 'hidden',
            fontFamily: 'inherit',
            transition: 'all 0.28s ease',
          }}
        >
          <img
            src="/sanrachna-official-logo.png"
            alt="संRACHNA"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              objectFit: 'contain',
              backgroundColor: '#FFFFFF',
              padding: '3px',
              border: '1px solid rgba(212, 175, 55, 0.72)',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              opacity: railHovered ? 1 : 0,
              transform: railHovered ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 0.25s ease, transform 0.3s ease',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            <div style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: '13px', fontWeight: 700, color: isDarkMode ? '#EBD28C' : '#8B1E24', lineHeight: 1.15 }}>
              संRACHNA
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: textSub }}>← Exit Studio</div>
          </div>
        </button>

        <div style={{ height: '1px', background: hairline, margin: '2px 4px' }} />

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={`${item.id}-${isDocked ? 'docked' : 'top'}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`${isDocked ? 'st-rail-item-docked' : ''} ${isActive ? 'st-rail-btn-active' : ''}`}
              style={{
                animationDelay: `${(idx + 1) * 60}ms`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px',
                borderRadius: '16px',
                border: isActive ? '1px solid rgba(212, 175, 55, 0.78)' : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, #8B1E24 0%, #5A1220 55%, #1E3A5F 100%)'
                  : 'transparent',
                color: isActive ? '#FAF9F5' : textSub,
                cursor: 'pointer',
                overflow: 'hidden',
                fontFamily: 'inherit',
                transition: 'background 0.28s ease, color 0.25s ease, border-color 0.28s ease',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                <span className={isActive ? 'st-icon-pulse' : ''} style={{ display: 'inline-flex', flexShrink: 0 }}>
                  <Icon size={18} />
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    opacity: railHovered ? 1 : 0,
                    transform: railHovered ? 'translateX(0)' : 'translateX(-8px)',
                    transition: 'opacity 0.25s ease, transform 0.3s ease',
                  }}
                >
                  {item.label}
                </span>
              </span>

              {railHovered && typeof item.badge === 'number' && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(212, 175, 55, 0.25)' : 'rgba(212, 175, 55, 0.14)',
                    color: isActive ? '#F5E6B8' : '#D4AF37',
                    flexShrink: 0,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ height: '1px', background: hairline, margin: '2px 4px' }} />

        {/* Session Curated Meter inside Docked Rail */}
        <div style={{ padding: '4px 6px 2px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '999px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(139,30,36,0.12)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${sessionPct}%`,
                  background: 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                  borderRadius: '999px',
                  transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
            {railHovered && (
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#D4AF37', fontVariantNumeric: 'tabular-nums' }}>
                {reviewedInSession} done
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* DESKTOP PERSISTENT TOP-RIGHT ACTION DOCK                          */}
      {/* ================================================================= */}
      <div
        className="st-topright-dock no-print"
        style={{
          opacity: isDocked ? 1 : 0,
          transform: isDocked ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(20px, -16px, 0) scale(0.92)',
          pointerEvents: isDocked ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="st-glass-pill"
          style={{ padding: '8px 13px', fontSize: '11px' }}
          title="Open Quick Command (Ctrl+K)"
        >
          <Command size={13} />
          <span>Ctrl+K</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="st-glass-pill"
          style={{ width: '36px', height: '36px', padding: 0 }}
          title={isDarkMode ? 'Switch to Parchment Light' : 'Switch to Royal Dark'}
        >
          <StudioThemeIcon isDark={isDarkMode} maskId="st-moon-dock" />
        </button>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="st-glass-pill"
          style={{ width: '36px', height: '36px', padding: 0 }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* ================================================================= */}
      {/* TOP FLOATING CAPSULE HEADER                                       */}
      {/* ================================================================= */}
      <div className={`st-capsule-wrap no-print ${isDocked ? 'is-docked' : ''}`}>
        <header className="st-capsule-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <button
              type="button"
              onClick={handleExit}
              className="st-glass-pill"
              style={{ padding: '7px 12px', fontSize: '11px', flexShrink: 0 }}
              title="Exit to Website"
            >
              <ArrowLeft size={14} />
              <span className="st-hide-sm">Site</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <img
                src="/sanrachna-official-logo.png"
                alt="संRACHNA"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  padding: '3px',
                  border: '1px solid rgba(212, 175, 55, 0.72)',
                  flexShrink: 0,
                }}
              />
              <div style={{ lineHeight: 1.1, minWidth: 0 }}>
                <div className="st-brand-wordmark">संRACHNA</div>
                <div
                  className="st-hide-sm"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    letterSpacing: '1.4px',
                    textTransform: 'uppercase',
                    color: '#D4AF37',
                  }}
                >
                  Editorial Studio
                </div>
              </div>
            </div>
          </div>

          <div className="st-hide-md">
            <StudioSlidingPillTabs
              compact
              isDarkMode={isDarkMode}
              activeId={activeTab}
              onSelect={setActiveTab}
              items={navItems}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="st-glass-pill st-hide-sm"
              style={{ padding: '7px 12px', fontSize: '11px' }}
              title="Quick Command (Ctrl+K)"
            >
              <Command size={13} />
              <span>Ctrl+K</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="st-glass-pill"
              style={{ width: '36px', height: '36px', padding: 0 }}
              title={isDarkMode ? 'Switch to Parchment Light' : 'Switch to Royal Dark'}
            >
              <StudioThemeIcon isDark={isDarkMode} maskId="st-moon-top" />
            </button>

            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="st-glass-pill"
              style={{ padding: '7px 12px', fontSize: '11px' }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span className="st-hide-sm">Sign Out</span>
            </button>
          </div>
        </header>
      </div>

      {/* ================================================================= */}
      {/* STUDIO SHELL: MOBILE TABS + LIVE PULSE BAR + WORKSPACE            */}
      {/* ================================================================= */}
      <div className="st-shell">
        {/* Mobile/Tablet Single-Row Scrollable Pill Tabs */}
        <div className="st-mobile-tabs no-print">
          <StudioSlidingPillTabs
            isDarkMode={isDarkMode}
            activeId={activeTab}
            onSelect={setActiveTab}
            items={navItems}
          />
        </div>

        {/* Live Editorial Pulse & Odometer Strip */}
        <section className="st-pulse-strip no-print">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.9px',
                  textTransform: 'uppercase',
                  background: 'rgba(34, 197, 94, 0.14)',
                  color: '#22C55E',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                }}
              >
                <span className="st-live-dot" />
                <span>Live Sync</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: isDarkMode ? '#EBD28C' : '#8B1E24',
                }}
              >
                <Sparkles size={13} />
                <span>Edition I • The Zero (शून्य)</span>
              </span>
            </div>

            <div style={{ fontSize: '12px', color: textSub, fontWeight: 500 }}>
              Signed in as <strong style={{ color: textMain }}>{userEmail}</strong>
            </div>
          </div>

          <div className="st-stats-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <Inbox size={16} color="#D4AF37" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: textSub }}>
                  Total
                </div>
                <StudioAnimateDigits value={submissions.length} fontSize={24} color={textMain} />
              </div>
            </div>

            <div style={{ width: '1px', height: '30px', background: hairline }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <Clock size={16} color="#E11D48" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: textSub }}>
                  Pending
                </div>
                <StudioAnimateDigits value={pendingCount} fontSize={24} color={isDarkMode ? '#FDA4AF' : '#9F1239'} />
              </div>
            </div>

            <div style={{ width: '1px', height: '30px', background: hairline }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <CheckCircle2 size={16} color="#22C55E" />
              <div style={{ textAlign: 'left', minWidth: '92px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: textSub }}>
                  <span>Curated</span>
                  <span style={{ color: '#22C55E', fontVariantNumeric: 'tabular-nums' }}>{reviewedInSession}</span>
                </div>
                <div
                  style={{
                    marginTop: '6px',
                    height: '5px',
                    width: '100%',
                    borderRadius: '999px',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(139,30,36,0.12)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${sessionPct}%`,
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #8B1E24, #D4AF37, #22C55E)',
                      transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchSubmissions}
              className="st-glass-pill"
              style={{ padding: '8px 13px', fontSize: '11px' }}
              title="Refresh Submissions"
            >
              <RefreshCw size={13} className={loadingSub ? 'st-spin' : ''} />
              <span className="st-hide-sm">{loadingSub ? 'Syncing' : 'Refresh'}</span>
            </button>
          </div>
        </section>

        {/* Active Workspace with Zero-Flash GPU Transition */}
        <main key={activeTab} className="sx2-content st-workspace-enter">
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
      </div>

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
            <div key={t.id} className="sx2-toast">
              <strong>{t.title}</strong>
              <span>{t.subtitle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
