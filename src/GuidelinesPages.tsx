import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
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
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

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
  track: 'Technical / Non-Technical' | 'Non-Technical' | 'Technical & Campus' | 'Visual Arts';
  limitLabel: string;
  unit: 'words' | 'lines' | 'nos';
  min: number;
  max: number;
  icon: LucideIcon;
  summary: string;
  topics: string[];
  specialNote?: string;
  checklist: string[];
}

// Agar aage nayi last date announce karni ho, bas yahan string update kar dena:
const SUBMISSION_STATUS_LABEL = 'Submissions Open • Edition I (2026)';
const GOOGLE_FORM_URL = 'https://forms.gle/snCsoHcoW6riwpwv9';

const CATEGORIES: CategorySpec[] = [
  {
    id: 'articles',
    number: '01',
    name: 'Articles',
    hindiName: 'लेख',
    group: 'writing',
    track: 'Technical / Non-Technical',
    limitLabel: '700 – 900 words',
    unit: 'words',
    min: 700,
    max: 900,
    icon: FileText,
    summary:
      'In-depth technical or non-technical write-ups covering scientific breakthroughs, engineering trends, research summaries, and national or international developments.',
    topics: [
      'Scientific breakthroughs & new discoveries in Science and Technology',
      'Nobel Prize winners’ topics & great scientists’ contributions',
      'Research summaries, technical papers, trending research & patents',
      'Emerging trends in engineering fields',
      'National or international technical and non-technical issues',
    ],
    checklist: [
      'Word count stays strictly between 700 and 900 words',
      'Formatted in A4 (Bookman Old 11pt / Mangal or KrutiDev 14pt)',
      '100% original human-written work (0% AI & plagiarism)',
      'Author brief bio, 300 DPI photo, and separate supporting images ready',
    ],
  },
  {
    id: 'journalism',
    number: '02',
    name: 'Journalism',
    hindiName: 'पत्रकारिता',
    group: 'media',
    track: 'Non-Technical',
    limitLabel: '250 – 500 words',
    unit: 'words',
    min: 250,
    max: 500,
    icon: Mic,
    summary:
      'Crisp, factual reporting and structured interviews featuring distinguished minds from science, technology, sports, cinema, and current affairs.',
    topics: [
      'Interviews of great scientific personalities & technocrats',
      'Conversations with accomplished sportspersons & filmmakers',
      'Well-researched current affairs features',
    ],
    specialNote: 'Verify every quote, date, and attribution accurately before submission.',
    checklist: [
      'Word count is between 250 and 500 words',
      'All quotes, dates, and interviewee credentials are verified',
      'Editable .doc/.docx file prepared with clear descriptive title',
      'Brief author biography & 300 DPI author photo attached separately',
    ],
  },
  {
    id: 'mass-communication',
    number: '03',
    name: 'Mass Communication',
    hindiName: 'जनसंचार एवं समीक्षा',
    group: 'media',
    track: 'Non-Technical',
    limitLabel: '400 – 600 words',
    unit: 'words',
    min: 400,
    max: 600,
    icon: Radio,
    summary:
      'Critical, engaging reviews and analytical perspectives on internationally acclaimed novels, cinema, documentaries, and cultural works.',
    topics: [
      'Reviews of internationally acclaimed novels & literary classics',
      'Critical reviews of acclaimed movies & meaningful cinema',
      'Analytical takes on impactful storytelling and media',
    ],
    checklist: [
      'Word count fits within 400 to 600 words',
      'Critique is original, balanced, and free from spoilers or hate',
      'Proper A4 typography with 1.5 line spacing & 6pt paragraph spacing',
      'Author bio & 300 DPI photograph ready for upload',
    ],
  },
  {
    id: 'biography',
    number: '04',
    name: 'Biography',
    hindiName: 'जीवनी एवं डायरी',
    group: 'writing',
    track: 'Non-Technical',
    limitLabel: '250 – 500 words',
    unit: 'words',
    min: 250,
    max: 500,
    icon: UserCheck,
    summary:
      'Inspiring life sketches of great scientists and iconic personalities, alongside reflective, authentic diary entries.',
    topics: [
      'Biographies of great scientists and innovators',
      'Profiles of inspiring national or global personalities',
      'Reflective and thoughtful diary entries',
    ],
    checklist: [
      'Word count is between 250 and 500 words',
      'Biographical facts and timelines are double-checked',
      'No religious, mythological, or self-promotional content included',
      'Saved as editable .doc/.docx with author bio & 300 DPI photo',
    ],
  },
  {
    id: 'poem',
    number: '05',
    name: 'Poem',
    hindiName: 'कविता',
    group: 'writing',
    track: 'Technical / Non-Technical',
    limitLabel: '25 – 50 lines',
    unit: 'lines',
    min: 25,
    max: 50,
    icon: Feather,
    summary:
      'Original poetry—both Technical/Scientific and Non-Technical/Non-Scientific—expressing rhythm, imagination, and depth in Hindi or English.',
    topics: [
      'Non-technical & literary poems in Hindi or English',
      'Scientific, technological, or "The Zero (शून्य)" themed verses',
      'Structured rhymes, free verse, or reflective stanzas',
    ],
    specialNote: 'Keep exact stanza breaks clean in your Word file; avoid sending screenshots or Canva posters of text.',
    checklist: [
      'Total poem length is between 25 and 50 lines',
      'Hindi typed in KrutiDev/Mangal (14pt) or English in Bookman Old (11pt)',
      '100% self-composed (no AI lines or forwarded verses)',
      'Clear title, brief author bio, and 300 DPI author photo ready',
    ],
  },
  {
    id: 'essay-story',
    number: '06',
    name: 'Essay / Short Story',
    hindiName: 'निबंध एवं लघुकथा',
    group: 'writing',
    track: 'Technical / Non-Technical',
    limitLabel: '300 – 600 words',
    unit: 'words',
    min: 300,
    max: 600,
    icon: BookOpen,
    summary:
      'Thoughtful essays and original short stories spanning both scientific imagination and everyday human narratives.',
    topics: [
      'Technical & scientific essays or speculative fiction',
      'Non-technical personal essays & creative short stories',
      'Narratives inspired by campus life, ethics, or "The Zero (शून्य)"',
    ],
    checklist: [
      'Word count is strictly within 300 – 600 words',
      'A4 formatting: 1" margins, 1.5 line spacing, 6pt after paragraphs',
      'Free from religious, mythological, or sensitive targeting content',
      'Editable .doc/.docx ready along with author bio & 300 DPI photo',
    ],
  },
  {
    id: 'campus-news',
    number: '07',
    name: 'Campus News',
    hindiName: 'परिसर समाचार',
    group: 'media',
    track: 'Technical & Campus',
    limitLabel: '500 – 700 words',
    unit: 'words',
    min: 500,
    max: 700,
    icon: Newspaper,
    summary:
      'Official chronicles of GEC Godda milestones—seminars, symposiums, exhibitions, placements, awards, and student club events.',
    topics: [
      'Seminars, exhibitions, technical symposiums & workshops',
      'Placement highlights & institutional milestones',
      'Awards & achievements (College, District, State, National, International)',
      'Campus interviews (strictly NO political or personal interviews)',
      'Official Club Event Reports',
    ],
    specialNote: 'Mandatory Rule: Any Club Event Report must be submitted by the Club Head ONLY. No political or personal interviews allowed.',
    checklist: [
      'Word count is between 500 and 700 words',
      'If a Club Event Report, submitted officially by the Club Head only',
      'Zero political or personal interviews included',
      'Event photos (300 DPI) attached separately, NOT pasted inside Word doc',
    ],
  },
  {
    id: 'career-entrepreneurship',
    number: '08',
    name: 'Career & Entrepreneurship',
    hindiName: 'करियर एवं उद्यमिता',
    group: 'media',
    track: 'Technical & Campus',
    limitLabel: '150 – 250 words',
    unit: 'words',
    min: 150,
    max: 250,
    icon: Briefcase,
    summary:
      'Sharp, concise spotlights on emerging startups, campus innovation ecosystems, and impactful entrepreneurship stories.',
    topics: [
      'Startup spotlights in national and international arenas',
      'Innovation & entrepreneurship initiatives at nearby institutions',
      'Concise career pathways, industry readiness & founder takeaways',
    ],
    specialNote: 'Self-promotion or commercial brand promotion is strictly forbidden—keep pieces informative and objective.',
    checklist: [
      'Word count is crisp and within 150 – 250 words',
      'Zero self-promotion or commercial advertising tone',
      'Editable .doc/.docx formatted to official A4 specs',
      'Author brief bio & 300 DPI photograph ready',
    ],
  },
  {
    id: 'artworks',
    number: '09',
    name: 'Drawing / Painting / Artworks',
    hindiName: 'चित्रकला एवं कलाकृति',
    group: 'visual',
    track: 'Visual Arts',
    limitLabel: '1 – 2 nos',
    unit: 'nos',
    min: 1,
    max: 2,
    icon: Palette,
    summary:
      'Hand-drawn sketches, traditional paintings, digital illustrations, visual riddles, and picture stories across scientific and artistic themes.',
    topics: [
      'Sketches in scientific as well as non-scientific arenas',
      'Original paintings & traditional artwork',
      'Original digital arts (strictly non-AI)',
      'Visual riddles & creative picture stories',
    ],
    specialNote: 'Never submit artwork pasted inside a Word document. Upload original 300 DPI .jpg, .png, or .gif files with a short description.',
    checklist: [
      'Submitting 1 to 2 original pieces (max 2 entries per author total)',
      'Saved as high-resolution .jpg, .png, or .gif at 300 DPI',
      'NOT embedded inside a Word document',
      'Short artwork description, artist bio, and 300 DPI artist photo ready',
    ],
  },
  {
    id: 'photography',
    number: '10',
    name: 'Photography',
    hindiName: 'छायाचित्रण',
    group: 'visual',
    track: 'Visual Arts',
    limitLabel: '1 – 2 nos',
    unit: 'nos',
    min: 1,
    max: 2,
    icon: Camera,
    summary:
      'Compelling scientific and non-scientific photographs paired with an appropriate, thoughtful caption and short context.',
    topics: [
      'Scientific, engineering, or macro photography',
      'Campus life, architecture, nature & candid storytelling',
      'Visual interpretations of "The Zero (शून्य)"',
    ],
    specialNote: 'Every photograph must include an appropriate caption and short description. Upload raw/high-res 300 DPI files separately—not inside Word.',
    checklist: [
      'Submitting 1 to 2 original photographs clicked by yourself',
      'Original .jpg/.png/.gif file at 300 DPI (no WhatsApp compression)',
      'Appropriate caption & short description written clearly',
      'Photographer bio & 300 DPI author photograph ready',
    ],
  },
  {
    id: 'remembrance',
    number: '11',
    name: 'Remembrance / Observance',
    hindiName: 'स्मृति एवं दिवस',
    group: 'writing',
    track: 'Non-Technical',
    limitLabel: '500 – 700 words',
    unit: 'words',
    min: 500,
    max: 700,
    icon: Flame,
    summary:
      'Dignified tributes and thoughtful reflections honoring national commemoration days such as Vijay Diwas and historic observances.',
    topics: [
      'National commemoration days such as Vijay Diwas',
      'Historic scientific, civic, or institutional observance days',
      'Respectful reflections highlighting ethical values & heritage',
    ],
    specialNote: 'Keep tone respectful and inclusive; religious or mythological content is strictly prohibited.',
    checklist: [
      'Word count is between 500 and 700 words',
      'Historically accurate, respectful, and free from religious/mythological content',
      'Formatted in A4 editable .doc/.docx with page numbers at bottom centre',
      'Author brief bio & 300 DPI photo ready',
    ],
  },
  {
    id: 'alumni-corner',
    number: '12',
    name: 'Alumni Corner',
    hindiName: 'पूर्व छात्र संवाद',
    group: 'media',
    track: 'Non-Technical',
    limitLabel: '250 – 500 words',
    unit: 'words',
    min: 250,
    max: 500,
    icon: GraduationCap,
    summary:
      'Dedicated space for GEC Godda alumni to share life lessons, professional journeys, mentorship insights, and cherished campus memories.',
    topics: [
      'Career transitions, higher studies & real-world engineering lessons',
      'Cherished memories & institutional reflections from GEC Godda',
      'Guidance & inspiration for current undergraduate batches',
    ],
    checklist: [
      'Word count stays within 250 – 500 words',
      'Includes batch/branch details in the brief author biography',
      'Formatted cleanly in .doc/.docx (or .pdf if necessary)',
      '300 DPI author photograph ready alongside write-up',
    ],
  },
];

