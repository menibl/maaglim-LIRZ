export type DayOfWeek = "שישי";

export type ActivityCategory =
  | "technology"
  | "sports"
  | "arts"
  | "sciences"
  | "music"
  | "enrichment"
  | "culinary";

export interface FridayTimeSlot {
  id: string; // 'slot-1', 'slot-2', 'slot-3'
  slotNumber: 1 | 2 | 3;
  label: string; // 'משבצת 1', 'משבצת 2', 'משבצת 3'
  startTime: string; // '08:30'
  endTime: string; // '09:30'
}

export interface Coordinator {
  name: string;
  role: string;
  phone: string;
  email: string;
  receptionHours: string;
  whatsapp?: string;
  location?: string;
  notes?: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  symbol: string; // סמל מוסד
  academicYear: string;
  coordinator: Coordinator;
  registrationDeadline: string;
  isOpenForRegistration: boolean;
  announcement?: string;
  maxCapacityPerActivity?: number; // ברירת מחדל 20
  fridaySlots: FridayTimeSlot[]; // 3 משבצות יום שישי
  fixedProgramCost?: number; // עלות קבועה ואחידה לכל 3 החוגים
  adminPasswordHash?: string; // סיסמת כניסה למנהל
  logoUrl?: string; // לוגו מותאם אישית (תמונה / קובץ)
}

export interface Student {
  id: string; // ת.ז. / מזהה ייחודי
  firstName: string;
  lastName: string;
  grade: string; // כיתה (א'1, ב'2, ג'1...)
  gradeLayer: string; // שכבה (א', ב', ג', ד', ה', ו')
  gender?: "זכר" | "נקבה" | "אחר";
  isAuthorized: boolean; // סטטוס אישור הרשמה
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  settlement?: string; // יישוב מגורים בחבל מודיעין
  specialNotes?: string;
  schoolId?: string; // מזהה בית הספר (yitzhak-navon, lapid, ben-shemen)
  schoolName?: string; // שם בית הספר (לדוגמה: בית ספר יצחק נבון)
}

export interface Activity {
  id: string; // מזהה חוג
  name: string;
  category: ActivityCategory;
  allowedGrades: string[]; // שכבות גיל מותרות (לדוגמה ["א", "ב", "ג"] או ["ד", "ה", "ו"])
  day: DayOfWeek; // תמיד שישי
  slotNumber: 1 | 2 | 3; // משבצת זמן (1, 2, או 3)
  startTime: string; // "08:30"
  endTime: string; // "09:30"
  location: string; // מיקום / חדר / בית ספר
  instructor: string; // שם המדריך/ה
  instructorPhone?: string;
  maxCapacity: number; // מכסת מקסימום (ברירת מחדל 20)
  minCapacity: number; // מכסת מינימום לפתיחה
  description: string; // תיאור החוג
  imageUrl?: string; // תמונת החוג (ניתנת לעריכה ע"י מנהל)
  status: "active" | "cancelled" | "pending_min";
}

export interface Registration {
  id: string;
  timestamp: string; // חותמת זמן
  studentId: string;
  studentName: string;
  studentGrade: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  // בחירת חוגים לפי 3 המשבצות של יום שישי
  slot1Choice: string; // מזהה חוג משבצת 1 (08:30-09:30)
  slot1Backup?: string; // מזהה חוג חלופי משבצת 1
  slot2Choice: string; // מזהה חוג משבצת 2 (10:30-11:30)
  slot2Backup?: string; // מזהה חוג חלופי משבצת 2
  slot3Choice: string; // מזהה חוג משבצת 3 (11:30-12:30)
  slot3Backup?: string; // מזהה חוג חלופי משבצת 3
  notes?: string;
}

export type PlacementStatus =
  "placed" | "waitlist" | "unplaced" | "rejected" | "pending";

export interface Placement {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  slotNumber: 1 | 2 | 3;
  placedActivityId: string | null;
  status: PlacementStatus;
  priorityAchieved: 1 | 2 | null; // בחירה ראשית (1) או חלופית (2)
  waitlistPosition?: number;
  waitlistActivityId?: string;
  placementNotes: string;
  placedAt: string;
  isManualOverride: boolean;
}

export interface AlgorithmConfig {
  strategy: "first_come" | "lottery"; // כל הקודם זוכה vs הגרלה הוגנת
  autoWaitlist: boolean;
  minCapacityEnforcement: "warn" | "cancel";
}

export interface PlacementExecutionLog {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface PlacementSummary {
  totalEligible: number;
  totalRegistered: number;
  fullyPlacedStudentsCount: number; // כמה תלמידים שובצו לכל 3 החוגים
  totalPlacementsCount: number;
  priority1Count: number;
  priority2Count: number;
  waitlistCount: number;
  unplacedSlotsCount: number;
  underMinQuotaCount: number;
  placementRate: number;
}

export interface ActivityEnrollmentStats {
  activityId: string;
  activityName: string;
  slotNumber: 1 | 2 | 3;
  startTime: string;
  endTime: string;
  location: string;
  placedCount: number;
  maxCapacity: number;
  minCapacity: number;
  waitlistCount: number;
  fillRate: number;
  isUnderMin: boolean;
  isFull: boolean;
}

export type ActiveTab =
  | "overview"
  | "coordinators"
  | "activities"
  | "students"
  | "registrations"
  | "placements"
  | "alerts"
  | "sheets_integration"
  | "settings";
