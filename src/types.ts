export interface TreatmentPlan {
  diagnosis: string;
  shortTermGoals: string[];
  longTermGoals: string[];
  recommendedActivities: string[];
  receptiveStrategies: string[];
  expressiveStrategies: string[];
  behavioralTips: string[];
  suggestedSessionFrequency: string;
}

export interface ChildCase {
  id: string;
  name: string;
  age: number;
  caseType: string;
  commLevel: string;
  behaviorNotes: string;
  selectedSymptoms: string[];
  createdAt: string;
  plan?: TreatmentPlan;
}

export interface Appointment {
  id: string;
  parentName: string;
  childName: string;
  phone: string;
  date: string;
  timeSlot: string;
  caseType: string;
  status: "pending" | "confirmed";
  createdAt: string;
}

export interface LibraryExercise {
  id: string;
  title: string;
  category: "speech" | "behavior" | "special_ed";
  objective: string;
  steps: string[];
  targetAge: string;
  materials: string[];
}
