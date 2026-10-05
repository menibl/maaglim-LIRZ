import { Registration, Student } from "../types";
import { SchoolData } from "../data/initialData";
import { canonicalSchoolKey, readTombstones, tombKey } from "../services/dataSafety";

export interface RecoveryScanResult {
  foundRegistrations: Record<string, Registration[]>;
  foundStudents: Record<string, Student[]>;
  totalRegistrationsFound: number;
  totalStudentsFound: number;
  scannedKeysCount: number;
}

/**
 * Deep forensic scanner across the client browser's localStorage & sessionStorage
 * to discover any registrations or students that were stored prior to accidental overwrites.
 */
export function deepScanBrowserForData(currentSchools: Record<string, SchoolData>): RecoveryScanResult {
  const result: RecoveryScanResult = {
    foundRegistrations: {},
    foundStudents: {},
    totalRegistrationsFound: 0,
    totalStudentsFound: 0,
    scannedKeysCount: 0,
  };

  Object.keys(currentSchools).forEach((k) => {
    result.foundRegistrations[k] = [];
    result.foundStudents[k] = [];
  });

  if (typeof window === "undefined" || !window.localStorage) {
    return result;
  }

  const storages = [window.localStorage, window.sessionStorage];
  const seenRegKeys = new Set<string>();
  const seenStudentKeys = new Set<string>();

  storages.forEach((storage) => {
    if (!storage) return;
    try {
      const keysCount = storage.length;
      result.scannedKeysCount += keysCount;

      for (let i = 0; i < keysCount; i++) {
        const key = storage.key(i);
        if (!key) continue;

        try {
          const raw = storage.getItem(key);
          if (!raw || raw.length < 5) continue;

          // Attempt to parse JSON
          const parsed = JSON.parse(raw);
          inspectAndExtract(parsed, currentSchools, result, seenRegKeys, seenStudentKeys);
        } catch (e) {
          // not valid JSON, ignore
        }
      }
    } catch (e) {
      console.warn("Error scanning storage:", e);
    }
  });

  result.totalRegistrationsFound = Object.values(result.foundRegistrations).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  result.totalStudentsFound = Object.values(result.foundStudents).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  return result;
}

function inspectAndExtract(
  node: any,
  schools: Record<string, SchoolData>,
  result: RecoveryScanResult,
  seenRegKeys: Set<string>,
  seenStudentKeys: Set<string>,
) {
  if (!node || typeof node !== "object") return;

  // 1. If it's a full SchoolData or schools map object
  if (node["sch-lapid-hmd"] || node["sch-ben-shemen"] || node["sch-yitzhak-navon"]) {
    Object.entries(node).forEach(([sKey, sVal]: [string, any]) => {
      if (sVal && typeof sVal === "object") {
        if (Array.isArray(sVal.registrations)) {
          sVal.registrations.forEach((r: any) => addRegistration(r, sKey, result, seenRegKeys));
        }
        if (Array.isArray(sVal.students)) {
          sVal.students.forEach((s: any) => addStudent(s, sKey, result, seenStudentKeys));
        }
      }
    });
    return;
  }

  // 2. If it is an array
  if (Array.isArray(node)) {
    node.forEach((item) => {
      if (isRegistration(item)) {
        const schoolKey = resolveSchoolForRegistration(item, schools);
        if (schoolKey) addRegistration(item, schoolKey, result, seenRegKeys);
      } else if (isStudent(item)) {
        const schoolKey = resolveSchoolForStudent(item, schools);
        if (schoolKey) addStudent(item, schoolKey, result, seenStudentKeys);
      } else if (typeof item === "object") {
        inspectAndExtract(item, schools, result, seenRegKeys, seenStudentKeys);
      }
    });
    return;
  }

  // 3. If it's an object with registrations or students keys
  if (Array.isArray(node.registrations)) {
    const sKey = node.school?.id || node.id || "sch-lapid-hmd";
    node.registrations.forEach((r: any) => addRegistration(r, sKey, result, seenRegKeys));
  }
  if (Array.isArray(node.students)) {
    const sKey = node.school?.id || node.id || "sch-lapid-hmd";
    node.students.forEach((s: any) => addStudent(s, sKey, result, seenStudentKeys));
  }

  // 4. If this object itself is a single Registration
  if (isRegistration(node)) {
    const sKey = resolveSchoolForRegistration(node, schools);
    if (sKey) addRegistration(node, sKey, result, seenRegKeys);
  }

  // 5. If this object itself is a single Student
  if (isStudent(node)) {
    const sKey = resolveSchoolForStudent(node, schools);
    if (sKey) addStudent(node, sKey, result, seenStudentKeys);
  }

  // Recursively inspect nested object properties
  Object.values(node).forEach((val) => {
    if (val && typeof val === "object") {
      inspectAndExtract(val, schools, result, seenRegKeys, seenStudentKeys);
    }
  });
}

function isRegistration(item: any): boolean {
  if (!item || typeof item !== "object" || typeof item.studentId !== "string") return false;
  // Placements also have studentId + studentName. Treating them as registrations
  // replaced real choices with empty shells and looked like deleted records.
  if (
    typeof item.slotNumber === "number" &&
    Object.prototype.hasOwnProperty.call(item, "placedActivityId") &&
    !item.slot1Choice &&
    !item.slot2Choice &&
    !item.slot3Choice
  ) {
    return false;
  }
  return (
    typeof item.slot1Choice === "string" ||
    typeof item.slot2Choice === "string" ||
    typeof item.slot3Choice === "string" ||
    typeof item.firstChoice === "string" ||
    typeof item.secondChoice === "string" ||
    typeof item.thirdChoice === "string"
  );
}

