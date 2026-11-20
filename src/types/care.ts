export type TherapyModality =
  | 'CBT'
  | 'ACT'
  | 'DBT'
  | 'Somatic'
  | 'CBT-I'
  | 'Mindfulness';

export type AssignmentStatus = 'draft' | 'walkthrough' | 'pushed' | 'completed';

export type UserRole = 'clinician' | 'client';

export type ActiveTab = 'overview' | 'clinician' | 'client' | 'resources';

export interface ClinicianProfile {
  id: string;
  name: string;
  credentials: string;
  practiceName: string;
  city: string;
  avatarUrl: string;
  specialtyFocus?: string;
}

export interface ProgressPoint {
  weekLabel: string;
  completionRate: number;
  moodScore: number;
  submittedDate: string;
}

export interface ClientProfile {
  id: string;
  clinicianId: string;
  name: string;
  preferredName: string;
  primaryFocus: string;
  modality: TherapyModality;
  sessionNumber: number;
  nextSessionDate: string;
  accessPin: string;
  weeklyProgress: ProgressPoint[];
}

export interface HomeworkTask {
  id: string;
  title: string;
  instruction: string;
  frequency: string;
  promptQuestion: string;
  completed: boolean;
  reflectionResponse: string;
  completedAt?: string;
}

export interface PracticeBlockSchedule {
  startDate: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  repeat: 'once' | '3x-week' | 'daily';
  reminderMinutes: number;
}

export interface HomeworkAssignment {
  id: string;
  clientId: string;
  title: string;
  modality: TherapyModality;
  clinicalRationale: string;
  walkthroughNotes: string;
  estimatedMinutes: number;
  status: AssignmentStatus;
  uniqueToken: string;
  createdAt: string;
  pushedAt?: string;
  submittedAt?: string;
  moodRating?: number;
  difficultyRating?: number;
  overallReflection?: string;
  clinicianFeedback?: string;
  practiceSchedule?: PracticeBlockSchedule;
  tasks: HomeworkTask[];
}

export interface ResourceSection {
  heading: string;
  body: string;
}

export interface ResourceTemplateTask {
  title: string;
  instruction: string;
  frequency: string;
  promptQuestion: string;
}

export interface ResourceItem {
  id: string;
  kind: 'education' | 'template';
  title: string;
  modality: TherapyModality;
  readMinutes: number;
  summary: string;
  audience: string;
  imageUrl?: string;
  sections: ResourceSection[];
  templateTasks?: ResourceTemplateTask[];
}

export interface WorkspacePayload {
  clinician: ClinicianProfile;
  clinicians: ClinicianProfile[];
  clients: ClientProfile[];
  assignments: HomeworkAssignment[];
  resources: ResourceItem[];
}
