import { Activity } from "../types";
import { OFFICIAL_MASTER_ACTIVITIES } from "../data/initialData";

export interface ResolvedActivityInfo {
  id: string;
  name: string;
  isMatched: boolean;
  isDiscontinued?: boolean;
  matchedActivity?: Activity;
}

const KNOWN_CODES_MAP: Record<string, string> = {
  "ENGINEERING-LEGO": "לגו הנדסי",
  "KRAV-MAGA": "קרב מגע",
  "SOCCER": "כדורגל",
  "PASTRY-YOUNG": "קונדיטוריה לצעירים",
  "ARTS-MULTI": "אמנות רב־תחומית",
  "ANIMATION": "אנימציה",
  "WOODWORK": "נגרות / ארץ חוץ",
  "PERFORMING-ARTS": "אומנויות הבמה",
  "3D-PRINTING": "הדפסת תלת מימד / דרך השכל",
  "AI-GAMING": "בינה מלאכותית דרך עולם המשחקים",
  "GALAXY-GUARDIANS": "שומרי הגלקסיה",
  "SCIENCE-MAGIC": "קסמי המדע",
  "MOLECULAR-COOKING": "בישול מולקולרי",
  "JEWELRY": "תכשיטנות",
};

/**
 * Universal resolver that translates any activity ID (including legacy, prefix-mismatched, or discontinued)
 * to its human-readable Hebrew name.
 */
export function resolveActivityDisplay(
  activityId: string | undefined | null,
  activities: Activity[] = [],
): ResolvedActivityInfo {
  if (!activityId) {
    return { id: "", name: "טרם נבחר", isMatched: false };
  }

  // 1. Direct match by exact ID
  const direct = activities.find((a) => a.id === activityId);
  if (direct) {
    return { id: direct.id, name: direct.name, isMatched: true, matchedActivity: direct };
  }

  // 2. Prefix normalization (LP- <-> LPD-)
  let normalizedId = activityId;
  if (activityId.startsWith("LP-ACT-")) {
    normalizedId = activityId.replace(/^LP-ACT-/, "LPD-ACT-");
  } else if (activityId.startsWith("LPD-ACT-")) {
    normalizedId = activityId.replace(/^LPD-ACT-/, "LP-ACT-");
  }

  const directNorm = activities.find((a) => a.id === normalizedId);
  if (directNorm) {
    return { id: directNorm.id, name: directNorm.name, isMatched: true, matchedActivity: directNorm };
  }

  // 3. Match by code & slot number extracted from ID
  const slotMatch = activityId.match(/([A-Z0-9\-]+)-S([1-3])/i);
  if (slotMatch) {
    const rawCode = slotMatch[1].replace(/^(?:LPD|LP|BS|YN)-ACT-/i, "").toUpperCase();
    const slotNum = parseInt(slotMatch[2], 10);

    // Search in school activities with same code and slot
    const byCodeSlot = activities.find(
      (a) => a.id.toUpperCase().includes(rawCode) && a.slotNumber === slotNum,
    );
    if (byCodeSlot) {
      return { id: byCodeSlot.id, name: byCodeSlot.name, isMatched: true, matchedActivity: byCodeSlot };
    }

    // Search in school activities by code only
    const byCodeOnly = activities.find((a) => a.id.toUpperCase().includes(rawCode));
    if (byCodeOnly) {
      return {
        id: byCodeOnly.id,
        name: byCodeOnly.name,
        isMatched: true,
        isDiscontinued: byCodeOnly.slotNumber !== slotNum,
        matchedActivity: byCodeOnly,
      };
    }

    // 4. Search in official catalog
    const master = OFFICIAL_MASTER_ACTIVITIES.find(
      (m) => m.code.toUpperCase() === rawCode || rawCode.includes(m.code.toUpperCase()),
    );
    if (master) {
      return {
        id: activityId,
        name: master.name,
        isMatched: false,
        isDiscontinued: true,
      };
    }

    // 5. Match by known code dictionary
    for (const [codeKey, hebName] of Object.entries(KNOWN_CODES_MAP)) {
      if (rawCode === codeKey || rawCode.includes(codeKey)) {
        return {
          id: activityId,
          name: hebName,
          isMatched: false,
          isDiscontinued: true,
        };
      }
    }
  }

  // 6. Direct dictionary lookup if code appears anywhere in string
  for (const [codeKey, hebName] of Object.entries(KNOWN_CODES_MAP)) {
    if (activityId.toUpperCase().includes(codeKey)) {
      return {
        id: activityId,
        name: hebName,
        isMatched: false,
        isDiscontinued: true,
      };
    }
  }

  return { id: activityId, name: activityId, isMatched: false };
}
