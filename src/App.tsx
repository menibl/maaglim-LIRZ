import React, { useState } from "react";
import { SchoolProvider, useSchool } from "./context/SchoolContext";
import { Navbar } from "./components/Navbar";
import { ParentRegistrationView } from "./components/parent/ParentRegistrationView";
import { StudentTimetableView } from "./components/parent/StudentTimetableView";
import { AdminDashboardView } from "./components/admin/AdminDashboardView";
import { CoordinatorContactModal } from "./components/CoordinatorContactModal";
import { MaagalimLogo } from "./components/MaagalimLogo";
import {
  BookOpen,
  ShieldCheck,
  Heart,
  FileSpreadsheet,
  PhoneCall,
} from "lucide-react";

const MainAppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "register" | "timetable" | "admin"
  >("register");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { currentSchool, coordinator, setIsContactModalOpen } = useSchool();

  const handleRegistrationComplete = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView("timetable");
  };

  return (
    <div
      className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24 md:pb-0"
      dir="rtl"
    >
      {/* Sticky Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === "register" && (
          <ParentRegistrationView
            onRegistrationComplete={handleRegistrationComplete}
            onNavigateToTimetable={() => setCurrentView("timetable")}
          />
        )}

        {currentView === "timetable" && (
          <StudentTimetableView
            initialStudentId={selectedStudentId}
            onGoToRegistration={() => setCurrentView("register")}
          />
        )}

        {currentView === "admin" && <AdminDashboardView />}
      </main>

      {/* Coordinator Contact Modal */}
      <CoordinatorContactModal />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MaagalimLogo variant="compact" />
            <div className="border-r border-slate-200 pr-3 mr-1">
              <div className="font-bold text-slate-800">
                החברה לחינוך, תרבות ופנאי בחבל מודיעין
              </div>
              <div className="text-[11px] text-slate-400">
                מעגלים • חוגי שישי ביה"ס של העתיד
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>יצירת קשר עם רכזת ({coordinator.name})</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setCurrentView("admin")}
              className="hover:text-slate-800 transition-colors"
            >
              ניהול מוסדי
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setCurrentView("timetable")}
              className="hover:text-slate-800 transition-colors"
            >
              בדיקת שיבוץ ומערכת
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <MainAppContent />
    </SchoolProvider>
  );
}
