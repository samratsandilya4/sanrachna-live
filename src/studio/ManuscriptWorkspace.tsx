import { useState, useMemo } from 'react';
import type {
  PrePressChecklist,
  PrintMode,
  SubmissionMetaLocal,
  SubmissionRow,
  ViewMode,
} from './types';
import {
  buildWhatsAppHref,
  COMMS_TEMPLATES,
  DEFAULT_META,
  estimateAbstractMetrics,
  exportSubmissionsCsv,
  getDuplicateMap,
  getStatusStyle,
  STATUS_OPTIONS,
  SUBMISSION_TYPES,
} from './helpers';

interface ManuscriptWorkspaceProps {
  submissions: SubmissionRow[];
  loading: boolean;
  error: string;
  selectedRef: string | null;
  onSelectRef: (refId: string | null) => void;
  metaMap: Record<string, SubmissionMetaLocal>;
  onUpdateMeta: (refId: string, updater: (prev: SubmissionMetaLocal) => SubmissionMetaLocal) => void;
  onSaveSubmission: (
    refId: string,
    payload: { status: string; editorial_note: string | null; internal_note: string | null }
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteSubmission: (refId: string) => Promise<{ ok: boolean; error?: string }>;
  onBulkStatusChange: (refIds: string[], nextStatus: string) => Promise<void>;
  onRefresh: () => void;
  onOpenPrint: (mode: PrintMode) => void;
}

export default function ManuscriptWorkspace({
  submissions,
  loading,
  error,
  selectedRef,
  onSelectRef,
  metaMap,
  onUpdateMeta,
  onSaveSubmission,
  onDeleteSubmission,
  onBulkStatusChange,
  onRefresh,
  onOpenPrint,
}: ManuscriptWorkspaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);
  const [paperReader, setPaperReader] = useState(false);

  const selectedEntry = useMemo(
    () => submissions.find((s) => s.reference_id === selectedRef) || null,
    [submissions, selectedRef]
  );

  const [draftRef, setDraftRef] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('Received');
  const [editNote, setEditNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [waMessage, setWaMessage] = useState('');
  const [showWaBox, setShowWaBox] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('Under Review');
  const [copiedId, setCopiedId] = useState(false);

  if (selectedEntry && selectedEntry.reference_id !== draftRef) {
    setDraftRef(selectedEntry.reference_id);
    setEditStatus(selectedEntry.status || 'Received');
    setEditNote(selectedEntry.editorial_note || '');
    setInternalNote(selectedEntry.internal_note || '');
    setWaMessage(COMMS_TEMPLATES[0].build(selectedEntry));
    setShowWaBox(false);
    setFeedback(null);
    setConfirmDelete(false);
  }

  const duplicateMap = useMemo(() => getDuplicateMap(submissions), [submissions]);

  const stats = useMemo(
    () => ({
      total: submissions.length,
      unread: submissions.filter((s) => (s.status || 'Received') === 'Received').length,
      inProgress: submissions.filter((s) =>
        ['Read', 'Under Review', 'Edited', 'Revision Needed'].includes(s.status || '')
      ).length,
      published: submissions.filter((s) => ['Reviewed', 'Published'].includes(s.status || '')).length,
    }),
    [submissions]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((item) => {
      const st = item.status || 'Received';
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (typeFilter !== 'ALL' && item.submission_type !== typeFilter) return false;
      if (onlyDuplicates && !duplicateMap[item.reference_id]) return false;
      if (!q) return true;
      return (
        item.reference_id.toLowerCase().includes(q) ||
        item.full_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.submission_type.toLowerCase().includes(q) ||
        (item.title_description || '').toLowerCase().includes(q)
      );
    });
  }, [submissions, searchQuery, statusFilter, typeFilter, onlyDuplicates, duplicateMap]);

  const activeMeta: SubmissionMetaLocal = selectedEntry
    ? { ...DEFAULT_META, ...(metaMap[selectedEntry.reference_id] || {}) }
    : DEFAULT_META;

