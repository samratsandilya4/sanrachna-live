import { useState, useMemo, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import type { PrintMode, SubmissionRow } from './types';

interface PrintViewsProps {
  mode: Exclude<PrintMode, 'none'>;
  entry: SubmissionRow | null;
  allRows: SubmissionRow[];
  onClose: () => void;
}


const DIR_LOGO_STYLE: CSSProperties = {
  width: '46px',
  height: '46px',
  maxWidth: '46px',
  maxHeight: '46px',
  objectFit: 'contain',
  display: 'block',
};

function formatDisplayName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

function CornerFlourish({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="46"
      height="46"
      viewBox="0 0 46 46"
      fill="none"
      aria-hidden="true"
      style={{
        width: '46px',
        height: '46px',
        maxWidth: '46px',
        maxHeight: '46px',
        pointerEvents: 'none',
      }}
    >
      <path d="M2 44V12C2 6.5 6.5 2 12 2H44" stroke="#B88622" strokeWidth="1.8" />
      <path d="M8 38V15C8 11.1 11.1 8 15 8H38" stroke="#6E1423" strokeWidth="1" strokeOpacity="0.65" />
      <path d="M12 12L17 14.5L14.5 17L12 12Z" fill="#B88622" />
      <circle cx="14.5" cy="14.5" r="2.2" fill="#6E1423" />
      <path d="M2 24H10M24 2V10" stroke="#B88622" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
}

function VintageDiaryStamp() {
  return (
    <div className="lux-stamp-wrap" aria-label="संRACHNA Official Vintage Stamp">
      <svg
        width="126"
        height="126"
        viewBox="0 0 140 140"
        fill="none"
        style={{
          width: '126px',
          height: '126px',
          maxWidth: '126px',
          maxHeight: '126px',
          display: 'block',
        }}
      >
        <defs>
          <path id="luxStampTopArc" d="M 22,70 A 48,48 0 1,1 118,70" />
          <path id="luxStampBotArc" d="M 18,70 A 52,52 0 1,0 122,70" />
        </defs>

        <circle cx="70" cy="70" r="65" stroke="#731424" strokeWidth="2.4" strokeDasharray="18 2 9 1.5 24 2" />
        <circle cx="70" cy="70" r="59.5" stroke="#731424" strokeWidth="1" strokeDasharray="3.5 2.5" />
        <circle cx="70" cy="70" r="39" stroke="#731424" strokeWidth="1.1" strokeOpacity="0.85" />

        <text
          fill="#731424"
          fontSize="8.2"
          fontWeight="800"
          letterSpacing="2.2"
          fontFamily="'Cinzel', Georgia, serif"
        >
          <textPath href="#luxStampTopArc" startOffset="50%" textAnchor="middle">
            ✦ OFFICIAL ARCHIVAL FOLIO ✦
          </textPath>
        </text>

        <text
          fill="#731424"
          fontSize="8.2"
          fontWeight="800"
          letterSpacing="2.4"
          fontFamily="'Cinzel', Georgia, serif"
        >
          <textPath href="#luxStampBotArc" startOffset="50%" textAnchor="middle">
            • GEC GODDA • EDITION I •
          </textPath>
        </text>

        <rect
          x="14"
          y="53"
          width="112"
          height="34"
          rx="2"
          fill="#F6ECD8"
          fillOpacity="0.82"
          stroke="#731424"
          strokeWidth="1.6"
        />
        <line x1="17" y1="56.5" x2="123" y2="56.5" stroke="#731424" strokeWidth="0.7" />
        <line x1="17" y1="83.5" x2="123" y2="83.5" stroke="#731424" strokeWidth="0.7" />

        <text
          x="70"
          y="71"
          textAnchor="middle"
          fill="#6A1020"
          fontSize="15.5"
          fontWeight="800"
          letterSpacing="1.2"
          fontFamily="'Playfair Display', Georgia, serif"
        >
          संRACHNA
        </text>
        <text
          x="70"
          y="80.5"
          textAnchor="middle"
          fill="#8A5C12"
          fontSize="6.4"
          fontWeight="800"
          letterSpacing="2.3"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          THE ZERO • 2026
        </text>
      </svg>
    </div>
  );
}

function DesignerQrCode({ payload }: { payload: string }) {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(payload, { errorCorrectionLevel: 'H' });
      const size = qr.modules.size;
      const dots: Array<{ r: number; c: number }> = [];
      const center = (size - 1) / 2;
      const clearRadius = Math.max(2.5, size * 0.095);

      const isFinder = (r: number, c: number) =>
        (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (isFinder(r, c)) continue;
          const dist = Math.hypot(r - center, c - center);
          if (dist < clearRadius) continue;
          if (qr.modules.get(r, c)) {
            dots.push({ r, c });
          }
        }
      }
      return { size, dots };
    } catch {
      return null;
    }
  }, [payload]);

  if (!qrData) {
    return (
      <div className="lux-qr-shell">
        <div className="lux-qr-wait">QR</div>
      </div>
    );
  }

  const { size, dots } = qrData;
  const pad = 2;
  const viewSize = size + pad * 2;
  const finders = [
    { x: pad, y: pad },
    { x: pad + size - 7, y: pad },
    { x: pad, y: pad + size - 7 },
  ];

  return (
    <div className="lux-qr-shell">
      <div className="lux-qr-texture" aria-hidden="true" />
      <span className="lux-qr-b tl" />
      <span className="lux-qr-b tr" />
      <span className="lux-qr-b bl" />
      <span className="lux-qr-b br" />

      <svg
        width="96"
        height="96"
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        role="img"
        aria-label="Certificate Verification QR Code"
        style={{
          width: '96px',
          height: '96px',
          maxWidth: '96px',
          maxHeight: '96px',
          display: 'block',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <defs>
          <linearGradient id="luxQrInkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A0714" />
            <stop offset="52%" stopColor="#7C1428" />
            <stop offset="100%" stopColor="#8F5A0E" />
          </linearGradient>
          <linearGradient id="luxQrEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9C6A12" />
            <stop offset="100%" stopColor="#5C0C1A" />
          </linearGradient>
        </defs>

        {finders.map((f, idx) => (
          <g key={idx}>
            <rect
              x={f.x + 0.5}
              y={f.y + 0.5}
              width="6"
              height="6"
              rx="1.35"
              fill="none"
              stroke="url(#luxQrInkGrad)"
              strokeWidth="1"
            />
            <rect
              x={f.x + 2}
              y={f.y + 2}
              width="3"
              height="3"
              rx="0.85"
              fill="url(#luxQrEyeGrad)"
            />
          </g>
        ))}

        {dots.map((d) => (
          <rect
            key={`${d.r}-${d.c}`}
            x={pad + d.c + 0.08}
            y={pad + d.r + 0.08}
            width="0.84"
            height="0.84"
            rx="0.28"
            fill="url(#luxQrInkGrad)"
          />
        ))}
      </svg>

      <div className="lux-qr-crest">सं</div>
    </div>
  );
}

export default function PrintViews({ mode, entry, allRows, onClose }: PrintViewsProps) {
  const [certVariant, setCertVariant] = useState<'auto' | 'participation' | 'publication'>('auto');

  if (mode === 'certificate' && entry) {
    const isPub =
      certVariant === 'publication' ||
      (certVariant === 'auto' && (entry.status || '').toLowerCase() === 'published');

    const displayName = formatDisplayName(entry.full_name);

    const qrPayload = [
      'SANRACHNA 2026 — GEC GODDA',
      'Official Verified E-Certificate',
      `Recipient: ${displayName}`,
      `Honour: ${isPub ? 'Certificate of Publication' : 'Certificate of Participation'}`,
      `Work: ${entry.title_description}`,
      `Ref ID: ${entry.reference_id}`,
    ].join('\n');

    return (
      <div className="sx2-print-wrap">
        <div className="sx2-print-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <strong>E-Certificate — {displayName}</strong>
            <select
              value={certVariant}
              onChange={(e) =>
                setCertVariant(e.target.value as 'auto' | 'participation' | 'publication')
              }
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #C9BFA9',
                background: '#fff',
              }}
            >
              <option value="auto">Auto (Based on Status)</option>
              <option value="participation">Certificate of Participation</option>
              <option value="publication">Certificate of Publication</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => window.print()} className="sx2-btn-maroon">
              ⎙ Download / Save PDF
            </button>
            <button type="button" onClick={onClose} className="sx2-btn-ghost">
              ← Back to Studio
            </button>
          </div>
        </div>

        <div className="lux-stage">
          <div className="lux-sheet">
            <div className="lux-grain" aria-hidden="true" />
            <div className="lux-aura" aria-hidden="true" />

            <aside className="lux-spine">
              <div className="lux-spine-inner-rule" />
              <div className="lux-spine-top">
                <span>ED.</span>
                <strong>01</strong>
              </div>
              <div className="lux-spine-vline" />
              <div className="lux-spine-label">
                संRACHNA • COLLECTORS’ EDITION I • 2026 • THE ZERO (शून्य)
              </div>
              <div className="lux-spine-vline" />
              <div className="lux-spine-star">✦</div>
            </aside>

            <main className="lux-canvas">
              <div className="lux-border-outer" aria-hidden="true" />
              <div className="lux-border-inner" aria-hidden="true" />

              <CornerFlourish className="lux-corner tl" />
              <CornerFlourish className="lux-corner tr" />
              <CornerFlourish className="lux-corner bl" />
              <CornerFlourish className="lux-corner br" />

              <div className="lux-bg-motif" aria-hidden="true">
                <div className="lux-ring r1" />
                <div className="lux-ring r2" />
                <div className="lux-ring r3" />
                <span>शून्य</span>
              </div>

              <header className="lux-header">
                <div className="lux-logo-medallion">
                  <img
  src="/gec-logo.png"
  alt="GEC Godda"
  style={{ width: '76px', height: '76px', objectFit: 'contain', borderRadius: '50%', transform: 'scale(1.12)' }}
/>
                </div>

                <div className="lux-header-mid">
                  <div className="lux-dept">
                    DEPARTMENT OF HIGHER, TECHNICAL EDUCATION &amp; SKILL DEVELOPMENT
                  </div>
                  <div className="lux-college">GOVERNMENT ENGINEERING COLLEGE, GODDA</div>
                  <div className="lux-mag-ribbon">
                    <span className="lux-ribbon-line" />
                    <span className="lux-ribbon-text">
                      संRACHNA • OFFICIAL ANNUAL MAGAZINE • सृजन से निर्माण तक
                    </span>
                    <span className="lux-ribbon-line" />
                  </div>
                </div>

                <div className="lux-logo-medallion">
                  <img
  src="/sanrachna-official-logo.png"
  alt="संRACHNA"
  style={{
    width: '78px',
    height: '78px',
    objectFit: 'contain',
    borderRadius: '50%',
    transform: 'scale(1.18)',
  }}
/>
                </div>
              </header>

              <section className="lux-hero">
                <h1 className="lux-title">Certificate</h1>
                <div className="lux-subtitle-row">
                  <span className="lux-sub-bar" />
                  <span className="lux-subtitle">
                    {isPub ? 'OF PUBLICATION' : 'OF PARTICIPATION'}
                  </span>
                  <span className="lux-sub-bar" />
                </div>
              </section>

              <section className="lux-recipient">
                <div className="lux-presented">This editorial distinction is proudly conferred upon</div>
                <div className="lux-name">{displayName}</div>
                <div className="lux-name-flourish">
                  <span className="lux-nf-line" />
                  <span className="lux-nf-diamond">❖</span>
                  <span className="lux-nf-line" />
                </div>
              </section>

              <section className="lux-citation">
                <p className="lux-citation-text">
                  {isPub ? (
                    <>
                      In recognition of an evocative original work titled{' '}
                      <strong className="lux-work-quote">“{entry.title_description}”</strong>,
                      selected and immortalised in the inaugural collectors’ edition of{' '}
                      <strong>संRACHNA (2026)</strong> — celebrating the timeless confluence of
                      imagination, intellect, and creative voice under the theme{' '}
                      <em>The Zero (शून्य)</em>.
                    </>
                  ) : (
                    <>
                      In appreciation of an inspiring original work titled{' '}
                      <strong className="lux-work-quote">“{entry.title_description}”</strong>,
                      honoured in the archival curation of the inaugural edition of{' '}
                      <strong>संRACHNA (2026)</strong> — celebrating literary craft, artistic
                      vision, and campus expression under the theme <em>The Zero (शून्य)</em>.
                    </>
                  )}
                </p>
                <div className="lux-cat-line">
                  {entry.submission_category} &nbsp;✦&nbsp; {entry.submission_type}
                </div>
              </section>

              <footer className="lux-footer">
                <div className="lux-meta-group">
                  <div className="lux-meta-bar" />
                  <div className="lux-meta-items">
                    <div className="lux-meta-entry">
                      <span>ARCHIVE REFERENCE</span>
                      <strong>{entry.reference_id}</strong>
                    </div>
                    <div className="lux-meta-entry">
                      <span>DATE OF ISSUE</span>
                      <strong>
                        {new Date().toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  </div>
                </div>

                <VintageDiaryStamp />

                <div className="lux-qr-align">
                  <DesignerQrCode payload={qrPayload} />
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'author_card' && entry) {
    return (
      <div className="sx2-print-wrap">
        <div className="sx2-print-bar no-print">
          <strong>Magazine Author Dossier — {entry.reference_id}</strong>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => window.print()} className="sx2-btn-maroon">
              ⎙ Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="sx2-btn-ghost">
              ← Back to Studio
            </button>
          </div>
        </div>

        <div className="ac-sheet">
          <div className="ac-top-band">
            <span>GEC GODDA • संRACHNA EDITION I (2026) • AUTHOR DOSSIER</span>
            <span>{entry.reference_id}</span>
          </div>

          <div className="ac-hero">
            <div>
              {entry.author_photo_url ? (
                <img
                  src={entry.author_photo_url}
                  alt={entry.full_name}
                  className="ac-portrait"
                />
              ) : (
                <div className="ac-portrait-fallback">{entry.full_name[0]}</div>
              )}
            </div>
            <div>
              <div className="ac-badge">{entry.status || 'Received'}</div>
              <h1 className="ac-name">{entry.full_name}</h1>
              <div className="ac-sub">
                {entry.contributed_by}
                {entry.semester_class ? ` • ${entry.semester_class}` : ''}
                {entry.designation ? ` • ${entry.designation}` : ''}
              </div>
              <div className="ac-inst">{entry.institution_name}</div>
            </div>
          </div>

          <div className="ac-work-box">
            <div className="ac-kicker">
              {entry.submission_category} • {entry.submission_type}
            </div>
            <h2 className="ac-work-title">{entry.title_description}</h2>
          </div>

          <div className="ac-grid">
            <div>
              <span>EMAIL</span>
              <strong>{entry.email}</strong>
            </div>
            <div>
              <span>PHONE</span>
              <strong>+91 {entry.phone}</strong>
            </div>
            <div>
              <span>PARENT NAME</span>
              <strong>{entry.parent_name}</strong>
            </div>
            <div>
              <span>ID / ROLL NO.</span>
              <strong>{entry.id_number}</strong>
            </div>
            <div>
              <span>SUBMITTED ON</span>
              <strong>{new Date(entry.created_at).toLocaleDateString('en-IN')}</strong>
            </div>
            <div>
              <span>EDITORIAL NOTE</span>
              <strong>{entry.editorial_note || '—'}</strong>
            </div>
          </div>

          <div className="ac-footer">
            <span>Government Engineering College, Godda • Theme: The Zero (शून्य)</span>
            <span>Official Editorial Layout Copy</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sx2-print-wrap">
      <div className="sx2-print-bar no-print">
        <strong>Editorial Directory ({allRows.length} Entries)</strong>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => window.print()} className="sx2-btn-maroon">
            ⎙ Print / Save PDF
          </button>
          <button type="button" onClick={onClose} className="sx2-btn-ghost">
            ← Back to Studio
          </button>
        </div>
      </div>

      <div className="ac-sheet" style={{ maxWidth: '980px', padding: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #7A1628',
            paddingBottom: '14px',
            marginBottom: '18px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: '#7A1628',
              }}
            >
              GOVERNMENT ENGINEERING COLLEGE, GODDA
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', margin: '2px 0 0' }}>
              संRACHNA 2026 — Editorial Submission Directory
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <img src="/gec-logo.png" alt="GEC" style={DIR_LOGO_STYLE} />
            <img src="/sanrachna-official-logo.png" alt="संRACHNA" style={DIR_LOGO_STYLE} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: '#F4EFE4', textAlign: 'left', borderBottom: '1.5px solid #D6CCB8' }}>
              <th style={{ padding: '10px' }}>Ref ID</th>
              <th style={{ padding: '10px' }}>Contributor</th>
              <th style={{ padding: '10px' }}>Format</th>
              <th style={{ padding: '10px' }}>Title / Description</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((s) => (
              <tr key={s.reference_id} style={{ borderBottom: '1px solid #EAE3D5' }}>
                <td
                  style={{
                    padding: '9px 10px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#7A1628',
                  }}
                >
                  {s.reference_id}
                </td>
                <td style={{ padding: '9px 10px' }}>
                  <strong>{s.full_name}</strong>
                  <div style={{ fontSize: '11px', color: '#52525B' }}>
                    {s.contributed_by} • {s.semester_class || s.designation || ''}
                  </div>
                </td>
                <td style={{ padding: '9px 10px' }}>{s.submission_type}</td>
                <td style={{ padding: '9px 10px' }}>{s.title_description}</td>
                <td style={{ padding: '9px 10px', fontWeight: 700 }}>{s.status || 'Received'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}