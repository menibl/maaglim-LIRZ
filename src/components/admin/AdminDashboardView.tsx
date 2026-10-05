import React, { useState, useMemo } from "react";
import { useSchool, isActivitiesCorrupted } from "../../context/SchoolContext";
import {
  ActiveTab,
  Student,
  Activity,
  Placement,
  Registration,
  AlgorithmConfig,
  PlacementStatus,
  FridayTimeSlot,
  Coordinator,
} from "../../types";
import {
  exportFullSchoolWorkbook,
  exportToExcel,
  exportActivitiesToExcel,
  exportStudentsToExcel,
  downloadStudentTemplate,
  downloadActivityTemplate,
} from "../../services/excelService";
import { getAppsScriptCode } from "../../services/appsScriptTemplate";
import { optimizeLogoImage } from "../../services/imageUtils";
import { ExcelImportModal } from "./ExcelImportModal";
import { StudentEditModal } from "./StudentEditModal";
import { ActivityEditModal } from "./ActivityEditModal";
import { ManualPlacementModal } from "./ManualPlacementModal";
import { RegistrationEditModal } from "./RegistrationEditModal";
import { resolveActivityDisplay } from "../../utils/activityResolver";
import { MaagalimLogo } from "../MaagalimLogo";

import {
  Users,
  BookOpen,
  FileSpreadsheet,
  Play,
  AlertTriangle,
  Settings,
  Code,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  ArrowRightLeft,
  Save,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  PhoneCall,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  Building2,
  ExternalLink,
  User,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export const AdminDashboardView: React.FC = () => {
  const {
    schools,
    currentSchoolId,
    selectSchool,
    currentSchool,
    coordinator,
    students,
    activities,
    registrations,
    placements,
    executionLogs,
    lastSummary,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    updateAdminPassword,
    updateFridaySlots,
    addStudent,
    updateStudent,
    deleteStudent,
    clearAllStudents,
    addActivity,
    updateActivity,
    deleteActivity,
    updateRegistration,
    deleteRegistration,
    runPlacementEngine,
    manualOverridePlacement,
    clearPlacements,
    updateSchoolInfo,
    updateCoordinatorInfo,
    updateSchoolCoordinator,
    updateLogo,
    resetCurrentSchoolToDefaults,
    restoreOfficialActivities,
    syncStatus,
    syncErrorMessage,
    refreshFromCloud,
    uploadLocalDataToCloud,
    executeDeepCacheRecovery,
  } = useSchool();

  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [cloudRefreshNotice, setCloudRefreshNotice] = useState<string | null>(null);

  const handleDeepCacheRecovery = () => {
    try {
      const res = executeDeepCacheRecovery();
      if (res.registrationsRecovered > 0 || res.studentsRecovered > 0) {
        setCloudRefreshNotice(
          `מעולה! אותרו ושוחזרו ${res.registrationsRecovered} נרשמים ו-${res.studentsRecovered} תלמידים מזיכרון המטמון של הדפדפן, והם סונכרנו כעת לענן!`
        );
      } else {
        setCloudRefreshNotice(
          "הסריקה הושלמה: לא נמצאו רשומות נוספות בזיכרון המקומי של הדפדפן מעבר למה שמוצג כעת."
        );
      }
    } catch (e: any) {
      setCloudRefreshNotice(`שגיאה בסריקה: ${e.message || "נכשל"}`);
    }
  };

  const handleManualCloudRefresh = async () => {
    setIsRefreshingCloud(true);
    setCloudRefreshNotice(null);
    try {
      const res = await refreshFromCloud();
      if (res.success) {
        setCloudRefreshNotice("הנתונים סונכרנו בהצלחה מהענן!");
      } else {
        setCloudRefreshNotice(`שגיאה בסנכרון: ${res.error || "לא ניתן לגשת לענן כעת"}`);
      }
    } catch (e: any) {
      setCloudRefreshNotice(`שגיאה: ${e.message || "נכשל הסנכרון"}`);
    } finally {
      setIsRefreshingCloud(false);
      setTimeout(() => setCloudRefreshNotice(null), 6000);
    }
  };

  const handleUploadLocalDataToCloud = async () => {
    const confirmUpload = window.confirm(
      "פעולה זו תעלה ותשמור את כל נתוני המחשב שלך (כולל פרטי הרכזות המעודכנים ורשימת החוגים המעודכנת) ישירות לענן Firebase. כל 26 הנרשמים שכבר קיימים בענן יישמרו במלואם. האם להמשיך?",
    );
    if (!confirmUpload) return;

    setIsUploadingToCloud(true);
    setCloudRefreshNotice(null);
    try {
      const res = await uploadLocalDataToCloud();
      if (res.success) {
        setCloudRefreshNotice("מעולה! כל נתוני המחשב שלך (רכזות, חוגים ושיבוצים) נשמרו וסונכרנו בהצלחה בענן Firebase!");
      } else {
        setCloudRefreshNotice(`שגיאה בשמירה לענן: ${res.error || "נכשל"}`);
      }
    } catch (e: any) {
      setCloudRefreshNotice(`שגיאה: ${e.message || "נכשל"}`);
    } finally {
      setIsUploadingToCloud(false);
      setTimeout(() => setCloudRefreshNotice(null), 8000);
    }
  };

  // Password Lock State
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Clear Students Modal State
  const [isClearStudentsModalOpen, setIsClearStudentsModalOpen] =
    useState(false);
  const [clearMode, setClearMode] = useState<"all" | "current">("all");
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(
    null,
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState("all");

  const [activitySearch, setActivitySearch] = useState("");
  const [activitySlotFilter, setActivitySlotFilter] = useState<string>("all");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("all");

  const [registrationSearch, setRegistrationSearch] = useState("");
  const [filterDiscontinuedOnly, setFilterDiscontinuedOnly] = useState(false);
  const [placementFilter, setPlacementFilter] = useState<string>("all");
  const [placementSearch, setPlacementSearch] = useState("");

  // Algorithm Config
  const [algoStrategy, setAlgoStrategy] = useState<"first_come" | "lottery">(
    "first_come",
  );
  const [isRunningAlgo, setIsRunningAlgo] = useState(false);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalTab, setImportModalTab] = useState<
    "activities" | "students" | "registrations" | "full_workbook" | "all"
  >("all");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<Placement | null>(
    null,
  );
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(
    null,
  );

  // Friday Slot Times Form
  const [fridaySlotsForm, setFridaySlotsForm] = useState<FridayTimeSlot[]>(
    currentSchool.fridaySlots || [
      {
        id: "slot-1",
        slotNumber: 1,
        label: "שעה ראשונה",
        startTime: "שעה ראשונה",
        endTime: "",
      },
      {
        id: "slot-2",
        slotNumber: 2,
        label: "שעה שניה",
        startTime: "שעה שניה",
        endTime: "",
      },
      {
        id: "slot-3",
        slotNumber: 3,
        label: "שעה שלישית",
        startTime: "שעה שלישית",
        endTime: "",
      },
    ],
  );
  const [isSlotsSaved, setIsSlotsSaved] = useState(false);

  // Admin Password Change Form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null,
  );

  // Coordinator Edit state (Active school)
  const [coordForm, setCoordForm] = useState(coordinator);
  const [isCoordSaved, setIsCoordSaved] = useState(false);

  // Multi-School Coordinators Edit state (All 3 schools)
  const [coordinatorsForm, setCoordinatorsForm] = useState<
    Record<string, Coordinator>
  >({});
  const [savedSchoolIds, setSavedSchoolIds] = useState<Record<string, boolean>>(
    {},
  );

  // Sync coordinatorsForm when schools change
  React.useEffect(() => {
    const initialCoordinators: Record<string, Coordinator> = {};
    Object.values(schools).forEach(({ school }) => {
      initialCoordinators[school.id] = { ...school.coordinator };
    });
    setCoordinatorsForm(initialCoordinators);
  }, [schools]);

  // Sync single coordinator form if current school changes
  React.useEffect(() => {
    if (coordinator) {
      setCoordForm(coordinator);
    }
  }, [coordinator, currentSchoolId]);

  // Code Copy feedback
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Sync slots form if school slots change
  React.useEffect(() => {
    if (currentSchool.fridaySlots) {
      setFridaySlotsForm(currentSchool.fridaySlots);
    }
  }, [currentSchool.fridaySlots]);

  // Logo Customization State
  const [logoInputUrl, setLogoInputUrl] = useState(currentSchool.logoUrl || "");
  const [logoSuccessMessage, setLogoSuccessMessage] = useState<string | null>(
    null,
  );
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  React.useEffect(() => {
    setLogoInputUrl(currentSchool.logoUrl || "");
  }, [currentSchool.logoUrl, currentSchoolId]);

  const handleLogoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    try {
      // Scale & optimize to prevent localStorage quota exhaustion
      const optimizedDataUrl = await optimizeLogoImage(file, 500, 160);
      setLogoInputUrl(optimizedDataUrl);
      updateLogo(optimizedDataUrl, true);
      setLogoSuccessMessage(
        "תמונת הלוגו עובדה, נשמרה לצמיתות והוחלה על כל בתי הספר!",
      );
      setTimeout(() => setLogoSuccessMessage(null), 4000);
    } catch (err) {
      console.warn("Image optimization fallback:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setLogoInputUrl(dataUrl);
          updateLogo(dataUrl, true);
          setLogoSuccessMessage("תמונת הלוגו נשמרה בהצלחה!");
          setTimeout(() => setLogoSuccessMessage(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSaveLogoUrl = (applyToAll: boolean = false) => {
    const trimmed = logoInputUrl.trim();
    updateLogo(trimmed || undefined, applyToAll);
    if (applyToAll) {
      setLogoSuccessMessage("הלוגו נשמר לצמיתות והוחל על כל 3 בתי הספר!");
    } else {
      setLogoSuccessMessage(`הלוגו נשמר בהצלחה עבור ${currentSchool.name}!`);
    }
    setTimeout(() => setLogoSuccessMessage(null), 3000);
  };

  const handleResetLogo = () => {
    setLogoInputUrl("");
    updateLogo(undefined, true);
    setLogoSuccessMessage("הלוגו אופס ללוגו המקורי של תוכנית מעגלים.");
    setTimeout(() => setLogoSuccessMessage(null), 3000);
  };

  const handleSaveSchoolCoordinator = (
    schoolId: string,
    e?: React.FormEvent,
  ) => {
    if (e) e.preventDefault();
    const schoolCoord = coordinatorsForm[schoolId];
    if (!schoolCoord) return;
    updateSchoolCoordinator(schoolId, schoolCoord);
    if (schoolId === currentSchoolId) {
      setCoordForm({ ...schoolCoord });
    }
    setCloudRefreshNotice(`פרטי הרכז/ת עבור בית הספר נשמרו ונשלחו בהצלחה לענן Firebase!`);
    setSavedSchoolIds((prev) => ({ ...prev, [schoolId]: true }));
    setTimeout(() => {
      setSavedSchoolIds((prev) => ({ ...prev, [schoolId]: false }));
      setCloudRefreshNotice(null);
    }, 3500);
  };

  // Handle Admin Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("נא להזין סיסמה.");
      return;
    }

    const success = loginAdmin(passwordInput.trim());
    if (!success) {
      setPasswordError("סיסמה שגויה. אנא נסו שוב.");
    } else {
      setPasswordError(null);
      setPasswordInput("");
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        `${s.firstName} ${s.lastName} ${s.id} ${s.parentName || ""}`.includes(
          studentSearch,
        );
      const matchGrade =
        studentGradeFilter === "all" ||
        s.grade.startsWith(studentGradeFilter) ||
        s.gradeLayer === studentGradeFilter;
      return matchSearch && matchGrade;
    });
  }, [students, studentSearch, studentGradeFilter]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchSearch = `${a.name} ${a.instructor} ${a.location}`.includes(
        activitySearch,
      );
      const matchCat =
        activityCategoryFilter === "all" ||
        a.category === activityCategoryFilter;
      const matchSlot =
        activitySlotFilter === "all" ||
        String(a.slotNumber) === activitySlotFilter;
      return matchSearch && matchCat && matchSlot;
    });
  }, [activities, activitySearch, activityCategoryFilter, activitySlotFilter]);

  // Filtered Registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchSearch = `${r.studentName} ${r.studentId} ${r.parentName} ${r.parentPhone}`.includes(
        registrationSearch,
      );
      if (!matchSearch) return false;
      if (filterDiscontinuedOnly) {
        const res1 = resolveActivityDisplay(r.slot1Choice, activities);
        const res2 = resolveActivityDisplay(r.slot2Choice, activities);
        const res3 = resolveActivityDisplay(r.slot3Choice, activities);
        return res1.isDiscontinued || res2.isDiscontinued || res3.isDiscontinued;
      }
      return true;
    });
  }, [registrations, registrationSearch, filterDiscontinuedOnly, activities]);

  // Count of registrations that reference discontinued or changed activities
  const discontinuedCount = useMemo(() => {
    return registrations.filter((r) => {
      const res1 = resolveActivityDisplay(r.slot1Choice, activities);
      const res2 = resolveActivityDisplay(r.slot2Choice, activities);
      const res3 = resolveActivityDisplay(r.slot3Choice, activities);
      return res1.isDiscontinued || res2.isDiscontinued || res3.isDiscontinued;
    }).length;
  }, [registrations, activities]);

  // Smart auto-repair registrations
  const handleAutoRepairRegistrations = () => {
    let repairedCount = 0;
    registrations.forEach((reg) => {
      const res1 = resolveActivityDisplay(reg.slot1Choice, activities);
      const res2 = resolveActivityDisplay(reg.slot2Choice, activities);
      const res3 = resolveActivityDisplay(reg.slot3Choice, activities);

      const target1 = res1.matchedActivity && !res1.isDiscontinued ? res1.matchedActivity.id : reg.slot1Choice;
      const target2 = res2.matchedActivity && !res2.isDiscontinued ? res2.matchedActivity.id : reg.slot2Choice;
      const target3 = res3.matchedActivity && !res3.isDiscontinued ? res3.matchedActivity.id : reg.slot3Choice;

      if (target1 !== reg.slot1Choice || target2 !== reg.slot2Choice || target3 !== reg.slot3Choice) {
        updateRegistration({
          ...reg,
          slot1Choice: target1,
          slot2Choice: target2,
          slot3Choice: target3,
        });
        repairedCount++;
      }
    });

    if (repairedCount > 0) {
      setCloudRefreshNotice(`בוצעה התאמה ותיקון אוטומטי עבור ${repairedCount} תלמידים לפי רשימת החוגים הפעילה!`);
    } else {
      setCloudRefreshNotice(`כל החוגים המותאמים כבר מעודכנים. עבור חוגים שבוטלו לחלוטין, ניתן לערוך ידנית בלחיצה על ✏️.`);
    }
    setTimeout(() => setCloudRefreshNotice(null), 6000);
  };

  // Filtered Placements
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchSearch = `${p.studentName} ${p.studentId} ${p.grade}`.includes(
        placementSearch,
      );
      const matchStatus =
        placementFilter === "all" || p.status === placementFilter;
      return matchSearch && matchStatus;
    });
  }, [placements, placementSearch, placementFilter]);

  // Statistics Calculation
  const placedCount = placements.filter((p) => p.status === "placed").length;
  const waitlistCount = placements.filter(
    (p) => p.status === "waitlist",
  ).length;
  const rejectedCount = placements.filter(
    (p) => p.status === "rejected",
  ).length;

  // Activities under min capacity
  const underMinActivities = useMemo(() => {
    return activities.filter((a) => {
      const enrolled = placements.filter(
        (p) => p.placedActivityId === a.id && p.status === "placed",
      ).length;
      return enrolled > 0 && enrolled < a.minCapacity;
    });
  }, [activities, placements]);

  // Unplaced students
  const unplacedStudents = useMemo(() => {
    return placements.filter(
      (p) =>
        p.status === "waitlist" ||
        p.status === "unplaced" ||
        p.status === "rejected",
    );
  }, [placements]);

  // Run Algorithm Handler
  const handleRunMatching = () => {
    setIsRunningAlgo(true);
    setTimeout(() => {
      const result = runPlacementEngine({
        strategy: algoStrategy,
        autoWaitlist: true,
        minCapacityEnforcement: "warn",
      });
      setIsRunningAlgo(false);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    }, 600);
  };

  const handleExportFullWorkbook = () => {
    exportFullSchoolWorkbook(
      currentSchool,
      students,
      activities,
      registrations,
      placements,
    );
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(getAppsScriptCode());
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  const handleSaveCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordForm) return;
    updateCoordinatorInfo(coordForm);
    // Sync with multi-school coordinatorsForm
    setCoordinatorsForm((prev) => ({
      ...prev,
      [currentSchoolId]: { ...coordForm },
    }));
    setIsCoordSaved(true);
    setTimeout(() => setIsCoordSaved(false), 2500);
  };

  const handleSaveFridaySlots = (e: React.FormEvent) => {
    e.preventDefault();
    updateFridaySlots(fridaySlotsForm);
    setIsSlotsSaved(true);
    setTimeout(() => setIsSlotsSaved(false), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      setPasswordChangeError("הסיסמה חייבת להכיל לפחות 3 תווים.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("הסיסמאות אינן תואמות.");
      return;
    }
    updateAdminPassword(newPassword);
    setPasswordChangeSuccess(true);
    setPasswordChangeError(null);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  // =========================================================================
  // PASSWORD LOCK SCREEN (If not authenticated)
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900">
              כניסת מנהל/ת מערכת
            </h2>
            <p className="text-xs text-slate-500">
              ממשק הניהול מוגן סיסמה. אנא הזינו את סיסמת המנהל להמשך.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סיסמת מנהל *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="הזינו סיסמת כניסה..."
                  className="w-full pl-3 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              כניסה ללוח הבקרה
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD VIEW
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Admin Top Header & Quick Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-1">
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                סנכרון ענן (Cloud Firestore) מחובר ומסונכרן ✓
              </span>
            )}
            {syncStatus === "connecting" && (
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                מתחבר לענן Firebase...
              </span>
            )}
            {syncStatus === "quota_exceeded" && (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-400 px-2.5 py-0.5 rounded-full font-black animate-pulse shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                מכסת שימוש יומית בענן הסתיימה (Quota Exceeded)
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                שגיאת התחברות לענן
              </span>
            )}
            <span className="text-slate-600">• ניהול מערכת חוגי שישי: {currentSchool.name}</span>
            <span className="text-slate-500">• מוגן סיסמה ✓</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            מרכז שליטה, הגדרות ושיבוץ חוגים
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            רכזת: <strong>{coordinator.name}</strong> • טלפון:{" "}
            {coordinator.phone} • {students.length} תלמידים זכאים •{" "}
            {activities.length} חוגי שישי • {registrations.length} נרשמים במערכת
          </p>

          {/* Direct One-Click School Switcher with live counters */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-black text-slate-500">מעבר מהיר לבית ספר:</span>
            {Object.values(schools).map(({ school, students: scStudents, registrations: scRegs }) => {
              const isSelected = school.id === currentSchoolId;
              const regsCount = scRegs?.length || 0;
              const studCount = scStudents?.length || 0;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => selectSchool(school.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{school.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    }`}
                  >
                    {regsCount} נרשמים ({studCount} זכאים)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUploadLocalDataToCloud}
            disabled={isUploadingToCloud}
            title="סנכרון והעלאת כל נתוני המחשב והדפדפן הנוכחי לענן Firebase (דריסה מבוקרת של חוגים ורכזות תוך שימור כל הנרשמים)"
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className={`w-4 h-4 ${isUploadingToCloud ? "animate-bounce" : ""}`} />
            <span>{isUploadingToCloud ? "מעלה לענן..." : "שמור נתוני מחשב זה לענן"}</span>
          </button>

          <button
            onClick={handleManualCloudRefresh}
            disabled={isRefreshingCloud}
            title="רענון וסנכרון נתונים מענן Firebase"
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingCloud ? "animate-spin" : ""}`} />
            <span>{isRefreshingCloud ? "מרענן..." : "רענן מענן"}</span>
          </button>

          <button
            onClick={handleDeepCacheRecovery}
            title="סריקה עמוקה של כל פינות זיכרון הדפדפן (localStorage / sessionStorage) לשחזור רשומות נרשמים ותלמידים שנשמרו בעבר"
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>שחזור עמוק מהדפדפן</span>
          </button>

          <button
            id="btn-import-excel-modal"
            onClick={() => {
              setImportModalTab("full_workbook");
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="טעינת קובץ Excel - תמיכה בקובץ מלא (זכאים, חוגים ונרשמים) או קבצים נפרדים"
          >
            <Upload className="w-4 h-4" />
            <span>טעינה / שחזור מ-Excel</span>
          </button>

          <button
            id="btn-export-full-workbook"
            onClick={handleExportFullWorkbook}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ייצוא קובץ מלא</span>
          </button>

          <button
            id="btn-run-matching-top"
            onClick={handleRunMatching}
            disabled={isRunningAlgo || registrations.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isRunningAlgo
                ? "מריץ שיבוץ 3 חוגים..."
                : "הפעל שיבוץ אוטומטי ל-3 החוגים"}
            </span>
          </button>

          <button
            onClick={logoutAdmin}
            title="התנתקות מניהול"
            className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
        </div>
      </div>

      {/* Cloud Quota Exceeded Warning Banner */}
      {syncStatus === "quota_exceeded" && (
        <div className="bg-amber-50/90 border-2 border-amber-400 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-amber-950">
                מכסת השימוש החינמית ב-Firebase Firestore הסתיימה להיום (Quota Exceeded)
              </h3>
              <p className="text-xs md:text-sm text-amber-900 leading-relaxed max-w-3xl">
                בשל ריבוי כניסות ונרשמים רבים בימים האחרונים, המערכת הגיעה לתקרת המכסה החינמית היומית של Google Cloud Firebase.
                <br />
                <strong>חשוב להדגיש:</strong> הנתונים שנשמרו בענן בטוחים ולא נמחקו. הגישה לקריאתם או להוספת רישומים חדשים חסומה זמנית עד לאיפוס המכסה היומית (בחצות שעון שרת) או עד שדרוג לפרויקט Blaze ב-Firebase Console ללא הגבלת מכסה יומית קשיחה.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={handleManualCloudRefresh}
              disabled={isRefreshingCloud}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? "animate-spin" : ""}`} />
              <span>{isRefreshingCloud ? "בודק חיבור..." : "נסה לרענן כעת"}</span>
            </button>
            <a
              href="https://console.firebase.google.com/project/awesome-line-hgtt6/firestore/databases/ai-studio-547396e1-63df-4e49-847f-b7500076fcca/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs text-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              <span>שדרוג מכסה ב-Firebase Console</span>
            </a>
          </div>
        </div>
      )}

      {cloudRefreshNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{cloudRefreshNotice}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>לוח בקרה וסיכום</span>
        </button>

        <button
          id="btn-tab-coordinators"
          onClick={() => setActiveTab("coordinators")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "coordinators"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>רכזי בתי ספר (3)</span>
        </button>

        <button
          onClick={() => setActiveTab("activities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "activities"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>חוגים, תמונות ותיאורים ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "students"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>זכאים ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("registrations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "registrations"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>רישומי הורים ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("placements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "placements"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>שיבוצים סופיים ({placements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "alerts"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>
            חריגים והמתנות (
            {underMinActivities.length + unplacedStudents.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sheets_integration")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "sheets_integration"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Apps Script & Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "settings"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>הגדרות שעות וסיסמה</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                תלמידים זכאים
              </span>
              <div className="text-3xl font-black text-slate-900">
                {students.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {students.filter((s) => s.isAuthorized).length} מאושרים להרשמה
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                חוגי יום שישי
              </span>
              <div className="text-3xl font-black text-indigo-600">
                {activities.length}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                3 משבצות זמן (עד 20 בחוג)
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                טפסי הרשמה שנקלטו
              </span>
              <div className="text-3xl font-black text-blue-600">
                {registrations.length}
              </div>
              <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                {Math.round(
                  (registrations.length / (students.length || 1)) * 100,
                )}
                % היענות
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                שיבוצים פעילים (משבצות)
              </span>
              <div className="text-3xl font-black text-emerald-600">
                {placedCount}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {waitlistCount > 0 ? `${waitlistCount} בהמתנה` : "100% שובצו"}
              </span>
            </div>
          </div>

          {/* Algorithm Placement Controller */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-600" />
                  <span>מנוע שיבוץ אוטומטי רב-משבצתי ליום שישי</span>
                </h3>
                <p className="text-xs text-slate-500">
                  משבץ כל תלמיד ל-3 חוגים בשישי (08:30–09:30, 10:30–11:30,
                  11:30–12:30) בהתאם למכסות ועדיפויות ההורים
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunMatching}
                  disabled={isRunningAlgo || registrations.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {isRunningAlgo
                      ? "מבצע חישוב שיבוץ..."
                      : "הפעל אלגוריתם שיבוץ"}
                  </span>
                </button>
              </div>
            </div>

            {lastSummary && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2 text-emerald-950">
                <div className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  תוצאות ריצת האלגוריתם האחרונה:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div>
                    תלמידים ששובצו: <strong>{lastSummary.placedCount}</strong>
                  </div>
                  <div>
                    ברשימת המתנה: <strong>{lastSummary.waitlistCount}</strong>
                  </div>
                  <div>
                    שביעות רצון (בחירה 1):{" "}
                    <strong>{lastSummary.satisfactionRate}%</strong>
                  </div>
                  <div>
                    זמן חישוב: <strong>{lastSummary.executionTimeMs}ms</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* School Coordinators Quick Access Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-4.5 h-4.5 text-indigo-600" />
                  <span>רכזי ורכזות בתי הספר (פרטי התקשרות מהירים)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  פרטים אלו מוצגים להורים בטופס הרישום ובחלונית העזרה
                </p>
              </div>

              <button
                id="btn-goto-coordinators-tab"
                onClick={() => setActiveTab("coordinators")}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>עריכת רכזי כל בתי הספר</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(schools).map(({ school }) => {
                const isCurrent = school.id === currentSchoolId;
                const coord = school.coordinator;
                return (
                  <div
                    key={school.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-black text-xs text-slate-900 truncate">
                        {school.name}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                          נבחר כעת
                        </span>
                      ) : (
                        <button
                          onClick={() => selectSchool(school.id)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          בחר
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{coord.name || "לא הוגדר שם"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <a
                          href={`tel:${coord.phone}`}
                          className="text-emerald-700 hover:underline"
                        >
                          {coord.phone || "אין טלפון"}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: COORDINATORS MANAGEMENT FOR ALL SCHOOLS */}
      {/* ======================================================== */}
      {activeTab === "coordinators" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-indigo-600" />
                  <span>ניהול פרטי רכזי ורכזות החוגים לכל בית ספר</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  כאן ניתן לערוך ישירות את שמות הרכזים, מספרי הטלפון, כתובות
                  הדוא&quot;ל ושעות המענה לכל 3 בתי הספר.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleUploadLocalDataToCloud}
                  disabled={isUploadingToCloud}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploadingToCloud ? "שומר בענן..." : "שמור וסנכרן את כל הרכזות לענן כעת"}</span>
                </button>
                <div className="text-xs text-slate-600 bg-slate-100 py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3 בתי ספר מוגדרים במערכת</span>
                </div>
              </div>
            </div>

            {/* School Coordinator Cards Grid */}
            <div className="mt-6 space-y-6">
              {Object.values(schools).map(({ school }) => {
                const isCurrent = school.id === currentSchoolId;
                const formCoord =
                  coordinatorsForm[school.id] || school.coordinator;
                const isSaved = savedSchoolIds[school.id];

                return (
                  <form
                    key={school.id}
                    id={`form-coord-${school.id}`}
                    onSubmit={(e) => handleSaveSchoolCoordinator(school.id, e)}
                    className={`rounded-3xl p-6 sm:p-7 border transition-all ${
                      isCurrent
                        ? "bg-white border-indigo-300 shadow-md ring-2 ring-indigo-500/10"
                        : "bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    {/* Header with School info & active status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${
                            isCurrent
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">
                              {school.name}
                            </h4>
                            {isCurrent && (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                בית ספר פעיל כעת ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            סמל מוסד: {school.symbol} • {school.city}
                          </p>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => selectSchool(school.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          החלף לניהול בית ספר זה
                        </button>
                      )}
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>שם הרכז/ת *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formCoord.name || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                name: e.target.value,
                              },
                            }));
                          }}
                          placeholder="לדוגמה: שרה ישראלי"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>מספר טלפון ליצירת קשר *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formCoord.phone || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                phone: e.target.value,
                              },
                            }));
                          }}
                          placeholder="050-1234567"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 dir-ltr text-right"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>הגדרת תפקיד</span>
                        </label>
                        <input
                          type="text"
                          value={formCoord.role || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                role: e.target.value,
                              },
                            }));
                          }}
                          placeholder="רכזת חוגי שישי ותוכנית מעגלים"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>כתובת דוא&quot;ל</span>
                        </label>
                        <input
                          type="email"
                          value={formCoord.email || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                email: e.target.value,
                              },
                            }));
                          }}
                          placeholder="coordinator@school.edu.il"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dir-ltr text-right"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>מספר וואטסאפ לפניות</span>
                        </label>
                        <input
                          type="tel"
                          value={formCoord.whatsapp || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                whatsapp: e.target.value,
                              },
                            }));
                          }}
                          placeholder="050-1234567"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dir-ltr text-right"
                        />
                      </div>

                      {/* Reception Hours */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>שעות קבלת קהל ומענה</span>
                        </label>
                        <input
                          type="text"
                          value={formCoord.receptionHours || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                receptionHours: e.target.value,
                              },
                            }));
                          }}
                          placeholder="ימים א'-ה' 08:00-14:00 ושישי בבוקר"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Location & Notes (spans across) */}
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>מיקום מזכירות והערות נוספות להורים</span>
                        </label>
                        <input
                          type="text"
                          value={formCoord.notes || formCoord.location || ""}
                          onChange={(e) => {
                            setCoordinatorsForm((prev) => ({
                              ...prev,
                              [school.id]: {
                                ...(prev[school.id] || school.coordinator),
                                notes: e.target.value,
                                location: e.target.value,
                              },
                            }));
                          }}
                          placeholder="חדר רכזת בקומה 1 ליד המזכירות / מענה בימי שישי של פעילות"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          id={`btn-save-coord-${school.id}`}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>שמור פרטי רכז/ת ל{school.name}</span>
                        </button>

                        {isSaved && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>הפרטים נשמרו בהצלחה!</span>
                          </span>
                        )}
                      </div>

                      {/* Test Action Links */}
                      <div className="flex items-center gap-2 text-xs">
                        {formCoord.phone && (
                          <a
                            href={`tel:${formCoord.phone}`}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="חיוג טלפוני לבדיקה"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>חייג</span>
                          </a>
                        )}

                        {formCoord.whatsapp && (
                          <a
                            href={`https://wa.me/972${formCoord.whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="שליחת הודעת וואטסאפ"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>וואטסאפ</span>
                          </a>
                        )}

                        {formCoord.email && (
                          <a
                            href={`mailto:${formCoord.email}`}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg transition-colors flex items-center gap-1"
                            title='שליחת דוא"ל'
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>אימייל</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ACTIVITIES, IMAGES & DESCRIPTIONS */}
      {/* ======================================================== */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                ניהול חוגי יום שישי, תמונות ותיאורים
              </h3>
              <p className="text-xs text-slate-500">
                החוגים מוצגים להורים עם שעה, מיקום, תיאור ותמונה. ניתן לערוך כל
                חוג בכל עת.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleUploadLocalDataToCloud}
                disabled={isUploadingToCloud}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title="סנכרון ושמירת כל החוגים מהדפדפן הנוכחי ישירות לענן Firebase"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploadingToCloud ? "שומר בענן..." : "שמור חוגים אלו לענן"}</span>
              </button>

              <button
                id="btn-add-activity"
                onClick={() => {
                  setEditingActivity(null);
                  setIsActivityModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>הוספת חוג שישי חדש</span>
              </button>

              <button
                id="btn-export-activities-excel"
                onClick={() =>
                  exportActivitiesToExcel(activities, currentSchool.name)
                }
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="הורדת קובץ אקסל מלא עם כל פרטי החוגים לעריכה מהירה"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>ייצוא חוגים לעריכה ב-Excel</span>
              </button>

              <button
                onClick={() => {
                  setImportModalTab("activities");
                  setIsImportModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="העלאת קובץ אקסל מעודכן לטעינה ועדכון החוגים במערכת"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>ייבוא / עדכון מ-Excel</span>
              </button>

              <button
                id="btn-restore-official-activities"
                onClick={async () => {
                  if (
                    confirm(
                      `האם לשחזר את רשימת חוגי יום שישי הרשמיים של ${currentSchool.name}? פעולה זו תחזיר את כל החוגים, המשבצות והמכסות התקינות.`,
                    )
                  ) {
                    await restoreOfficialActivities(currentSchoolId);
                    setRestoreSuccessMsg(
                      `רשימת חוגי יום שישי הרשמיים של ${currentSchool.name} שוחזרה בהצלחה!`,
                    );
                    setTimeout(() => setRestoreSuccessMsg(null), 4000);
                  }
                }}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="שחזור רשימת חוגי יום שישי התקנית של בית הספר"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>שחזור חוגי שישי הרשמיים</span>
              </button>
            </div>
          </div>

          {/* Alert if activities corrupted */}
          {isActivitiesCorrupted(activities) && (
            <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black text-red-950">
                    זוהתה תקלה: רשימת החוגים כוללת נתונים שגויים (ייתכן שנטען
                    קובץ תלמידים בטעות כחוגים)
                  </div>
                  <div className="text-xs text-red-700 mt-0.5">
                    לחצו על הכפתור כדי להחזיר מיד את רשימת חוגי יום שישי הרשמית
                    והתקנית של {currentSchool.name}.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await restoreOfficialActivities(currentSchoolId);
                  setRestoreSuccessMsg(
                    `רשימת חוגי יום שישי הרשמיים של ${currentSchool.name} הוחזרה ותוקנה בהצלחה!`,
                  );
                  setTimeout(() => setRestoreSuccessMsg(null), 4000);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>החזר עכשיו חוגים רשמיים</span>
              </button>
            </div>
          )}

          {/* Success Banner if restored */}
          {restoreSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{restoreSuccessMsg}</span>
              </span>
              <button
                onClick={() => setRestoreSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="חיפוש חוג, מדריך, מיקום..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <select
              value={activitySlotFilter}
              onChange={(e) => setActivitySlotFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              <option value="all">כל משבצות הזמן (1, 2, 3)</option>
              <option value="1">משבצת 1 (08:30–09:30)</option>
              <option value="2">משבצת 2 (10:30–11:30)</option>
              <option value="3">משבצת 3 (11:30–12:30)</option>
            </select>

            <select
              value={activityCategoryFilter}
              onChange={(e) => setActivityCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              <option value="all">כל הקטגוריות</option>
              <option value="technology">טכנולוגיה ו-AI</option>
              <option value="arts">אמנות ועיצוב</option>
              <option value="sciences">מדעים וחלל</option>
              <option value="culinary">בישול ואפייה</option>
              <option value="sports">ספורט והגנה עצמית</option>
              <option value="enrichment">העשרה ונגרות</option>
            </select>
          </div>

          {/* Activities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity) => {
              const enrolled = placements.filter(
                (p) =>
                  p.placedActivityId === activity.id && p.status === "placed",
              ).length;

              return (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image */}
                    {activity.imageUrl ? (
                      <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={activity.imageUrl}
                          alt={activity.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                          משבצת {activity.slotNumber || 1}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          משבצת {activity.slotNumber || 1}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {activity.id}
                        </span>
                      </div>
                    )}

                    <div className="p-4 space-y-2.5">
                      <h4 className="font-black text-slate-900 text-base leading-snug">
                        {activity.name}
                      </h4>

                      {/* Time & Location ONLY */}
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            מועד:{" "}
                            {activity.startTime?.includes("שעה")
                              ? activity.startTime
                              : activity.slotNumber === 1
                                ? "שעה ראשונה"
                                : activity.slotNumber === 2
                                  ? "שעה שניה"
                                  : "שעה שלישית"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            מיקום: <strong>{activity.location}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Description preview */}
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {activity.description || "טרם הוזן תיאור"}
                      </p>

                      {/* Instructor & Grades */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>
                          מדריך: <strong>{activity.instructor}</strong>
                        </span>
                        <span className="font-semibold text-indigo-700">
                          שכבות {activity.allowedGrades.join(",")}
                        </span>
                      </div>

                      {/* Quota Bar */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-bold">
                        <span>
                          משובצים:{" "}
                          <strong className="text-indigo-700">
                            {enrolled}
                          </strong>{" "}
                          / {activity.maxCapacity || 20}
                        </span>
                        <span className="text-slate-500">
                          מינימום: {activity.minCapacity || 8}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingActivity(activity);
                        setIsActivityModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>ערוך תיאור/תמונה</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`האם למחוק את החוג "${activity.name}"?`)) {
                          deleteActivity(activity.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ELIGIBLE STUDENTS */}
      {/* ======================================================== */}
      {activeTab === "students" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                רשימת תלמידים זכאים
              </h3>
              <p className="text-xs text-slate-500">
                תלמידים המורשים להירשם לחוגי שישי של מעגלים ({students.length}{" "}
                במערכת)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>הוספת תלמיד זכאי</span>
              </button>

              <button
                id="btn-export-students-excel"
                onClick={() =>
                  exportStudentsToExcel(students, currentSchool.name)
                }
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="הורדת קובץ אקסל של תלמידים זכאים לעריכה"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>ייצוא תלמידים לעריכה ב-Excel</span>
              </button>

              <button
                onClick={() => {
                  setImportModalTab("students");
                  setIsImportModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="קליטת קובץ תלמידים זכאים מאקסל"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>ייבוא / עדכון מ-Excel</span>
              </button>

              <button
                id="btn-clear-all-students-trigger"
                onClick={() => setIsClearStudentsModalOpen(true)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="מחיקת כל התלמידים הזכאים לקראת טעינה מחדש של קובץ נקי"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>מחיקת כל התלמידים</span>
              </button>
            </div>
          </div>

          {clearSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{clearSuccessMsg}</span>
              </span>
              <button
                onClick={() => setClearSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer px-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="חיפוש לפי שם, ת.ז או הורה..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <select
              value={studentGradeFilter}
              onChange={(e) => setStudentGradeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              <option value="all">כל השכבות והכיתות</option>
              <option value="א">שכבה א'</option>
              <option value="ב">שכבה ב'</option>
              <option value="ג">שכבה ג'</option>
              <option value="ד">שכבה ד'</option>
              <option value="ה">שכבה ה'</option>
              <option value="ו">שכבה ו'</option>
            </select>
          </div>

          {/* Students Table or Empty State */}
          {filteredStudents.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">
                {students.length === 0
                  ? "אין כרגע תלמידים זכאים במערכת"
                  : "לא נמצאו תלמידים התואמים לחיפוש"}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                {students.length === 0
                  ? "כל התלמידים נמחקו והמערכת מאופסת ונקייה. כעת תוכלו לטעון את קובץ האקסל העדכני בקלות."
                  : "נסו לשנות את מילות החיפוש או לבחור שכבת כיתה אחרת."}
              </p>
              {students.length === 0 && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>טעינת קובץ Excel עכשיו</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ת.ז / מזהה</th>
                    <th className="p-3">שם תלמיד</th>
                    <th className="p-3">כיתה</th>
                    <th className="p-3">סטטוס אישור</th>
                    <th className="p-3">פרטי הורה</th>
                    <th className="p-3">יישוב</th>
                    <th className="p-3 text-left">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {student.id}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="p-3">{student.grade}</td>
                      <td className="p-3">
                        {student.isAuthorized ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                            מאושר
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                            חסום / בהמתנה
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {student.parentName && <div>{student.parentName}</div>}
                        {student.parentPhone && (
                          <div className="font-mono text-[11px] text-slate-400">
                            {student.parentPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">
                        {student.settlement || "-"}
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                              setIsStudentModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `האם למחוק את התלמיד ${student.firstName} ${student.lastName}?`,
                                )
                              ) {
                                deleteStudent(student.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PARENT REGISTRATIONS (3 SLOTS) */}
      {/* ======================================================== */}
      {activeTab === "registrations" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                בחירות ודירוגי ההורים (3 משבצות שישי)
              </h3>
              <p className="text-xs text-slate-500">
                בחירות ראשיות וחלופיות שנקלטו מטפסי ההרשמה
              </p>
            </div>

            <button
              onClick={() =>
                exportToExcel(
                  registrations,
                  `רישומי_הורים_${currentSchool.name}`,
                  "Registrations",
                )
              }
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ייצוא רישומים</span>
            </button>
          </div>

          {/* Notice for discontinued or changed activities */}
          {discontinuedCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                    <span>זוהו {discontinuedCount} תלמידים שנרשמו לחוגים ששונו, הוסרו או הוזזו</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      דורש התייחסות
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    בעקבות טעינת קובץ חוגים חדש או שינוי שעות, חלק מבחירות התלמידים מפנות לחוגים שלא קיימים במערכת החדשה.
                    באפשרותכם לבצע <strong>התאמה אוטומטית</strong> לחוגים בעלי שם זהה, או ללחוץ על כפתור ה-<strong>✏️</strong> בשורת התלמיד לבחירת חוג חלופי.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleAutoRepairRegistrations}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="התאם אוטומטית לפי קודים ושמות חוגים זהים"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>התאם חוגים זהים אוטומטית</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDiscontinuedOnly(!filterDiscontinuedOnly)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                    filterDiscontinuedOnly
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  {filterDiscontinuedOnly ? "הצג את כל התלמידים" : `סנן רק תלמידים אלו (${discontinuedCount})`}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={registrationSearch}
                onChange={(e) => setRegistrationSearch(e.target.value)}
                placeholder="חיפוש לפי שם תלמיד, ת.ז או שם הורה..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            {discontinuedCount > 0 && (
              <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterDiscontinuedOnly(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    !filterDiscontinuedOnly
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  הכל ({registrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDiscontinuedOnly(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    filterDiscontinuedOnly
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>טעונים תיקון ({discontinuedCount})</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">זמן רישום</th>
                  <th className="p-3">תלמיד (כיתה)</th>
                  <th className="p-3">פרטי הורה</th>
                  <th className="p-3">משבצת 1 (08:30)</th>
                  <th className="p-3">משבצת 2 (10:30)</th>
                  <th className="p-3">משבצת 3 (11:30)</th>
                  <th className="p-3 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map((reg) => {
                  const res1 = resolveActivityDisplay(reg.slot1Choice, activities);
                  const res2 = resolveActivityDisplay(reg.slot2Choice, activities);
                  const res3 = resolveActivityDisplay(reg.slot3Choice, activities);

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/70">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(reg.timestamp).toLocaleDateString("he-IL")}{" "}
                        {new Date(reg.timestamp).toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {reg.studentName} ({reg.studentGrade})
                        <div className="font-mono text-slate-400 font-normal text-[11px]">
                          {reg.studentId}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{reg.parentName}</div>
                        <div className="font-mono text-slate-400">
                          {reg.parentPhone}
                        </div>
                      </td>
                      <td className="p-3 text-indigo-950 bg-indigo-50/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs sm:text-sm">{res1.name}</span>
                          {res1.isDiscontinued && (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 w-fit">
                              ⚠️ חוג הוסר / שונה
                            </span>
                          )}
                        </div>
                        {reg.slot1Backup && (
                          <div className="text-[10px] text-slate-500 font-normal mt-1">
                            חלופי: {resolveActivityDisplay(reg.slot1Backup, activities).name}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-blue-950 bg-blue-50/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs sm:text-sm">{res2.name}</span>
                          {res2.isDiscontinued && (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 w-fit">
                              ⚠️ חוג הוסר / שונה
                            </span>
                          )}
                        </div>
                        {reg.slot2Backup && (
                          <div className="text-[10px] text-slate-500 font-normal mt-1">
                            חלופי: {resolveActivityDisplay(reg.slot2Backup, activities).name}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-emerald-950 bg-emerald-50/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs sm:text-sm">{res3.name}</span>
                          {res3.isDiscontinued && (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 w-fit">
                              ⚠️ חוג הוסר / שונה
                            </span>
                          )}
                        </div>
                        {reg.slot3Backup && (
                          <div className="text-[10px] text-slate-500 font-normal mt-1">
                            חלופי: {resolveActivityDisplay(reg.slot3Backup, activities).name}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingRegistration(reg)}
                            title="עריכת חוגים ובחירה מחדש עבור תלמיד זה"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `האם למחוק את טופס ההרשמה של ${reg.studentName}?`,
                                )
                              ) {
                                deleteRegistration(reg.id);
                              }
                            }}
                            title="מחיקת רישום"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: PLACEMENTS MAP & MANUAL OVERRIDE */}
      {/* ======================================================== */}
      {activeTab === "placements" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                מפת שיבוצים סופית (3 משבצות שישי)
              </h3>
              <p className="text-xs text-slate-500">
                צפייה בשיבוצים של כל תלמיד ויכולת התערבות והעברה ידנית
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFullWorkbook}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ייצוא דוח מלא לאקסל</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={placementSearch}
                onChange={(e) => setPlacementSearch(e.target.value)}
                placeholder="חיפוש תלמיד בשיבוצים..."
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <select
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              <option value="all">כל הסטטוסים ({placements.length})</option>
              <option value="placed">שובצו בהצלחה ({placedCount})</option>
              <option value="waitlist">רשימת המתנה ({waitlistCount})</option>
              <option value="rejected">
                נדחו / אי-זכאות ({rejectedCount})
              </option>
            </select>
          </div>

          {/* Placement Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">ת.ז</th>
                  <th className="p-3">שם תלמיד</th>
                  <th className="p-3">משבצת</th>
                  <th className="p-3">חוג משובץ (שעה ומיקום)</th>
                  <th className="p-3">סטטוס</th>
                  <th className="p-3">עדיפות</th>
                  <th className="p-3">הערות שיבוץ</th>
                  <th className="p-3 text-left">התערבות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlacements.map((p) => {
                  const resolvedAct = resolveActivityDisplay(
                    p.placedActivityId,
                    activities,
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-600">
                        {p.studentId}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {p.studentName} ({p.grade})
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                          משבצת {p.slotNumber || 1}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-indigo-950">
                        {p.placedActivityId ? (
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{resolvedAct.name}</span>
                              {resolvedAct.isDiscontinued && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                  חוג הוסר / שונה
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {resolvedAct.matchedActivity?.startTime ||
                                (p.slotNumber === 1
                                  ? "שעה ראשונה"
                                  : p.slotNumber === 2
                                    ? "שעה שניה"
                                    : "שעה שלישית")}{" "}
                              {resolvedAct.matchedActivity?.location
                                ? `• ${resolvedAct.matchedActivity.location}`
                                : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">לא שובץ</span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.status === "placed" && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                            שובץ ✓
                          </span>
                        )}
                        {p.status === "waitlist" && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                            המתנה (מקום {p.waitlistPosition || 1})
                          </span>
                        )}
                        {p.status === "rejected" && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                            אי-זכאות
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.priorityAchieved ? (
                          <span className="font-bold text-slate-700">
                            עדיפות {p.priorityAchieved}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">
                        {p.placementNotes}
                        {p.isManualOverride && (
                          <span className="mr-1 text-[10px] text-amber-600 font-bold">
                            (שונה ידנית)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-left">
                        <button
                          onClick={() => {
                            setEditingPlacement(p);
                            setIsPlacementModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>שינוי ידני</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: ALERTS & EXCEPTIONS */}
      {/* ======================================================== */}
      {activeTab === "alerts" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>ממשק התראות ובקרה לחריגים</span>
            </h3>
            <p className="text-xs text-slate-500">
              התראות אוטומטיות על חוגים שלא הגיעו לרף המינימום, תלמידים לא
              משובצים ואי-זכאויות
            </p>
          </div>

          {/* Section 1: Activities Under Minimum Quota */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>
                  חוגים מתחת לרף המינימום לפתיחה ({underMinActivities.length})
                </span>
              </h4>
            </div>

            {underMinActivities.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>כל החוגים הפעילים הגיעו לרף המינימום הנדרש לפתיחה.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {underMinActivities.map((activity) => {
                  const enrolled = placements.filter(
                    (p) =>
                      p.placedActivityId === activity.id &&
                      p.status === "placed",
                  ).length;

                  return (
                    <div
                      key={activity.id}
                      className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 text-sm">
                          {activity.name}
                        </span>
                        <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md">
                          {enrolled} / {activity.minCapacity} מינימום
                        </span>
                      </div>
                      <p className="text-xs text-amber-800">
                        מדריך: {activity.instructor} • יום שישי (
                        {activity.startTime?.includes("שעה")
                          ? activity.startTime
                          : activity.slotNumber === 1
                            ? "שעה ראשונה"
                            : activity.slotNumber === 2
                              ? "שעה שניה"
                              : "שעה שלישית"}
                        )
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: APPS SCRIPT INTEGRATION */}
      {/* ======================================================== */}
      {activeTab === "sheets_integration" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <span>אינטגרציית Google Apps Script & Sheets</span>
              </h3>
              <p className="text-xs text-slate-500">
                קוד אוטומציה מוכן להטמעה ב-Google Sheets / AppSheet להרצת
                האלגוריתם בענן
              </p>
            </div>

            <button
              id="btn-copy-apps-script"
              onClick={handleCopyAppsScript}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isCodeCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{isCodeCopied ? "הקוד הועתק!" : "העתק קוד Code.gs"}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-5 rounded-2xl bg-slate-950 text-indigo-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed dir-ltr text-left">
              {getAppsScriptCode()}
            </pre>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: SETTINGS, TIME SLOTS & PASSWORD MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Section 1: FRIDAY TIME SLOTS CONFIG (Admin only) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>
                  הגדרת שעות 3 משבצות הזמן ליום שישי (לוח בקרה למנהל בלבד)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                עדכון שעות אלו יסנכרן אוטומטית את זמני כל החוגים המשויכים לאותה
                משבצת.
              </p>
            </div>

            <form
              onSubmit={handleSaveFridaySlots}
              className="space-y-4 max-w-2xl"
            >
              <div className="space-y-3">
                {fridaySlotsForm.map((slot, index) => (
                  <div
                    key={slot.id || index}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4"
                  >
                    <div className="w-full sm:w-36 font-bold text-slate-900 text-xs">
                      משבצת {slot.slotNumber} ({slot.label})
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          שעת התחלה
                        </label>
                        <input
                          type="time"
                          required
                          value={slot.startTime}
                          onChange={(e) => {
                            const updated = [...fridaySlotsForm];
                            updated[index].startTime = e.target.value;
                            setFridaySlotsForm(updated);
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          שעת סיום
                        </label>
                        <input
                          type="time"
                          required
                          value={slot.endTime}
                          onChange={(e) => {
                            const updated = [...fridaySlotsForm];
                            updated[index].endTime = e.target.value;
                            setFridaySlotsForm(updated);
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>שמור שעות משבצות ליום שישי</span>
                </button>

                {isSlotsSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>שעות המשבצות עודכנו וסונכרנו בהצלחה!</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Section 2: ADMIN PASSWORD CHANGE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>שינוי סיסמת כניסה לממשק הניהול</span>
              </h3>
              <p className="text-xs text-slate-500">
                הגדירו סיסמה חדשה להגנה על לוח הבקרה ושינוי ההגדרות
              </p>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  סיסמה חדשה *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="הזינו סיסמה חדשה..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  אימות סיסמה חדשה *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזינו שוב לאימות..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              {passwordChangeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>הסיסמה עודכנה בהצלחה!</span>
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>עדכן סיסמת מנהל</span>
              </button>
            </form>
          </div>

          {/* Section 2.5: Logo & Branding Customization */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>לוגו ותמונת מותג המערכת</span>
                </h3>
                <p className="text-xs text-slate-500">
                  באפשרותכם להעלות תמונת לוגו מקובץ מקומי, להדביק קישור ישיר, או
                  לחזור ללוגו המקורי של תוכנית מעגלים
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Upload & URL Controls */}
              <div className="lg:col-span-8 space-y-4">
                {/* File Upload Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    העלאת קובץ תמונת לוגו מהמחשב/נייד (PNG / JPG / SVG / WEBP)
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-3 ${isProcessingLogo ? "bg-indigo-100 opacity-70 cursor-wait" : "bg-indigo-50/70 hover:bg-indigo-100/70 cursor-pointer"} text-indigo-800 border-2 border-dashed border-indigo-200 rounded-2xl transition-all text-xs font-bold`}
                  >
                    <Upload
                      className={`w-4 h-4 text-indigo-600 ${isProcessingLogo ? "animate-bounce" : ""}`}
                    />
                    <span>
                      {isProcessingLogo
                        ? "מעבד ומבצע אופטימיזציה לתמונת הלוגו..."
                        : "לחצו כאן לבחירת תמונת לוגו מהמכשיר"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isProcessingLogo}
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Image URL Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    או הדבקת קישור אינטרנט ישיר לתמונה (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={logoInputUrl}
                      onChange={(e) => setLogoInputUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 dir-ltr text-right"
                    />
                  </div>
                </div>

                {/* Feedback Message */}
                {logoSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{logoSuccessMessage}</span>
                  </div>
                )}

                {/* Save & Reset Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveLogoUrl(false)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>שמור לוגו עבור {currentSchool.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveLogoUrl(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>החל לוגו זה על כל 3 בתי הספר</span>
                  </button>

                  {currentSchool.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <span>איפוס ללוגו מקורי</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="lg:col-span-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-bold text-slate-500">
                  תצוגה מקדימה בסרגל העליון ובטפסים:
                </span>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs w-full flex items-center justify-center min-h-[90px]">
                  <MaagalimLogo
                    customLogoUrl={logoInputUrl || currentSchool.logoUrl}
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  {logoInputUrl
                    ? "לוגו מותאם אישית"
                    : "לוגו ברירת מחדל של תוכנית מעגלים"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Coordinator Details & Reset */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-indigo-600" />
                  <span>פרטי רכז/ת בית הספר הפעיל ({currentSchool.name})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  פרטים אלו מוצגים להורים בעת פנייה לבירורים ולסיוע ברישום
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("coordinators")}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Users className="w-3.5 h-3.5" />
                <span>עריכת רכזי כל 3 בתי הספר</span>
              </button>
            </div>

            <form
              onSubmit={handleSaveCoordinator}
              className="space-y-4 max-w-3xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    שם רכז/ת *
                  </label>
                  <input
                    type="text"
                    required
                    value={coordForm.name || ""}
                    onChange={(e) =>
                      setCoordForm({ ...coordForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    מספר טלפון *
                  </label>
                  <input
                    type="tel"
                    required
                    value={coordForm.phone || ""}
                    onChange={(e) =>
                      setCoordForm({ ...coordForm, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    הגדרת תפקיד
                  </label>
                  <input
                    type="text"
                    value={coordForm.role || ""}
                    onChange={(e) =>
                      setCoordForm({ ...coordForm, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={coordForm.email || ""}
                    onChange={(e) =>
                      setCoordForm({ ...coordForm, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    וואטסאפ לפניות
                  </label>
                  <input
                    type="tel"
                    value={coordForm.whatsapp || ""}
                    onChange={(e) =>
                      setCoordForm({ ...coordForm, whatsapp: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    שעות מענה וקבלת קהל
                  </label>
                  <input
                    type="text"
                    value={coordForm.receptionHours || ""}
                    onChange={(e) =>
                      setCoordForm({
                        ...coordForm,
                        receptionHours: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>שמור פרטי רכז/ת ל{currentSchool.name}</span>
                </button>

                {isCoordSaved && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>הפרטים עודכנו בהצלחה!</span>
                  </span>
                )}
              </div>
            </form>

            {/* Reset Demo Data */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  איפוס נתוני הדגמה
                </div>
                <div className="text-[11px] text-slate-500">
                  שחזור מערכי הנתונים והשיבוצים המקוריים של מעגלים
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("האם לאפס את כל הנתונים לנתוני הדמו המקוריים?")) {
                    resetCurrentSchoolToDefaults();
                  }
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>אפס נתונים</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialTab={importModalTab}
      />

      <StudentEditModal
        isOpen={isStudentModalOpen}
        student={editingStudent}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={(student) => {
          if (editingStudent) {
            updateStudent(student.id, student);
          } else {
            addStudent(student);
          }
        }}
      />

      <ActivityEditModal
        isOpen={isActivityModalOpen}
        activity={editingActivity}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={(activity) => {
          if (editingActivity) {
            updateActivity(activity.id, activity);
          } else {
            addActivity(activity);
          }
        }}
      />

      <ManualPlacementModal
        isOpen={isPlacementModalOpen}
        placement={editingPlacement}
        onClose={() => {
          setIsPlacementModalOpen(false);
          setEditingPlacement(null);
        }}
        onSave={(studentId, slotNumber, activityId, status, notes) => {
          manualOverridePlacement(
            studentId,
            slotNumber,
            activityId,
            status,
            notes,
          );
        }}
      />

      {/* Clear Students Confirmation Modal */}
      {isClearStudentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  מחיקת תלמידים זכאים ואיפוס נתונים
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  פעולה זו תמחק את כל רשימת התלמידים הזכאים (וכל הרישומים
                  והשיבוצים המשויכים אליהם) כדי שתוכלו להזין אותם מחדש בצורה
                  נקייה ומסודרת לפי עמודה J.
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-white transition-colors">
                <input
                  type="radio"
                  name="clearOption"
                  checked={clearMode === "all"}
                  onChange={() => setClearMode("all")}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    מחק את כל התלמידים מכל 3 בתי הספר (מומלץ)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    איפוס מלא של כל בתי הספר לקראת טעינה מחדש של קובץ Excel
                    המרכזי
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-white transition-colors">
                <input
                  type="radio"
                  name="clearOption"
                  checked={clearMode === "current"}
                  onChange={() => setClearMode("current")}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    מחק תלמידים מ{currentSchool.name} בלבד
                  </div>
                  <div className="text-[11px] text-slate-500">
                    משאיר את בתי הספר האחרים ללא שינוי
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearStudentsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={() => {
                  clearAllStudents(clearMode === "all");
                  setIsClearStudentsModalOpen(false);
                  setClearSuccessMsg(
                    clearMode === "all"
                      ? "כל התלמידים מכל בתי הספר נמחקו בהצלחה! המערכת מאופסת ומוכנה לקליטת קובץ חדש."
                      : `כל התלמידים מ${currentSchool.name} נמחקו בהצלחה!`,
                  );
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>כן, מחק עכשיו לקראת טעינה חדשה</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Edit Modal */}
      {editingRegistration && (
        <RegistrationEditModal
          isOpen={!!editingRegistration}
          onClose={() => setEditingRegistration(null)}
          registration={editingRegistration}
          activities={activities}
          onSave={(updated) => {
            updateRegistration(updated);
            setCloudRefreshNotice(`השיבוץ של ${updated.studentName} עודכן בהצלחה!`);
            setTimeout(() => setCloudRefreshNotice(null), 4000);
          }}
        />
      )}
    </div>
  );
};
