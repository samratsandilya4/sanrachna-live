import React, { useState } from "react";
import {
  Sparkles,
  Camera,
  Palette,
  FileCheck2,
  Megaphone,
  Layers,
  Award,
  Users,
  RotateCcw,
} from "lucide-react";

interface EditorialAvatarProps {
  variant: number;
  dark?: boolean;
}

const EditorialAvatar: React.FC<EditorialAvatarProps> = ({ variant = 1, dark = false }) => {
  const strokeColor = dark ? "#f5ebe1" : "#1c1917";
  const accentColor = dark ? "#d97757" : "#8b3a3a";

  return (
    <svg
      viewBox="0 0 120 120"
      className="w-24 h-24 sm:w-28 sm:h-28 mx-auto overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="62" r="42" fill={dark ? "rgba(255,255,255,0.06)" : "rgba(139,58,58,0.08)"} />
      <path d="M26 104C31 86 44 80 60 80C76 80 89 86 94 104" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="54" r="20" fill={dark ? "#262320" : "#faf7f2"} stroke={strokeColor} strokeWidth="3" />
      {variant % 3 === 0 && (
        <path d="M38 52C38 35 48 28 60 28C72 28 82 35 82 52C85 42 78 24 60 24C42 24 35 42 38 52Z" fill={strokeColor} />
      )}
      {variant % 3 === 1 && (
        <path d="M36 58C35 36 45 26 60 26C75 26 85 36 84 58C80 42 72 34 60 34C48 34 40 42 36 58Z" fill={strokeColor} />
      )}
      {variant % 3 === 2 && (
        <path d="M40 46C43 32 52 27 62 28C74 29 81 38 80 50C74 39 64 36 54 38C46 39 42 43 40 46Z" fill={strokeColor} />
      )}
      <circle cx="53" cy="53" r="2" fill={strokeColor} />
      <circle cx="67" cy="53" r="2" fill={strokeColor} />
      <path d="M55 61C57 63.5 63 63.5 65 61" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="78" cy="34" r="4.5" fill={accentColor} />
    </svg>
  );
};

const EDITORIAL_LEADERSHIP = {
  professorInCharge: {
    name: "Dr. Amit Kumar Chaudhary",
    role: "Professor-in-Charge",
    hindiRole: "प्रभारी प्राध्यापक • संRACHNA",
    college: "Government Engineering College, Godda",
    bio: "Guiding the vision, academic integrity, and creative direction of the annual college magazine संRACHNA.",
  },
  editor: {
    id: "editor-1",
    name: "Priya Kumari",
    role: "Editor (संपादक)",
    team: "Editorial Head",
    badge: "Chief Editor ↗",
    bio: "Leading the student editorial board, curating manuscripts, and ensuring excellence across every page of संRACHNA.",
    variant: 1,
  },
};

