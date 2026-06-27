export interface Internship {
  id: string;
  name: string;
  organization: string;
  duration: string;
  startDate: string;
  endDate: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  stipend: string;
  mode: 'online' | 'offline' | 'hybrid';
  areaRequired: string;
  eligibility: string;
  requiredDocuments: string[]; // e.g. ["Resume/CV", "SOP", "Transcript"]
  applyLink: string;
  sourceUrl?: string;
  status: 'Open' | 'Closing Soon' | 'Upcoming' | 'Closed';
  navigationGuideline?: string;
  officialAdvertisementUrl?: string;
  deadlineSource?: string;
  isVerified?: boolean;
  lastVerified?: string;
  confidenceScore?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  availableDocuments: {
    [key: string]: boolean; // documentName -> present
  };
}

export interface TrackedInternship {
  id: string; // matches Internship.id or custom
  userId: string;
  internshipId: string;
  addedAt: string;
  notes?: string;
  isApplied: boolean;
  remindersEnabled?: boolean;
}

export interface ActionPlanStep {
  day: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
}

export interface ActionPlan {
  internshipId: string;
  userId: string;
  steps: ActionPlanStep[];
  recommendation: string;
  createdAt: string;
}
