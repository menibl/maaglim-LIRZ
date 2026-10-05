import React, { useState } from "react";
import { Registration, Activity } from "../../types";
import { resolveActivityDisplay } from "../../utils/activityResolver";
import { X, Save, AlertTriangle, CheckCircle2 } from "lucide-react";

interface RegistrationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration;
  activities: Activity[];
  onSave: (updatedReg: Registration) => void;
}

export const RegistrationEditModal: React.FC<RegistrationEditModalProps> = ({
  isOpen,
  onClose,
  registration,
  activities,
  onSave,
}) => {
  const [slot1, setSlot1] = useState(registration.slot1Choice);
  const [slot2, setSlot2] = useState(registration.slot2Choice);
  const [slot3, setSlot3] = useState(registration.slot3Choice);
  const [notes, setNotes] = useState(registration.notes || "");

  if (!isOpen) return null;

  const slot1Acts = activities.filter((a) => a.slotNumber === 1);
  const slot2Acts = activities.filter((a) => a.slotNumber === 2);
  const slot3Acts = activities.filter((a) => a.slotNumber === 3);

  const res1 = resolveActivityDisplay(slot1, activities);
  const res2 = resolveActivityDisplay(slot2, activities);
  const res3 = resolveActivityDisplay(slot3, activities);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...registration,
      slot1Choice: slot1,
      slot2Choice: slot2,
      slot3Choice: slot3,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right space-y-6 relative max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <span>עריכת שיבוץ ורישום חוגים</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {registration.studentName} ({registration.studentGrade})
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            ת.ז: {registration.studentId} • הורה: {registration.parentName} ({registration.parentPhone})
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Slot 1 */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-indigo-900">
                שעה ראשונה (08:30)
              </label>
              {res1.isDiscontinued && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>החוג הוסר / לא זמין בשעה זו</span>
                </span>
              )}
            </div>
            <select
              value={slot1}
              onChange={(e) => setSlot1(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {!slot1Acts.some((a) => a.id === slot1) && (
                <option value={slot1}>
                  ⚠️ {res1.name} (חוג שהוסר / שונה)
                </option>
              )}
              {slot1Acts.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} {act.instructor ? `(${act.instructor})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Slot 2 */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-900">
                שעה שניה (10:30)
              </label>
              {res2.isDiscontinued && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>החוג הוסר / לא זמין בשעה זו</span>
                </span>
              )}
            </div>
            <select
              value={slot2}
              onChange={(e) => setSlot2(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {!slot2Acts.some((a) => a.id === slot2) && (
                <option value={slot2}>
                  ⚠️ {res2.name} (חוג שהוסר / שונה)
                </option>
              )}
              {slot2Acts.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} {act.instructor ? `(${act.instructor})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Slot 3 */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-900">
                שעה שלישית (11:30)
              </label>
              {res3.isDiscontinued && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>החוג הוסר / לא זמין בשעה זו</span>
                </span>
              )}
            </div>
            <select
              value={slot3}
              onChange={(e) => setSlot3(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {!slot3Acts.some((a) => a.id === slot3) && (
                <option value={slot3}>
                  ⚠️ {res3.name} (חוג שהוסר / שונה)
                </option>
              )}
              {slot3Acts.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} {act.instructor ? `(${act.instructor})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">הערות שיבוץ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות או בקשות שיבוץ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>שמור ועדכן שיבוץ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
