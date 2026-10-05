import type {
  Activity,
  Placement,
  Registration,
  School,
  Student,
} from "../types";

/**
 * Durable local keys. The main key stays compatible with existing browsers.
 * The safety snapshot keeps the last richer copy so an accidental shrink
 * (empty cloud snapshot, raced save, failed parse) can be restored.
 */
export const STORAGE_KEY = "school_activities_system_data_v12_matched_images_kids";
export const SAFETY_SNAPSHOT_KEY = "school_activities_system_data_v12_safety_snapshot";
export const COMPACT_BACKUP_KEY = "school_activities_system_data_v12_compact_backup";
export const TOMBSTONE_KEY = "maagalim_record_tombstones_v1";

export const LAPID_SCHOOL_ID = "sch-lapid-hmd";

export interface SchoolSnapshot {
  school: School;
  students: Student[];
  activities: Activity[];
  registrations: Registration[];
  placements: Placement[];
}

export interface MergeOptions {
  replaceStudents?: boolean;
  replaceActivities?: boolean;
  replaceRegistrations?: boolean;
  replacePlacements?: boolean;
  deleteStudentIds?: string[];
  deleteRegistrationIds?: string[];
  deleteActivityIds?: string[];
  deletePlacementIds?: string[];
  /** Students explicitly re-added after a delete. */
  reviveStudentIds?: string[];
  /** Registrations explicitly re-added, keyed by student id. */
  reviveRegistrationStudentIds?: string[];
  /** Registration document ids explicitly restored (backup file, re-import). */
  reviveRegistrationIds?: string[];
  tombstones?: Record<string, string>;
}

