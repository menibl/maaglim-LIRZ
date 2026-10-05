import React from "react";
import { useSchool } from "../context/SchoolContext";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageCircle,
  X,
  ShieldAlert,
  Sparkles,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const CoordinatorContactModal: React.FC = () => {
  const {
    currentSchool,
    coordinator,
    isContactModalOpen,
    setIsContactModalOpen,
  } = useSchool();

  if (!isContactModalOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `שלום ${coordinator.name}, פונה לגבי רישום חוגים ב${currentSchool.name}.`,
  );
  const whatsappUrl = coordinator.whatsapp
    ? `https://wa.me/${coordinator.whatsapp.replace(/\D/g, "")}?text=${whatsappMessage}`
    : undefined;

  return (
    <AnimatePresence>
      <div
        id="coordinator-contact-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        onClick={() => setIsContactModalOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          id="coordinator-contact-card"
          className="relative w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-l from-indigo-600 to-blue-700 p-6 text-white relative">
            <button
              id="btn-close-coordinator-modal"
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 left-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Building className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                <div className="text-xs font-medium text-indigo-200 tracking-wide">
                  רכזת חוגים ואחראית מוסדית
                </div>
                <h3 className="text-xl font-bold text-white">
                  {coordinator.name}
                </h3>
                <p className="text-sm text-indigo-100">
                  {currentSchool.name} ({currentSchool.city})
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100/80 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
                <span className="font-semibold">{coordinator.role}:</span> בכל
                שאלה בנוגע לזכאות תלמידים, שינוי עדיפויות, התאמות פרטניות או
                תשלומים – ניתן ליצור קשר ישיר.
              </div>
            </div>

            {/* Contact details list */}
            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      טלפון ישיר
                    </div>
                    <div className="text-sm font-bold text-slate-800 dir-ltr text-right">
                      {coordinator.phone}
                    </div>
                  </div>
                </div>
                <a
                  id="btn-call-coordinator"
                  href={`tel:${coordinator.phone}`}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  התקשר עכשיו
                </a>
              </div>

              {/* WhatsApp */}
              {whatsappUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-emerald-800 font-medium">
                        מענה מהיר בוואטסאפ
                      </div>
                      <div className="text-sm font-bold text-emerald-950 dir-ltr text-right">
                        {coordinator.phone}
                      </div>
                    </div>
                  </div>
                  <a
                    id="btn-whatsapp-coordinator"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>פתח צ'אט</span>
                  </a>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs text-slate-500 font-medium">
                      דואר אלקטרוני
                    </div>
                    <div className="text-sm font-semibold text-slate-800 truncate dir-ltr text-right">
                      {coordinator.email}
                    </div>
                  </div>
                </div>
                <a
                  id="btn-email-coordinator"
                  href={`mailto:${coordinator.email}?subject=${encodeURIComponent(`פנייה בנושא חוגים - ${currentSchool.name}`)}`}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors shrink-0"
                >
                  שלח מייל
                </a>
              </div>

              {/* Reception Hours */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    שעות קבלת קהל ומענה טלפוני
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {coordinator.receptionHours}
                  </div>
                </div>
              </div>

              {/* Location */}
              {coordinator.location && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      מיקום בבית הספר
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {coordinator.location}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            {coordinator.notes && (
              <div className="text-xs text-slate-500 bg-slate-100/80 rounded-lg p-2.5 text-center">
                💬 {coordinator.notes}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              id="btn-dismiss-coordinator-modal"
              onClick={() => setIsContactModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              סגור
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
