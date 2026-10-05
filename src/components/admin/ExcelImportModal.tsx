import React, { useState, useMemo, useEffect } from "react";
import {
  useSchool,
  StudentImportMode,
  ImportStudentsOptions,
  ActivityImportMode,
  ImportActivitiesOptions,
} from "../../context/SchoolContext";
import {
  parseExcelFile,
  downloadStudentTemplate,
  downloadActivityTemplate,
  exportActivitiesToExcel,
  exportStudentsToExcel,
  exportFullSchoolWorkbook,
  CATEGORY_HEBREW_MAP,
} from "../../services/excelService";
import { Student, Activity, Registration } from "../../types";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Clock,
  Layers,
  Users,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowDownToLine,
  CheckCircle2,
  FileCheck,
  UserPlus,
  RefreshCcw,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "activities" | "students" | "registrations" | "full_workbook" | "all";
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  initialTab = "all",
}) => {
  const {
    currentSchoolId,
    currentSchool,
    schools,
    students,
    activities,
    registrations,
    placements,
    importStudents,
    importActivities,
    importRegistrations,
    importFullWorkbook,
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<"export" | "import">(
    "export",
  );
  const [importTarget, setImportTarget] = useState<
    "full_workbook" | "students" | "activities" | "registrations"
  >("full_workbook");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentImportMode, setStudentImportMode] =
    useState<StudentImportMode>("merge");
  const [activityImportMode, setActivityImportMode] =
    useState<ActivityImportMode>("sync_changes");
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<
    Record<string, boolean>
  >({});
  const [selectedDeleteActivityIds, setSelectedDeleteActivityIds] = useState<
    Record<string, boolean>
  >({});
  const [showMissingStudentsList, setShowMissingStudentsList] =
    useState<boolean>(false);
  const [showMissingActivitiesList, setShowMissingActivitiesList] =
    useState<boolean>(false);
  const [parsedStudents, setParsedStudents] = useState<Student[] | null>(null);
  const [parsedActivities, setParsedActivities] = useState<Activity[] | null>(
    null,
  );
  const [parsedRegistrations, setParsedRegistrations] = useState<
    Registration[] | null
  >(null);
  const [studentSchoolFilter, setStudentSchoolFilter] = useState<string>("all");
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab and reset state whenever opened
  useEffect(() => {
    if (isOpen) {
      setActiveSubTab("import");
      setImportTarget(
        initialTab === "activities"
          ? "activities"
          : initialTab === "registrations"
            ? "registrations"
            : initialTab === "students"
              ? "students"
              : "full_workbook",
      );
      setFile(null);
      setParsedStudents(null);
      setParsedActivities(null);
      setParsedRegistrations(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsProcessing(false);
      setStudentSchoolFilter("all");
      setStudentGradeFilter("all");
      setSelectedDeleteIds({});
      setSelectedDeleteActivityIds({});
      setActivityImportMode("sync_changes");
      setStudentImportMode("merge");
      setShowMissingStudentsList(false);
      setShowMissingActivitiesList(false);
    }
  }, [isOpen, initialTab]);

  const processFile = async (
    selectedFile: File,
    target: "full_workbook" | "students" | "activities" | "registrations",
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedStudents(null);
    setParsedActivities(null);
    setParsedRegistrations(null);
    setStudentSchoolFilter("all");
    setStudentGradeFilter("all");
    setSelectedDeleteIds({});
    setSelectedDeleteActivityIds({});

    const result = await parseExcelFile(
      selectedFile,
      currentSchoolId,
      target === "full_workbook" ? "auto" : target,
      activities,
    );
    setIsProcessing(false);

    if (
      result.error &&
      !result.activities &&
      !result.students &&
      !result.registrations
    ) {
      setErrorMessage(result.error);
    } else if (result.detectedType === "full_workbook") {
      setImportTarget("full_workbook");
      if (result.students) setParsedStudents(result.students);
      if (result.activities) setParsedActivities(result.activities);
      if (result.registrations) setParsedRegistrations(result.registrations);
      setSuccessMessage(
        `קובץ Excel מלא (Master) זוהה בהצלחה! נמצאו ${result.students?.length || 0} תלמידים זכאים, ${result.activities?.length || 0} חוגים ו-${result.registrations?.length || 0} נרשמים עם בחירות שיבוץ.`,
      );
    } else if (
      result.detectedType === "registrations" &&
      result.registrations &&
      result.registrations.length > 0
    ) {
      setImportTarget("registrations");
      setParsedRegistrations(result.registrations);
      setSuccessMessage(
        `זוהו ${result.registrations.length} נרשמים עם בחירות חוגים!`,
      );
    } else if (
      result.detectedType === "activities" &&
      result.activities &&
      result.activities.length > 0
    ) {
      if (target === "students") {
        setErrorMessage(
          result.error ||
            "לא זוהו תלמידים זכאים בקובץ שהועלה (הקובץ זוהה כקובץ חוגים). אם ברצונכם לייבא חוגים, אנא עברו ללשונית 'חוגי שישי'.",
        );
      } else {
        setImportTarget("activities");
        setParsedActivities(result.activities);
      }
    } else if (
      result.detectedType === "students" &&
      result.students &&
      result.students.length > 0
    ) {
      setImportTarget("students");
      setParsedStudents(result.students);
      if (target === "activities") {
        setSuccessMessage(
          "הקובץ זוהה אוטומטית כקובץ תלמידים זכאים! המערכת עברה למצב קליטת תלמידים.",
        );
      }
    } else if (result.students && result.students.length > 0) {
      setImportTarget("students");
      setParsedStudents(result.students);
    } else if (result.registrations && result.registrations.length > 0) {
      setImportTarget("registrations");
      setParsedRegistrations(result.registrations);
    } else if (result.activities && result.activities.length > 0) {
      setImportTarget("activities");
      setParsedActivities(result.activities);
    } else if (result.error) {
      setErrorMessage(result.error);
    } else {
      setErrorMessage(
        "לא נמצאו נתונים תקינים לפענוח בקובץ. אנא ודאו שהקובץ תואם לתבנית.",
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    await processFile(selected, importTarget);
  };

  // Compute school breakdown for parsed students
  const studentsBySchoolMap = parsedStudents
    ? parsedStudents.reduce(
        (acc, s) => {
          const sId = s.schoolId || currentSchoolId;
          acc[sId] = (acc[sId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  const detectedSchoolCount = Object.keys(studentsBySchoolMap).length;

  // Compute diff analysis between parsed students and existing students in target schools
  const diffAnalysis = useMemo(() => {
    if (!parsedStudents || parsedStudents.length === 0) return null;

    // Identify which schools are touched by this import
    const touchedSchoolKeys = new Set<string>();
    parsedStudents.forEach((s) => {
      const sId = s.schoolId || currentSchoolId;
      touchedSchoolKeys.add(sId);
    });

    // Gather existing students from touched schools
    const relevantExistingStudents: Student[] = [];
    touchedSchoolKeys.forEach((sId) => {
      const sData = schools[sId];
      if (sData && Array.isArray(sData.students)) {
        relevantExistingStudents.push(...sData.students);
      }
    });

    // Cleaned IDs for comparison
    const cleanId = (id: string) => id.replace(/[^\d]/g, "") || id.trim();
    const importedIdCleanMap = new Map<string, Student>();
    parsedStudents.forEach((s) => {
      importedIdCleanMap.set(cleanId(s.id), s);
    });

    const existingIdCleanMap = new Map<string, Student>();
    relevantExistingStudents.forEach((s) => {
      existingIdCleanMap.set(cleanId(s.id), s);
    });

    const newStudents = parsedStudents.filter(
      (s) => !existingIdCleanMap.has(cleanId(s.id)),
    );
    const updatedStudents = parsedStudents.filter((s) =>
      existingIdCleanMap.has(cleanId(s.id)),
    );
    const missingStudents = relevantExistingStudents.filter(
      (s) => !importedIdCleanMap.has(cleanId(s.id)),
    );

    return {
      newStudents,
      updatedStudents,
      missingStudents,
      newCount: newStudents.length,
      updateCount: updatedStudents.length,
      missingCount: missingStudents.length,
      totalExisting: relevantExistingStudents.length,
    };
  }, [parsedStudents, schools, currentSchoolId]);

  // Compute diff analysis between parsed activities and existing activities in current school
  const activityDiffAnalysis = useMemo(() => {
    if (!parsedActivities || parsedActivities.length === 0) return null;

    const normalize = (s: string) =>
      s.trim().toLowerCase().replace(/[\s_'"״\.\-]/g, "");

    const existingActivities = activities || [];
    const matchedExistingIds = new Set<string>();

    const newActivities: Activity[] = [];
    const updatedActivities: {
      activity: Activity;
      existing: Activity;
      changes: string[];
    }[] = [];

    parsedActivities.forEach((imp) => {
      // 1. Try exact ID match
      let existing = existingActivities.find(
        (a) => a.id.toLowerCase() === imp.id.toLowerCase(),
      );

      // 2. Try Name + Slot match
      if (!existing) {
        existing = existingActivities.find(
          (a) =>
            !matchedExistingIds.has(a.id) &&
            normalize(a.name) === normalize(imp.name) &&
            a.slotNumber === imp.slotNumber,
        );
      }

      // 3. Try Name match
      if (!existing) {
        existing = existingActivities.find(
          (a) =>
            !matchedExistingIds.has(a.id) &&
            normalize(a.name) === normalize(imp.name),
        );
      }

      if (existing) {
        matchedExistingIds.add(existing.id);
        const changes: string[] = [];
        if (existing.name !== imp.name) {
          changes.push(`שם: ${imp.name}`);
        }
        if (existing.instructor !== imp.instructor) {
          changes.push(`מורה/מדריך: ${imp.instructor}`);
        }
        if (existing.slotNumber !== imp.slotNumber) {
          changes.push(
            `מועד: ${imp.slotNumber === 1 ? "שעה ראשונה" : imp.slotNumber === 2 ? "שעה שניה" : "שעה שלישית"}`,
          );
        }
        if (existing.maxCapacity !== imp.maxCapacity) {
          changes.push(`מכסה: ${imp.maxCapacity}`);
        }
        if (existing.location !== imp.location) {
          changes.push(`מיקום: ${imp.location}`);
        }

        updatedActivities.push({
          activity: imp,
          existing,
          changes,
        });
      } else {
        newActivities.push(imp);
      }
    });

    const missingActivities = existingActivities.filter(
      (a) => !matchedExistingIds.has(a.id),
    );

    return {
      newActivities,
      updatedActivities,
      missingActivities,
      newCount: newActivities.length,
      updateCount: updatedActivities.length,
      missingCount: missingActivities.length,
      totalExisting: existingActivities.length,
    };
  }, [parsedActivities, activities]);

  // When missing students are calculated, default-check them for deletion in sync_changes mode
  useEffect(() => {
    if (diffAnalysis && diffAnalysis.missingStudents.length > 0) {
      const initialMap: Record<string, boolean> = {};
      diffAnalysis.missingStudents.forEach((s) => {
        initialMap[s.id] = true;
      });
      setSelectedDeleteIds(initialMap);
    }
  }, [diffAnalysis]);

  // When missing activities are calculated, default-check them for deletion in sync_changes mode
  useEffect(() => {
    if (
      activityDiffAnalysis &&
      activityDiffAnalysis.missingActivities.length > 0
    ) {
      const initialMap: Record<string, boolean> = {};
      activityDiffAnalysis.missingActivities.forEach((a) => {
        initialMap[a.id] = true;
      });
      setSelectedDeleteActivityIds(initialMap);
    }
  }, [activityDiffAnalysis]);

  const handleToggleDeleteStudent = (studentId: string) => {
    setSelectedDeleteIds((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSelectAllDeletes = (select: boolean) => {
    if (!diffAnalysis) return;
    const newMap: Record<string, boolean> = {};
    diffAnalysis.missingStudents.forEach((s) => {
      newMap[s.id] = select;
    });
    setSelectedDeleteIds(newMap);
  };

  const handleToggleDeleteActivity = (activityId: string) => {
    setSelectedDeleteActivityIds((prev) => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
  };

  const handleSelectAllDeleteActivities = (select: boolean) => {
    if (!activityDiffAnalysis) return;
    const newMap: Record<string, boolean> = {};
    activityDiffAnalysis.missingActivities.forEach((a) => {
      newMap[a.id] = select;
    });
    setSelectedDeleteActivityIds(newMap);
  };

  const handleApplyImport = () => {
    if (importTarget === "full_workbook") {
      const res = importFullWorkbook({
        students: parsedStudents || undefined,
        activities: parsedActivities || undefined,
        registrations: parsedRegistrations || undefined,
        targetSchoolId: currentSchoolId,
      });

      setSuccessMessage(
        `שחזור מלא הושלם בהצלחה! נקלטו ${res.studentsCount} תלמידים זכאים, ${res.actsCount} חוגים, ו-${res.regsCount} נרשמים עם שיבוצים חדשים. כל הנתונים סונכרנו למכשיר ולענן.`,
      );

      setTimeout(() => {
        onClose();
      }, 2200);
      return;
    }

    if (parsedRegistrations && parsedRegistrations.length > 0) {
      const res = importRegistrations(parsedRegistrations, currentSchoolId);
      setSuccessMessage(
        `נקלטו ושוחזרו בהצלחה ${res.count} נרשמים עם שיבוצים חדשים לבית הספר! הנתונים נשמרו בענן ובמכשיר.`,
      );
      setTimeout(() => {
        onClose();
      }, 1800);
      return;
    }

    if (parsedStudents && parsedStudents.length > 0) {
      const targetSchool =
        studentSchoolFilter !== "all" ? studentSchoolFilter : currentSchoolId;

      let options: ImportStudentsOptions = {
        targetSchoolId: targetSchool,
      };

      if (studentImportMode === "sync_changes") {
        const deleteIdsBySchool: Record<string, string[]> = {};
        diffAnalysis?.missingStudents.forEach((s) => {
          if (selectedDeleteIds[s.id]) {
            const sId = s.schoolId || targetSchool;
            if (!deleteIdsBySchool[sId]) deleteIdsBySchool[sId] = [];
            deleteIdsBySchool[sId].push(s.id);
          }
        });
        options.deleteStudentIdsBySchool = deleteIdsBySchool;
      }

      // If a specific school filter was selected, re-assign students strictly to that school
      let studentsToImport = parsedStudents;
      if (studentSchoolFilter !== "all") {
        studentsToImport = parsedStudents.map((s) => ({
          ...s,
          schoolId: targetSchool,
          schoolName: schools[targetSchool]?.school.name || s.schoolName,
        }));
      } else if (detectedSchoolCount <= 1) {
        studentsToImport = parsedStudents.map((s) => ({
          ...s,
          schoolId: s.schoolId || targetSchool,
          schoolName: schools[s.schoolId || targetSchool]?.school.name || s.schoolName,
        }));
      }

      importStudents(studentsToImport, studentImportMode, options);

      const deletedCount =
        Object.values(selectedDeleteIds).filter(Boolean).length;

      if (studentImportMode === "replace") {
        const sName = schools[targetSchool]?.school.name || currentSchool.name;
        setSuccessMessage(
          `החלפה מלאה הושלמה בהצלחה! כל רשימת התלמידים הקודמת ב${sName} אופסה, והרשימה הוחלפה במלואה ל-${studentsToImport.length} תלמידים מקובץ האקסל.`,
        );
      } else if (studentImportMode === "sync_changes") {
        setSuccessMessage(
          `סנכרון שינויים הושלם בהצלחה! ${diffAnalysis?.updateCount || 0} תלמידים עודכנו, ${diffAnalysis?.newCount || 0} נוספו, ו-${deletedCount} הוסרו.`,
        );
      } else if (studentImportMode === "add_only") {
        setSuccessMessage(
          `נקלטו בהצלחה ${diffAnalysis?.newCount || 0} תלמידים חדשים (תלמידים קיימים נשמרו ללא שינוי).`,
        );
      } else if (detectedSchoolCount > 1 && studentSchoolFilter === "all") {
        const parts = Object.entries(studentsBySchoolMap).map(
          ([sId, count]) => {
            const sName =
              schools[sId]?.school.name ||
              (sId.includes("navon")
                ? "יצחק נבון"
                : sId.includes("lapid")
                  ? 'לפיד המ"ה'
                  : "בן שמן");
            return `${count} שוייכו ל${sName}`;
          },
        );
        setSuccessMessage(
          `נקלטו ומוינו בהצלחה ${parsedStudents.length} תלמידים לפי עמודה J (בית הספר של העתיד): ${parts.join(", ")}!`,
        );
      } else {
        const sName =
          schools[targetSchool]?.school.name || currentSchool.name;
        setSuccessMessage(
          `נקלטו בהצלחה ${studentsToImport.length} תלמידים זכאים עבור ${sName}!`,
        );
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } else if (parsedActivities && parsedActivities.length > 0) {
      const deleteIds =
        activityImportMode === "sync_changes"
          ? Object.entries(selectedDeleteActivityIds)
              .filter(([_, checked]) => checked)
              .map(([id]) => id)
          : undefined;

      importActivities(parsedActivities, activityImportMode, {
        deleteActivityIds: deleteIds,
      });

      const deletedCount = deleteIds ? deleteIds.length : 0;

      if (activityImportMode === "sync_changes") {
        setSuccessMessage(
          `סנכרון חוגים הושלם בהצלחה! ${activityDiffAnalysis?.updateCount || 0} חוגים עודכנו (שמות מורים, שעות וכו'), ${activityDiffAnalysis?.newCount || 0} נוספו, ו-${deletedCount} הוסרו.`,
        );
      } else if (activityImportMode === "replace") {
        setSuccessMessage(
          `הוחלפו בהצלחה כל חוגי בית הספר (${parsedActivities.length} חוגים)!`,
        );
      } else {
        setSuccessMessage(
          `עודכנו ונקלטו בהצלחה ${parsedActivities.length} חוגי שישי עבור ${currentSchool.name}!`,
        );
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  // Stats for activities preview
  const activitiesBySlot = parsedActivities
    ? {
        slot1: parsedActivities.filter((a) => a.slotNumber === 1).length,
        slot2: parsedActivities.filter((a) => a.slotNumber === 2).length,
        slot3: parsedActivities.filter((a) => a.slotNumber === 3).length,
      }
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-l from-indigo-700 via-indigo-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">
                  ייצוא, עריכה וייבוא נתונים ב-Excel
                </h3>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {currentSchool.name}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                הורדת נתוני החוגים והתלמידים לעריכה נוחה ב-Excel, והעלאה חוזרת
                לעדכון אוטומטי של המערכת
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs (Export vs Import) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("export")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeSubTab === "export"
                ? "bg-white text-indigo-700 border-slate-200 -mb-px shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>1. ייצוא נתונים לעריכה (הורדת Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("import")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeSubTab === "import"
                ? "bg-white text-indigo-700 border-slate-200 -mb-px shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>2. העלאה ועדכון במערכת (ייבוא Excel)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto grow">
          {/* ======================================================== */}
          {/* SUB-TAB 1: EXPORT FOR EDITING */}
          {/* ======================================================== */}
          {activeSubTab === "export" && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="font-black text-sm flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>איך זה עובד?</span>
                </div>
                <p className="leading-relaxed">
                  הורידו את קובץ החוגים או התלמידים למחשב שלכם, פתחו אותו ב-
                  <strong>Microsoft Excel</strong> או ב-
                  <strong>Google Sheets</strong>, ערכו את כל הנתונים שתרצו (שם
                  החוג, תיאור מלא, שעות, משבצת שישי, התאמת שכבות כיתה, מכסות,
                  מפעילים ומיקומים), ולאחר מכן העלו את הקובץ המעודכן בכרטיסייה{" "}
                  <strong>&quot;2. העלאה ועדכון במערכת&quot;</strong>.
                </p>
              </div>

              {/* Main Export Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Activities Export Card */}
                <div className="border border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                        {activities.length} חוגים קיימים
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        קובץ חוגי יום שישי המלא
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        כולל: מזהה, שם החוג, תיאור מפורט, שעות התחלה וסיום,
                        משבצת (1, 2, 3), התאמה לשכבות (א-ג, ד-ו), מכסות מקסימום
                        ומינימום, מפעילים, מיקומים וקישורי תמונות.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        exportActivitiesToExcel(activities, currentSchool.name)
                      }
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>הורד את כל החוגים לעריכה ב-Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadActivityTemplate}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-700 text-[11px] font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-slate-400" />
                      <span>הורדת תבנית ריקה לדוגמה (חוגים)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Students Export Card */}
                <div className="border border-slate-200 bg-gradient-to-b from-slate-50/40 to-white rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        {students.length} תלמידים זכאים
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        קובץ תלמידים זכאים
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        כולל: תעודות זהות לאימות זכאות, שמות, כיתות, שכבות, פרטי
                        הורים (טלפון, דוא&quot;ל), יישוב מגורים והערות מיוחדות.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        exportStudentsToExcel(students, currentSchool.name)
                      }
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>הורד תלמידים זכאים לעריכה ב-Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadStudentTemplate}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-700 text-[11px] font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-slate-400" />
                      <span>הורדת תבנית ריקה לדוגמה (תלמידים)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Full School Master Workbook Export */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>
                      ייצוא קובץ Master רב-גיליונות (דוח בית ספרי מלא)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    מייצא קובץ Excel יחיד עם 4 גיליונות: תלמידים זכאים, חוגי
                    שישי, רישומי הורים ושיבוצים.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    exportFullSchoolWorkbook(
                      currentSchool,
                      students,
                      activities,
                      registrations,
                      placements,
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ייצוא דוח מלא (4 גיליונות)</span>
                </button>
              </div>

              {/* Prompt to move to import tab */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("import")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>
                    סיימתם לערוך את הקובץ ב-Excel? לחצו כאן כדי להעלות אותו
                    בחזרה למערכת ←
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-TAB 2: IMPORT & UPDATE */}
          {/* ======================================================== */}
          {activeSubTab === "import" && (
            <div className="space-y-5">
              {/* Target Type Selector */}
              <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>איזה קובץ ברצונך לקלוט למערכת?</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget("full_workbook");
                      if (file) processFile(file, "full_workbook");
                    }}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      importTarget === "full_workbook"
                        ? "bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-500/30"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>שחזור / קובץ מלא (הכל)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget("students");
                      if (file) processFile(file, "students");
                    }}
                    className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      importTarget === "students"
                        ? "bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-500/30"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>תלמידים זכאים</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget("activities");
                      if (file) processFile(file, "activities");
                    }}
                    className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      importTarget === "activities"
                        ? "bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-500/30"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>חוגי יום שישי</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget("registrations");
                      if (file) processFile(file, "registrations");
                    }}
                    className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      importTarget === "registrations"
                        ? "bg-amber-600 text-white shadow-amber-200 ring-2 ring-amber-500/30"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-amber-300" />
                    <span>נרשמים ורישומים</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 rounded-3xl p-8 text-center cursor-pointer transition-all bg-indigo-50/20 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2.5 block">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {file
                      ? file.name
                      : "גררו לכאן את קובץ ה-Excel (.xlsx) או לחצו לבחירת קובץ"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    המערכת מזהה אוטומטית קבצי שחזור מלא (Master עם נרשמים, זכאים וחוגים), קבצי חוגים, תלמידים זכאים ונרשמים
                  </span>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Import Mode Selector & Change Controls */}
              {parsedStudents && parsedStudents.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>בחר אופן עדכון וסנכרון רשימת התלמידים:</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        שליטה מלאה בשינויים
                      </span>
                    </div>

                    {/* 4 Granular Mode Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option 1: Merge (Recommended) */}
                      <button
                        type="button"
                        onClick={() => setStudentImportMode("merge")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          studentImportMode === "merge"
                            ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            studentImportMode === "merge"
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {studentImportMode === "merge" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block">
                            מיזוג חכם ועדכון (מומלץ)
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מוסיף תלמידים חדשים ומעדכן קיימים. אף תלמיד לא נמחק
                            מהמערכת.
                          </span>
                        </div>
                      </button>

                      {/* Option 2: Sync Changes (Add + Update + Delete Missing) */}
                      <button
                        type="button"
                        onClick={() => setStudentImportMode("sync_changes")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          studentImportMode === "sync_changes"
                            ? "bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            studentImportMode === "sync_changes"
                              ? "border-amber-600 bg-amber-600"
                              : "border-slate-300"
                          }`}
                        >
                          {studentImportMode === "sync_changes" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                            <span>סנכרון שינויים מלא</span>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              הוספה, עדכון ומחיקה
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מעדכן ומוסיף שינויים, ומאפשר למחוק רק את התלמידים
                            שהוסרו מהקובץ.
                          </span>
                        </div>
                      </button>

                      {/* Option 3: Add Only */}
                      <button
                        type="button"
                        onClick={() => setStudentImportMode("add_only")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          studentImportMode === "add_only"
                            ? "bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            studentImportMode === "add_only"
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-slate-300"
                          }`}
                        >
                          {studentImportMode === "add_only" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block">
                            הוספת חדשים בלבד
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            קולט רק תלמידים חדשים שטרם קיימים במערכת, ללא שינוי
                            לקיימים.
                          </span>
                        </div>
                      </button>

                      {/* Option 4: Full Replace */}
                      <button
                        type="button"
                        onClick={() => setStudentImportMode("replace")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          studentImportMode === "replace"
                            ? "bg-red-50/70 border-red-600 ring-2 ring-red-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            studentImportMode === "replace"
                              ? "border-red-600 bg-red-600"
                              : "border-slate-300"
                          }`}
                        >
                          {studentImportMode === "replace" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block text-red-950">
                            החלפה כוללת (איפוס והחלפה)
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מאפס את כל רשימת התלמידים הקודמת ומשאיר אך ורק את
                            תוכן הקובץ.
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Diff Analysis Badges */}
                    {diffAnalysis && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px] font-bold">
                          ניתוח שינויים בקובץ:
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{diffAnalysis.newCount} תלמידים חדשים</span>
                        </span>
                        <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>
                            {diffAnalysis.updateCount} תלמידים קיימים (עדכון
                            פרטים)
                          </span>
                        </span>
                        {diffAnalysis.missingCount > 0 && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {diffAnalysis.missingCount} קיימים שאינם בקובץ
                              החדש
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selective Deletion Drawer for 'sync_changes' mode */}
                  {studentImportMode === "sync_changes" &&
                    diffAnalysis &&
                    diffAnalysis.missingCount > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <div>
                              <span className="text-xs font-black text-amber-950 block">
                                תלמידים שקיימים כרגע במערכת אך הוסרו מהקובץ החדש
                                ({diffAnalysis.missingCount})
                              </span>
                              <span className="text-[11px] text-amber-800">
                                סמנו אילו תלמידים תרצו למחוק. מחיקת תלמיד תפנה
                                את המקום בחוג לתלמידים הבאים!
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAllDeletes(true)}
                              className="text-[11px] bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              סמן הכל למחיקה
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAllDeletes(false)}
                              className="text-[11px] bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              בטל הכל (אל תמחק)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setShowMissingStudentsList(
                                  !showMissingStudentsList,
                                )
                              }
                              className="text-[11px] bg-amber-200/70 hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              {showMissingStudentsList
                                ? "הסתר רשימה"
                                : "הצג רשימה מפורטת"}
                            </button>
                          </div>
                        </div>

                        {/* Missing Students Checklist */}
                        {showMissingStudentsList && (
                          <div className="max-h-48 overflow-y-auto bg-white rounded-xl border border-amber-200 p-2 space-y-1.5 text-xs">
                            {diffAnalysis.missingStudents.map((student) => {
                              const isChecked = !!selectedDeleteIds[student.id];
                              return (
                                <label
                                  key={student.id}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-red-50/70 border-red-200 text-red-950 font-bold"
                                      : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        handleToggleDeleteStudent(student.id)
                                      }
                                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                                    />
                                    <span>
                                      {student.firstName} {student.lastName}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      ({student.id})
                                    </span>
                                    <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                      כיתה {student.grade}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold">
                                    {isChecked
                                      ? "יימחק ויפנה מקום בחוג"
                                      : "יישמר במערכת"}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : parsedActivities && parsedActivities.length > 0 ? (
                /* Activities Import Mode Selector & Change Controls */
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>בחר אופן עדכון וסנכרון חוגי בית הספר:</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        שליטה מלאה בעדכון חוגים
                      </span>
                    </div>

                    {/* 3 Activity Mode Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Option 1: Merge & Update (Recommended) */}
                      <button
                        type="button"
                        onClick={() => setActivityImportMode("merge")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          activityImportMode === "merge"
                            ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            activityImportMode === "merge"
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {activityImportMode === "merge" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block">
                            מיזוג ועדכון בלבד
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מעדכן חוגים קיימים (שמות מורים, שעות) ומוסיף חדשים. אף חוג קיים לא נמחק.
                          </span>
                        </div>
                      </button>

                      {/* Option 2: Full Sync (Add + Update + Delete Missing) */}
                      <button
                        type="button"
                        onClick={() => setActivityImportMode("sync_changes")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          activityImportMode === "sync_changes"
                            ? "bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            activityImportMode === "sync_changes"
                              ? "border-amber-600 bg-amber-600"
                              : "border-slate-300"
                          }`}
                        >
                          {activityImportMode === "sync_changes" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                            <span>סנכרון שינויים מלא</span>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              מומלץ
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מעדכן מורים ושעות, מוסיף חוגים חדשים, ומסיר חוגים שהורדו מהקובץ.
                          </span>
                        </div>
                      </button>

                      {/* Option 3: Full Replace */}
                      <button
                        type="button"
                        onClick={() => setActivityImportMode("replace")}
                        className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                          activityImportMode === "replace"
                            ? "bg-red-50/70 border-red-600 ring-2 ring-red-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            activityImportMode === "replace"
                              ? "border-red-600 bg-red-600"
                              : "border-slate-300"
                          }`}
                        >
                          {activityImportMode === "replace" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-900 block text-red-950">
                            החלפה כוללת
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            מאפס את כל רשימת החוגים של בית הספר ומחליף אותה אך ורק בתוכן הקובץ.
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Diff Analysis Badges for Activities */}
                    {activityDiffAnalysis && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px] font-bold">
                          ניתוח שינויים בחוגים:
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{activityDiffAnalysis.newCount} חוגים חדשים להוספה</span>
                        </span>
                        <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>
                            {activityDiffAnalysis.updateCount} חוגים קיימים יעודכנו (שמות מורים, שעות)
                          </span>
                        </span>
                        {activityDiffAnalysis.missingCount > 0 && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {activityDiffAnalysis.missingCount} חוגים קיימים שהוסרו מהקובץ
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selective Deletion Drawer for Activities in 'sync_changes' mode */}
                  {activityImportMode === "sync_changes" &&
                    activityDiffAnalysis &&
                    activityDiffAnalysis.missingCount > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <div>
                              <span className="text-xs font-black text-amber-950 block">
                                חוגים שקיימים כרגע בבית הספר אך הוסרו מקובץ ה-Excel המעודכן ({activityDiffAnalysis.missingCount})
                              </span>
                              <span className="text-[11px] text-amber-800">
                                סמנו אילו חוגים תרצו למחוק מהמערכת:
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAllDeleteActivities(true)}
                              className="text-[11px] bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              סמן הכל להסרה
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAllDeleteActivities(false)}
                              className="text-[11px] bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              בטל הכל (השאר פעילים)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setShowMissingActivitiesList(!showMissingActivitiesList)
                              }
                              className="text-[11px] bg-amber-200/70 hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              {showMissingActivitiesList
                                ? "הסתר רשימה"
                                : "הצג רשימה מפורטת"}
                            </button>
                          </div>
                        </div>

                        {/* Missing Activities Checklist */}
                        {showMissingActivitiesList && (
                          <div className="max-h-48 overflow-y-auto bg-white rounded-xl border border-amber-200 p-2 space-y-1.5 text-xs">
                            {activityDiffAnalysis.missingActivities.map((act) => {
                              const isChecked = !!selectedDeleteActivityIds[act.id];
                              return (
                                <label
                                  key={act.id}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-red-50/70 border-red-200 text-red-950 font-bold"
                                      : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        handleToggleDeleteActivity(act.id)
                                      }
                                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                                    />
                                    <span>{act.name}</span>
                                    <span className="text-[11px] text-slate-600 font-bold">
                                      ({act.startTime || (act.slotNumber === 1 ? "שעה ראשונה" : act.slotNumber === 2 ? "שעה שניה" : "שעה שלישית")})
                                    </span>
                                    <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                      מורה/מדריך: {act.instructor}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold">
                                    {isChecked ? "יימחק מהמערכת" : "יישמר ללא שינוי"}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : null}

              {/* Feedback Messages */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5 font-bold animate-fadeIn">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* MASTER FULL WORKBOOK SUMMARY */}
              {parsedStudents && (parsedRegistrations || parsedActivities) && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-black text-slate-900">
                        קובץ שחזור מלא מוכן לקליטה וסנכרון ענן עבור {currentSchool.name}
                      </span>
                    </div>
                    <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded-full shadow-xs">
                      שחזור משולב מלא
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white/90 p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                      <span className="text-xs text-slate-500 font-bold block">תלמידים זכאים</span>
                      <span className="text-2xl font-black text-blue-700">{parsedStudents.length}</span>
                    </div>
                    <div className="bg-white/90 p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                      <span className="text-xs text-slate-500 font-bold block">חוגי יום שישי</span>
                      <span className="text-2xl font-black text-indigo-700">{parsedActivities?.length || 0}</span>
                    </div>
                    <div className="bg-white/90 p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                      <span className="text-xs text-slate-500 font-bold block">נרשמים ובחירות הורים</span>
                      <span className="text-2xl font-black text-emerald-700">{parsedRegistrations?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PREVIEW: REGISTRATIONS */}
              {parsedRegistrations && parsedRegistrations.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-amber-700" />
                      <span className="text-sm font-black text-amber-950">
                        זוהו {parsedRegistrations.length} נרשמים עם בחירות הורים מוכנים לקליטה ושיבוץ!
                      </span>
                    </div>
                    <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                      משבצות 1, 2 ו-3
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto bg-white rounded-xl border border-amber-200 text-xs shadow-inner">
                    <table className="w-full text-right divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">ת.ז. תלמיד</th>
                          <th className="p-2">שם תלמיד</th>
                          <th className="p-2">כיתה</th>
                          <th className="p-2">שם הורה</th>
                          <th className="p-2">טלפון הורה</th>
                          <th className="p-2">משבצת 1 (עיקרי / חלופי)</th>
                          <th className="p-2">משבצת 2 (עיקרי / חלופי)</th>
                          <th className="p-2">משבצת 3 (עיקרי / חלופי)</th>
                          <th className="p-2">הערות הורה</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedRegistrations.map((r, idx) => {
                          const allActs = [...(parsedActivities || []), ...activities];
                          const s1Main = allActs.find((a) => a.id === r.slot1Choice)?.name || r.slot1Choice || "-";
                          const s1Back = r.slot1Backup ? allActs.find((a) => a.id === r.slot1Backup)?.name || r.slot1Backup : "";
                          const s2Main = allActs.find((a) => a.id === r.slot2Choice)?.name || r.slot2Choice || "-";
                          const s2Back = r.slot2Backup ? allActs.find((a) => a.id === r.slot2Backup)?.name || r.slot2Backup : "";
                          const s3Main = allActs.find((a) => a.id === r.slot3Choice)?.name || r.slot3Choice || "-";
                          const s3Back = r.slot3Backup ? allActs.find((a) => a.id === r.slot3Backup)?.name || r.slot3Backup : "";

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono font-bold text-slate-700 whitespace-nowrap">
                                {r.studentId}
                              </td>
                              <td className="p-2 font-black text-slate-900 whitespace-nowrap">
                                {r.studentName}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                                  {r.studentGrade}
                                </span>
                              </td>
                              <td className="p-2 text-slate-700 whitespace-nowrap">
                                {r.parentName || "-"}
                              </td>
                              <td className="p-2 font-mono text-slate-700 whitespace-nowrap" dir="ltr">
                                {r.parentPhone || "-"}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="font-bold text-indigo-700">{s1Main}</span>
                                {s1Back && <span className="text-[10px] text-slate-500 block">חלופי: {s1Back}</span>}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="font-bold text-indigo-700">{s2Main}</span>
                                {s2Back && <span className="text-[10px] text-slate-500 block">חלופי: {s2Back}</span>}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="font-bold text-indigo-700">{s3Main}</span>
                                {s3Back && <span className="text-[10px] text-slate-500 block">חלופי: {s3Back}</span>}
                              </td>
                              <td className="p-2 text-slate-500 truncate max-w-xs">
                                {r.notes || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PREVIEW: ACTIVITIES */}
              {parsedActivities && parsedActivities.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-700" />
                      <span className="text-sm font-black text-emerald-950">
                        זוהו {parsedActivities.length} חוגי שישי בקובץ מוכנים
                        לקליטה וסנכרון!
                      </span>
                    </div>
                    {activitiesBySlot && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                          משבצת 1: {activitiesBySlot.slot1}
                        </span>
                        <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                          משבצת 2: {activitiesBySlot.slot2}
                        </span>
                        <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                          משבצת 3: {activitiesBySlot.slot3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Activities Table Preview with Diff Badges */}
                  <div className="max-h-64 overflow-y-auto bg-white rounded-xl border border-emerald-200 text-xs shadow-inner">
                    <table className="w-full text-right divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">סטטוס סנכרון</th>
                          <th className="p-2">משבצת</th>
                          <th className="p-2">שם החוג</th>
                          <th className="p-2">שעות</th>
                          <th className="p-2">מדריך / מורה</th>
                          <th className="p-2">טלפון</th>
                          <th className="p-2">שכבות גיל</th>
                          <th className="p-2">מכסה (מקס'/מינ')</th>
                          <th className="p-2">מיקום</th>
                          <th className="p-2">תיאור</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedActivities.map((a, idx) => {
                          const updatedInfo = activityDiffAnalysis?.updatedActivities.find(
                            (u) =>
                              u.activity.id.toLowerCase() === a.id.toLowerCase() ||
                              u.activity.name.trim().toLowerCase() === a.name.trim().toLowerCase(),
                          );
                          const isNew = activityDiffAnalysis?.newActivities.some(
                            (n) => n === a,
                          );

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 whitespace-nowrap">
                                {isNew ? (
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                                    <UserPlus className="w-3 h-3" />
                                    <span>חוג חדש</span>
                                  </span>
                                ) : updatedInfo && updatedInfo.changes.length > 0 ? (
                                  <span
                                    className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 cursor-help"
                                    title={updatedInfo.changes.join(", ")}
                                  >
                                    <RefreshCcw className="w-3 h-3" />
                                    <span>מעודכן ({updatedInfo.changes.length})</span>
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                                    ללא שינוי
                                  </span>
                                )}
                              </td>
                              <td className="p-2 font-bold text-indigo-700 whitespace-nowrap">
                                משבצת {a.slotNumber}
                              </td>
                              <td className="p-2 font-black text-slate-900 whitespace-nowrap">
                                {a.name}
                              </td>
                              <td className="p-2 text-slate-700 whitespace-nowrap">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-xs">
                                  {a.startTime || (a.slotNumber === 1 ? "שעה ראשונה" : a.slotNumber === 2 ? "שעה שניה" : "שעה שלישית")}
                                </span>
                              </td>
                              <td className="p-2 font-bold text-slate-800 whitespace-nowrap">
                                {a.instructor}
                              </td>
                              <td className="p-2 font-mono text-slate-600 whitespace-nowrap" dir="ltr">
                                {a.instructorPhone || "-"}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[11px]">
                                  {Array.isArray(a.allowedGrades)
                                    ? a.allowedGrades.join(",")
                                    : a.allowedGrades}
                                </span>
                              </td>
                              <td className="p-2 text-slate-600 whitespace-nowrap">
                                {a.maxCapacity} / {a.minCapacity}
                              </td>
                              <td className="p-2 text-slate-600 whitespace-nowrap">
                                {a.location}
                              </td>
                              <td
                                className="p-2 text-slate-500 truncate max-w-xs"
                                title={a.description}
                              >
                                {a.description || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PREVIEW: STUDENTS */}
              {parsedStudents && parsedStudents.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-indigo-700" />
                      <span className="text-sm font-black text-indigo-950">
                        זוהו {parsedStudents.length} תלמידים זכאים מוכנים לשיוך
                        וקליטה!
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className="bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>שיוך אוטומטי לפי עמודה J</span>
                        <span className="text-[10px] opacity-80">
                          (בית הספר של העתיד)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Column J Notice */}
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-black block">
                        מיון מדויק לכל בית ספר בנפרד לפי עמודה J:
                      </span>
                      <span className="text-[11px] text-indigo-800 leading-relaxed">
                        המערכת מזהה את שם בית הספר בעמודה J (בפורמט &quot;בית
                        הספר של העתיד (שם בית הספר)&quot;) ומפצלת את התלמידים כך
                        שכל תלמיד ייקלט אך ורק בבית הספר אליו הוא שייך, ולא
                        יישפך לבית הספר הנבחר.
                      </span>
                    </div>
                  </div>

                  {/* School Distribution Breakdown Cards */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>שיוך לפי בתי ספר שזוהו בקובץ (עמודה J):</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setStudentSchoolFilter("all")}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          studentSchoolFilter === "all"
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>כל בתי הספר</span>
                        <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                          {parsedStudents.length}
                        </span>
                      </button>

                      {Object.entries(studentsBySchoolMap).map(
                        ([sId, count]) => {
                          const isNavon = sId.includes("navon");
                          const isLapid = sId.includes("lapid");
                          const sName =
                            schools[sId]?.school.name ||
                            (isNavon
                              ? "בית ספר יצחק נבון"
                              : isLapid
                                ? 'בית ספר לפיד המ"ה'
                                : "בית ספר בן שמן");
                          const isSelected = studentSchoolFilter === sId;
                          const badgeColor = isNavon
                            ? isSelected
                              ? "bg-purple-700 text-white border-purple-700"
                              : "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                            : isLapid
                              ? isSelected
                                ? "bg-blue-700 text-white border-blue-700"
                                : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                              : isSelected
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100";

                          return (
                            <button
                              key={sId}
                              type="button"
                              onClick={() => setStudentSchoolFilter(sId)}
                              className={`px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${badgeColor}`}
                            >
                              <span>{sName}</span>
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                                {count} תלמידים
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Grade Layer Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                    <span className="text-[11px] font-bold text-slate-500 ml-1">
                      סינון שכבה:
                    </span>
                    <button
                      type="button"
                      onClick={() => setStudentGradeFilter("all")}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        studentGradeFilter === "all"
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      הכל
                    </button>
                    {["א", "ב", "ג", "ד", "ה", "ו"].map((layer) => {
                      const count = parsedStudents.filter((s) => {
                        if (
                          studentSchoolFilter !== "all" &&
                          (s.schoolId || currentSchoolId) !==
                            studentSchoolFilter
                        )
                          return false;
                        return s.gradeLayer === layer;
                      }).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={layer}
                          type="button"
                          onClick={() =>
                            setStudentGradeFilter(
                              studentGradeFilter === layer ? "all" : layer,
                            )
                          }
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            studentGradeFilter === layer
                              ? "bg-indigo-600 text-white"
                              : "bg-white border border-indigo-200 text-slate-700 hover:bg-indigo-50"
                          }`}
                        >
                          <span>שכבה {layer}</span>
                          <span className="text-[10px] opacity-75">
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Students Table Preview */}
                  <div className="max-h-60 overflow-y-auto bg-white rounded-xl border border-indigo-200 text-xs shadow-inner">
                    <table className="w-full text-right divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">ת.ז מנורמלת</th>
                          <th className="p-2">שם התלמיד</th>
                          <th className="p-2">בית ספר משויך</th>
                          <th className="p-2">כיתה ושכבה</th>
                          <th className="p-2">אישור</th>
                          <th className="p-2">איש קשר / הורה</th>
                          <th className="p-2">טלפון נייד</th>
                          <th className="p-2">דוא"ל</th>
                          <th className="p-2">יישוב וכתובת</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {parsedStudents
                          .filter((s) => {
                            if (
                              studentSchoolFilter !== "all" &&
                              (s.schoolId || currentSchoolId) !==
                                studentSchoolFilter
                            )
                              return false;
                            if (
                              studentGradeFilter !== "all" &&
                              s.gradeLayer !== studentGradeFilter
                            )
                              return false;
                            return true;
                          })
                          .map((s, idx) => {
                            const assignedSchoolId =
                              s.schoolId || currentSchoolId;
                            const isNavon = assignedSchoolId.includes("navon");
                            const isLapid = assignedSchoolId.includes("lapid");
                            const schoolBadgeClass = isNavon
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : isLapid
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200";

                            const assignedSchoolName =
                              s.schoolName ||
                              schools[assignedSchoolId]?.school.name ||
                              (isNavon
                                ? "בית ספר יצחק נבון"
                                : isLapid
                                  ? 'בית ספר לפיד המ"ה'
                                  : "בית ספר בן שמן");

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 font-mono font-bold text-slate-700 whitespace-nowrap">
                                  {s.id}
                                </td>
                                <td className="p-2 font-black text-slate-900 whitespace-nowrap">
                                  {s.firstName} {s.lastName}
                                </td>
                                <td className="p-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${schoolBadgeClass}`}
                                  >
                                    <span>{assignedSchoolName}</span>
                                    <span className="text-[9px] opacity-75 font-normal bg-white/60 px-1 rounded">
                                      עמודה J
                                    </span>
                                  </span>
                                </td>
                                <td className="p-2 whitespace-nowrap">
                                  <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                    {s.grade} (שכבה {s.gradeLayer})
                                  </span>
                                </td>
                                <td className="p-2 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isAuthorized ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                                  >
                                    {s.isAuthorized ? "מאושר" : "חסום"}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-600 whitespace-nowrap">
                                  {s.parentName || "-"}
                                </td>
                                <td
                                  className="p-2 font-mono text-slate-700 whitespace-nowrap"
                                  dir="ltr"
                                >
                                  {s.parentPhone || "-"}
                                </td>
                                <td className="p-2 text-slate-600 truncate max-w-xs">
                                  {s.parentEmail || "-"}
                                </td>
                                <td
                                  className="p-2 text-slate-500 truncate max-w-xs"
                                  title={`${s.settlement || ""} ${s.specialNotes || ""}`}
                                >
                                  {s.settlement
                                    ? `${s.settlement} ${s.specialNotes ? `(${s.specialNotes})` : ""}`
                                    : s.specialNotes || "-"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            סגור
          </button>

          {activeSubTab === "import" ? (
            <button
              type="button"
              onClick={handleApplyImport}
              disabled={
                !parsedStudents && !parsedActivities && !parsedRegistrations
              }
              className={`px-6 py-2.5 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer ${
                importTarget === "full_workbook" ||
                (parsedStudents &&
                  (parsedRegistrations || parsedActivities))
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 shadow-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {importTarget === "full_workbook" ||
                (parsedStudents &&
                  (parsedRegistrations || parsedActivities))
                  ? `שחזר וקלוט את כל הנתונים למערכת ולענן (${parsedStudents?.length || 0} זכאים, ${parsedActivities?.length || 0} חוגים, ${parsedRegistrations?.length || 0} נרשמים)`
                  : parsedRegistrations
                    ? `אשר וקלוט ${parsedRegistrations.length} נרשמים עם שיבוצים חדשים`
                    : parsedActivities
                      ? `אשר ועדכן ${parsedActivities.length} חוגים`
                      : parsedStudents
                        ? studentImportMode === "sync_changes"
                          ? `בצע סנכרון שינויים (${diffAnalysis?.newCount || 0} חדשים, ${diffAnalysis?.updateCount || 0} יעודכנו, ${Object.values(selectedDeleteIds).filter(Boolean).length} יימחקו)`
                          : studentImportMode === "add_only"
                            ? `קלוט ${diffAnalysis?.newCount || 0} תלמידים חדשים בלבד`
                            : studentImportMode === "replace"
                              ? `אשר החלפה מלאה של כל הרשימה (${parsedStudents.length} תלמידים)`
                              : detectedSchoolCount > 1
                                ? `אשר ושייך ${parsedStudents.length} תלמידים ל-${detectedSchoolCount} בתי ספר (${diffAnalysis?.newCount || 0} חדשים, ${diffAnalysis?.updateCount || 0} יעודכנו)`
                                : `אשר ועדכן ${parsedStudents.length} תלמידים (${diffAnalysis?.newCount || 0} חדשים, ${diffAnalysis?.updateCount || 0} יעודכנו)`
                        : "אישור וקליטת נתונים"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSubTab("import")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>המשך להעלאת הקובץ</span>
              <UploadCloud className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