export interface MergeResult {
  data: SchoolSnapshot;
  tombstones: Record<string, string>;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const TOMBSTONE_CAP = 500;

export function canonicalSchoolKey(raw: string | undefined | null): string {
  if (!raw) return "";
  const str = String(raw).trim();
  if (!str) return "";
  const clean = str.toLowerCase().replace(/['"״\-\s_]/g, "");
  if (
    clean === "schlapid" ||
    clean === "schlapidhmd" ||
    clean === "schlapidhamah" ||
    clean === "schlapidhamad" ||
    clean === "lapid" ||
    clean === "lapidhmd"
  ) {
    return LAPID_SCHOOL_ID;
  }
  return str;
}

export function tombKey(schoolId: string, kind: string, id: string): string {
  return `${canonicalSchoolKey(schoolId) || schoolId}|${kind}:${id}`;
}

export function registrationChoiceScore(reg: Partial<Registration> | null | undefined): number {
  if (!reg) return 0;
  let score = 0;
  if (reg.slot1Choice) score += 2;
  if (reg.slot2Choice) score += 2;
  if (reg.slot3Choice) score += 2;
  if (reg.slot1Backup) score += 1;
  if (reg.slot2Backup) score += 1;
  if (reg.slot3Backup) score += 1;
  if (reg.parentPhone) score += 1;
  if (reg.studentName && reg.studentName !== "תלמיד משוחזר") score += 1;
  return score;
}

/** Keep the registration that actually has choices. A newer empty shell must not wipe it. */
export function preferRegistration(current: Registration, incoming: Registration): Registration {
  const currentScore = registrationChoiceScore(current);
  const incomingScore = registrationChoiceScore(incoming);
  if (currentScore > 0 && incomingScore === 0) return current;
  if (incomingScore > 0 && currentScore === 0) return incoming;
  const currentTime = Date.parse(current?.timestamp || "") || 0;
  const incomingTime = Date.parse(incoming?.timestamp || "") || 0;
  if (incomingTime > currentTime) return incoming;
  if (currentTime > incomingTime) return current;
  return incomingScore >= currentScore ? incoming : current;
}

function nonEmpty<T>(value: T): boolean {
  return value !== undefined && value !== null && value !== "";
}

function preferStudent(current: Student, incoming: Student): Student {
  const merged: Student = { ...current };
  (Object.keys(incoming) as (keyof Student)[]).forEach((key) => {
    const value = incoming[key];
    if (nonEmpty(value)) {
      (merged as unknown as Record<string, unknown>)[key as string] = value;
    }
  });
  if (typeof incoming.isAuthorized === "boolean") {
    merged.isAuthorized = incoming.isAuthorized;
  }
  return merged;
}

function preferActivity(current: Activity, incoming: Activity): Activity {
  const merged: Activity = { ...current, ...incoming, id: current.id || incoming.id };
  if (!incoming.description && current.description) merged.description = current.description;
  if (!incoming.imageUrl && current.imageUrl) merged.imageUrl = current.imageUrl;
  if (!incoming.instructor && current.instructor) merged.instructor = current.instructor;
  return merged;
}

function preferPlacement(current: Placement, incoming: Placement): Placement {
  const currentTime = Date.parse(current?.placedAt || "") || 0;
  const incomingTime = Date.parse(incoming?.placedAt || "") || 0;
  if (current.isManualOverride && !incoming.isManualOverride && incomingTime <= currentTime) {
    return current;
  }
  if (incomingTime >= currentTime) return incoming;
  return current;
}

function mergeSchoolMeta(base: School | undefined, incoming: School | undefined, id: string): School {
  const baseCoordinator = base?.coordinator;
  const incomingCoordinator = incoming?.coordinator;
  const coordinator =
    incomingCoordinator?.name
      ? { ...(baseCoordinator || {}), ...incomingCoordinator }
      : baseCoordinator || incomingCoordinator;

  return {
    ...(base || ({} as School)),
    ...(incoming || ({} as School)),
    id,
    coordinator: coordinator || {
      name: "",
      role: "",
      phone: "",
      email: "",
      receptionHours: "",
    },
  } as School;
}

function capTombstones(map: Record<string, string>): Record<string, string> {
  const entries = Object.entries(map);
  if (entries.length <= TOMBSTONE_CAP) return map;
  entries.sort((a, b) => (Date.parse(a[1]) || 0) - (Date.parse(b[1]) || 0));
  return Object.fromEntries(entries.slice(entries.length - TOMBSTONE_CAP));
}

function mergeByKey<T>(
  baseList: T[] | undefined,
  incomingList: T[] | undefined,
  getKey: (item: T) => string,
  prefer: (current: T, incoming: T) => T,
  blocked: (item: T) => boolean,
  replace: boolean,
): T[] {
  if (replace) {
    return (incomingList || []).filter((item) => item && !blocked(item));
  }
  const map = new Map<string, T>();
  (baseList || []).forEach((item) => {
    if (!item) return;
    const key = getKey(item);
    if (!key || blocked(item)) return;
    map.set(key, item);
  });
  (incomingList || []).forEach((item) => {
    if (!item) return;
    const key = getKey(item);
    if (!key || blocked(item)) return;
    const prev = map.get(key);
    map.set(key, prev ? prefer(prev, item) : item);
  });
  return Array.from(map.values());
}

/**
 * Union two school snapshots.
 * Records that exist only on one side are kept.
 * Conflicts keep the richer / newer record.
 * Tombstones suppress resurrecting an intentional delete, unless the incoming
 * record is newer than the tombstone (a real re-registration).
 */
export function mergeSchoolSnapshot(
  base: Partial<SchoolSnapshot> | null | undefined,
  incoming: Partial<SchoolSnapshot> | null | undefined,
  options: MergeOptions = {},
): MergeResult {
  const id =
    canonicalSchoolKey(incoming?.school?.id || base?.school?.id || "") ||
    incoming?.school?.id ||
    base?.school?.id ||
    LAPID_SCHOOL_ID;

  const tombstones: Record<string, string> = { ...(options.tombstones || {}) };
  const now = new Date().toISOString();
  const stamp = (key: string) => {
    tombstones[key] = now;
  };
  const clear = (key: string) => {
    delete tombstones[key];
  };

  (options.deleteStudentIds || []).forEach((studentId) => stamp(tombKey(id, "student", studentId)));
  (options.deleteRegistrationIds || []).forEach((regId) => {
    stamp(tombKey(id, "registration", regId));
    const reg =
      (base?.registrations || []).find((item) => item?.id === regId) ||
      (incoming?.registrations || []).find((item) => item?.id === regId);
    if (reg?.studentId) stamp(tombKey(id, "registrationStudent", reg.studentId));
  });
  (options.deleteActivityIds || []).forEach((activityId) => stamp(tombKey(id, "activity", activityId)));
  (options.deletePlacementIds || []).forEach((placementId) => stamp(tombKey(id, "placement", placementId)));
  (options.reviveStudentIds || []).forEach((studentId) => clear(tombKey(id, "student", studentId)));
  (options.reviveRegistrationStudentIds || []).forEach((studentId) => {
    clear(tombKey(id, "registrationStudent", studentId));
  });
  (options.reviveRegistrationIds || []).forEach((regId) => clear(tombKey(id, "registration", regId)));

  if (options.replaceStudents) {
    const keep = new Set((incoming?.students || []).map((student) => student.id));
    (base?.students || []).forEach((student) => {
      if (student?.id && !keep.has(student.id)) stamp(tombKey(id, "student", student.id));
    });
  }
  if (options.replaceRegistrations) {
    const keep = new Set((incoming?.registrations || []).map((reg) => reg.id));
    (base?.registrations || []).forEach((reg) => {
      if (reg?.id && !keep.has(reg.id)) {
        stamp(tombKey(id, "registration", reg.id));
        if (reg.studentId) stamp(tombKey(id, "registrationStudent", reg.studentId));
      }
    });
  }
  if (options.replaceActivities) {
    const keep = new Set((incoming?.activities || []).map((activity) => activity.id));
    (base?.activities || []).forEach((activity) => {
      if (activity?.id && !keep.has(activity.id)) stamp(tombKey(id, "activity", activity.id));
    });
  }

  const blocked = (key: string, recordTime?: string) => {
    const markedAt = tombstones[key];
    if (!markedAt) return false;
    if (!recordTime) return true;
    const tombTime = Date.parse(markedAt) || 0;
    const recTime = Date.parse(recordTime) || 0;
    if (recTime > tombTime) {
      delete tombstones[key];
      return false;
    }
    return true;
  };

  const students = mergeByKey(
    base?.students,
    incoming?.students,
    (student) => student.id,
    preferStudent,
    (student) => blocked(tombKey(id, "student", student.id)),
    !!options.replaceStudents,
  );

  const registrations = mergeByKey(
    base?.registrations,
    incoming?.registrations,
    (reg) => reg.studentId || reg.id,
    preferRegistration,
    (reg) =>
      blocked(tombKey(id, "student", reg.studentId)) ||
      blocked(tombKey(id, "registration", reg.id), reg.timestamp) ||
      blocked(tombKey(id, "registrationStudent", reg.studentId), reg.timestamp),
    !!options.replaceRegistrations,
  );

  const activities = mergeByKey(
    base?.activities,
    incoming?.activities,
    (activity) => activity.id,
    preferActivity,
    (activity) => blocked(tombKey(id, "activity", activity.id)),
    !!options.replaceActivities,
  );

  const placements = mergeByKey(
    base?.placements,
    incoming?.placements,
    (placement) => placement.id || `${placement.studentId}-${placement.slotNumber}`,
    preferPlacement,
    (placement) =>
      blocked(tombKey(id, "placement", placement.id)) ||
      blocked(tombKey(id, "student", placement.studentId)),
    !!options.replacePlacements,
  );

  return {
    data: {
      school: mergeSchoolMeta(base?.school, incoming?.school, id),
      students,
      activities,
      registrations,
      placements,
    },
    tombstones: capTombstones(tombstones),
  };
}

export function foldAliasSchools(
  schools: Record<string, SchoolSnapshot>,
): Record<string, SchoolSnapshot> {
  const folded: Record<string, SchoolSnapshot> = {};
  Object.entries(schools || {}).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;
    const id = canonicalSchoolKey(value.school?.id || key) || key;
    const snapshot: SchoolSnapshot = {
      school: { ...value.school, id },
      students: value.students || [],
      activities: value.activities || [],
      registrations: value.registrations || [],
      placements: value.placements || [],
    };
    folded[id] = folded[id]
      ? mergeSchoolSnapshot(folded[id], snapshot).data
      : snapshot;
  });
  return folded;
}

export function diffDeletions(
  before: Partial<SchoolSnapshot> | undefined,
  after: Partial<SchoolSnapshot> | undefined,
): Pick<
  MergeOptions,
  "deleteStudentIds" | "deleteRegistrationIds" | "deleteActivityIds" | "deletePlacementIds"
> {
  const afterStudents = new Set((after?.students || []).map((student) => student.id));
  const afterRegs = new Set((after?.registrations || []).map((reg) => reg.id));
  const afterActivities = new Set((after?.activities || []).map((activity) => activity.id));
  const afterPlacements = new Set((after?.placements || []).map((placement) => placement.id));
  return {
    deleteStudentIds: (before?.students || [])
      .filter((student) => student?.id && !afterStudents.has(student.id))
      .map((student) => student.id),
    deleteRegistrationIds: (before?.registrations || [])
      .filter((reg) => reg?.id && !afterRegs.has(reg.id))
      .map((reg) => reg.id),
    deleteActivityIds: (before?.activities || [])
      .filter((activity) => activity?.id && !afterActivities.has(activity.id))
      .map((activity) => activity.id),
    deletePlacementIds: (before?.placements || [])
      .filter((placement) => placement?.id && !afterPlacements.has(placement.id))
      .map((placement) => placement.id),
  };
}

export function readTombstones(storage: Pick<Storage, "getItem"> | null | undefined): Record<string, string> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(TOMBSTONE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function writeTombstones(storage: StorageLike | null | undefined, tombstones: Record<string, string>) {
  if (!storage) return;
  try {
    storage.setItem(TOMBSTONE_KEY, JSON.stringify(capTombstones(tombstones)));
  } catch {
    // Quota failures must not throw into the UI.
  }
}

export function rememberTombstoneKeys(storage: StorageLike | null | undefined, keys: string[]) {
  if (!storage || keys.length === 0) return;
  const tombstones = readTombstones(storage);
  const now = new Date().toISOString();
  keys.forEach((key) => {
    if (key) tombstones[key] = now;
  });
  writeTombstones(storage, tombstones);
}

export function forgetTombstoneKeys(storage: StorageLike | null | undefined, keys: string[]) {
  if (!storage || keys.length === 0) return;
  const tombstones = readTombstones(storage);
  let changed = false;
  keys.forEach((key) => {
    if (key && tombstones[key]) {
      delete tombstones[key];
      changed = true;
    }
  });
  if (changed) writeTombstones(storage, tombstones);
}

export function tombstoneKeysForDeletions(schoolId: string, options: MergeOptions | undefined): string[] {
  if (!options) return [];
  const keys: string[] = [];
  (options.deleteStudentIds || []).forEach((id) => keys.push(tombKey(schoolId, "student", id)));
  (options.deleteRegistrationIds || []).forEach((id) => keys.push(tombKey(schoolId, "registration", id)));
  (options.deleteActivityIds || []).forEach((id) => keys.push(tombKey(schoolId, "activity", id)));
  (options.deletePlacementIds || []).forEach((id) => keys.push(tombKey(schoolId, "placement", id)));
  return keys;
}

/** Copy only fields the caller actually set, so `undefined` cannot erase a computed delete list. */
export function mergeDefinedOptions(base: MergeOptions, extra?: MergeOptions): MergeOptions {
  const next: MergeOptions = { ...base };
  if (!extra) return next;
  (Object.keys(extra) as (keyof MergeOptions)[]).forEach((key) => {
    const value = extra[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  });
  return next;
}

export function applyTombstonesToSchools(
  schools: Record<string, SchoolSnapshot>,
  tombstones: Record<string, string>,
): Record<string, SchoolSnapshot> {
  if (!tombstones || Object.keys(tombstones).length === 0) return schools;
  const next: Record<string, SchoolSnapshot> = {};
  Object.entries(schools).forEach(([key, school]) => {
    const id = canonicalSchoolKey(school?.school?.id || key) || key;
    const { data } = mergeSchoolSnapshot(school, school, { tombstones });
    next[id] = data;
  });
  return next;
}

function parseSchoolsBlob(raw: string | null): Record<string, SchoolSnapshot> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, SchoolSnapshot>;
  } catch {
    return null;
  }
}

export function isUnexplainedShrink(
  previous: Record<string, SchoolSnapshot>,
  next: Record<string, SchoolSnapshot>,
  tombstones: Record<string, string>,
): boolean {
  let lost = 0;
  Object.entries(previous || {}).forEach(([key, school]) => {
    const id = canonicalSchoolKey(school?.school?.id || key) || key;
    const current = next?.[id] || next?.[key];
    const nextRegs = new Set((current?.registrations || []).map((reg) => reg.studentId || reg.id));
    (school?.registrations || []).forEach((reg) => {
      const keyId = reg.studentId || reg.id;
      if (!keyId || nextRegs.has(keyId)) return;
      const regBlocked = !!tombstones[tombKey(id, "registration", reg.id)];
      const studentBlocked = !!tombstones[tombKey(id, "registrationStudent", reg.studentId)];
      if (!regBlocked && !studentBlocked) lost += 1;
    });
    const nextStudents = new Set((current?.students || []).map((student) => student.id));
    (school?.students || []).forEach((student) => {
      if (!student?.id || nextStudents.has(student.id)) return;
      if (!tombstones[tombKey(id, "student", student.id)]) lost += 1;
    });
  });
  return lost >= 3;
}

export function unionMissingRecords(
  current: Record<string, SchoolSnapshot>,
  extra: Record<string, SchoolSnapshot> | null,
  tombstones: Record<string, string>,
): Record<string, SchoolSnapshot> {
  if (!extra) return current;
  const foldedExtra = foldAliasSchools(extra);
  const foldedCurrent = foldAliasSchools(current);
  const ids = new Set([...Object.keys(foldedCurrent), ...Object.keys(foldedExtra)]);
  const merged: Record<string, SchoolSnapshot> = {};
  ids.forEach((id) => {
    const { data } = mergeSchoolSnapshot(foldedCurrent[id], foldedExtra[id], { tombstones });
    merged[id] = data;
  });
  return merged;
}

export function compactSchools(schools: Record<string, SchoolSnapshot>): Record<string, SchoolSnapshot> {
  const compact: Record<string, SchoolSnapshot> = {};
  Object.entries(schools || {}).forEach(([key, school]) => {
    const id = canonicalSchoolKey(school?.school?.id || key) || key;
    compact[id] = {
      school: school.school,
      students: school.students || [],
      registrations: school.registrations || [],
      placements: school.placements || [],
      activities: (school.activities || []).map((activity) => ({
        ...activity,
        imageUrl: undefined,
        description: activity.description ? activity.description.slice(0, 120) : activity.description,
      })),
    };
  });
  return compact;
}

export function hydrateSchools(
  storage: Pick<Storage, "getItem"> | null | undefined,
  fallback: Record<string, SchoolSnapshot>,
): Record<string, SchoolSnapshot> {
  const tombstones = readTombstones(storage);
  let schools = fallback;
  const stored = parseSchoolsBlob(storage?.getItem(STORAGE_KEY) || null);
  if (stored) schools = stored;
  schools = unionMissingRecords(schools, parseSchoolsBlob(storage?.getItem(SAFETY_SNAPSHOT_KEY) || null), tombstones);
  schools = unionMissingRecords(schools, parseSchoolsBlob(storage?.getItem(COMPACT_BACKUP_KEY) || null), tombstones);
  schools = foldAliasSchools(schools);
  return applyTombstonesToSchools(schools, tombstones);
}

export function persistSchoolsSnapshot(
  storage: StorageLike | null | undefined,
  schools: Record<string, SchoolSnapshot>,
) {
  if (!storage) return;
  const tombstones = readTombstones(storage);
  let payload = "";
  try {
    payload = JSON.stringify(schools);
  } catch {
    payload = "";
  }
  try {
    const previous = parseSchoolsBlob(storage.getItem(STORAGE_KEY));
    if (previous && payload && isUnexplainedShrink(previous, schools, tombstones)) {
      storage.setItem(SAFETY_SNAPSHOT_KEY, JSON.stringify(previous));
    }
  } catch {
    // Ignore safety-copy failures.
  }
  try {
    if (payload) storage.setItem(STORAGE_KEY, payload);
  } catch {
    // Full snapshot can exceed quota. The compact copy below still protects records.
  }
  try {
    storage.setItem(COMPACT_BACKUP_KEY, JSON.stringify(compactSchools(schools)));
  } catch {
    // Nothing else we can persist in this browser.
  }
}

export function parseBackupJson(text: string): Record<string, SchoolSnapshot> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  let schoolsRaw: unknown = null;
  if (root.kind === "maagalim-full-backup" && root.schools && typeof root.schools === "object") {
    schoolsRaw = root.schools;
  } else if (root.schools && typeof root.schools === "object" && !Array.isArray(root.schools)) {
    schoolsRaw = root.schools;
  } else if (
    root["sch-ben-shemen"] ||
    root["sch-yitzhak-navon"] ||
    root["sch-lapid-hmd"] ||
    root["sch-lapid"]
  ) {
    schoolsRaw = root;
  }
  if (!schoolsRaw || typeof schoolsRaw !== "object" || Array.isArray(schoolsRaw)) return null;

