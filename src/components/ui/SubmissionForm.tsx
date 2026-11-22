import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { SubmissionFilesPreview } from '../SubmissionFilesPreview';

const GUIDELINES_LINK = '/Guidelines.pdf';
const TEMPLATE_LINK = '/template%20for%20submission.pdf';
const DRAFT_STORAGE_KEY = 'sanrachna_submission_draft_v2';
const RECENT_REFS_KEY = 'sanrachna_recent_refs_v1';
const PORTAL_CLOSED_STORAGE_KEY = 'sanrachna_submissions_closed_v1';

interface SubmissionFormProps {
  onBack?: () => void;
}

interface FormData {
  submissionCategory: string;
  contributedBy: string;
  fullName: string;
  email: string;
  parentName: string;
  semesterClass: string;
  idNumber: string;
  designation: string;
  institutionName: string;
  phone: string;
  authorPhoto: File | null;
  titleDescription: string;
  submissionType: string;
  contentFile1: File | null;
  contentFile2: File | null;
  declarations: boolean[];
}

interface TrackedEntry {
  reference_id: string;
  full_name: string;
  submission_type: string;
  status: string;
  editorial_note?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface RecentRef {
  reference_id: string;
  submission_type: string;
  created_at: string;
}

const INITIAL_FORM_DATA: FormData = {
  submissionCategory: '',
  contributedBy: '',
  fullName: '',
  email: '',
  parentName: '',
  semesterClass: '',
  idNumber: '',
  designation: '',
  institutionName: '',
  phone: '',
  authorPhoto: null,
  titleDescription: '',
  submissionType: '',
  contentFile1: null,
  contentFile2: null,
  declarations: [false, false, false],
};

const SUBMISSION_CATEGORIES = [
  'Technical/Scientific content',
  'Non-Technical/Non-Scientific content',
];

const CONTRIBUTED_BY_OPTIONS = [
  'College Student',
  'Faculty Member',
  'Faculty Ward',
  'Staff Member',
  'Staff Ward',
];

const SUBMISSION_TYPES = [
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

const DECLARATIONS = [
  'I declare that the submitted content is my original work and free from plagiarism.',
  'I have verified that all personal and academic/institutional details provided above are accurate.',
  'I grant the Editorial Board of संRACHNA permission to review, edit, and publish my submission.',
];

const STATUS_STAGES = [
  { key: 'Received', label: 'Received', desc: 'Entry logged at Editorial Desk' },
  { key: 'Read', label: 'Read', desc: 'Opened & read by the review team' },
  { key: 'Under Review', label: 'Under Review', desc: 'Evaluating quality & theme fit' },
  { key: 'Edited', label: 'Edited', desc: 'Copy-editing & formatting done' },
  { key: 'Reviewed', label: 'Reviewed', desc: 'Final editorial review complete' },
  { key: 'Published', label: 'Published', desc: 'Confirmed for संRACHNA 2026' },
];

const resolveStatusMeta = (rawStatus: string) => {
  const s = (rawStatus || 'Received').trim().toLowerCase();
  if (s.includes('revision')) {
    return { index: 2, isRevision: true };
  }
  if (s === 'published') return { index: 5, isRevision: false };
  if (s === 'reviewed' || s === 'approved' || s === 'shortlisted') {
    return { index: 4, isRevision: false };
  }
  if (s === 'edited') return { index: 3, isRevision: false };
  if (s === 'under review' || s === 'reviewing') return { index: 2, isRevision: false };
  if (s === 'read' || s === 'readed') return { index: 1, isRevision: false };
  return { index: 0, isRevision: false };
};

const copyTextReliable = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

// ===========================================================================
// LIVE AMBIENT GOLDEN EMBERS CANVAS
// ===========================================================================
const PortalEmbers = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let rafId = 0;
    let width = 0;
    let height = 0;

    interface Ember {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      alpha: number;
      phase: number;
      gold: boolean;
    }

    let embers: Ember[] = [];

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 768 ? 28 : 55;
      embers = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2.2,
        vy: 0.18 + Math.random() * 0.42,
        vx: (Math.random() - 0.5) * 0.25,
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() > 0.28,
      }));
    };

    const tick = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      for (const p of embers) {
        p.phase += 0.018;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.phase) * 0.22;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(p.phase * 1.4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(229, 193, 88, ${twinkle})`
          : `rgba(250, 244, 235, ${twinkle * 0.7})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    init();
    window.addEventListener('resize', init);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="sn-embers-canvas no-print"
    />
  );
};

