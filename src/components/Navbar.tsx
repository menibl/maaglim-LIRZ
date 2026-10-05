import React from "react";
import { useSchool } from "../context/SchoolContext";
import { MaagalimLogo } from "./MaagalimLogo";
import {
  School as SchoolIcon,
  UserCheck,
  Calendar,
  LayoutDashboard,
  PhoneCall,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  currentView: "register" | "timetable" | "admin";
  onViewChange: (view: "register" | "timetable" | "admin") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
}) => {
  const {
    schools,
    currentSchoolId,
    currentSchool,
    coordinator,
    selectSchool,
    setIsContactModalOpen,
  } = useSchool();

  const navItems = [
    {
      id: "register" as const,
      label: "טופס רישום",
      shortLabel: "רישום לחוגים",
      icon: UserCheck,
      badge: currentSchool.isOpenForRegistration ? "פתוח" : "סגור",
    },
    {
      id: "timetable" as const,
      label: "מערכת שעות לתלמיד",
      shortLabel: "מערכת שעות",
      icon: Calendar,
      badge: null,
    },
    {
      id: "admin" as const,
      label: "ממשק ניהול",
      shortLabel: "ניהול מערכת",
      icon: LayoutDashboard,
      badge: null,
    },
  ];

  return (
    <>
      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Row: Logo, School Selector & Contact */}
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            {/* Right Brand with Ma'agalim Logo & School Selector */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
              <MaagalimLogo />

              {/* School / Center Selector Dropdown */}
              <div className="relative shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-xl px-2 sm:px-3 py-1.5 border border-slate-200 shadow-2xs">
                  <SchoolIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
                  <select
                    id="select-school-dropdown"
                    value={currentSchoolId}
                    onChange={(e) => selectSchool(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-sm font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[105px] xs:max-w-[130px] sm:max-w-[200px] truncate"
                    aria-label="בחר בית ספר"
                  >
                    {Object.values(schools).map(({ school, registrations: scRegs }) => (
                      <option
                        key={school.id}
                        value={school.id}
                        className="text-slate-800 bg-white font-medium py-1"
                      >
                        {school.name} ({scRegs?.length || 0} נרשמים)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 pointer-events-none shrink-0" />
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Center Navigation Tabs (hidden on mobile, shown on md+) */}
            <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Left Actions: Coordinator Contact Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                id="btn-open-coordinator-contact"
                onClick={() => setIsContactModalOpen(true)}
                className="group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all"
                title={`יצירת קשר עם רכזת ${currentSchool.name}`}
              >
                <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  רכזת: {coordinator.name}
                </span>
                <span className="sm:hidden text-[11px] font-semibold">
                  רכזת
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse hidden md:inline-block" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar - Ergonomic 1-Handed Touch Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 pt-2 pb-3 safe-area-bottom no-print">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-bottom-nav-${item.id}`}
                onClick={() => {
                  onViewChange(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all active:scale-95 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
                />
                <span className="text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap">
                  {item.shortLabel}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