const MANDATORY_PRE_SUBMISSION = [
  {
    code: 'a',
    title: 'Brief Biography',
    desc: 'Short bio of the Author(s) or Artist(s) including Name, Branch, and Batch/Designation.',
  },
  {
    code: 'b',
    title: 'Author Photograph',
    desc: 'Clear passport/portrait photograph of the contributor at 300 DPI resolution.',
  },
  {
    code: 'c',
    title: 'Clear Title & Media',
    desc: 'A clear, descriptive title at the top of the article; attach supporting images separately if needed.',
  },
  {
    code: 'd',
    title: 'Visual Description',
    desc: 'Mandatory short description/caption for every Drawing, Painting, Artwork, or Photograph.',
  },
];

const CORE_RULES = [
  {
    title: 'Maximum 2 Entries Per Author',
    detail: 'One author can submit a maximum of two (02) entries in a particular edition of संRACHNA. Only submissions through the official portal are accepted.',
  },
  {
    title: 'Zero AI & Anti-Plagiarism Mandate',
    detail: 'Artificial Intelligence (AI) generated works and any form of plagiarism are strictly prohibited. Authors are strongly encouraged to submit original write-ups.',
  },
  {
    title: 'Strict Content & Conduct Boundaries',
    detail: 'Religious and mythological content, derogatory remarks about religion or spirituality, self-promotion/promotions, and hurtful targeting of any community, gender, or individual are strictly forbidden. Destructive criticism is not allowed; politely phrased constructive suggestions may be considered only upon Editorial Board discussion.',
  },
  {
    title: 'Editorial Rights & Review Discretion',
    detail: 'Submission on the portal does not guarantee publication. All entries are reviewed by the Editorial Board and may be edited for spelling, grammar, and length—or returned for rewrite if significantly over limit. Late entries are not entertained under any circumstances.',
  },
  {
    title: 'Copyright & Republication Policy',
    detail: 'Copyright of all published material stays solely with संRACHNA. If an author wishes to publish their piece elsewhere after publication in संRACHNA, strict acknowledgement of the published material is mandatory; failure to obtain acknowledgement calls for strict action against the author.',
  },
];

export default function GuidelinesPage({
  isDarkMode,
  onToggleTheme,
  onBack,
  onOpenSubmission,
}: GuidelinesPageProps) {
  const [selectedId, setSelectedId] = useState<string>(CATEGORIES[0].id);
  const [activeGroup, setActiveGroup] = useState<CategoryGroup>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatTab, setFormatTab] = useState<FormatTab>('english');
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean[]>>({});
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [showCounter, setShowCounter] = useState<boolean>(false);

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
      cat.summary.toLowerCase().includes(q) ||
      cat.topics.some((t) => t.toLowerCase().includes(q));
    return matchesGroup && matchesQuery;
  });

  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedId) ?? CATEGORIES[0];
  const ActiveIcon = activeCategory.icon;

  // Checklist state per category
  const currentChecks =
    checkedMap[activeCategory.id] ?? activeCategory.checklist.map(() => false);
  const completedChecks = currentChecks.filter(Boolean).length;
  const totalChecks = activeCategory.checklist.length;
  const checklistPercent = Math.round((completedChecks / totalChecks) * 100);
  const isChecklistComplete = completedChecks === totalChecks;

  const toggleCheck = (idx: number) => {
    setCheckedMap((prev) => {
      const existing =
        prev[activeCategory.id] ?? activeCategory.checklist.map(() => false);
      const next = existing.map((v, i) => (i === idx ? !v : v));
      return { ...prev, [activeCategory.id]: next };
    });
  };

  // Live Word / Line Counter calculation
  const liveCount =
    activeCategory.unit === 'lines'
      ? draftText
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0).length
      : draftText.trim()
      ? draftText.trim().split(/\s+/).length
      : 0;

  const getCountStatus = () => {
    if (liveCount === 0) return { label: 'Paste your draft to check', color: isDarkMode ? '#A1A1AA' : '#52525B' };
    if (liveCount < activeCategory.min) {
      return {
        label: `${activeCategory.min - liveCount} more ${activeCategory.unit} needed`,
        color: '#D4AF37',
      };
    }
    if (liveCount > activeCategory.max) {
      return {
        label: `Over limit by ${liveCount - activeCategory.max} ${activeCategory.unit}`,
        color: '#EF4444',
      };
    }
    return {
      label: 'Perfect! Within official संRACHNA limit',
      color: '#22C55E',
    };
  };

  const countStatus = getCountStatus();

  const handleCopyCategoryRules = async () => {
    const text = [
      `संRACHNA (GEC Godda) — Official Submission Guidelines`,
      `Category: ${activeCategory.name} (${activeCategory.hindiName})`,
      `Limit: ${activeCategory.limitLabel}`,
      `Track: ${activeCategory.track}`,
      ``,
      `Accepted Scope:`,
      ...activeCategory.topics.map((t) => `• ${t}`),
      ``,
      activeCategory.unit === 'nos'
        ? `Format: .jpg / .png / .gif at 300 DPI (Do NOT paste inside Word doc). Include caption & short description.`
        : `Format: A4 (.doc/.docx), 1" margins, 1.5 line spacing, 6pt after paragraph. English: Bookman Old 11pt (Heading 14pt Bold). Hindi: KrutiDev/Mangal 14pt (Heading 16pt).`,
      ``,
      `Theme: THE ZERO (शून्य) | Max 2 entries per author | Strictly 0% AI & Plagiarism.`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(activeCategory.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Clipboard unsupported silently ignored
    }
  };

  // Theme tokens matching App.tsx exactly
  const bg = isDarkMode ? '#070B19' : '#FAF9F5';
  const surface = isDarkMode ? 'rgba(15, 22, 42, 0.78)' : 'rgba(255, 255, 255, 0.85)';
  const surfaceSoft = isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(245, 239, 230, 0.75)';
  const borderCol = isDarkMode ? 'rgba(212, 175, 55, 0.24)' : 'rgba(139, 30, 36, 0.16)';
  const textMain = isDarkMode ? '#FAF9F5' : '#111827';
  const textMuted = isDarkMode ? '#A1A1AA' : '#52525B';
  const navyOrGold = isDarkMode ? '#D4AF37' : '#1E3A5F';

  return (
    <div
      className="gp-root"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bg,
        color: textMain,
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        position: 'relative',
        overflowX: 'clip',
        transition: 'background-color 0.35s ease, color 0.35s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rozha+One&display=swap');

        .gp-root * { box-sizing: border-box; }

        .gp-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 28px;
        }

        .gp-header {
          position: sticky;
          top: 0;
          z-index: 60;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: ${isDarkMode ? 'rgba(7, 11, 25, 0.88)' : 'rgba(250, 249, 245, 0.9)'};
          border-bottom: 1.5px solid transparent;
          border-image: linear-gradient(90deg, #8B1E24, #D4AF37, #1E3A5F, #8B1E24) 1;
        }

        .gp-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .gp-btn-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.6px;
          cursor: pointer;
          border: 1px solid ${borderCol};
          background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'};
          color: ${textMain};
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          font-family: inherit;
        }
        .gp-btn-pill:hover {
          border-color: #D4AF37;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(139, 30, 36, 0.2);
        }

        .gp-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.6px;
          cursor: pointer;
          border: 1px solid rgba(212, 175, 55, 0.8);
          background: linear-gradient(135deg, #8B1E24 0%, #5A1216 100%);
          color: #FAF9F5;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 26px rgba(139, 30, 36, 0.32);
          text-decoration: none;
          font-family: inherit;
        }
        .gp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(139, 30, 36, 0.48);
          border-color: #F6E05E;
        }

        .gp-btn-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 16px;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          border: 1px solid #D4AF37;
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
          color: #070B19;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 12px 28px rgba(212, 175, 55, 0.28);
          font-family: inherit;
          width: 100%;
        }
        .gp-btn-gold:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 16px 34px rgba(212, 175, 55, 0.42);
        }

        .gp-hero-gradient {
          background: linear-gradient(135deg, #D4AF37 0%, #F6E05E 38%, #8B1E24 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .gp-highlight-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }

        .gp-card {
          border-radius: 24px;
          border: 1px solid ${borderCol};
          background: ${surface};
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: ${isDarkMode ? '0 20px 50px rgba(0,0,0,0.32)' : '0 14px 36px rgba(30,58,95,0.07)'};
        }

        .gp-workspace {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 24px;
          align-items: start;
          margin-top: 24px;
        }

        .gp-cat-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 760px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .gp-cat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          padding: 13px 14px;
          border-radius: 16px;
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(139,30,36,0.12)'};
          background: ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.65)'};
          color: ${textMain};
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .gp-cat-item:hover {
          border-color: rgba(212, 175, 55, 0.55);
          transform: translateX(4px);
        }
        .gp-cat-item.active {
          background: linear-gradient(135deg, #8B1E24 0%, #4E1014 100%);
          border-color: #D4AF37;
          color: #FAF9F5;
          box-shadow: 0 12px 28px rgba(139, 30, 36, 0.34);
          transform: translateX(4px);
        }

        .gp-detail-grid {
          display: grid;
          grid-template-columns: 1.45fr 1fr;
          gap: 20px;
          align-items: start;
        }

        .gp-spec-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .gp-essentials-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .gp-format-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .gp-filter-pill {
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid ${borderCol};
          background: ${surfaceSoft};
          color: ${textMuted};
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .gp-filter-pill.active {
          background: #8B1E24;
          border-color: #D4AF37;
          color: #FAF9F5;
        }

        @media (max-width: 1080px) {
          .gp-workspace {
            grid-template-columns: 1fr;
          }
          .gp-cat-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            max-height: none;
            overflow: visible;
          }
          .gp-cat-item:hover,
          .gp-cat-item.active {
            transform: translateY(-2px);
          }
          .gp-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .gp-highlight-grid,
          .gp-essentials-grid,
          .gp-format-grid {
            grid-template-columns: 1fr;
          }
          .gp-spec-grid {
            grid-template-columns: 1fr;
          }
          .gp-container,
          .gp-header-inner {
            padding-left: 16px;
            padding-right: 16px;
          }
          .gp-hide-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* Ambient Royal Background Glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-140px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '760px',
            height: '380px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(139,30,36,0.28) 0%, rgba(212,175,55,0.1) 45%, transparent 72%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(139,30,36,0.08) 45%, transparent 72%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Sticky Editorial Header */}
      <header className="gp-header">
        <div className="gp-header-inner">
          <button type="button" onClick={onBack} className="gp-btn-pill">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <div
            className="gp-hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                fontFamily: "'Rozha One', 'Playfair Display', serif",
                fontSize: '18px',
                color: '#D4AF37',
                letterSpacing: '0.5px',
              }}
            >
              संRACHNA
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: textMuted }}>Official Editorial Handbook</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="gp-btn-pill"
              style={{ padding: '10px' }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} color="#D4AF37" /> : <Moon size={16} color="#1E3A5F" />}
            </button>
            <button type="button" onClick={onOpenSubmission} className="gp-btn-primary">
              <span>Submit Entry</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="gp-container" style={{ position: 'relative', zIndex: 2, paddingTop: '44px', paddingBottom: '90px' }}>
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              background: isDarkMode ? 'rgba(212, 175, 55, 0.1)' : 'rgba(139, 30, 36, 0.08)',
              color: isDarkMode ? '#F6E05E' : '#8B1E24',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={14} />
            <span>{SUBMISSION_STATUS_LABEL} • GEC GODDA</span>
          </div>

          <h1
            style={{
              margin: '20px 0 14px 0',
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(34px, 5vw, 58px)',
              fontWeight: 800,
              lineHeight: 1.12,
              color: textMain,
            }}
          >
            Guidelines for{' '}
            <span className="gp-hero-gradient">Submission of Content</span>
          </h1>

          <p
            style={{
              margin: '0 auto',
              maxWidth: '720px',
              fontSize: 'clamp(15px, 1.7vw, 18px)',
              lineHeight: 1.7,
              color: textMuted,
            }}
          >
            Select your category below to explore exact word or line limits, official Hindi &amp; English A4 formatting rules, a live draft length checker, and an interactive pre-submission checklist.
          </p>

          {/* Official PDF Download Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <a href="/Guidelines.pdf" download="Sanrachna_Guidelines_2026.pdf" className="gp-btn-pill">
              <Download size={15} color="#D4AF37" />
              <span>Download Official Guidelines PDF</span>
            </a>
            <a href="/Template for Submission.pdf" download="Sanrachna_Template_2026.pdf" className="gp-btn-pill">
              <Download size={15} color="#8B1E24" />
              <span>Download Submission Template PDF</span>
            </a>
          </div>
        </section>

        {/* TOP 3 EDITORIAL PILLAR CARDS (Theme, 40/60 Ratio, E-Certificate) */}
        <section className="gp-highlight-grid">
          {/* Theme Card */}
          <div className="gp-card" style={{ padding: '22px 24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <Sparkles size={15} />
              <span>Edition Theme</span>
            </div>
            <div style={{ marginTop: '10px', fontFamily: "'Playfair Display', serif", fontSize: '23px', fontWeight: 800, color: textMain }}>
              THE ZERO <span style={{ fontFamily: "'Rozha One', serif", color: '#D4AF37', fontWeight: 500 }}>(शून्य)</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: 1.6, color: textMuted }}>
              Write-ups should be related to—but are <strong>not restricted to</strong>—the theme. Open to GEC Godda students, faculty, staff &amp; alumni.
            </p>
          </div>

          {/* 40 / 60 Balance Card */}
          <div className="gp-card" style={{ padding: '22px 24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <Scale size={15} />
              <span>Strict Editorial Balance</span>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: '#D4AF37' }}>40% Technical / Scientific</span>
              <span style={{ color: isDarkMode ? '#FAF9F5' : '#8B1E24' }}>60% Non-Technical</span>
            </div>
            <div style={{ marginTop: '8px', height: '10px', width: '100%', borderRadius: '999px', overflow: 'hidden', display: 'flex', background: surfaceSoft }}>
              <div style={{ width: '40%', background: 'linear-gradient(90deg, #1E3A5F, #D4AF37)' }} />
              <div style={{ width: '60%', background: 'linear-gradient(90deg, #8B1E24, #C0392B)' }} />
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '12.5px', lineHeight: 1.55, color: textMuted }}>
              Strictly maintained across every edition to blend scientific innovation with creative campus expression.
            </p>
          </div>

          {/* Recognition & Cap Card */}
          <div className="gp-card" style={{ padding: '22px 24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <Award size={15} />
              <span>Recognition &amp; Entry Limit</span>
            </div>
            <div style={{ marginTop: '10px', fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: 800, color: textMain }}>
              Best Content E-Certificate
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: 1.6, color: textMuted }}>
              Awarded to the best content submitter of the edition. Each contributor may submit up to <strong>two (02) entries</strong> max.
            </p>
          </div>
        </section>

        {/* INTERACTIVE 12-CATEGORY EXPLORER */}
        <section style={{ marginTop: '54px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                Section 01 • Interactive Category Guide
              </div>
              <h2 style={{ margin: '6px 0 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: textMain }}>
                Choose What You Are Submitting
              </h2>
            </div>

            {/* Filter Pills + Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              {(
                [
                  { id: 'all', label: 'All 12' },
                  { id: 'writing', label: 'Writing & Poetry' },
                  { id: 'media', label: 'Campus & Media' },
                  { id: 'visual', label: 'Art & Photo' },
                ] as { id: CategoryGroup; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGroup(tab.id)}
                  className={`gp-filter-pill ${activeGroup === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gp-workspace">
            {/* LEFT SIDEBAR: 12 Categories Selector */}
            <div className="gp-card" style={{ padding: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${borderCol}`,
                  background: surfaceSoft,
                  marginBottom: '12px',
                }}
              >
                <Search size={15} color={textMuted} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Article, Poem, Photo..."
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: textMain,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div className="gp-cat-list">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = cat.id === activeCategory.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(cat.id);
                        setDraftText('');
                      }}
                      className={`gp-cat-item ${isActive ? 'active' : ''}`}
                    >
                      <span
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isActive
                            ? 'rgba(212, 175, 55, 0.22)'
                            : isDarkMode
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(139,30,36,0.08)',
                          color: isActive ? '#F6E05E' : isDarkMode ? '#D4AF37' : '#8B1E24',
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.number}. {cat.name}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: '2px',
                            fontSize: '11.5px',
                            color: isActive ? 'rgba(250,249,245,0.78)' : textMuted,
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <span>{cat.hindiName}</span>
                          <span style={{ fontWeight: 700, color: isActive ? '#F6E05E' : navyOrGold }}>
                            {cat.limitLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '13px', color: textMuted }}>
                    No matching category found.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT STAGE: Active Category Detail + Interactive Checklist */}
            <div className="gp-detail-grid">
              {/* Category Details Card */}
              <div className="gp-card" style={{ padding: '28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #8B1E24 0%, #5A1216 100%)',
                        border: '1px solid rgba(212,175,55,0.65)',
                        color: '#F6E05E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ActiveIcon size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(212, 175, 55, 0.16)',
                            color: isDarkMode ? '#F6E05E' : '#8B1E24',
                          }}
                        >
                          Category {activeCategory.number} • {activeCategory.track}
                        </span>
                      </div>
                      <h3
                        style={{
                          margin: '6px 0 0 0',
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 'clamp(24px, 3vw, 30px)',
                          fontWeight: 800,
                          color: textMain,
                          lineHeight: 1.15,
                        }}
                      >
                        {activeCategory.name}{' '}
                        <span style={{ fontSize: '16px', fontWeight: 500, color: '#D4AF37' }}>
                          ({activeCategory.hindiName})
                        </span>
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCategoryRules}
                    className="gp-btn-pill"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    {copiedId === activeCategory.id ? (
                      <>
                        <Check size={14} color="#22C55E" />
                        <span style={{ color: '#22C55E' }}>Rules Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Rules</span>
                      </>
                    )}
                  </button>
                </div>

                <p style={{ margin: '18px 0 22px 0', fontSize: '14.5px', lineHeight: 1.7, color: textMuted }}>
                  {activeCategory.summary}
                </p>

                {/* Quick Metric Strip */}
                <div className="gp-spec-grid">
                  <div style={{ padding: '14px 16px', borderRadius: '16px', border: `1px solid ${borderCol}`, background: surfaceSoft }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#D4AF37' }}>
                      Official Limit
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 800, color: textMain }}>
                      {activeCategory.limitLabel}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', borderRadius: '16px', border: `1px solid ${borderCol}`, background: surfaceSoft }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#D4AF37' }}>
                      File Standard
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '14.5px', fontWeight: 700, color: textMain }}>
                      {activeCategory.unit === 'nos'
                        ? '.JPG / .PNG / .GIF (300 DPI)'
                        : '.DOC / .DOCX (.PDF if needed)'}
                    </div>
                  </div>
                </div>

                {/* Special Important Note if applicable */}
                {activeCategory.specialNote && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1px solid rgba(212, 175, 55, 0.5)',
                      background: isDarkMode ? 'rgba(212, 175, 55, 0.09)' : 'rgba(212, 175, 55, 0.14)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: textMain,
                    }}
                  >
                    <AlertTriangle size={17} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{activeCategory.specialNote}</span>
                  </div>
                )}

                {/* Accepted Topics & Scope */}
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: navyOrGold }}>
                    What You Can Cover
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {activeCategory.topics.map((topic, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '14px',
                          lineHeight: 1.55,
                          color: textMain,
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#D4AF37',
                            marginTop: '8px',
                            flexShrink: 0,
                          }}
                        />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* LIVE INTERACTIVE WORD / LINE CHECKER (For Text Categories) */}
                {activeCategory.unit !== 'nos' ? (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '18px',
                      borderRadius: '18px',
                      border: `1px solid ${borderCol}`,
                      background: surfaceSoft,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#D4AF37' }}>
                          Interactive Tool • Live {activeCategory.unit === 'lines' ? 'Line' : 'Word'} Checker
                        </div>
                        <div style={{ fontSize: '12.5px', color: textMuted, marginTop: '2px' }}>
                          Target for {activeCategory.name}: <strong>{activeCategory.limitLabel}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCounter(!showCounter)}
                        className="gp-btn-pill"
                        style={{ padding: '7px 14px', fontSize: '12px' }}
                      >
                        {showCounter ? 'Hide Checker' : 'Test My Draft'}
                      </button>
                    </div>

                    {showCounter && (
                      <div style={{ marginTop: '14px' }}>
                        <textarea
                          rows={5}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          placeholder={
                            activeCategory.unit === 'lines'
                              ? 'Paste your poem here to count non-empty lines instantly...'
                              : `Paste your ${activeCategory.name.toLowerCase()} draft here to verify word count...`
                          }
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: `1px solid ${borderCol}`,
                            background: isDarkMode ? 'rgba(7, 11, 25, 0.85)' : '#FFFFFF',
                            color: textMain,
                            fontSize: '13.5px',
                            lineHeight: 1.6,
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <div
                          style={{
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                          }}
                        >
                          <span>
                            Count:{' '}
                            <strong style={{ color: '#D4AF37', fontSize: '15px' }}>
                              {liveCount} {activeCategory.unit}
                            </strong>
                          </span>
                          <span style={{ color: countStatus.color }}>{countStatus.label}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '16px 18px',
                      borderRadius: '18px',
                      border: `1px solid ${borderCol}`,
                      background: surfaceSoft,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <Image size={20} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: textMuted }}>
                      <strong style={{ color: textMain, display: 'block', marginBottom: '2px' }}>
                        Print-Ready Visual Requirement (300 DPI)
                      </strong>
                      Submit original uncompressed <strong>.jpg, .png, or .gif</strong> files directly—never inside a Word document—along with a short caption/description.
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT STICKY: Pre-Flight Interactive Checklist & Direct Portal CTA */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  className="gp-card"
                  style={{
                    padding: '24px',
                    textAlign: 'left',
                    borderColor: isChecklistComplete ? 'rgba(34, 197, 94, 0.6)' : 'rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D4AF37' }}>
                      Pre-Flight Check
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: isChecklistComplete ? 'rgba(34, 197, 94, 0.18)' : surfaceSoft,
                        color: isChecklistComplete ? '#22C55E' : textMuted,
                      }}
                    >
                      {completedChecks}/{totalChecks} Ready
                    </span>
                  </div>

                  <h3 style={{ margin: '10px 0 4px 0', fontFamily: "'Playfair Display', serif", fontSize: '21px', fontWeight: 800, color: textMain }}>
                    Ready to Submit {activeCategory.name}?
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: textMuted, lineHeight: 1.55 }}>
                    Tick each item below before opening the submission portal.
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '14px', height: '7px', width: '100%', borderRadius: '999px', overflow: 'hidden', background: surfaceSoft }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${checklistPercent}%`,
                        borderRadius: '999px',
                        background: isChecklistComplete
                          ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                          : 'linear-gradient(90deg, #8B1E24, #D4AF37)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Interactive Checkboxes */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {activeCategory.checklist.map((item, idx) => {
                      const isChecked = currentChecks[idx];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleCheck(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            width: '100%',
                            textAlign: 'left',
                            padding: '11px 12px',
                            borderRadius: '13px',
                            border: isChecked
                              ? '1px solid rgba(34, 197, 94, 0.5)'
                              : `1px solid ${borderCol}`,
                            background: isChecked
                              ? 'rgba(34, 197, 94, 0.08)'
                              : surfaceSoft,
                            color: textMain,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                          }}
                        >
                          <span
                            style={{
                              width: '19px',
                              height: '19px',
                              borderRadius: '6px',
                              flexShrink: 0,
                              marginTop: '1px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: isChecked ? '1px solid #22C55E' : `1.5px solid ${textMuted}`,
                              background: isChecked ? '#22C55E' : 'transparent',
                              color: '#070B19',
                            }}
                          >
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span
                            style={{
                              fontSize: '12.5px',
                              lineHeight: 1.5,
                              opacity: isChecked ? 0.8 : 1,
                              textDecoration: isChecked ? 'line-through' : 'none',
                            }}
                          >
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Primary Action -> Website Submission Portal */}
                  <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={onOpenSubmission}
                      className="gp-btn-gold"
                      style={
                        isChecklistComplete
                          ? {
                              background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
                              borderColor: '#4ADE80',
                              color: '#FFFFFF',
                            }
                          : undefined
                      }
                    >
                      {isChecklistComplete && <CheckCircle2 size={16} />}
                      <span>Open Submission Portal</span>
                      <ArrowRight size={16} />
                    </button>

                    <a
                      href={GOOGLE_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gp-btn-pill"
                      style={{ width: '100%', fontSize: '12px', padding: '10px 14px' }}
                    >
                      <span>Alternate Official Google Form ↗</span>
                    </a>
                  </div>
                </div>

                {/* Quick Zero-AI Warning Card */}
                <div
                  className="gp-card"
                  style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    borderColor: 'rgba(139, 30, 36, 0.45)',
                    background: isDarkMode ? 'rgba(139, 30, 36, 0.14)' : 'rgba(139, 30, 36, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDarkMode ? '#FCA5A5' : '#8B1E24', fontSize: '12.5px', fontWeight: 800 }}>
                    <ShieldAlert size={16} />
                    <span>Zero-AI &amp; Anti-Plagiarism Policy</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', lineHeight: 1.6, color: textMuted }}>
                    AI-generated write-ups, poems, or AI art and plagiarized content are strictly prohibited and will be disqualified during review.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* SECTION 02: INTERACTIVE FORMATTING STUDIO */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '22px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37' }}>
                Section 02 • Mandatory Formatting Standards
              </div>
              <h2 style={{ margin: '6px 0 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: textMain }}>
                Typography, Page Layout &amp; File Specs
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'english', label: 'English Text Specs' },
                  { id: 'hindi', label: 'हिन्दी Text Specs' },
                  { id: 'visual', label: 'Images & Artwork (300 DPI)' },
                ] as { id: FormatTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormatTab(tab.id)}
                  className={`gp-filter-pill ${formatTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gp-card" style={{ padding: '28px', textAlign: 'left' }}>
            {formatTab === 'english' && (
              <div className="gp-format-grid">
                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Font Family</div>
                  <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 800, fontFamily: 'Georgia, serif' }}>Bookman Old Style</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: textMuted }}>Official typeface for all English manuscripts.</p>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Font Sizes</div>
                  <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.8 }}>
                    <div><strong>Heading:</strong> 14pt (Bold)</div>
                    <div><strong>Sub-heading:</strong> 12pt (Bold)</div>
                    <div><strong>Body Text:</strong> 11pt Regular</div>
                  </div>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Page &amp; Spacing</div>
                  <div style={{ marginTop: '6px', fontSize: '13.5px', lineHeight: 1.75 }}>
                    <div><strong>Page:</strong> A4 (8.27 × 11.69 in) • 1&quot; Margins</div>
                    <div><strong>Spacing:</strong> 1.5 Line • 6pt after paragraph</div>
                    <div><strong>Page No:</strong> Bottom Centre • <strong>.doc / .docx</strong></div>
                  </div>
                </div>
              </div>
            )}

            {formatTab === 'hindi' && (
              <div className="gp-format-grid">
                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>हिन्दी Font Family</div>
                  <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 800 }}>KrutiDev or Mangal</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: textMuted }}>Official approved Devanagari fonts for Hindi submissions.</p>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Font Sizes (हिन्दी)</div>
                  <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.8 }}>
                    <div><strong>Heading:</strong> 16pt</div>
                    <div><strong>Sub-heading:</strong> 14pt</div>
                    <div><strong>Body Text:</strong> 14pt</div>
                  </div>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Page &amp; File Format</div>
                  <div style={{ marginTop: '6px', fontSize: '13.5px', lineHeight: 1.75 }}>
                    <div><strong>Page:</strong> A4 (8.27 × 11.69 in) • 1&quot; Margins</div>
                    <div><strong>Spacing:</strong> 1.5 Line • 6pt after paragraph</div>
                    <div><strong>File:</strong> Editable .doc/.docx (.pdf only if necessary)</div>
                  </div>
                </div>
              </div>
            )}

            {formatTab === 'visual' && (
              <div className="gp-format-grid">
                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Accepted Formats</div>
                  <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 800 }}>.JPG / .PNG / .GIF</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: textMuted }}>For Drawing, Painting, Artworks, Photography &amp; article visuals.</p>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#D4AF37' }}>Resolution Standard</div>
                  <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 800 }}>300 DPI Minimum</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: textMuted }}>Save all artworks, photos &amp; author portraits at 300 DPI wherever possible.</p>
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', background: surfaceSoft, border: `1px solid ${borderCol}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#EF4444' }}>Strict Rule</div>
                  <div style={{ marginTop: '6px', fontSize: '16px', fontWeight: 800 }}>No Embedded Images</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: textMuted }}>Do NOT submit images pasted inside a Word document. Upload files separately.</p>
                </div>
              </div>
            )}

            {/* 4 Mandatory Pre-Submission Items */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: navyOrGold, marginBottom: '14px' }}>
                Prior to Submission — Keep These 4 Essentials Ready
              </div>
              <div className="gp-essentials-grid">
                {MANDATORY_PRE_SUBMISSION.map((item) => (
                  <div
                    key={item.code}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      border: `1px solid ${borderCol}`,
                      background: surfaceSoft,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#8B1E24',
                        color: '#F6E05E',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {item.code}
                    </span>
                    <div style={{ marginTop: '10px', fontSize: '14.5px', fontWeight: 700, color: textMain }}>
                      {item.title}
                    </div>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12.5px', lineHeight: 1.55, color: textMuted }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03: ETHICS, POLICIES & DISCLOSURES ACCORDION */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ textAlign: 'left', marginBottom: '22px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37' }}>
              Section 03 • Terms, Ethics &amp; Copyright
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: textMain }}>
              Mandatory Rules &amp; Official Disclosures
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CORE_RULES.map((rule, idx) => {
              const isOpen = openRuleIndex === idx;
              return (
                <div
                  key={idx}
                  className="gp-card"
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    borderColor: isOpen ? 'rgba(212, 175, 55, 0.55)' : borderCol,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenRuleIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: 'transparent',
                      border: 'none',
                      color: textMain,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#D4AF37',
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <span style={{ fontSize: '15.5px', fontWeight: 700 }}>{rule.title}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      color="#D4AF37"
                      style={{
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 22px 20px 54px',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: textMuted,
                        textAlign: 'left',
                      }}
                    >
                      {rule.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM EDITORIAL CTA BANNER */}
        <section
          className="gp-card"
          style={{
            marginTop: '64px',
            padding: 'clamp(28px, 4vw, 44px)',
            background: 'linear-gradient(135deg, #5A1216 0%, #8B1E24 45%, #1E3A5F 100%)',
            borderColor: 'rgba(212, 175, 55, 0.6)',
            color: '#FAF9F5',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#F6E05E' }}>
            Team संRACHNA • Government Engineering College, Godda
          </div>
          <h2 style={{ margin: '10px 0 8px 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#FFFFFF' }}>
            &ldquo;Inform, Engage, Celebrate Talent, and Preserve Memories&rdquo;
          </h2>
          <p style={{ margin: '0 auto 24px auto', maxWidth: '620px', fontSize: '14.5px', color: 'rgba(250,249,245,0.85)', lineHeight: 1.65 }}>
            Have questions, comments, or suggestions regarding your submission? Reach out to the Editorial Board anytime or jump straight into the submission portal.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onOpenSubmission}
              className="gp-btn-pill"
              style={{
                background: '#D4AF37',
                borderColor: '#F6E05E',
                color: '#070B19',
                padding: '13px 26px',
                fontSize: '13.5px',
              }}
            >
              <span>Open Submission Portal</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="mailto:sanrachna.gecgodda@gmail.com"
              className="gp-btn-pill"
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.35)',
                color: '#FFFFFF',
                padding: '13px 22px',
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
