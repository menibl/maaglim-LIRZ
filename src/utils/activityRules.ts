import { Activity, Registration, Student } from "../types";

/**
 * Extracts a normalized subject key for an activity to detect duplicate subjects across hours.
 * (e.g. 'SOCCER', 'WOODWORK', 'ARTS-MULTI', 'PASTRY-YOUNG')
 */
export function getActivityBaseKey(activity: {
  id: string;
  name: string;
}): string {
  if (!activity) return "";

  // Try to match standard pattern: [SCHOOL]-ACT-[CODE]-S[1|2|3]
  const idMatch = activity.id.match(/-ACT-([A-Za-z0-9_-]+)-S\d/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1].toUpperCase();
  }

  // Fallback to cleaned name
  return activity.name
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/['"״]/g, "")
    .replace(/שעה\s*(ראשונה|שניה|שנייה|שלישית|1|2|3)/g, "")
    .replace(/משבצת\s*\d/g, "")
    .replace(/חלק\s*[אבג]/g, "")
    .replace(/המשך\s*רצוף/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Checks whether an activity is the special Molecular Cooking activity
 * which is only at Yitzhak Navon and spans Hour 2 + Hour 3 continuously.
 */
export function isMolecularCookingActivity(
  activity?: { id?: string; name?: string } | null,
): boolean {
  if (!activity) return false;
  const str = `${activity.id || ""} ${activity.name || ""}`;
  return (
    str.includes("MOLECULAR-COOKING") ||
    str.includes("בישול מולקולרי") ||
    str.includes("מולקולרי")
  );
}

/**
 * Finds the matching Slot 3 Molecular Cooking activity in the list of school activities.
 */
export function findMolecularCookingSlot3Activity(
  activities: Activity[],
): Activity | undefined {
  return activities.find(
    (a) => a.slotNumber === 3 && isMolecularCookingActivity(a),
  );
}

/**
 * Finds the matching Slot 2 Molecular Cooking activity in the list of school activities.
 */
export function findMolecularCookingSlot2Activity(
  activities: Activity[],
): Activity | undefined {
  return activities.find(
    (a) => a.slotNumber === 2 && isMolecularCookingActivity(a),
  );
}

/**
 * Calculates live enrolled count for every activity based on active registrations.
 * Can optionally exclude a specific studentId (e.g. when an existing student is editing their choices).
 */
export function calculateLiveEnrollmentCounts(
  registrations: Registration[],
  excludeStudentId?: string,
): Record<string, number> {
  const counts: Record<string, number> = {};

  registrations.forEach((reg) => {
    if (excludeStudentId && reg.studentId.trim() === excludeStudentId.trim()) {
      return;
    }

    if (reg.slot1Choice) {
      counts[reg.slot1Choice] = (counts[reg.slot1Choice] || 0) + 1;
    }
    if (reg.slot2Choice) {
      counts[reg.slot2Choice] = (counts[reg.slot2Choice] || 0) + 1;
    }
    if (reg.slot3Choice) {
      counts[reg.slot3Choice] = (counts[reg.slot3Choice] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Gets live capacity details for a given activity.
 */
export function getActivityCapacityInfo(
  activity: Activity,
  enrollmentCounts: Record<string, number>,
  isCurrentlySelectedByStudent: boolean = false,
): {
  enrolled: number;
  max: number;
  remaining: number;
  isFull: boolean;
  isNearlyFull: boolean;
} {
  const enrolled = enrollmentCounts[activity.id] || 0;
  const max = activity.maxCapacity || 20;
  const remaining = Math.max(0, max - enrolled);
  const isFull = remaining <= 0 && !isCurrentlySelectedByStudent;
  const isNearlyFull =
    remaining > 0 && remaining <= 4 && !isCurrentlySelectedByStudent;

  return {
    enrolled,
    max,
    remaining,
    isFull,
    isNearlyFull,
  };
}

/**
 * Validates a student's 3 slot selections:
 * 1. Checks if all 3 slots are selected.
 * 2. Checks no duplicate subjects across different hours (e.g. soccer in hour 1 and hour 2).
 * 3. Enforces Molecular Cooking 2-hour link (Slot 2 + Slot 3) at Yitzhak Navon.
 * 4. Verifies live capacity availability for each chosen activity.
 */
export function validateRegistrationSelections(
  schoolId: string,
  activities: Activity[],
  registrations: Registration[],
  student: Student,
  slot1Id: string,
  slot2Id: string,
  slot3Id: string,
): { isValid: boolean; error?: string; adjustedSlot3Id?: string } {
  if (!slot1Id || !slot2Id || !slot3Id) {
    return {
      isValid: false,
      error: "יש לבחור חוג עבור כל אחת מ-3 המשבצות של יום שישי.",
    };
  }

  const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
  const act1 = actMap.get(slot1Id);
  const act2 = actMap.get(slot2Id);
  let act3 = actMap.get(slot3Id);

  if (!act1 || !act2 || !act3) {
    return { isValid: false, error: "אחד מהחוגים שנבחרו אינו קיים במערכת." };
  }

  // Molecular cooking rule (takes 2 hours: Slot 2 + Slot 3)
  const isSlot2Molecular = isMolecularCookingActivity(act2);
  let adjustedSlot3Id = slot3Id;

  if (isSlot2Molecular) {
    const molSlot3 = findMolecularCookingSlot3Activity(activities);
    if (molSlot3) {
      adjustedSlot3Id = molSlot3.id;
      act3 = molSlot3;
    }
  }

  // Duplicate subject validation
  const key1 = getActivityBaseKey(act1);
  const key2 = getActivityBaseKey(act2);
  const key3 = getActivityBaseKey(act3);

  if (key1 && key2 && key1 === key2) {
    return {
      isValid: false,
      error: `לא ניתן להירשם לאותו חוג פעמיים ("${act1.name}" נבחר גם בשעה ראשונה וגם בשעה שניה).`,
    };
  }

  if (key1 && key3 && key1 === key3) {
    return {
      isValid: false,
      error: `לא ניתן להירשם לאותו חוג פעמיים ("${act1.name}" נבחר גם בשעה ראשונה וגם בשעה שלישית).`,
    };
  }

  // In case key2 === key3, this is ONLY allowed for Molecular Cooking which spans two continuous slots
  if (key2 && key3 && key2 === key3) {
    if (!isSlot2Molecular) {
      return {
        isValid: false,
        error: `לא ניתן להירשם לאותו חוג פעמיים ("${act2.name}" נבחר גם בשעה שניה וגם בשעה שלישית). חוג בישול מולקולרי הוא החוג היחיד שהרשמה אליו תופסת שעתיים רצופות.`,
      };
    }
  }

  // Live Capacity validation (First-Come, First-Served)
  const enrollmentCounts = calculateLiveEnrollmentCounts(
    registrations,
    student.id,
  );

  const cap1 = getActivityCapacityInfo(act1, enrollmentCounts);
  if (cap1.isFull) {
    return {
      isValid: false,
      error: `החוג "${act1.name}" בשעה ראשונה מלא עד אפס מקום (${cap1.max} מתוך ${cap1.max} תלמידים). אנא בחרו חוג פנוי אחר.`,
    };
  }

  const cap2 = getActivityCapacityInfo(act2, enrollmentCounts);
  if (cap2.isFull) {
    return {
      isValid: false,
      error: `החוג "${act2.name}" בשעה שניה מלא עד אפס מקום (${cap2.max} מתוך ${cap2.max} תלמידים). אנא בחרו חוג פנוי אחר.`,
    };
  }

  const cap3 = getActivityCapacityInfo(act3, enrollmentCounts);
  if (cap3.isFull) {
    return {
      isValid: false,
      error: `החוג "${act3.name}" בשעה שלישית מלא עד אפס מקום (${cap3.max} מתוך ${cap3.max} תלמידים). אנא בחרו חוג פנוי אחר.`,
    };
  }

  return { isValid: true, adjustedSlot3Id };
}
