import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Feather,
  FileText,
  Flame,
  GraduationCap,
  Image,
  Mail,
  Mic,
  Moon,
  Newspaper,
  Palette,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

// ===========================================================================
// 1. FLOATING 3D BUBBLES / PARTICLES ENGINE (MATCHING MAIN PORTAL)
// ===========================================================================
interface Particle {
  angle: number;
  radius: number;
  y: number;
  size: number;
  angularSpeed: number;
  opacity: number;
  screenX: number;
  screenY: number;
  projectedScale: number;
  isGold: boolean;
}

function Floating3DBubbles({ isDarkMode }: { isDarkMode: boolean }) {
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
    let particles: Particle[] = [];

    const fov = 420;
    const perspectiveDistance = 520;
    const depthRange = 280;
    const spreadFactor = 1.2;

    const spawn = (w: number, h: number): Particle => {
      const baseSize = 4.5;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * Math.max(w, h) * spreadFactor,
        y: (Math.random() - 0.5) * h * 2,
        size: 1.8 + Math.random() * baseSize,
        angularSpeed: 0.0014 + Math.random() * 0.0012,
        opacity: 0.16 + Math.random() * 0.28,
        screenX: 0,
        screenY: 0,
        projectedScale: 1,
        isGold: Math.random() > 0.45,
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
      const count = window.innerWidth < 768 ? 36 : 120;
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
        p.y -= 0.55;
        if (p.y < -height) {
          p.y = height;
          p.radius = Math.random() * Math.max(width, height) * spreadFactor;
        }
        const denom = Math.max(1, fov + perspectiveDistance + Math.sin(p.angle) * depthRange);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
      }

      particles.sort((a, b) => a.projectedScale - b.projectedScale);

      for (const p of particles) {
        const r = Math.max(0.6, p.size * p.projectedScale);
        ctx.beginPath();
        const alpha = isDarkMode ? p.opacity * 1.15 : p.opacity * 0.9;
        ctx.fillStyle = p.isGold
          ? `rgba(212, 175, 55, ${Math.min(0.65, alpha)})`
          : `rgba(139, 30, 36, ${Math.min(0.65, alpha)})`;
        ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);
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
// 2. TYPES & OFFICIAL GUIDELINES DATA (12 CATEGORIES)
// ===========================================================================
interface GuidelinesPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenSubmission: () => void;
}

type CategoryGroup = 'all' | 'writing' | 'media' | 'visual';
type FormatTab = 'english' | 'hindi' | 'visual';

interface CategorySpec {
  id: string;
  number: string;
  name: string;
  hindiName: string;
  group: Exclude<CategoryGroup, 'all'>;
  domain: string;
  limitLabel: string;
  fileType: string;
  unit: 'words' | 'lines' | 'nos';
  min: number;
  max: number;
  icon: LucideIcon;
  summary: string;
  topics: string[];
  specialNote?: string;
  checklist: string[];
}

