import React, { useState, useEffect, useMemo } from "react";
import { useSchool } from "../../context/SchoolContext";
import { Student, Activity, Placement } from "../../types";
import { SchoolData } from "../../data/initialData";
import { resolveActivityDisplay } from "../../utils/activityResolver";
import {
  CalendarCheck,
  Search,
  Clock,
  MapPin,
  User,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  PhoneCall,
  Download,
  Info,
  Calendar,
  School as SchoolIcon,
} from "lucide-react";
import { motion } from "motion/react";

interface StudentTimetableViewProps {
  initialStudentId?: string;
  onGoToRegistration: () => void;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({
  initialStudentId,
  onGoToRegistration,
}) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    coordinator,
    students,
    activities,
    placements,
    registrations,
    selectSchool,
    setIsContactModalOpen,
  } = useSchool();
  const [searchId, setSearchId] = useState(initialStudentId || "");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);
  const [schoolSwitchedNotice, setSchoolSwitchedNotice] = useState<string | null>(
    null,
  );

  const matchStudentById = (s: Student, query: string) => {
    const raw = query.trim();
    if (s.id.trim() === raw) return true;
    const cleanQuery = raw.replace(/[^\d]/g, "");
    const sDigits = s.id.replace(/[^\d]/g, "");
    if (cleanQuery && sDigits) {
      if (sDigits === cleanQuery) return true;
      if (sDigits.padStart(9, "0") === cleanQuery.padStart(9, "0")) return true;
    }
    return false;
  };

  useEffect(() => {
    if (initialStudentId) {
      setSearchId(initialStudentId);
      let student = students.find((s) => matchStudentById(s, initialStudentId));
      if (!student) {
        for (const [sId, sData] of Object.entries(schools) as [string, SchoolData][]) {
          if (sId === currentSchoolId) continue;
          const found = sData.students.find((s) =>
            matchStudentById(s, initialStudentId),
          );
          if (found) {
            student = found;
            selectSchool(sId);
            break;
          }
        }
      }
      if (student) {
        setSelectedStudent(student);
      }
    }
  }, [initialStudentId, students, schools, currentSchoolId, selectSchool]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim();
    if (!cleanId) return;

    let student = students.find((s) => matchStudentById(s, cleanId));
    let matchedSchool = currentSchool;

    if (!student) {
      for (const [sId, sData] of Object.entries(schools) as [string, SchoolData][]) {
        if (sId === currentSchoolId) continue;
        const found = sData.students.find((s) => matchStudentById(s, cleanId));
        if (found) {
          student = found;
          matchedSchool = sData.school;
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

    if (student) {
      setSelectedStudent(student);
      setNotFoundMessage(null);
    } else {
      setSelectedStudent(null);
      setSchoolSwitchedNotice(null);
      setNotFoundMessage(
        `תעודת הזהות ${cleanId} לא נמצאה ברשימת התלמידים הזכאים באף אחד מבתי הספר במערכת (בן שמן, לפיד המ"ד, יצחק נבון).`,
      );
    }
  };

  const studentPlacements = useMemo(() => {
    if (!selectedStudent) return [];
    return placements.filter((p) => p.studentId === selectedStudent.id);
  }, [selectedStudent, placements]);

  const currentRegistration = useMemo(() => {
    if (!selectedStudent) return undefined;
    return registrations.find((r) => r.studentId === selectedStudent.id);
  }, [selectedStudent, registrations]);

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

  const getSlotPlacement = (slotNum: 1 | 2 | 3) => {
    return studentPlacements.find((p) => p.slotNumber === slotNum);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              מערכת שעות ליום שישי
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>מערכת חוגי יום שישי</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              צפייה בשעות ובמיקומים של חוגי שישי המשובצים לתלמיד/ה
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedStudent && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>הדפסת כרטיס שעות</span>
              </button>
            )}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>רכזת: {coordinator.name}</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-lookup-student-id"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="הזינו תעודת זהות של התלמיד/ה לאיתור מערכת השעות..."
              className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-medium"
            />
          </div>
          <button
            id="btn-lookup-student"
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-xs"
          >
            איתור מערכת שעות
          </button>
        </form>

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

        {notFoundMessage && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{notFoundMessage}</span>
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            לשמירה על פרטיות המידע, כל תלמיד והורה מזינים תעודת זהות וצופים
            באופן מאובטח במערכת השעות האישית בלבד.
          </span>
        </div>
      </div>

      {/* When no student is searched yet */}
      {!selectedStudent && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            הזינו תעודת זהות לצפייה במערכת השעות האישית
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            המערכת תציג את חוגי יום שישי שבהם שובץ התלמיד/ה, כולל שעות
            הפעילות, המיקום והמדריכים.
          </p>
        </div>
      )}

      {/* When student is selected */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Student Profile Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                {selectedStudent.firstName[0]}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span>
                    ת.ז.{" "}
                    <strong className="font-mono text-slate-800">
                      {selectedStudent.id}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    כיתה{" "}
                    <strong className="text-indigo-700">
                      {selectedStudent.grade}
                    </strong>
                  </span>
                  {selectedStudent.settlement && (
                    <>
                      <span>•</span>
                      <span>
                        יישוב:{" "}
                        <strong className="text-slate-800">
                          {selectedStudent.settlement}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                רשום לתוכנית חוגי שישי תשפ"ז
              </span>
            </div>
          </div>

          {/* Timetable Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>מערכת חוגי יום שישי</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                עלות קבועה ואחידה לכל 3 החוגים
              </span>
            </div>

            {/* 3 Friday Slots Schedule Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((slotNum) => {
                const slotLabel =
                  slotNum === 1
                    ? "שעה ראשונה"
                    : slotNum === 2
                      ? "שעה שניה"
                      : "שעה שלישית";
                const placement = getSlotPlacement(slotNum as 1 | 2 | 3);
                const resolved = placement?.placedActivityId
                  ? resolveActivityDisplay(placement.placedActivityId, activities)
                  : undefined;
                const activity: Activity | undefined = resolved?.matchedActivity || (resolved ? {
                  id: resolved.id,
                  name: resolved.name,
                  category: "enrichment" as any,
                  slotNumber: slotNum as any,
                  startTime: slotLabel,
                  endTime: "",
                  location: currentSchool.name,
                  instructor: coordinator.name,
                  maxCapacity: 20,
                  minCapacity: 5,
                  allowedGrades: ["א", "ב", "ג", "ד", "ה"],
                  day: "שישי",
                  description: "",
                  status: "active" as const,
                } : undefined);
                const isWaitlist = placement?.status === "waitlist";

                return (
                  <div
                    key={slotNum}
                    className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                      activity
                        ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10"
                        : isWaitlist
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-slate-50 border-dashed border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Slot Header Banner */}
                      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-500 text-white text-xs font-black flex items-center justify-center">
                            {slotNum}
                          </span>
                          <span className="text-xs font-bold">{slotLabel}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-300">
                          <Clock className="w-3.5 h-3.5" />
                          {activity?.startTime || slotLabel}
                        </div>
                      </div>

                      {/* Card Image / Preview */}
                      {activity?.imageUrl && (
                        <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                          <img
                            src={activity.imageUrl}
                            alt={activity.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-2 right-3 left-3 text-white text-xs font-bold drop-shadow-md truncate">
                            {activity.category}
                          </div>
                        </div>
                      )}

                      {/* Content Details: Focus on Time & Location */}
                      <div className="p-4 space-y-3">
                        {activity ? (
                          <>
                            <h4 className="text-base font-black text-slate-900 leading-snug">
                              {activity.name}
                            </h4>

                            {/* Location & Time highlight */}
                            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-2 font-bold text-indigo-900">
                                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>
                                  מועד: {activity.startTime || slotLabel}
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-slate-700">
                                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                <span>
                                  מיקום: <strong>{activity.location}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Instructor & Status */}
                            <div className="pt-1 flex items-center justify-between text-xs">
                              <span className="text-slate-600 flex items-center gap-1 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                מדריך/ה: {activity.instructor}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                משובץ ✓
                              </span>
                            </div>
                          </>
                        ) : isWaitlist ? (
                          <div className="py-6 text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                              <Hourglass className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-amber-900">
                              ברשימת המתנה
                            </h4>
                            <p className="text-xs text-amber-700">
                              מיקום ברשימה: מקום{" "}
                              {placement?.waitlistPosition || 1}
                            </p>
                          </div>
                        ) : (
                          <div className="py-8 text-center space-y-2 text-slate-400">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold">
                              טרם שובץ חוג לשעה זו
                            </p>
                            <button
                              onClick={onGoToRegistration}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                            >
                              מעבר לטופס רישום
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom slot status footer */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>יום שישי</span>
                      <span className="font-semibold text-slate-700">
                        {slotLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Summary & Coordinator Contact */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>הנחיות חשובות להגעה לפעילות</span>
              <span className="text-xs text-indigo-600 font-semibold">
                {currentSchool.name}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">
                  זמני התייצבות
                </span>
                <p>
                  מומלץ להגיע 10 דקות לפני תחילת השיעור הראשון (08:20) לצורך
                  התארגנות בכיתות.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">
                  ציוד נדרש
                </span>
                <p>
                  בקבוק מים אישי, ארוחת בוקר קלה להפסקות בין השיעורים, ונעלי
                  ספורט לחוגי תנועה.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block">
                  שאלות ובירורים
                </span>
                <p>
                  רכזת התוכנית: {coordinator.name} ({coordinator.phone}) זמינה
                  בימי שישי לאורך כל שעות הפעילות.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
