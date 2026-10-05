import React, { useState, useEffect } from "react";
import { Student } from "../../types";
import { X, UserPlus, Save, ShieldCheck, ShieldAlert } from "lucide-react";

interface StudentEditModalProps {
  isOpen: boolean;
  student: Student | null; // null for adding new
  onClose: () => void;
  onSave: (student: Student) => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  student,
  onClose,
  onSave,
}) => {
  const [id, setId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("א'1");
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  useEffect(() => {
    if (student) {
      setId(student.id);
      setFirstName(student.firstName);
      setLastName(student.lastName);
      setGrade(student.grade);
      setIsAuthorized(student.isAuthorized);
      setParentName(student.parentName || "");
      setParentPhone(student.parentPhone || "");
      setParentEmail(student.parentEmail || "");
      setSpecialNotes(student.specialNotes || "");
    } else {
      setId("");
      setFirstName("");
      setLastName("");
      setGrade("א'1");
      setIsAuthorized(true);
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setSpecialNotes("");
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !firstName.trim() || !lastName.trim()) {
      alert("נא למלא תעודת זהות, שם פרטי ושם משפחה.");
      return;
    }

    const gradeLayer = grade.replace(/[^א-ט]/g, "") || "א";

    onSave({
      id: id.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      grade: grade.trim(),
      gradeLayer,
      isAuthorized,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      parentEmail: parentEmail.trim() || undefined,
      specialNotes: specialNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {student ? "עריכת פרטי תלמיד זכאי" : "הוספת תלמיד זכאי חדש"}
              </h3>
              <p className="text-xs text-slate-300">טבלת Eligible_Students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                תעודת זהות / מזהה ייחודי *
              </label>
              <input
                type="text"
                required
                disabled={!!student}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="201234567"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                כיתה (לדוגמה: א'1, ג'2) *
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="א'1"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שם פרטי *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="שם פרטי"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שם משפחה *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="שם משפחה"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Authorization Status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAuthorized ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-800">
                  אישור הרשמה למערכת
                </div>
                <div className="text-[11px] text-slate-500">
                  האם התלמיד מורשה לבצע רישום ושיבוץ
                </div>
              </div>
            </div>

            <select
              value={isAuthorized ? "true" : "false"}
              onChange={(e) => setIsAuthorized(e.target.value === "true")}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="true">מאושר להרשמה</option>
              <option value="false">חסום / ממתין לאישור</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                שם הורה
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                טלפון הורה
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                דוא"ל הורה
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              הערות מיוחדות / זכאות להנחה
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="לדוגמה: הנחת אחים, שילוב כיתתי..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>שמור תלמיד</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