function isStudent(item: any): boolean {
  return (
    item &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    item.id.length >= 6 &&
    (typeof item.grade === "string" ||
      typeof item.gradeLayer === "string" ||
      typeof item.firstName === "string")
  );
}

function resolveSchoolForRegistration(
  reg: any,
  schools: Record<string, SchoolData>,
): string | null {
  const explicit = canonicalSchoolKey(reg.schoolId);
  if (explicit && schools[explicit]) return explicit;
  if (reg.schoolId && schools[reg.schoolId]) return reg.schoolId;
  const choice = reg.slot1Choice || reg.slot2Choice || reg.slot3Choice || "";
  if (typeof choice === "string") {
    if (choice.startsWith("LP") || choice.startsWith("LPD")) return "sch-lapid-hmd";
    if (choice.startsWith("YN")) return "sch-yitzhak-navon";
    if (choice.startsWith("BS")) return "sch-ben-shemen";
  }
  return null;
}

function resolveSchoolForStudent(
  st: any,
  schools: Record<string, SchoolData>,
): string | null {
  const explicit = canonicalSchoolKey(st.schoolId);
  if (explicit && schools[explicit]) return explicit;
  if (st.schoolId && schools[st.schoolId]) return st.schoolId;
  if (st.schoolName && !isPersonName(st.schoolName)) {
    if (st.schoolName.includes("לפיד")) return "sch-lapid-hmd";
    if (st.schoolName.includes("יצחק נבון") || st.schoolName.includes("נבון")) return "sch-yitzhak-navon";
    if (st.schoolName.includes("שמן")) return "sch-ben-shemen";
  }
  return null;
}

function isPersonName(value: string): boolean {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => /^[\u0590-\u05FF'"״]+$/.test(part)) && !value.includes("בית");
}

function addRegistration(
  reg: any,
  schoolKey: string,
  result: RecoveryScanResult,
  seen: Set<string>,
) {
  if (!reg || !reg.studentId || !schoolKey) return;
  try {
    const tombstones = typeof localStorage === "undefined" ? {} : readTombstones(localStorage);
    if (
      tombstones[tombKey(schoolKey, "registration", reg.id || "")] ||
      tombstones[tombKey(schoolKey, "registrationStudent", String(reg.studentId).trim())]
    ) {
      return;
    }
  } catch {
    // ignore storage access
  }
  const key = `${schoolKey}_${reg.studentId.trim()}`;
  if (seen.has(key)) return;
  seen.add(key);

  const cleanReg: Registration = {
    id: reg.id || `REG-REC-${reg.studentId}`,
    studentId: String(reg.studentId).trim(),
    studentName: reg.studentName || "תלמיד משוחזר",
    studentGrade: reg.studentGrade || reg.grade || "כיתה ג'",
    parentName: reg.parentName || "הורה",
    parentPhone: reg.parentPhone || "050-0000000",
    parentEmail: reg.parentEmail || "",
    slot1Choice: reg.slot1Choice || reg.firstChoice || "",
    slot2Choice: reg.slot2Choice || reg.secondChoice || "",
    slot3Choice: reg.slot3Choice || reg.thirdChoice || "",
    timestamp: reg.timestamp || new Date().toISOString(),
    notes: reg.notes || "שוחזר מזיכרון מטמון דפדפן",
  };

  if (!result.foundRegistrations[schoolKey]) {
    result.foundRegistrations[schoolKey] = [];
  }
  result.foundRegistrations[schoolKey].push(cleanReg);
}

function addStudent(
  st: any,
  schoolKey: string,
  result: RecoveryScanResult,
  seen: Set<string>,
) {
  if (!st || !st.id || !schoolKey) return;
  try {
    const tombstones = typeof localStorage === "undefined" ? {} : readTombstones(localStorage);
    if (tombstones[tombKey(schoolKey, "student", String(st.id).trim())]) return;
  } catch {
    // ignore storage access
  }
  const key = `${schoolKey}_${st.id.trim()}`;
  if (seen.has(key)) return;
  seen.add(key);

  const cleanStudent: Student = {
    id: String(st.id).trim(),
    firstName: st.firstName || (st.name ? st.name.split(" ")[0] : "תלמיד"),
    lastName: st.lastName || (st.name ? st.name.split(" ").slice(1).join(" ") : ""),
    grade: st.grade || "כיתה ג'",
    gradeLayer: st.gradeLayer || "ג",
    isAuthorized: st.isAuthorized !== undefined ? Boolean(st.isAuthorized) : true,
    parentName: st.parentName || "",
    parentPhone: st.parentPhone || "",
    parentEmail: st.parentEmail || "",
    schoolId: schoolKey,
    schoolName: st.schoolName || "",
  };

  if (!result.foundStudents[schoolKey]) {
    result.foundStudents[schoolKey] = [];
  }
  result.foundStudents[schoolKey].push(cleanStudent);
}