export default function SubmissionForm({ onBack }: SubmissionFormProps) {
  // Submissions Closed State (synced via localStorage + optional portal_settings)
  const [submissionsClosed, setSubmissionsClosed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PORTAL_CLOSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Full-Screen Preflight Welcome Stage
  const [showGatePopup, setShowGatePopup] = useState(true);
  const [readGuidelines, setReadGuidelines] = useState(false);
  const [followedTemplate, setFollowedTemplate] = useState(false);

  // Track Status & Forgot ID Modal
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackTab, setTrackTab] = useState<'id' | 'recover'>('id');
  const [trackQuery, setTrackQuery] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedResult, setTrackedResult] = useState<TrackedEntry | null>(null);
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);

  // Forgot ID Recovery State
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverPhone, setRecoverPhone] = useState('');
  const [recoveredList, setRecoveredList] = useState<TrackedEntry[]>([]);

  // Recent IDs saved locally on this device
  const [recentRefs, setRecentRefs] = useState<RecentRef[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_REFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Form & Upload State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [fileError, setFileError] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [dragActiveField, setDragActiveField] = useState<'contentFile1' | 'contentFile2' | null>(
    null
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  // Check if Editorial Studio toggled Submissions Closed
  useEffect(() => {
    let active = true;

    const syncClosedFromStorage = () => {
      try {
        setSubmissionsClosed(localStorage.getItem(PORTAL_CLOSED_STORAGE_KEY) === 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', syncClosedFromStorage);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('portal_settings')
          .select('submissions_closed')
          .eq('id', 'sanrachna_2026')
          .single();

        if (!active || error || !data) return;
        const closed = Boolean(data.submissions_closed);
        setSubmissionsClosed(closed);
        localStorage.setItem(PORTAL_CLOSED_STORAGE_KEY, String(closed));
      } catch {
        // ignore if table not created
      }
    })();

    return () => {
      active = false;
      window.removeEventListener('storage', syncClosedFromStorage);
    };
  }, []);

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_FORM_DATA,
          ...parsed,
          phone:
            typeof parsed.phone === 'string' ? parsed.phone.replace(/\D/g, '').slice(0, 10) : '',
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_FORM_DATA;
  });

  // Lock background website scroll cleanly while portal shell is mounted
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Phone Back button support (closes portal cleanly instead of exiting site)
  useEffect(() => {
    window.history.pushState({ sanrachnaPortal: true }, '');
    const handlePopState = () => {
      if (onBackRef.current) onBackRef.current();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Desktop ESC key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showTrackModal) {
        setShowTrackModal(false);
      } else if (onBackRef.current) {
        if (window.history.state?.sanrachnaPortal) {
          window.history.back();
        } else {
          onBackRef.current();
        }
      } else {
        window.location.href = '/';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTrackModal]);

  // Reset internal scroll to exact top whenever view or step changes
  useEffect(() => {
    if (showGatePopup) {
      welcomeRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      workspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showGatePopup, step, submittedRef]);

  // Auto-save text draft
  useEffect(() => {
    if (submittedRef) return;
    const hasInput =
      formData.fullName ||
      formData.email ||
      formData.submissionCategory ||
      formData.titleDescription;
    if (!hasInput) return;

    const timer = setTimeout(() => {
      try {
        const { authorPhoto, contentFile1, contentFile2, ...serializable } = formData;
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializable));
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // ignore
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, submittedRef]);

  // Circular photo preview
  useEffect(() => {
    if (!formData.authorPhoto) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.authorPhoto);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.authorPhoto]);

  const isFacultyOrStaff =
    formData.contributedBy === 'Faculty Member' || formData.contributedBy === 'Staff Member';
  const isStudent = formData.contributedBy === 'College Student';
  const isWard =
    formData.contributedBy === 'Faculty Ward' || formData.contributedBy === 'Staff Ward';

  const saveRecentRef = (refId: string, submissionType: string) => {
    setRecentRefs((prev) => {
      const next: RecentRef[] = [
        { reference_id: refId, submission_type: submissionType, created_at: new Date().toISOString() },
        ...prev.filter((item) => item.reference_id !== refId),
      ].slice(0, 5);
      try {
        localStorage.setItem(RECENT_REFS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleBackToHome = () => {
    if (onBack) {
      if (window.history.state?.sanrachnaPortal) {
        window.history.back();
      } else {
        onBack();
      }
    } else {
      window.location.href = '/';
    }
  };

  const validateAndSetFile = (
    file: File | undefined,
    field: 'authorPhoto' | 'contentFile1' | 'contentFile2',
    maxMB = 10
  ) => {
    setFileError('');
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts =
      field === 'authorPhoto'
        ? ['jpg', 'jpeg', 'png', 'webp']
        : ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

    if (!allowedExts.includes(ext)) {
      setFileError(
        field === 'authorPhoto'
          ? 'Only JPG, PNG, or WEBP images are allowed for your photo.'
          : 'Only PDF, DOC, DOCX, JPG, or PNG files are allowed.'
      );
      return;
    }

    if (file.size > maxMB * 1024 * 1024) {
      setFileError(`File size must be under ${maxMB}MB. Please compress and try again.`);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'authorPhoto' | 'contentFile1' | 'contentFile2',
    maxMB = 10
  ) => {
    validateAndSetFile(e.target.files?.[0], field, maxMB);
  };

  const handleDrag = (
    e: React.DragEvent<HTMLLabelElement>,
    field: 'contentFile1' | 'contentFile2',
    active: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(active ? field : null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLLabelElement>,
    field: 'contentFile1' | 'contentFile2'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
    validateAndSetFile(e.dataTransfer.files?.[0], field, 10);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.submissionCategory || !formData.contributedBy || !formData.authorPhoto) {
        setFileError('Please select Category, Contributed By, and upload your photo.');
        return;
      }
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setFileError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    if (step === 2 && (!formData.submissionType || !formData.contentFile1)) {
      setFileError('Please choose your submission type and upload Submit Content 01.');
      return;
    }
    setFileError('');
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const uploadToSupabase = async (file: File, folder: string, refId: string) => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${refId}/${folder}_${Date.now()}_${cleanName}`;
    const { error } = await supabase.storage.from('sanrachna-uploads').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('sanrachna-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  const sendConfirmationEmail = async (refId: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_v3d0b3g';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ol2n8xc';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const recipientEmail = formData.email.trim();

    if (!publicKey || !recipientEmail) {
      console.warn('EmailJS skipped: missing VITE_EMAILJS_PUBLIC_KEY or contributor email.');
      return;
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: recipientEmail,
            to_name: formData.fullName.trim(),
            reference_id: refId,
            submission_category: formData.submissionCategory,
            submission_type: formData.submissionType,
            title_description: formData.titleDescription.trim(),
            submitted_date: new Date().toLocaleDateString('en-IN'),
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('EmailJS request failed:', response.status, errText);
      }
    } catch (err) {
      console.error('EmailJS network error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError('');

    if (submissionsClosed) {
      setFileError('Submissions for संRACHNA Edition I (2026) are currently closed.');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setFileError('Please enter a valid 10-digit mobile number.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);
    setUploadStage('Preparing submission...');

    const refId = `SAN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      let photoUrl = '';
      let content1Url = '';
      let content2Url: string | null = null;

      if (formData.authorPhoto) {
        setUploadStage('Uploading author photo...');
        setUploadProgress(35);
        photoUrl = await uploadToSupabase(formData.authorPhoto, 'photo', refId);
      }

      if (formData.contentFile1) {
        setUploadStage('Uploading primary manuscript...');
        setUploadProgress(65);
        content1Url = await uploadToSupabase(formData.contentFile1, 'content1', refId);
      }

      if (formData.contentFile2) {
        setUploadStage('Uploading second file...');
        setUploadProgress(82);
        content2Url = await uploadToSupabase(formData.contentFile2, 'content2', refId);
      }

      setUploadStage('Saving entry to Editorial Board...');
      setUploadProgress(92);

      const { error: dbError } = await supabase.from('submissions').insert([
        {
          reference_id: refId,
          submission_category: formData.submissionCategory,
          contributed_by: formData.contributedBy,
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          parent_name: formData.parentName.trim(),
          semester_class: formData.semesterClass.trim() || null,
          id_number: formData.idNumber.trim(),
          designation: formData.designation.trim() || null,
          institution_name: formData.institutionName.trim(),
          phone: phoneDigits,
          author_photo_url: photoUrl,
          title_description: formData.titleDescription.trim(),
          submission_type: formData.submissionType,
          content_file_1_url: content1Url,
          content_file_2_url: content2Url,
          status: 'Received',
        },
      ]);

      if (dbError) throw dbError;

      setUploadProgress(100);
      setSubmittedRef(refId);
      void sendConfirmationEmail(refId);
      saveRecentRef(refId, formData.submissionType);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftSavedAt(null);
    } catch (err: any) {
      setFileError(
        err?.message || 'Submission failed. Please check your internet or Supabase setup.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadStage('');
    }
  };

  const fetchStatusById = async (rawId: string) => {
    const cleaned = rawId.trim().toUpperCase();
    if (!cleaned) return;

    setTrackQuery(cleaned);
    setTrackLoading(true);
    setTrackError('');
    setTrackedResult(null);

    try {
      const { data, error } = await supabase.rpc('get_submission_status', {
        p_ref_id: cleaned,
      });

      if (error) {
        setTrackError(`Unable to verify status: ${error.message}`);
        return;
      }

      const entry = Array.isArray(data) ? data[0] : data;
      if (!entry) {
        setTrackError('No submission found with this Reference ID.');
      } else {
        setTrackedResult(entry as TrackedEntry);
      }
    } catch {
      setTrackError('Unable to check status right now. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleTrackStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchStatusById(trackQuery);
  };

  const handleRecoverIds = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = recoverPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setTrackError('Please enter your exact 10-digit registered mobile number.');
      return;
    }

    setTrackLoading(true);
    setTrackError('');
    setRecoveredList([]);
    setTrackedResult(null);

    try {
      const { data, error } = await supabase.rpc('find_my_submissions', {
        p_email: recoverEmail.trim(),
        p_phone: digits,
      });

      if (error) {
        setTrackError(`Unable to search right now: ${error.message}`);
        return;
      }

      const list = Array.isArray(data) ? (data as TrackedEntry[]) : [];
      if (list.length === 0) {
        setTrackError('No submissions matched this Email and Phone number.');
      } else {
        setRecoveredList(list);
        if (list.length === 1) {
          setTrackedResult(list[0]);
        }
      }
    } catch {
      setTrackError('Unable to look up submissions right now. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCopyRef = async () => {
    if (!submittedRef) return;
    const ok = await copyTextReliable(submittedRef);
    if (ok) {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setFileError('Auto-copy blocked by browser. Please tap & copy the Reference ID manually.');
    }
  };

  const handleCopyTrackedId = async (refId: string) => {
    const ok = await copyTextReliable(refId);
    if (ok) {
      setCopiedTrackId(refId);
      setTimeout(() => setCopiedTrackId(null), 2000);
    }
  };

  const openTrackModal = () => {
    setTrackError('');
    setShowTrackModal(true);
  };

  const resetForm = () => {
    setSubmittedRef(null);
    setStep(1);
    setUploadProgress(0);
    setFileError('');
    setFormData(INITIAL_FORM_DATA);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftSavedAt(null);
  };

  const stepProgressPercent = submittedRef ? 100 : step === 1 ? 15 : step === 2 ? 55 : 100;
  const activeStatusMeta = trackedResult ? resolveStatusMeta(trackedResult.status) : null;

  return (
    <div className="sn-portal-shell">
      {/* LIVE ANIMATED ATMOSPHERE */}
      <div className="sn-aurora-bg no-print" aria-hidden="true" />
      <PortalEmbers />
      <div className="sn-grain-overlay no-print" aria-hidden="true" />

      {/* ================================================================= */}
      {/* CLOSED PORTAL LUXURY NOTICE (WHEN TOGGLED CLOSED IN STUDIO)       */}
      {/* ================================================================= */}
      {submissionsClosed ? (
        <div className="sn-welcome-stage no-print">
          <header className="sn-welcome-nav">
            <div className="sn-welcome-brand">
              <img
                src="/sanrachna-official-logo.png"
                alt="संRACHNA Official Logo"
                className="sn-nav-logo"
              />
              <div>
                <div className="sn-nav-title">संRACHNA</div>
                <div className="sn-nav-sub">GEC GODDA &middot; EDITION I (2026)</div>
              </div>
            </div>

            <div className="sn-welcome-nav-actions">
              <button
                type="button"
                onClick={openTrackModal}
                className="sn-track-trigger-btn"
              >
                Track Status
              </button>
              <button
                type="button"
                onClick={handleBackToHome}
                className="sn-anim-close-btn"
                aria-label="Close portal and return to website"
                title="Return to Website"
              >
                ✕
              </button>
            </div>
          </header>

          <div className="sn-welcome-body">
            <div className="sn-closed-card sn-stagger-1">
              <div className="sn-panel-rim" />
              <div className="sn-edition-pill sn-closed-pill">SUBMISSIONS CLOSED</div>
              <h1 className="sn-closed-title">
                Submission Window for <span className="sn-gold-shimmer">संRACHNA</span> Has Closed
              </h1>
              <p className="sn-welcome-lead" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
                Thank you for your overwhelming response for Edition I (Theme: The Zero / शून्य). New
                entries are no longer being accepted, while our Editorial Board reviews submitted
                works.
              </p>

              <div className="sn-closed-actions">
                <button
                  type="button"
                  onClick={openTrackModal}
                  className="sn-btn-primary"
                >
                  Track Existing Submission →
                </button>
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="sn-btn-ghost"
                >
                  Return to Website
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : showGatePopup ? (
        /* =============================================================== */
        /* VIEW 1: FULL-SCREEN LIVE EDITORIAL WELCOME STAGE                */
        /* =============================================================== */
        <div ref={welcomeRef} className="sn-welcome-stage no-print">
          <header className="sn-welcome-nav">
            <div className="sn-welcome-brand">
              <img
                src="/sanrachna-official-logo.png"
                alt="संRACHNA Official Logo"
                className="sn-nav-logo"
              />
              <div>
                <div className="sn-nav-title">संRACHNA</div>
                <div className="sn-nav-sub">GEC GODDA &middot; EDITION I (2026)</div>
              </div>
            </div>

            <div className="sn-welcome-nav-actions">
              <button
                type="button"
                onClick={openTrackModal}
                className="sn-track-trigger-btn"
              >
                Track Status
              </button>
              <button
                type="button"
                onClick={handleBackToHome}
                className="sn-anim-close-btn"
                aria-label="Close portal and return to website"
                title="Return to Website"
              >
                ✕
              </button>
            </div>
          </header>

          <div className="sn-welcome-body">
            <div className="sn-welcome-grid">
              {/* LEFT EDITORIAL SHOWCASE */}
              <div className="sn-welcome-hero sn-stagger-1">
                <div className="sn-edition-pill sn-live-pill">
                  <span className="sn-live-dot" />
                  SUBMISSIONS OPEN &middot; 2026
                </div>

                <h1 className="sn-welcome-headline">
                  Craft Your Legacy for{' '}
                  <span className="sn-gold-shimmer">संRACHNA</span>
                </h1>

                <p className="sn-welcome-lead">
                  Before stepping into the submission desk, take a moment to review our official
                  editorial standards and format your manuscript using the prescribed template.
                </p>

                <div className="sn-welcome-highlights">
                  <div className="sn-highlight-chip">
                    <span className="sn-chip-num">01</span>
                    <div>
                      <div className="sn-chip-title">Theme: The Zero (शून्य)</div>
                      <div className="sn-chip-sub">New beginnings &amp; boundless potential</div>
                    </div>
                  </div>
                  <div className="sn-highlight-chip">
                    <span className="sn-chip-num">02</span>
                    <div>
                      <div className="sn-chip-title">Original Works Only</div>
                      <div className="sn-chip-sub">Up to 2 curated entries per contributor</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT INTERACTIVE PREFLIGHT CONSOLE */}
              <div className="sn-preflight-panel sn-stagger-2">
                <div className="sn-panel-rim" />
                <div className="sn-panel-kicker">PRE-SUBMISSION CHECKLIST</div>
                <h2 className="sn-panel-title">Guidelines &amp; Template</h2>

                <div className="sn-doc-stack">
                  <a
                    href={GUIDELINES_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sn-doc-card"
                  >
                    <div className="sn-doc-badge">PDF</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sn-doc-title">Official Magazine Guidelines</div>
                      <div className="sn-doc-sub">Word limits, fonts, ethics &amp; eligibility</div>
                    </div>
                    <span className="sn-doc-arrow">↗</span>
                  </a>

                  <a
                    href={TEMPLATE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sn-doc-card"
                  >
                    <div className="sn-doc-badge">DOC</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sn-doc-title">Official Submission Template</div>
                      <div className="sn-doc-sub">Prepare your manuscript in the exact layout</div>
                    </div>
                    <span className="sn-doc-arrow">↗</span>
                  </a>
                </div>

                <div className="sn-check-stack">
                  <label className={`sn-preflight-check ${readGuidelines ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={readGuidelines}
                      onChange={(e) => setReadGuidelines(e.target.checked)}
                    />
                    <span>I have read and followed the संRACHNA Magazine Guidelines.</span>
                  </label>

                  <label className={`sn-preflight-check ${followedTemplate ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={followedTemplate}
                      onChange={(e) => setFollowedTemplate(e.target.checked)}
                    />
                    <span>I have followed the official template for preparation of the content.</span>
                  </label>
                </div>

                <button
                  type="button"
                  className="sn-btn-primary sn-cta-full"
                  disabled={!readGuidelines || !followedTemplate}
                  onClick={() => setShowGatePopup(false)}
                >
                  <span>Enter Submission Portal</span>
                  <span className="sn-cta-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =============================================================== */
        /* VIEW 2: FULL-HEIGHT SPLIT SUBMISSION DESK (DESKTOP & MOBILE)    */
        /* =============================================================== */
        <div className="sn-desk-layout">
          {/* LEFT SIDEBAR (DESKTOP: FULL 100DVH LOCKED) / TOP PINNED BAR (MOBILE) */}
          <aside className="sn-sidebar no-print">
            <div className="sn-sidebar-glow" />
            <div className="sn-sidebar-inner">
              <div>
                <div className="sn-top-nav-row">
                  <button
                    type="button"
                    onClick={openTrackModal}
                    className="sn-track-trigger-btn"
                  >
                    Track Status
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="sn-anim-close-btn"
                    aria-label="Close Submission Portal and return to website"
                    title="Close & Return to Website"
                  >
                    ✕
                  </button>
                </div>

                <div className="sn-brand-header">
                  <img
                    src="/sanrachna-official-logo.png"
                    alt="संRACHNA Official Logo"
                    className="sn-sidebar-logo"
                  />
                  <div>
                    <div className="sn-edition-pill" style={{ marginBottom: '4px' }}>
                      EDITION I &middot; 2026
                    </div>
                    <h1 className="sn-brand-title">संRACHNA</h1>
                  </div>
                </div>

                <p className="sn-brand-sub">
                  Official Magazine Submission Portal<br />
                  Government Engineering College, Godda
                </p>
              </div>

              {/* DESKTOP VERTICAL STEPPER WITH LIVE PROGRESS RAIL */}
              <nav className="sn-stepper" aria-label="Submission steps">
                <div className="sn-stepper-rail" aria-hidden="true">
                  <div
                    className="sn-stepper-rail-fill"
                    style={{ height: `${stepProgressPercent}%` }}
                  />
                </div>
                {[
                  { num: 1, title: 'Contributor Details', desc: 'Category, identity & photo' },
                  { num: 2, title: 'Content Submission', desc: 'Type, title & file uploads' },
                  { num: 3, title: 'Declaration', desc: 'Review & final submit' },
                ].map((item) => {
                  const isActive = step === item.num && !submittedRef;
                  const isDone = step > item.num || Boolean(submittedRef);
                  return (
                    <div
                      key={item.num}
                      className={`sn-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                    >
                      <div className="sn-step-num">{isDone ? '✓' : `0${item.num}`}</div>
                      <div>
                        <div className="sn-step-title">{item.title}</div>
                        <div className="sn-step-desc">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* MOBILE HORIZONTAL STEPPER */}
              {!submittedRef && (
                <div className="sn-mobile-stepper">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`sn-m-step ${step === num ? 'active' : ''} ${
                        step > num ? 'done' : ''
                      }`}
                    >
                      <span className="sn-m-dot">{step > num ? '✓' : num}</span>
                      <span className="sn-m-label">
                        {num === 1 ? 'Details' : num === 2 ? 'Content' : 'Submit'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="sn-theme-footer">
                <span className="sn-theme-label">THEME</span>
                <p className="sn-theme-name">The Zero (शून्य)</p>
                <p className="sn-theme-copy">
                  Need to re-check rules?{' '}
                  <button
                    type="button"
                    className="sn-inline-link"
                    onClick={() => setShowGatePopup(true)}
                  >
                    View Guidelines &amp; Template
                  </button>
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT INDEPENDENTLY SCROLLABLE WORKSPACE */}
          <main ref={workspaceRef} className="sn-workspace">
            <div className="sn-form-container">
              {!submittedRef && (
                <div className="sn-utility-bar no-print">
                  <button
                    type="button"
                    className="sn-mobile-guide-btn"
                    onClick={() => setShowGatePopup(true)}
                  >
                    Guidelines &amp; Template
                  </button>
                  {draftSavedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="sn-draft-badge">
                        <span className="sn-draft-dot" />
                        Draft saved {draftSavedAt}
                      </span>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="sn-inline-link"
                        style={{ fontSize: '11.5px', opacity: 0.85 }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!submittedRef ? (
                <form
                  onSubmit={step === 3 ? handleSubmit : handleNext}
                  className="sn-step-anim"
                  key={step}
                >
                  {/* STEP 1: CONTRIBUTOR DETAILS */}
                  {step === 1 && (
                    <div>
                      <div className="sn-step-header">
                        <span className="sn-kicker">STEP 01 OF 03</span>
                        <h2 className="sn-heading">Contributor Details</h2>
                        <p className="sn-subtext">
                          Fields marked with <span className="sn-req">*</span> are required.
                        </p>
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Submission Category <span className="sn-req">*</span>
                        </label>
                        <div className="sn-radio-grid-2">
                          {SUBMISSION_CATEGORIES.map((cat) => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => setFormData({ ...formData, submissionCategory: cat })}
                              className={`sn-radio-card ${
                                formData.submissionCategory === cat ? 'selected' : ''
                              }`}
                            >
                              <span className="sn-radio-dot" />
                              <span>{cat}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Contributed by <span className="sn-req">*</span>
                        </label>
                        <div className="sn-radio-wrap">
                          {CONTRIBUTED_BY_OPTIONS.map((role) => (
                            <button
                              type="button"
                              key={role}
                              onClick={() => setFormData({ ...formData, contributedBy: role })}
                              className={`sn-radio-pill ${
                                formData.contributedBy === role ? 'selected' : ''
                              }`}
                            >
                              <span className="sn-radio-dot" />
                              <span>{role}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sn-grid-2">
                        <div className="sn-field-group">
                          <label className="sn-label">
                            Name <span className="sn-req">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="sn-input"
                            placeholder="Enter full name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          />
                        </div>

                        <div className="sn-field-group">
                          <label className="sn-label">
                            Email Address <span className="sn-req">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            className="sn-input"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="sn-grid-2">
                        <div className="sn-field-group">
                          <label className="sn-label">
                            Father&apos;s / Mother&apos;s Name <span className="sn-req">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="sn-input"
                            placeholder="Enter parent's name"
                            value={formData.parentName}
                            onChange={(e) =>
                              setFormData({ ...formData, parentName: e.target.value })
                            }
                          />
                        </div>

                        <div className="sn-field-group">
                          <label className="sn-label">
                            Phone No. <span className="sn-req">*</span>
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            required
                            minLength={10}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit mobile number"
                            className="sn-input"
                            placeholder="Enter 10-digit mobile number"
                            value={formData.phone}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData({ ...formData, phone: digitsOnly });
                            }}
                          />
                        </div>
                      </div>

                      <div className="sn-grid-2">
                        {!isFacultyOrStaff && (
                          <div className="sn-field-group">
                            <label className="sn-label">
                              {isStudent ? 'Semester & Branch' : 'Semester / Class'}{' '}
                              {(isStudent || isWard) && <span className="sn-req">*</span>}
                            </label>
                            <input
                              type="text"
                              required={isStudent || isWard}
                              className="sn-input"
                              placeholder={
                                isStudent ? 'Enter semester & branch' : 'Enter semester or class'
                              }
                              value={formData.semesterClass}
                              onChange={(e) =>
                                setFormData({ ...formData, semesterClass: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <div className="sn-field-group">
                          <label className="sn-label">
                            {isFacultyOrStaff
                              ? 'Employee ID'
                              : isStudent
                              ? 'Registration No. / Roll No.'
                              : 'Registration No. / Employee ID / Roll No.'}{' '}
                            <span className="sn-req">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="sn-input"
                            placeholder={
                              isFacultyOrStaff ? 'Enter employee ID' : 'Enter ID or roll number'
                            }
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                          />
                        </div>

                        {!isStudent && (
                          <div className="sn-field-group">
                            <label className="sn-label">
                              {isWard
                                ? "Parent's Designation / Department"
                                : 'Designation / Administration'}{' '}
                              {isFacultyOrStaff && <span className="sn-req">*</span>}
                            </label>
                            <input
                              type="text"
                              required={isFacultyOrStaff}
                              className="sn-input"
                              placeholder="Enter designation or department"
                              value={formData.designation}
                              onChange={(e) =>
                                setFormData({ ...formData, designation: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <div className="sn-field-group">
                          <label className="sn-label">
                            Name of College / School <span className="sn-req">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="sn-input"
                            placeholder="Enter institution name"
                            value={formData.institutionName}
                            onChange={(e) =>
                              setFormData({ ...formData, institutionName: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Author Photo Upload */}
                      <div className="sn-field-group">
                        <label className="sn-label">
                          Upload Your Photo <span className="sn-req">*</span>
                        </label>
                        {!formData.authorPhoto ? (
                          <label className="sn-compact-upload">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              onChange={(e) => handleFileUpload(e, 'authorPhoto', 5)}
                              style={{ display: 'none' }}
                            />
                            <span>↑ Tap to Upload Photo (JPG / PNG &middot; Max 5MB)</span>
                          </label>
                        ) : (
                          <div className="sn-photo-preview-card sn-fade-in">
                            <div className="sn-photo-left">
                              {photoPreviewUrl && (
                                <img
                                  src={photoPreviewUrl}
                                  alt="Author preview"
                                  className="sn-avatar-thumb"
                                />
                              )}
                              <div>
                                <div className="sn-file-name">{formData.authorPhoto.name}</div>
                                <div className="sn-file-size">Photo ready</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="sn-anim-close-btn sn-close-sm"
                              onClick={() => setFormData({ ...formData, authorPhoto: null })}
                              aria-label="Remove photo"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CONTENT SUBMISSION */}
                  {step === 2 && (
                    <div>
                      <div className="sn-step-header">
                        <span className="sn-kicker">STEP 02 OF 03</span>
                        <h2 className="sn-heading">Content Submission</h2>
                        <p className="sn-subtext">
                          Provide your title, select the exact format, and upload your work.
                        </p>
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Title of Submission / Short Caption / Description{' '}
                          <span className="sn-req">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          className="sn-input sn-textarea"
                          placeholder="Enter title, short caption, or brief description"
                          value={formData.titleDescription}
                          onChange={(e) =>
                            setFormData({ ...formData, titleDescription: e.target.value })
                          }
                        />
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Choose your Submission <span className="sn-req">*</span>
                          <span className="sn-label-hint">
                            (Kindly go through the guidelines for more details)
                          </span>
                        </label>
                        <div className="sn-submission-list">
                          {SUBMISSION_TYPES.map((type) => (
                            <button
                              type="button"
                              key={type}
                              onClick={() => setFormData({ ...formData, submissionType: type })}
                              className={`sn-radio-card ${
                                formData.submissionType === type ? 'selected' : ''
                              }`}
                            >
                              <span className="sn-radio-dot" />
                              <span>{type}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Submit Content 01 <span className="sn-req">*</span>
                        </label>
                        {!formData.contentFile1 ? (
                          <label
                            className={`sn-dropzone ${
                              dragActiveField === 'contentFile1' ? 'drag-active' : ''
                            }`}
                            onDragOver={(e) => handleDrag(e, 'contentFile1', true)}
                            onDragEnter={(e) => handleDrag(e, 'contentFile1', true)}
                            onDragLeave={(e) => handleDrag(e, 'contentFile1', false)}
                            onDrop={(e) => handleDrop(e, 'contentFile1')}
                          >
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'contentFile1', 10)}
                              style={{ display: 'none' }}
                            />
                            <span className="sn-drop-icon">↑</span>
                            <span className="sn-drop-title">
                              {dragActiveField === 'contentFile1'
                                ? 'Drop your file here'
                                : 'Tap to browse or drag & drop primary file'}
                            </span>
                            <span className="sn-drop-sub">
                              DOCX, PDF, JPG, PNG &middot; Max 10MB
                            </span>
                          </label>
                        ) : (
                          <div className="sn-file-pill sn-fade-in">
                            <div>
                              <div className="sn-file-name">{formData.contentFile1.name}</div>
                              <div className="sn-file-size">
                                {(formData.contentFile1.size / (1024 * 1024)).toFixed(2)} MB
                                &middot; Attached
                              </div>
                            </div>
                            <button
                              type="button"
                              className="sn-anim-close-btn sn-close-sm"
                              onClick={() => setFormData({ ...formData, contentFile1: null })}
                              aria-label="Remove primary file"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="sn-field-group">
                        <label className="sn-label">
                          Submit Content 02{' '}
                          <span className="sn-label-hint">
                            (Optional — for additional entry/file)
                          </span>
                        </label>
                        {!formData.contentFile2 ? (
                          <label
                            className={`sn-dropzone optional ${
                              dragActiveField === 'contentFile2' ? 'drag-active' : ''
                            }`}
                            onDragOver={(e) => handleDrag(e, 'contentFile2', true)}
                            onDragEnter={(e) => handleDrag(e, 'contentFile2', true)}
                            onDragLeave={(e) => handleDrag(e, 'contentFile2', false)}
                            onDrop={(e) => handleDrop(e, 'contentFile2')}
                          >
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'contentFile2', 10)}
                              style={{ display: 'none' }}
                            />
                            <span className="sn-drop-title">
                              {dragActiveField === 'contentFile2'
                                ? 'Drop your second file here'
                                : '+ Add second file (Optional)'}
                            </span>
                            <span className="sn-drop-sub">
                              DOCX, PDF, JPG, PNG &middot; Max 10MB
                            </span>
                          </label>
                        ) : (
                          <div className="sn-file-pill sn-fade-in">
                            <div>
                              <div className="sn-file-name">{formData.contentFile2.name}</div>
                              <div className="sn-file-size">
                                {(formData.contentFile2.size / (1024 * 1024)).toFixed(2)} MB
                                &middot; Attached
                              </div>
                            </div>
                            <button
                              type="button"
                              className="sn-anim-close-btn sn-close-sm"
                              onClick={() => setFormData({ ...formData, contentFile2: null })}
                              aria-label="Remove second file"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: REVIEW & DECLARATIONS */}
                  {step === 3 && (
                    <div>
                      <div className="sn-step-header">
                        <span className="sn-kicker">STEP 03 OF 03</span>
                        <h2 className="sn-heading">Declarations &amp; Review</h2>
                        <p className="sn-subtext">
                          Confirm your submission details and accept the declarations below.
                        </p>
                      </div>

                      <div className="sn-summary-strip">
                        <div>
                          <span className="sn-summary-label">CONTRIBUTOR</span>
                          <span className="sn-summary-val">
                            {formData.fullName} ({formData.contributedBy})
                          </span>
                        </div>
                        <div>
                          <span className="sn-summary-label">EMAIL</span>
                          <span className="sn-summary-val">{formData.email}</span>
                        </div>
                        <div>
                          <span className="sn-summary-label">PHONE</span>
                          <span className="sn-summary-val">{formData.phone}</span>
                        </div>
                        <div>
                          <span className="sn-summary-label">SUBMISSION TYPE</span>
                          <span className="sn-summary-val">{formData.submissionType}</span>
                        </div>
                        <div>
                          <span className="sn-summary-label">CONTENT 01</span>
                          <span className="sn-summary-val">{formData.contentFile1?.name}</span>
                        </div>
                        {formData.contentFile2 && (
                          <div>
                            <span className="sn-summary-label">CONTENT 02</span>
                            <span className="sn-summary-val">{formData.contentFile2.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="sn-declarations">
                        {DECLARATIONS.map((text, idx) => (
                          <label key={idx} className="sn-check-row">
                            <input
                              type="checkbox"
                              required
                              checked={formData.declarations[idx]}
                              onChange={(e) => {
                                const updated = [...formData.declarations];
                                updated[idx] = e.target.checked;
                                setFormData({ ...formData, declarations: updated });
                              }}
                            />
                            <span>{text}</span>
                          </label>
                        ))}
                      </div>

                      {/* LIVE UPLOAD PROGRESS BAR */}
                      {isSubmitting && (
                        <div className="sn-progress-wrap sn-fade-in">
                          <div className="sn-progress-header">
                            <span>{uploadStage}</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="sn-progress-track">
                            <div
                              className="sn-progress-fill"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {fileError && <p className="sn-error-text sn-fade-in">{fileError}</p>}

                  {/* ACTION BAR */}
                  <div className="sn-actions">
                    {step > 1 ? (
                      <button
                        type="button"
                        className="sn-btn-ghost"
                        disabled={isSubmitting}
                        onClick={() => {
                          setFileError('');
                          setStep((prev) => (prev - 1) as 1 | 2 | 3);
                        }}
                      >
                        &larr; Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <button type="submit" className="sn-btn-primary" disabled={isSubmitting}>
                      {isSubmitting
                        ? `Uploading ${uploadProgress}%`
                        : step === 3
                        ? 'Submit Entry'
                        : 'Continue →'}
                    </button>
                  </div>
                </form>
              ) : (
                /* PRINTABLE EDITORIAL RECEIPT */
                <div className="sn-success-card sn-fade-in">
                  <div className="sn-success-mark">✓</div>
                  <span className="sn-kicker">SUBMISSION RECEIVED</span>
                  <h2 className="sn-heading" style={{ marginTop: '8px' }}>
                    Thank You for Contributing
                  </h2>
                  <p className="sn-subtext" style={{ maxWidth: '460px', margin: '12px auto 18px' }}>
                    Your entry has been logged with the संRACHNA Editorial Board, GEC Godda. Your
                    Reference ID is also saved on this device, and you can recover it anytime using
                    your Email &amp; Phone.
                  </p>
                  <p
                    className="sn-subtext"
                    style={{
                      maxWidth: '480px',
                      margin: '0 auto 24px',
                      fontSize: '12.5px',
                      color: 'rgba(229, 193, 88, 0.88)',
                    }}
                  >
                    A confirmation email with your Reference ID has been sent to{' '}
                    <strong>{formData.email}</strong>. If you don&apos;t see it in your Inbox,
                    please check your <strong>Spam / Junk</strong> folder once.
                  </p>

                  <div className="sn-ref-box">
                    <span className="sn-summary-label">REFERENCE ID</span>
                    <div className="sn-ref-row">
                      <span className="sn-ref-code">{submittedRef}</span>
                      <button
                        type="button"
                        onClick={handleCopyRef}
                        className="sn-copy-btn no-print"
                      >
                        {copiedRef ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {fileError && <p className="sn-error-text sn-fade-in">{fileError}</p>}

                  <div className="sn-receipt-meta">
                    <div>
                      <span className="sn-summary-label">CONTRIBUTOR</span>
                      <span className="sn-summary-val">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="sn-summary-label">SUBMISSION TYPE</span>
                      <span className="sn-summary-val">{formData.submissionType}</span>
                    </div>
                    <div>
                      <span className="sn-summary-label">DATE</span>
                      <span className="sn-summary-val">
                        {new Date().toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {submittedRef && (
                    <div style={{ maxWidth: '560px', margin: '20px auto 0', textAlign: 'left' }}>
                      <SubmissionFilesPreview referenceId={submittedRef} />
                    </div>
                  )}

                  <div className="sn-receipt-actions no-print">
                    <button type="button" onClick={() => window.print()} className="sn-btn-primary">
                      Print / Save Receipt
                    </button>
                    <button type="button" onClick={resetForm} className="sn-btn-ghost">
                      Submit Another Entry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ================================================================= */}
      {/* TRACK STATUS + FORGOT ID MODAL WITH LIVE MULTI-STAGE TIMELINE     */}
      {/* ================================================================= */}
      {showTrackModal && (
        <div className="sn-track-overlay no-print" onClick={() => setShowTrackModal(false)}>
          <div className="sn-track-sheet sn-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="sn-panel-rim" />
            <div className="sn-track-top">
              <div className="sn-edition-pill">EDITORIAL TRACKER</div>
              <button
                type="button"
                className="sn-anim-close-btn"
                onClick={() => setShowTrackModal(false)}
                aria-label="Close tracker"
                title="Close"
              >
                ✕
              </button>
            </div>

            <h2 className="sn-panel-title" style={{ marginTop: '10px', marginBottom: '12px' }}>
              Track Your Submission
            </h2>

            {/* SWITCH TABS: TRACK BY ID / FORGOT ID */}
            <div className="sn-track-tabs">
              <button
                type="button"
                className={`sn-track-tab ${trackTab === 'id' ? 'active' : ''}`}
                onClick={() => {
                  setTrackTab('id');
                  setTrackError('');
                }}
              >
                Track by ID
              </button>
              <button
                type="button"
                className={`sn-track-tab ${trackTab === 'recover' ? 'active' : ''}`}
                onClick={() => {
                  setTrackTab('recover');
                  setTrackError('');
                }}
              >
                Forgot ID?
              </button>
            </div>

            {/* TAB 1: TRACK BY REFERENCE ID */}
            {trackTab === 'id' ? (
              <div>
                <p className="sn-subtext" style={{ marginBottom: '14px' }}>
                  Enter your Reference ID (e.g. SAN-2026-4821) to view live editorial progress.
                </p>

                <form onSubmit={handleTrackStatus} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    className="sn-input"
                    placeholder="Enter Reference ID"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="sn-btn-primary"
                    disabled={trackLoading}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {trackLoading ? '...' : 'Check'}
                  </button>
                </form>

                {/* RECENT SAVED IDS ON THIS DEVICE */}
                {recentRefs.length > 0 && (
                  <div className="sn-recent-wrap">
                    <div className="sn-recent-label">SAVED ON THIS DEVICE</div>
                    <div className="sn-recent-chips">
                      {recentRefs.map((item) => (
                        <button
                          key={item.reference_id}
                          type="button"
                          className="sn-recent-chip"
                          onClick={() => fetchStatusById(item.reference_id)}
                        >
                          {item.reference_id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: FORGOT REFERENCE ID LOOKUP */
              <div>
                <p className="sn-subtext" style={{ marginBottom: '14px' }}>
                  Enter the exact Email and 10-digit Phone used during submission to recover your
                  Reference IDs.
                </p>

                <form onSubmit={handleRecoverIds} className="sn-recover-form">
                  <input
                    type="email"
                    required
                    className="sn-input"
                    placeholder="Registered Email Address"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className="sn-input"
                    placeholder="Registered 10-digit Phone No."
                    value={recoverPhone}
                    onChange={(e) =>
                      setRecoverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                  />
                  <button
                    type="submit"
                    className="sn-btn-primary"
                    disabled={trackLoading}
                    style={{ width: '100%' }}
                  >
                    {trackLoading ? 'Searching...' : 'Find My Submissions'}
                  </button>
                </form>

                {recoveredList.length > 0 && (
                  <div className="sn-recovered-list sn-fade-in">
                    <div className="sn-recent-label">
                      FOUND {recoveredList.length} SUBMISSION{recoveredList.length > 1 ? 'S' : ''} —
                      TAP TO VIEW TIMELINE
                    </div>
                    {recoveredList.map((item) => (
                      <div
                        key={item.reference_id}
                        className={`sn-recovered-item ${
                          trackedResult?.reference_id === item.reference_id ? 'selected' : ''
                        }`}
                        onClick={() => setTrackedResult(item)}
                      >
                        <div>
                          <div className="sn-recovered-ref">{item.reference_id}</div>
                          <div className="sn-recovered-sub">
                            {item.submission_type} &middot; {item.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="sn-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTrackedId(item.reference_id);
                          }}
                        >
                          {copiedTrackId === item.reference_id ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {trackError && <p className="sn-error-text sn-fade-in">{trackError}</p>}

            {/* LIVE MULTI-STAGE TRACKING RESULT */}
            {trackedResult && activeStatusMeta && (
              <div className="sn-track-result sn-fade-in">
                <div className="sn-track-result-head">
                  <div>
                    <span
                      className={`sn-track-badge ${
                        activeStatusMeta.isRevision ? 'sn-badge-revision' : ''
                      }`}
                    >
                      {trackedResult.status}
                    </span>
                    <div className="sn-track-name">{trackedResult.full_name}</div>
                    <div className="sn-track-meta">
                      {trackedResult.submission_type} &middot; Submitted{' '}
                      {new Date(trackedResult.created_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="sn-copy-btn"
                    onClick={() => handleCopyTrackedId(trackedResult.reference_id)}
                  >
                    {copiedTrackId === trackedResult.reference_id
                      ? 'Copied ✓'
                      : trackedResult.reference_id}
                  </button>
                </div>

                {activeStatusMeta.isRevision && (
                  <div className="sn-revision-alert">
                    The Editorial Board has requested a minor revision on this entry. Please check
                    the note below or contact the संRACHNA team.
                  </div>
                )}

                {trackedResult.editorial_note && (
                  <div className="sn-editor-note">
                    <span className="sn-note-kicker">EDITORIAL BOARD NOTE</span>
                    <p className="sn-note-text">{trackedResult.editorial_note}</p>
                  </div>
                )}

                {/* VISUAL EDITORIAL PROGRESS TIMELINE */}
                <div className="sn-timeline">
                  {STATUS_STAGES.map((stage, idx) => {
                    const isDone = idx < activeStatusMeta.index;
                    const isCurrent = idx === activeStatusMeta.index;
                    return (
                      <div
                        key={stage.key}
                        className={`sn-tl-row ${isDone ? 'done' : ''} ${
                          isCurrent ? 'current' : ''
                        }`}
                      >
                        <div className="sn-tl-marker-col">
                          <div className="sn-tl-dot">
                            {isDone ? '✓' : isCurrent ? '●' : ''}
                          </div>
                          {idx < STATUS_STAGES.length - 1 && <div className="sn-tl-line" />}
                        </div>
                        <div className="sn-tl-content">
                          <div className="sn-tl-title">{stage.label}</div>
                          <div className="sn-tl-desc">{stage.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {trackedResult.updated_at && (
                  <div className="sn-tl-updated">
                    Last updated:{' '}
                    {new Date(trackedResult.updated_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                )}

                <SubmissionFilesPreview referenceId={trackedResult.reference_id} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* ============================================================== */
        /* FIXED FULL-VIEWPORT SHELL (ZERO TRANSFORM -> NO POSITION BUGS) */
        /* ============================================================== */
        .sn-portal-shell {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          z-index: 9000;
          overflow: hidden;
          background: #140306;
          color: #FAF4EB;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          text-align: left;
          box-sizing: border-box;
          animation: snShellFade 0.35s ease forwards;
        }
        @keyframes snShellFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* LIVE BREATHING ROYAL AURORA BACKGROUND */
        .sn-aurora-bg {
          position: absolute;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 20%, rgba(139, 30, 36, 0.44) 0%, transparent 48%),
            radial-gradient(circle at 84% 25%, rgba(212, 175, 55, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 60% 85%, rgba(92, 16, 26, 0.5) 0%, transparent 52%),
            linear-gradient(155deg, #27060B 0%, #160306 55%, #0D0204 100%);
          animation: snAuroraDrift 16s ease-in-out infinite alternate;
        }
        @keyframes snAuroraDrift {
          0% { transform: translate3d(0%, 0%, 0) scale(1); }
          100% { transform: translate3d(-2.5%, 2%, 0) scale(1.06); }
        }

        .sn-embers-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .sn-grain-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* CLOSED NOTICE CARD */
        .sn-closed-card {
          position: relative;
          width: 100%;
          max-width: 640px;
          text-align: center;
          padding: 40px 32px;
          border-radius: 24px;
          background: linear-gradient(160deg, rgba(58, 11, 19, 0.78) 0%, rgba(20, 3, 6, 0.92) 100%);
          border: 1px solid rgba(212, 175, 55, 0.38);
          backdrop-filter: blur(20px);
          box-shadow: 0 30px 75px rgba(0, 0, 0, 0.65);
        }
        .sn-closed-pill {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(239, 68, 68, 0.14);
          color: #fca5a5;
          margin-bottom: 14px;
        }
        .sn-closed-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3.6vw, 40px);
          line-height: 1.18;
          margin: 0 0 14px;
          color: #FAF4EB;
        }
        .sn-closed-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ============================================================== */
        /* VIEW 1: FULL-SCREEN EDITORIAL WELCOME STAGE                    */
        /* ============================================================== */
        .sn-welcome-stage {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
        }
        .sn-welcome-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 36px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.16);
          background: rgba(20, 3, 6, 0.45);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          flex-shrink: 0;
        }
        .sn-welcome-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sn-nav-logo {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 50%;
          background: #FAF4EB;
          padding: 3px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
        }
        .sn-nav-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #FAF4EB;
          line-height: 1.1;
        }
        .sn-nav-sub {
          font-size: 10.5px;
          letter-spacing: 0.16em;
          color: #E5C158;
          margin-top: 2px;
          font-weight: 600;
        }
        .sn-welcome-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sn-welcome-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 36px 40px;
          box-sizing: border-box;
        }
        .sn-welcome-grid {
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 48px;
          align-items: center;
        }
        .sn-welcome-hero {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .sn-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .sn-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
          animation: snDraftPulse 2s ease-in-out infinite;
        }
        .sn-welcome-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(34px, 4.4vw, 56px);
          font-weight: 700;
          line-height: 1.12;
          margin: 0 0 18px 0;
          color: #FAF4EB;
          letter-spacing: -0.02em;
        }
        .sn-gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFF1B8 38%, #E5C158 65%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: snShimmerFlow 4.5s linear infinite;
        }
        @keyframes snShimmerFlow {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .sn-welcome-lead {
          font-size: clamp(15px, 1.3vw, 17px);
          line-height: 1.7;
          color: rgba(250, 244, 235, 0.74);
          max-width: 500px;
          margin: 0 0 28px 0;
        }
        .sn-welcome-highlights {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 440px;
        }
        .sn-highlight-chip {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(212, 175, 55, 0.2);
          backdrop-filter: blur(10px);
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .sn-highlight-chip:hover {
          transform: translateX(4px);
          border-color: rgba(212, 175, 55, 0.45);
        }
        .sn-chip-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          color: #E5C158;
          width: 28px;
          flex-shrink: 0;
        }
        .sn-chip-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #FAF4EB;
        }
        .sn-chip-sub {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.6);
          margin-top: 2px;
        }

        /* RIGHT INTERACTIVE PREFLIGHT PANEL */
        .sn-preflight-panel {
          position: relative;
          background: linear-gradient(160deg, rgba(58, 11, 19, 0.72) 0%, rgba(22, 4, 8, 0.86) 100%);
          border: 1px solid rgba(212, 175, 55, 0.34);
          border-radius: 24px;
          padding: 30px 28px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.58),
            0 1px 0 rgba(255, 255, 255, 0.08) inset;
        }
        .sn-panel-rim {
          position: absolute;
          top: 0;
          left: 28px;
          right: 28px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #D4AF37 30%, #FFF0B3 50%, #D4AF37 70%, transparent);
        }
        .sn-panel-kicker {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #D4AF37;
          margin-bottom: 6px;
        }
        .sn-panel-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #FAF4EB;
          margin: 0 0 18px 0;
        }
        .sn-doc-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }
        .sn-doc-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 14px;
          text-decoration: none;
          color: #FAF4EB;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-doc-card:hover {
          background: rgba(212, 175, 55, 0.17);
          border-color: #F3D576;
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.36);
        }
        .sn-doc-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(212, 175, 55, 0.18);
          border: 1px solid rgba(212, 175, 55, 0.45);
          color: #F6DC88;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sn-doc-title {
          font-size: 14px;
          font-weight: 600;
          color: #F6DC88;
        }
        .sn-doc-sub {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.65);
          margin-top: 2px;
        }
        .sn-doc-arrow {
          font-size: 18px;
          color: #E5C158;
          transition: transform 0.25s ease;
        }
        .sn-doc-card:hover .sn-doc-arrow {
          transform: translate(3px, -3px);
        }

        .sn-check-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 16px;
          border-top: 1px solid rgba(212, 175, 55, 0.18);
        }
        .sn-preflight-check {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.16);
          font-size: 13px;
          line-height: 1.45;
          color: rgba(250, 244, 235, 0.9);
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .sn-preflight-check:hover {
          border-color: rgba(212, 175, 55, 0.4);
          background: rgba(212, 175, 55, 0.07);
        }
        .sn-preflight-check.checked {
          border-color: rgba(212, 175, 55, 0.7);
          background: rgba(212, 175, 55, 0.14);
        }
        .sn-preflight-check input {
          margin-top: 2px;
          accent-color: #D4AF37;
          width: 17px;
          height: 17px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sn-cta-full {
          width: 100%;
          margin-top: 18px;
          padding: 15px 24px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .sn-cta-arrow {
          transition: transform 0.25s ease;
        }
        .sn-cta-full:hover:not(:disabled) .sn-cta-arrow {
          transform: translateX(4px);
        }

        .sn-stagger-1 {
          animation: snSlideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .sn-stagger-2 {
          opacity: 0;
          animation: snSlideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        @keyframes snSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ============================================================== */
        /* VIEW 2: FULL-HEIGHT SPLIT DESK (100% LOCKED SIDEBAR)           */
        /* ============================================================== */
        .sn-desk-layout {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 340px 1fr;
          overflow: hidden;
        }

        .sn-sidebar {
          position: relative;
          height: 100%;
          background: linear-gradient(180deg, rgba(61, 11, 19, 0.94) 0%, rgba(28, 5, 9, 0.98) 100%);
          border-right: 1px solid rgba(212, 175, 55, 0.24);
          padding: 28px 28px 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow-y: auto;
          backdrop-filter: blur(14px);
        }
        .sn-sidebar-glow {
          position: absolute;
          top: -90px;
          left: -90px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .sn-sidebar-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
          gap: 28px;
        }
        .sn-top-nav-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .sn-track-trigger-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(212, 175, 55, 0.32);
          color: #FAF4EB;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-track-trigger-btn:hover {
          border-color: #F3D576;
          background: rgba(212, 175, 55, 0.18);
          transform: translateY(-2px);
        }

        /* ANIMATED CROSS (✕) BUTTON */
        .sn-anim-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(212, 175, 55, 0.38);
          background: rgba(255, 255, 255, 0.06);
          color: #F3D576;
          font-size: 15px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-anim-close-btn:hover {
          transform: rotate(90deg) scale(1.08);
          background: rgba(139, 30, 36, 0.9);
          border-color: #F3D576;
          color: #FFFFFF;
          box-shadow: 0 6px 20px rgba(139, 30, 36, 0.5);
        }
        .sn-anim-close-btn:active {
          transform: rotate(90deg) scale(0.94);
        }
        .sn-close-sm {
          width: 30px;
          height: 30px;
          font-size: 13px;
          border-radius: 8px;
        }

        .sn-brand-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .sn-sidebar-logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.96);
          padding: 4px;
          flex-shrink: 0;
          transition: transform 0.35s ease;
        }
        .sn-sidebar-logo:hover {
          transform: scale(1.06) rotate(-5deg);
        }
        .sn-edition-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #E5C158;
          border: 1px solid rgba(212, 175, 55, 0.45);
          background: rgba(212, 175, 55, 0.1);
          padding: 4px 10px;
          border-radius: 999px;
        }
        .sn-brand-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 30px;
          font-weight: 700;
          color: #FAF4EB;
          margin: 0;
          line-height: 1.1;
        }
        .sn-brand-sub {
          font-size: 12.5px;
          line-height: 1.55;
          color: rgba(250, 244, 235, 0.65);
          margin: 0;
        }

        /* DESKTOP STEPPER WITH LIVE RAIL */
        .sn-stepper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sn-stepper-rail {
          position: absolute;
          left: 15px;
          top: 16px;
          bottom: 16px;
          width: 2px;
          background: rgba(212, 175, 55, 0.18);
          border-radius: 2px;
          overflow: hidden;
        }
        .sn-stepper-rail-fill {
          width: 100%;
          background: linear-gradient(180deg, #F3D576, #D4AF37);
          transition: height 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-step-item {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          opacity: 0.48;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .sn-step-item.active,
        .sn-step-item.done {
          opacity: 1;
        }
        .sn-step-item.active {
          transform: translateX(4px);
        }
        .sn-step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 55, 0.42);
          background: #24050A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .sn-step-item.active .sn-step-num {
          border-color: #F3D576;
          color: #F3D576;
          background: #3B0B13;
          box-shadow: 0 0 18px rgba(212, 175, 55, 0.32);
        }
        .sn-step-item.done .sn-step-num {
          background: #D4AF37;
          border-color: #D4AF37;
          color: #220509;
        }
        .sn-step-title {
          font-size: 14px;
          font-weight: 600;
          color: #FAF4EB;
        }
        .sn-step-desc {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.6);
          margin-top: 2px;
        }

        .sn-mobile-stepper {
          display: none;
        }

        .sn-theme-footer {
          border-top: 1px solid rgba(212, 175, 55, 0.18);
          padding-top: 18px;
        }
        .sn-theme-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          color: #D4AF37;
          font-weight: 700;
        }
        .sn-theme-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          margin: 5px 0;
          color: #FAF4EB;
        }
        .sn-theme-copy {
          font-size: 12.5px;
          color: rgba(250, 244, 235, 0.6);
          margin: 0;
        }
        .sn-inline-link {
          background: none;
          border: none;
          color: #E5C158;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          font-size: 12.5px;
        }
        .sn-inline-link:hover {
          color: #FAF4EB;
        }

        /* RIGHT SCROLLABLE WORKSPACE */
        .sn-workspace {
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 36px 52px 64px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          box-sizing: border-box;
        }
        .sn-form-container {
          width: 100%;
          max-width: 760px;
        }
        .sn-utility-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .sn-mobile-guide-btn {
          display: none;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: #F3D576;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .sn-draft-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          color: rgba(250, 244, 235, 0.72);
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.22);
          padding: 5px 12px;
          border-radius: 999px;
        }
        .sn-draft-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: snDraftPulse 2s ease-in-out infinite;
        }
        @keyframes snDraftPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.8); }
        }

        .sn-step-header {
          margin-bottom: 24px;
        }
        .sn-kicker {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #D4AF37;
          font-weight: 700;
        }
        .sn-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 30px;
          font-weight: 700;
          margin: 6px 0;
          color: #FAF4EB;
        }
        .sn-subtext {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(250, 244, 235, 0.68);
          margin: 0;
        }
        .sn-req {
          color: #E5C158;
        }

        /* FIELDS */
        .sn-field-group {
          margin-bottom: 20px;
        }
        .sn-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sn-label {
          display: block;
          font-size: 13px;
          color: rgba(250, 244, 235, 0.88);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .sn-label-hint {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.5);
          font-weight: 400;
          margin-left: 6px;
        }
        .sn-input {
          width: 100%;
          padding: 13px 15px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(212, 175, 55, 0.24);
          border-radius: 10px;
          color: #FAF4EB;
          font-size: 15.5px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }
        .sn-textarea {
          resize: vertical;
          font-family: inherit;
        }
        .sn-input::placeholder {
          color: rgba(250, 244, 235, 0.34);
        }
        .sn-input:focus {
          border-color: #D4AF37;
          background: rgba(212, 175, 55, 0.08);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
        }

        /* RADIO CARDS & PILLS */
        .sn-radio-grid-2,
        .sn-submission-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .sn-radio-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sn-radio-card,
        .sn-radio-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 10px;
          color: rgba(250, 244, 235, 0.86);
          font-size: 13.5px;
          cursor: pointer;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-radio-card:hover,
        .sn-radio-pill:hover {
          border-color: rgba(212, 175, 55, 0.58);
          background: rgba(212, 175, 55, 0.09);
          transform: translateY(-2px);
        }
        .sn-radio-card.selected,
        .sn-radio-pill.selected {
          border-color: #D4AF37;
          background: rgba(212, 175, 55, 0.17);
          color: #FAF4EB;
          font-weight: 600;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
        }
        .sn-radio-dot {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1.5px solid rgba(212, 175, 55, 0.55);
          flex-shrink: 0;
          transition: all 0.22s ease;
        }
        .selected .sn-radio-dot {
          border-color: #D4AF37;
          background: radial-gradient(circle, #D4AF37 45%, transparent 50%);
          transform: scale(1.1);
        }

        /* PHOTO & UPLOADS */
        .sn-compact-upload {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          border: 1px dashed rgba(212, 175, 55, 0.45);
          border-radius: 10px;
          background: rgba(212, 175, 55, 0.05);
          color: #E5C158;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .sn-compact-upload:hover {
          border-color: #F3D576;
          background: rgba(212, 175, 55, 0.12);
          transform: translateY(-2px);
        }
        .sn-photo-preview-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border: 1px solid rgba(212, 175, 55, 0.45);
          background: rgba(212, 175, 55, 0.1);
          border-radius: 10px;
        }
        .sn-photo-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sn-avatar-thumb {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #D4AF37;
        }
        .sn-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 26px 18px;
          border: 1px dashed rgba(212, 175, 55, 0.45);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          cursor: pointer;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sn-dropzone:hover {
          border-color: #F3D576;
          background: rgba(212, 175, 55, 0.08);
          transform: translateY(-2px);
        }
        .sn-dropzone.optional {
          padding: 18px;
          border-color: rgba(212, 175, 55, 0.28);
        }
        .sn-dropzone.drag-active {
          border-style: solid;
          border-color: #F3D576;
          background: rgba(212, 175, 55, 0.16);
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.28);
        }
        .sn-drop-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 55, 0.5);
          color: #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          transition: transform 0.25s ease;
        }
        .sn-dropzone:hover .sn-drop-icon {
          transform: translateY(-3px);
        }
        .sn-drop-title {
          font-size: 14px;
          font-weight: 500;
          color: #FAF4EB;
        }
        .sn-drop-sub {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.5);
          margin-top: 4px;
        }
        .sn-file-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border: 1px solid rgba(212, 175, 55, 0.45);
          background: rgba(212, 175, 55, 0.1);
          border-radius: 10px;
        }
        .sn-file-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #FAF4EB;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 240px;
        }
        .sn-file-size {
          font-size: 12px;
          color: #E5C158;
          margin-top: 2px;
        }
        .sn-error-text {
          color: #fca5a5;
          font-size: 13px;
          margin-top: 10px;
        }

        /* PROGRESS BAR */
        .sn-progress-wrap {
          margin-top: 24px;
          padding: 16px;
          border-radius: 10px;
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.28);
        }
        .sn-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: #F3D576;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .sn-progress-track {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }
        .sn-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4AF37, #F3D576);
          border-radius: 999px;
          transition: width 0.35s ease;
        }

        /* SUMMARY & DECLARATIONS */
        .sn-summary-strip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 12px;
          margin-bottom: 22px;
        }
        .sn-summary-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: #D4AF37;
          margin-bottom: 4px;
        }
        .sn-summary-val {
          font-size: 13.5px;
          color: #FAF4EB;
          font-weight: 500;
          word-break: break-word;
        }
        .sn-declarations {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sn-check-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 13.5px;
          line-height: 1.5;
          color: rgba(250, 244, 235, 0.88);
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .sn-check-row:hover {
          background: rgba(212, 175, 55, 0.07);
        }
        .sn-check-row input {
          margin-top: 3px;
          accent-color: #D4AF37;
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ACTIONS */
        .sn-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(212, 175, 55, 0.18);
        }
        .sn-btn-primary {
          position: relative;
          overflow: hidden;
          padding: 13px 26px;
          background: linear-gradient(135deg, #F0CE68 0%, #D4AF37 55%, #B98E1D 100%);
          color: #1A0407;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 24px rgba(212, 175, 55, 0.24);
        }
        .sn-btn-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: -130%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          transform: skewX(-22deg);
          transition: left 0.65s ease;
        }
        .sn-btn-primary:hover:not(:disabled)::after {
          left: 160%;
        }
        .sn-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(212, 175, 55, 0.38);
        }
        .sn-btn-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .sn-btn-primary:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }
        .sn-btn-ghost {
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(250, 244, 235, 0.9);
          border: 1px solid rgba(212, 175, 55, 0.34);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .sn-btn-ghost:hover:not(:disabled) {
          border-color: #F3D576;
          background: rgba(212, 175, 55, 0.12);
          transform: translateY(-2px);
        }

        /* TRACK MODAL + TIMELINE */
        .sn-track-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(12, 2, 4, 0.86);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }
        .sn-track-sheet {
          position: relative;
          width: 100%;
          max-width: 560px;
          max-height: 90dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: linear-gradient(160deg, #2F080E 0%, #170306 100%);
          border: 1px solid rgba(212, 175, 55, 0.38);
          border-radius: 20px;
          padding: 24px 26px 26px;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.72);
          box-sizing: border-box;
        }
        .sn-track-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .sn-track-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .sn-track-tab {
          padding: 9px 12px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: rgba(250, 244, 235, 0.65);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .sn-track-tab.active {
          background: rgba(212, 175, 55, 0.2);
          color: #F6DC88;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }
        .sn-recent-wrap {
          margin-top: 14px;
        }
        .sn-recent-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: rgba(229, 193, 88, 0.8);
          margin-bottom: 8px;
        }
        .sn-recent-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sn-recent-chip {
          padding: 6px 11px;
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.35);
          background: rgba(212, 175, 55, 0.08);
          color: #F3D576;
          font-family: monospace;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sn-recent-chip:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #F3D576;
          transform: translateY(-1px);
        }
        .sn-recover-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sn-recovered-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sn-recovered-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(212, 175, 55, 0.24);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sn-recovered-item:hover,
        .sn-recovered-item.selected {
          background: rgba(212, 175, 55, 0.14);
          border-color: #D4AF37;
        }
        .sn-recovered-ref {
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: #F6DC88;
        }
        .sn-recovered-sub {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.7);
          margin-top: 2px;
        }

        .sn-track-result {
          margin-top: 18px;
          padding: 18px;
          border-radius: 14px;
          background: rgba(212, 175, 55, 0.07);
          border: 1px solid rgba(212, 175, 55, 0.34);
        }
        .sn-track-result-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sn-track-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background: #D4AF37;
          color: #1F0408;
          margin-bottom: 8px;
        }
        .sn-badge-revision {
          background: #f59e0b;
          color: #1F0408;
        }
        .sn-track-name {
          font-size: 16px;
          font-weight: 700;
          color: #FAF4EB;
        }
        .sn-track-meta {
          font-size: 12px;
          color: rgba(250, 244, 235, 0.65);
          margin-top: 3px;
        }
        .sn-revision-alert {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.45);
          color: #fde68a;
          font-size: 12.5px;
          line-height: 1.45;
        }
        .sn-editor-note {
          margin-top: 12px;
          padding: 11px 13px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border-left: 3px solid #D4AF37;
        }
        .sn-note-kicker {
          display: block;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #E5C158;
          margin-bottom: 4px;
        }
        .sn-note-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #FAF4EB;
        }

        /* VERTICAL STATUS TIMELINE */
        .sn-timeline {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(212, 175, 55, 0.18);
          display: flex;
          flex-direction: column;
        }
        .sn-tl-row {
          display: flex;
          align-items: stretch;
          gap: 12px;
          opacity: 0.42;
          transition: opacity 0.25s ease;
        }
        .sn-tl-row.done,
        .sn-tl-row.current {
          opacity: 1;
        }
        .sn-tl-marker-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 22px;
          flex-shrink: 0;
        }
        .sn-tl-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid rgba(212, 175, 55, 0.45);
          background: #1C0408;
          color: #1F0408;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sn-tl-row.done .sn-tl-dot {
          background: #D4AF37;
          border-color: #D4AF37;
          color: #1F0408;
        }
        .sn-tl-row.current .sn-tl-dot {
          background: rgba(212, 175, 55, 0.22);
          border-color: #F6DC88;
          color: #F6DC88;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.55);
          animation: snDraftPulse 2s ease-in-out infinite;
        }
        .sn-tl-line {
          width: 2px;
          flex: 1;
          min-height: 18px;
          margin: 3px 0;
          background: rgba(212, 175, 55, 0.2);
        }
        .sn-tl-row.done .sn-tl-line {
          background: #D4AF37;
        }
        .sn-tl-content {
          padding-bottom: 12px;
        }
        .sn-tl-row:last-child .sn-tl-content {
          padding-bottom: 2px;
        }
        .sn-tl-title {
          font-size: 13px;
          font-weight: 700;
          color: #FAF4EB;
          line-height: 1.25;
        }
        .sn-tl-row.current .sn-tl-title {
          color: #F6DC88;
        }
        .sn-tl-desc {
          font-size: 11.5px;
          color: rgba(250, 244, 235, 0.62);
          margin-top: 2px;
        }
        .sn-tl-updated {
          margin-top: 12px;
          font-size: 11.5px;
          color: rgba(250, 244, 235, 0.55);
          text-align: right;
        }

        /* SUCCESS RECEIPT */
        .sn-success-card {
          text-align: center;
          padding: 36px 16px;
        }
        .sn-success-mark {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1.5px solid #D4AF37;
          color: #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          margin: 0 auto 18px;
          background: rgba(212, 175, 55, 0.14);
          animation: snPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes snPopIn {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        .sn-ref-box {
          display: inline-block;
          padding: 14px 24px;
          border: 1px solid rgba(212, 175, 55, 0.42);
          border-radius: 12px;
          background: rgba(212, 175, 55, 0.08);
        }
        .sn-ref-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .sn-ref-code {
          font-family: monospace;
          font-size: 20px;
          letter-spacing: 0.1em;
          color: #F3D576;
          font-weight: 600;
        }
        .sn-copy-btn {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(212, 175, 55, 0.2);
          color: #FAF4EB;
          border: 1px solid rgba(212, 175, 55, 0.45);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sn-copy-btn:hover {
          background: rgba(212, 175, 55, 0.34);
        }
        .sn-receipt-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          max-width: 560px;
          margin: 24px auto 0;
          padding: 16px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          text-align: left;
        }
        .sn-receipt-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .sn-fade-in {
          animation: snFade 0.28s ease forwards;
        }
        .sn-step-anim {
          animation: snStepSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes snStepSlide {
          from { opacity: 0; transform: translateX(14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes snFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media print {
          .no-print { display: none !important; }
          .sn-portal-shell {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111111 !important;
          }
          .sn-desk-layout,
          .sn-workspace {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .sn-heading, .sn-subtext, .sn-summary-val, .sn-ref-code {
            color: #111111 !important;
          }
        }

        /* ============================================================== */
        /* MOBILE / PHONE RESPONSIVE LAYOUT                               */
        /* ============================================================== */
        @media (max-width: 900px) {
          .sn-welcome-nav {
            padding: 14px 16px;
          }
          .sn-nav-logo {
            width: 36px;
            height: 36px;
          }
          .sn-nav-title {
            font-size: 19px;
          }
          .sn-nav-sub {
            font-size: 9.5px;
          }
          .sn-welcome-body {
            align-items: flex-start;
            padding: 20px 16px 32px;
          }
          .sn-welcome-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .sn-welcome-headline {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .sn-welcome-lead {
            font-size: 13.5px;
            margin-bottom: 0;
          }
          .sn-welcome-highlights {
            display: none;
          }
          .sn-preflight-panel {
            padding: 20px 16px;
            border-radius: 18px;
          }
          .sn-panel-title {
            font-size: 21px;
            margin-bottom: 14px;
          }

          /* PINNED COMPACT TOP BAR + SCROLLABLE FORM BELOW */
          .sn-desk-layout {
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
          }
          .sn-sidebar {
            flex-shrink: 0;
            height: auto;
            overflow: visible;
            padding: 14px 16px 12px;
            border-right: none;
            border-bottom: 1px solid rgba(212, 175, 55, 0.24);
          }
          .sn-sidebar-inner {
            min-height: auto;
            gap: 0;
          }
          .sn-top-nav-row {
            margin-bottom: 12px;
          }
          .sn-sidebar-logo {
            width: 38px;
            height: 38px;
          }
          .sn-brand-title {
            font-size: 22px;
          }
          .sn-brand-sub,
          .sn-stepper,
          .sn-theme-footer {
            display: none;
          }
          .sn-mobile-stepper {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid rgba(212, 175, 55, 0.16);
          }
          .sn-m-step {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(212, 175, 55, 0.14);
            opacity: 0.55;
            transition: all 0.25s ease;
          }
          .sn-m-step.active,
          .sn-m-step.done {
            opacity: 1;
            border-color: #D4AF37;
            background: rgba(212, 175, 55, 0.16);
          }
          .sn-m-dot {
            width: 19px;
            height: 19px;
            border-radius: 50%;
            font-size: 10.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(212, 175, 55, 0.22);
            color: #F3D576;
          }
          .sn-m-step.done .sn-m-dot {
            background: #D4AF37;
            color: #1F0408;
          }
          .sn-m-label {
            font-size: 11.5px;
            font-weight: 600;
            color: #FAF4EB;
          }

          .sn-workspace {
            flex: 1;
            min-height: 0;
            height: auto;
            padding: 18px 16px 56px;
          }
          .sn-utility-bar {
            justify-content: space-between;
          }
          .sn-mobile-guide-btn {
            display: inline-block;
          }
          .sn-heading {
            font-size: 24px;
          }
          .sn-grid-2,
          .sn-radio-grid-2,
          .sn-submission-list,
          .sn-summary-strip,
          .sn-receipt-meta {
            grid-template-columns: 1fr;
          }
          .sn-actions {
            margin-top: 24px;
            padding: 18px 0 24px;
          }
          .sn-track-sheet {
            padding: 20px 18px 22px;
          }
        }
      `}</style>
    </div>
  );
}
