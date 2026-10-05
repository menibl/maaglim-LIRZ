import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { SchoolData, INITIAL_SCHOOLS } from "../data/initialData";
import {
  Coordinator,
  Activity,
  Student,
  Registration,
  Placement,
  FridayTimeSlot,
} from "../types";

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

const SETTINGS_DOC = "settings/global";
const SCHOOLS_COLLECTION = "schools";

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
 * Save specific school data (coordinator, activities, students, registrations, placements, etc.)
 */
export async function saveSchoolDataToFirestore(
  schoolId: string,
  data: SchoolData,
): Promise<{ success: boolean; error?: string; isQuotaExceeded?: boolean }> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    // Convert undefined fields to avoid firestore errors
    const sanitized = JSON.parse(JSON.stringify(data));
    await setDoc(
      schoolRef,
      {
        ...sanitized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    const isQuota =
      error?.code === "resource-exhausted" ||
      String(error?.message || "").includes("Quota exceeded");
    const errMsg = error?.message || String(error);
    if (isQuota) {
      updateSyncStatus("quota_exceeded", errMsg);
      console.warn(
        `[Firestore] Quota exceeded while saving school data for ${schoolId}. Data saved locally.`,
      );
    } else {
      updateSyncStatus("error", errMsg);
      console.warn(
        `[Firestore] Failed to save school data for ${schoolId}:`,
        error,
      );
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
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const sanitized = JSON.parse(JSON.stringify(coordinator));
    await setDoc(
      schoolRef,
      {
        school: { coordinator: sanitized },
        coordinator: sanitized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save coordinator for ${schoolId}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Update ONLY activities list in Firestore without touching coordinators or registrations
 */
export async function saveActivitiesToFirestore(
  schoolId: string,
  activities: Activity[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const sanitized = JSON.parse(JSON.stringify(activities));
    await setDoc(
      schoolRef,
      {
        activities: sanitized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save activities for ${schoolId}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Update ONLY students list in Firestore
 */
export async function saveStudentsToFirestore(
  schoolId: string,
  students: Student[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const sanitized = JSON.parse(JSON.stringify(students));
    await setDoc(
      schoolRef,
      {
        students: sanitized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to save students for ${schoolId}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Atomically save a registration and its instant placements directly to Firestore.
 * Reads the latest live document to prevent concurrent write collisions with other parents!
 */
export async function saveRegistrationToFirestore(
  schoolId: string,
  newReg: Registration,
  newPlacements: Placement[],
): Promise<{ success: boolean; error?: string; isQuotaExceeded?: boolean }> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const snap = await getDoc(schoolRef);
    const currentData = snap.exists() ? snap.data() : {};
    const existingRegs: Registration[] = currentData.registrations || [];
    const existingPlcs: Placement[] = currentData.placements || [];

    const updatedRegs = [
      JSON.parse(JSON.stringify(newReg)),
      ...existingRegs.filter((r) => r.studentId !== newReg.studentId),
    ];
    const updatedPlcs = [
      ...JSON.parse(JSON.stringify(newPlacements)),
      ...existingPlcs.filter((p) => p.studentId !== newReg.studentId),
    ];

    await setDoc(
      schoolRef,
      {
        registrations: updatedRegs,
        placements: updatedPlcs,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    const isQuota =
      error?.code === "resource-exhausted" ||
      String(error?.message || "").includes("Quota exceeded");
    const errMsg = error?.message || String(error);
    if (isQuota) {
      updateSyncStatus("quota_exceeded", errMsg);
      console.warn(`[Firestore] Quota exceeded saving registration for ${schoolId}. Queued locally.`);
    } else {
      console.error(`[Firestore] Failed to save registration for ${schoolId}:`, error);
    }
    // Always persist to local pending queue so it syncs to cloud as soon as quota is available
    try {
      const qKey = `pending_regs_${schoolId}`;
      const raw = localStorage.getItem(qKey);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ reg: newReg, placements: newPlacements, timestamp: new Date().toISOString() });
      localStorage.setItem(qKey, JSON.stringify(queue));
    } catch (e) {}

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
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const snap = await getDoc(schoolRef);
    if (!snap.exists()) return { success: true };
    const data = snap.data();
    const existingRegs: Registration[] = data.registrations || [];
    const existingPlcs: Placement[] = data.placements || [];

    const reg = existingRegs.find((r) => r.id === regId);
    const sId = studentId || reg?.studentId;

    const filteredRegs = existingRegs.filter((r) => r.id !== regId);
    const filteredPlcs = existingPlcs.filter((p) => (sId ? p.studentId !== sId : true));

    await setDoc(
      schoolRef,
      {
        registrations: filteredRegs,
        placements: filteredPlcs,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to delete registration for ${schoolId}:`, error);
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
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const snap = await getDoc(schoolRef);
    if (!snap.exists()) return { success: false, error: "School not found" };
    const data = snap.data();
    const existingRegs: Registration[] = data.registrations || [];
    const existingPlcs: Placement[] = data.placements || [];

    const sanitizedReg = JSON.parse(JSON.stringify(updatedReg));
    const sanitizedPlcs = JSON.parse(JSON.stringify(updatedPlacements));

    const finalRegs = existingRegs.map((r) =>
      r.id === updatedReg.id ? sanitizedReg : r,
    );
    const finalPlcs = [
      ...sanitizedPlcs,
      ...existingPlcs.filter((p) => p.studentId !== updatedReg.studentId),
    ];

    await setDoc(
      schoolRef,
      {
        registrations: finalRegs,
        placements: finalPlcs,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updateSyncStatus("synced");
    return { success: true };
  } catch (error: any) {
    console.error(`[Firestore] Failed to update registration in ${schoolId}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Save all schools to Firestore in batch
 */
export async function saveAllSchoolsToFirestore(
  schools: Record<string, SchoolData>,
): Promise<void> {
  try {
    const batch = writeBatch(db);
    Object.entries(schools).forEach(([schoolId, data]) => {
      const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
      const sanitized = JSON.parse(JSON.stringify(data));
      batch.set(
        schoolRef,
        {
          ...sanitized,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    });
    await batch.commit();
  } catch (error) {
    console.warn("[Firestore] Failed to batch save schools:", error);
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
  callback: (schools: Record<string, SchoolData>) => void,
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
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data && data.school && data.school.id) {
            schoolsData[data.school.id] = {
              school: {
                ...data.school,
                coordinator: data.school.coordinator || data.coordinator,
              },
              students: data.students || [],
              activities: data.activities || [],
              registrations: data.registrations || [],
              placements: data.placements || [],
            };
          }
        });

        if (Object.keys(schoolsData).length > 0) {
          updateSyncStatus("synced");
          // Persist full snapshot to local cache
          try {
            localStorage.setItem("cloud_schools_full_cache", JSON.stringify(schoolsData));
          } catch (e) {}
          callback(schoolsData);
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
  error?: string;
  isQuotaExceeded?: boolean;
}> {
  try {
    const schoolsCol = collection(db, SCHOOLS_COLLECTION);
    const snapshot = await getDocs(schoolsCol);

    if (snapshot.empty) {
      return { success: true, schools: INITIAL_SCHOOLS };
    }

    const schoolsData: Record<string, SchoolData> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data && data.school && data.school.id) {
        schoolsData[data.school.id] = {
          school: {
            ...data.school,
            coordinator: data.school.coordinator || data.coordinator,
          },
          students: data.students || [],
          activities: data.activities || [],
          registrations: data.registrations || [],
          placements: data.placements || [],
        };
      }
    });

    updateSyncStatus("synced");
    return { success: true, schools: schoolsData };
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
