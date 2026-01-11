export interface MeetingPlan {
  meetingNumber: number;
  objectiveMode: 'manual' | 'auto';
  objectiveText: string;
  pedagogy: string;
}

export interface FormData {
  schoolName: string;
  headmasterName: string;      // New: Nama Kepala Sekolah
  headmasterNuptk: string;     // New: NUPTK Kepala Sekolah
  teacherName: string;
  teacherNuptk: string;        // New: NUPTK Guru
  subject: string;
  phase: string;
  className: string;
  semester: string;
  topic: string;
  timeAllocation: string;
  meetingCount: number;
  academicYear: string;
  cpMode: 'auto' | 'manual';
  cpText: string;
  graduateProfile: string[];
  meetings: MeetingPlan[];
}

export interface GeneratedResponse {
  sectionA_Identity: string;
  sectionB_Identification: string;
  sectionC_Design: string;
  sectionD_LearningExperience: string;
  sectionE_Assessment: string;
  sectionF_LKPD: string;
}

export const INITIAL_FORM_DATA: FormData = {
  schoolName: "SMK Analis Kesehatan Jember",
  headmasterName: "",
  headmasterNuptk: "",
  teacherName: "",
  teacherNuptk: "",
  subject: "",
  phase: "E",
  className: "X",
  semester: "Ganjil",
  topic: "",
  timeAllocation: "2 x 45 menit",
  meetingCount: 2,
  academicYear: "2025/2026",
  cpMode: 'auto',
  cpText: '',
  graduateProfile: [],
  meetings: [
    { meetingNumber: 1, objectiveMode: 'auto', objectiveText: '', pedagogy: 'Discovery Learning' },
    { meetingNumber: 2, objectiveMode: 'auto', objectiveText: '', pedagogy: 'Discovery Learning' }
  ]
};

export const GRADUATE_PROFILES = [
  "Keimanan dan Ketakwaan",
  "Penalaran Kritis",
  "Kolaborasi",
  "Kesehatan",
  "Kewargaan",
  "Kreativitas",
  "Kemandirian",
  "Komunikasi"
];

export const PEDAGOGY_OPTIONS = [
  "Discovery Learning",
  "Problem Based Learning (PBL)",
  "Project Based Learning (PjBL)",
  "Game Based Learning",
  "Station Learning"
];