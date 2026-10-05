import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { SchoolData } from "../data/initialData";
import {
  Coordinator,
  Activity,
  Student,
  Registration,
  Placement,
} from "../types";
import {
  MergeOptions,
  SchoolSnapshot,
  canonicalSchoolKey,
  forgetTombstoneKeys,
  mergeSchoolSnapshot,
  readTombstones,
  rememberTombstoneKeys,
  tombKey,
  tombstoneKeysForDeletions,
} from "./dataSafety";

export type CloudSyncStatus = "connecting" | "synced" | "error" | "quota_exceeded";

let currentSyncStatus: CloudSyncStatus = "connecting";
let lastSyncError: string | null = null;
let statusChangeListeners: Array<(status: CloudSyncStatus, errorMsg?: string | null) => void> = [];

export function getCloudSyncStatus(): CloudSyncStatus {
  return currentSyncStatus;
}

export function getLastSyncError(): string | null {
  return lastSyncError;
}

export function subscribeToSyncStatus(
  listener: (status: CloudSyncStatus, errorMsg?: string | null) => void,
): () => void {
  statusChangeListeners.push(listener);
  listener(currentSyncStatus, lastSyncError);
  return () => {
    statusChangeListeners = statusChangeListeners.filter((l) => l !== listener);
  };
}

function updateSyncStatus(newStatus: CloudSyncStatus, errorMsg?: string | null) {
  currentSyncStatus = newStatus;
  lastSyncError = errorMsg || null;
  statusChangeListeners.forEach((l) => l(newStatus, errorMsg));
}

const SCHOOLS_COLLECTION = "schools";

const schoolWriteQueues = new Map<string, Promise<unknown>>();

function enqueueSchoolWrite<T>(schoolId: string, task: () => Promise<T>): Promise<T> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  const previous = schoolWriteQueues.get(id) || Promise.resolve();
  const run = previous.then(task, task);
  schoolWriteQueues.set(
    id,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

function normalizeServerSchool(raw: any, docId: string): SchoolSnapshot {
  const id = canonicalSchoolKey(raw?.school?.id || docId) || docId;
  return {
    school: {
      ...(raw?.school || {}),
      id,
      coordinator: raw?.school?.coordinator || raw?.coordinator,
    },
    students: Array.isArray(raw?.students) ? raw.students : [],
    activities: Array.isArray(raw?.activities) ? raw.activities : [],
    registrations: Array.isArray(raw?.registrations) ? raw.registrations : [],
    placements: Array.isArray(raw?.placements) ? raw.placements : [],
  };
}

function rememberLocalDeletes(schoolId: string, options?: MergeOptions) {
  try {
    if (typeof localStorage === "undefined") return;
    rememberTombstoneKeys(localStorage, tombstoneKeysForDeletions(schoolId, options));
  } catch {
    // local tombstones are a safety net; cloud merge still applies.
  }
}

function isQuotaError(error: any): boolean {
  return (
    error?.code === "resource-exhausted" ||
    String(error?.message || "").includes("Quota exceeded")
  );
}

export interface GlobalSettings {
  customLogo?: string;
  updatedAt?: string;
}

/**
 * Save or update global system settings (such as universal logo)
 */
export async function saveGlobalSettingsToFirestore(
  settings: Partial<GlobalSettings>,
): Promise<void> {
  try {
    const settingsRef = doc(db, "settings", "global");
    await setDoc(
      settingsRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("[Firestore] Failed to save global settings:", error);
  }
}

/**
 * Save school data without letting a stale browser replace the whole document.
 * The write is transactional: server-only records are kept, and intentional
 * deletes are recorded as tombstones so they are not resurrected by another window.
 */
export async function saveSchoolDataToFirestore(
  schoolId: string,
  data: SchoolData,
  options?: MergeOptions,
): Promise<{ success: boolean; error?: string; isQuotaExceeded?: boolean }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  rememberLocalDeletes(id, options);
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        const raw = snap.exists() ? snap.data() : {};
        const server = normalizeServerSchool(raw, id);
        const client: SchoolSnapshot = {
          ...data,
          school: { ...data.school, id },
        };
        const merged = mergeSchoolSnapshot(server, client, {
          ...options,
          tombstones: { ...(raw?.tombstones || {}), ...(options?.tombstones || {}) },
        });
        const sanitized = JSON.parse(
          JSON.stringify({
            ...merged.data,
            tombstones: merged.tombstones,
            updatedAt: new Date().toISOString(),
          }),
        );
        transaction.set(schoolRef, sanitized, { merge: true });
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    const isQuota = isQuotaError(error);
    const errMsg = error?.message || String(error);
    if (isQuota) {
      updateSyncStatus("quota_exceeded", errMsg);
      console.warn(
        `[Firestore] Quota exceeded while saving school data for ${id}. Data saved locally.`,
      );
    } else {
      updateSyncStatus("error", errMsg);
      console.warn(`[Firestore] Failed to save school data for ${id}:`, error);
    }
    return {
      success: false,
      error: errMsg,
      isQuotaExceeded: isQuota,
    };
  }
}

