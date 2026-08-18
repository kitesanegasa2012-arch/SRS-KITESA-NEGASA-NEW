import React from 'react';
import { Student, GradeTarget, SchoolSettings } from '../types';
import { ContactCard } from './ContactCard';
import { Users, UserCheck, Heart, Award, Target, School, Filter, CheckCircle2, Building, Layers, MapPin } from 'lucide-react';
import {
  getStoredSchoolsList,
  getStoredWoredasList,
  getStoredZonesList,
  validateUniversalPassword,
  getUnifiedSchoolGradeTargets,
  getUnifiedWoredaTargets,
} from '../utils/storage';

interface DashboardProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  settings: SchoolSettings;
  onNavigate: (tab: string) => void;
  allSchools?: string[];
  selectedSchoolFilter?: string;
  onSelectSchoolFilter?: (school: string) => void;
  onOpenPostcard?: () => void;
  duplicateCount?: number;
  fraudCount?: number;
  onOpenDeduplication?: () => void;
  onOpenFraudDetection?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  targets,
  settings,
  onNavigate,
  allSchools = [],
  selectedSchoolFilter: externalSchoolFilter,
  onSelectSchoolFilter,
  onOpenPostcard,
  duplicateCount = 0,
  fraudCount = 0,
  onOpenDeduplication,
  onOpenFraudDetection,
}) => {
  const [internalSchoolFilter, setInternalSchoolFilter] = React.useState<string>(settings.savedSchoolName || 'ALL_WOREDA');
  const [isWoredaUnlocked, setIsWoredaUnlocked] = React.useState<boolean>(true);
  const [isLockModalOpen, setIsLockModalOpen] = React.useState<boolean>(false);
  const [pendingSchoolChange, setPendingSchoolChange] = React.useState<string | null>(null);

  // Section Lock States (default locked, requires 'LATI')
  const [isReportFilterUnlocked, setIsReportFilterUnlocked] = React.useState<boolean>(false);
  const [reportFilterPassInput, setReportFilterPassInput] = React.useState<string>('');

  const [isSchoolsListUnlocked, setIsSchoolsListUnlocked] = React.useState<boolean>(false);
  const [schoolsListPassInput, setSchoolsListPassInput] = React.useState<string>('');

  // Zone & Woreda Filter States
  const [selectedZoneFilter, setSelectedZoneFilter] = React.useState<string>('ALL_ZONES');
  const [selectedWoredaFilter, setSelectedWoredaFilter] = React.useState<string>('ALL_WOREDAS');

  const verifyPasscode = (pass: string): boolean => {
    return validateUniversalPassword(pass);
  };

  const handleUnlockReportFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(reportFilterPassInput)) {
      setIsReportFilterUnlocked(true);
      setReportFilterPassInput('');
    } else {
      alert('❌ Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  const handleUnlockSchoolsList = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(schoolsListPassInput)) {
      setIsSchoolsListUnlocked(true);
      setSchoolsListPassInput('');
    } else {
      alert('❌ Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  const selectedSchoolFilter = externalSchoolFilter ?? internalSchoolFilter;

  const applySchoolFilter = (school: string) => {
    setInternalSchoolFilter(school);
    if (onSelectSchoolFilter) {
      onSelectSchoolFilter(school);
    }
  };

  const handleSchoolChangeRequest = (school: string) => {
    applySchoolFilter(school);
  };

  const handleModalUnlocked = () => {
    setIsWoredaUnlocked(true);
    setIsLockModalOpen(false);
    if (pendingSchoolChange) {
      applySchoolFilter(pendingSchoolChange);
      setPendingSchoolChange(null);
    }
  };

  // Combined lists for Zone, Woreda, and Schools
  const storedZonesList = getStoredZonesList();
  const combinedZonesList = Array.from(
    new Set([
      ...storedZonesList,
      ...students.map((s) => s.godina).filter((g): g is string => Boolean(g && g.trim() !== '')),
    ])
  ).filter((g) => g && g.trim() !== '');

  const storedWoredasList = getStoredWoredasList();
  const combinedWoredasList = Array.from(
    new Set([
      ...storedWoredasList,
      ...students.map((s) => s.aanaa).filter((w): w is string => Boolean(w && w.trim() !== '')),
    ])
  ).filter((w) => w && w.trim() !== '');

  // Combined schools list including Directory Schools from Settings + Students Schools
  const storedSchoolsList = getStoredSchoolsList();
  const combinedSchoolsList = Array.from(
    new Set([
      ...(settings.savedSchoolName ? [settings.savedSchoolName] : []),
      ...storedSchoolsList,
      ...allSchools,
      ...students.map((s) => s.manaBarumsaa).filter((s) => s && s.trim() !== ''),
    ])
  ).filter((s) => s && s.trim() !== '');

  // Filter students dynamically based on Godina, Aanaa, and Mana Barumsaa
  const effectiveFilter = (!isWoredaUnlocked && selectedSchoolFilter === 'ALL_WOREDA')
    ? (settings.savedSchoolName || 'ALL_WOREDA')
    : selectedSchoolFilter;

  let filtered = students;

  if (selectedZoneFilter !== 'ALL_ZONES') {
    filtered = filtered.filter(
      (s) => s.godina && s.godina.trim().toLowerCase() === selectedZoneFilter.trim().toLowerCase()
    );
  }

  if (selectedWoredaFilter !== 'ALL_WOREDAS') {
    filtered = filtered.filter(
      (s) => s.aanaa && s.aanaa.trim().toLowerCase() === selectedWoredaFilter.trim().toLowerCase()
    );
  }

  if (effectiveFilter !== 'ALL_WOREDA') {
    filtered = filtered.filter((s) => s.manaBarumsaa === effectiveFilter);
  }

  const filteredStudents = filtered;

  const totalStudents = filteredStudents.length;
  const maleStudents = filteredStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
  const femaleStudents = filteredStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
  const disabledStudents = filteredStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;

  // Unified targets for active scope (single school vs woreda vs zone)
  const isSingleSchoolActive = effectiveFilter !== 'ALL_WOREDA';
  const isSingleWoredaActive = selectedWoredaFilter !== 'ALL_WOREDAS';

  let activeGradeTargetsMap: Record<string, GradeTarget> = {};
  let totalTarget = 0;

  if (isSingleSchoolActive) {
    const { targets: schGrades, totalTarget: schTot } = getUnifiedSchoolGradeTargets(effectiveFilter, targets);
    activeGradeTargetsMap = schGrades;
    totalTarget = schTot;
  } else if (isSingleWoredaActive) {
    const { gradeTargets: worGrades, woredaTarget } = getUnifiedWoredaTargets(
      selectedWoredaFilter,
      combinedSchoolsList,
      students
    );
    activeGradeTargetsMap = worGrades;
    totalTarget = woredaTarget;
  } else {
    const { gradeTargets: allGrades, woredaTarget: allTot } = getUnifiedWoredaTargets(
      'ALL_WOREDAS',
      combinedSchoolsList,
      students
    );
    activeGradeTargetsMap = allGrades;
    totalTarget = allTot;
  }

  // Grade breakdown
  const gradesList = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const gradeCounts = gradesList.map((g) => {
    const inGrade = filteredStudents.filter((s) => s.kutaa === g);
    const dhiira = inGrade.filter((s) => s.koorniyaa === 'Dhiira').length;
    const dhalaa = inGrade.filter((s) => s.koorniyaa === 'Dhalaa').length;
    const t = activeGradeTargetsMap[g] || targets[g];
    const target = t ? (t.dhiira || 0) + (t.dhalaa || 0) : 0;
    return {
      grade: g,
      total: inGrade.length,
      dhiira,
      dhalaa,
      target,
    };
  });

  const targetPct = totalTarget > 0 ? ((totalStudents / totalTarget) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      
      {/* Cover / Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-2xl border-2 border-amber-400/40">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold rounded-full uppercase tracking-widest">
              ✨ Student Management System
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Baga Nagaan Dhuftan!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Systema Galmee Barattootaa fi Odeeffannoo EMIS - {selectedSchoolFilter === 'ALL_WOREDA' ? settings.savedSchoolName : selectedSchoolFilter} - Bara {settings.baraBarnootaa}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {onOpenPostcard && (
              <button
                type="button"
                onClick={onOpenPostcard}
                className="px-5 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:from-purple-400 hover:to-amber-300 text-white font-black rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer text-sm flex items-center justify-center gap-2 border border-purple-300/40"
              >
                <span className="text-base">🎴</span>
                <span>Qabiyyee Appii (10)</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('students')}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-900 font-bold rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              ➕ Barataa Haaraa Galmeessi
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 border border-indigo-700/60 text-white font-semibold rounded-2xl transition cursor-pointer text-sm"
            >
              📄 Gabaasa Ilaali
            </button>
          </div>
        </div>
      </div>

      {/* Duplicated Data & Fraud Detector System Alerts */}
      {(duplicateCount > 0 || fraudCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplicateCount > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4.5 rounded-2xl shadow-lg border-2 border-amber-300 flex items-center justify-between gap-3 animate-pulse">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                  <span>🚨 MALLATTOO RAGAA DUPLICATED ({duplicateCount})</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  Systema keessatti ragaaleen irra-deebi'amuun galmaa'an ({duplicateCount}) argamaniiru! Qulqulleessuuf permission gaafadhaa.
                </p>
              </div>
              {onOpenDeduplication && (
                <button
                  type="button"
                  onClick={onOpenDeduplication}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shadow transition cursor-pointer shrink-0 border border-amber-400"
                >
                  🔍 Duplicates Haqi
                </button>
              )}
            </div>
          )}

          {fraudCount > 0 && (
            <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white p-4.5 rounded-2xl shadow-lg border-2 border-rose-400 flex items-center justify-between gap-3 animate-pulse">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                  <span>🛡️ MALLATTOO RAGAA SOBAA / ANOMALY ({fraudCount})</span>
                </div>
                <p className="text-xs font-semibold text-rose-100 leading-tight">
                  Ragaalee shakkisiisoo ykn seeraan ala ta'an ({fraudCount}) detector shield dhiyeesseera. Dhowwuuf tuqaa.
                </p>
              </div>
              {onOpenFraudDetection && (
                <button
                  type="button"
                  onClick={onOpenFraudDetection}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-rose-200 font-black text-xs rounded-xl shadow transition cursor-pointer shrink-0 border border-rose-500"
                >
                  🛡️ Fraud Detector
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Woreda vs Individual School Filter Selector Bar */}
      <div className="bg-white p-4.5 rounded-2xl border-2 border-indigo-200 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-slate-900 text-amber-400 rounded-2xl shadow-sm shrink-0 border border-indigo-400">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Filannoo Sadarkaa Gabaasaa maanneen barnoota
              </h3>
              {!isReportFilterUnlocked && (
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg font-extrabold border border-amber-200">
                  🔒 Cufamaa (Locked)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              tokko tokkoo ragaalee manneen barnoota calalalanii ilaaluuf:
            </p>
          </div>
        </div>

        {!isReportFilterUnlocked ? (
          <form onSubmit={handleUnlockReportFilter} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="password"
              required
              placeholder="Jecha darbiisaa saaqi..."
              value={reportFilterPassInput}
              onChange={(e) => setReportFilterPassInput(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 w-full sm:w-60 shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-900 hover:bg-slate-900 text-amber-300 font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              🔓 Saaqi
            </button>
          </form>
        ) : (
          <div className="w-full md:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Filter by Godina */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">🗺️ Godina:</label>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="p-2.5 rounded-xl font-bold text-xs border-2 bg-indigo-50/70 border-indigo-300 text-indigo-950 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL_ZONES">🗺️ Godinaalee Hunda</option>
                {combinedZonesList.map((zone) => (
                  <option key={zone} value={zone}>
                    📍 {zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Aanaa */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">🏛️ Aanaa:</label>
              <select
                value={selectedWoredaFilter}
                onChange={(e) => setSelectedWoredaFilter(e.target.value)}
                className="p-2.5 rounded-xl font-bold text-xs border-2 bg-amber-50/70 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL_WOREDAS">🏛️ Aanolee Hunda</option>
                {combinedWoredasList.map((woreda) => (
                  <option key={woreda} value={woreda}>
                    🏛️ {woreda}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by School */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">🏫 M/Barumsaa:</label>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => handleSchoolChangeRequest(e.target.value)}
                className="p-2.5 rounded-xl font-bold text-xs border-2 transition focus:ring-2 cursor-pointer bg-emerald-50/70 border-emerald-400 text-slate-900 focus:ring-emerald-500"
              >
                <option value="ALL_WOREDA">
                  🏢 M/Barumsaa Hunda
                </option>
                {combinedSchoolsList.map((sch) => (
                  <option key={sch} value={sch}>
                    🏫 {sch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Quick Godina, Aanaa & School Filter Chips Bar */}
      <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-md space-y-3 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Building className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-extrabold text-amber-300">
              Board Filter Status:
            </span>
            <span className="text-slate-200 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {selectedZoneFilter !== 'ALL_ZONES' && `📍 Godina: ${selectedZoneFilter} | `}
              {selectedWoredaFilter !== 'ALL_WOREDAS' && `🏛️ Aanaa: ${selectedWoredaFilter} | `}
              {selectedSchoolFilter !== 'ALL_WOREDA' ? `🏫 M/B: ${selectedSchoolFilter}` : '🏫 M/B Hunda'}
            </span>
            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg font-bold border border-emerald-800/60 font-mono">
              Barattoota Calalaman: {filteredStudents.length} / {students.length}
            </span>
          </div>

          {(selectedZoneFilter !== 'ALL_ZONES' || selectedWoredaFilter !== 'ALL_WOREDAS' || selectedSchoolFilter !== 'ALL_WOREDA') && (
            <button
              onClick={() => {
                setSelectedZoneFilter('ALL_ZONES');
                setSelectedWoredaFilter('ALL_WOREDAS');
                handleSchoolChangeRequest('ALL_WOREDA');
              }}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>❌ Calaltuu Hunda Haqi (Reset)</span>
            </button>
          )}
        </div>

        {/* Quick Godina Chips */}
        {combinedZonesList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 mr-1">Godinaalee:</span>
            <button
              onClick={() => setSelectedZoneFilter('ALL_ZONES')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                selectedZoneFilter === 'ALL_ZONES'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              🗺️ Godina Hunda ({combinedZonesList.length})
            </button>
            {combinedZonesList.map((z) => {
              const countZ = students.filter((s) => s.godina && s.godina.trim().toLowerCase() === z.trim().toLowerCase()).length;
              return (
                <button
                  key={z}
                  onClick={() => setSelectedZoneFilter(z)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    selectedZoneFilter === z
                      ? 'bg-indigo-400 text-slate-950 border-indigo-300 shadow-md font-black'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  📍 {z} <span className="opacity-80 font-mono">({countZ})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Woreda Chips */}
        {combinedWoredasList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 mr-1">Aanolee:</span>
            <button
              onClick={() => setSelectedWoredaFilter('ALL_WOREDAS')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                selectedWoredaFilter === 'ALL_WOREDAS'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              🏛️ Aanolee Hunda ({combinedWoredasList.length})
            </button>
            {combinedWoredasList.map((w) => {
              const countW = students.filter((s) => s.aanaa && s.aanaa.trim().toLowerCase() === w.trim().toLowerCase()).length;
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWoredaFilter(w)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    selectedWoredaFilter === w
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  🏛️ {w} <span className="opacity-80 font-mono">({countW})</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-amber-300">
              Baayyina Manneen Barnootaa ({combinedSchoolsList.length}):
            </span>
            <span className="text-slate-300 font-medium">
              {selectedSchoolFilter === 'ALL_WOREDA'
                ? 'Ragaan manneen barnootaa hunda calalamee mul\'ata'
                : `M/B Calalame: ${selectedSchoolFilter}`}
            </span>
          </div>

          {selectedSchoolFilter !== 'ALL_WOREDA' ? (
            <button
              onClick={() => handleSchoolChangeRequest('ALL_WOREDA')}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>❌ Calalaa Haqi (Waliigala Ilaali)</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">
              Manneen Barnootaa Hunda Waliigala
            </span>
          )}
        </div>

        {/* Quick School Pills Scroll Container */}
        {combinedSchoolsList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 max-w-full scrollbar-thin">
            <button
              onClick={() => handleSchoolChangeRequest('ALL_WOREDA')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                selectedSchoolFilter === 'ALL_WOREDA'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              🏢 Waliigala M/B ({combinedSchoolsList.length})
            </button>

            {combinedSchoolsList.map((sch) => {
              const countForSch = students.filter((s) => s.manaBarumsaa === sch).length;
              const isSelected = selectedSchoolFilter === sch;
              return (
                <button
                  key={sch}
                  onClick={() => handleSchoolChangeRequest(sch)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md font-black'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  🏫 {sch} <span className="opacity-80 font-mono">({countForSch})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Waliigala Barattootaa
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-600 mb-1">{totalStudents}</h2>
          <p className="text-xs text-slate-500">Total Registered Students</p>
        </div>

        {/* Male Students */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dhiira (Male)
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-sky-600 mb-1">{maleStudents}</h2>
          <p className="text-xs text-slate-500">
            {totalStudents > 0 ? `${((maleStudents / totalStudents) * 100).toFixed(1)}% of total` : '0%'}
          </p>
        </div>

        {/* Female Students */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dhalaa (Female)
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-rose-600 mb-1">{femaleStudents}</h2>
          <p className="text-xs text-slate-500">
            {totalStudents > 0 ? `${((femaleStudents / totalStudents) * 100).toFixed(1)}% of total` : '0%'}
          </p>
        </div>

        {/* Target Progress */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Raawwii Karooraa
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-emerald-600 mb-1">{targetPct}%</h2>
          <p className="text-xs text-slate-500">
            Target: {totalTarget} | Actual: {totalStudents}
          </p>
        </div>

      </div>

      {/* Grade Level Summary Table / Visual Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Raawwii Kutaa Kutaadhaan (Grade Level Distribution)</span>
            </h3>
            <p className="text-xs text-slate-500">Baay'ina barattoota kutaa 1 - 12</p>
          </div>
          <button
            onClick={() => onNavigate('targets')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
          >
            Karoora Jijjiiri →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Bu'uura Boruu (Umurii 4-6) Card */}
          {(() => {
            const bbStudents = filteredStudents.filter(
              (s) => s.kutaa === '0' || (s.kutaa || '').toLowerCase().includes('buuura') || (s.kutaa || '').toLowerCase().includes('borru')
            );
            const bbTotal = bbStudents.length;
            const bbTarget = (targets['bb_4']?.dhiira || 0) + (targets['bb_4']?.dhalaa || 0) +
                             (targets['bb_5']?.dhiira || 0) + (targets['bb_5']?.dhalaa || 0) +
                             (targets['bb_6']?.dhiira || 0) + (targets['bb_6']?.dhalaa || 0) || 50;
            const bbPct = bbTarget > 0 ? Math.min(100, Math.round((bbTotal / bbTarget) * 100)) : 0;

            return (
              <div
                onClick={() => onNavigate('buuura_boruu')}
                className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl hover:border-amber-500 transition cursor-pointer shadow-xs"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-black text-amber-950">Bu'uura Boruu</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                    {bbPct}%
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900">{bbTotal}</div>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">
                  D: {bbStudents.filter((s) => s.koorniyaa === 'Dhiira').length} | Dh: {bbStudents.filter((s) => s.koorniyaa === 'Dhalaa').length}
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${bbPct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {gradeCounts.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.total / g.target) * 100)) : 0;
            return (
              <div
                key={g.grade}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-800 text-sm">Kutaa {g.grade}</span>
                  <span className="text-xs font-semibold text-indigo-600">{g.total}</span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                  <span>👨 {g.dhiira}</span>
                  <span>👩 {g.dhalaa}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 text-right font-mono">
                  Target: {g.target} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Woreda Schools Breakdown Table (Shows summary of each school in the district) */}
      <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
              Gabaasa waligalaa manneen barnootaa
            </span>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              <span>Baayyina Manneen Barnootaa ({combinedSchoolsList.length})</span>
              {!isSchoolsListUnlocked && (
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg font-extrabold border border-amber-200">
                  🔒 Cufamaa (Locked)
                </span>
              )}
            </h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 self-start sm:self-auto">
            Waliigala Barattoota Manneen Barnootaa: {students.length}
          </span>
        </div>

        {!isSchoolsListUnlocked ? (
          <form onSubmit={handleUnlockSchoolsList} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center mx-auto font-black text-xl">
              🔒
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Tarree Manneen Barnootaa Ilaaluuf Jecha Darbiisaa (Password) Seensisaa
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                placeholder="Jecha darbiisaa saaqi..."
                value={schoolsListPassInput}
                onChange={(e) => setSchoolsListPassInput(e.target.value)}
                className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 grow"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
              >
                🔓 Saaqi
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-900 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">Lakk.</th>
                  <th className="px-3 py-3">Maqaa Mana Barumsaa</th>
                  <th className="px-3 py-3 text-center text-indigo-900 bg-indigo-50/70">Karoora (Target)</th>
                  <th className="px-3 py-3 text-center">Dhiira</th>
                  <th className="px-3 py-3 text-center">Dhalaa</th>
                  <th className="px-3 py-3 text-center">Miidhama</th>
                  <th className="px-3 py-3 text-center bg-amber-50 text-amber-950 font-bold">Raawwii</th>
                  <th className="px-3 py-3 text-center font-black text-emerald-700">% Raawwii</th>
                  <th className="px-3 py-3 text-right">Tarkaanfii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedSchoolsList.map((schName, idx) => {
                  const schStudents = students.filter((s) => (s.manaBarumsaa || '').trim().toLowerCase() === schName.trim().toLowerCase());
                  const schM = schStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
                  const schF = schStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
                  const schDis = schStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;
                  const { totalTarget: schTarget } = getUnifiedSchoolGradeTargets(schName, targets);
                  const schPct = schTarget > 0 ? ((schStudents.length / schTarget) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={schName} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <School className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{schName}</span>
                        {schName === settings.savedSchoolName && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            M/B Keessan
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-indigo-900 bg-indigo-50/40">
                        {schTarget}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-sky-600">{schM}</td>
                      <td className="px-3 py-3 text-center font-semibold text-rose-600">{schF}</td>
                      <td className="px-3 py-3 text-center font-semibold text-purple-600">{schDis}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-amber-950 bg-amber-50">
                        {schStudents.length}
                      </td>
                      <td className="px-3 py-3 text-center font-extrabold text-emerald-700 bg-emerald-50">
                        {schPct}%
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleSchoolChangeRequest(schName)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                        >
                          Calali (Filter)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Statistics Banner & Contact Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Special Needs & Demographics Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Barattoota Miidhama Qaamaa Qaban
            </span>
            <h3 className="text-xl font-extrabold text-white mt-1 mb-3">
              Special Needs & Inclusion Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 bg-indigo-950/70 border border-indigo-700/60 rounded-xl">
                <p className="text-xs text-slate-300">Waliigala Miidhama Qaamaa</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{disabledStudents} Barattoota</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {totalStudents > 0 ? `${((disabledStudents / totalStudents) * 100).toFixed(1)}% of all registered` : '0%'}
                </p>
              </div>
              <div className="p-4 bg-indigo-950/70 border border-indigo-700/60 rounded-xl">
                <p className="text-xs text-slate-300">Mana Barumsaa Ammee</p>
                <p className="text-lg font-bold text-white mt-1 truncate" title={settings.savedSchoolName}>
                  {settings.savedSchoolName}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Bara Barnootaa: {settings.baraBarnootaa}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <School className="w-4 h-4 text-amber-400" /> Systema Galmee Kitesa Negasa Feyisa
            </span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-amber-300 font-semibold hover:underline"
            >
              Qindaa'ina Jijjiiri →
            </button>
          </div>
        </div>

        {/* Author Contact Card */}
        <ContactCard />

      </div>

    </div>
  );
};