const TEAM_GROUPS = [
  {
    id: "review",
    teamName: "Review Team",
    hindiTitle: "समीक्षा एवं संपादन विभाग",
    icon: FileCheck2,
    accent: "#8b3a3a",
    bgTint: "from-[#fdf8f5] to-[#f7ede6]",
    members: [
      { id: "rev-1", name: "Anannya Singh", role: "Coordinator • Review", team: "Review Team", badge: "Review ↗", bio: "Reviewing literary pieces, polishing narratives, and ensuring clarity.", variant: 2 },
      { id: "rev-2", name: "Samrat Sandilya", role: "Coordinator • Review", team: "Review Team", badge: "Review ↗", bio: "Shaping editorial standards, reviewing technical and creative drafts.", variant: 3 },
    ],
  },
  {
    id: "photography",
    teamName: "Photography Team",
    hindiTitle: "छायांकन विभाग",
    icon: Camera,
    accent: "#233862",
    bgTint: "from-[#f5f8fc] to-[#eaf0f8]",
    members: [
      { id: "photo-1", name: "Akanksha Chouhan", role: "Coordinator • Photography", team: "Photography Team", badge: "Lens ↗", bio: "Framing campus life, institutional events, and visual stories.", variant: 4 },
      { id: "photo-2", name: "Nitu Kumari", role: "Coordinator • Photography", team: "Photography Team", badge: "Lens ↗", bio: "Documenting student achievements and expressive portraits.", variant: 5 },
    ],
  },
  {
    id: "graphics",
    teamName: "Graphic Content Team",
    hindiTitle: "ग्राफिक एवं डिज़ाइन विभाग",
    icon: Layers,
    accent: "#7c4a2d",
    bgTint: "from-[#fcf9f5] to-[#f5ece2]",
    members: [
      { id: "graph-1", name: "Rukhsar Parween", role: "Coordinator • Graphic Content", team: "Graphic Content", badge: "Design ↗", bio: "Crafting modern editorial layouts and visual themes.", variant: 6 },
      { id: "graph-2", name: "Sachin Kumar Mahato", role: "Coordinator • Graphic Content", team: "Graphic Content", badge: "Design ↗", bio: "Designing digital posters and typographic elements.", variant: 7 },
    ],
  },
  {
    id: "finearts",
    teamName: "Fine Arts Team",
    hindiTitle: "ललित कला विभाग",
    icon: Palette,
    accent: "#6b3fa0",
    bgTint: "from-[#faf7fc] to-[#f1ebf8]",
    members: [
      { id: "art-1", name: "Aliya Naaz", role: "Coordinator • Fine Arts", team: "Fine Arts", badge: "Canvas ↗", bio: "Curating student illustrations and cultural artwork.", variant: 8 },
      { id: "art-2", name: "Satyam Pandey", role: "Coordinator • Fine Arts", team: "Fine Arts", badge: "Canvas ↗", bio: "Bringing creative sketches and traditional art forms to life.", variant: 9 },
    ],
  },
  {
    id: "pr",
    teamName: "Public Relation Team",
    hindiTitle: "जनसंपर्क एवं संवाद विभाग",
    icon: Megaphone,
    accent: "#1f5f5b",
    bgTint: "from-[#f4faf9] to-[#e6f3f1]",
    members: [
      { id: "pr-1", name: "Anubhav Kumar", role: "Coordinator • Public Relation", team: "Public Relation", badge: "Outreach ↗", bio: "Coordinating campus outreach and student participation.", variant: 10 },
      { id: "pr-2", name: "Prince Kumar", role: "Coordinator • Public Relation", team: "Public Relation", badge: "Outreach ↗", bio: "Managing official announcements and contributor engagement.", variant: 11 },
    ],
  },
];

const STACK_SLOTS = [
  { fanned: "-translate-x-[235px] lg:-translate-x-[285px] translate-y-[26px] -rotate-[12deg] scale-95", collapsed: "-translate-x-[18px] translate-y-[8px] -rotate-[5deg] scale-[0.94] opacity-85", zIndex: 10 },
  { fanned: "-translate-x-[122px] lg:-translate-x-[148px] translate-y-[10px] -rotate-[6deg] scale-[0.98]", collapsed: "-translate-x-[9px] translate-y-[4px] -rotate-[2.5deg] scale-[0.97] opacity-95", zIndex: 20 },
  { fanned: "translate-x-0 translate-y-0 rotate-0 scale-100", collapsed: "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100", zIndex: 30 },
  { fanned: "translate-x-[122px] lg:translate-x-[148px] translate-y-[10px] rotate-[6deg] scale-[0.98]", collapsed: "translate-x-[9px] translate-y-[4px] rotate-[2.5deg] scale-[0.97] opacity-95", zIndex: 20 },
  { fanned: "translate-x-[235px] lg:translate-x-[285px] translate-y-[26px] rotate-[12deg] scale-95", collapsed: "translate-x-[18px] translate-y-[8px] rotate-[5deg] scale-[0.94] opacity-85", zIndex: 10 },
];