/**
 * Update ONLY coordinator information in Firestore without touching other school entities
 */
export async function saveCoordinatorToFirestore(
  schoolId: string,
  coordinator: Coordinator,
): Promise<{ success: boolean; error?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        const raw = snap.exists() ? snap.data() : {};
        const school = {
          ...(raw?.school || {}),
          id: canonicalSchoolKey(raw?.school?.id || id) || id,
          coordinator: JSON.parse(JSON.stringify(coordinator)),
        };
        transaction.set(
          schoolRef,
          {
            school,
            coordinator: school.coordinator,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save coordinator for ${id}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Update ONLY activities list in Firestore without touching coordinators or registrations
 */
export async function saveActivitiesToFirestore(
  schoolId: string,
  activities: Activity[],
  options?: Pick<MergeOptions, "deleteActivityIds" | "replaceActivities">,
): Promise<{ success: boolean; error?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  rememberLocalDeletes(id, options);
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        const raw = snap.exists() ? snap.data() : {};
        const server = normalizeServerSchool(raw, id);
        const merged = mergeSchoolSnapshot(
          server,
          { ...server, activities },
          {
            ...options,
            tombstones: raw?.tombstones || {},
          },
        );
        transaction.set(
          schoolRef,
          {
            activities: JSON.parse(JSON.stringify(merged.data.activities)),
            tombstones: merged.tombstones,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save activities for ${id}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Update ONLY students list in Firestore
 */
export async function saveStudentsToFirestore(
  schoolId: string,
  students: Student[],
  options?: Pick<MergeOptions, "deleteStudentIds" | "replaceStudents" | "reviveStudentIds">,
): Promise<{ success: boolean; error?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  rememberLocalDeletes(id, options);
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        const raw = snap.exists() ? snap.data() : {};
        const server = normalizeServerSchool(raw, id);
        const merged = mergeSchoolSnapshot(
          server,
          { ...server, students },
          {
            ...options,
            tombstones: raw?.tombstones || {},
          },
        );
        transaction.set(
          schoolRef,
          {
            students: JSON.parse(JSON.stringify(merged.data.students)),
            tombstones: merged.tombstones,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save students for ${id}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Atomically save a registration and its instant placements directly to Firestore.
 * Reads the latest live document to prevent concurrent write collisions with other parents!
 */
function queuePendingRegistration(
  schoolId: string,
  newReg: Registration,
  newPlacements: Placement[],
) {
  try {
    const qKey = `pending_regs_${schoolId}`;
    const raw = localStorage.getItem(qKey);
    const queue = raw ? JSON.parse(raw) : [];
    const without = Array.isArray(queue)
      ? queue.filter((item) => item?.reg?.studentId !== newReg.studentId)
      : [];
    without.push({ reg: newReg, placements: newPlacements, timestamp: new Date().toISOString() });
    localStorage.setItem(qKey, JSON.stringify(without));
  } catch {
    // Pending queue is best-effort when storage is full.
  }
}

export async function saveRegistrationToFirestore(
  schoolId: string,
  newReg: Registration,
  newPlacements: Placement[],
): Promise<{ success: boolean; error?: string; isQuotaExceeded?: boolean }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  try {
    if (typeof localStorage !== "undefined") {
      forgetTombstoneKeys(localStorage, [
        tombKey(id, "registration", newReg.id),
        tombKey(id, "registrationStudent", newReg.studentId),
      ]);
    }
  } catch {
    // Ignore storage access failures.
  }
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        const currentData = snap.exists() ? snap.data() : {};
        const existingRegs: Registration[] = currentData.registrations || [];
        const existingPlcs: Placement[] = currentData.placements || [];
        const tombstones = { ...(currentData.tombstones || {}) };
        delete tombstones[tombKey(id, "registration", newReg.id)];
        delete tombstones[tombKey(id, "registrationStudent", newReg.studentId)];

        const updatedRegs = [
          JSON.parse(JSON.stringify(newReg)),
          ...existingRegs.filter((r) => r.studentId !== newReg.studentId && r.id !== newReg.id),
        ];
        const updatedPlcs = [
          ...JSON.parse(JSON.stringify(newPlacements)),
          ...existingPlcs.filter((p) => p.studentId !== newReg.studentId),
        ];

        transaction.set(
          schoolRef,
          {
            registrations: updatedRegs,
            placements: updatedPlcs,
            tombstones,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    try {
      const qKey = `pending_regs_${id}`;
      const raw = localStorage.getItem(qKey);
      const queue = raw ? JSON.parse(raw) : [];
      if (Array.isArray(queue)) {
        const remaining = queue.filter((item) => item?.reg?.studentId !== newReg.studentId);
        if (remaining.length === 0) localStorage.removeItem(qKey);
        else localStorage.setItem(qKey, JSON.stringify(remaining));
      }
    } catch {
      // ignore
    }
    return { success: true };
  } catch (error: any) {
    const isQuota = isQuotaError(error);
    const errMsg = error?.message || String(error);
    if (isQuota) {
      updateSyncStatus("quota_exceeded", errMsg);
      console.warn(`[Firestore] Quota exceeded saving registration for ${id}. Queued locally.`);
    } else {
      console.error(`[Firestore] Failed to save registration for ${id}:`, error);
    }
    queuePendingRegistration(id, newReg, newPlacements);
    return { success: false, error: errMsg, isQuotaExceeded: isQuota };
  }
}

/**
 * Atomically delete a registration and its placements directly from Firestore
 */
export async function deleteRegistrationFromFirestore(
  schoolId: string,
  regId: string,
  studentId?: string,
): Promise<{ success: boolean; error?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  rememberLocalDeletes(id, {
    deleteRegistrationIds: [regId],
  });
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const existingRegs: Registration[] = data.registrations || [];
        const existingPlcs: Placement[] = data.placements || [];
        const reg = existingRegs.find((r) => r.id === regId);
        const sId = studentId || reg?.studentId;
        const tombstones = { ...(data.tombstones || {}) };
        const now = new Date().toISOString();
        tombstones[tombKey(id, "registration", regId)] = now;
        if (sId) tombstones[tombKey(id, "registrationStudent", sId)] = now;
        try {
          if (typeof localStorage !== "undefined" && sId) {
            rememberTombstoneKeys(localStorage, [tombKey(id, "registrationStudent", sId)]);
          }
        } catch {
          // ignore
        }

        transaction.set(
          schoolRef,
          {
            registrations: existingRegs.filter((r) => r.id !== regId && r.studentId !== sId),
            placements: existingPlcs.filter((p) => (sId ? p.studentId !== sId : true)),
            tombstones,
            updatedAt: now,
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to delete registration for ${id}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Atomically update an existing registration and its placements in Firestore
 */
export async function updateRegistrationInFirestore(
  schoolId: string,
  updatedReg: Registration,
  updatedPlacements: Placement[],
): Promise<{ success: boolean; error?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  try {
    await enqueueSchoolWrite(id, () =>
      runTransaction(db, async (transaction) => {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, id);
        const snap = await transaction.get(schoolRef);
        if (!snap.exists()) {
          throw new Error("School not found");
        }
        const data = snap.data();
        const existingRegs: Registration[] = data.registrations || [];
        const existingPlcs: Placement[] = data.placements || [];
        const sanitizedReg = JSON.parse(JSON.stringify(updatedReg));
        const sanitizedPlcs = JSON.parse(JSON.stringify(updatedPlacements));
        const alreadyThere = existingRegs.some((r) => r.id === updatedReg.id || r.studentId === updatedReg.studentId);
        const finalRegs = alreadyThere
          ? existingRegs.map((r) =>
              r.id === updatedReg.id || r.studentId === updatedReg.studentId ? sanitizedReg : r,
            )
          : [sanitizedReg, ...existingRegs];
        const finalPlcs = [
          ...sanitizedPlcs,
          ...existingPlcs.filter((p) => p.studentId !== updatedReg.studentId),
        ];

        transaction.set(
          schoolRef,
          {
            registrations: finalRegs,
            placements: finalPlcs,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }),
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to update registration in ${id}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Save all schools to Firestore in batch
 */
export async function saveAllSchoolsToFirestore(
  schools: Record<string, SchoolData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const [schoolId, data] of Object.entries(schools)) {
      const result = await saveSchoolDataToFirestore(schoolId, data);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    return { success: true };
  } catch (error: any) {
    console.warn("[Firestore] Failed to save schools:", error);
    return { success: false, error: error?.message || String(error) };
  }
}

export function readPendingRegistrations(
  schoolId: string,
): Array<{ reg: Registration; placements: Placement[]; timestamp?: string }> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(`pending_regs_${id}`);
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

export async function flushPendingRegistrations(
  schoolId: string,
  serverRegistrations?: Registration[],
): Promise<void> {
  const id = canonicalSchoolKey(schoolId) || schoolId;
  let queue: Array<{ reg: Registration; placements: Placement[]; timestamp?: string }> = [];
  try {
    const raw = localStorage.getItem(`pending_regs_${id}`);
    queue = raw ? JSON.parse(raw) : [];
  } catch {
    return;
  }
  if (!Array.isArray(queue) || queue.length === 0) return;
  const tombstones = typeof localStorage === "undefined" ? {} : readTombstones(localStorage);
  const serverByStudent = new Map<string, Registration>();
  (serverRegistrations || []).forEach((reg) => {
    if (reg?.studentId) serverByStudent.set(reg.studentId, reg);
  });
  const remaining: typeof queue = [];
  for (const item of queue) {
    if (!item?.reg) continue;
    const pendingTime = Date.parse(item.timestamp || item.reg.timestamp || "") || 0;
    const blockedAt = Math.max(
      Date.parse(tombstones[tombKey(id, "registration", item.reg.id)] || "") || 0,
      Date.parse(tombstones[tombKey(id, "registrationStudent", item.reg.studentId)] || "") || 0,
    );
    if (blockedAt && pendingTime <= blockedAt) continue;
    const serverReg = serverByStudent.get(item.reg.studentId);
    const serverTime = Date.parse(serverReg?.timestamp || "") || 0;
    const regTime = Date.parse(item.reg.timestamp || "") || 0;
    if (serverReg && serverTime >= regTime) continue;
    const result = await saveRegistrationToFirestore(id, item.reg, item.placements || []);
    if (!result.success) remaining.push(item);
  }
  try {
    if (remaining.length === 0) localStorage.removeItem(`pending_regs_${id}`);
    else localStorage.setItem(`pending_regs_${id}`, JSON.stringify(remaining));
  } catch {
    // ignore
  }
}

/**
 * Real-time listener for global settings
 */
export function subscribeToGlobalSettings(
  callback: (settings: GlobalSettings) => void,
): () => void {
  try {
    const settingsRef = doc(db, "settings", "global");
    return onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as GlobalSettings);
        }
      },
      (err) => {
        console.warn("[Firestore] Settings subscription error:", err);
      },
    );
  } catch (e) {
    console.warn("[Firestore] Failed to subscribe to settings:", e);
    return () => {};
  }
}

/**
 * Real-time listener for all schools in Firestore.
 * Automatically seeds initial data if Firestore is empty on first load.
 */
export function subscribeToSchools(
  callback: (
    schools: Record<string, SchoolData>,
    tombstones?: Record<string, Record<string, string>>,
    updatedAtBySchool?: Record<string, string>,
  ) => void,
): () => void {
  try {
    const schoolsCol = collection(db, SCHOOLS_COLLECTION);
    return onSnapshot(
      schoolsCol,
      async (snapshot) => {
        if (snapshot.empty) {
          console.warn("[Firestore] Received empty snapshot. Retaining existing cache without overwriting cloud data.");
          return;
        }

        const schoolsData: Record<string, SchoolData> = {};
        const tombstonesBySchool: Record<string, Record<string, string>> = {};
        const updatedAtBySchool: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const hasPayload =
            data &&
            (data.school || data.students || data.registrations || data.activities || data.placements);
          if (!hasPayload) return;
          const normalized = normalizeServerSchool(data, docSnap.id);
          const existing = schoolsData[normalized.school.id];
          schoolsData[normalized.school.id] = existing
            ? mergeSchoolSnapshot(existing, normalized, {
                tombstones: {
                  ...(tombstonesBySchool[normalized.school.id] || {}),
                  ...(data.tombstones || {}),
                },
              }).data
            : normalized;
          tombstonesBySchool[normalized.school.id] = {
            ...(tombstonesBySchool[normalized.school.id] || {}),
            ...(data.tombstones || {}),
          };
          if (typeof data?.updatedAt === "string" && data.updatedAt) {
            const previous = updatedAtBySchool[normalized.school.id];
            if (!previous || Date.parse(data.updatedAt) > Date.parse(previous)) {
              updatedAtBySchool[normalized.school.id] = data.updatedAt;
            }
          }
        });

        if (Object.keys(schoolsData).length > 0) {
          updateSyncStatus("synced");
          // Persist full snapshot to local cache
          try {
            localStorage.setItem("cloud_schools_full_cache", JSON.stringify(schoolsData));
          } catch (e) {}
          callback(schoolsData, tombstonesBySchool, updatedAtBySchool);
          Object.keys(schoolsData).forEach((schoolId) => {
            flushPendingRegistrations(schoolId, schoolsData[schoolId]?.registrations).catch(() => undefined);
          });
        }
      },
      (err: any) => {
        const isQuota =
          err?.code === "resource-exhausted" ||
          String(err?.message || "").includes("Quota exceeded");
        const errMsg = err?.message || String(err);
        if (isQuota) {
          console.warn(
            "[Firestore] Real-time read quota reached. Loading from verified local offline cache...",
          );
          updateSyncStatus("quota_exceeded", errMsg);
          try {
            const cached = localStorage.getItem("cloud_schools_full_cache");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && Object.keys(parsed).length > 0) {
                callback(parsed);
              }
            }
          } catch (e) {}
        } else {
          updateSyncStatus("error", errMsg);
          console.warn("[Firestore] Schools subscription error:", err);
        }
      },
    );
  } catch (e: any) {
    const errMsg = e?.message || String(e);
    updateSyncStatus("error", errMsg);
    console.warn("[Firestore] Failed to subscribe to schools:", e);
    return () => {};
  }
}

/**
 * On-demand manual fetch of all schools from Firestore (used by refresh button)
 */
export async function fetchSchoolsFromFirestore(): Promise<{
  success: boolean;
  schools?: Record<string, SchoolData>;
  updatedAtBySchool?: Record<string, string>;
  error?: string;
  isQuotaExceeded?: boolean;
}> {
  try {
    const schoolsCol = collection(db, SCHOOLS_COLLECTION);
    const snapshot = await getDocs(schoolsCol);

    if (snapshot.empty) {
      return { success: true, schools: {} };
    }

    const schoolsData: Record<string, SchoolData> = {};
    const updatedAtBySchool: Record<string, string> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const hasPayload =
        data &&
        (data.school || data.students || data.registrations || data.activities || data.placements);
      if (!hasPayload) return;
      const normalized = normalizeServerSchool(data, docSnap.id);
      const existing = schoolsData[normalized.school.id];
      schoolsData[normalized.school.id] = existing
        ? mergeSchoolSnapshot(existing, normalized, { tombstones: data.tombstones || {} }).data
        : normalized;
      if (typeof data?.updatedAt === "string" && data.updatedAt) {
        updatedAtBySchool[normalized.school.id] = data.updatedAt;
      }
    });

    updateSyncStatus("synced");
    return { success: true, schools: schoolsData, updatedAtBySchool };
  } catch (error: any) {
    const isQuota =
      error?.code === "resource-exhausted" ||
      String(error?.message || "").includes("Quota exceeded");
    const errMsg = error?.message || String(error);
    if (isQuota) {
      updateSyncStatus("quota_exceeded", errMsg);
    } else {
      updateSyncStatus("error", errMsg);
    }
    return {
      success: false,
      error: errMsg,
      isQuotaExceeded: isQuota,
    };
  }
}
