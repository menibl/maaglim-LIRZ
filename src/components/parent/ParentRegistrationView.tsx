import React, { useState, useMemo } from "react";
import { useSchool } from "../../context/SchoolContext";
import { Student, Activity } from "../../types";
import { SchoolData } from "../../data/initialData";
import {
  getActivityBaseKey,
  isMolecularCookingActivity,
  findMolecularCookingSlot3Activity,
  calculateLiveEnrollmentCounts,
  getActivityCapacityInfo,
} from "../../utils/activityRules";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  Clock,
  MapPin,
  User,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  CalendarDays,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle,
  Ban,
  Users,
  Utensils,
  Trash2,
  RefreshCw,
  X,
  School as SchoolIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

interface ParentRegistrationViewProps {
  onRegistrationComplete?: (studentId: string) => void;
  onNavigateToTimetable?: (studentId?: string) => void;
}

export const ParentRegistrationView: React.FC<ParentRegistrationViewProps> = ({
  onNavigateToTimetable,
}) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    coordinator,
    students,
    activities,
    registrations,
    registerStudent,
    deleteRegistration,
    selectSchool,
    setIsContactModalOpen,
    syncStatus,
  } = useSchool();

  // State
  const [searchId, setSearchId] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [schoolSwitchedNotice, setSchoolSwitchedNotice] = useState<string | null>(
    null,
  );

  // Form state
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentNotes, setParentNotes] = useState("");

  // 3 Slots Choice state (Single direct choice per slot - No 2nd priority)
  const [slot1Choice, setSlot1Choice] = useState<string>("");
  const [slot2Choice, setSlot2Choice] = useState<string>("");
  const [slot3Choice, setSlot3Choice] = useState<string>("");

  // Expanded descriptions map
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});

  // Active Slot tab for mobile/clean navigation (or show all)
  const [activeSlotTab, setActiveSlotTab] = useState<1 | 2 | 3 | "all">(1);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    regId: string;
    studentName: string;
  } | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(
    null,
  );

  // Pop-up confirmation state for slot selection & auto-transition
  const [slotConfirmModal, setSlotConfirmModal] = useState<{
    activity: Activity;
    slotNumber: 1 | 2 | 3;
    isReplacement?: boolean;
    replacedActivityName?: string;
  } | null>(null);

  // Live enrollment counts computed across all registrations (excluding current student being registered)
  const liveEnrollmentCounts = useMemo(() => {
    return calculateLiveEnrollmentCounts(registrations, verifiedStudent?.id);
  }, [registrations, verifiedStudent]);

  // Check if Molecular Cooking is currently selected in Slot 2
  const isSlot2MolecularSelected = useMemo(() => {
    if (!slot2Choice) return false;
    const act = activities.find((a) => a.id === slot2Choice);
    return isMolecularCookingActivity(act);
  }, [slot2Choice, activities]);

  // Verify Student ID
  const handleVerifyStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawSearch = searchId.trim();
    if (!rawSearch) {
      setVerificationError("אנא הזינו מספר תעודת זהות של התלמיד/ה");
      return;
    }

    const cleanSearchDigits = rawSearch.replace(/[^\d]/g, "");

    const matchStudent = (s: Student) => {
      if (s.id.trim() === rawSearch) return true;
      const sDigits = s.id.replace(/[^\d]/g, "");
      if (cleanSearchDigits && sDigits) {
        if (sDigits === cleanSearchDigits) return true;
        if (sDigits.padStart(9, "0") === cleanSearchDigits.padStart(9, "0"))
          return true;
      }
      return false;
    };

    let student = students.find(matchStudent);
    let matchedSchool = currentSchool;
    let matchedRegistrations = registrations;

    // If not found in currently active school, search across all schools in the system
    if (!student) {
      for (const [sId, sData] of Object.entries(schools) as [string, SchoolData][]) {
        if (sId === currentSchoolId) continue;
        const found = sData.students.find(matchStudent);
        if (found) {
          student = found;
          matchedSchool = sData.school;
          matchedRegistrations = sData.registrations || [];
          selectSchool(sId);
          setSchoolSwitchedNotice(
            `התלמיד/ה זוהה/תה ב${matchedSchool.name} — המערכת עברה אוטומטית לבית הספר המתאים!`,
          );
          break;
        }
      }
    } else {
      setSchoolSwitchedNotice(null);
    }

    if (!student) {
      setSchoolSwitchedNotice(null);
      setVerificationError(
        `תעודת הזהות (${rawSearch}) לא נמצאה ברשימת התלמידים הזכאים באף אחד מבתי הספר במערכת (בן שמן, לפיד המ"ד, יצחק נבון). אנא פנו לרכזת החוגים או למזכירות בית הספר.`,
      );
      setVerifiedStudent(null);
      return;
    }

    if (!student.isAuthorized) {
      setVerificationError(
        `התלמיד/ה ${student.firstName} ${student.lastName} קיים/ת במערכת (${matchedSchool.name}), אך סטטוס ההרשמה חסום או ממתין להסדרה במזכירות.`,
      );
      setVerifiedStudent(null);
      return;
    }

    // Found and authorized
    setVerifiedStudent(student);
    setVerificationError(null);

    // Auto-fill existing parent info if available
    if (student.parentName) setParentName(student.parentName);
    if (student.parentPhone) setParentPhone(student.parentPhone);
    if (student.parentEmail) setParentEmail(student.parentEmail);

    // Check if already registered in the matched school
    const existingReg = matchedRegistrations.find((r) => r.studentId === student.id);
    if (existingReg) {
      setSlot1Choice(existingReg.slot1Choice || "");
      setSlot2Choice(existingReg.slot2Choice || "");
      setSlot3Choice(existingReg.slot3Choice || "");
      if (existingReg.parentName) setParentName(existingReg.parentName);
      if (existingReg.parentPhone) setParentPhone(existingReg.parentPhone);
      if (existingReg.parentEmail) setParentEmail(existingReg.parentEmail);
      if (existingReg.notes) setParentNotes(existingReg.notes);
    }
  };

  // Grade eligible activities
  const eligibleActivities = useMemo(() => {
    if (!verifiedStudent) return [];

    return activities.filter((activity) => {
      const sGrade = (verifiedStudent.gradeLayer || verifiedStudent.grade || "")
        .replace(/['"]/g, "")
        .trim();
      const matchesGrade = activity.allowedGrades.some((g) => {
        const cleanG = g.replace(/['"]/g, "").trim();
        return cleanG === sGrade || sGrade.startsWith(cleanG);
      });
      return matchesGrade && activity.status === "active";
    });
  }, [activities, verifiedStudent]);

  // Group eligible activities by Friday slot
  const activitiesBySlot = useMemo(() => {
    return {
      slot1: eligibleActivities.filter((a) => a.slotNumber === 1),
      slot2: eligibleActivities.filter((a) => a.slotNumber === 2),
      slot3: eligibleActivities.filter((a) => a.slotNumber === 3),
    };
  }, [eligibleActivities]);

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fridaySlots = currentSchool.fridaySlots || [
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
  ];

  const getSlotTiming = (slotNum: 1 | 2 | 3) => {
    const s = fridaySlots.find((slot) => slot.slotNumber === slotNum);
    return (
      s?.label ||
      (slotNum === 1 ? "שעה ראשונה" : slotNum === 2 ? "שעה שניה" : "שעה שלישית")
    );
  };

  // Handle Slot 1 Selection
  const handleSelectSlot1 = (actId: string) => {
    setSlot1Choice((prev) => (prev === actId ? "" : actId));
  };

  // Handle Slot 2 Selection (with special Molecular Cooking 2-hour link)
  const handleSelectSlot2 = (actId: string) => {
    if (slot2Choice === actId) {
      // Deselecting slot 2
      setSlot2Choice("");
      // If was molecular cooking, also free up slot 3
      const act = activities.find((a) => a.id === actId);
      if (isMolecularCookingActivity(act)) {
        const molS3 = findMolecularCookingSlot3Activity(activities);
        if (molS3 && slot3Choice === molS3.id) {
          setSlot3Choice("");
        }
      }
    } else {
      // Selecting new activity for slot 2
      setSlot2Choice(actId);
      const act = activities.find((a) => a.id === actId);
      if (isMolecularCookingActivity(act)) {
        const molS3 = findMolecularCookingSlot3Activity(activities);
        if (molS3) {
          setSlot3Choice(molS3.id);
        }
      }
    }
  };

  // Handle Slot 3 Selection
  const handleSelectSlot3 = (actId: string) => {
    // If Molecular Cooking is selected in Slot 2, Slot 3 is locked to Molecular Cooking
    if (isSlot2MolecularSelected) {
      return;
    }
    setSlot3Choice((prev) => (prev === actId ? "" : actId));
  };

  // Confirm selection in modal and auto-transition to next hour
  const handleConfirmSlotSelection = () => {
    if (!slotConfirmModal) return;
    const { activity, slotNumber } = slotConfirmModal;

    if (slotNumber === 1) {
      setSlot1Choice(activity.id);
      setActiveSlotTab(2);
      setTimeout(() => {
        const target =
          document.getElementById("slot-2-banner") ||
          document.getElementById("btn-tab-slot-2");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else if (slotNumber === 2) {
      handleSelectSlot2(activity.id);
      const isMol = isMolecularCookingActivity(activity);
      if (isMol) {
        // Molecular cooking occupies both hour 2 and 3!
        setActiveSlotTab(3);
        setTimeout(() => {
          document
            .getElementById("step-3-contact-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        setActiveSlotTab(3);
        setTimeout(() => {
          const target =
            document.getElementById("slot-3-banner") ||
            document.getElementById("btn-tab-slot-3");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else if (slotNumber === 3) {
      setSlot3Choice(activity.id);
      setTimeout(() => {
        document
          .getElementById("step-3-contact-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }

    setSlotConfirmModal(null);
  };

  // Cancel selection in modal
  const handleCancelSlotSelection = () => {
    setSlotConfirmModal(null);
  };

  // Submit registration
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedStudent) return;

    if (!slot1Choice || !slot2Choice || !slot3Choice) {
      alert(
        "נא לבחור חוג עבור כל אחת מ-3 המשבצות של יום שישי (שעה ראשונה, שעה שניה ושעה שלישית).",
      );
      return;
    }

    // Verify chosen activities exist in currently active activities for this school
    const activeActIds = new Set(activities.map((a) => a.id));
    if (
      !activeActIds.has(slot1Choice) ||
      !activeActIds.has(slot2Choice) ||
      !activeActIds.has(slot3Choice)
    ) {
      alert(
        "חלק מהחוגים שנבחרו אינם פעילים עוד בבית ספר זה (ייתכן שהרשימה עודכנה או שונתה). אנא רעננו את העמוד ובחרו מתוך החוגים הפעילים המוצגים כעת.",
      );
      return;
    }

    if (!parentName.trim() || !parentPhone.trim()) {
      alert("נא למלא שם הורה ומספר טלפון ליצירת קשר.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = registerStudent({
        studentId: verifiedStudent.id,
        studentName: `${verifiedStudent.firstName} ${verifiedStudent.lastName}`,
        studentGrade: verifiedStudent.grade,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim(),
        slot1Choice,
        slot2Choice,
        slot3Choice,
        notes: parentNotes.trim() || undefined,
      });

      setIsSubmitting(false);

      if (result.success) {
        setSubmissionSuccess({
          regId: result.regId || "REG-SUCCESS",
          studentName: `${verifiedStudent.firstName} ${verifiedStudent.lastName}`,
        });

        // Trigger confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      } else {
        alert(result.message);
      }
    }, 400);
  };

  // Activity Card renderer for First-Come First-Served with duplicate detection
  const renderActivityCard = (activity: Activity, slotNum: 1 | 2 | 3) => {
    const isSelected =
      (slotNum === 1 && slot1Choice === activity.id) ||
      (slotNum === 2 && slot2Choice === activity.id) ||
      (slotNum === 3 && slot3Choice === activity.id);

    const isExpanded = expandedDescriptions[activity.id] || false;
    const isMolecular = isMolecularCookingActivity(activity);

    // Live capacity info
    const capInfo = getActivityCapacityInfo(
      activity,
      liveEnrollmentCounts,
      isSelected,
    );

    // Duplicate subject check across other slots
    const currentSubjectKey = getActivityBaseKey(activity);
    const act1 = activities.find((a) => a.id === slot1Choice);
    const act2 = activities.find((a) => a.id === slot2Choice);
    const act3 = activities.find((a) => a.id === slot3Choice);

    let isDuplicateSubject = false;
    let duplicateReason = "";

    if (slotNum === 1) {
      if (
        act2 &&
        !isMolecularCookingActivity(act2) &&
        getActivityBaseKey(act2) === currentSubjectKey
      ) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה שניה";
      } else if (
        act3 &&
        !isMolecularCookingActivity(act3) &&
        getActivityBaseKey(act3) === currentSubjectKey
      ) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה שלישית";
      }
    } else if (slotNum === 2) {
      if (act1 && getActivityBaseKey(act1) === currentSubjectKey) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה ראשונה";
      } else if (
        act3 &&
        !isMolecular &&
        getActivityBaseKey(act3) === currentSubjectKey
      ) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה שלישית";
      }
    } else if (slotNum === 3) {
      if (act1 && getActivityBaseKey(act1) === currentSubjectKey) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה ראשונה";
      } else if (
        act2 &&
        !isMolecular &&
        getActivityBaseKey(act2) === currentSubjectKey
      ) {
        isDuplicateSubject = true;
        duplicateReason = "נבחר כבר בשעה שניה";
      }
    }

    // Special check for Slot 3 when Molecular Cooking is active in Slot 2
    const isSlot3MolecularLocked = slotNum === 3 && isSlot2MolecularSelected;
    const isThisMolecularSlot3 = slotNum === 3 && isMolecular;

    const handleCardClick = () => {
      if (capInfo.isFull && !isSelected) return;
      if (isDuplicateSubject && !isSelected) return;
      if (isSlot3MolecularLocked && !isThisMolecularSlot3) return;

      if (isSelected) {
        // If already selected, clicking deselects it
        if (slotNum === 1) handleSelectSlot1(activity.id);
        if (slotNum === 2) handleSelectSlot2(activity.id);
        if (slotNum === 3) handleSelectSlot3(activity.id);
        return;
      }

      // Check if another activity is already chosen for this slot
      const existingId =
        slotNum === 1 ? slot1Choice : slotNum === 2 ? slot2Choice : slot3Choice;
      const existingAct = existingId
        ? activities.find((a) => a.id === existingId)
        : undefined;

      // Open pop-up confirmation prompt
      setSlotConfirmModal({
        activity,
        slotNumber: slotNum,
        isReplacement: !!existingAct,
        replacedActivityName: existingAct?.name,
      });
    };

    return (
      <div
        key={activity.id}
        id={`card-act-${activity.id}`}
        className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
          isSelected
            ? "border-indigo-600 ring-2 ring-indigo-500/25 shadow-lg bg-indigo-50/20"
            : capInfo.isFull ||
                isDuplicateSubject ||
                (isSlot3MolecularLocked && !isThisMolecularSlot3)
              ? "border-slate-200 opacity-75 bg-slate-50/70"
              : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
        }`}
      >
        <div>
          {/* Activity Image */}
          {activity.imageUrl ? (
            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
              <img
                src={activity.imageUrl}
                alt={activity.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/20 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  נבחר לשעה זו
                </div>
              )}

              {/* 2-Hour Molecular Cooking Badge */}
              {isMolecular && (
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                  <Utensils className="w-3.5 h-3.5" />
                  שעתיים רצופות (שעה 2 + 3)
                </div>
              )}

              {/* Capacity Status Badge */}
              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2 font-semibold drop-shadow-md">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    {activity.startTime}
                  </span>
                </div>

                {/* Capacity Counter */}
                <div>
                  {capInfo.isFull ? (
                    <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                      <Ban className="w-3 h-3" />
                      חוג מלא (20/20)
                    </span>
                  ) : capInfo.isNearlyFull ? (
                    <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-lg shadow-md animate-pulse">
                      נותרו {capInfo.remaining} מקומות בלבד!
                    </span>
                  ) : (
                    <span className="bg-emerald-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                      {capInfo.remaining} מקומות פנויים
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 font-bold text-indigo-700">
                  <Clock className="w-3.5 h-3.5" />
                  {activity.startTime}
                </span>
              </div>
              {isSelected && (
                <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  נבחר
                </span>
              )}
            </div>
          )}

          {/* Card Content */}
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h4 className="text-base font-black text-slate-900 leading-snug">
                {activity.name}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activity.location}</span>
              </p>
            </div>

            {/* Live Capacity Bar */}
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  תפוסת חוג בזמן אמת:
                </span>
                <span
                  className={
                    capInfo.isFull ? "text-red-600" : "text-emerald-700"
                  }
                >
                  {capInfo.enrolled} / {capInfo.max} רשומים
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    capInfo.isFull
                      ? "bg-red-500"
                      : capInfo.isNearlyFull
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (capInfo.enrolled / capInfo.max) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className={isExpanded ? "" : "line-clamp-2"}>
                {activity.description}
              </p>
              {activity.description.length > 80 && (
                <button
                  type="button"
                  onClick={() => toggleDescription(activity.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      הצג פחות <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      קרא עוד <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Instructor */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {activity.instructor}
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                שכבות {activity.allowedGrades.join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100">
          {isSelected ? (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>נבחר לחוג זה (לחץ לביטול)</span>
            </button>
          ) : capInfo.isFull ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-slate-200 text-slate-500 border border-slate-300 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Ban className="w-4 h-4 text-red-500" />
              <span>החוג מלא (אין מקומות פנויים)</span>
            </button>
          ) : isDuplicateSubject ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{duplicateReason} (אין כפילות)</span>
            </button>
          ) : isSlot3MolecularLocked && !isThisMolecularSlot3 ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <span>שעה זו תפוסה ע"י בישול מולקולרי</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border-2 border-indigo-200 hover:border-indigo-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>+ בחירת חוג זה</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // If already registered and showing success state
  if (submissionSuccess) {
    const choice1Act = activities.find((a) => a.id === slot1Choice);
    const choice2Act = activities.find((a) => a.id === slot2Choice);
    const choice3Act = activities.find((a) => a.id === slot3Choice);

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              ההרשמה נקלטה ושובצה בהצלחה
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              תודה רבה, ההרשמה עבור {submissionSuccess.studentName} הסתיימה!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              מספר אסמכתא:{" "}
              <span className="font-mono font-bold text-slate-900">
                {submissionSuccess.regId}
              </span>
            </p>
            {syncStatus === "quota_exceeded" && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium text-center">
                ℹ️ ההרשמה נשמרה בהצלחה במכשירך. עקב עומס זמני בשרתי הענן, הסנכרון הסופי למערכת המרכזית יתבצע אוטומטית.
              </div>
            )}
          </div>

          {/* Chosen 3 Activities Card */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-right space-y-3">
            <h4 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>סיכום 3 חוגי יום שישי המשובצים:</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                שיבוץ מאושר ומובטח
              </span>
            </h4>

            <div className="space-y-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-indigo-600 block">
                    שעה ראשונה ({getSlotTiming(1)})
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {choice1Act?.name || "חוג נבחר"}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {choice1Act?.location}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-purple-600 block">
                    שעה שניה ({getSlotTiming(2)})
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {choice2Act?.name || "חוג נבחר"}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {choice2Act?.location}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-teal-600 block">
                    שעה שלישית ({getSlotTiming(3)})
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {choice3Act?.name || "חוג נבחר"}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {choice3Act?.location}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                העלות הינה קבועה ואחידה לחבילת 3 חוגי יום שישי. המקומות שוריינו
                עבורכם במלואם.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTimetable?.(verifiedStudent?.id)}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              צפייה במערכת שעות חוגי שישי
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setVerifiedStudent(null);
                setSearchId("");
                setSlot1Choice("");
                setSlot2Choice("");
                setSlot3Choice("");
              }}
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              רישום ילד/ה נוסף
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Welcome Announcement Card */}
      <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-indigo-200 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            תוכנית חוגי שישי תשפ"ז | מעגלים חבל מודיעין
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            רישום לחוגי שישי
          </h2>
          <div className="text-sm sm:text-base text-indigo-100/95 leading-relaxed space-y-2 pt-1">
            <p>
              הורים יקרים, במערכת זו אתם משבצים את ילדכם לחוגים לפי המקומות הפנויים בחוג. באפשרותכם לערוך את השיבוץ עד תאריך 15/10.
            </p>
            <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
              לאחר פתיחת התוכנית, השינויים בשיבוצים יתבצעו מול רכזת התוכנית בבית הספר.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Verification Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
              1
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                אימות זכאות תלמיד/ה לפי תעודת זהות
              </h3>
              <p className="text-xs text-slate-500">
                הזינו ת.ז. של הילד/ה כדי להציג את רשימת החוגים המותאמת לשכבת
                הגיל
              </p>
            </div>
          </div>
          {verifiedStudent && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              תלמיד מאומת
            </span>
          )}
        </div>

        <form
          onSubmit={handleVerifyStudent}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="הקלידו מספר תעודת זהות של התלמיד/ה (לדוגמה: 214589632)"
              className="w-full pl-3 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            אימות והצגת חוגים
          </button>
        </form>

        {/* Verification Error */}
        {verificationError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{verificationError}</p>
              <p className="text-red-700">
                זקוקים לעזרה? ניתן לפנות לרכזת החוגים:{" "}
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="font-bold underline text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  {coordinator.name} ({coordinator.phone})
                </button>
              </p>
            </div>
          </div>
        )}

        {/* School Auto-Switched Notice */}
        {schoolSwitchedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-indigo-50 border border-indigo-200/90 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 font-bold shadow-2xs"
          >
            <SchoolIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{schoolSwitchedNotice}</span>
          </motion.div>
        )}

        {/* Verified Student Details Card */}
        {verifiedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                {verifiedStudent.firstName[0]}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  {verifiedStudent.firstName} {verifiedStudent.lastName}
                </div>
                <div className="text-slate-600 flex items-center gap-2 mt-0.5">
                  <span>
                    כיתה: <strong>{verifiedStudent.grade}</strong> (שכבה{" "}
                    {verifiedStudent.gradeLayer}')
                  </span>
                  {verifiedStudent.settlement && (
                    <span>
                      • יישוב: <strong>{verifiedStudent.settlement}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-emerald-800 font-bold self-start sm:self-auto bg-emerald-100/80 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              זכאי/ת להרשמה ל-3 חוגי שישי
            </div>
          </motion.div>
        )}

        {/* Cancellation Notice */}
        {cancellationNotice && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900 font-bold animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{cancellationNotice}</span>
          </div>
        )}

        {/* Existing Registration Alert & Cancellation Option */}
        {verifiedStudent &&
          registrations.some((r) => r.studentId === verifiedStudent.id) && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3 text-xs text-amber-950">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-black text-amber-950">
                      התלמיד/ה כבר משובץ/ת ל-3 חוגי שישי במערכת.
                    </div>
                    <div className="text-amber-800 text-[11px] leading-relaxed">
                      <strong>עדכון שיבוץ:</strong> באפשרותכם לעדכן חוגים עד תאריך 15/10 ולשמור. שימו לב: החלפת חוג או ביטול מוחקים את מקומכם
                      הקודם ומפנים אותו מיד לתלמיד הבא בתור.
                    </div>
                  </div>
                </div>

                {!isCancelConfirmOpen && (
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="px-3.5 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>ביטול הרשמה ופינוי מקום</span>
                  </button>
                )}
              </div>

              {/* Cancel Confirmation Box */}
              {isCancelConfirmOpen && (
                <div className="p-3 bg-white border border-red-200 rounded-xl space-y-2 shadow-xs">
                  <div className="text-red-900 font-black flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>אישור ביטול הרשמה ופינוי מקום:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    האם אתם בטוחים שברצונכם לבטל את ההרשמה של{" "}
                    {verifiedStudent.firstName}? פעולה זו תמחק את כל שיבוצי
                    החוגים ותאפשר לתלמידים אחרים לתפוס את המקומות באופן מיידי.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const existingReg = registrations.find(
                          (r) => r.studentId === verifiedStudent.id,
                        );
                        if (existingReg) {
                          deleteRegistration(existingReg.id);
                          setSlot1Choice("");
                          setSlot2Choice("");
                          setSlot3Choice("");
                          setIsCancelConfirmOpen(false);
                          setCancellationNotice(
                            `ההרשמה של ${verifiedStudent.firstName} ${verifiedStudent.lastName} בוטלה בהצלחה. 3 המקומות בחוגים פונו מיד עבור תלמידים אחרים.`,
                          );
                          setTimeout(() => setCancellationNotice(null), 6000);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      כן, בטל הרשמה ופנה מקום
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCancelConfirmOpen(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      חזור (אל תבטל)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Step 2: Activity Selection (When Student is Verified) */}
      {verifiedStudent && (
        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          {/* Main Slots Picker Header */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            {/* Top Title & Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>בחירת 3 חוגי יום שישי</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      מכסה עד 20 ילדים בחוג
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    בחרו חוג אחד לכל שעה. שימו לב: לא ניתן להירשם לאותו חוג
                    ביותר משעה אחת.
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSlotTab(1)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSlotTab !== "all"
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>מעבר שלב-אחר-שלב (מומלץ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlotTab("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSlotTab === "all"
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>הצג את כל השעות יחד</span>
                </button>
              </div>
            </div>

            {/* 3 Time Slots Interactive Stepper Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>מעבר בין 3 שעות הפעילות:</span>
                <span className="text-indigo-600 font-black">
                  {Number(!!slot1Choice) +
                    Number(!!slot2Choice) +
                    Number(!!slot3Choice)}{" "}
                  מתוך 3 שעות נבחרו
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Slot 1 Tab Card */}
                {(() => {
                  const act1 = activities.find((a) => a.id === slot1Choice);
                  const isChosen = !!slot1Choice;
                  return (
                    <button
                      type="button"
                      id="btn-tab-slot-1"
                      onClick={() => setActiveSlotTab(1)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        activeSlotTab === 1
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/20"
                          : isChosen
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70"
                            : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              activeSlotTab === 1
                                ? "bg-white text-indigo-600"
                                : isChosen
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            1
                          </span>
                          <span className="font-black text-xs sm:text-sm">
                            שעה ראשונה
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            activeSlotTab === 1
                              ? "bg-indigo-700/80 text-white"
                              : "bg-white/80 text-slate-700 border border-slate-200/50"
                          }`}
                        >
                          {getSlotTiming(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-current/15">
                        <span className="truncate max-w-[180px] font-medium">
                          {act1 ? `נבחר: ${act1.name}` : "טרם נבחר חוג"}
                        </span>
                        {isChosen ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                              activeSlotTab === 1
                                ? "bg-white text-indigo-700"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            <Check className="w-3 h-3" /> נבחר
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              activeSlotTab === 1
                                ? "bg-indigo-500/60 text-indigo-100"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            ממתין
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })()}

                {/* Slot 2 Tab Card */}
                {(() => {
                  const act2 = activities.find((a) => a.id === slot2Choice);
                  const isChosen = !!slot2Choice;
                  return (
                    <button
                      type="button"
                      id="btn-tab-slot-2"
                      onClick={() => setActiveSlotTab(2)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        activeSlotTab === 2
                          ? "bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-500/20"
                          : isChosen
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70"
                            : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              activeSlotTab === 2
                                ? "bg-white text-purple-600"
                                : isChosen
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            2
                          </span>
                          <span className="font-black text-xs sm:text-sm">
                            שעה שניה
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            activeSlotTab === 2
                              ? "bg-purple-700/80 text-white"
                              : "bg-white/80 text-slate-700 border border-slate-200/50"
                          }`}
                        >
                          {getSlotTiming(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-current/15">
                        <span className="truncate max-w-[180px] font-medium">
                          {act2 ? `נבחר: ${act2.name}` : "טרם נבחר חוג"}
                        </span>
                        {isChosen ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                              activeSlotTab === 2
                                ? "bg-white text-purple-700"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            <Check className="w-3 h-3" /> נבחר
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              activeSlotTab === 2
                                ? "bg-purple-500/60 text-purple-100"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            ממתין
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })()}

                {/* Slot 3 Tab Card */}
                {(() => {
                  const act3 = activities.find((a) => a.id === slot3Choice);
                  const isChosen = !!slot3Choice;
                  return (
                    <button
                      type="button"
                      id="btn-tab-slot-3"
                      onClick={() => setActiveSlotTab(3)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        activeSlotTab === 3
                          ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-500/20"
                          : isChosen
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70"
                            : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              activeSlotTab === 3
                                ? "bg-white text-teal-600"
                                : isChosen
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            3
                          </span>
                          <span className="font-black text-xs sm:text-sm">
                            שעה שלישית
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            activeSlotTab === 3
                              ? "bg-teal-700/80 text-white"
                              : "bg-white/80 text-slate-700 border border-slate-200/50"
                          }`}
                        >
                          {getSlotTiming(3)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-current/15">
                        <span className="truncate max-w-[180px] font-medium">
                          {act3 ? `נבחר: ${act3.name}` : "טרם נבחר חוג"}
                        </span>
                        {isChosen ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                              activeSlotTab === 3
                                ? "bg-white text-teal-700"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            <Check className="w-3 h-3" /> נבחר
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              activeSlotTab === 3
                                ? "bg-teal-500/60 text-teal-100"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            ממתין
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 1: משבצת 1 */}
            {/* ======================================================== */}
            {(activeSlotTab === 1 || activeSlotTab === "all") && (
              <div className="space-y-4 pt-2">
                {/* Visual Hour Banner */}
                <div
                  id="slot-1-banner"
                  className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                      1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black tracking-tight">
                          שעה ראשונה
                        </h4>
                        <span className="bg-indigo-500/40 text-indigo-100 text-xs font-bold px-2 py-0.5 rounded-md border border-indigo-400/30">
                          {getSlotTiming(1)}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        {activitiesBySlot.slot1.length} חוגים זמינים • לחצו על
                        "בחירת חוג זה" לשריין מקום
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold self-start sm:self-auto">
                    {slot1Choice ? (
                      <span className="bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          נבחר:{" "}
                          {activities.find((a) => a.id === slot1Choice)?.name}
                        </span>
                      </span>
                    ) : (
                      <span className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>אנא בחרו חוג לשעה ראשונה</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Activities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activitiesBySlot.slot1.map((act) =>
                    renderActivityCard(act, 1),
                  )}
                </div>

                {/* Step navigation prompt for Hour 1 */}
                {activeSlotTab === 1 && (
                  <div className="p-4 bg-indigo-50/90 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <div className="text-xs text-indigo-900 font-bold flex items-center gap-2">
                      {slot1Choice ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            מצוין! חוג לשעה ראשונה נבחר. המשיכו לבחירת החוג לשעה
                            שניה.
                          </span>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>
                            לחצו על "+ בחירת חוג זה" באחד החוגים שלמעלה כדי
                            להמשיך.
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      id="btn-next-to-slot-2"
                      onClick={() => {
                        setActiveSlotTab(2);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        slot1Choice
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98"
                          : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100/50"
                      }`}
                    >
                      <span>המשך לבחירת חוג לשעה שניה</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: משבצת 2 */}
            {/* ======================================================== */}
            {(activeSlotTab === 2 || activeSlotTab === "all") && (
              <div
                className={`space-y-4 pt-4 ${activeSlotTab === "all" ? "border-t-4 border-purple-200 mt-6" : ""}`}
              >
                {/* Visual Hour Banner */}
                <div
                  id="slot-2-banner"
                  className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-purple-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                      2
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black tracking-tight">
                          שעה שניה
                        </h4>
                        <span className="bg-purple-500/40 text-purple-100 text-xs font-bold px-2 py-0.5 rounded-md border border-purple-400/30">
                          {getSlotTiming(2)}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 mt-0.5">
                        {activitiesBySlot.slot2.length} חוגים זמינים לשכבת{" "}
                        {verifiedStudent.gradeLayer}'
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold self-start sm:self-auto">
                    {slot2Choice ? (
                      <span className="bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          נבחר:{" "}
                          {activities.find((a) => a.id === slot2Choice)?.name}
                        </span>
                      </span>
                    ) : (
                      <span className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>אנא בחרו חוג לשעה שניה</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Activities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activitiesBySlot.slot2.map((act) =>
                    renderActivityCard(act, 2),
                  )}
                </div>

                {/* Step navigation prompt for Hour 2 */}
                {activeSlotTab === 2 && (
                  <div className="p-4 bg-purple-50/90 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlotTab(1);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>חזרה לשעה ראשונה</span>
                    </button>

                    <button
                      type="button"
                      id="btn-next-to-slot-3"
                      onClick={() => {
                        setActiveSlotTab(3);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        slot2Choice
                          ? "bg-purple-600 hover:bg-purple-700 text-white active:scale-98"
                          : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100/50"
                      }`}
                    >
                      <span>המשך לבחירת חוג לשעה שלישית</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: משבצת 3 */}
            {/* ======================================================== */}
            {(activeSlotTab === 3 || activeSlotTab === "all") && (
              <div
                className={`space-y-4 pt-4 ${activeSlotTab === "all" ? "border-t-4 border-teal-200 mt-6" : ""}`}
              >
                {/* Visual Hour Banner */}
                <div
                  id="slot-3-banner"
                  className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-950 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-teal-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                      3
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black tracking-tight">
                          שעה שלישית
                        </h4>
                        <span className="bg-teal-500/40 text-teal-100 text-xs font-bold px-2 py-0.5 rounded-md border border-teal-400/30">
                          {getSlotTiming(3)}
                        </span>
                      </div>
                      <p className="text-xs text-teal-200 mt-0.5">
                        {activitiesBySlot.slot3.length} חוגים זמינים לשכבת{" "}
                        {verifiedStudent.gradeLayer}'
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold self-start sm:self-auto">
                    {slot3Choice ? (
                      <span className="bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          נבחר:{" "}
                          {activities.find((a) => a.id === slot3Choice)?.name}
                        </span>
                      </span>
                    ) : (
                      <span className="bg-amber-400 text-amber-950 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>אנא בחרו חוג לשעה שלישית</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Special Notification if Molecular Cooking in Slot 2 is selected */}
                {isSlot2MolecularSelected && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
                    <Utensils className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-sm text-amber-950">
                        שעה שלישית משוריינת אוטומטית לחוג "בישול מולקולרי"
                        (שעתיים רצופות)
                      </h5>
                      <p className="mt-0.5 text-amber-800">
                        בחרתם בחוג בישול מולקולרי בשעה שניה – חוג זה נמשך שעתיים
                        רצופות (שעה שניה ושלישית). משבצת השעה השלישית נשמרת
                        אוטומטית כהמשך ישיר.
                      </p>
                    </div>
                  </div>
                )}

                {/* Activities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activitiesBySlot.slot3.map((act) =>
                    renderActivityCard(act, 3),
                  )}
                </div>

                {/* Step navigation prompt for Hour 3 */}
                {activeSlotTab === 3 && (
                  <div className="p-4 bg-teal-50/90 rounded-2xl border border-teal-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlotTab(2);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>חזרה לשעה שניה</span>
                    </button>

                    <button
                      type="button"
                      id="btn-goto-step-3"
                      onClick={() => {
                        const step3Element = document.getElementById(
                          "step-3-contact-section",
                        );
                        if (step3Element) {
                          step3Element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        slot1Choice && slot2Choice && slot3Choice
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}
                    >
                      <span>
                        כל 3 החוגים נבחרו! המשך למילוי פרטי הורים וסיום
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Parent Contact Details & Submission */}
          <div
            id="step-3-contact-section"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  פרטי התקשרות עם ההורה וסיום
                </h3>
                <p className="text-xs text-slate-500">
                  נא למלא פרטי טלפון ודוא"ל לקבלת אישור הרישום והודעות שוטפות
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  שם מלא של ההורה *
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  טלפון נייד (וואטסאפ) *
                </label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="050-1234567"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  דואר אלקטרוני
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                הערות מיוחדות / בקשות לרכזת (אופציונלי)
              </label>
              <textarea
                rows={2}
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                placeholder="אם יש רגישות רפואית או הערה חשובה לצוות..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Bottom Summary Check */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 space-y-0.5 text-right w-full sm:w-auto">
                <span className="font-bold text-slate-900 block">
                  סיכום הבחירה ליום שישי:
                </span>
                <span>
                  חוג 1:{" "}
                  <strong>
                    {activities.find((a) => a.id === slot1Choice)?.name ||
                      "טרם נבחר"}
                  </strong>{" "}
                  | חוג 2:{" "}
                  <strong>
                    {activities.find((a) => a.id === slot2Choice)?.name ||
                      "טרם נבחר"}
                  </strong>{" "}
                  | חוג 3:{" "}
                  <strong>
                    {activities.find((a) => a.id === slot3Choice)?.name ||
                      "טרם נבחר"}
                  </strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting || !slot1Choice || !slot2Choice || !slot3Choice
                }
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 ${
                  slot1Choice && slot2Choice && slot3Choice
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                {isSubmitting
                  ? "שומר רישום ומשבץ..."
                  : "שליחת טופס רישום ל-3 החוגים"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Pop-up Modal: Confirm Slot Choice & Transition to Next Hour */}
      {slotConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCancelSlotSelection}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCancelSlotSelection}
              className="absolute top-5 left-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Slot Badge */}
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0 ${
                  slotConfirmModal.slotNumber === 1
                    ? "bg-indigo-600"
                    : slotConfirmModal.slotNumber === 2
                      ? "bg-purple-600"
                      : "bg-teal-600"
                }`}
              >
                {slotConfirmModal.slotNumber}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {slotConfirmModal.slotNumber === 1
                    ? "שעה ראשונה"
                    : slotConfirmModal.slotNumber === 2
                      ? "שעה שניה"
                      : "שעה שלישית"}{" "}
                  ({getSlotTiming(slotConfirmModal.slotNumber)})
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  אישור בחירת חוג
                </h3>
              </div>
            </div>

            {/* Selected Activity Details Card */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                    {slotConfirmModal.activity.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {slotConfirmModal.activity.instructor}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {slotConfirmModal.activity.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-indigo-700 font-bold">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {slotConfirmModal.activity.startTime}
                    </span>
                  </div>
                </div>

                {slotConfirmModal.activity.imageUrl && (
                  <img
                    src={slotConfirmModal.activity.imageUrl}
                    alt={slotConfirmModal.activity.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-xs"
                  />
                )}
              </div>

              {/* Special Note for 2-hour Molecular Cooking */}
              {slotConfirmModal.slotNumber === 2 &&
                isMolecularCookingActivity(slotConfirmModal.activity) && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                    <Utensils className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>שימו לב:</strong> חוג בישול מולקולרי נמשך שעתיים
                      רצופות (שעה שניה ושלישית). בחירתו תשבץ אוטומטית גם את השעה
                      השלישית.
                    </div>
                  </div>
                )}

              {/* Replacement Note */}
              {slotConfirmModal.isReplacement &&
                slotConfirmModal.replacedActivityName && (
                  <div className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      חוג זה יחליף את החוג שנבחר קודם לשעה זו:{" "}
                      <strong>{slotConfirmModal.replacedActivityName}</strong>
                    </span>
                  </div>
                )}
            </div>

            {/* Confirmation Question */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center sm:text-right">
              <p className="text-sm sm:text-base font-black text-indigo-950">
                {`מאשר/ת את בחירת "${slotConfirmModal.activity.name}" לשעה ${
                  slotConfirmModal.slotNumber === 1
                    ? "הראשונה"
                    : slotConfirmModal.slotNumber === 2
                      ? "השניה"
                      : "השלישית"
                }?`}
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                בלחיצה על 'כן', החוג יישמר למשבצת זו והמערכת תעביר אתכם מיד לשלב
                הבא.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleConfirmSlotSelection}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>
                  {slotConfirmModal.slotNumber === 1
                    ? "כן, ועבור לשעה השניה"
                    : slotConfirmModal.slotNumber === 2
                      ? isMolecularCookingActivity(slotConfirmModal.activity)
                        ? "כן, ועבור למילוי פרטים וסיום"
                        : "כן, ועבור לשעה השלישית"
                      : "כן, ועבור לפרטי הורה וסיום"}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCancelSlotSelection}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                לא, בטל
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
