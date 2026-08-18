import React, { useState } from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Target,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  School,
  Calendar,
  Baby,
  Building2,
  MapPin,
  Landmark,
  RefreshCw,
  LogOut as LogOutIcon,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SchoolSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: string;
  onLogout: () => void;
  settings: SchoolSettings;
  isSecurityUnlocked?: boolean;
  onToggleSecurityLock?: () => void;
  selectedSchoolFilter?: string;
  duplicateCount?: number;
  fraudCount?: number;
  onOpenPostcard?: () => void;
  onOpenGuide?: () => void;
  onOpenDeduplication?: () => void;
  onOpenFraudDetection?: () => void;
  onOpenSecureTransfer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  settings,
  selectedSchoolFilter,
  duplicateCount = 0,
  fraudCount = 0,
  onOpenPostcard,
  onOpenGuide,
  onOpenDeduplication,
  onOpenFraudDetection,
  onOpenSecureTransfer,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displaySchoolName =
    selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA'
      ? selectedSchoolFilter
      : settings.savedSchoolName;

  const isFiltered = selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA';
  const navItems = [
    { id: 'dashboard', label: 'Daashboordii', sub: 'M/Barumsaa', icon: LayoutDashboard },
    { id: 'aanaa', label: 'Aanaa', sub: 'Sadarkaa Aanaa', icon: Building2 },
    { id: 'godina', label: 'Godina', sub: 'Sadarkaa Godinaa', icon: MapPin },
    { id: 'oromiyaa', label: 'Oromiyaa', sub: 'Biiroo Barnoota Oromiyaa', icon: Landmark },
    { id: 'buuura_boruu', label: 'Bu\'uura Boruu', sub: 'Umurii 4-6', icon: Baby },
    { id: 'students', label: 'Galmee Barattootaa', sub: 'Registration', icon: UserPlus },
    { id: 'targets', label: 'Karoora', sub: 'Grade Targets', icon: Target },
    { id: 'emis', label: 'EMIS Upload', sub: 'EMIS Verification', icon: FileSpreadsheet },
    { id: 'reports', label: 'Gabaasa', sub: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Qindaa\'ina', sub: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-indigo-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-slate-900 text-2xl font-bold shadow-md shadow-amber-400/20 shrink-0 border border-amber-300">
              🎓
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Student Registration System
              </h1>
              <p className="text-xs text-amber-300/90 font-medium tracking-wide flex items-center gap-2">
                <span>Systema Galmee Barattootaa</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-normal">Kitesa Negasa Feyisa</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Active School Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition border ${
              isFiltered
                ? 'bg-amber-400 text-slate-900 border-amber-300 font-extrabold shadow-md'
                : 'bg-indigo-900/60 border-indigo-700/60 text-indigo-100'
            }`}>
              <School className={`w-3.5 h-3.5 shrink-0 ${isFiltered ? 'text-slate-900' : 'text-amber-400'}`} />
              <span className="truncate max-w-[220px]" title={displaySchoolName}>
                {displaySchoolName}
              </span>
              {isFiltered && (
                <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-slate-900 text-amber-300 rounded font-bold uppercase">
                  Filtered
                </span>
              )}
            </div>

            {/* Academic Year Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/60 border border-indigo-700/60 rounded-xl text-indigo-100 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bara: {settings.baraBarnootaa}</span>
            </div>

            {/* Force Reload / Clear Cache */}
            <button
              onClick={async () => {
                try {
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const r of regs) await r.unregister();
                  }
                } catch (e) {
                  console.error(e);
                }
                window.location.href = window.location.pathname + '?refresh=' + Date.now();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition cursor-pointer text-xs shadow-md active:scale-95 border border-amber-300"
              title="Appii Haaromsi (Clear Cache & Reload Live Update)"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Haaromsi</span>
            </button>

            {/* Qajeelfama Step-by-Step Guide Button */}
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl transition cursor-pointer text-xs shadow-md active:scale-95 border border-emerald-300"
                title="Qajeelfama Fayyadamtootaa (User Guide)"
              >
                <span className="text-sm">📖</span>
                <span className="font-extrabold tracking-wide">Qajeelfama</span>
              </button>
            )}

            {/* Postcard Button */}
            {onOpenPostcard && (
              <button
                type="button"
                onClick={onOpenPostcard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl transition cursor-pointer text-xs shadow-md shadow-amber-400/20 active:scale-95 border border-amber-300 animate-pulse"
                title="Qabiyyewwan Gurguddoo Appii (Postcard)"
              >
                <span className="text-sm">🎴</span>
                <span className="font-extrabold tracking-wide">Postcard Appii</span>
              </button>
            )}

            {/* Duplicated Data Cleaner Button */}
            {onOpenDeduplication && (
              <button
                type="button"
                onClick={onOpenDeduplication}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-extrabold border shadow-sm ${
                  duplicateCount > 0
                    ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse font-black'
                    : 'bg-indigo-900 hover:bg-indigo-800 text-amber-300 border-indigo-700/80'
                }`}
                title="Ragaalee Duplicated Ta'an Balleessuu (De-duplication)"
              >
                <span>🔍</span>
                <span className="hidden lg:inline">Duplicates Haqi</span>
                {duplicateCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black border border-rose-300">
                    {duplicateCount}
                  </span>
                )}
              </button>
            )}

            {/* Anti-Fraud Detector Button */}
            {onOpenFraudDetection && (
              <button
                type="button"
                onClick={onOpenFraudDetection}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-extrabold border shadow-sm ${
                  fraudCount > 0
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse font-black'
                    : 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-800/80'
                }`}
                title="Ragaalee Sobaa Qabuu & Dhowwuu (Anti-Fraud Shield)"
              >
                <span>🛡️</span>
                <span className="hidden lg:inline">Fraud Detector</span>
                {fraudCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black border border-amber-300">
                    {fraudCount}
                  </span>
                )}
              </button>
            )}

            {/* Secure Report Link Transfer Button */}
            {onOpenSecureTransfer && (
              <button
                type="button"
                onClick={onOpenSecureTransfer}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-extrabold rounded-xl transition cursor-pointer text-xs border border-emerald-800/80 shadow-sm"
                title="Security Link Transfer (Gmail & Password Verification)"
              >
                <span>🔒</span>
                <span className="hidden lg:inline">Secure Link</span>
              </button>
            )}

            {/* Logged User & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-indigo-800">
              <span className="text-slate-300 font-mono hidden sm:inline truncate max-w-[140px]">
                {currentUser}
              </span>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-md active:scale-95"
                title="Bahi / Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-extrabold tracking-wide">Bahi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-indigo-900/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-900 font-bold shadow-md shadow-amber-400/20'
                    : 'text-slate-300 hover:text-white hover:bg-indigo-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-amber-400'}`} />
                <div className="flex flex-col text-left leading-none">
                  <span>{item.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}`}>
                    {item.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">
              Appii Keessaa Bahuu (Logout)
            </h3>

            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Dhugauma Appii keessaa bahuu (Logout gochuu) ni barbaadduu?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer text-sm shadow-lg flex items-center gap-2"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>Eeyyee, Bahi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition cursor-pointer text-sm border border-slate-700"
              >
                Lakkii (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
