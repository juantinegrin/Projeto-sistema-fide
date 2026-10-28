import React from 'react';
import {
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
  FileCode2,
  Bell,
  Sparkles,
  School,
  CheckCircle2,
} from 'lucide-react';

export type ActiveTab = 'SCHEDULE' | 'PEOPLE' | 'PEDAGOGICAL' | 'FINANCIAL' | 'STUDENT_PORTAL' | 'ARCHITECTURE';
export type UserViewRole = 'ADMIN' | 'STUDENT';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserViewRole;
  setUserRole: (role: UserViewRole) => void;
  overdueInvoicesCount: number;
  availableCreditsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  overdueInvoicesCount,
  availableCreditsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Banner with Academy Brand and Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
              <School className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                  Sonata ERP
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Emusys Core
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Conservatório Villa-Lobos de Música & Artes
              </p>
            </div>
          </div>

          {/* Quick Info & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Notification Badge */}
            {overdueInvoicesCount > 0 && (
              <button
                onClick={() => setActiveTab('FINANCIAL')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                title={`${overdueInvoicesCount} mensalidades vencidas no mês`}
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span>{overdueInvoicesCount} Vencidas</span>
              </button>
            )}

            {availableCreditsCount > 0 && (
              <button
                onClick={() => setActiveTab('SCHEDULE')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                title={`${availableCreditsCount} créditos de reposição ativos`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{availableCreditsCount} Reposições</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => {
                  setUserRole('ADMIN');
                  if (activeTab === 'STUDENT_PORTAL') setActiveTab('SCHEDULE');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  userRole === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Coordenação / Admin
              </button>
              <button
                onClick={() => {
                  setUserRole('STUDENT');
                  setActiveTab('STUDENT_PORTAL');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  userRole === 'STUDENT'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Portal Aluno
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'SCHEDULE'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Grade & Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('PEOPLE')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'PEOPLE'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pessoas & Matrículas</span>
          </button>

          <button
            onClick={() => setActiveTab('PEDAGOGICAL')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'PEDAGOGICAL'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Diário Pedagógico</span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'FINANCIAL'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financeiro & Repasses</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('STUDENT_PORTAL');
              setUserRole('STUDENT');
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'STUDENT_PORTAL'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Portal do Aluno</span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'text-purple-400/80 border-transparent hover:text-purple-300 hover:bg-purple-950/30'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-purple-400" />
            <span className="flex items-center gap-1.5">
              <span>Especificações & DDL</span>
              <Sparkles className="w-3 h-3 text-purple-300" />
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
