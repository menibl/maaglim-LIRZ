import * as XLSX from "xlsx";
import {
  Student,
  Activity,
  Registration,
  Placement,
  School,
  ActivityCategory,
} from "../types";
import { resolveActivityDisplay } from "../utils/activityResolver";

export const CATEGORY_HEBREW_MAP: Record<ActivityCategory, string> = {
  technology: "טכנולוגיה ומחשבים",
  sports: "ספורט ותנועה",
  arts: "אומנות ויצירה",
  sciences: "מדע וטבע",
  music: "מוזיקה ונגינה",
  culinary: "בישול וקולינריה",
  enrichment: "העשרה ומנהיגות",
};

export const REVERSE_CATEGORY_MAP: Record<string, ActivityCategory> = {
  "טכנולוגיה ומחשבים": "technology",
  טכנולוגיה: "technology",
  מחשבים: "technology",
  רובוטיקה: "technology",
  סייבר: "technology",
  תכנות: "technology",
  technology: "technology",
  "ספורט ותנועה": "sports",
  ספורט: "sports",
  תנועה: "sports",
  כדורגל: "sports",
  כדורסל: "sports",
  sports: "sports",
  "אומנות ויצירה": "arts",
  אומנות: "arts",
  אמנות: "arts",
  יצירה: "arts",
  arts: "arts",
  "מדע וטבע": "sciences",
  מדע: "sciences",
  מדעים: "sciences",
  sciences: "sciences",
  "מוזיקה ונגינה": "music",
  מוזיקה: "music",
  נגינה: "music",
  שירה: "music",
  music: "music",
  "בישול וקולינריה": "culinary",
  בישול: "culinary",
  קולינריה: "culinary",
  אפייה: "culinary",
  culinary: "culinary",
  "העשרה ומנהיגות": "enrichment",
  העשרה: "enrichment",
  מנהיגות: "enrichment",
  שחמט: "enrichment",
  enrichment: "enrichment",
};

export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = "Sheet1",
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Exports full detailed activities list formatted for easy Excel editing and re-upload.
 */
export function exportActivitiesToExcel(
  activities: Activity[],
  schoolName: string = "בית_ספר",
) {
  const activitiesData = activities.map((a) => ({
    "מזהה חוג": a.id,
    "שם החוג": a.name,
    "תיאור החוג": a.description || "",
    "משבצת זמן (1/2/3)": a.slotNumber || 1,
    "מועד החוג":
      a.startTime?.includes("שעה")
        ? a.startTime
        : a.slotNumber === 1
          ? "שעה ראשונה"
          : a.slotNumber === 2
            ? "שעה שניה"
            : "שעה שלישית",
    "שעת התחלה":
      a.startTime?.includes("שעה")
        ? a.startTime
        : a.slotNumber === 1
          ? "שעה ראשונה"
          : a.slotNumber === 2
            ? "שעה שניה"
            : "שעה שלישית",
    "שעת סיום": "",
    "שכבות גיל מותרות (לדוגמה: א,ב,ג או א-ו)": Array.isArray(a.allowedGrades)
      ? a.allowedGrades.join(",")
      : a.allowedGrades,
    קטגוריה: CATEGORY_HEBREW_MAP[a.category] || a.category,
    "מיקום / מוקד / בית ספר": a.location || "",
    "מדריך / מפעיל": a.instructor || "",
    "טלפון מדריך": a.instructorPhone || "",
    "מכסת מקסימום": a.maxCapacity || 20,
    "מכסת מינימום": a.minCapacity || 8,
    "סטטוס פעילות":
      a.status === "active"
        ? "פעיל"
        : a.status === "cancelled"
          ? "מבוטל"
          : "בהמתנה",
    "קישור לתמונה": a.imageUrl || "",
  }));

  const ws = XLSX.utils.json_to_sheet(activitiesData);

  // Set generous column widths
  ws["!cols"] = [
    { wch: 14 }, // מזהה חוג
    { wch: 28 }, // שם החוג
    { wch: 45 }, // תיאור החוג
    { wch: 16 }, // משבצת זמן
    { wch: 12 }, // שעת התחלה
    { wch: 12 }, // שעת סיום
    { wch: 32 }, // שכבות גיל מותרות
    { wch: 20 }, // קטגוריה
    { wch: 30 }, // מיקום / מוקד
    { wch: 18 }, // מדריך
    { wch: 15 }, // טלפון מדריך
    { wch: 14 }, // מכסת מקסימום
    { wch: 14 }, // מכסת מינימום
    { wch: 14 }, // סטטוס פעילות
    { wch: 40 }, // קישור לתמונה
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "חוגי_שישי_לעריכה");

  const cleanSchoolName = schoolName
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim();
  XLSX.writeFile(wb, `חוגי_שישי_${cleanSchoolName || "מעגלים"}_לעריכה.xlsx`);
}

/**
 * Exports eligible students list formatted for easy Excel editing and re-upload.
 */
