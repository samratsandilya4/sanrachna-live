import { useEffect, useState } from 'react';
import { getSubmissionFiles, type SubmissionFileItem } from '../lib/submissionFiles';

interface SubmissionFilesPreviewProps {
  referenceId: string;
}

export function SubmissionFilesPreview({ referenceId }: SubmissionFilesPreviewProps) {
  const [photos, setPhotos] = useState<SubmissionFileItem[]>([]);
  const [contentFiles, setContentFiles] = useState<SubmissionFileItem[]>([]);
  const [textPreviews, setTextPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      const cleanId = referenceId.trim();
      if (!cleanId) {
        if (isMounted) {
          setPhotos([]);
          setContentFiles([]);
          setTextPreviews({});
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { photos: fetchedPhotos, contentFiles: fetchedContent } =
        await getSubmissionFiles(cleanId);

      if (!isMounted) return;

      setPhotos(fetchedPhotos);
      setContentFiles(fetchedContent);

      const loadedTexts: Record<string, string> = {};
      for (const file of fetchedContent) {
        if (/\.txt$/i.test(file.name)) {
          try {
            const response = await fetch(file.publicUrl);
            if (response.ok) {
              loadedTexts[file.path] = await response.text();
            }
          } catch {
            // Direct link se open/download phir bhi chalega
          }
        }
      }

      if (isMounted) {
        setTextPreviews(loadedTexts);
        setLoading(false);
      }
    }

    loadFiles();

    return () => {
      isMounted = false;
    };
  }, [referenceId]);

  if (!referenceId.trim()) return null;

  if (loading) {
    return (
      <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.75 }}>
        Files load ho rahi hain...
      </p>
    );
  }

  if (photos.length === 0 && contentFiles.length === 0) {
    return (
      <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.75 }}>
        Is Reference ID ke liye koi file nahi mili.
      </p>
    );
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {photos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#D4AF37',
            }}
          >
            Uploaded Photo
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {photos.map((photo) => (
              <div
                key={photo.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  maxWidth: '100%',
                }}
              >
                <img
                  src={photo.publicUrl}
                  alt={photo.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    maxWidth: '40px',
                    minHeight: '40px',
                    maxHeight: '40px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    display: 'block',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {photo.name}
                  </div>
                  <a
                    href={photo.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#E5C158', textDecoration: 'underline' }}
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {contentFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#D4AF37',
            }}
          >
            Uploaded Content
          </div>
          {contentFiles.map((file) => (
            <div
              key={file.path}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </span>
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: '#E5C158', textDecoration: 'underline', flexShrink: 0 }}
                >
                  Open
                </a>
              </div>
              {textPreviews[file.path] && (
                <pre
                  style={{
                    marginTop: '6px',
                    marginBottom: 0,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    fontSize: '11px',
                    maxHeight: '64px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {textPreviews[file.path]}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}