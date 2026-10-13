import type { Maqam, MaqamRegion } from "@/data/maqams";

export type ContentRegion = MaqamRegion;

export type DbMaqam = Maqam & {
  createdFromRequestId?: string | null;
  status: "published" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type DbUroos = {
  id: string;
  title: string;
  malayalamTitle?: string;
  maqamId?: string | null; // Connected Maqam ID, or null if standalone
  isStandalone: boolean; // true if standalone page, false if connected to a maqam
  restingPerson?: string;
  hijriMonth: number; // 1-12
  hijriMonthName: string;
  hijriDay: number;
  gregorianDate?: string;
  recurrence?: string;
  venueName?: string;
  city: string;
  state?: string;
  country: string;
  region?: ContentRegion;
  description: string;
  history?: string;
  significance?: string;
  programSchedule?: {
    time: string;
    event: string;
    description?: string;
  }[];
  nerchaOfferings?: string;
  howToReach?: {
    mode: string;
    details: string;
  }[];
  organizerName?: string;
  organizerContact?: string;
  coverImage?: string;
  sourceUrl?: string;
  createdFromRequestId?: string | null;
  status: "published" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type PageAllotment = {
  id: string;
  userId: string;
  userEmail: string;
  targetType: "maqam" | "uroos";
  targetId: string;
  targetTitle: string;
  assignedBy: string;
  assignedByEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SystemUser = {
  id: string;
  userId: string;
  userEmail: string;
  role: "super_admin" | "admin" | "user";
  displayName: string;
  createdAt: string;
};