  const schools: Record<string, SchoolSnapshot> = {};
  Object.entries(schoolsRaw as Record<string, unknown>).forEach(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const record = value as Partial<SchoolSnapshot>;
    if (!record.school && !record.students && !record.registrations && !record.activities) return;
    const id = canonicalSchoolKey(record.school?.id || key) || key;
    schools[id] = {
      school: { ...(record.school || ({} as School)), id },
      students: Array.isArray(record.students) ? record.students : [],
      activities: Array.isArray(record.activities) ? record.activities : [],
      registrations: Array.isArray(record.registrations) ? record.registrations : [],
      placements: Array.isArray(record.placements) ? record.placements : [],
    };
  });
  return Object.keys(schools).length > 0 ? foldAliasSchools(schools) : null;
}

export function buildBackupPayload(schools: Record<string, SchoolSnapshot>, schoolId?: string) {
  const folded = foldAliasSchools(schools);
  const selected = schoolId
    ? { [canonicalSchoolKey(schoolId) || schoolId]: folded[canonicalSchoolKey(schoolId) || schoolId] }
    : folded;
  return {
    kind: "maagalim-full-backup" as const,
    version: 1,
    exportedAt: new Date().toISOString(),
    schools: selected,
  };
}

/**
 * Read a user-selected file even when another window (Excel) still has it open
 * or the first browser read API fails.
 */
