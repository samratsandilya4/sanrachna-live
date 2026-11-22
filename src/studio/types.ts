export type StudioTab =
  | 'submissions'
  | 'toc'
  | 'announcements'
  | 'analytics'
  | 'controls';

export type StudioTheme = 'parchment' | 'espresso';

export type ViewMode = 'split' | 'kanban' | 'gallery';

export type PrintMode =
  | 'none'
  | 'certificate'
  | 'author_card'
  | 'shortlist';

export type SubmissionStatus =
  | 'Received'
  | 'Read'
  | 'Under Review'
  | 'Edited'
  | 'Reviewed'
  | 'Revision Needed'
  | 'Published';

export interface EditorialScores {
  originality: number;
  themeZero: number;
  craft: number;
}

export interface PrePressChecklist {
  plagiarismChecked: boolean;
  grammarProofed: boolean;
  highResMediaOk: boolean;
  layoutReady: boolean;
}

export interface ActivityEntry {
  id: string;
  action: string;
  by: string;
  at: string;
}

export interface SubmissionRow {
  reference_id: string;
  submission_category: string;
  contributed_by: string;
  full_name: string;
  email: string;
  parent_name: string;
  semester_class: string | null;
  id_number: string;
  designation: string | null;
  institution_name: string;
  phone: string;
  author_photo_url: string;
  title_description: string;
  submission_type: string;
  content_file_1_url: string;
  content_file_2_url: string | null;
  status: string;
  editorial_note: string | null;
  internal_note?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SubmissionMetaLocal {
  scores: EditorialScores;
  checklist: PrePressChecklist;
  tocOrder: number | null;
  activity: ActivityEntry[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  tag: 'Notice' | 'Deadline' | 'Event' | 'Urgent';
  display_type: 'both' | 'notice' | 'ticker';
  is_active: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface LiveToast {
  id: string;
  title: string;
  subtitle: string;
  tone: 'gold' | 'emerald' | 'maroon';
}