const EditorialBoard: React.FC = () => {
  const [isStackOpen, setIsStackOpen] = useState<boolean>(false);
  const [activeStackFilter, setActiveStackFilter] = useState<string>("featured");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>("review");

  const getShowcaseCards = () => {
    if (activeStackFilter === "featured") {
      return [
        TEAM_GROUPS[1].members[0],
        TEAM_GROUPS[0].members[0],
        EDITORIAL_LEADERSHIP.editor,
        TEAM_GROUPS[0].members[1],
        TEAM_GROUPS[2].members[0],
      ];
    }
    const selectedGroup = TEAM_GROUPS.find((g) => g.id === activeStackFilter);
    if (!selectedGroup) return [];
    const otherGroups = TEAM_GROUPS.filter((g) => g.id !== activeStackFilter);
    return [
      otherGroups[0].members[0],
      selectedGroup.members[0],
      { ...EDITORIAL_LEADERSHIP.editor, role: `Editor • ${selectedGroup.teamName}` },
      selectedGroup.members[1],
      otherGroups[1].members[0],
    ];
  };

  const showcaseCards = getShowcaseCards();

  return (
    <section className="w-full bg-[#faf7f2] text-stone-800 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b3a3a]/10 border border-[#8b3a3a]/25 text-[#8b3a3a] text-xs font-semibold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>सृजन से निर्माण तक • Editorial Committee</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#233862] tracking-tight">
            Editorial Board of <span className="text-[#8b3a3a]">संRACHNA</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Meet the dedicated student coordinators and editorial minds behind the official annual magazine of Government Engineering College, Godda.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative rounded-2xl bg-gradient-to-r from-[#233862] via-[#1d2f52] to-[#8b3a3a] p-[1.5px] shadow-md">
            <div className="bg-[#faf7f2] rounded-[15px] px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#8b3a3a]/10 border border-[#8b3a3a]/25 flex items-center justify-center text-[#8b3a3a] shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b3a3a]">
                    {EDITORIAL_LEADERSHIP.professorInCharge.hindiRole}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#233862]">
                    {EDITORIAL_LEADERSHIP.professorInCharge.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {EDITORIAL_LEADERSHIP.professorInCharge.bio}
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#233862]/10 text-[#233862] shrink-0">
                Faculty In-Charge
              </span>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => { setActiveStackFilter("featured"); setIsStackOpen(true); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeStackFilter === "featured" ? "bg-[#1c1917] text-[#faf7f2] shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
              }`}
            >
              Featured Stack
            </button>
            {TEAM_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => { setActiveStackFilter(group.id); setIsStackOpen(true); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeStackFilter === group.id ? "bg-[#8b3a3a] text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
                }`}
              >
                {group.teamName}
              </button>
            ))}
          </div>

          <div
            className="hidden md:flex relative h-[430px] items-center justify-center"
            onMouseEnter={() => setIsStackOpen(true)}
            onMouseLeave={() => { setIsStackOpen(false); setHoveredCardId(null); }}
          >
            {showcaseCards.map((member, idx) => {
              const slot = STACK_SLOTS[idx];
              const isCenter = idx === 2;
              const isHovered = hoveredCardId === member.id;

              return (
                <div
                  key={`${member.id}-${idx}`}
                  onClick={() => setIsStackOpen(!isStackOpen)}
                  onMouseEnter={() => setHoveredCardId(member.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    zIndex: isHovered ? 50 : slot.zIndex,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className={`absolute w-[235px] lg:w-[255px] h-[340px] rounded-[26px] p-5 flex flex-col justify-between cursor-pointer transition-all duration-500 shadow-xl border ${
                    isCenter ? "bg-[#191817] text-[#faf7f2] border-stone-700/80 shadow-2xl" : "bg-[#f6f1e9] text-stone-900 border-stone-300/90"
                  } ${isStackOpen ? slot.fanned : slot.collapsed} ${isHovered && isStackOpen ? "!-translate-y-4 !scale-[1.04]" : ""}`}
                >
                  <div className="flex items-center justify-between min-h-[28px]">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isCenter ? "bg-white/10 text-amber-200" : "bg-[#8b3a3a]/10 text-[#8b3a3a]"}`}>
                      {member.team}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-300 ${
                      isHovered ? (isCenter ? "bg-[#faf7f2] text-[#191817] opacity-100 scale-100" : "bg-[#191817] text-[#faf7f2] opacity-100 scale-100") : (isCenter && isStackOpen ? "bg-white/15 text-white opacity-90" : "opacity-0 scale-90")
                    }`}>
                      {member.badge}
                    </span>
                  </div>
                  <div className="my-auto py-1">
                    <EditorialAvatar variant={member.variant} dark={isCenter} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[11px] font-medium ${isCenter ? "text-stone-400" : "text-stone-500"}`}>{member.role}</p>
                    <h4 className={`font-serif text-lg font-bold leading-snug mt-0.5 ${isCenter ? "text-white" : "text-[#191817]"}`}>{member.name}</h4>
                    <p className={`text-[11.5px] leading-relaxed mt-1.5 line-clamp-3 ${isCenter ? "text-stone-300" : "text-stone-600"}`}>{member.bio}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:flex items-center justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsStackOpen(!isStackOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-300/90 shadow-sm text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
            >
              <Users className="w-3.5 h-3.5 text-[#8b3a3a]" />
              <span>{isStackOpen ? "Collapse Stack" : "Fan Out Editorial Stack"}</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsStackOpen(false); setTimeout(() => setIsStackOpen(true), 220); }}
              title="Replay Fan Animation"
              className="p-2 rounded-full bg-white border border-stone-300/90 shadow-sm text-stone-600 hover:text-[#8b3a3a] hover:bg-stone-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8b3a3a]">संपादक • Student Editor</span>
            </div>
            <div className="rounded-[26px] bg-[#191817] text-[#faf7f2] p-6 shadow-xl border border-stone-700 flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0">
                <EditorialAvatar variant={1} dark={true} />
              </div>
              <div className="text-center sm:text-left">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 mb-2">
                  Editor (संपादक)
                </span>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {EDITORIAL_LEADERSHIP.editor.name}
                </h3>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  {EDITORIAL_LEADERSHIP.editor.bio}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {TEAM_GROUPS.map((group) => {
              const IconComponent = group.icon;
              const isTeamFanned = expandedTeamId === group.id;

              return (
                <div
                  key={group.id}
                  onMouseEnter={() => setExpandedTeamId(group.id)}
                  onClick={() => setExpandedTeamId(isTeamFanned ? null : group.id)}
                  className={`rounded-3xl bg-gradient-to-br ${group.bgTint} border border-stone-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: group.accent }}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-stone-500 block">{group.hindiTitle}</span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#233862]">{group.teamName}</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-stone-700 border border-stone-200 shrink-0">
                      {group.members.length} Coordinators
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {group.members.map((member, mIdx) => (
                      <div
                        key={member.id}
                        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                        className={`group relative rounded-[22px] bg-white/95 border border-stone-200/90 p-5 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between ${
                          isTeamFanned ? (mIdx === 0 ? "sm:-rotate-[2deg] sm:-translate-y-1 hover:!rotate-0 hover:!-translate-y-2.5" : "sm:rotate-[2deg] sm:-translate-y-1 hover:!rotate-0 hover:!-translate-y-2.5") : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">समन्वयक</span>
                          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full text-white opacity-90 group-hover:opacity-100 transition" style={{ backgroundColor: group.accent }}>
                            {member.badge}
                          </span>
                        </div>
                        <div className="my-3 transform group-hover:scale-105 transition-transform duration-300">
                          <EditorialAvatar variant={member.variant} dark={false} />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-[11px] font-semibold" style={{ color: group.accent }}>{member.role}</p>
                          <h4 className="font-serif text-lg font-bold text-stone-900 mt-0.5">{member.name}</h4>
                          <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{member.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialBoard;