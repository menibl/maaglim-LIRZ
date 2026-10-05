import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  canonicalSchoolKey,
  hydrateSchools,
  isUnexplainedShrink,
  mergeDefinedOptions,
  mergeSchoolSnapshot,
  parseBackupJson,
  persistSchoolsSnapshot,
  preferRegistration,
  tombKey,
  type SchoolSnapshot,
} from "./dataSafety";
import {
  canonicalizeSchoolId,
  detectSchoolFromRow,
  exportFullSchoolWorkbook,
  parseExcelArrayBuffer,
} from "./excelService";
import type { Activity, Registration, School, Student } from "../types";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    dump: () => data,
  };
}

function school(id: string): School {
  return {
    id,
    name: id,
    city: "חבל מודיעין",
    symbol: "1",
    academicYear: "2026",
    coordinator: {
      name: "רכזת",
      role: "רכזת",
      phone: "050",
      email: "a@b.co",
      receptionHours: "א-ה",
    },
    registrationDeadline: "2026-10-15",
    isOpenForRegistration: true,
    fridaySlots: [],
  };
}

function snapshot(id: string, registrations: Registration[], students: Student[] = []): SchoolSnapshot {
  return {
    school: school(id),
    students,
    activities: [],
    registrations,
    placements: [],
  };
}

function registration(partial: Partial<Registration> & { studentId: string }): Registration {
  return {
    id: partial.id || `REG-${partial.studentId}`,
    timestamp: partial.timestamp || "2026-10-01T00:00:00.000Z",
    studentId: partial.studentId,
    studentName: partial.studentName || "תלמיד בדיקה",
    studentGrade: partial.studentGrade || "כיתה ג'",
    parentName: partial.parentName || "הורה",
    parentPhone: partial.parentPhone || "050-0000000",
    parentEmail: partial.parentEmail || "p@example.com",
    slot1Choice: partial.slot1Choice || "",
    slot2Choice: partial.slot2Choice || "",
    slot3Choice: partial.slot3Choice || "",
    ...partial,
  };
}

const student = (id: string, lastName = "כהן"): Student => ({
  id,
  firstName: "דנה",
  lastName,
  grade: "כיתה ג'",
  gradeLayer: "ג",
  isAuthorized: true,
  schoolId: "sch-lapid-hmd",
  schoolName: 'בית ספר לפיד המ"ד',
  settlement: "לפיד",
});

function testMergeKeepsServerOnlyRecords() {
  const server = snapshot("sch-lapid-hmd", [
    registration({ studentId: "111", slot1Choice: "LPD-ACT-A-S1", timestamp: "2026-10-02T00:00:00.000Z" }),
    registration({ studentId: "222", slot1Choice: "LPD-ACT-B-S1", timestamp: "2026-10-02T00:00:00.000Z" }),
  ], [student("111"), student("222")]);
  const staleClient = snapshot("sch-lapid-hmd", [
    registration({ studentId: "111", slot1Choice: "LPD-ACT-A-S1", timestamp: "2026-10-01T00:00:00.000Z" }),
  ], [student("111")]);

  const merged = mergeSchoolSnapshot(server, staleClient);
  const ids = merged.data.registrations.map((reg) => reg.studentId).sort();
  assert.deepEqual(ids, ["111", "222"]);
  assert.equal(merged.data.students.length, 2);
}

function testEmptyShellDoesNotWipeChoices() {
  const rich = registration({
    studentId: "111",
    slot1Choice: "LPD-ACT-A-S1",
    slot2Choice: "LPD-ACT-B-S2",
    slot3Choice: "LPD-ACT-C-S3",
    timestamp: "2026-10-01T00:00:00.000Z",
  });
  const emptyShell = registration({
    studentId: "111",
    studentName: "תלמיד משוחזר",
    slot1Choice: "",
    slot2Choice: "",
    slot3Choice: "",
    timestamp: "2026-10-05T00:00:00.000Z",
    parentPhone: "",
  });
  const kept = preferRegistration(rich, emptyShell);
  assert.equal(kept.slot1Choice, "LPD-ACT-A-S1");
  const merged = mergeSchoolSnapshot(
    snapshot("sch-lapid-hmd", [rich]),
    snapshot("sch-lapid-hmd", [emptyShell]),
  );
  assert.equal(merged.data.registrations[0].slot1Choice, "LPD-ACT-A-S1");
}