export async function readFileArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  const errors: string[] = [];
  const attempts: Array<() => Promise<ArrayBuffer>> = [
    async () => {
      if (typeof (file as File).arrayBuffer !== "function") {
        throw new Error("arrayBuffer unavailable");
      }
      return (file as File).arrayBuffer();
    },
    async () => {
      if (typeof file.slice !== "function" || typeof (file as File).arrayBuffer !== "function") {
        throw new Error("slice unavailable");
      }
      const sliced = file.slice(0, file.size, (file as File).type || "");
      return sliced.arrayBuffer();
    },
    () =>
      new Promise<ArrayBuffer>((resolve, reject) => {
        if (typeof FileReader === "undefined") {
          reject(new Error("FileReader unavailable"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer && result.byteLength > 0) resolve(result);
          else reject(new Error("empty file read"));
        };
        reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
        reader.readAsArrayBuffer(file);
      }),
  ];

  for (const attempt of attempts) {
    try {
      const buffer = await attempt();
      if (buffer && buffer.byteLength > 0) return buffer;
      errors.push("empty buffer");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    `לא ניתן לקרוא את הקובץ. אם הוא פתוח ב-Excel או בחלון אחר, סגרו אותו ונסו שוב. (${errors[0] || "read failed"})`,
  );
}

export async function readFileText(file: Blob): Promise<string> {
  const buffer = await readFileArrayBuffer(file);
  return new TextDecoder("utf-8").decode(buffer);
}
