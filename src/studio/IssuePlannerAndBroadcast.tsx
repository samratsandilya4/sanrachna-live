import { useState, useMemo } from 'react';
import type {
  AnnouncementItem,
  StudioTab,
  SubmissionMetaLocal,
  SubmissionRow,
} from './types';
import { DEFAULT_META, STATUS_OPTIONS } from './helpers';

interface IssuePlannerAndBroadcastProps {
  activeTab: Extract<StudioTab, 'toc' | 'announcements' | 'analytics' | 'controls'>;
  submissions: SubmissionRow[];
  metaMap: Record<string, SubmissionMetaLocal>;
  onUpdateMeta: (refId: string, updater: (prev: SubmissionMetaLocal) => SubmissionMetaLocal) => void;
  announcements: AnnouncementItem[];
  onSaveAnnouncement: (
    payload: {
      title: string;
      message: string;
      tag: AnnouncementItem['tag'];
      display_type: AnnouncementItem['display_type'];
      is_pinned: boolean;
    },
    editingId: string | null
  ) => Promise<{ ok: boolean; error?: string }>;
  onToggleAnnouncement: (id: string, field: 'is_active' | 'is_pinned', nextVal: boolean) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  submissionsClosed: boolean;
  onChangeSubmissionsClosed: (val: boolean) => void;
  guidelinesUrl: string;
  onChangeGuidelinesUrl: (val: string) => void;
  templateUrl: string;
  onChangeTemplateUrl: (val: string) => void;
  onSavePortalControls: () => Promise<{ ok: boolean; error?: string }>;
}

