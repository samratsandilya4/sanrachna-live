import type { PrePressChecklist, SubmissionMetaLocal, SubmissionRow } from './types';

export const STATUS_OPTIONS: readonly string[] = [
  'Received',
  'Read',
  'Under Review',
  'Edited',
  'Reviewed',
  'Revision Needed',
  'Published',
];

export const SUBMISSION_TYPES: readonly string[] = [
  'Articles (700-900 words)',
  'Journalism (250-500 words)',
  'Mass Communication (400-600 words)',
  'Biography (250-500 words)',
  'Poem (10-15 lines)',
  'Essay/Short Story (300-600 words)',
  'Campus News (500-600 words)',
  'Career and Entrepreneurship (150-250 words)',
  'Drawing/Painting/Artworks (1-2 nos.)',
  'Photography (1-2 nos.)',
  'Remembrance/Observance (500-700 words)',
];

export const DEFAULT_CHECKLIST: PrePressChecklist = {
  plagiarismChecked: false,
  grammarProofed: false,
  highResMediaOk: false,
  layoutReady: false,
};

export const DEFAULT_META: SubmissionMetaLocal = {
  scores: { originality: 4, themeZero: 4, craft: 4 },
  checklist: { ...DEFAULT_CHECKLIST },
  tocOrder: null,
  activity: [],
};

export const COMMS_TEMPLATES: { label: string; build: (row: SubmissionRow) => string }[] = [
  {
    label: '✦ Selected for Edition I',
    build: (r) =>
      `Namaste ${r.full_name}, heartiest congratulations from संRACHNA Editorial Board (GEC Godda)! Your submission "${r.title_description}" (${r.reference_id}) has been approved for Edition I (The Zero / शून्य).`,
  },
  {
    label: '✎ Minor Revision Needed',
    build: (r) =>
      `Namaste ${r.full_name}, greetings from संRACHNA Editorial Board (GEC Godda). Please review the editorial note for ${r.reference_id} ("${r.title_description}") and share your updated draft when convenient.`,
  },
  {
    label: '🖼 Higher-Res Media Request',
    build: (r) =>
      `Namaste ${r.full_name}, from संRACHNA Editorial Board (GEC Godda): for print quality in Edition I, please share a high-resolution version of your artwork/photo/portrait for reference ${r.reference_id}.`,
  },
];

export const getStatusStyle = (status: string) => {
  const s = (status || 'Received').trim().toLowerCase();
  if (s === 'published')
    return { color: '#15803D', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.35)' };
  if (s === 'reviewed')
    return { color: '#B45309', bg: 'rgba(217,119,6,0.13)', border: 'rgba(217,119,6,0.38)' };
  if (s === 'edited')
    return { color: '#7E22CE', bg: 'rgba(147,51,234,0.12)', border: 'rgba(147,51,234,0.35)' };
  if (s === 'under review')
    return { color: '#0369A1', bg: 'rgba(2,132,199,0.12)', border: 'rgba(2,132,199,0.35)' };
  if (s === 'read')
    return { color: '#0F766E', bg: 'rgba(13,148,136,0.12)', border: 'rgba(13,148,136,0.35)' };
  if (s.includes('revision'))
    return { color: '#C2410C', bg: 'rgba(234,88,12,0.13)', border: 'rgba(234,88,12,0.38)' };
  return { color: '#7A1628', bg: 'rgba(122,22,40,0.1)', border: 'rgba(122,22,40,0.3)' };
};

export const buildWhatsAppHref = (phoneRaw: string, message: string) => {
  const digits = (phoneRaw || '').replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
};

export const getDuplicateMap = (rows: SubmissionRow[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const key = `${(r.email || '').trim().toLowerCase()}::${(r.title_description || '')
      .trim()
      .toLowerCase()}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const flagged: Record<string, number> = {};
  for (const r of rows) {
    const key = `${(r.email || '').trim().toLowerCase()}::${(r.title_description || '')
      .trim()
      .toLowerCase()}`;
    if (counts[key] > 1) {
      flagged[r.reference_id] = counts[key];
    }
  }
  return flagged;
};

export const estimateAbstractMetrics = (text: string) => {
  const clean = (text || '').trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const mins = Math.max(1, Math.ceil(words / 200));
  return { words, chars: clean.length, mins };
};

export const exportSubmissionsCsv = (rows: SubmissionRow[]) => {
  const headers = [
    'Reference ID',
    'Full Name',
    'Contributed By',
    'Semester / Designation',
    'Roll / ID',
    'Institution',
    'Email',
    'Phone',
    'Category',
    'Submission Type',
    'Title / Description',
    'Status',
    'Editorial Note',
    'Created At',
  ];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(esc).join(','),
    ...rows.map((r) =>
      [
        r.reference_id,
        r.full_name,
        r.contributed_by,
        r.semester_class || r.designation || '',
        r.id_number,
        r.institution_name,
        r.email,
        r.phone,
        r.submission_category,
        r.submission_type,
        r.title_description,
        r.status,
        r.editorial_note || '',
        r.created_at,
      ]
        .map(esc)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sanrachna-2026-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};