function testIntentionalDeleteStaysDeleted() {
  const before = snapshot("sch-ben-shemen", [
    registration({ studentId: "111", slot1Choice: "BS-ACT-A-S1" }),
    registration({ studentId: "222", slot1Choice: "BS-ACT-B-S1" }),
  ]);
  const after = snapshot("sch-ben-shemen", [
    registration({ studentId: "222", slot1Choice: "BS-ACT-B-S1" }),
  ]);
  const merged = mergeSchoolSnapshot(before, after, {
    deleteRegistrationIds: ["REG-111"],
    deleteStudentIds: [],
  });
  assert.equal(merged.data.registrations.length, 1);
  assert.equal(merged.data.registrations[0].studentId, "222");

  const resurrect = mergeSchoolSnapshot(merged.data, before, { tombstones: merged.tombstones });
  assert.equal(resurrect.data.registrations.length, 1);
  assert.equal(resurrect.data.registrations[0].studentId, "222");

  const renamed = snapshot("sch-ben-shemen", [
    registration({ id: "REG-NEW", studentId: "111", slot1Choice: "BS-ACT-A-S1", timestamp: "2026-09-01T00:00:00.000Z" }),
    registration({ studentId: "222", slot1Choice: "BS-ACT-B-S1" }),
  ]);
  const stillDeleted = mergeSchoolSnapshot(merged.data, renamed, { tombstones: merged.tombstones });
  assert.equal(stillDeleted.data.registrations.length, 1);

  const restored = mergeSchoolSnapshot(merged.data, renamed, {
    tombstones: merged.tombstones,
    reviveRegistrationIds: ["REG-NEW"],
    reviveRegistrationStudentIds: ["111"],
  });
  assert.deepEqual(
    restored.data.registrations.map((reg) => reg.studentId).sort(),
    ["111", "222"],
  );
}

function testUndefinedDeleteListDoesNotEraseComputedDeletes() {
  const merged = mergeDefinedOptions(
    { deleteStudentIds: ["111"], deleteRegistrationIds: ["REG-111"] },
    { replaceStudents: true, deleteStudentIds: undefined },
  );
  assert.deepEqual(merged.deleteStudentIds, ["111"]);
  assert.equal(merged.replaceStudents, true);
}

function testSafetySnapshotRestoresUnexplainedLoss() {
  const storage = memoryStorage();
  const full = {
    "sch-lapid-hmd": snapshot("sch-lapid-hmd", [
      registration({ studentId: "111", slot1Choice: "LPD-ACT-A-S1" }),
      registration({ studentId: "222", slot1Choice: "LPD-ACT-B-S1" }),
      registration({ studentId: "333", slot1Choice: "LPD-ACT-C-S1" }),
    ], [student("111"), student("222"), student("333")]),
  };
  persistSchoolsSnapshot(storage, full);
  const shrunk = {
    "sch-lapid-hmd": snapshot("sch-lapid-hmd", [
      registration({ studentId: "111", slot1Choice: "LPD-ACT-A-S1" }),
    ], [student("111")]),
  };
  assert.equal(isUnexplainedShrink(full, shrunk, {}), true);
  persistSchoolsSnapshot(storage, shrunk);
  const hydrated = hydrateSchools(storage, {});
  const ids = hydrated["sch-lapid-hmd"].registrations.map((reg) => reg.studentId).sort();
  assert.deepEqual(ids, ["111", "222", "333"]);
}

function testSchoolIdentity() {
  assert.equal(canonicalSchoolKey("sch-lapid"), "sch-lapid-hmd");
  assert.equal(canonicalSchoolKey("sch-lapid-hmd"), "sch-lapid-hmd");
  assert.equal(canonicalizeSchoolId("sch-lapid-hmd"), "sch-lapid-hmd");
  assert.equal(canonicalizeSchoolId("לפיד"), "sch-lapid-hmd");
  assert.equal(tombKey("sch-lapid", "student", "111").startsWith("sch-lapid-hmd|"), true);

  const row = {
    "שם פרטי": "דנה",
    "שם משפחה": "נבון",
    יישוב: "לפיד",
    "תעודת זהות": "123456789",
    __headerRow: ["תעודת זהות", "שם פרטי", "שם משפחה", "כיתה", "שכבה", "סטטוס", "שם הורה", "טלפון", "מייל", "יישוב"],
    __rawColJ: "לפיד",
    __rowValues: ["123456789", "דנה", "נבון", "ג", "ג", "מאושר", "הורה", "050", "a@b.co", "לפיד"],
  };
  const detected = detectSchoolFromRow(row, "sch-ben-shemen", "Eligible_Students");
  assert.equal(detected.schoolId, "sch-ben-shemen");
  assert.equal(detected.isExplicitlyDetected, false);

  const explicit = detectSchoolFromRow(
    { ...row, "מזהה בית ספר": "sch-lapid-hmd", "בית ספר": 'בית ספר לפיד המ"ד' },
    "sch-ben-shemen",
  );
  assert.equal(explicit.schoolId, "sch-lapid-hmd");
  assert.equal(explicit.isExplicitlyDetected, true);
}