export function exportStudentsToExcel(
  students: Student[],
  schoolName: string = "בית_ספר",
) {
  const studentsData = students.map((s) => ({
    "תעודת זהות": s.id,
    "שם פרטי": s.firstName,
    "שם משפחה": s.lastName,
    "בית ספר": s.schoolName || schoolName,
    כיתה: s.grade,
    שכבה: s.gradeLayer,
    "סטטוס אישור הרשמה": s.isAuthorized ? "מאושר" : "לא מאושר",
    "שם הורה": s.parentName || "",
    "טלפון הורה": s.parentPhone || "",
    'דוא"ל הורה': s.parentEmail || "",
    יישוב: s.settlement || "",
    "הערות מיוחדות": s.specialNotes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(studentsData);
  ws["!cols"] = [
    { wch: 15 }, // תעודת זהות
    { wch: 15 }, // שם פרטי
    { wch: 15 }, // שם משפחה
    { wch: 22 }, // בית ספר
    { wch: 10 }, // כיתה
    { wch: 10 }, // שכבה
    { wch: 18 }, // סטטוס אישור
    { wch: 18 }, // שם הורה
    { wch: 16 }, // טלפון הורה
    { wch: 25 }, // דוא"ל הורה
    { wch: 15 }, // יישוב
    { wch: 30 }, // הערות מיוחדות
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "תלמידים_זכאים");

  const cleanSchoolName = schoolName
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim();
  XLSX.writeFile(
    wb,
    `תלמידים_זכאים_${cleanSchoolName || "מעגלים"}_לעריכה.xlsx`,
  );
}

export function exportFullSchoolWorkbook(
  school: School,
  students: Student[],
  activities: Activity[],
  registrations: Registration[],
  placements: Placement[],
) {
  const wb = XLSX.utils.book_new();

  // 1. Eligible_Students
  const studentsData = students.map((s) => ({
    "תעודת זהות": s.id,
    "שם פרטי": s.firstName,
    "שם משפחה": s.lastName,
    כיתה: s.grade,
    שכבה: s.gradeLayer,
    "סטטוס אישור הרשמה": s.isAuthorized ? "מאושר" : "לא מאושר",
    "שם הורה": s.parentName || "",
    "טלפון הורה": s.parentPhone || "",
    'דוא"ל הורה': s.parentEmail || "",
    יישוב: s.settlement || "",
    "הערות מיוחדות": s.specialNotes || "",
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentsData);
  XLSX.utils.book_append_sheet(wb, wsStudents, "Eligible_Students");

  // 2. Activities (Friday Slots)
  const activitiesData = activities.map((a) => ({
    "מזהה חוג": a.id,
    "שם החוג": a.name,
    "משבצת יום שישי":
      a.slotNumber === 1
        ? "שעה ראשונה"
        : a.slotNumber === 2
          ? "שעה שניה"
          : "שעה שלישית",
    קטגוריה: CATEGORY_HEBREW_MAP[a.category] || a.category,
    "שכבות גיל מותרות": a.allowedGrades.join(","),
    "יום בשבוע": "שישי",
    "מועד החוג":
      a.startTime?.includes("שעה")
        ? a.startTime
        : a.slotNumber === 1
          ? "שעה ראשונה"
          : a.slotNumber === 2
            ? "שעה שניה"
            : "שעה שלישית",
    "שעת התחלה":
      a.startTime?.includes("שעה")
        ? a.startTime
        : a.slotNumber === 1
          ? "שעה ראשונה"
          : a.slotNumber === 2
            ? "שעה שניה"
            : "שעה שלישית",
    "שעת סיום": "",
    "מיקום / מוקד": a.location,
    "מדריך / מפעיל": a.instructor,
    "טלפון מדריך": a.instructorPhone || "",
    "מכסת מקסימום": a.maxCapacity || 20,
    "מכסת מינימום": a.minCapacity || 8,
    סטטוס:
      a.status === "active"
        ? "פעיל"
        : a.status === "cancelled"
          ? "מבוטל"
          : "בהמתנה",
    "קישור לתמונה": a.imageUrl || "",
    "תיאור החוג": a.description,
  }));
  const wsActivities = XLSX.utils.json_to_sheet(activitiesData);
  XLSX.utils.book_append_sheet(wb, wsActivities, "Activities");

  // 3. Registrations (3 Friday Slots)
  const registrationsData = registrations.map((r) => {
    const s1Main = resolveActivityDisplay(r.slot1Choice, activities).name;
    const s1Back = r.slot1Backup
      ? resolveActivityDisplay(r.slot1Backup, activities).name
      : "-";
    const s2Main = resolveActivityDisplay(r.slot2Choice, activities).name;
    const s2Back = r.slot2Backup
      ? resolveActivityDisplay(r.slot2Backup, activities).name
      : "-";
    const s3Main = resolveActivityDisplay(r.slot3Choice, activities).name;
    const s3Back = r.slot3Backup
      ? resolveActivityDisplay(r.slot3Backup, activities).name
      : "-";

    return {
      "מזהה רישום": r.id,
      "חותמת זמן": new Date(r.timestamp).toLocaleString("he-IL"),
      "תעודת זהות תלמיד": r.studentId,
      "שם תלמיד": r.studentName,
      כיתה: r.studentGrade,
      "שם הורה": r.parentName,
      "טלפון הורה": r.parentPhone,
      'דוא"ל הורה': r.parentEmail,
      "משבצת 1 - חוג עיקרי": s1Main,
      "משבצת 1 - חוג חלופי": s1Back,
      "משבצת 2 - חוג עיקרי": s2Main,
      "משבצת 2 - חוג חלופי": s2Back,
      "משבצת 3 - חוג עיקרי": s3Main,
      "משבצת 3 - חוג חלופי": s3Back,
      "הערות הורה": r.notes || "",
    };
  });
  const wsRegistrations = XLSX.utils.json_to_sheet(registrationsData);
  XLSX.utils.book_append_sheet(wb, wsRegistrations, "Registrations");

  // 4. Placements
  const placementsData = placements.map((p) => {
    const act = p.placedActivityId
      ? resolveActivityDisplay(p.placedActivityId, activities).name
      : "לא שובץ";
    const statusHeb =
      p.status === "placed"
        ? "שובץ בהצלחה"
        : p.status === "waitlist"
          ? "רשימת המתנה"
          : p.status === "rejected"
            ? "אי-זכאות/נדחה"
            : "לא שובץ";
    return {
      "תעודת זהות": p.studentId,
      "שם מלא": p.studentName,
      כיתה: p.grade,
      "משבצת זמן": `משבצת ${p.slotNumber || 1}`,
      "חוג משובץ": act,
      סטטוס: statusHeb,
      "עדיפות שהושגה": p.priorityAchieved
        ? `עדיפות ${p.priorityAchieved}`
        : "-",
      "מיקום ברשימת המתנה": p.waitlistPosition || "-",
      "הערות שיבוץ": p.placementNotes,
      "שונה ידנית": p.isManualOverride ? "כן" : "לא",
    };
  });
  const wsPlacements = XLSX.utils.json_to_sheet(placementsData);
  XLSX.utils.book_append_sheet(wb, wsPlacements, "Placements");

  const cleanSchoolName = school.name
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim();
  XLSX.writeFile(wb, `דוח_שיבוץ_חוגי_שישי_${cleanSchoolName}.xlsx`);
}

export function downloadStudentTemplate() {
  const sample = [
    {
      "תעודת זהות": "201234567",
      "שם פרטי": "איתי",
      "שם משפחה": "ישראלי",
      "בית ספר": "בית ספר של העתיד יצחק נבון",
      כיתה: "א'1",
      שכבה: "א",
      "סטטוס אישור הרשמה": "מאושר",
      "שם הורה": "דנה ישראלי",
      "טלפון הורה": "050-1234567",
      'דוא"ל הורה': "dana@example.com",
      יישוב: "שוהם",
      "הערות מיוחדות": "",
    },
    {
      "תעודת זהות": "309876543",
      "שם פרטי": "מאיה",
      "שם משפחה": "כהן",
      "בית ספר": 'בית ספר של העתיד לפיד ה מ"ה',
      כיתה: "ב'2",
      שכבה: "ב",
      "סטטוס אישור הרשמה": "מאושר",
      "שם הורה": "יוסי כהן",
      "טלפון הורה": "052-7654321",
      'דוא"ל הורה': "yossi@example.com",
      יישוב: "לפיד",
      "הערות מיוחדות": "",
    },
    {
      "תעודת זהות": "408765432",
      "שם פרטי": "דניאל",
      "שם משפחה": "לוי",
      "בית ספר": "בית ספר בן שמן",
      כיתה: "ג'1",
      שכבה: "ג",
      "סטטוס אישור הרשמה": "מאושר",
      "שם הורה": "רונית לוי",
      "טלפון הורה": "054-1122334",
      'דוא"ל הורה': "ronit@example.com",
      יישוב: "בן שמן",
      "הערות מיוחדות": "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 16 },
    { wch: 15 },
    { wch: 22 },
    { wch: 14 },
    { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Eligible_Students_Template");
  XLSX.writeFile(wb, "תבנית_קובץ_תלמידים_זכאים.xlsx");
}

export function downloadActivityTemplate() {
  const sample = [
    {
      "מזהה חוג": "ACT-101",
      "שם החוג": "בינה מלאכותית, רובוטיקה ולגו",
      "תיאור החוג":
        "לימוד חשיבה תכנותית, בינה מלאכותית, בנייה והפעלת רובוטים אוטונומיים",
      "משבצת זמן (1/2/3)": 1,
      "שעת התחלה": "שעה ראשונה",
      "שעת סיום": "",
      "שכבות גיל מותרות (לדוגמה: א,ב,ג או א-ו)": "א,ב,ג",
      קטגוריה: "טכנולוגיה ומחשבים",
      "מיקום / מוקד / בית ספר": "מעבדת מחשבים - מעגלים",
      "מדריך / מפעיל": "יוסי מזרחי",
      "טלפון מדריך": "050-1234567",
      "מכסת מקסימום": 20,
      "מכסת מינימום": 8,
      "סטטוס פעילות": "פעיל",
      "קישור לתמונה":
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    },
    {
      "מזהה חוג": "ACT-201",
      "שם החוג": "מאסטר שף צעיר ואפייה",
      "תיאור החוג":
        "הכנת מאפים, קינוחים ומנות שף בריאות וחווייתיות ללא שימוש באש גלויה",
      "משבצת זמן (1/2/3)": 2,
      "שעת התחלה": "10:30",
      "שעת סיום": "11:30",
      "שכבות גיל מותרות (לדוגמה: א,ב,ג או א-ו)": "א,ב,ג,ד,ה,ו",
      קטגוריה: "בישול וקולינריה",
      "מיקום / מוקד / בית ספר": "חדר כלכלת בית ומטבח לימודי",
      "מדריך / מפעיל": "מיכל אהרוני",
      "טלפון מדריך": "052-8765432",
      "מכסת מקסימום": 20,
      "מכסת מינימום": 8,
      "סטטוס פעילות": "פעיל",
      "קישור לתמונה":
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
    },
    {
      "מזהה חוג": "ACT-301",
      "שם החוג": "כדורגל ואתלטיקה מקצועית",
      "תיאור החוג":
        "פיתוח קואורדינציה, מיומנויות משחק קבוצתי, טכניקה וכושר גופני מעצים",
      "משבצת זמן (1/2/3)": 3,
      "שעת התחלה": "11:30",
      "שעת סיום": "12:30",
      "שכבות גיל מותרות (לדוגמה: א,ב,ג או א-ו)": "ד,ה,ו",
      קטגוריה: "ספורט ותנועה",
      "מיקום / מוקד / בית ספר": "אולם ספורט מרכזי ומגרש דשא",
      "מדריך / מפעיל": "דני רום",
      "טלפון מדריך": "054-9876543",
      "מכסת מקסימום": 20,
      "מכסת מינימום": 8,
      "סטטוס פעילות": "פעיל",
      "קישור לתמונה":
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 45 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 32 },
    { wch: 20 },
    { wch: 30 },
    { wch: 18 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activities_Template");
  XLSX.writeFile(wb, "תבנית_קובץ_חוגי_שישי.xlsx");
}

/**
 * Normalizes Israeli ID numbers by removing slashes, dashes, spaces, and formatting cleanly.
 * e.g. "22889111/5" -> "228891115", " 22540640-0 " -> "225406400"
 */
export function cleanIsraeliId(raw: any): string {
  if (raw === null || raw === undefined) return "";
  const str = String(raw).trim();
  if (!str) return "";

  // Extract digits
  const digitsOnly = str.replace(/[^\d]/g, "");
  if (digitsOnly.length > 0) {
    return digitsOnly;
  }
  return str;
}

/**
 * Normalizes phone numbers with prefix combinations (e.g. prefix "052", phone "6565576" -> "052-6565576")
 */
function formatPhoneNumber(prefixRaw: any, phoneRaw: any): string {
  const prefix = prefixRaw
    ? String(prefixRaw).trim().replace(/[^\d]/g, "")
    : "";
  const phone = phoneRaw ? String(phoneRaw).trim() : "";

  if (!phone && !prefix) return "";

  if (prefix && phone) {
    // If phone already starts with prefix or full number
    const cleanPhone = phone.replace(/[^\d]/g, "");
    if (
      cleanPhone.startsWith("05") ||
      cleanPhone.startsWith("02") ||
      cleanPhone.startsWith("03") ||
      cleanPhone.startsWith("04") ||
      cleanPhone.startsWith("08") ||
      cleanPhone.startsWith("09") ||
      cleanPhone.startsWith("07")
    ) {
      // Already full phone number
      if (cleanPhone.length === 10 && cleanPhone.startsWith("05")) {
        return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
      }
      return cleanPhone;
    }

    const formattedPrefix = prefix.startsWith("0") ? prefix : `0${prefix}`;
    return `${formattedPrefix}-${cleanPhone}`;
  }

  if (phone) {
    const clean = phone.replace(/[^\d]/g, "");
    if (clean.length === 10 && clean.startsWith("05")) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    if (
      clean.length === 9 &&
      (clean.startsWith("02") ||
        clean.startsWith("03") ||
        clean.startsWith("04") ||
        clean.startsWith("08") ||
        clean.startsWith("09") ||
        clean.startsWith("07"))
    ) {
      return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }
    return phone;
  }

  return prefix;
}

/**
 * Extracts student grade layer and display grade from municipal columns / course names / age / birthdate.
 */
function extractGradeInfo(row: Record<string, any>): {
  grade: string;
  gradeLayer: string;
} {
  // 1. Direct grade column
  const explicitGrade = findFieldValue(row, [
    "כיתה",
    "דרגת כיתה",
    "שכבה",
    "grade",
    "gradeLayer",
    "כיתת לימוד",
  ]);

  // 2. Municipal Course name or group name containing grade (e.g. "כיתה א' חוגי שישי", "כיתה ב' יצחק בן שמן")
  const courseOrGroup = findFieldValue(row, [
    "שם חוג",
    "שם החוג",
    "קבוצה",
    "תיאור קבוצה",
    "מסלול",
    "חוג",
    "פעילות",
    "מסגרת",
  ]);

  const textToScan = `${explicitGrade || ""} ${courseOrGroup || ""}`.trim();

  if (textToScan) {
    if (
      textToScan.includes("כיתה א'") ||
      textToScan.includes("כיתה א") ||
      textToScan.includes("שכבה א'") ||
      textToScan.includes("שכבה א") ||
      textToScan.includes("שכבת א") ||
      textToScan.match(/\bא['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/א['׳]?\s*([1-9])/);
      return { grade: match ? `א'${match[1]}` : "כיתה א'", gradeLayer: "א" };
    }
    if (
      textToScan.includes("כיתה ב'") ||
      textToScan.includes("כיתה ב") ||
      textToScan.includes("שכבה ב'") ||
      textToScan.includes("שכבה ב") ||
      textToScan.includes("שכבת ב") ||
      textToScan.match(/\bב['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/ב['׳]?\s*([1-9])/);
      return { grade: match ? `ב'${match[1]}` : "כיתה ב'", gradeLayer: "ב" };
    }
    if (
      textToScan.includes("כיתה ג'") ||
      textToScan.includes("כיתה ג") ||
      textToScan.includes("שכבה ג'") ||
      textToScan.includes("שכבה ג") ||
      textToScan.includes("שכבת ג") ||
      textToScan.match(/\bג['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/ג['׳]?\s*([1-9])/);
      return { grade: match ? `ג'${match[1]}` : "כיתה ג'", gradeLayer: "ג" };
    }
    if (
      textToScan.includes("כיתה ד'") ||
      textToScan.includes("כיתה ד") ||
      textToScan.includes("שכבה ד'") ||
      textToScan.includes("שכבה ד") ||
      textToScan.includes("שכבת ד") ||
      textToScan.match(/\bד['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/ד['׳]?\s*([1-9])/);
      return { grade: match ? `ד'${match[1]}` : "כיתה ד'", gradeLayer: "ד" };
    }
    if (
      textToScan.includes("כיתה ה'") ||
      textToScan.includes("כיתה ה") ||
      textToScan.includes("שכבה ה'") ||
      textToScan.includes("שכבה ה") ||
      textToScan.includes("שכבת ה") ||
      textToScan.match(/\bה['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/ה['׳]?\s*([1-9])/);
      return { grade: match ? `ה'${match[1]}` : "כיתה ה'", gradeLayer: "ה" };
    }
    if (
      textToScan.includes("כיתה ו'") ||
      textToScan.includes("כיתה ו") ||
      textToScan.includes("שכבה ו'") ||
      textToScan.includes("שכבה ו") ||
      textToScan.includes("שכבת ו") ||
      textToScan.match(/\bו['׳]?[1-9]?\b/)
    ) {
      const match = textToScan.match(/ו['׳]?\s*([1-9])/);
      return { grade: match ? `ו'${match[1]}` : "כיתה ו'", gradeLayer: "ו" };
    }
  }

  // 3. Fallback: Age column (e.g. 6.7, 7.1, 8.5)
  const ageRaw = findFieldValue(row, ["גיל", "age"]);
  if (ageRaw) {
    const age = parseFloat(String(ageRaw).replace(/[^\d.]/g, ""));
    if (!isNaN(age)) {
      if (age < 7.0) return { grade: "כיתה א'", gradeLayer: "א" };
      if (age < 8.0) return { grade: "כיתה ב'", gradeLayer: "ב" };
      if (age < 9.0) return { grade: "כיתה ג'", gradeLayer: "ג" };
      if (age < 10.0) return { grade: "כיתה ד'", gradeLayer: "ד" };
      if (age < 11.0) return { grade: "כיתה ה'", gradeLayer: "ה" };
      return { grade: "כיתה ו'", gradeLayer: "ו" };
    }
  }

  // 4. Fallback: Birthdate
  const birthdateRaw = findFieldValue(row, [
    "תאריך לידה",
    "תאריך_לידה",
    "birthDate",
    "birthdate",
  ]);
  if (birthdateRaw) {
    const strDate = String(birthdateRaw);
    const matchYear = strDate.match(/20(1[5-9]|2[0-5])/);
    if (matchYear) {
      const year = parseInt(matchYear[0], 10);
      // Rough school year matching
      if (year === 2020) return { grade: "כיתה א'", gradeLayer: "א" };
      if (year === 2019) return { grade: "כיתה ב'", gradeLayer: "ב" };
      if (year === 2018) return { grade: "כיתה ג'", gradeLayer: "ג" };
      if (year === 2017) return { grade: "כיתה ד'", gradeLayer: "ד" };
      if (year === 2016) return { grade: "כיתה ה'", gradeLayer: "ה" };
      if (year <= 2015) return { grade: "כיתה ו'", gradeLayer: "ו" };
    }
  }

  return { grade: "כיתה א'", gradeLayer: "א" };
}

/**
 * Flexible field value extractor that checks multiple column header aliases (case-insensitive and partial match)
 */
function findFieldValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);

  // 1. Exact match
  for (const pk of possibleKeys) {
    if (
      row[pk] !== undefined &&
      row[pk] !== null &&
      String(row[pk]).trim() !== ""
    ) {
      return row[pk];
    }
  }

  // 2. Normalized lowercase / trimmed match (stripping spaces, punctuation, quotes, parens, brackets)
  for (const pk of possibleKeys) {
    const cleanPk = pk
      .toLowerCase()
      .replace(/[\s_'"״\.\-\:\/\(\)\[\]\{\}\?\!]/g, "");
    for (const rk of rowKeys) {
      const cleanRk = rk
        .toLowerCase()
        .replace(/[\s_'"״\.\-\:\/\(\)\[\]\{\}\?\!]/g, "");
      if (cleanRk === cleanPk) {
        if (
          row[rk] !== undefined &&
          row[rk] !== null &&
          String(row[rk]).trim() !== ""
        ) {
          return row[rk];
        }
      }
    }
  }

  // 3. Partial inclusion match (only if cleanRk includes cleanPk to avoid false positives like "שם" matching "שם בית ספר")
  for (const pk of possibleKeys) {
    const cleanPk = pk
      .toLowerCase()
      .replace(/[\s_'"״\.\-\:\/\(\)\[\]\{\}\?\!]/g, "");
    if (cleanPk.length < 2) continue;
    // Allow 2-letter Hebrew/English acronyms like "תז", "id", "tz"
    if (cleanPk.length === 2 && !["תז", "id", "tz"].includes(cleanPk)) continue;
    for (const rk of rowKeys) {
      const cleanRk = rk
        .toLowerCase()
        .replace(/[\s_'"״\.\-\:\/\(\)\[\]\{\}\?\!]/g, "");
      if (cleanRk.length >= cleanPk.length && cleanRk.includes(cleanPk)) {
        if (
          row[rk] !== undefined &&
          row[rk] !== null &&
          String(row[rk]).trim() !== ""
        ) {
          return row[rk];
        }
      }
    }
  }

  return undefined;
}

const STUDENT_ID_CANDIDATE_KEYS = [
  "ת.ז",
  "ת.ז.",
  'ת"ז',
  'ת״ז',
  "תז",
  "מס' ת.ז",
  "מס' ת.ז.",
  'מס\' ת"ז',
  'מס\' ת״ז',
  "מס ת.ז",
  "מס ת.ז.",
  'מס ת"ז',
  'מס ת״ז',
  "מס' תז",
  "מס תז",
  "מספר ת.ז",
  "מספר ת.ז.",
  'מספר ת"ז',
  'מספר ת״ז',
  "מספר תז",
  "ת.זהות",
  "ת. זהות",
  "תעודת זהות",
  "מספר תעודת זהות",
  "מס' תעודת זהות",
  "מספר זהות",
  "מס' זהות",
  "מספר זיהוי",
  "מס' זיהוי",
  "מזהה תלמיד",
  "ת.ז תלמיד",
  "ת.ז. תלמיד",
  'ת"ז תלמיד',
  'ת״ז תלמיד',
  "תז תלמיד",
  "תעודת זהות תלמיד",
  "ת.ז ילד",
  "ת.ז. ילד",
  'ת"ז ילד',
  'ת״ז ילד',
  "תז ילד",
  "תעודת זהות ילד",
  "קוד תלמיד",
  "מספר תלמיד",
  "מס' תלמיד",
  "זיהוי תלמיד",
  "studentId",
  "student_id",
  "StudentId",
  "StudentID",
  "Student ID",
  "tz",
  "TZ",
  "national_id",
  "passport",
  "דרכון",
];

/**
 * Robust sheet type detector to distinguish between Activities file and Students file
 */
export function detectSheetType(worksheet: XLSX.WorkSheet): {
  type: "activities" | "students" | "registrations" | "unknown";
  activityScore: number;
  studentScore: number;
  registrationScore: number;
} {
  if (!worksheet) return { type: "unknown", activityScore: 0, studentScore: 0, registrationScore: 0 };

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows || rawRows.length === 0) {
    return { type: "unknown", activityScore: 0, studentScore: 0, registrationScore: 0 };
  }

  let activityScore = 0;
  let studentScore = 0;
  let registrationScore = 0;

  for (let r = 0; r < Math.min(15, rawRows.length); r++) {
    const rowArr = rawRows[r];
    if (!Array.isArray(rowArr)) continue;

    for (const cell of rowArr) {
      const s = String(cell || "").trim().toLowerCase();
      if (!s) continue;

      // Registration indicators (High Priority)
      if (
        s.includes("חוג עיקרי") ||
        s.includes("חוג חלופי") ||
        s.includes("משבצת 1 - חוג") ||
        s.includes("משבצת 2 - חוג") ||
        s.includes("משבצת 3 - חוג") ||
        s.includes("מזהה רישום") ||
        s.includes("תאריך רישום")
      ) {
        registrationScore += 15;
      }
      if (
        s === "נרשמים" ||
        s === "registrations" ||
        s.includes("רישומי הורים") ||
        s.includes("טופס רישום")
      ) {
        registrationScore += 12;
      }

      // Activity indicators
      if (
        s.includes("שם החוג") ||
        s.includes("שם חוג") ||
        s.includes("קוד חוג") ||
        s.includes("מזהה חוג") ||
        s.includes("נושא החוג") ||
        s.includes("שם פעילות")
      ) {
        activityScore += 10;
      }
      if (s.includes("משבצת") || s.includes("slot")) {
        activityScore += 8;
      }
      if (
        s.includes("מדריך") ||
        s.includes("מפעיל") ||
        s.includes("שם המורה") ||
        s.includes("שם מורה") ||
        s.includes("מורה") ||
        s.includes("instructor") ||
        s.includes("teacher")
      ) {
        activityScore += 8;
      }
      if (
        s.includes("שעת התחלה") ||
        s.includes("שעת סיום") ||
        s.includes("שעות פעילות") ||
        s.includes("שעות")
      ) {
        activityScore += 7;
      }
      if (
        s.includes("שכבות גיל מותרות") ||
        s.includes("שכבות גיל") ||
        s.includes("allowedgrades")
      ) {
        activityScore += 7;
      }
      if (
        s.includes("מכסת מקסימום") ||
        s.includes("מכסת מינימום") ||
        s.includes("מכסה") ||
        s.includes("maxcapacity")
      ) {
        activityScore += 6;
      }
      if (s.includes("קטגוריה") || s.includes("category")) {
        activityScore += 5;
      }

      // Student indicators
      if (
        s.includes("תעודת זהות") ||
        s.includes("ת.ז") ||
        s.includes('ת"ז') ||
        s.includes("ת״ז") ||
        s.includes("מספר זהות") ||
        s.includes("מס' זהות") ||
        s.includes("מס' ת.ז")
      ) {
        studentScore += 10;
      }
      if (
        s.includes("שם פרטי") ||
        s.includes("שם משפחה") ||
        s.includes("שם תלמיד") ||
        s.includes("שם הילד") ||
        s.includes("שם התלמיד")
      ) {
        studentScore += 10;
      }
      if (
        s.includes("שם הורה") ||
        s.includes("טלפון הורה") ||
        s.includes("ראש משפחה") ||
        s.includes("איש קשר")
      ) {
        studentScore += 8;
      }
      if (s.includes("סטטוס אישור הרשמה")) {
        studentScore += 8;
      }
      if (
        (s.includes("בית הספר של העתיד") || s.includes("בתי ספר של העתיד")) &&
        !s.includes("מיקום") &&
        !s.includes("מוקד")
      ) {
        studentScore += 6;
      }
    }
  }

  let type: "activities" | "students" | "registrations" | "unknown" = "unknown";
  if (registrationScore >= 12) {
    type = "registrations";
  } else if (studentScore >= 8 && studentScore >= activityScore) {
    type = "students";
  } else if (activityScore >= 8 && activityScore > studentScore) {
    type = "activities";
  } else if (studentScore > 0 && studentScore >= activityScore) {
    type = "students";
  } else if (activityScore > 0) {
    type = "activities";
  }

  return { type, activityScore, studentScore, registrationScore };
}

/**
 * Foolproof Student ID extraction with key aliasing and value-pattern fallback
 */
export function findStudentId(
  row: Record<string, any>,
  rawRow?: any[],
  fallbackIndex?: number,
): string {
  // 1. Try exhaustive header alias list
  const rawId = findFieldValue(row, STUDENT_ID_CANDIDATE_KEYS);
  const clean = cleanIsraeliId(rawId);
  if (clean && clean.length >= 5) {
    return clean;
  }

  // 2. Direct regex scan of all keys in row to find any key mentioning תז / זהות / זיהוי / id
  const rowKeys = Object.keys(row);
  for (const k of rowKeys) {
    if (k.startsWith("__row") || k.startsWith("__header")) continue;
    const cleanK = k.toLowerCase().replace(/[\s_'"״\.\-\:\/\(\)\[\]\{\}\?\!]/g, "");
    if (
      cleanK.includes("תז") ||
      cleanK.includes("זהות") ||
      cleanK.includes("זיהוי") ||
      (cleanK.includes("תלמיד") && (cleanK.includes("מס") || cleanK.includes("קוד"))) ||
      cleanK === "id" ||
      cleanK === "tz" ||
      cleanK.includes("studentid")
    ) {
      const val = cleanIsraeliId(row[k]);
      if (val && val.length >= 5) {
        return val;
      }
    }
  }

  // 3. Check values in rawRow or row for an Israeli ID pattern (7 to 9 digits, not starting with 05 phone prefix)
  const candidateValues = [
    ...(Array.isArray(rawRow) ? rawRow : []),
    ...Object.values(row),
  ];

  // First pass: look specifically for 9-digit numbers (standard Israeli ID) not starting with 05 (phones)
  for (const val of candidateValues) {
    if (val === undefined || val === null) continue;
    const digits = String(val).trim().replace(/[^\d]/g, "");
    if (digits.length === 9 && !digits.startsWith("05")) {
      return digits;
    }
  }

  // Second pass: look for 7-8 digit numbers that are not zip code (e.g. 7325) or house numbers
  for (const val of candidateValues) {
    if (val === undefined || val === null) continue;
    const digits = String(val).trim().replace(/[^\d]/g, "");
    if (
      (digits.length === 7 || digits.length === 8) &&
      !digits.startsWith("05") &&
      digits !== "7325" // Common Modi'in regional zip/code
    ) {
      return digits;
    }
  }

  return "";
}

/**
 * Cleans email address and discards invalid values like single "@" or "0"
 */
function cleanEmail(raw: any): string {
  if (!raw) return "";
  const str = String(raw).trim();
  if (
    !str ||
    str === "@" ||
    str === "0" ||
    str === "-" ||
    !str.includes("@") ||
    str.length < 5
  ) {
    return "";
  }
  return str;
}

/**
 * Helper to normalize grade layer strings (e.g. "א-ג", "א'-ו'", "א,ב,ג", "ד עד ו")
 */
function parseAllowedGrades(raw: string | undefined): string[] {
  if (!raw) return ["א", "ב", "ג", "ד", "ה", "ו"];
  const cleaned = String(raw).replace(/['"״]/g, "").trim();

  if (
    !cleaned ||
    cleaned.includes("כולם") ||
    cleaned.includes("הכל") ||
    cleaned.includes("כל השכבות")
  ) {
    return ["א", "ב", "ג", "ד", "ה", "ו"];
  }

  // Handle ranges like "א-ג", "א - ג", "א עד ג"
  if (
    cleaned.includes("א-ג") ||
    cleaned.includes("א עד ג") ||
    cleaned.includes("א-ג'")
  ) {
    return ["א", "ב", "ג"];
  }
  if (
    cleaned.includes("ד-ו") ||
    cleaned.includes("ד עד ו") ||
    cleaned.includes("ד-ו'")
  ) {
    return ["ד", "ה", "ו"];
  }
  if (cleaned.includes("א-ו") || cleaned.includes("א עד ו")) {
    return ["א", "ב", "ג", "ד", "ה", "ו"];
  }

  // Split by comma, slash, space, semicolon
  const parts = cleaned
    .split(/[,;/+&|\s]+/)
    .map((g) => g.trim())
    .filter(Boolean);
  const result: string[] = [];
  const allPossible = ["א", "ב", "ג", "ד", "ה", "ו"];

  for (const p of parts) {
    const single = p.charAt(0);
    if (allPossible.includes(single) && !result.includes(single)) {
      result.push(single);
    }
  }

  return result.length > 0 ? result : ["א", "ב", "ג", "ד", "ה", "ו"];
}

export const CANONICAL_SCHOOLS = {
  BEN_SHEMEN: { id: "sch-ben-shemen", name: "בית ספר בן שמן" },
  NAVON: { id: "sch-yitzhak-navon", name: "בית ספר יצחק נבון" },
  LAPID: { id: "sch-lapid-hmd", name: 'בית ספר לפיד המ"ד' },
};

export function canonicalizeSchoolId(rawIdOrName: string | undefined): string {
  if (!rawIdOrName) return "sch-ben-shemen";
  const str = String(rawIdOrName).trim();
  if (
    str === "sch-ben-shemen" ||
    str === "sch-yitzhak-navon" ||
    str === "sch-lapid-hmd" ||
    str === "sch-lapid"
  ) {
    return str === "sch-lapid" ? "sch-lapid-hmd" : str;
  }
  const clean = str
    .toLowerCase()
    .replace(/['"״\-_]/g, "")
    .trim();
  if (
    clean.includes("בן שמן") ||
    clean.includes("בןשמן") ||
    clean.includes("benshemen") ||
    clean.includes("shemen")
  ) {
    return "sch-ben-shemen";
  }
  if (clean.includes("נבון") || clean.includes("navon")) {
    return "sch-yitzhak-navon";
  }
  if (
    clean.includes("לפיד") ||
    clean.includes("המה") ||
    clean.includes("המד") ||
    clean.includes("lapid")
  ) {
    return "sch-lapid-hmd";
  }
  if (str === "ben-shemen") return "sch-ben-shemen";
  if (str === "yitzhak-navon") return "sch-yitzhak-navon";
  if (str === "lapid" || str === "sch-lapid") return "sch-lapid-hmd";
  return str.startsWith("sch-") ? str : `sch-${str}`;
}

/**
 * Extracts school info from text, specially handling municipal formats like:
 * - "בית הספר של העתיד (בן שמן)"
 * - "בית הספר של העתיד (יצחק נבון)"
 * - "בית הספר של העתיד (לפיד המ"ה)"
 * - "בית ספר של העתיד (בן שמן)"
 * - "בן שמן", "יצחק נבון", "לפיד המ"ה", "לפיד"
 */
export function extractSchoolFromText(
  rawText: any,
): { schoolId: string; schoolName: string } | null {
  if (rawText === null || rawText === undefined) return null;
  const str = String(rawText).trim();
  if (!str) return null;

  // 1. Extract content inside parentheses if present (e.g. "בית הספר של העתיד (בן שמן )")
  const parenMatch = str.match(/\(([^)]+)\)/);
  const insideParen = parenMatch ? parenMatch[1].trim() : "";

  // Potential candidates to evaluate: text inside parentheses first, then full string
  const candidates = [insideParen, str].filter(Boolean);

  for (const candidate of candidates) {
    const clean = candidate
      .toLowerCase()
      .replace(/['"״\-_]/g, "")
      .trim();

    // Check Ben Shemen (בן שמן)
    if (
      clean.includes("בן שמן") ||
      clean.includes("בןשמן") ||
      clean.includes("benshemen") ||
      clean.includes("shemen") ||
      clean === "בן שמן" ||
      clean === "בןשמן"
    ) {
      return { schoolId: "sch-ben-shemen", schoolName: "בית ספר בן שמן" };
    }

    // Check Yitzhak Navon (יצחק נבון)
    if (
      clean.includes("נבון") ||
      clean.includes("navon") ||
      clean === "יצחק נבון" ||
      clean === "יצחקנבון"
    ) {
      return { schoolId: "sch-yitzhak-navon", schoolName: "בית ספר יצחק נבון" };
    }

    // Check Lapid HaM"H (לפיד המ"ד)
    if (
      clean.includes("לפיד") ||
      clean.includes("המה") ||
      clean.includes("המד") ||
      clean.includes("ה מה") ||
      clean.includes("ה מד") ||
      clean.includes("lapid") ||
      clean === "לפיד"
    ) {
      return { schoolId: "sch-lapid-hmd", schoolName: 'בית ספר לפיד המ"ד' };
    }
  }

  return null;
}

export interface DetectedSchoolResult {
  schoolId: string;
  schoolName: string;
  isExplicitlyDetected: boolean;
  detectionSource?: string;
}

/**
 * Detects target school from row data with strict priority on Column J:
 * 1. Column J (10th column in Excel, index 9): "בית הספר של העתיד (שם בית הספר)"
 * 2. Explicit school column headers matching "בית הספר של העתיד", "שם בית ספר", etc.
 * 3. Any key matching "העתיד" or "בית ספר"
 * 4. All cell values in the student's row
 * 5. Registration / notes / sheet context
 * 6. Fallback school ID
 */
export function detectSchoolFromRow(
  row: Record<string, any>,
  fallbackSchoolId: string = "sch-ben-shemen",
  sheetName?: string,
): DetectedSchoolResult {
  const canonicalFallback = canonicalizeSchoolId(fallbackSchoolId);

  // 1. DIRECT CHECK OF COLUMN J (10th column, index 9)
  // Check raw Column J captured from 2D array:
  if (
    row.__rawColJ !== undefined &&
    row.__rawColJ !== null &&
    String(row.__rawColJ).trim() !== ""
  ) {
    const detected = extractSchoolFromText(row.__rawColJ);
    if (detected) {
      return {
        ...detected,
        isExplicitlyDetected: true,
        detectionSource: "עמודה J",
      };
    }
  }

  // Check common Column J aliases in sheet_to_json:
  const colJCandidates = [row["__EMPTY_9"], row["J"], row["j"]];
  const rowKeys = Object.keys(row);
  if (rowKeys.length > 9) {
    colJCandidates.push(row[rowKeys[9]]);
  }

  for (const val of colJCandidates) {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      const detected = extractSchoolFromText(val);
      if (detected) {
        return {
          ...detected,
          isExplicitlyDetected: true,
          detectionSource: "עמודה J",
        };
      }
    }
  }

  // 2. Direct school column candidates (including "בית הספר של העתיד (שם בית הספר )")
  const explicitSchool = findFieldValue(row, [
    "בית הספר של העתיד (שם בית הספר )",
    "בית הספר של העתיד (שם בית הספר)",
    "בית ספר של העתיד (שם בית ספר)",
    "בית ספר של העתיד (שם בית הספר)",
    "בית הספר של העתיד",
    "בית ספר של העתיד",
    "בתי ספר של העתיד",
    "שם בית ספר",
    "שם בית הספר",
    "בית ספר",
    "בית הספר",
    'שם ביה"ס',
    "שם ביהס",
    'ביה"ס',
    "ביהס",
    'בי"ס',
    'שם בי"ס',
    "מוסד",
    "שם מוסד",
    "מוסד לימודים",
    "שם מסגרת",
    "מסגרת",
    "שלוחה",
    "שם שלוחה",
    "school",
    "schoolName",
    "school_name",
    "institution",
  ]);

  if (explicitSchool) {
    const detected = extractSchoolFromText(explicitSchool);
    if (detected) {
      return {
        ...detected,
        isExplicitlyDetected: true,
        detectionSource: "עמודת בית ספר",
      };
    }
  }

  // 3. Scan any property key containing "בית ספר" or "העתיד"
  for (const key of rowKeys) {
    if (key.startsWith("__")) continue;
    const cleanK = key.toLowerCase().replace(/[\s_'"״\.\-\:\/\(\)]/g, "");
    if (
      cleanK.includes("ביתספר") ||
      cleanK.includes("העתיד") ||
      cleanK.includes("שלוחה") ||
      cleanK.includes("מוסד")
    ) {
      const val = row[key];
      const detected = extractSchoolFromText(val);
      if (detected) {
        return {
          ...detected,
          isExplicitlyDetected: true,
          detectionSource: key,
        };
      }
    }
  }

  // 4. Scan all cell values in the student's row
  const cellValues = row.__rowValues || Object.values(row);
  for (const val of cellValues) {
    if (typeof val === "string" && val.trim()) {
      const detected = extractSchoolFromText(val);
      if (detected) {
        return {
          ...detected,
          isExplicitlyDetected: true,
          detectionSource: "תוכן שורת תלמיד",
        };
      }
    }
  }

  // 5. Secondary registration / activity context
  const contextField = findFieldValue(row, [
    "שם חוג",
    "שם החוג",
    "קבוצה",
    "תיאור קבוצה",
    "מסלול",
    "שלוחה",
    "הערות",
    "הערות מיוחדות",
  ]);

  if (contextField) {
    const detected = extractSchoolFromText(contextField);
    if (detected) {
      return {
        ...detected,
        isExplicitlyDetected: true,
        detectionSource: "הקשר רישום / הערות",
      };
    }
  }

  // 6. Sheet name context
  if (sheetName) {
    const detected = extractSchoolFromText(sheetName);
    if (detected) {
      return {
        ...detected,
        isExplicitlyDetected: true,
        detectionSource: "שם גיליון",
      };
    }
  }

  // 7. Fallback to active school (not explicitly detected in file)
  if (
    canonicalFallback.includes("ben-shemen") ||
    canonicalFallback.includes("shemen")
  ) {
    return {
      schoolId: "sch-ben-shemen",
      schoolName: "בית ספר בן שמן",
      isExplicitlyDetected: false,
    };
  }
  if (canonicalFallback.includes("lapid")) {
    return {
      schoolId: "sch-lapid-hmd",
      schoolName: 'בית ספר לפיד המ"ד',
      isExplicitlyDetected: false,
    };
  }
  if (canonicalFallback.includes("navon")) {
    return {
      schoolId: "sch-yitzhak-navon",
      schoolName: "בית ספר יצחק נבון",
      isExplicitlyDetected: false,
    };
  }

  return {
    schoolId: canonicalFallback,
    schoolName: "בית ספר",
    isExplicitlyDetected: false,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Parses all students from a given worksheet with multi-pass header detection,
 * exhaustive ID key matching, and value pattern fallback.
 */
export function parseStudentsSheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  fallbackSchoolId: string,
): Student[] {
  if (!worksheet) return [];

  // Guard: If this sheet has strong activity indicators AND zero student indicators, skip it
  const sheetAnalysis = detectSheetType(worksheet);
  if (sheetAnalysis.type === "activities" && sheetAnalysis.studentScore === 0) {
    return [];
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows || rawRows.length === 0) return [];

  // 1. Locate header row in the first 20 rows
  let headerRowIndex = 0;
  let foundHeader = false;
  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
    const rowArr = rawRows[r];
    if (Array.isArray(rowArr)) {
      const hasStudentHeader = rowArr.some((cell) => {
        const s = String(cell || "").trim();
        return (
          s.includes("תעודת זהות") ||
          s.includes("ת.ז") ||
          s.includes('ת"ז') ||
          s.includes("ת״ז") ||
          s.includes("תז") ||
          s.includes("מספר זהות") ||
          s.includes("מס' זהות") ||
          s.includes("מס' ת.ז") ||
          s.includes("מס ת.ז") ||
          s.includes("שם פרטי") ||
          s.includes("שם משפחה") ||
          s.includes("שם תלמיד") ||
          s.includes("שם הילד") ||
          s.includes("שם התלמיד") ||
          s.includes("שם הורה") ||
          s.includes("בית הספר של העתיד") ||
          s.includes("בית ספר של העתיד") ||
          s.includes("סטטוס אישור הרשמה") ||
          s.includes("קידומת 1") ||
          s.includes("טלפון 1")
        );
      });
      if (hasStudentHeader) {
        headerRowIndex = r;
        foundHeader = true;
        break;
      }
    }
  }

  // 2. Parse structured JSON from headerRowIndex
  const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: "",
  });

  if (!json || json.length === 0) return [];

  const headerRowArr = rawRows[headerRowIndex] || [];
  const studentMap = new Map<string, Student>();

  json.forEach((row, idx) => {
    // Attach raw Column J (column 10 -> 0-based index 9) and raw row array
    const rawRow = rawRows[headerRowIndex + 1 + idx];
    if (Array.isArray(rawRow)) {
      row.__rawColJ = rawRow[9]; // Column J
      row.__rowValues = rawRow;
      row.__headerRow = headerRowArr;
    }

    // 1. First & Last Name
    let firstName = String(
      findFieldValue(row, [
        "שם פרטי",
        "שם פרטי תלמיד",
        "שם פרטי ילד",
        "פרטי",
        "firstName",
        "first_name",
        "first name",
        "שם פרטי:",
      ]) || "",
    ).trim();

    let lastName = String(
      findFieldValue(row, [
        "שם משפחה",
        "שם משפחה תלמיד",
        "שם משפחה ילד",
        "משפחה",
        "lastName",
        "last_name",
        "last name",
        "שם משפחה:",
      ]) || "",
    ).trim();

    if (!firstName && !lastName) {
      const fullName = String(
        findFieldValue(row, [
          "שם מלא",
          "שם תלמיד",
          "שם הילד",
          "שם התלמיד",
          "שם התלמיד/ה",
          "studentName",
        ]) || "",
      ).trim();
      if (
        fullName &&
        !fullName.includes("חוג") &&
        !fullName.includes("פעילות") &&
        !fullName.includes("מדריך") &&
        !fullName.includes("מורה")
      ) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
    }

    // 2. Student ID (Flexible matching + Israeli ID pattern scan)
    let cleanId = findStudentId(row, rawRow, idx);
    if (!cleanId || cleanId.length < 4) {
      // If student has a valid personal first + last name, synthesize a deterministic ID so they aren't lost
      if (
        firstName &&
        firstName !== "תלמיד" &&
        lastName &&
        !firstName.includes("חוג") &&
        !lastName.includes("חוג")
      ) {
        cleanId = `GEN-${Math.abs(hashString(`${firstName}-${lastName}-${idx}`))}`;
      } else {
        return; // Skip empty row or separator
      }
    }

    // 3. Gender
    const rawGender = String(
      findFieldValue(row, ["מין", "מגדר", "gender", "sex"]) || "",
    ).trim();
    let gender: "זכר" | "נקבה" | "אחר" | undefined = undefined;
    if (rawGender.includes("זכר") || rawGender === "ז" || rawGender === "בן") {
      gender = "זכר";
    } else if (
      rawGender.includes("נקבה") ||
      rawGender === "נ" ||
      rawGender === "בת"
    ) {
      gender = "נקבה";
    }

    // 4. Grade and Layer
    const { grade, gradeLayer } = extractGradeInfo(row);

    // 5. Parent Contact - Phone
    const prefix1 = findFieldValue(row, [
      "קידומת טל' 1",
      "קידומת 1",
      "קידומת טלפון 1",
      "קידומת טל'",
      "קידומת",
    ]);
    const phone1 = findFieldValue(row, [
      "טלפון 1",
      "טל' 1",
      "טלפון",
      "סלולרי",
      "טלפון נייד",
      "טלפון הורה",
      "phone",
      "parentPhone",
    ]);

    const prefix2 = findFieldValue(row, [
      "קידומת טל' 2",
      "קידומת 2",
      "קידומת טלפון 2",
    ]);
    const phone2 = findFieldValue(row, ["טלפון 2", "טל' 2"]);

    const prefixHead = findFieldValue(row, [
      "קידומת טל' ראש משפחה",
      "קידומת ראש משפחה",
    ]);
    const phoneHead = findFieldValue(row, [
      "טלפון ראש משפחה",
      "סלולרי ראש משפחה",
    ]);

    let parentPhone = formatPhoneNumber(prefix1, phone1);
    if (!parentPhone && (prefixHead || phoneHead)) {
      parentPhone = formatPhoneNumber(prefixHead, phoneHead);
    }
    if (!parentPhone && (prefix2 || phone2)) {
      parentPhone = formatPhoneNumber(prefix2, phone2);
    }

    // 6. Parent Contact - Email
    const rawEmail = findFieldValue(row, [
      "דואר אלקטרוני/מכתב",
      "דואר אלקטרוני",
      'דוא"ל',
      "דואל",
      "אימייל",
      "מייל",
      "email",
      "parentEmail",
    ]);
    const parentEmail = cleanEmail(rawEmail);

    // 7. Settlement / City
    const settlement = String(
      findFieldValue(row, [
        "עיר/ישוב",
        "ישוב",
        "יישוב",
        "עיר",
        "שכונה",
        "settlement",
        "city",
        "יישוב מגורים",
      ]) || "",
    ).trim();

    // 8. Parent Name
    const parentFirstName = findFieldValue(row, [
      "שם פרטי ראש משפחה",
      "פרטי ראש משפחה",
    ]);
    const parentLastName = findFieldValue(row, [
      "שם משפחה ראש משפחה",
      "משפחה ראש משפחה",
    ]);
    let parentName = String(
      findFieldValue(row, [
        "שם ראש משפחה",
        "שם הורה",
        "איש קשר",
        "שם אב",
        "שם אם",
        "parentName",
      ]) || "",
    ).trim();

    if (!parentName && (parentFirstName || parentLastName)) {
      parentName = `${parentFirstName || ""} ${parentLastName || ""}`.trim();
    }
    if (!parentName && lastName) {
      parentName = `משפחת ${lastName}`;
    }

    // 9. Address / Street details for special notes
    const street = findFieldValue(row, [
      "רחוב",
      "כתובת",
      "street",
      "address",
    ]);
    const houseNum = findFieldValue(row, [
      "מספר",
      "מספר בית",
      "מס' בית",
      "בית",
      "מס'",
      "houseNumber",
    ]);
    const zipCode = findFieldValue(row, [
      "מיקוד",
      "סמל ישוב",
      "קוד ישוב",
      "מיקוד/סמל",
    ]);
    const originalCourse = findFieldValue(row, [
      "שם חוג",
      "קבוצה",
      "מסלול",
      "תיאור קבוצה",
    ]);

    const addressParts = [
      street ? `רחוב ${street}` : "",
      houseNum ? `מס' ${houseNum}` : "",
      settlement ? settlement : "",
      zipCode ? `מיקוד ${zipCode}` : "",
      originalCourse ? `רישום: ${originalCourse}` : "",
    ].filter(Boolean);

    const specialNotes = addressParts.join(", ");

    // 10. School Detection with Column J Priority
    const { schoolId, schoolName, isExplicitlyDetected } = detectSchoolFromRow(
      row,
      fallbackSchoolId,
      sheetName,
    );

    // 11. Authorization Status
    const statusRaw = String(
      findFieldValue(row, [
        "סטטוס אישור הרשמה",
        "סטטוס",
        "isAuthorized",
        "אישור",
        "מאושר",
      ]) || "מאושר",
    ).trim();
    const isAuthorized =
      !statusRaw.includes("חסום") &&
      !statusRaw.includes("מבוטל") &&
      !statusRaw.includes("false") &&
      !statusRaw.includes("לא");

    const currentStudent: Student = {
      id: cleanId,
      firstName: firstName || "תלמיד",
      lastName: lastName || "",
      grade: grade || "כיתה א'",
      gradeLayer: gradeLayer || "א",
      gender,
      isAuthorized,
      parentName: parentName || undefined,
      parentPhone: parentPhone || undefined,
      parentEmail: parentEmail || undefined,
      settlement: settlement || undefined,
      specialNotes: specialNotes || undefined,
      schoolId,
      schoolName,
    };

    // Deduplicate and merge if student appears multiple times
    if (studentMap.has(cleanId)) {
      const existing = studentMap.get(cleanId)!;
      studentMap.set(cleanId, {
        ...existing,
        firstName:
          existing.firstName !== "תלמיד"
            ? existing.firstName
            : currentStudent.firstName,
        lastName: existing.lastName || currentStudent.lastName,
        gender: existing.gender || currentStudent.gender,
        parentPhone: existing.parentPhone || currentStudent.parentPhone,
        parentEmail: existing.parentEmail || currentStudent.parentEmail,
        settlement: existing.settlement || currentStudent.settlement,
        specialNotes:
          existing.specialNotes || currentStudent.specialNotes,
        parentName: existing.parentName || currentStudent.parentName,
        schoolId: isExplicitlyDetected
          ? currentStudent.schoolId
          : existing.schoolId || currentStudent.schoolId,
        schoolName: isExplicitlyDetected
          ? currentStudent.schoolName
          : existing.schoolName || currentStudent.schoolName,
      });
    } else {
      studentMap.set(cleanId, currentStudent);
    }
  });

  return Array.from(studentMap.values());
}

/**
 * Parses all Friday activities from a given worksheet with flexible header detection,
 * support for combined hours ("08:30-09:30"), teachers/instructors, capacities, and locations.
 */
export function parseActivitiesSheet(
  worksheet: XLSX.WorkSheet,
  sheetName?: string,
): Activity[] {
  if (!worksheet) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows || rawRows.length === 0) return [];

  // 1. Locate header row for activities in the first 20 rows
  let headerRowIndex = 0;
  let maxScore = -1;

  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
    const rowArr = rawRows[r];
    if (Array.isArray(rowArr)) {
      let score = 0;
      rowArr.forEach((cell) => {
        const s = String(cell || "").trim().toLowerCase();
        if (!s) return;
        if (s.includes("שם החוג") || s.includes("שם חוג") || s.includes("activity")) score += 10;
        if (s.includes("משבצת") || s.includes("slot")) score += 8;
        if (s.includes("שעת התחלה") || s.includes("שעת סיום") || s.includes("שעות")) score += 7;
        if (
          s.includes("מדריך") ||
          s.includes("מפעיל") ||
          s.includes("שם המורה") ||
          s.includes("שם מורה") ||
          s.includes("מורה") ||
          s.includes("instructor") ||
          s.includes("teacher")
        ) {
          score += 8;
        }
        if (s.includes("שכבות") || s.includes("שכבת") || s.includes("allowedgrades")) score += 6;
        if (s.includes("מזהה חוג") || s.includes("קוד חוג")) score += 8;
        if (s.includes("מכסת") || s.includes("קיבולת") || s.includes("capacity")) score += 5;
        if (s.includes("קטגוריה") || s.includes("category")) score += 5;
      });
      if (score > maxScore) {
        maxScore = score;
        headerRowIndex = r;
      }
    }
  }

  const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: "",
  });

  if (!json || json.length === 0) return [];

  const activities: Activity[] = [];

  json.forEach((row, idx) => {
    // 1. Activity Name
    const name = String(
      findFieldValue(row, [
        "שם החוג",
        "שם חוג",
        "שם פעילות",
        "פעילות",
        "נושא החוג",
        "חוג",
        "activityName",
        "activity",
        "שם",
        "name",
      ]) || "",
    ).trim();

    // Skip empty row or table separators
    if (!name || name === "חוג" || name.length < 2) return;

    // 2. Activity ID
    const rawId = findFieldValue(row, [
      "מזהה חוג",
      "קוד חוג",
      "מספר חוג",
      "מזהה",
      "קוד",
      "id",
      "ID",
      "code",
    ]);
    const id = rawId ? String(rawId).trim() : `ACT-EX-${idx + 101}`;

    // 3. Slot Number & Slot Hour Name (שעה ראשונה, שעה שניה, שעה שלישית)
    const rawSlot = String(
      findFieldValue(row, [
        "מועד החוג",
        "מועד",
        "משבצת זמן (1/2/3)",
        "משבצת יום שישי",
        "משבצת שישי",
        "משבצת זמן",
        "משבצת 1/2/3",
        "משבצת",
        "slotNumber",
        "slot",
      ]) || "",
    ).trim();

    const rawStartTimeVal = String(findFieldValue(row, ["שעת התחלה", "שעה התחלה", "startTime"]) || "").trim();
    const rawCombinedHours = String(findFieldValue(row, ["שעות", "שעות פעילות", "שעה", "זמן", "hours", "time"]) || "").trim();
    const combinedSlotIndicator = `${rawSlot} ${rawStartTimeVal} ${rawCombinedHours}`.toLowerCase();

    // Check for molecular cooking or double slot (שעה שניה ושלישית)
    const isDoubleSlot =
      combinedSlotIndicator.includes("שניה ושלישית") ||
      combinedSlotIndicator.includes("שני ושלישי") ||
      combinedSlotIndicator.includes("2+3") ||
      combinedSlotIndicator.includes("2 ו-3") ||
      name.includes("בישול מולקולרי");

    let slotNum = 0;

    // 1. Direct check on rawSlot
    const trimmedSlot = rawSlot.trim();
    if (trimmedSlot === "1" || trimmedSlot.includes("משבצת 1") || trimmedSlot.includes("ראשונ")) {
      slotNum = 1;
    } else if (trimmedSlot === "2" || trimmedSlot.includes("משבצת 2") || trimmedSlot.includes("שני")) {
      slotNum = 2;
    } else if (trimmedSlot === "3" || trimmedSlot.includes("משבצת 3") || trimmedSlot.includes("שליש")) {
      slotNum = 3;
    }

    // 2. Check startTime / combined words (like "שעה ראשונה", "שעה שניה", "שעה שלישית")
    if (!slotNum) {
      if (rawStartTimeVal.includes("ראשונ") || rawCombinedHours.includes("ראשונ")) {
        slotNum = 1;
      } else if (rawStartTimeVal.includes("שני") || rawCombinedHours.includes("שני")) {
        slotNum = 2;
      } else if (rawStartTimeVal.includes("שליש") || rawCombinedHours.includes("שליש")) {
        slotNum = 3;
      }
    }

    // 3. Match standalone digit 1, 2, or 3 in rawSlot
    if (!slotNum) {
      const match = trimmedSlot.match(/\b([1-3])\b/);
      if (match) {
        slotNum = parseInt(match[1], 10);
      }
    }

    // 4. Fallback check for clock hours if rawStartTimeVal has clock hours
    if (!slotNum) {
      if (rawStartTimeVal.startsWith("08") || rawStartTimeVal.startsWith("8") || rawStartTimeVal.startsWith("09")) {
        slotNum = 1;
      } else if (rawStartTimeVal.startsWith("10") || rawStartTimeVal.startsWith("11:00")) {
        slotNum = 2;
      } else if (rawStartTimeVal.startsWith("11") || rawStartTimeVal.startsWith("12")) {
        slotNum = 3;
      }
    }

    // 5. Default fallback
    if (!slotNum || slotNum < 1 || slotNum > 3) {
      slotNum = isDoubleSlot ? 2 : (((idx % 3) + 1) as 1 | 2 | 3);
    }

    // Clean slot name without clock numbers: שעה ראשונה / שעה שניה / שעה שלישית
    const finalStartTime = isDoubleSlot
      ? "שעה שניה ושלישית"
      : slotNum === 1
        ? "שעה ראשונה"
        : slotNum === 2
          ? "שעה שניה"
          : "שעה שלישית";

    // endTime is strictly empty - no numbers!
    const finalEndTime = "";

    // 5. Allowed Grades
    const rawGrades = findFieldValue(row, [
      "שכבות גיל מותרות (לדוגמה: א,ב,ג או א-ו)",
      "שכבות גיל מותרות",
      "שכבות גיל",
      "שכבות",
      "כיתות מותרות",
      "כיתות",
      "שכבה",
      "גילאים",
      "allowedGrades",
      "grades",
    ]);
    const allowedGrades = parseAllowedGrades(rawGrades ? String(rawGrades) : undefined);

    // 6. Instructor / Teacher
    const instructor = String(
      findFieldValue(row, [
        "מדריך / מפעיל",
        "מדריך",
        "מפעיל",
        "שם המורה",
        "שם מורה",
        "מורה",
        "שם מדריך",
        "איש צוות",
        "מדריכה",
        "מפעילה",
        "instructor",
        "teacher",
      ]) || "מדריך מקצועי",
    ).trim();

    // 7. Instructor Phone
    const instructorPhone = String(
      findFieldValue(row, [
        "טלפון מדריך",
        "טלפון מורה",
        "טלפון",
        "נייד",
        "סלולרי",
        "טלפון איש קשר",
        "instructorPhone",
        "phone",
      ]) || "",
    ).trim();

    // 8. Capacities
    const maxCapRaw = findFieldValue(row, [
      "מכסת מקסימום",
      "מקסימום",
      "מכסה",
      "קיבולת",
      "מספר מקומות",
      "maxCapacity",
      "capacity",
    ]);
    const maxCapacity = Number(maxCapRaw);

    const minCapRaw = findFieldValue(row, [
      "מכסת מינימום",
      "מינימום",
      "מינימום לפתיחה",
      "minCapacity",
    ]);
    const minCapacity = Number(minCapRaw);

    // 9. Category
    const rawCategory = String(
      findFieldValue(row, ["קטגוריה", "תחום", "סוג חוג", "ענף", "category"]) || "",
    ).trim();
    const category: ActivityCategory = REVERSE_CATEGORY_MAP[rawCategory] || "enrichment";

    // 10. Location
    const location = String(
      findFieldValue(row, [
        "מיקום / מוקד / בית ספר",
        "מיקום / מוקד",
        "מיקום",
        "מוקד",
        "חדר",
        "אולם",
        "מתחם",
        "location",
      ]) || "מעגלים",
    ).trim();

    // 11. Description
    const description = String(
      findFieldValue(row, [
        "תיאור החוג",
        "תיאור",
        "פירוט",
        "אודות",
        "סילבוס",
        "description",
      ]) || `חוג חווייתי ומעשיר במסגרת ימי שישי`,
    ).trim();

    // 12. Image URL
    const imageUrl = String(
      findFieldValue(row, ["קישור לתמונה", "תמונה", "קישור", "imageUrl", "image"]) || "",
    ).trim();

    // 13. Status
    const statusRaw = String(
      findFieldValue(row, ["סטטוס פעילות", "סטטוס", "מצב", "status"]) || "פעיל",
    ).trim();
    const status: "active" | "cancelled" | "pending_min" =
      statusRaw.includes("בוטל") || statusRaw.includes("cancel")
        ? "cancelled"
        : statusRaw.includes("המתנה") || statusRaw.includes("pending")
          ? "pending_min"
          : "active";

    activities.push({
      id,
      name,
      category,
      allowedGrades,
      day: "שישי",
      slotNumber: slotNum as 1 | 2 | 3,
      startTime: finalStartTime,
      endTime: finalEndTime,
      location: location || "מעגלים",
      instructor: instructor || "מדריך מוסמך",
      instructorPhone: instructorPhone || undefined,
      maxCapacity: !isNaN(maxCapacity) && maxCapacity > 0 ? maxCapacity : 20,
      minCapacity: !isNaN(minCapacity) && minCapacity > 0 ? minCapacity : 8,
      description: description || `חוג חווייתי ומעשיר במסגרת ימי שישי`,
      imageUrl: imageUrl || undefined,
      status,
    });
  });

  return activities;
}

/**
 * Parses registrations from a given worksheet.
 * Resolves activity names or IDs back to canonical activity IDs using the provided activities list.
 */
export function parseRegistrationsSheet(
  worksheet: XLSX.WorkSheet,
  sheetName?: string,
  availableActivities: Activity[] = [],
): Registration[] {
  if (!worksheet) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows || rawRows.length === 0) return [];

  // Find header row in first 20 rows
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
    const rowArr = rawRows[r];
    if (Array.isArray(rowArr)) {
      const hasRegHeader = rowArr.some((cell) => {
        const s = String(cell || "").trim();
        return (
          s.includes("משבצת") ||
          s.includes("חוג עיקרי") ||
          s.includes("חוג חלופי") ||
          s.includes("מזהה רישום") ||
          s.includes("תאריך רישום") ||
          s.includes("הערות הורה") ||
          (s.includes("תלמיד") && s.includes("חוג"))
        );
      });
      if (hasRegHeader) {
        headerRowIndex = r;
        break;
      }
    }
  }

  const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: "",
  });

  if (!json || json.length === 0) return [];

  // Helper to match activity name or ID to canonical activity ID
  const resolveChoiceId = (choiceVal: string, slotNum: 1 | 2 | 3): string => {
    const trimmed = String(choiceVal || "").trim();
    if (
      !trimmed ||
      trimmed === "-" ||
      trimmed === "ללא" ||
      trimmed === "אין" ||
      trimmed === "null" ||
      trimmed === "undefined"
    ) {
      return "";
    }

    // 1. Direct ID match
    const directMatch = availableActivities.find((a) => a.id === trimmed);
    if (directMatch) return directMatch.id;

    // 2. Exact name match (prioritizing matching slotNumber)
    const exactSlotMatch = availableActivities.find(
      (a) =>
        a.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        a.slotNumber === slotNum,
    );
    if (exactSlotMatch) return exactSlotMatch.id;

    const exactNameMatch = availableActivities.find(
      (a) => a.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (exactNameMatch) return exactNameMatch.id;

    // 3. Fuzzy match (strip spaces, quotes, hyphens)
    const normalize = (txt: string) => txt.replace(/[\s"'-]/g, "").toLowerCase();
    const normChoice = normalize(trimmed);

    const fuzzySlotMatch = availableActivities.find(
      (a) =>
        (normalize(a.name) === normChoice ||
          normalize(a.name).includes(normChoice) ||
          normChoice.includes(normalize(a.name))) &&
        a.slotNumber === slotNum,
    );
    if (fuzzySlotMatch) return fuzzySlotMatch.id;

    const fuzzyMatch = availableActivities.find(
      (a) =>
        normalize(a.name) === normChoice ||
        normalize(a.name).includes(normChoice) ||
        normChoice.includes(normalize(a.name)),
    );
    if (fuzzyMatch) return fuzzyMatch.id;

    return trimmed;
  };

  const registrations: Registration[] = [];

  json.forEach((row, idx) => {
    let regId = "";
    let timestamp = "";
    let studentId = "";
    let studentName = "";
    let studentGrade = "";
    let parentName = "";
    let parentPhone = "";
    let parentEmail = "";
    let slot1Choice = "";
    let slot1Backup = "";
    let slot2Choice = "";
    let slot2Backup = "";
    let slot3Choice = "";
    let slot3Backup = "";
    let notes = "";

    for (const [key, val] of Object.entries(row)) {
      const k = String(key || "").trim().toLowerCase();
      const v = String(val || "").trim();
      if (!v) continue;

      if (k.includes("מזהה רישום") || k === "registrationid" || k === "regid") {
        regId = v;
      } else if (
        k.includes("חותמת זמן") ||
        k.includes("תאריך רישום") ||
        k.includes("תאריך") ||
        k === "timestamp"
      ) {
        timestamp = v;
      } else if (
        k.includes("תעודת זהות") ||
        k.includes("ת.ז") ||
        k.includes('ת"ז') ||
        k.includes("ת״ז") ||
        k.includes("מספר זהות") ||
        k.includes("מס' זהות") ||
        k.includes("מס' ת.ז") ||
        k === "studentid" ||
        k === "id"
      ) {
        studentId = cleanIsraeliId(v);
      } else if (
        k.includes("שם תלמיד") ||
        k.includes("שם הילד") ||
        k.includes("studentname") ||
        (k.includes("שם") &&
          !k.includes("הורה") &&
          !k.includes("חוג") &&
          !k.includes("מורה") &&
          !k.includes("מדריך"))
      ) {
        studentName = v;
      } else if (k.includes("כיתה") || k.includes("שכבה") || k === "grade") {
        studentGrade = v;
      } else if (
        k.includes("שם הורה") ||
        k.includes("parentname") ||
        k === "הורה"
      ) {
        parentName = v;
      } else if (
        k.includes("טלפון") ||
        k.includes("נייד") ||
        k.includes("סלולרי") ||
        k === "parentphone"
      ) {
        parentPhone = v;
      } else if (
        k.includes("דוא") ||
        k.includes("מייל") ||
        k.includes("אימייל") ||
        k === "parentemail"
      ) {
        parentEmail = v;
      } else if (
        k.includes("משבצת 1") ||
        k.includes("משבצת1") ||
        k.includes("חוג 1") ||
        k.includes("שעה ראשונה") ||
        k.includes("slot1")
      ) {
        if (
          k.includes("חלופי") ||
          k.includes("גיבוי") ||
          k.includes("עדיפות 2") ||
          k.includes("backup") ||
          k.includes("משני")
        ) {
          slot1Backup = v;
        } else {
          slot1Choice = v;
        }
      } else if (
        k.includes("משבצת 2") ||
        k.includes("משבצת2") ||
        k.includes("חוג 2") ||
        k.includes("שעה שניה") ||
        k.includes("שעה שנייה") ||
        k.includes("slot2")
      ) {
        if (
          k.includes("חלופי") ||
          k.includes("גיבוי") ||
          k.includes("עדיפות 2") ||
          k.includes("backup") ||
          k.includes("משני")
        ) {
          slot2Backup = v;
        } else {
          slot2Choice = v;
        }
      } else if (
        k.includes("משבצת 3") ||
        k.includes("משבצת3") ||
        k.includes("חוג 3") ||
        k.includes("שעה שלישית") ||
        k.includes("slot3")
      ) {
        if (
          k.includes("חלופי") ||
          k.includes("גיבוי") ||
          k.includes("עדיפות 2") ||
          k.includes("backup") ||
          k.includes("משני")
        ) {
          slot3Backup = v;
        } else {
          slot3Choice = v;
        }
      } else if (k.includes("הערות") || k.includes("notes")) {
        notes = v;
      }
    }

    if (!studentId && !studentName) return;
    if (!studentId) {
      studentId = `std-temp-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`;
    }

    registrations.push({
      id: regId || `reg-${studentId}-${Date.now()}-${idx}`,
      timestamp: timestamp || new Date().toISOString(),
      studentId,
      studentName: studentName || "תלמיד",
      studentGrade: studentGrade || "א'1",
      parentName: parentName || "הורה",
      parentPhone: parentPhone || "",
      parentEmail: parentEmail || "",
      slot1Choice: resolveChoiceId(slot1Choice, 1),
      slot1Backup: resolveChoiceId(slot1Backup, 1) || undefined,
      slot2Choice: resolveChoiceId(slot2Choice, 2),
      slot2Backup: resolveChoiceId(slot2Backup, 2) || undefined,
      slot3Choice: resolveChoiceId(slot3Choice, 3),
      slot3Backup: resolveChoiceId(slot3Backup, 3) || undefined,
      notes: notes || undefined,
    });
  });

  return registrations;
}

export interface SheetsSummary {
  hasStudents: boolean;
  studentCount: number;
  hasActivities: boolean;
  activityCount: number;
  hasRegistrations: boolean;
  registrationCount: number;
}

export interface ParseExcelResult {
  students?: Student[];
  activities?: Activity[];
  registrations?: Registration[];
  detectedType?: "students" | "activities" | "registrations" | "full_workbook";
  sheetName?: string;
  sheetsSummary?: SheetsSummary;
  error?: string;
}

export async function parseExcelFile(
  file: File,
  fallbackSchoolId: string = "sch-ben-shemen",
  expectedType:
    | "students"
    | "activities"
    | "registrations"
    | "full_workbook"
    | "auto" = "auto",
  availableActivities: Activity[] = [],
): Promise<ParseExcelResult> {
  const getArrayBuffer = async (): Promise<ArrayBuffer> => {
    if (typeof file.arrayBuffer === "function") {
      return await file.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  try {
    const arrayBuf = await getArrayBuffer();
    const data = new Uint8Array(arrayBuf);
    const workbook = XLSX.read(data, { type: "array" });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { error: "קובץ ה-Excel אינו מכיל גיליונות נתונים." };
    }

    // Analyze all sheets in workbook
    const sheetProfiles = workbook.SheetNames.map((sName) => {
      const ws = workbook.Sheets[sName];
      const analysis = detectSheetType(ws);
      const sLower = sName.toLowerCase();
      const hasActivityName =
        sLower.includes("activit") ||
        sName.includes("חוג") ||
        sName.includes("חוגי_שישי");
      const hasStudentName =
        sLower.includes("student") ||
        sName.includes("תלמיד") ||
        sName.includes("זכא") ||
        sName.includes("ילד");
      const hasRegistrationName =
        sLower.includes("regist") ||
        sName.includes("נרשם") ||
        sName.includes("רישום") ||
        sName.includes("הרשמ");

      return {
        sheetName: sName,
        worksheet: ws,
        analysis,
        hasActivityName,
        hasStudentName,
        hasRegistrationName,
      };
    });

    // 1. Try to find the best activities sheet
    const bestActivitySheet =
      sheetProfiles.find(
        (p) =>
          p.analysis.type === "activities" ||
          (p.hasActivityName && p.analysis.activityScore > 0),
      ) ||
      sheetProfiles.find((p) => p.analysis.activityScore >= 6) ||
      sheetProfiles.find((p) => p.hasActivityName);

    // 2. Try to find the best students sheet
    const bestStudentSheet =
      sheetProfiles.find(
        (p) =>
          p.analysis.type === "students" ||
          (p.hasStudentName && p.analysis.studentScore > 0),
      ) ||
      sheetProfiles.find((p) => p.analysis.studentScore >= 6) ||
      sheetProfiles.find((p) => p.hasStudentName);

    // 3. Try to find the best registrations sheet
    const bestRegistrationSheet =
      sheetProfiles.find(
        (p) =>
          p.analysis.type === "registrations" ||
          (p.hasRegistrationName && p.analysis.registrationScore > 0),
      ) ||
      sheetProfiles.find((p) => p.analysis.registrationScore >= 6) ||
      sheetProfiles.find((p) => p.hasRegistrationName);

    // Helper: parse activities from target sheet
    const parseActsFromSheet = (): Activity[] => {
      if (!bestActivitySheet) return [];
      return parseActivitiesSheet(
        bestActivitySheet.worksheet,
        bestActivitySheet.sheetName,
      );
    };

    // Helper: parse students from target sheet
    const parseStudentsFromSheet = (): Student[] => {
      if (!bestStudentSheet) return [];
      return parseStudentsSheet(
        bestStudentSheet.worksheet,
        bestStudentSheet.sheetName,
        fallbackSchoolId,
      );
    };

    // Helper: parse registrations from target sheet
    const parseRegsFromSheet = (acts: Activity[]): Registration[] => {
      if (!bestRegistrationSheet) return [];
      return parseRegistrationsSheet(
        bestRegistrationSheet.worksheet,
        bestRegistrationSheet.sheetName,
        acts,
      );
    };

    // =========================================================
    // CASE 0: FULL WORKBOOK (Explicit or Auto Multi-Sheet)
    // If the workbook has multiple distinct sheets OR registrations + (students or activities),
    // or if the user explicitly requested full_workbook
    // =========================================================
    const hasMultipleTypes =
      (bestRegistrationSheet && (bestStudentSheet || bestActivitySheet)) ||
      (bestStudentSheet && bestActivitySheet) ||
      workbook.SheetNames.length >= 3;

    if (expectedType === "full_workbook" || (expectedType === "auto" && hasMultipleTypes)) {
      const acts = parseActsFromSheet();
      const combinedActs = [...acts, ...availableActivities];
      const students = parseStudentsFromSheet();
      const regs = parseRegsFromSheet(combinedActs);

      const summary: SheetsSummary = {
        hasStudents: students.length > 0,
        studentCount: students.length,
        hasActivities: acts.length > 0,
        activityCount: acts.length,
        hasRegistrations: regs.length > 0,
        registrationCount: regs.length,
      };

      // If at least 2 categories or registrations found, it's a full workbook!
      if (
        regs.length > 0 ||
        (students.length > 0 && acts.length > 0) ||
        expectedType === "full_workbook"
      ) {
        return {
          students,
          activities: acts,
          registrations: regs,
          detectedType: "full_workbook",
          sheetsSummary: summary,
        };
      }
    }

    // =========================================================
    // CASE A: User explicitly requested Registrations
    // =========================================================
    if (expectedType === "registrations") {
      const target = bestRegistrationSheet || sheetProfiles[0];
      const regs = parseRegistrationsSheet(
        target.worksheet,
        target.sheetName,
        availableActivities,
      );
      if (regs.length > 0) {
        return {
          registrations: regs,
          detectedType: "registrations",
          sheetName: target.sheetName,
          sheetsSummary: {
            hasStudents: false,
            studentCount: 0,
            hasActivities: false,
            activityCount: 0,
            hasRegistrations: true,
            registrationCount: regs.length,
          },
        };
      }
      return {
        error:
          "לא זוהו רישומי הורים תקינים בקובץ. ודאו שהקובץ כולל עמודות: תעודת זהות, שם תלמיד, ובחירות חוגים למשבצות 1, 2 ו-3.",
      };
    }

    // =========================================================
    // CASE B: User explicitly requested Activities
    // =========================================================
    if (expectedType === "activities") {
      const target = bestActivitySheet || sheetProfiles[0];
      let activities = parseActivitiesSheet(
        target.worksheet,
        target.sheetName,
      );

      if (activities.length === 0 && sheetProfiles.length > 1) {
        for (const sp of sheetProfiles) {
          if (sp.sheetName === target.sheetName) continue;
          const otherActs = parseActivitiesSheet(
            sp.worksheet,
            sp.sheetName,
          );
          if (otherActs.length > 0) {
            activities = otherActs;
            break;
          }
        }
      }

      if (activities.length > 0) {
        return {
          activities,
          detectedType: "activities",
          sheetName: target.sheetName,
          sheetsSummary: {
            hasStudents: false,
            studentCount: 0,
            hasActivities: true,
            activityCount: activities.length,
            hasRegistrations: false,
            registrationCount: 0,
          },
        };
      }

      // If no activities were parsed, check if it was genuinely a pure student file
      if (bestStudentSheet && bestStudentSheet.analysis.studentScore >= 12) {
        const students = parseStudentsSheet(
          bestStudentSheet.worksheet,
          bestStudentSheet.sheetName,
          fallbackSchoolId,
        );
        if (students.length > 0) {
          return {
            students,
            detectedType: "students",
            error:
              'קובץ זה זוהה כקובץ תלמידים זכאים (מכיל תעודות זהות ושמות תלמידים). אנא עברו ללשונית "תלמידים זכאים" כדי לייבא אותו.',
          };
        }
      }

      return {
        error:
          "לא זוהו חוגים תקינים בקובץ. ודאו שהקובץ כולל עמודות: שם החוג, שעות או משבצת זמן, מדריך/מורה ומכסות.",
      };
    }

    // =========================================================
    // CASE C: User explicitly requested Students
    // =========================================================
    if (expectedType === "students") {
      const target = bestStudentSheet || sheetProfiles[0];
      let students = parseStudentsSheet(
        target.worksheet,
        target.sheetName,
        fallbackSchoolId,
      );

      if (students.length === 0 && sheetProfiles.length > 1) {
        for (const sp of sheetProfiles) {
          if (sp.sheetName === target.sheetName) continue;
          const otherStudents = parseStudentsSheet(
            sp.worksheet,
            sp.sheetName,
            fallbackSchoolId,
          );
          if (otherStudents.length > 0) {
            students = otherStudents;
            break;
          }
        }
      }

      if (students.length > 0) {
        return {
          students,
          detectedType: "students",
          sheetName: target.sheetName,
          sheetsSummary: {
            hasStudents: true,
            studentCount: students.length,
            hasActivities: false,
            activityCount: 0,
            hasRegistrations: false,
            registrationCount: 0,
          },
        };
      }

      // Only if NO students were found across all sheets, check if file is exclusively activities
      if (
        bestActivitySheet &&
        bestActivitySheet.analysis.type === "activities" &&
        bestActivitySheet.analysis.studentScore === 0
      ) {
        const activities = parseActivitiesSheet(
          bestActivitySheet.worksheet,
          bestActivitySheet.sheetName,
        );
        if (activities.length > 0) {
          return {
            activities,
            detectedType: "activities",
            sheetName: bestActivitySheet.sheetName,
            error:
              'קובץ זה זוהה כקובץ חוגים בלבד ולא נמצאו בו תלמידים. אם ברצונכם לייבא חוגים, אנא עברו ללשונית "חוגי שישי".',
          };
        }
      }

      // Fallback: check if it's an activities file
      const fallbackActs = parseActivitiesSheet(
        sheetProfiles[0].worksheet,
        sheetProfiles[0].sheetName,
      );
      if (fallbackActs.length > 0) {
        return {
          activities: fallbackActs,
          detectedType: "activities",
          sheetName: sheetProfiles[0].sheetName,
        };
      }

      return {
        error:
          "לא זוהו תלמידים תקינים בקובץ. אנא ודאו שהקובץ מכיל עמודות תלמידים (ת.ז או שם, כיתה ופרטי קשר).",
      };
    }

    // =========================================================
    // CASE D: Auto detection (Single Sheet or Fallback)
    // =========================================================
    if (
      bestRegistrationSheet &&
      bestRegistrationSheet.analysis.type === "registrations"
    ) {
      const regs = parseRegistrationsSheet(
        bestRegistrationSheet.worksheet,
        bestRegistrationSheet.sheetName,
        availableActivities,
      );
      if (regs.length > 0) {
        return {
          registrations: regs,
          detectedType: "registrations",
          sheetName: bestRegistrationSheet.sheetName,
          sheetsSummary: {
            hasStudents: false,
            studentCount: 0,
            hasActivities: false,
            activityCount: 0,
            hasRegistrations: true,
            registrationCount: regs.length,
          },
        };
      }
    }

    if (
      bestActivitySheet &&
      bestActivitySheet.analysis.type === "activities"
    ) {
      const activities = parseActivitiesSheet(
        bestActivitySheet.worksheet,
        bestActivitySheet.sheetName,
      );
      if (activities.length > 0) {
        return {
          activities,
          detectedType: "activities",
          sheetName: bestActivitySheet.sheetName,
        };
      }
    }

    if (
      bestStudentSheet &&
      bestStudentSheet.analysis.type === "students"
    ) {
      const students = parseStudentsSheet(
        bestStudentSheet.worksheet,
        bestStudentSheet.sheetName,
        fallbackSchoolId,
      );
      if (students.length > 0) {
        return {
          students,
          detectedType: "students",
          sheetName: bestStudentSheet.sheetName,
        };
      }
    }

    // Try activities, then students, then registrations on first sheet
    const autoActs = parseActivitiesSheet(
      sheetProfiles[0].worksheet,
      sheetProfiles[0].sheetName,
    );
    if (autoActs.length > 0) {
      return {
        activities: autoActs,
        detectedType: "activities",
        sheetName: sheetProfiles[0].sheetName,
      };
    }

    const autoStudents = parseStudentsSheet(
      sheetProfiles[0].worksheet,
      sheetProfiles[0].sheetName,
      fallbackSchoolId,
    );
    if (autoStudents.length > 0) {
      return {
        students: autoStudents,
        detectedType: "students",
        sheetName: sheetProfiles[0].sheetName,
      };
    }

    const autoRegs = parseRegistrationsSheet(
      sheetProfiles[0].worksheet,
      sheetProfiles[0].sheetName,
      availableActivities,
    );
    if (autoRegs.length > 0) {
      return {
        registrations: autoRegs,
        detectedType: "registrations",
        sheetName: sheetProfiles[0].sheetName,
      };
    }

    return {
      error:
        "מבנה העמודות בקובץ לא זוהה. אנא ודאו שבחרתם בסוג הקובץ הנכון (קובץ מלא, חוגים, תלמידים או נרשמים) או השתמשו בתבניות המוכנות להורדה.",
    };
  } catch (err: any) {
    return {
      error: `שגיאה בפענוח הקובץ: ${err.message || "קובץ לא נתמך"}`,
    };
  }
}
