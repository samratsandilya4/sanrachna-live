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
      const next = prev === 'parchment' ? 'espresso' : 'parchment';
      localStorage.setItem(STUDIO_THEME_KEY, next);
      return next;
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--mx', `${e.clientX}px`);
    rootRef.current.style.setProperty('--my', `${e.clientY}px`);
  };

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

  if (!authChecked) {
    return (
      <div className="sx2-root sx2-center" data-theme={theme}>
        <div className="sx2-paper-grain" />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}>
          Opening संRACHNA Editorial Studio...
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div ref={rootRef} onMouseMove={handleMouseMove} className="sx2-root sx2-center" data-theme={theme}>
        <div className="sx2-paper-grain" />
        <div className="sx2-spotlight" />
        <div
          className="sx2-panel sx2-fade"
          style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '32px' }}
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
      <div className="sx2-paper-grain no-print" />
      <div className="sx2-spotlight no-print" />

      <aside className="sx2-rail no-print">
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
              <div className="sx2-mini-fill" style={{ width: `${sessionPct}%` }} />
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

      <main className="sx2-content">
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