function testFullWorkbookRoundTrip() {
  const activities: Activity[] = [1, 2, 3].map((slot) => ({
    id: `LPD-ACT-WOODWORK-S${slot}`,
    name: "נגרות / ארץ חוץ",
    category: "enrichment",
    allowedGrades: ["א", "ב", "ג"],
    day: "שישי",
    slotNumber: slot as 1 | 2 | 3,
    startTime: slot === 1 ? "שעה ראשונה" : slot === 2 ? "שעה שניה" : "שעה שלישית",
    endTime: "",
    location: "מעגלים",
    instructor: "גיל",
    maxCapacity: 20,
    minCapacity: 8,
    description: "נגרות לילדים",
    status: "active",
  }));
  const students = [student("314562890", "נבון"), student("314562891", "לוי")];
  const registrations = [
    registration({
      studentId: "314562890",
      studentName: "דנה נבון",
      slot1Choice: "LPD-ACT-WOODWORK-S1",
      slot2Choice: "LPD-ACT-WOODWORK-S2",
      slot3Choice: "LPD-ACT-WOODWORK-S3",
    }),
    registration({
      studentId: "314562891",
      studentName: "דן לוי",
      slot1Choice: "LPD-ACT-WOODWORK-S1",
      slot2Choice: "LPD-ACT-WOODWORK-S2",
      slot3Choice: "LPD-ACT-WOODWORK-S3",
    }),
  ];
  const lapid = school("sch-lapid-hmd");
  lapid.name = 'בית ספר לפיד המ"ד';

  const sheets: Record<string, unknown[]> = {
    Eligible_Students: students.map((s) => ({
      "תעודת זהות": s.id,
      "שם פרטי": s.firstName,
      "שם משפחה": s.lastName,
      "מזהה בית ספר": s.schoolId,
      "בית ספר": s.schoolName,
      כיתה: s.grade,
      שכבה: s.gradeLayer,
      "סטטוס אישור הרשמה": "מאושר",
      "שם הורה": "הורה",
      "טלפון הורה": "050-0000000",
      'דוא"ל הורה': "p@example.com",
      יישוב: "לפיד",
    })),
    Activities: activities.map((a) => ({
      "מזהה חוג": a.id,
      "שם החוג": a.name,
      "משבצת יום שישי": a.startTime,
      קטגוריה: "העשרה",
      "שכבות גיל מותרות": "א,ב,ג",
      "מועד החוג": a.startTime,
      "שעת התחלה": a.startTime,
      "מדריך / מפעיל": a.instructor,
      "מכסת מקסימום": a.maxCapacity,
      "תיאור החוג": a.description,
    })),
    Registrations: registrations.map((r) => ({
      "מזהה רישום": r.id,
      "תעודת זהות תלמיד": r.studentId,
      "שם תלמיד": r.studentName,
      כיתה: r.studentGrade,
      "שם הורה": r.parentName,
      "משבצת 1 - מזהה חוג": r.slot1Choice,
      "משבצת 1 - חוג עיקרי": "נגרות / ארץ חוץ",
      "משבצת 2 - מזהה חוג": r.slot2Choice,
      "משבצת 2 - חוג עיקרי": "נגרות / ארץ חוץ",
      "משבצת 3 - מזהה חוג": r.slot3Choice,
      "משבצת 3 - חוג עיקרי": "נגרות / ארץ חוץ",
    })),
    Placements: registrations.flatMap((r) =>
      [1, 2, 3].map((slot) => ({
        "תעודת זהות": r.studentId,
        "שם מלא": r.studentName,
        "משבצת זמן": `משבצת ${slot}`,
        "מזהה חוג": `LPD-ACT-WOODWORK-S${slot}`,
        "חוג משובץ": "נגרות / ארץ חוץ",
      })),
    ),
  };
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  });
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const parsed = parseExcelArrayBuffer(buffer, "sch-lapid-hmd", "full_workbook", activities);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.detectedType, "full_workbook");
  assert.equal(parsed.students?.length, 2);
  assert.equal(parsed.activities?.length, 3);
  assert.equal(parsed.registrations?.length, 2);
  assert.equal(parsed.students?.every((s) => s.schoolId === "sch-lapid-hmd"), true);
  const navonChild = parsed.students?.find((s) => s.lastName === "נבון");
  assert.equal(navonChild?.schoolId, "sch-lapid-hmd");
  assert.equal(parsed.registrations?.find((r) => r.studentId === "314562890")?.slot2Choice, "LPD-ACT-WOODWORK-S2");

  const payload = {
    kind: "maagalim-full-backup",
    version: 1,
    schools: {
      "sch-lapid": snapshot("sch-lapid", registrations, students),
    },
  };
  const backup = parseBackupJson(JSON.stringify(payload));
  assert.ok(backup);
  assert.ok(backup["sch-lapid-hmd"]);
  assert.equal(backup["sch-lapid"], undefined);
  assert.equal(backup["sch-lapid-hmd"].registrations.length, 2);
  void exportFullSchoolWorkbook;
  void lapid;
}

testMergeKeepsServerOnlyRecords();
testEmptyShellDoesNotWipeChoices();
testIntentionalDeleteStaysDeleted();
testUndefinedDeleteListDoesNotEraseComputedDeletes();
testSafetySnapshotRestoresUnexplainedLoss();
testSchoolIdentity();
testFullWorkbookRoundTrip();
console.log("data safety tests passed");
