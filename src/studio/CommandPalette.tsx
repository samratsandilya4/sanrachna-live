import { useState, useEffect, useMemo } from 'react';
import type { PrintMode, StudioTab, SubmissionRow } from './types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  submissions: SubmissionRow[];
  onSelectSubmission: (refId: string) => void;
  onSwitchTab: (tab: StudioTab) => void;
  onToggleTheme: () => void;
  onOpenPrint: (mode: PrintMode) => void;
  selectedRef: string | null;
}

export default function CommandPalette({
  open,
  onClose,
  submissions,
  onSelectSubmission,
  onSwitchTab,
  onToggleTheme,
  onOpenPrint,
  selectedRef,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const actions = useMemo(() => {
    const base: { id: string; label: string; tag: string; run: () => void }[] = [
      { id: 'tab-sub', label: 'Go to Manuscripts', tag: 'Navigation', run: () => onSwitchTab('submissions') },
      { id: 'tab-toc', label: 'Go to Issue Planner (TOC)', tag: 'Navigation', run: () => onSwitchTab('toc') },
      { id: 'tab-ann', label: 'Go to Marquee & Notice Board', tag: 'Navigation', run: () => onSwitchTab('announcements') },
      { id: 'tab-ana', label: 'Go to Issue Insights & Analytics', tag: 'Navigation', run: () => onSwitchTab('analytics') },
      { id: 'tab-ctl', label: 'Go to Portal Controls', tag: 'Navigation', run: () => onSwitchTab('controls') },
      { id: 'theme', label: 'Switch Parchment / Espresso Theme', tag: 'Appearance', run: onToggleTheme },
      { id: 'dir', label: 'Print Full Submission Directory', tag: 'Export', run: () => onOpenPrint('shortlist') },
    ];

    if (selectedRef) {
      base.unshift(
        { id: 'cert', label: `Generate E-Certificate (${selectedRef})`, tag: 'Print', run: () => onOpenPrint('certificate') },
        { id: 'card', label: `Print Author Card (${selectedRef})`, tag: 'Print', run: () => onOpenPrint('author_card') }
      );
    }

    const q = query.trim().toLowerCase();
    const matchedEntries = submissions
      .filter(
        (s) =>
          !q ||
          s.full_name.toLowerCase().includes(q) ||
          s.reference_id.toLowerCase().includes(q) ||
          (s.title_description || '').toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((s) => ({
        id: `sub-${s.reference_id}`,
        label: `${s.full_name} — ${s.title_description}`,
        tag: s.reference_id,
        run: () => {
          onSwitchTab('submissions');
          onSelectSubmission(s.reference_id);
        },
      }));

    const filteredActions = q
      ? base.filter((a) => a.label.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q))
      : base;

    return [...matchedEntries, ...filteredActions];
  }, [query, submissions, selectedRef, onSwitchTab, onSelectSubmission, onToggleTheme, onOpenPrint]);

  if (!open) return null;

  return (
    <div className="sx2-cmd-backdrop" onClick={onClose}>
      <div className="sx2-cmd-box sx2-fade" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type="text"
          className="sx2-cmd-input"
          placeholder="Type a command, author name, or SAN-2026 ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="sx2-cmd-list">
          {actions.length === 0 ? (
            <div className="sx2-muted" style={{ padding: '16px', textAlign: 'center' }}>
              No matching commands or entries.
            </div>
          ) : (
            actions.map((act) => (
              <button
                key={act.id}
                type="button"
                className="sx2-cmd-item"
                onClick={() => {
                  act.run();
                  onClose();
                }}
              >
                <span>{act.label}</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--sx-accent)' }}>
                  {act.tag}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}