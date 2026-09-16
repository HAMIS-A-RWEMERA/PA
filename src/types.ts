export type TaskColor = 'default' | 'coral' | 'amber' | 'sage' | 'dusk' | 'lavender' | 'slate';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  description: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  goalId?: string | null;
  reflection?: string | null;
  skills?: string[];
  date?: string;
  pinned?: boolean;
  color?: TaskColor;
  subtasks?: Subtask[];
  tags?: string[];
  isArchived?: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  goalDescription: string;
  target: string;
  date?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  startTime: any;
  endTime?: any;
}

export interface CVExperience {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  achievements?: string[];
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  honors?: string;
}

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface CVSkillCategory {
  category: string;
  skills: string[];
}

export interface CVProject {
  id: string;
  title: string;
  role?: string;
  description: string;
  techStack: string[];
  url?: string;
}

export interface CVProfile {
  id?: string;
  userId: string;
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  certifications: CVCertification[];
  skillCategories: CVSkillCategory[];
  projects: CVProject[];
  updatedAt?: any;
}

export type GalleryCategory = 'Milestones' | 'Certificates & Awards' | 'Work & Projects' | 'Personal' | 'Other';

export interface GalleryPhoto {
  id: string;
  userId: string;
  title: string;
  caption?: string;
  category: GalleryCategory;
  date: string;
  imageUrl: string;
  createdAt?: any;
}

export const KEEP_COLORS: { id: TaskColor; name: string; bg: string; border: string; accent: string; dot: string }[] = [
  { id: 'default', name: 'Default', bg: 'bg-[#18223A]', border: 'border-[#1E293B]', accent: '#7C5CFC', dot: '#1E293B' },
  { id: 'coral', name: 'Coral Rose', bg: 'bg-[#2B141C]', border: 'border-[#FB7185]/40', accent: '#FB7185', dot: '#FB7185' },
  { id: 'amber', name: 'Warm Amber', bg: 'bg-[#291C0E]', border: 'border-[#FBBF24]/40', accent: '#FBBF24', dot: '#FBBF24' },
  { id: 'sage', name: 'Sage Green', bg: 'bg-[#11261D]', border: 'border-[#34D399]/40', accent: '#34D399', dot: '#34D399' },
  { id: 'dusk', name: 'Dusk Ocean', bg: 'bg-[#102336]', border: 'border-[#38BDF8]/40', accent: '#38BDF8', dot: '#38BDF8' },
  { id: 'lavender', name: 'Lavender', bg: 'bg-[#1F1633]', border: 'border-[#A78BFA]/40', accent: '#A78BFA', dot: '#A78BFA' },
  { id: 'slate', name: 'Slate Steel', bg: 'bg-[#151C28]', border: 'border-[#64748B]/40', accent: '#94A3B8', dot: '#64748B' },
];

export function getKeepColorStyle(colorId?: string) {
  const matched = KEEP_COLORS.find(c => c.id === colorId);
  return matched || KEEP_COLORS[0];
}
