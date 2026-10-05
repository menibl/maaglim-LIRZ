import React, { useState, useEffect } from "react";
import { Activity, ActivityCategory, FridayTimeSlot } from "../../types";
import {
  X,
  Save,
  BookOpen,
  Clock,
  Users,
  MapPin,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useSchool } from "../../context/SchoolContext";

interface ActivityEditModalProps {
  isOpen: boolean;
  activity: Activity | null; // null for new
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

const ALL_GRADES = ["א", "ב", "ג", "ד", "ה", "ו"];

const PRESET_IMAGES: { label: string; url: string }[] = [
  {
    label: "אמנות וציור",
    url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "רובוטיקה ולגו",
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "בינה מלאכותית וקוד",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "בישול וקולינריה",
    url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "אפייה וקונדיטוריה",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "אסטרונומיה וחלל",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "ספורט וכדורגל",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "הגנה עצמית וקרב מגע",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "נגרות ומלאכת עץ",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "הדפסה בתלת מימד",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "מדענים צעירים ומעבדה",
    url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "תיאטרון ודרמה",
    url: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "שחמט וחשיבה",
    url: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "עיצוב תכשיטים ואופנה",
    url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "אנימציה ויוטיוב",
    url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
  },
];

export const ActivityEditModal: React.FC<ActivityEditModalProps> = ({
  isOpen,
  activity,
  onClose,
  onSave,
}) => {
  const { currentSchool } = useSchool();
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

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("technology");
  const [allowedGrades, setAllowedGrades] = useState<string[]>(["א", "ב", "ג"]);
  const [slotNumber, setSlotNumber] = useState<1 | 2 | 3>(1);
  const [startTime, setStartTime] = useState("שעה ראשונה");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [instructor, setInstructor] = useState("");
  const [instructorPhone, setInstructorPhone] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [minCapacity, setMinCapacity] = useState(8);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (activity) {
      setId(activity.id);
      setName(activity.name);
      setCategory(activity.category);
      setAllowedGrades(activity.allowedGrades);
      const sNum = activity.slotNumber || 1;
      setSlotNumber(sNum);
      const cleanSlot =
        activity.startTime?.includes("שלישית")
          ? "שעה שניה ושלישית"
          : sNum === 1
            ? "שעה ראשונה"
            : sNum === 2
              ? "שעה שניה"
              : "שעה שלישית";
      setStartTime(cleanSlot);
      setEndTime("");
      setLocation(activity.location);
      setInstructor(activity.instructor);
      setInstructorPhone(activity.instructorPhone || "");
      setMaxCapacity(activity.maxCapacity || 20);
      setMinCapacity(activity.minCapacity || 8);
      setDescription(activity.description);
      setImageUrl(activity.imageUrl || "");
    } else {
      setId(`ACT-MG-${Math.floor(100 + Math.random() * 900)}`);
      setName("");
      setCategory("technology");
      setAllowedGrades(["א", "ב", "ג"]);
      setSlotNumber(1);
      setStartTime("שעה ראשונה");
      setEndTime("");
      setLocation("מעגלים (מוקד בן שמן)");
      setInstructor("");
      setInstructorPhone("");
      setMaxCapacity(20);
      setMinCapacity(8);
      setDescription("");
      setImageUrl(PRESET_IMAGES[0].url);
    }
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSlotChange = (newSlot: 1 | 2 | 3) => {
    setSlotNumber(newSlot);
    const cleanSlotName =
      newSlot === 1
        ? "שעה ראשונה"
        : newSlot === 2
          ? "שעה שניה"
          : "שעה שלישית";
    setStartTime(cleanSlotName);
    setEndTime("");
  };

  const toggleGrade = (grade: string) => {
    if (allowedGrades.includes(grade)) {
      if (allowedGrades.length > 1) {
        setAllowedGrades(allowedGrades.filter((g) => g !== grade));
      }
    } else {
      setAllowedGrades([...allowedGrades, grade]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instructor.trim()) {
      alert("נא למלא שם חוג ושם מדריך/ה.");
      return;
    }

    onSave({
      id: id.trim(),
      name: name.trim(),
      category,
      allowedGrades,
      day: "שישי",
      slotNumber,
      startTime,
      endTime,
      location: location.trim() || "מעגלים",
      instructor: instructor.trim(),
      instructorPhone: instructorPhone.trim() || undefined,
      maxCapacity: Number(maxCapacity) || 20,
      minCapacity: Number(minCapacity) || 8,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      status: "active",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {activity ? "עריכת חוג, תמונה ותיאור" : "הוספת חוג שישי חדש"}
              </h3>
              <p className="text-xs text-slate-300">
                יום שישי בלבד (שעה ומיקום)
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
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שם החוג *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: בינה מלאכותית ורובוטיקה"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                תחום / קטגוריה
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ActivityCategory)
                }
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="technology">טכנולוגיה ו-AI</option>
                <option value="arts">אמנות ועיצוב</option>
                <option value="sciences">מדעים וחלל</option>
                <option value="culinary">בישול ואפייה</option>
                <option value="sports">ספורט והגנה עצמית</option>
                <option value="enrichment">העשרה ונגרות</option>
                <option value="music">מוזיקה ובמה</option>
              </select>
            </div>
          </div>

          {/* Time Slot Selector */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <label className="block text-xs font-bold text-indigo-950">
              משבצת זמן ליום שישי *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((slotNum) => {
                const s = fridaySlots.find(
                  (slot) => slot.slotNumber === slotNum,
                );
                const isSelected = slotNumber === slotNum;
                return (
                  <button
                    type="button"
                    key={slotNum}
                    onClick={() => handleSlotChange(slotNum as 1 | 2 | 3)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50 font-medium"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {slotNum === 1 ? "שעה ראשונה" : slotNum === 2 ? "שעה שניה" : "שעה שלישית"}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      משבצת {slotNum}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>מועד החוג:</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-black">
                  {startTime || (slotNumber === 1 ? "שעה ראשונה" : slotNumber === 2 ? "שעה שניה" : "שעה שלישית")}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                החוגים פועלים לפי שעות (שעה ראשונה, שניה ושלישית) ללא שעון מספרי
              </span>
            </div>
          </div>

          {/* Location & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                מיקום החוג (חדר / מוקד) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="סטודיו לאומנות (מוקד בן שמן)"
                  className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שם המדריך/ה *
              </label>
              <input
                type="text"
                required
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="ענת שמיר"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Allowed Grades */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              שכבות גיל מורשות (א' עד ו')
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_GRADES.map((grade) => {
                const isSelected = allowedGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {grade}'
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                מכסת מקסימום (ברירת מחדל 20)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                רף מינימום לפתיחה (ברירת מחדל 8)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={minCapacity}
                onChange={(e) => setMinCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              תיאור החוג (מוצג להורים בעת בחירת העדיפויות)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטו את תכני החוג, מטרות, פעילויות מעשיות והתנסויות..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Image URL & Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              תמונת החוג (קישור או בחירה מתוך מאגר מומלץ)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-left"
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={imageUrl}
                    alt="תצוגה מקדימה"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Quick preset selector */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-semibold self-center">
                תמונות מהירות:
              </span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                    imageUrl === preset.url
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              שמירת שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
