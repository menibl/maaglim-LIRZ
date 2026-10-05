import {
  Student,
  Activity,
  Registration,
  Placement,
  AlgorithmConfig,
  PlacementExecutionLog,
  PlacementSummary,
} from "../types";
import {
  getActivityBaseKey,
  isMolecularCookingActivity,
  findMolecularCookingSlot3Activity,
} from "../utils/activityRules";

export interface MatchingResult {
  placements: Placement[];
  logs: PlacementExecutionLog[];
  summary: PlacementSummary;
  waitlists: Record<
    string,
    {
      studentId: string;
      studentName: string;
      position: number;
      priorityLevel: number;
      slotNumber: number;
    }[]
  >;
}

export function runMatchingAlgorithm(
  students: Student[],
  activities: Activity[],
  registrations: Registration[],
  config: AlgorithmConfig = {
    strategy: "first_come",
    autoWaitlist: true,
    minCapacityEnforcement: "warn",
  },
): MatchingResult {
  const logs: PlacementExecutionLog[] = [];
  const addLog = (
    stage: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      stage,
      message,
      type,
    });
  };

  addLog(
    "אתחול שיבוץ כל הקודם זוכה",
    `מתחיל תהליך שיבוץ אוטומטי ל-3 חוגים ביום שישי בשיטת "כל הקודם זוכה" (סדר הגשת הבקשה לפי חותמת זמן).`,
    "info",
  );

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id.trim(), s));

  const activityMap = new Map<string, Activity>();
  activities.forEach((a) => activityMap.set(a.id.trim(), a));

  const capacityLeft = new Map<string, number>();
  activities.forEach((a) => {
    capacityLeft.set(a.id.trim(), a.maxCapacity || 20);
  });

  const enrolledStudents = new Map<string, string[]>(); // activityId -> studentIds
  activities.forEach((a) => enrolledStudents.set(a.id.trim(), []));

  const waitlists: Record<
    string,
    {
      studentId: string;
      studentName: string;
      position: number;
      priorityLevel: number;
      slotNumber: number;
    }[]
  > = {};
  activities.forEach((a) => {
    waitlists[a.id.trim()] = [];
  });

  const allPlacements: Placement[] = [];

  // ==========================================
  // שלב 0: אימות זכאות תלמידים
  // ==========================================
  addLog(
    "אימות זכאות",
    `בודק ${registrations.length} בקשות רישום מול מאגר התלמידים הזכאים בחבל מודיעין...`,
    "info",
  );
  const validRegistrations: Registration[] = [];

  for (const reg of registrations) {
    const student = studentMap.get(reg.studentId.trim());

    if (!student) {
      addLog(
        "אימות זכאות",
        `תלמיד/ה ${reg.studentName} (ת.ז. ${reg.studentId}) אינו מופיע ברשימת הזכאים. הבקשה נדחתה.`,
        "error",
      );
      for (const slot of [1, 2, 3] as const) {
        allPlacements.push({
          id: `PLC-${reg.studentId}-SLOT${slot}`,
          studentId: reg.studentId,
          studentName: reg.studentName,
          grade: reg.studentGrade,
          slotNumber: slot,
          placedActivityId: null,
          status: "rejected",
          priorityAchieved: null,
          placementNotes: "נדחה: תלמיד אינו קיים ברשימת התלמידים הזכאים",
          placedAt: new Date().toISOString(),
          isManualOverride: false,
        });
      }
      continue;
    }

    if (!student.isAuthorized) {
      addLog(
        "אימות זכאות",
        `תלמיד/ה ${reg.studentName} קיים אך אישור ההרשמה במערכת חסום/ממתין.`,
        "warning",
      );
      for (const slot of [1, 2, 3] as const) {
        allPlacements.push({
          id: `PLC-${reg.studentId}-SLOT${slot}`,
          studentId: reg.studentId,
          studentName: reg.studentName,
          grade: reg.studentGrade,
          slotNumber: slot,
          placedActivityId: null,
          status: "rejected",
          priorityAchieved: null,
          placementNotes: "נדחה: סטטוס אישור הרשמה לא מאושר במערכת הזכאים",
          placedAt: new Date().toISOString(),
          isManualOverride: false,
        });
      }
      continue;
    }

    validRegistrations.push(reg);
  }

  addLog(
    "אימות זכאות",
    `אושר תוקף של ${validRegistrations.length} מתוך ${registrations.length} תלמידים לשיבוץ.`,
    "success",
  );

  // Sort by registration timestamp (First-Come, First-Served)
  const sortedRegistrations = [...validRegistrations].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeA - timeB;
  });

  const molecularSlot3Activity = findMolecularCookingSlot3Activity(activities);

  // Process registrations one by one in FCFS order
  for (const reg of sortedRegistrations) {
    const student = studentMap.get(reg.studentId.trim())!;
    const assignedSubjects = new Set<string>();

    // -------------------------------------------------------------
    // המשבצת הראשונה (Slot 1)
    // -------------------------------------------------------------
    const act1 = activityMap.get(reg.slot1Choice?.trim());
    if (act1) {
      const cap1 = capacityLeft.get(act1.id) || 0;
      if (cap1 > 0) {
        capacityLeft.set(act1.id, cap1 - 1);
        enrolledStudents.get(act1.id)!.push(reg.studentId);
        assignedSubjects.add(getActivityBaseKey(act1));

        allPlacements.push({
          id: `PLC-${reg.studentId}-SLOT1`,
          studentId: reg.studentId,
          studentName: reg.studentName,
          grade: reg.studentGrade,
          slotNumber: 1,
          placedActivityId: act1.id,
          status: "placed",
          priorityAchieved: 1,
          placementNotes: `שובץ בהצלחה (כל הקודם זוכה) לשעה ראשונה בחוג "${act1.name}"`,
          placedAt: new Date().toISOString(),
          isManualOverride: false,
        });
      } else {
        const curW = waitlists[act1.id] || [];
        curW.push({
          studentId: reg.studentId,
          studentName: reg.studentName,
          position: curW.length + 1,
          priorityLevel: 1,
          slotNumber: 1,
        });
        waitlists[act1.id] = curW;

        allPlacements.push({
          id: `PLC-${reg.studentId}-SLOT1`,
          studentId: reg.studentId,
          studentName: reg.studentName,
          grade: reg.studentGrade,
          slotNumber: 1,
          placedActivityId: null,
          status: "waitlist",
          priorityAchieved: null,
          waitlistPosition: curW.length,
          waitlistActivityId: act1.id,
          placementNotes: `החוג "${act1.name}" התמלא במלואו (מקום ${curW.length} ברשימת המתנה)`,
          placedAt: new Date().toISOString(),
          isManualOverride: false,
        });
      }
    } else {
      allPlacements.push({
        id: `PLC-${reg.studentId}-SLOT1`,
        studentId: reg.studentId,
        studentName: reg.studentName,
        grade: reg.studentGrade,
        slotNumber: 1,
        placedActivityId: null,
        status: "unplaced",
        priorityAchieved: null,
        placementNotes: "לא נבחר חוג תקף לשעה ראשונה",
        placedAt: new Date().toISOString(),
        isManualOverride: false,
      });
    }

    // -------------------------------------------------------------
    // המשבצת השנייה (Slot 2) & המשך בישול מולקולרי (Slot 3)
    // -------------------------------------------------------------
    const act2 = activityMap.get(reg.slot2Choice?.trim());
    let isPlacedMolecularCombo = false;

    if (act2) {
      const isMolecular = isMolecularCookingActivity(act2);

      // Special rule: Molecular Cooking spans Slot 2 and Slot 3 consecutively
      if (isMolecular && molecularSlot3Activity) {
        const cap2 = capacityLeft.get(act2.id) || 0;
        const cap3 = capacityLeft.get(molecularSlot3Activity.id) || 0;

        if (cap2 > 0 && cap3 > 0) {
          capacityLeft.set(act2.id, cap2 - 1);
          capacityLeft.set(molecularSlot3Activity.id, cap3 - 1);
          enrolledStudents.get(act2.id)!.push(reg.studentId);
          enrolledStudents.get(molecularSlot3Activity.id)!.push(reg.studentId);
          assignedSubjects.add(getActivityBaseKey(act2));
          isPlacedMolecularCombo = true;

          allPlacements.push({
            id: `PLC-${reg.studentId}-SLOT2`,
            studentId: reg.studentId,
            studentName: reg.studentName,
            grade: reg.studentGrade,
            slotNumber: 2,
            placedActivityId: act2.id,
            status: "placed",
            priorityAchieved: 1,
            placementNotes: `שובץ לבישול מולקולרי חלק א' (שעה שניה)`,
            placedAt: new Date().toISOString(),
            isManualOverride: false,
          });

          allPlacements.push({
            id: `PLC-${reg.studentId}-SLOT3`,
            studentId: reg.studentId,
            studentName: reg.studentName,
            grade: reg.studentGrade,
            slotNumber: 3,
            placedActivityId: molecularSlot3Activity.id,
            status: "placed",
            priorityAchieved: 1,
            placementNotes: `שובץ לבישול מולקולרי חלק ב' (המשך רצוף בשעה שלישית)`,
            placedAt: new Date().toISOString(),
            isManualOverride: false,
          });
        } else {
          // Waitlist for molecular cooking
          const curW2 = waitlists[act2.id] || [];
          curW2.push({
            studentId: reg.studentId,
            studentName: reg.studentName,
            position: curW2.length + 1,
            priorityLevel: 1,
            slotNumber: 2,
          });
          waitlists[act2.id] = curW2;

          allPlacements.push({
            id: `PLC-${reg.studentId}-SLOT2`,
            studentId: reg.studentId,
            studentName: reg.studentName,
            grade: reg.studentGrade,
            slotNumber: 2,
            placedActivityId: null,
            status: "waitlist",
            priorityAchieved: null,
            waitlistPosition: curW2.length,
            waitlistActivityId: act2.id,
            placementNotes: `חוג בישול מולקולרי מלא (מקום ${curW2.length} ברשימת המתנה)`,
            placedAt: new Date().toISOString(),
            isManualOverride: false,
          });
        }
      } else {
        // Regular Activity for Slot 2
        const key2 = getActivityBaseKey(act2);
        const isDuplicate = assignedSubjects.has(key2);

        if (isDuplicate) {
          allPlacements.push({
            id: `PLC-${reg.studentId}-SLOT2`,
            studentId: reg.studentId,
            studentName: reg.studentName,
            grade: reg.studentGrade,
            slotNumber: 2,
            placedActivityId: null,
            status: "unplaced",
            priorityAchieved: null,
            placementNotes: `נחסם: לא ניתן להירשם לאותו חוג פעמיים ("${act2.name}" כבר נבחר בשעה ראשונה)`,
            placedAt: new Date().toISOString(),
            isManualOverride: false,
          });
        } else {
          const cap2 = capacityLeft.get(act2.id) || 0;
          if (cap2 > 0) {
            capacityLeft.set(act2.id, cap2 - 1);
            enrolledStudents.get(act2.id)!.push(reg.studentId);
            assignedSubjects.add(key2);

            allPlacements.push({
              id: `PLC-${reg.studentId}-SLOT2`,
              studentId: reg.studentId,
              studentName: reg.studentName,
              grade: reg.studentGrade,
              slotNumber: 2,
              placedActivityId: act2.id,
              status: "placed",
              priorityAchieved: 1,
              placementNotes: `שובץ בהצלחה (כל הקודם זוכה) לשעה שניה בחוג "${act2.name}"`,
              placedAt: new Date().toISOString(),
              isManualOverride: false,
            });
          } else {
            const curW = waitlists[act2.id] || [];
            curW.push({
              studentId: reg.studentId,
              studentName: reg.studentName,
              position: curW.length + 1,
              priorityLevel: 1,
              slotNumber: 2,
            });
            waitlists[act2.id] = curW;

            allPlacements.push({
              id: `PLC-${reg.studentId}-SLOT2`,
              studentId: reg.studentId,
              studentName: reg.studentName,
              grade: reg.studentGrade,
              slotNumber: 2,
              placedActivityId: null,
              status: "waitlist",
              priorityAchieved: null,
              waitlistPosition: curW.length,
              waitlistActivityId: act2.id,
              placementNotes: `החוג "${act2.name}" התמלא במלואו (מקום ${curW.length} ברשימת המתנה)`,
              placedAt: new Date().toISOString(),
              isManualOverride: false,
            });
          }
        }
      }
    } else {
      allPlacements.push({
        id: `PLC-${reg.studentId}-SLOT2`,
        studentId: reg.studentId,
        studentName: reg.studentName,
        grade: reg.studentGrade,
        slotNumber: 2,
        placedActivityId: null,
        status: "unplaced",
        priorityAchieved: null,
        placementNotes: "לא נבחר חוג תקף לשעה שניה",
        placedAt: new Date().toISOString(),
        isManualOverride: false,
      });
    }

    // -------------------------------------------------------------
    // המשבצת השלישית (Slot 3) - רק אם לא שובץ כבר דרך בישול מולקולרי
    // -------------------------------------------------------------
    if (!isPlacedMolecularCombo) {
      const act3 = activityMap.get(reg.slot3Choice?.trim());
      if (act3) {
        const key3 = getActivityBaseKey(act3);
        const isDuplicate = assignedSubjects.has(key3);

        if (isDuplicate) {
          allPlacements.push({
            id: `PLC-${reg.studentId}-SLOT3`,
            studentId: reg.studentId,
            studentName: reg.studentName,
            grade: reg.studentGrade,
            slotNumber: 3,
            placedActivityId: null,
            status: "unplaced",
            priorityAchieved: null,
            placementNotes: `נחסם: לא ניתן להירשם לאותו חוג פעמיים ("${act3.name}" נבחר כבר בשעה מוקדמת)`,
            placedAt: new Date().toISOString(),
            isManualOverride: false,
          });
        } else {
          const cap3 = capacityLeft.get(act3.id) || 0;
          if (cap3 > 0) {
            capacityLeft.set(act3.id, cap3 - 1);
            enrolledStudents.get(act3.id)!.push(reg.studentId);
            assignedSubjects.add(key3);

            allPlacements.push({
              id: `PLC-${reg.studentId}-SLOT3`,
              studentId: reg.studentId,
              studentName: reg.studentName,
              grade: reg.studentGrade,
              slotNumber: 3,
              placedActivityId: act3.id,
              status: "placed",
              priorityAchieved: 1,
              placementNotes: `שובץ בהצלחה (כל הקודם זוכה) לשעה שלישית בחוג "${act3.name}"`,
              placedAt: new Date().toISOString(),
              isManualOverride: false,
            });
          } else {
            const curW = waitlists[act3.id] || [];
            curW.push({
              studentId: reg.studentId,
              studentName: reg.studentName,
              position: curW.length + 1,
              priorityLevel: 1,
              slotNumber: 3,
            });
            waitlists[act3.id] = curW;

            allPlacements.push({
              id: `PLC-${reg.studentId}-SLOT3`,
              studentId: reg.studentId,
              studentName: reg.studentName,
              grade: reg.studentGrade,
              slotNumber: 3,
              placedActivityId: null,
              status: "waitlist",
              priorityAchieved: null,
              waitlistPosition: curW.length,
              waitlistActivityId: act3.id,
              placementNotes: `החוג "${act3.name}" התמלא במלואו (מקום ${curW.length} ברשימת המתנה)`,
              placedAt: new Date().toISOString(),
              isManualOverride: false,
            });
          }
        }
      } else {
        allPlacements.push({
          id: `PLC-${reg.studentId}-SLOT3`,
          studentId: reg.studentId,
          studentName: reg.studentName,
          grade: reg.studentGrade,
          slotNumber: 3,
          placedActivityId: null,
          status: "unplaced",
          priorityAchieved: null,
          placementNotes: "לא נבחר חוג תקף לשעה שלישית",
          placedAt: new Date().toISOString(),
          isManualOverride: false,
        });
      }
    }
  }

  // ==========================================
  // בקרת מכסת מינימום לפתיחת חוגים
  // ==========================================
  addLog("בקרת מינימום", "בודק עמידה ברף מינימום תלמידים לחוג...", "info");
  let underMinCount = 0;

  for (const activity of activities) {
    const enrolled = enrolledStudents.get(activity.id)?.length || 0;
    if (enrolled > 0 && enrolled < (activity.minCapacity || 8)) {
      underMinCount++;
      addLog(
        "בקרת מינימום",
        `החוג "${activity.name}" מונה ${enrolled} נרשמים בלבד (פחות ממינימום ${activity.minCapacity || 8}).`,
        "warning",
      );
    }
  }

  // ==========================================
  // סיכום סטטיסטי
  // ==========================================
  const placedCount = allPlacements.filter((p) => p.status === "placed").length;
  const waitlistCount = allPlacements.filter(
    (p) => p.status === "waitlist",
  ).length;
  const unplacedSlotsCount = allPlacements.filter(
    (p) => p.status === "rejected" || p.status === "unplaced",
  ).length;
  const totalSpotsRequested = registrations.length * 3;
  const matchRate =
    totalSpotsRequested > 0 ? (placedCount / totalSpotsRequested) * 100 : 100;

  // Count fully placed students (placed in all 3 slots)
  const studentSlotMap = new Map<string, number>();
  allPlacements.forEach((p) => {
    if (p.status === "placed") {
      studentSlotMap.set(
        p.studentId,
        (studentSlotMap.get(p.studentId) || 0) + 1,
      );
    }
  });
  let fullyPlacedStudentsCount = 0;
  studentSlotMap.forEach((count) => {
    if (count === 3) fullyPlacedStudentsCount++;
  });

  const summary: PlacementSummary = {
    totalEligible: students.length,
    totalRegistered: registrations.length,
    fullyPlacedStudentsCount,
    totalPlacementsCount: placedCount,
    priority1Count: placedCount,
    priority2Count: 0,
    waitlistCount,
    unplacedSlotsCount,
    underMinQuotaCount: underMinCount,
    placementRate: Math.round(matchRate),
  };

  addLog(
    "סיום שיבוץ",
    `השיבוץ הושלם בהצלחה! שובצו ${placedCount} מקומות מתוך ${totalSpotsRequested} מבוקשים (${Math.round(matchRate)}% הצלחה).`,
    "success",
  );

  return {
    placements: allPlacements,
    logs,
    summary,
    waitlists,
  };
}
