import React, { useState, useEffect } from "react";
import { useSchool } from "../../context/SchoolContext";
import { Placement, PlacementStatus } from "../../types";
import {
  X,
  Check,
  Save,
  ArrowRightLeft,
  UserCheck,
  AlertCircle,
} from "lucide-react";

interface ManualPlacementModalProps {
  isOpen: boolean;
  placement: Placement | null;
  onClose: () => void;
  onSave: (
    studentId: string,
    slotNumber: 1 | 2 | 3,
    activityId: string | null,
    status: PlacementStatus,
    notes: string,
  ) => void;
}

export const ManualPlacementModal: React.FC<ManualPlacementModalProps> = ({
  isOpen,
  placement,
  onClose,
  onSave,
}) => {
  const { activities, registrations } = useSchool();
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [status, setStatus] = useState<PlacementStatus>("placed");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (placement) {
      setSelectedActivityId(placement.placedActivityId || "");
      setStatus(placement.status);
      setNotes(placement.placementNotes || 'התערבות ידנית ע"י מנהל/רכזת');
    }
  }, [placement, isOpen]);

  if (!isOpen || !placement) return null;

  const currentReg = registrations.find(
    (r) => r.studentId === placement.studentId,
  );
  const slotActivities = activities.filter(
    (a) => a.slotNumber === placement.slotNumber,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      placement.studentId,
      placement.slotNumber,
      status === "placed" ? selectedActivityId || null : null,
      status,
      notes,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                התערבות ושיבוץ ידני (משבצת {placement.slotNumber})
              </h3>
              <p className="text-xs text-slate-300">
                עבור {placement.studentName} ({placement.grade}) • ת.ז:{" "}
                {placement.studentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Parent Registered Preferences Reference */}
          {currentReg && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-700">
                עדיפויות ההורה למשבצת {placement.slotNumber}:
              </div>
              <div className="text-slate-600">
                • בחירה ראשית:{" "}
                <strong>
                  {activities.find(
                    (a) =>
                      a.id ===
                      (placement.slotNumber === 1
                        ? currentReg.slot1Choice
                        : placement.slotNumber === 2
                          ? currentReg.slot2Choice
                          : currentReg.slot3Choice),
                  )?.name || "לא נבחר"}
                </strong>
              </div>
              <div className="text-slate-600">
                • עדיפות חלופית:{" "}
                <strong>
                  {activities.find(
                    (a) =>
                      a.id ===
                      (placement.slotNumber === 1
                        ? currentReg.slot1Backup
                        : placement.slotNumber === 2
                          ? currentReg.slot2Backup
                          : currentReg.slot3Backup),
                  )?.name || "אין"}
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              סטטוס שיבוץ למשבצת {placement.slotNumber}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlacementStatus)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              <option value="placed">שובץ לחוג (מאושר)</option>
              <option value="waitlist">רשימת המתנה</option>
              <option value="unplaced">לא שובץ</option>
              <option value="rejected">אי-זכאות / נדחה</option>
            </select>
          </div>

          {status === "placed" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                חוג לשיבוץ (משבצת {placement.slotNumber}) *
              </label>
              <select
                required
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium"
              >
                <option value="">-- בחר חוג למשבצת זו --</option>
                {slotActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.startTime || (a.slotNumber === 1 ? "שעה ראשונה" : a.slotNumber === 2 ? "שעה שניה" : "שעה שלישית")} • {a.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              סיבת ההעברה / הערת מנהל
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="סיבת השינוי הידני..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              אישור ושמירה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