const CATEGORIES: CategorySpec[] = [
  {
    id: 'articles',
    number: '01',
    name: 'Articles',
    hindiName: 'लेख',
    group: 'writing',
    domain: 'Technical / Non-Technical',
    limitLabel: '700 – 900 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 700,
    max: 900,
    icon: FileText,
    summary:
      'In-depth scientific breakthroughs, engineering trends, research summaries, and national or international perspectives.',
    topics: [
      'Scientific breakthroughs & new discoveries in Science and Technology',
      'Nobel Prize winners’ topics & great scientists’ contributions',
      'Research summaries, technical papers, trending research & patents',
      'Emerging trends in engineering fields',
      'National or international technical and non-technical topics',
    ],
    checklist: [
      '700 – 900 words strictly maintained',
      'A4 layout (Bookman Old 11pt / Mangal or KrutiDev 14pt)',
      '100% original writing (0% AI & plagiarism)',
      'Author brief bio & 300 DPI author photo ready',
    ],
  },
  {
    id: 'journalism',
    number: '02',
    name: 'Journalism',
    hindiName: 'पत्रकारिता',
    group: 'media',
    domain: 'Interviews & Affairs',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    icon: Mic,
    summary:
      'Crisp interviews and factual features highlighting great scientific personalities, technocrats, sportspersons, filmmakers, and current affairs.',
    topics: [
      'Interviews of great scientific personalities & technocrats',
      'Conversations with sportspersons & filmmakers',
      'Well-researched current affairs features',
    ],
    specialNote: 'Verify every quote, name, and date accurately before submission.',
    checklist: [
      '250 – 500 words limit followed',
      'All quotes & facts verified',
      'Editable .doc / .docx with clear descriptive title',
      'Author brief bio & 300 DPI photo attached separately',
    ],
  },
  {
    id: 'mass-communication',
    number: '03',
    name: 'Mass Communication',
    hindiName: 'जनसंचार एवं समीक्षा',
    group: 'media',
    domain: 'Reviews & Critique',
    limitLabel: '400 – 600 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 400,
    max: 600,
    icon: Radio,
    summary:
      'Thoughtful reviews and critical reflections on internationally acclaimed novels, movies, and impactful storytelling.',
    topics: [
      'Reviews of internationally acclaimed novels',
      'Critical reviews of internationally acclaimed movies',
      'Analytical takes on literature & cinema',
    ],
    checklist: [
      '400 – 600 words limit followed',
      'Original, respectful critique free from hate or spoilers',
      'A4 format with 1.5 line spacing & 6pt paragraph spacing',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'biography',
    number: '04',
    name: 'Biography',
    hindiName: 'जीवनी एवं डायरी',
    group: 'writing',
    domain: 'Profiles & Diaries',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    icon: UserCheck,
    summary:
      'Inspiring life sketches of great scientists and iconic personalities alongside reflective diary entries.',
    topics: [
      'Biographies of great scientists & pioneers',
      'Life journeys of inspiring personalities',
      'Reflective, authentic diary entries',
    ],
    checklist: [
      '250 – 500 words limit followed',
      'Biographical dates & milestones verified',
      'Zero religious, mythological, or self-promotional content',
      'Editable .doc / .docx with bio & 300 DPI photo',
    ],
  },
  {
    id: 'poem',
    number: '05',
    name: 'Poem',
    hindiName: 'कविता',
    group: 'writing',
    domain: 'Technical / Non-Technical',
    limitLabel: '25 – 50 lines',
    fileType: '.doc / .docx',
    unit: 'lines',
    min: 25,
    max: 50,
    icon: Feather,
    summary:
      'Original Hindi or English poetry across both Technical/Scientific and Non-Technical themes.',
    topics: [
      'Non-technical & literary poems in Hindi or English',
      'Scientific, technological, or "The Zero (शून्य)" themed verses',
      'Structured stanzas or expressive free verse',
    ],
    specialNote: 'Keep exact stanza breaks clean in your Word file; avoid sending screenshots or Canva posters of text.',
    checklist: [
      '25 – 50 lines strictly maintained',
      'Hindi in KrutiDev/Mangal (14pt) or English in Bookman Old (11pt)',
      '100% self-composed (no AI lines or forwarded verses)',
      'Clear title, author bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'essay-story',
    number: '06',
    name: 'Essay / Short Story',
    hindiName: 'निबंध एवं लघुकथा',
    group: 'writing',
    domain: 'Technical / Non-Technical',
    limitLabel: '300 – 600 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 300,
    max: 600,
    icon: BookOpen,
    summary:
      'Compelling essays and original short stories blending scientific curiosity with human narratives.',
    topics: [
      'Technical & scientific essays or speculative fiction',
      'Non-technical personal essays & original short stories',
      'Stories reflecting campus life, ethics, or "The Zero (शून्य)"',
    ],
    checklist: [
      '300 – 600 words strictly maintained',
      'A4 specs: 1" margins, 1.5 line spacing, 6pt after paragraph',
      'Free from religious, mythological, or sensitive targeting content',
      'Editable .doc / .docx with bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'campus-news',
    number: '07',
    name: 'Campus News',
    hindiName: 'परिसर समाचार',
    group: 'media',
    domain: 'Campus & Clubs',
    limitLabel: '500 – 700 words',
    fileType: '.doc + 300 DPI Img',
    unit: 'words',
    min: 500,
    max: 700,
    icon: Newspaper,
    summary:
      'Official GEC Godda milestones—seminars, exhibitions, symposiums, placement highlights, awards, and club reports.',
    topics: [
      'Seminars, exhibitions, symposiums & technical workshops',
      'Placement highlights & institutional achievements',
      'Awards (College, District, State, National & International Level)',
      'Campus interviews (NO political or personal interviews)',
      'Official Club Event Reports',
    ],
    specialNote: 'Mandatory Rule: Any Club Event Report must be submitted by the Club Head ONLY. No political or personal interviews.',
    checklist: [
      '500 – 700 words limit followed',
      'Club Event Reports submitted by Club Head ONLY',
      'No political or personal interviews included',
      'Event photos (300 DPI) attached separately, NOT inside Word doc',
    ],
  },
  {
    id: 'career-entrepreneurship',
    number: '08',
    name: 'Career & Entrepreneurship',
    hindiName: 'करियर एवं उद्यमिता',
    group: 'media',
    domain: 'Startups & Innovation',
    limitLabel: '150 – 250 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 150,
    max: 250,
    icon: Briefcase,
    summary:
      'Concise startup spotlights from national, international, and nearby institutional innovation ecosystems.',
    topics: [
      'Startup spotlights in national & international arenas',
      'Entrepreneurship & innovation at nearby institutions',
      'Crisp career insights & founder takeaways',
    ],
    specialNote: 'Self-promotion or commercial brand promotion is strictly forbidden.',
    checklist: [
      '150 – 250 words crisp length maintained',
      'Zero self-promotion or commercial advertising',
      'Editable .doc / .docx formatted to A4 standards',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'artworks',
    number: '09',
    name: 'Drawing / Painting / Artworks',
    hindiName: 'चित्रकला एवं कलाकृति',
    group: 'visual',
    domain: 'Visual Arts',
    limitLabel: '1 – 2 nos',
    fileType: '.JPG / .PNG / .GIF',
    unit: 'nos',
    min: 1,
    max: 2,
    icon: Palette,
    summary:
      'Hand-drawn sketches, traditional paintings, digital illustrations, riddles, and picture stories across scientific & artistic themes.',
    topics: [
      'Sketches in scientific as well as non-scientific arenas',
      'Original paintings & fine art pieces',
      'Original digital arts (strictly non-AI)',
      'Visual riddles & creative picture stories',
    ],
    specialNote: 'Do NOT embed images inside a Word document. Upload high-res 300 DPI files separately with a short description.',
    checklist: [
      '1 – 2 original works (max 2 entries per author total)',
      '300 DPI .jpg, .png, or .gif file (NOT inside Word doc)',
      'Short artwork description written clearly',
      'Artist brief bio & 300 DPI artist photo ready',
    ],
  },
  {
    id: 'photography',
    number: '10',
    name: 'Photography',
    hindiName: 'छायाचित्रण',
    group: 'visual',
    domain: 'Visual Arts',
    limitLabel: '1 – 2 nos',
    fileType: '.JPG / .PNG / .GIF',
    unit: 'nos',
    min: 1,
    max: 2,
    icon: Camera,
    summary:
      'Scientific and non-scientific photographs paired with an appropriate caption and short context.',
    topics: [
      'Scientific, engineering, or macro photography',
      'Campus life, architecture, nature & candid moments',
      'Visual interpretations of "The Zero (शून्य)"',
    ],
    specialNote: 'Include an appropriate caption & short description. Submit raw/300 DPI image files directly—never inside Word.',
    checklist: [
      '1 – 2 original self-clicked photographs',
      '300 DPI .jpg / .png / .gif file (no WhatsApp compression)',
      'Appropriate caption & short description included',
      'Photographer bio & 300 DPI author photo ready',
    ],
  },
  {
    id: 'remembrance',
    number: '11',
    name: 'Remembrance / Observance',
    hindiName: 'स्मृति एवं दिवस',
    group: 'writing',
    domain: 'Commemoration',
    limitLabel: '500 – 700 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 500,
    max: 700,
    icon: Flame,
    summary:
      'Dignified tributes and reflections honoring commemoration days such as Vijay Diwas and historic national observances.',
    topics: [
      'National commemoration days such as Vijay Diwas',
      'Historic scientific, civic, or institutional observances',
      'Respectful reflections honoring heritage & values',
    ],
    specialNote: 'Religious or mythological content is strictly prohibited.',
    checklist: [
      '500 – 700 words strictly maintained',
      'Historically accurate & free from religious/mythological content',
      'A4 format with bottom-centre page numbers',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'alumni-corner',
    number: '12',
    name: 'Alumni Corner',
    hindiName: 'पूर्व छात्र संवाद',
    group: 'media',
    domain: 'Alumni Voices',
    limitLabel: '250 – 500 words',
    fileType: '.doc / .docx',
    unit: 'words',
    min: 250,
    max: 500,
    icon: GraduationCap,
    summary:
      'Dedicated column for GEC Godda alumni to share career journeys, industry lessons, and cherished campus memories.',
    topics: [
      'Career journeys, higher studies & real-world insights',
      'Cherished campus memories from GEC Godda',
      'Mentorship advice for current undergraduate batches',
    ],
    checklist: [
      '250 – 500 words limit followed',
      'Batch & branch mentioned in brief author biography',
      'Editable .doc / .docx formatted to A4 specs',
      '300 DPI author photograph ready',
    ],
  },
];

const PRE_SUBMISSION_ESSENTIALS = [
  {
    num: '01',
    code: '(a)',
    title: 'Brief Biography',
    desc: 'Short biography of the Author(s) / Artist(s) with Name, Branch & Batch/Designation.',
  },
  {
    num: '02',
    code: '(b)',
    title: 'Author Photograph',
    desc: 'High-clarity portrait photograph of the author at 300 DPI resolution.',
  },
  {
    num: '03',
    code: '(c)',
    title: 'Descriptive Title',
    desc: 'Clear title at the top of the article; attach supporting images separately if needed.',
  },
  {
    num: '04',
    code: '(d)',
    title: 'Visual Description',
    desc: 'Short description & appropriate caption for all Drawings, Paintings, Artworks & Photos.',
  },
];

const EDITORIAL_DISCLOSURES = [
  {
    num: '01',
    title: 'Entry Cap & Portal Exclusivity',
    body: 'One author can submit a maximum of two (02) entries in a particular edition. Only submissions made through the official portal are accepted; late entries are not entertained under any circumstances.',
  },
  {
    num: '02',
    title: 'Zero AI & Anti-Plagiarism Mandate',
    body: 'Artificial Intelligence (AI) works and any kind of plagiarism are strictly prohibited. Authors are encouraged to submit 100% original, self-authored write-ups and artworks.',
  },
  {
    num: '03',
    title: 'GEC Godda Community Eligibility',
    body: 'Submissions are accepted exclusively from the GEC Godda family—currently enrolled students, teaching staff, non-teaching staff, and alumni.',
  },
  {
    num: '04',
    title: 'Strict Content & Conduct Boundaries',
    body: 'Religious and mythological content, derogatory remarks about religion or spirituality, self-promotion/promotions, and content targeting or hurting the sentiments of any community, gender, or individual are strictly forbidden. Destructive criticism is not allowed; politely phrased constructive suggestions may be considered only upon Editorial Board discussion.',
  },
  {
    num: '05',
    title: 'Editorial Review & Editing Rights',
    body: 'Submission on the portal does not guarantee publication. All entries are reviewed by the Editorial Board and may be edited for spelling, grammar, and length—or returned to the author for rewrite if significantly over limit.',
  },
  {
    num: '06',
    title: 'Copyright & Republication Acknowledgement',
    body: 'Copyright of published materials stays solely with संRACHNA. If an author wishes to publish their work anywhere else after publication in संRACHNA, strict acknowledgement of the published material is mandatory; failure to obtain acknowledgement calls for strict action against the author.',
  },
];

// ===========================================================================
// 3. MAIN PREMIUM EDITORIAL GUIDELINES PAGE
// ===========================================================================
export default function GuidelinesPage({
  isDarkMode,
  onToggleTheme,
  onBack,
  onOpenSubmission,
}: GuidelinesPageProps) {
  const [expandedRowId, setExpandedRowId] = useState<string>('articles');
  const [activeGroup, setActiveGroup] = useState<CategoryGroup>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatTab, setFormatTab] = useState<FormatTab>('english');
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean[]>>({});
  const [openRuleIdx, setOpenRuleIdx] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const filteredCategories = CATEGORIES.filter((cat) => {
    const matchesGroup = activeGroup === 'all' || cat.group === activeGroup;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      cat.name.toLowerCase().includes(q) ||
      cat.hindiName.toLowerCase().includes(q) ||
      cat.domain.toLowerCase().includes(q) ||
      cat.topics.some((t) => t.toLowerCase().includes(q));
    return matchesGroup && matchesQuery;
  });

  const toggleCheck = (catId: string, totalLen: number, idx: number) => {
    setCheckedMap((prev) => {
      const existing = prev[catId] ?? Array(totalLen).fill(false);
      const updated = existing.map((val, i) => (i === idx ? !val : val));
      return { ...prev, [catId]: updated };
    });
  };

  const handleCopyRules = async (cat: CategorySpec) => {
    const payload = [
      `संRACHNA (GEC Godda) — Submission Guidelines`,
      `${cat.number}. ${cat.name} (${cat.hindiName})`,
      `Limit: ${cat.limitLabel} | Format: ${cat.fileType}`,
      ``,
      `Accepted Scope:`,
      ...cat.topics.map((t) => `• ${t}`),
      ``,
      cat.unit === 'nos'
        ? `Visual Spec: 300 DPI (.jpg, .png, .gif) uploaded separately—never inside Word doc.`
        : `Text Spec: A4 (8.27 x 11.69 in), 1" margins, 1.5 line spacing, 6pt paragraph spacing. English: Bookman Old 11pt (Heading 14pt Bold). Hindi: KrutiDev/Mangal 14pt (Heading 16pt).`,
      ``,
      `Theme: THE ZERO (शून्य) | Max 2 entries per author | 0% AI & Plagiarism.`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(cat.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  // Theme Palette
  const bg = isDarkMode ? '#070B19' : '#FAF9F5';
  const textMain = isDarkMode ? '#FAF9F5' : '#111827';
  const textSub = isDarkMode ? '#A1A1AA' : '#3F3F46';
  const hairline = isDarkMode ? 'rgba(212, 175, 55, 0.22)' : 'rgba(139, 30, 36, 0.16)';
  const glassSurface = isDarkMode
    ? 'linear-gradient(145deg, rgba(16, 23, 46, 0.78) 0%, rgba(10, 14, 30, 0.88) 100%)'
    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.86) 0%, rgba(248, 243, 234, 0.82) 100%)';

  return (
    <div
      className="san-gp-shell"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bg,
        color: textMain,
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        position: 'relative',
        overflowX: 'clip',
        transition: 'background-color 0.4s ease, color 0.4s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        .san-gp-shell * { box-sizing: border-box; }

        @keyframes royalGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glossySheenSweep {
          0% { transform: translateX(-140%) skewX(-24deg); }
          100% { transform: translateX(260%) skewX(-24deg); }
        }

        @keyframes ambientOrbFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(24px, -18px, 0) scale(1.06); }
        }

        @keyframes drawerReveal {
          from { opacity: 0; filter: blur(8px); transform: translateY(-8px); }
          to { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }

        .royal-gradient-title {
          font-family: 'Playfair Display', serif;
          background: linear-gradient(135deg, ${isDarkMode ? '#FAF9F5 0%, #F6E05E 32%, #D4AF37 62%, #E11D48 100%' : '#1E3A5F 0%, #8B1E24 42%, #D4AF37 78%, #1E3A5F 100%'});
          background-size: 240% 240%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: royalGradientFlow 6s ease infinite;
        }

        .glossy-liquid-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 26px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          font-family: inherit;
          border: 1px solid rgba(212, 175, 55, 0.55);
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.8)'};
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          color: ${isDarkMode ? '#FAF9F5' : '#1E3A5F'};
          box-shadow: 0 10px 28px rgba(139, 30, 36, 0.14), inset 0 1.5px 2px rgba(255, 255, 255, 0.65);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glossy-liquid-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
          transform: translateX(-140%) skewX(-24deg);
          pointer-events: none;
        }

        .glossy-liquid-btn:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, #8B1E24 0%, #5A1216 100%);
          color: #FFFFFF;
          border-color: #F6E05E;
          box-shadow: 0 16px 36px rgba(139, 30, 36, 0.38), inset 0 1.5px 2px rgba(255, 255, 255, 0.4);
        }

        .glossy-liquid-btn:hover::after {
          animation: glossySheenSweep 0.85s ease-in-out;
        }

        .glossy-crimson-cta {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 28px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          border: 1px solid #F6E05E;
          background: linear-gradient(135deg, #8B1E24 0%, #B91C1C 45%, #D4AF37 100%);
          background-size: 200% 200%;
          animation: royalGradientFlow 5s ease infinite;
          color: #FFFFFF;
          box-shadow: 0 14px 34px rgba(139, 30, 36, 0.42), inset 0 1.5px 3px rgba(255, 255, 255, 0.55);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glossy-crimson-cta::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
          transform: translateX(-140%) skewX(-24deg);
        }

        .glossy-crimson-cta:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 44px rgba(212, 175, 55, 0.38);
        }

        .glossy-crimson-cta:hover::after {
          animation: glossySheenSweep 0.85s ease-in-out;
        }

        .gp-nav-bar {
          position: sticky;
          top: 0;
          z-index: 60;
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          background: ${isDarkMode ? 'rgba(7, 11, 25, 0.84)' : 'rgba(250, 249, 245, 0.88)'};
          border-bottom: 1.5px solid transparent;
          border-image: linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1;
        }

        .gp-wrap {
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 32px;
        }

        .gp-hairline-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(139, 30, 36, 0.45) 25%, rgba(212, 175, 55, 0.7) 50%, rgba(30, 58, 95, 0.45) 75%, transparent 100%);
        }

        /* Editorial Matrix Table */
        .gp-matrix-shell {
          border-radius: 28px;
          border: 1px solid rgba(212, 175, 55, 0.38);
          background: ${glassSurface};
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          box-shadow: ${isDarkMode ? '0 28px 70px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.12)' : '0 22px 55px rgba(30, 58, 95, 0.1), inset 0 1px 2px rgba(255,255,255,0.95)'};
          overflow: hidden;
        }

        .gp-table-head {
          display: grid;
          grid-template-columns: 64px 2.1fr 1.3fr 1.1fr 1.1fr 44px;
          align-items: center;
          padding: 16px 26px;
          background: linear-gradient(90deg, rgba(139, 30, 36, 0.92) 0%, rgba(90, 18, 22, 0.95) 55%, rgba(30, 58, 95, 0.92) 100%);
          color: #FAF9F5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(212, 175, 55, 0.5);
        }

        .gp-table-row {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 64px 2.1fr 1.3fr 1.1fr 1.1fr 44px;
          align-items: center;
          width: 100%;
          padding: 18px 26px;
          border: none;
          border-bottom: 1px solid ${hairline};
          background: transparent;
          color: ${textMain};
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gp-table-row::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.12), rgba(139, 30, 36, 0.14), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .gp-table-row:hover::before,
        .gp-table-row.active::before {
          opacity: 1;
        }

        .gp-table-row.active {
          background: ${isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(139, 30, 36, 0.05)'};
        }

        .gp-drawer {
          animation: drawerReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          padding: 28px 32px 32px 32px;
          background: ${isDarkMode ? 'rgba(8, 12, 28, 0.85)' : 'rgba(255, 253, 249, 0.92)'};
          border-bottom: 1.5px solid rgba(212, 175, 55, 0.45);
        }

        .gp-drawer-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 32px;
          align-items: start;
        }

        /* Interactive A4 Specimen Studio */
        .gp-studio-split {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 44px;
          align-items: center;
        }

        .gp-a4-sheet {
          position: relative;
          border-radius: 20px;
          padding: 34px 32px 26px 32px;
          background: ${isDarkMode
            ? 'linear-gradient(155deg, rgba(22, 30, 58, 0.92) 0%, rgba(11, 16, 34, 0.96) 100%)'
            : 'linear-gradient(155deg, #FFFFFF 0%, #F7F1E5 100%)'};
          border: 1px solid rgba(212, 175, 55, 0.55);
          box-shadow: ${isDarkMode
            ? '0 26px 60px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255,255,255,0.16)'
            : '0 24px 55px rgba(139, 30, 36, 0.14), inset 0 2px 4px rgba(255,255,255,1)'};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gp-filter-chip {
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: 1px solid ${hairline};
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)'};
          color: ${textSub};
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .gp-filter-chip:hover {
          border-color: #D4AF37;
          color: ${textMain};
        }

        .gp-filter-chip.active {
          background: linear-gradient(135deg, #8B1E24 0%, #5A1216 100%);
          border-color: #F6E05E;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(139, 30, 36, 0.3);
        }

        .gp-essentials-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        @media (max-width: 960px) {
          .gp-table-head {
            display: none;
          }
          .gp-table-row {
            grid-template-columns: 44px 1fr auto;
            gap: 10px;
            padding: 16px 18px;
          }
          .gp-col-hide-sm {
            display: none !important;
          }
          .gp-drawer {
            padding: 20px 18px 24px 18px;
          }
          .gp-drawer-grid,
          .gp-studio-split {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .gp-essentials-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .gp-wrap {
            padding: 0 18px;
          }
          .gp-essentials-strip {
            grid-template-columns: 1fr;
          }
          .gp-hide-xs {
            display: none !important;
          }
        }
      `}</style>

      {/* 3D Floating Bubbles Background Engine */}
      <Floating3DBubbles isDarkMode={isDarkMode} />

      {/* Ambient Royal Color Auroras */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '12%',
            width: '540px',
            height: '540px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(139,30,36,0.26) 0%, transparent 68%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 68%)',
            filter: 'blur(75px)',
            animation: 'ambientOrbFloat 11s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-140px',
            right: '8%',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(30,58,95,0.34) 0%, transparent 68%)'
              : 'radial-gradient(circle, rgba(139,30,36,0.12) 0%, transparent 68%)',
            filter: 'blur(80px)',
            animation: 'ambientOrbFloat 14s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Sticky Glossy Glass Header */}
      <header className="gp-nav-bar">
        <div
          className="gp-wrap"
          style={{
            paddingTop: '14px',
            paddingBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button type="button" onClick={onBack} className="glossy-liquid-btn" style={{ padding: '9px 18px', fontSize: '11.5px' }}>
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div className="gp-hide-xs" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: "'Rozha One', 'Playfair Display', serif",
                fontSize: '21px',
                color: '#D4AF37',
                letterSpacing: '0.5px',
              }}
            >
              संRACHNA
            </span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: textSub }}>
              Editorial Handbook
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="glossy-liquid-btn"
              style={{ width: '40px', height: '40px', padding: 0 }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} color="#F6E05E" /> : <Moon size={16} color="#1E3A5F" />}
            </button>

            <button
              type="button"
              onClick={onOpenSubmission}
              className="glossy-crimson-cta"
              style={{ padding: '10px 20px', fontSize: '11.5px' }}
            >
              <span>Submit Entry</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="gp-wrap" style={{ position: 'relative', zIndex: 5, paddingTop: '56px', paddingBottom: '100px' }}>
        {/* =============================================================== */}
        {/* HERO MASTHEAD (OPEN, AIRY, ZERO BOXES, NO "SUBMISSIONS OPEN")   */}
        {/* =============================================================== */}
        <section style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 64px auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '2.6px',
              textTransform: 'uppercase',
              color: '#D4AF37',
              marginBottom: '16px',
            }}
          >
            <span style={{ width: '32px', height: '1.5px', background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
            <span>Government Engineering College, Godda • Edition I</span>
            <span style={{ width: '32px', height: '1.5px', background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          </div>

          <h1
            className="royal-gradient-title"
            style={{
              margin: '0 0 18px 0',
              fontSize: 'clamp(38px, 5.6vw, 68px)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.5px',
            }}
          >
            Author &amp; Creator Guidelines
          </h1>

          <p
            style={{
              margin: '0 auto 28px auto',
              maxWidth: '720px',
              fontSize: 'clamp(15.5px, 1.8vw, 19px)',
              lineHeight: 1.75,
              color: textSub,
            }}
          >
            Theme — <strong style={{ color: '#D4AF37' }}>THE ZERO (शून्य)</strong>{' '}
            <span style={{ opacity: 0.65 }}>(related to, but not restricted to)</span>. Tap any category in the editorial matrix below to inspect word limits, test your draft live, and verify formatting standards.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <a href="/Guidelines.pdf" download="Sanrachna_Guidelines_2026.pdf" className="glossy-liquid-btn">
              <Download size={15} />
              <span>Official Guidelines PDF</span>
            </a>
            <a href="/Template for Submission.pdf" download="Sanrachna_Template_2026.pdf" className="glossy-liquid-btn">
              <Download size={15} />
              <span>Submission Template PDF</span>
            </a>
          </div>
        </section>

        <div className="gp-hairline-divider" />

        {/* =============================================================== */}
        {/* SECTION 01: INTERACTIVE 12-CATEGORY EDITORIAL MATRIX TABLE      */}
        {/* =============================================================== */}
        <section style={{ paddingTop: '64px', paddingBottom: '72px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                01 • Interactive Submission Matrix
              </div>
              <h2
                style={{
                  margin: '6px 0 0 0',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(28px, 3.6vw, 42px)',
                  fontWeight: 800,
                  color: textMain,
                }}
              >
                12 Categories &amp; Word Limits
              </h2>
            </div>

            {/* Filter Chips + Live Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              {(
                [
                  { id: 'all', label: 'All 12' },
                  { id: 'writing', label: 'Writing & Poetry' },
                  { id: 'media', label: 'Campus & Media' },
                  { id: 'visual', label: 'Art & Photo' },
                ] as { id: CategoryGroup; label: string }[]
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveGroup(chip.id)}
                  className={`gp-filter-chip ${activeGroup === chip.id ? 'active' : ''}`}
                >
                  {chip.label}
                </button>
              ))}

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: `1px solid ${hairline}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                }}
              >
                <Search size={14} color="#D4AF37" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter category..."
                  style={{
                    width: '135px',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: textMain,
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>

          {/* GLOSSY GLASS EDITORIAL TABLE */}
          <div className="gp-matrix-shell">
            {/* Table Header */}
            <div className="gp-table-head">
              <div>#</div>
              <div>Category</div>
              <div>Section / Track</div>
              <div>Official Limit</div>
              <div>Accepted File</div>
              <div style={{ textAlign: 'right' }}>View</div>
            </div>

            {/* Table Rows + Expandable Glossy Drawers */}
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isExpanded = expandedRowId === cat.id;
              const checks = checkedMap[cat.id] ?? cat.checklist.map(() => false);
              const doneCount = checks.filter(Boolean).length;
              const allDone = doneCount === cat.checklist.length;
              const draft = draftMap[cat.id] ?? '';

              const liveCount =
                cat.unit === 'lines'
                  ? draft.split(/\r?\n/).filter((l) => l.trim().length > 0).length
                  : draft.trim()
                  ? draft.trim().split(/\s+/).length
                  : 0;

              const gaugePercent =
                cat.unit === 'nos' ? 100 : Math.min(100, Math.round((liveCount / cat.max) * 100));

              return (
                <React.Fragment key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedRowId(isExpanded ? '' : cat.id)}
                    className={`gp-table-row ${isExpanded ? 'active' : ''}`}
                  >
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '16px',
                        fontWeight: 800,
                        color: isExpanded ? '#D4AF37' : '#8B1E24',
                      }}
                    >
                      {cat.number}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '11px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isExpanded
                            ? 'linear-gradient(135deg, #8B1E24, #D4AF37)'
                            : isDarkMode
                            ? 'rgba(212, 175, 55, 0.12)'
                            : 'rgba(139, 30, 36, 0.08)',
                          color: isExpanded ? '#FFFFFF' : '#D4AF37',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: textMain }}>
                          {cat.name}
                        </strong>
                        <span style={{ fontSize: '12px', color: textSub }}>{cat.hindiName}</span>
                      </span>
                    </span>

                    <span className="gp-col-hide-sm" style={{ fontSize: '13px', color: textSub, fontWeight: 500 }}>
                      {cat.domain}
                    </span>

                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : 'rgba(139, 30, 36, 0.09)',
                          color: isDarkMode ? '#F6E05E' : '#8B1E24',
                          border: '1px solid rgba(212, 175, 55, 0.35)',
                        }}
                      >
                        {cat.limitLabel}
                      </span>
                    </span>

                    <span className="gp-col-hide-sm" style={{ fontSize: '13px', fontWeight: 600, color: textMain }}>
                      {cat.fileType}
                    </span>

                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ChevronDown
                        size={18}
                        color="#D4AF37"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </span>
                  </button>

                  {/* EXPANDABLE GLOSSY DETAIL DRAWER */}
                  {isExpanded && (
                    <div className="gp-drawer">
                      <div className="gp-drawer-grid">
                        {/* Left Column: Editorial Scope + Live Word/Line Counter */}
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.7, color: textSub, maxWidth: '620px' }}>
                              {cat.summary}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopyRules(cat)}
                              className="glossy-liquid-btn"
                              style={{ padding: '7px 14px', fontSize: '11px' }}
                            >
                              {copiedId === cat.id ? (
                                <>
                                  <Check size={13} color="#22C55E" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copy Specs</span>
                                </>
                              )}
                            </button>
                          </div>

                          {cat.specialNote && (
                            <div
                              style={{
                                marginTop: '14px',
                                padding: '11px 15px',
                                borderLeft: '3px solid #D4AF37',
                                background: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.14)',
                                borderRadius: '0 12px 12px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '13px',
                                color: textMain,
                              }}
                            >
                              <AlertTriangle size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                              <span>{cat.specialNote}</span>
                            </div>
                          )}

                          <div style={{ marginTop: '18px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '10px' }}>
                              Accepted Topics &amp; Scope
                            </div>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                              {cat.topics.map((topic, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: textMain }}>
                                  <span style={{ color: '#D4AF37', fontWeight: 800 }}>✦</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Live Draft Word / Line Counter */}
                          {cat.unit !== 'nos' ? (
                            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: `1px solid ${hairline}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                                <span style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#D4AF37' }}>
                                  Live {cat.unit === 'lines' ? 'Line' : 'Word'} Counter ({cat.limitLabel})
                                </span>
                                <span style={{ fontWeight: 700, color: liveCount > cat.max ? '#EF4444' : liveCount >= cat.min ? '#22C55E' : textSub }}>
                                  {liveCount} / {cat.max} {cat.unit}
                                </span>
                              </div>

                              <textarea
                                rows={3}
                                value={draft}
                                onChange={(e) => setDraftMap((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                                placeholder={
                                  cat.unit === 'lines'
                                    ? 'Paste your poem verses here to verify 25–50 lines...'
                                    : `Paste your ${cat.name.toLowerCase()} draft here to verify ${cat.limitLabel}...`
                                }
                                style={{
                                  width: '100%',
                                  padding: '11px 14px',
                                  borderRadius: '14px',
                                  border: `1px solid ${hairline}`,
                                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                                  color: textMain,
                                  fontSize: '13px',
                                  lineHeight: 1.55,
                                  outline: 'none',
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                }}
                              />

                              <div style={{ marginTop: '8px', height: '5px', width: '100%', borderRadius: '999px', background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${gaugePercent}%`,
                                    borderRadius: '999px',
                                    background:
                                      liveCount > cat.max
                                        ? '#EF4444'
                                        : liveCount >= cat.min
                                        ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                                        : 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${hairline}`, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: textSub }}>
                              <Image size={18} color="#D4AF37" />
                              <span>
                                Upload <strong style={{ color: textMain }}>1–2 uncompressed 300 DPI files</strong> (.jpg, .png, .gif) directly—never embedded inside a Word document.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Interactive Readiness Pills + Portal Launch */}
                        <div
                          style={{
                            padding: '22px',
                            borderRadius: '20px',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            background: isDarkMode
                              ? 'linear-gradient(155deg, rgba(139,30,36,0.16) 0%, rgba(15,23,42,0.75) 100%)'
                              : 'linear-gradient(155deg, rgba(255,255,255,0.95) 0%, rgba(245,239,230,0.85) 100%)',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37' }}>
                              Readiness Checklist
                            </span>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: allDone ? '#22C55E' : textSub }}>
                              {doneCount}/{cat.checklist.length} Verified
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                            {cat.checklist.map((point, idx) => {
                              const checked = checks[idx];
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleCheck(cat.id, cat.checklist.length, idx)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '9px 11px',
                                    borderRadius: '12px',
                                    border: checked ? '1px solid rgba(34, 197, 94, 0.5)' : `1px solid ${hairline}`,
                                    background: checked ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                    color: textMain,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      marginTop: '1px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: checked ? '1px solid #22C55E' : `1.5px solid ${textSub}`,
                                      background: checked ? '#22C55E' : 'transparent',
                                      color: '#070B19',
                                    }}
                                  >
                                    {checked && <Check size={11} strokeWidth={3} />}
                                  </span>
                                  <span style={{ fontSize: '12.5px', lineHeight: 1.45, opacity: checked ? 0.8 : 1 }}>
                                    {point}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={onOpenSubmission}
                            className="glossy-crimson-cta"
                            style={{ width: '100%', padding: '13px 20px' }}
                          >
                            {allDone && <CheckCircle2 size={16} />}
                            <span>Submit {cat.name} in Portal</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {filteredCategories.length === 0 && (
              <div style={{ padding: '36px 20px', textAlign: 'center', fontSize: '14px', color: textSub }}>
                No matching category found. Try clearing your filter.
              </div>
            )}
          </div>
        </section>

        <div className="gp-hairline-divider" />

        {/* =============================================================== */}
        {/* SECTION 02: INTERACTIVE FORMATTING STUDIO & LIVE A4 SPECIMEN    */}
        {/* =============================================================== */}
        <section style={{ paddingTop: '72px', paddingBottom: '72px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px', marginBottom: '36px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                02 • Typography &amp; Layout Standards
              </div>
              <h2
                style={{
                  margin: '6px 0 0 0',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(28px, 3.6vw, 42px)',
                  fontWeight: 800,
                  color: textMain,
                }}
              >
                Formatting Rules &amp; Live A4 Preview
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'english', label: 'English Manuscript' },
                  { id: 'hindi', label: 'हिन्दी Manuscript' },
                  { id: 'visual', label: 'Art & Photography' },
                ] as { id: FormatTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormatTab(tab.id)}
                  className={`gp-filter-chip ${formatTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gp-studio-split">
            {/* Left: Clean Flowing Editorial Rows (No Boxes) */}
            <div style={{ textAlign: 'left' }}>
              {formatTab === 'english' && (
                <div>
                  {[
                    { label: 'Approved Font', value: 'Bookman Old Style' },
                    { label: 'Typography Scale', value: 'Heading: 14pt Bold • Sub-heading: 12pt Bold • Body: 11pt' },
                    { label: 'Page Dimensions', value: 'A4 (8.27 × 11.69 inches) • 1" Margin on each side' },
                    { label: 'Spacing & Numbering', value: '1.5 Line Spacing • 6pt after paragraph • Page No. Bottom Centre' },
                    { label: 'File Format', value: 'Editable .doc or .docx only (.pdf only if necessary)' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '18px 0',
                        borderTop: `1px solid ${hairline}`,
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: textMain }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {formatTab === 'hindi' && (
                <div>
                  {[
                    { label: 'हिन्दी Font', value: 'KrutiDev or Mangal' },
                    { label: 'Typography Scale', value: 'Heading: 16pt • Sub-heading: 14pt • Body Text: 14pt' },
                    { label: 'Page Dimensions', value: 'A4 (8.27 × 11.69 inches) • 1" Margin on each side' },
                    { label: 'Spacing & Numbering', value: '1.5 Line Spacing • 6pt after paragraph • Page No. Bottom Centre' },
                    { label: 'File Format', value: 'Editable .doc or .docx only (.pdf only if necessary)' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '18px 0',
                        borderTop: `1px solid ${hairline}`,
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: textMain }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {formatTab === 'visual' && (
                <div>
                  {[
                    { label: 'Accepted Formats', value: 'JPEG (.jpg), .png, and .gif' },
                    { label: 'Resolution Standard', value: '300 DPI minimum wherever possible' },
                    { label: 'Packaging Rule', value: 'Do NOT submit images pasted inside a Word document' },
                    { label: 'Required Caption', value: 'Short description & caption mandatory for Artworks & Photos' },
                    { label: 'Author Portrait', value: 'Separate 300 DPI author/artist photograph required' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '18px 0',
                        borderTop: `1px solid ${hairline}`,
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: textMain }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Interactive Live A4 Specimen Sheet Preview */}
            <div className="gp-a4-sheet" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37' }}>
                  <Eye size={13} />
                  <span>Live A4 Specimen</span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: textSub }}>1&quot; Margins • 1.5 Spacing</span>
              </div>

              <div
                style={{
                  border: '1px dashed rgba(212, 175, 55, 0.45)',
                  borderRadius: '12px',
                  padding: '22px 20px',
                }}
              >
                {formatTab === 'english' && (
                  <div style={{ fontFamily: "'Bookman Old Style', Georgia, serif" }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: textMain }}>
                      The Architecture of Zero (14pt Bold)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#D4AF37', marginTop: '6px' }}>
                      Sub-heading in 12pt Bold
                    </div>
                    <p style={{ fontSize: '12.5px', lineHeight: 1.75, color: textSub, marginTop: '10px', marginBottom: '10px' }}>
                      Body text formatted in Bookman Old Style (11pt) with 1.5 line spacing and 6pt spacing after each paragraph.
                    </p>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#D4AF37', marginTop: '18px', fontWeight: 700 }}>
                      — 1 — (Bottom Centre)
                    </div>
                  </div>
                )}

                {formatTab === 'hindi' && (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: textMain }}>
                      शून्य से सृजन की ओर (16pt शीर्षक)
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#D4AF37', marginTop: '6px' }}>
                      उप-शीर्षक (14pt KrutiDev / Mangal)
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.8, color: textSub, marginTop: '10px', marginBottom: '10px' }}>
                      मुख्य लेख 14pt फ़ॉन्ट में, 1.5 लाइन स्पेसिंग और प्रत्येक पैराग्राफ के बाद 6pt स्पेसिंग के साथ A4 पृष्ठ पर तैयार करें।
                    </p>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#D4AF37', marginTop: '18px', fontWeight: 700 }}>
                      — १ — (Bottom Centre)
                    </div>
                  </div>
                )}

                {formatTab === 'visual' && (
                  <div style={{ textAlign: 'center', padding: '14px 8px' }}>
                    <div
                      style={{
                        height: '110px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(139,30,36,0.28), rgba(212,175,55,0.28), rgba(30,58,95,0.32))',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(212, 175, 55, 0.45)',
                      }}
                    >
                      <Image size={28} color="#D4AF37" />
                      <span style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', color: textMain }}>
                        300 DPI Standalone Image (.JPG / .PNG)
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: textSub, marginTop: '12px', marginBottom: 0 }}>
                      Attached separately with title, caption &amp; short description (never pasted inside Word).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 Pre-Submission Essentials (Clean Typographic Strip — No Boxy Cards) */}
          <div style={{ marginTop: '56px', paddingTop: '40px', borderTop: `1px solid ${hairline}`, textAlign: 'left' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '24px' }}>
              Keep Ready Prior to Submission
            </div>
            <div className="gp-essentials-strip">
              {PRE_SUBMISSION_ESSENTIALS.map((item) => (
                <div key={item.num} style={{ borderLeft: '2px solid rgba(212, 175, 55, 0.5)', paddingLeft: '16px' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 800, color: '#D4AF37', lineHeight: 1 }}>
                    {item.num} <span style={{ fontSize: '13px', opacity: 0.75 }}>{item.code}</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 700, color: textMain }}>
                    {item.title}
                  </div>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', lineHeight: 1.6, color: textSub }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gp-hairline-divider" />

        {/* =============================================================== */}
        {/* SECTION 03: ETHICS, CONDUCT & DISCLOSURES (OPEN LEDGER)         */}
        {/* =============================================================== */}
        <section style={{ paddingTop: '72px', paddingBottom: '72px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                03 • Editorial Integrity &amp; Copyright
              </div>
              <h2
                style={{
                  margin: '6px 0 0 0',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(28px, 3.6vw, 42px)',
                  fontWeight: 800,
                  color: textMain,
                }}
              >
                Mandatory Rules &amp; Disclosures
              </h2>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '12.5px', fontWeight: 700 }}>
              <ShieldAlert size={16} />
              <span>Strict Zero-AI &amp; Anti-Plagiarism Policy</span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${hairline}` }}>
            {EDITORIAL_DISCLOSURES.map((rule, idx) => {
              const isOpen = openRuleIdx === idx;
              return (
                <div key={rule.num} style={{ borderBottom: `1px solid ${hairline}` }}>
                  <button
                    type="button"
                    onClick={() => setOpenRuleIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '22px 6px',
                      background: 'transparent',
                      border: 'none',
                      color: textMain,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 800, color: '#D4AF37' }}>
                        {rule.num}
                      </span>
                      <span style={{ fontSize: 'clamp(16px, 2vw, 19px)', fontWeight: 700 }}>{rule.title}</span>
                    </div>
                    <ChevronDown
                      size={19}
                      color="#D4AF37"
                      style={{
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 12px 24px 44px',
                        fontSize: '14.5px',
                        lineHeight: 1.75,
                        color: textSub,
                        textAlign: 'left',
                        maxWidth: '920px',
                      }}
                    >
                      {rule.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =============================================================== */}
        {/* BOTTOM ROYAL EDITORIAL BANNER (PORTAL + EMAIL ONLY)             */}
        {/* =============================================================== */}
        <section
          style={{
            marginTop: '20px',
            borderRadius: '30px',
            padding: 'clamp(34px, 5vw, 56px) clamp(24px, 4vw, 48px)',
            background: 'linear-gradient(135deg, #4E1014 0%, #8B1E24 46%, #1E3A5F 100%)',
            border: '1px solid rgba(212, 175, 55, 0.65)',
            boxShadow: '0 28px 70px rgba(139, 30, 36, 0.35), inset 0 1.5px 2px rgba(255,255,255,0.28)',
            color: '#FAF9F5',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#F6E05E' }}>
            <Sparkles size={14} />
            <span>Team संRACHNA • GEC Godda</span>
          </div>

          <h2
            style={{
              margin: '14px 0 10px 0',
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(26px, 3.8vw, 40px)',
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            &ldquo;Inform, Engage, Celebrate Talent, and Preserve Memories&rdquo;
          </h2>

          <p style={{ margin: '0 auto 28px auto', maxWidth: '640px', fontSize: '15px', lineHeight: 1.7, color: 'rgba(250,249,245,0.88)' }}>
            E-Certificate awarded to the Best Content Submitter of the edition. Ready with your formatted entry? Submit directly through our official portal.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button type="button" onClick={onOpenSubmission} className="glossy-crimson-cta">
              <span>Open Submission Portal</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="mailto:sanrachna.gecgodda@gmail.com"
              className="glossy-liquid-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.38)',
                color: '#FFFFFF',
                textTransform: 'none',
                letterSpacing: '0.3px',
              }}
            >
              <Mail size={15} />
              <span>sanrachna.gecgodda@gmail.com</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