  const metrics = selectedEntry
    ? estimateAbstractMetrics(selectedEntry.title_description)
    : { words: 0, chars: 0, mins: 1 };

  const toggleBulkId = (refId: string) => {
    setSelectedBulk((prev) =>
      prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]
    );
  };

  const handleSave = async (forcedStatus?: string) => {
    if (!selectedEntry) return;
    const nextSt = forcedStatus || editStatus;
    setSaving(true);
    setFeedback(null);
    const res = await onSaveSubmission(selectedEntry.reference_id, {
      status: nextSt,
      editorial_note: editNote.trim() || null,
      internal_note: internalNote.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error || 'Could not save changes.' });
      return;
    }
    setEditStatus(nextSt);
    onUpdateMeta(selectedEntry.reference_id, (m) => ({
      ...m,
      activity: [
        {
          id: `${Date.now()}`,
          action: `Status set to ${nextSt}`,
          by: 'Editorial Board',
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...(m.activity || []).slice(0, 7),
      ],
    }));
    setFeedback({ type: 'ok', text: `Saved • ${nextSt}` });
    setTimeout(() => setFeedback(null), 2800);
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    setDeleting(true);
    const res = await onDeleteSubmission(selectedEntry.reference_id);
    setDeleting(false);
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error || 'Delete failed.' });
    } else {
      onSelectRef(null);
    }
  };

  const setStarScore = (field: 'originality' | 'themeZero' | 'craft', val: number) => {
    if (!selectedEntry) return;
    onUpdateMeta(selectedEntry.reference_id, (m) => ({
      ...m,
      scores: { ...m.scores, [field]: val },
    }));
  };

  const toggleCheck = (key: keyof PrePressChecklist) => {
    if (!selectedEntry) return;
    onUpdateMeta(selectedEntry.reference_id, (m) => ({
      ...m,
      checklist: { ...m.checklist, [key]: !m.checklist[key] },
    }));
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header
        style={{
          padding: '14px 22px 12px',
          borderBottom: '1px solid var(--sx-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'TOTAL ENTRIES', val: stats.total, filter: 'ALL', color: 'var(--sx-text)' },
            { label: 'UNREAD / NEW', val: stats.unread, filter: 'Received', color: 'var(--sx-accent)' },
            { label: 'IN CURATION', val: stats.inProgress, filter: 'Under Review', color: '#0369A1' },
            { label: 'PUBLISHED / READY', val: stats.published, filter: 'Published', color: '#15803D' },
          ].map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => setStatusFilter(k.filter)}
              className="sx2-panel"
              style={{
                padding: '10px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: statusFilter === k.filter ? 'var(--sx-accent)' : undefined,
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--sx-muted)' }}>
                {k.label}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: k.color }}>
                {k.val}
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="sx2-input"
            style={{ flex: 1, minWidth: '190px' }}
            placeholder="Search author, SAN-2026-XXXX, email, title... (↑ ↓ keys)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="sx2-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All Formats</option>
            {SUBMISSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className="sx2-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <button
            type="button"
            className={`sx2-btn-ghost ${onlyDuplicates ? 'active-pill' : ''}`}
            onClick={() => setOnlyDuplicates((v) => !v)}
          >
            ⚠ Dupes ({Object.keys(duplicateMap).length})
          </button>

          <div style={{ display: 'inline-flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--sx-border)' }}>
            {(['split', 'kanban', 'gallery'] as ViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                style={{
                  padding: '8px 11px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  background: viewMode === m ? 'var(--sx-accent)' : 'var(--sx-panel-solid)',
                  color: viewMode === m ? 'var(--sx-accent-contrast)' : 'var(--sx-text)',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <button type="button" className="sx2-btn-ghost" onClick={() => exportSubmissionsCsv(filtered)}>
            ⬇ CSV
          </button>
          <button type="button" className="sx2-btn-ghost" onClick={() => onOpenPrint('shortlist')}>
            🖨 List
          </button>
          <button type="button" className="sx2-btn-ghost" onClick={onRefresh} title="Refresh">
            ↻
          </button>
        </div>

        {selectedBulk.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'var(--sx-panel-solid)',
              border: '1px solid var(--sx-accent)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--sx-accent)' }}>
              {selectedBulk.length} entries selected
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="sx2-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button
                type="button"
                className="sx2-btn-maroon"
                onClick={async () => {
                  await onBulkStatusChange(selectedBulk, bulkStatus);
                  setSelectedBulk([]);
                }}
              >
                Apply Bulk Status
              </button>
              <button type="button" className="sx2-btn-ghost" onClick={() => setSelectedBulk([])}>
                Clear
              </button>
            </div>
          </div>
        )}
      </header>

      {error && <div style={{ padding: '8px 22px', color: '#B91C1C', fontSize: '12.5px' }}>{error}</div>}

      {viewMode === 'split' && (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(290px, 355px) 1fr', overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', borderRight: '1px solid var(--sx-border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div className="sx2-muted" style={{ padding: '32px', textAlign: 'center' }}>Loading entries...</div>
            ) : filtered.length === 0 ? (
              <div className="sx2-muted" style={{ padding: '32px', textAlign: 'center' }}>No manuscripts found.</div>
            ) : (
              filtered.map((item) => {
                const st = getStatusStyle(item.status);
                const active = selectedRef === item.reference_id;
                const isDup = Boolean(duplicateMap[item.reference_id]);
                return (
                  <div
                    key={item.reference_id}
                    onClick={() => onSelectRef(item.reference_id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '13px',
                      cursor: 'pointer',
                      background: active ? 'var(--sx-panel-solid)' : 'var(--sx-panel)',
                      border: `1px solid ${active ? 'var(--sx-accent)' : 'var(--sx-border)'}`,
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={selectedBulk.includes(item.reference_id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleBulkId(item.reference_id)}
                        />
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--sx-accent)' }}>
                          {item.reference_id}
                        </span>
                        {isDup && (
                          <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#B91C1C', background: 'rgba(185,28,28,0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                            DUP ×{duplicateMap[item.reference_id]}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          color: st.color,
                          background: st.bg,
                          border: `1px solid ${st.border}`,
                        }}
                      >
                        {item.status || 'Received'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', marginTop: '5px' }}>{item.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--sx-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title_description}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              overflowY: 'auto',
              padding: '20px 26px 48px',
              background: paperReader ? '#FAF3E3' : 'transparent',
              color: paperReader ? '#1E1916' : 'var(--sx-text)',
            }}
          >
            {!selectedEntry ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--sx-muted)' }}>
                <div style={{ fontSize: '34px', color: 'var(--sx-gold)', marginBottom: '10px' }}>✦</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", margin: '0 0 6px', color: 'var(--sx-text)' }}>
                  Select a Manuscript
                </h2>
                <p style={{ fontSize: '13.5px' }}>
                  Score entries, complete pre-press checks, issue an E-Certificate, or print an Author Card.
                </p>
              </div>
            ) : (
              <div key={selectedEntry.reference_id} className="sx2-fade" style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button type="button" className="sx2-btn-ghost" onClick={() => onSelectRef(null)}>
                    ← Back to List
                  </button>
                  <button
                    type="button"
                    className={`sx2-btn-ghost ${paperReader ? 'active-pill' : ''}`}
                    onClick={() => setPaperReader((v) => !v)}
                  >
                    📖 Focus Paper
                  </button>
                  <button type="button" className="sx2-btn-maroon" onClick={() => onOpenPrint('certificate')}>
                    🎓 E-Certificate
                  </button>
                  <button type="button" className="sx2-btn-gold" onClick={() => onOpenPrint('author_card')}>
                    🪪 Author Card
                  </button>
                </div>

                <div className="sx2-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {selectedEntry.author_photo_url && (
                        <img
                          src={selectedEntry.author_photo_url}
                          alt={selectedEntry.full_name}
                          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--sx-gold)' }}
                        />
                      )}
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700, color: 'var(--sx-accent)' }}>
                            {selectedEntry.reference_id}
                          </span>
                          <button
                            type="button"
                            className="sx2-btn-ghost"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            onClick={() => {
                              navigator.clipboard.writeText(selectedEntry.reference_id);
                              setCopiedId(true);
                              setTimeout(() => setCopiedId(false), 1800);
                            }}
                          >
                            {copiedId ? '✓ Copied' : 'Copy ID'}
                          </button>
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '23px', margin: '2px 0' }}>
                          {selectedEntry.full_name}
                        </h2>
                        <div className="sx2-muted">
                          {selectedEntry.contributed_by}
                          {selectedEntry.semester_class ? ` • ${selectedEntry.semester_class}` : ''}
                          {selectedEntry.designation ? ` • ${selectedEntry.designation}` : ''} • {selectedEntry.institution_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={`mailto:${selectedEntry.email}?subject=${encodeURIComponent(
                          `संRACHNA 2026 — ${selectedEntry.reference_id}`
                        )}&body=${encodeURIComponent(waMessage)}`}
                        className="sx2-btn-ghost"
                      >
                        ✉ Email
                      </a>
                      {selectedEntry.phone && (
                        <>
                          <button type="button" className="sx2-btn-ghost" onClick={() => setShowWaBox((v) => !v)}>
                            ✎ Templates
                          </button>
                          <a
                            href={buildWhatsAppHref(selectedEntry.phone, waMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sx2-btn-wa"
                          >
                            WhatsApp ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {showWaBox && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--sx-border)' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {COMMS_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.label}
                            type="button"
                            className="sx2-btn-ghost"
                            style={{ fontSize: '11px', padding: '5px 10px' }}
                            onClick={() => setWaMessage(tpl.build(selectedEntry))}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        className="sx2-input"
                        style={{ width: '100%' }}
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="sx2-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="sx2-kicker">MANUSCRIPT &amp; FILES</span>
                    <span className="sx2-muted">
                      {metrics.words} words • ~{metrics.mins} min read
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '0 0 6px' }}>
                    {selectedEntry.title_description}
                  </h3>
                  <div className="sx2-muted" style={{ marginBottom: '12px' }}>
                    {selectedEntry.submission_category} • {selectedEntry.submission_type}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedEntry.content_file_1_url && (
                      <a href={selectedEntry.content_file_1_url} target="_blank" rel="noopener noreferrer" className="sx2-btn-ghost">
                        📄 File 01 ↗
                      </a>
                    )}
                    {selectedEntry.content_file_2_url && (
                      <a href={selectedEntry.content_file_2_url} target="_blank" rel="noopener noreferrer" className="sx2-btn-ghost">
                        📄 File 02 ↗
                      </a>
                    )}
                    {selectedEntry.author_photo_url && (
                      <a href={selectedEntry.author_photo_url} target="_blank" rel="noopener noreferrer" className="sx2-btn-ghost">
                        🖼 Portrait ↗
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div className="sx2-panel">
                    <span className="sx2-kicker">EDITORIAL RUBRIC (1–5)</span>
                    {(
                      [
                        ['originality', 'Originality'],
                        ['themeZero', 'Theme: The Zero (शून्य)'],
                        ['craft', 'Craft & Clarity'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{label}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setStarScore(key, n)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '15px',
                                color: activeMeta.scores[key] >= n ? 'var(--sx-gold)' : 'var(--sx-muted)',
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sx2-panel">
                    <span className="sx2-kicker">PRE-PRESS CHECKLIST</span>
                    {(
                      [
                        ['plagiarismChecked', 'Originality / Plagiarism Verified'],
                        ['grammarProofed', 'Language & Proofreading Done'],
                        ['highResMediaOk', 'Image / Artwork Resolution OK'],
                        ['layoutReady', 'Ready for Magazine Layout'],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', marginBottom: '7px', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(activeMeta.checklist[key])}
                          onChange={() => toggleCheck(key)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sx2-panel">
                  <span className="sx2-kicker">CURATION STAGE &amp; NOTES</span>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '9px',
                          border: `1px solid ${editStatus === st ? 'var(--sx-accent)' : 'var(--sx-border)'}`,
                          background: editStatus === st ? 'var(--sx-accent)' : 'var(--sx-panel-solid)',
                          color: editStatus === st ? 'var(--sx-accent-contrast)' : 'var(--sx-text)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    <textarea
                      rows={2}
                      className="sx2-input"
                      placeholder="Public Editorial Note (visible to contributor on Track Status)"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                    <textarea
                      rows={2}
                      className="sx2-input"
                      placeholder="Private Board Note (internal only)"
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="sx2-btn-maroon" disabled={saving} onClick={() => handleSave()}>
                      {saving ? 'Saving...' : 'Save Status & Notes'}
                    </button>
                    {editStatus !== 'Published' && (
                      <button type="button" className="sx2-btn-gold" disabled={saving} onClick={() => handleSave('Published')}>
                        ✦ Approve &amp; Publish
                      </button>
                    )}
                    {feedback && (
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: feedback.type === 'ok' ? '#15803D' : '#B91C1C' }}>
                        {feedback.text}
                      </span>
                    )}
                  </div>

                  {activeMeta.activity.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--sx-border)', fontSize: '11.5px', color: 'var(--sx-muted)' }}>
                      <strong style={{ color: 'var(--sx-text)' }}>Recent Activity:</strong>{' '}
                      {activeMeta.activity.map((a) => `${a.action} (${a.at})`).join(' • ')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {!confirmDelete ? (
                    <button type="button" className="sx2-btn-danger" onClick={() => setConfirmDelete(true)}>
                      Delete Entry
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 700 }}>Permanently delete?</span>
                      <button type="button" className="sx2-btn-danger" style={{ background: '#B91C1C', color: '#fff' }} disabled={deleting} onClick={handleDelete}>
                        {deleting ? '...' : 'Yes, Delete'}
                      </button>
                      <button type="button" className="sx2-btn-ghost" onClick={() => setConfirmDelete(false)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {STATUS_OPTIONS.map((st) => {
            const cols = filtered.filter((s) => (s.status || 'Received') === st);
            return (
              <div
                key={st}
                className="sx2-panel"
                style={{ width: '265px', flexShrink: 0, padding: '12px', maxHeight: '100%', overflowY: 'auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: 800 }}>
                  <span>{st}</span>
                  <span style={{ color: 'var(--sx-accent)' }}>{cols.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cols.map((item) => (
                    <button
                      key={item.reference_id}
                      type="button"
                      onClick={() => {
                        onSelectRef(item.reference_id);
                        setViewMode('split');
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--sx-border)',
                        background: 'var(--sx-panel-solid)',
                        color: 'var(--sx-text)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: 'var(--sx-accent)' }}>{item.reference_id}</div>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{item.full_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--sx-muted)' }}>{item.title_description}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'gallery' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
          {filtered.map((item) => {
            const imgSrc = item.content_file_1_url || item.author_photo_url;
            return (
              <div
                key={item.reference_id}
                onClick={() => {
                  onSelectRef(item.reference_id);
                  setViewMode('split');
                }}
                className="sx2-panel"
                style={{ padding: '12px', cursor: 'pointer' }}
              >
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={item.title_description}
                    style={{ width: '100%', height: '145px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
                  />
                )}
                <div style={{ fontFamily: 'monospace', fontSize: '10.5px', color: 'var(--sx-accent)' }}>{item.reference_id}</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--sx-muted)' }}>{item.title_description}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}