export default function IssuePlannerAndBroadcast({
  activeTab,
  submissions,
  metaMap,
  onUpdateMeta,
  announcements,
  onSaveAnnouncement,
  onToggleAnnouncement,
  onDeleteAnnouncement,
  submissionsClosed,
  onChangeSubmissionsClosed,
  guidelinesUrl,
  onChangeGuidelinesUrl,
  templateUrl,
  onChangeTemplateUrl,
  onSavePortalControls,
}: IssuePlannerAndBroadcastProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState<AnnouncementItem['tag']>('Notice');
  const [displayType, setDisplayType] = useState<AnnouncementItem['display_type']>('both');
  const [pinned, setPinned] = useState(false);
  const [savingAnn, setSavingAnn] = useState(false);
  const [annMsg, setAnnMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [savingCtl, setSavingCtl] = useState(false);
  const [ctlMsg, setCtlMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const liveMarqueePreview = useMemo(() => {
    const activeItems = announcements.filter(
      (a) => a.is_active && (a.display_type === 'ticker' || a.display_type === 'both')
    );
    if (!activeItems.length) {
      return 'EDITION 2026 • THEME: THE ZERO (शून्य) • SEND YOUR ORIGINAL ARTICLES, POETRY, AND ARTWORK TO SANRACHNA.GECGODDA@GMAIL.COM';
    }
    return activeItems
      .map((n) => `${n.title.toUpperCase()} • ${n.message.toUpperCase()}`)
      .join('  ✦  ');
  }, [announcements]);

  const tocEntries = useMemo(() => {
    const eligible = submissions.filter((s) =>
      ['Published', 'Reviewed', 'Edited'].includes(s.status || '')
    );
    return [...eligible].sort((a, b) => {
      const oa = metaMap[a.reference_id]?.tocOrder ?? 9999;
      const ob = metaMap[b.reference_id]?.tocOrder ?? 9999;
      if (oa !== ob) return oa - ob;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [submissions, metaMap]);

  const moveTocOrder = (refId: string, delta: number) => {
    const idx = tocEntries.findIndex((x) => x.reference_id === refId);
    const swapIdx = idx + delta;
    if (idx < 0 || swapIdx < 0 || swapIdx >= tocEntries.length) return;
    const currentItem = tocEntries[idx];
    const neighborItem = tocEntries[swapIdx];
    const currentOrder = metaMap[currentItem.reference_id]?.tocOrder ?? idx + 1;
    const neighborOrder = metaMap[neighborItem.reference_id]?.tocOrder ?? swapIdx + 1;

    onUpdateMeta(currentItem.reference_id, (m) => ({ ...DEFAULT_META, ...m, tocOrder: neighborOrder }));
    onUpdateMeta(neighborItem.reference_id, (m) => ({ ...DEFAULT_META, ...m, tocOrder: currentOrder }));
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSavingAnn(true);
    setAnnMsg(null);

    const res = await onSaveAnnouncement(
      {
        title: title.trim(),
        message: message.trim(),
        tag,
        display_type: displayType,
        is_pinned: pinned,
      },
      editingId
    );
    setSavingAnn(false);

    if (!res.ok) {
      setAnnMsg({ type: 'err', text: res.error || 'Failed to publish.' });
      return;
    }

    setEditingId(null);
    setTitle('');
    setMessage('');
    setPinned(false);
    setAnnMsg({
      type: 'ok',
      text:
        displayType === 'both'
          ? 'Live on Top Marquee & Notice Board!'
          : 'Published live to website!',
    });
    setTimeout(() => setAnnMsg(null), 3200);
  };

  if (activeTab === 'announcements') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }} className="sx2-fade">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', margin: '0 0 6px' }}>
          Marquee &amp; Notice Board
        </h1>
        <p className="sx2-muted" style={{ margin: '0 0 14px' }}>
          Publish or edit notices for <strong>Both (Marquee + Notice Board)</strong>, <strong>Top Marquee</strong>, or <strong>Notice Board</strong>.
        </p>

        <div
          style={{
            background: '#6E1423',
            color: '#FDF7EC',
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #B68621',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              background: '#E5C158',
              color: '#2B080E',
              fontSize: '9.5px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              padding: '3px 8px',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          >
            LIVE MARQUEE
          </span>
          <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📢 {liveMarqueePreview}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px', alignItems: 'start' }}>
          <form onSubmit={handleAnnSubmit} className="sx2-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span className="sx2-kicker">{editingId ? 'EDIT ANNOUNCEMENT' : 'CREATE ANNOUNCEMENT'}</span>
            <input
              type="text"
              required
              className="sx2-input"
              placeholder="Headline (e.g., Edition I Submissions Extended)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              rows={3}
              required
              className="sx2-input"
              placeholder="Announcement body text..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--sx-muted)', marginBottom: '4px' }}>
                  PLACEMENT
                </label>
                <select
                  className="sx2-select"
                  style={{ width: '100%' }}
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value as AnnouncementItem['display_type'])}
                >
                  <option value="both">✦ Both: Marquee + Notice Board</option>
                  <option value="ticker">📢 Top Marquee Only</option>
                  <option value="notice">📋 Notice Board Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--sx-muted)', marginBottom: '4px' }}>
                  TAG
                </label>
                <select
                  className="sx2-select"
                  style={{ width: '100%' }}
                  value={tag}
                  onChange={(e) => setTag(e.target.value as AnnouncementItem['tag'])}
                >
                  <option value="Notice">Notice</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Event">Event</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin to top
            </label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" className="sx2-btn-maroon" disabled={savingAnn}>
                {savingAnn ? 'Publishing...' : editingId ? 'Update Live →' : 'Publish Live →'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="sx2-btn-ghost"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setMessage('');
                  }}
                >
                  Cancel
                </button>
              )}
              {annMsg && (
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: annMsg.type === 'ok' ? '#15803D' : '#B91C1C' }}>
                  {annMsg.text}
                </span>
              )}
            </div>
          </form>

          <div className="sx2-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="sx2-kicker">SAVED ANNOUNCEMENTS ({announcements.length})</span>
            {announcements.length === 0 ? (
              <div className="sx2-muted">No announcements yet.</div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--sx-border)',
                    background: 'var(--sx-panel-solid)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--sx-accent)' }}>
                      {(a.display_type || 'notice').toUpperCase()} • {a.tag}
                    </span>
                    <span style={{ fontWeight: 700, color: a.is_active ? '#15803D' : 'var(--sx-muted)' }}>
                      {a.is_active ? '● Live' : '○ Hidden'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{a.title}</div>
                  <p className="sx2-muted" style={{ margin: '4px 0 10px' }}>{a.message}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="sx2-btn-ghost"
                      onClick={() => {
                        setEditingId(a.id);
                        setTitle(a.title);
                        setMessage(a.message);
                        setTag(a.tag);
                        setDisplayType(a.display_type || 'both');
                        setPinned(Boolean(a.is_pinned));
                      }}
                    >
                      ✎ Edit
                    </button>
                    <button
                      type="button"
                      className="sx2-btn-ghost"
                      onClick={() => onToggleAnnouncement(a.id, 'is_active', a.is_active)}
                    >
                      {a.is_active ? 'Hide' : 'Show Live'}
                    </button>
                    <button type="button" className="sx2-btn-danger" onClick={() => onDeleteAnnouncement(a.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'toc') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }} className="sx2-fade">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', margin: '0 0 6px' }}>
          Issue Planner (Table of Contents)
        </h1>
        <p className="sx2-muted" style={{ margin: '0 0 18px' }}>
          Arrange <strong>Edited</strong>, <strong>Reviewed</strong>, and <strong>Published</strong> works in issue order.
        </p>

        <div className="sx2-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '820px' }}>
          {tocEntries.length === 0 ? (
            <div className="sx2-muted">Mark entries as Edited, Reviewed, or Published to sequence them here.</div>
          ) : (
            tocEntries.map((item, index) => (
              <div
                key={item.reference_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--sx-border)',
                  background: 'var(--sx-panel-solid)',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--sx-accent)' }}>
                    #{String(index + 1).padStart(2, '0')} • {item.reference_id}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{item.title_description}</div>
                  <div className="sx2-muted">
                    {item.full_name} • {item.submission_type} • <strong>{item.status}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" className="sx2-btn-ghost" disabled={index === 0} onClick={() => moveTocOrder(item.reference_id, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="sx2-btn-ghost"
                    disabled={index === tocEntries.length - 1}
                    onClick={() => moveTocOrder(item.reference_id, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    const total = submissions.length;
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }} className="sx2-fade">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', margin: '0 0 18px' }}>
          Issue Insights
        </h1>
        <div className="sx2-panel" style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span className="sx2-kicker">SUBMISSION PIPELINE DISTRIBUTION</span>
          {STATUS_OPTIONS.map((st) => {
            const count = submissions.filter((s) => (s.status || 'Received') === st).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={st}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{st}</span>
                  <strong>{count} ({pct}%)</strong>
                </div>
                <div style={{ height: '8px', borderRadius: '999px', background: 'var(--sx-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sx-accent)', borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px' }} className="sx2-fade">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', margin: '0 0 18px' }}>
        Portal Controls
      </h1>
      <div className="sx2-panel" style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <span className="sx2-kicker">SUBMISSION DESK &amp; DOWNLOADS</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={submissionsClosed}
            onChange={(e) => onChangeSubmissionsClosed(e.target.checked)}
          />
          <span>Close Public Submission Portal (contributors can still track IDs)</span>
        </label>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--sx-muted)', marginBottom: '4px' }}>
            GUIDELINES PDF URL
          </label>
          <input className="sx2-input" style={{ width: '100%' }} value={guidelinesUrl} onChange={(e) => onChangeGuidelinesUrl(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--sx-muted)', marginBottom: '4px' }}>
            SUBMISSION TEMPLATE URL
          </label>
          <input className="sx2-input" style={{ width: '100%' }} value={templateUrl} onChange={(e) => onChangeTemplateUrl(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="sx2-btn-maroon"
            disabled={savingCtl}
            onClick={async () => {
              setSavingCtl(true);
              const res = await onSavePortalControls();
              setSavingCtl(false);
              setCtlMsg(res.ok ? { type: 'ok', text: '✓ Saved portal settings' } : { type: 'err', text: res.error || 'Error' });
              setTimeout(() => setCtlMsg(null), 2800);
            }}
          >
            {savingCtl ? 'Saving...' : 'Save Portal Controls'}
          </button>
          {ctlMsg && (
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: ctlMsg.type === 'ok' ? '#15803D' : '#B91C1C' }}>
              {ctlMsg.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}