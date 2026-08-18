import React, { useState, useMemo } from 'react';
import { Student, GradeTarget, SchoolSettings } from '../types';
import {
  Building2,
  Landmark,
  Globe,
  Lock,
  Unlock,
  Users,
  Award,
  Target,
  School,
  FileText,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Baby,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  BarChart3,
  MapPin,
  Sparkles,
  Send,
} from 'lucide-react';

import { validateUniversalPassword } from '../utils/storage';

interface RegionalHierarchyDashboardProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  settings: SchoolSettings;
  activeLevel?: 'aanaa' | 'godina' | 'oromiyaa';
  onSelectLevel?: (level: 'aanaa' | 'godina' | 'oromiyaa') => void;
}

export const RegionalHierarchyDashboard: React.FC<RegionalHierarchyDashboardProps> = ({
  students,
  targets,
  settings,
  activeLevel = 'aanaa',
  onSelectLevel,
}) => {
  // Password Unlock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('hierarchy_unlocked_srs') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Level Selection State
  const [currentLevel, setCurrentLevel] = useState<'aanaa' | 'godina' | 'oromiyaa'>(activeLevel);

  // Filters for levels
  const [selectedWoreda, setSelectedWoreda] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'AZ' | 'ZA' | 'STUDENTS'>('AZ');

  // Handle password unlock verification
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUniversalPassword(passwordInput)) {
      setIsUnlocked(true);
      sessionStorage.setItem('hierarchy_unlocked_srs', 'true');
      localStorage.setItem('srs_admin_level_unlocked', 'true');
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Jecha darbinsaa fi eeyyama abbaa kalaqaa irraa fudhaa');
    }
  };

  const handleRelock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('hierarchy_unlocked_srs');
  };

  const handleLevelChange = (lvl: 'aanaa' | 'godina' | 'oromiyaa') => {
    setCurrentLevel(lvl);
    if (onSelectLevel) {
      onSelectLevel(lvl);
    }
  };

  // Derive unique Woredas & Zones from data with fallback standard names
  const allWoredas = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.aanaa && s.aanaa.trim() !== '') set.add(s.aanaa.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const allZones = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.godina && s.godina.trim() !== '') set.add(s.godina.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // If locked, render Password Security Gate (NO HINT DISPLAYED)
  if (!isUnlocked) {
    return (
      <div className="min-h-[500px] flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-indigo-600 to-amber-400" />
          
          <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-200 rounded-3xl flex items-center justify-center mx-auto text-indigo-700 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              🔒 Qindaa'ina Sadarkaalee Bulchiinsaa
            </h2>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Dashboard sadarkaa <span className="text-indigo-700 font-bold">Aanaa</span>,{' '}
              <span className="text-indigo-700 font-bold">Godinaa</span> fi{' '}
              <span className="text-indigo-700 font-bold">Oromiyaa</span> banuuf jecha darbiisaa (password) galchaa.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div className="text-left space-y-1">
              <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
                Jecha Darbiisaa (Password):
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Jecha darbiisaa galchaa..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                autoFocus
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-extrabold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-indigo-700/30 hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>Banuu (Unlock Dashboard)</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 font-medium">
            Muldhina Ragaalee Sadarkaa Aanaa, Godinaa fi Biiroo Barnoota Oromiyaa
          </p>
        </div>
      </div>
    );
  }

  // Calculate aggregated stats
  const totalStudentsCount = students.length;
  const maleCount = students.filter((s) => s.koorniyaa === 'Dhiira').length;
  const femaleCount = students.filter((s) => s.koorniyaa === 'Dhalaa').length;
  const age7Count = students.filter((s) => s.umurii === 7).length;
  const buuuraBoruuCount = students.filter((s) => s.umurii >= 4 && s.umurii <= 6).length;
  const disabledCount = students.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-400/20 shrink-0 border border-amber-300">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                Authorized Executive Dashboard
              </span>
              <span className="text-slate-400 text-xs font-mono">Bara: {settings.baraBarnootaa}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Ragaalee Sadarkaalee Bulchiinsaa (Hierarchy Dashboard)
            </h1>
            <p className="text-xs text-indigo-200/90 font-medium">
              Aanaa, Godina fi Biiroo Barnoota Oromiyaatti qindeessaa fi gabaasaa
            </p>
          </div>
        </div>

        {/* Level Switcher Buttons & Lock */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="bg-indigo-900/80 p-1.5 rounded-2xl border border-indigo-700/60 flex items-center gap-1">
            <button
              onClick={() => handleLevelChange('aanaa')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                currentLevel === 'aanaa'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Sadarkaa Aanaa</span>
            </button>

            <button
              onClick={() => handleLevelChange('godina')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                currentLevel === 'godina'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>2. Sadarkaa Godinaa</span>
            </button>

            <button
              onClick={() => handleLevelChange('oromiyaa')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                currentLevel === 'oromiyaa'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Sadarkaa Oromiyaa</span>
            </button>
          </div>

          <button
            onClick={handleRelock}
            className="flex items-center gap-1 px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            title="Cufi / Lock"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cufi</span>
          </button>
        </div>
      </div>

      {/* RENDER CURRENT HIERARCHY LEVEL */}
      {currentLevel === 'aanaa' && (
        <AanaaLevelView
          students={students}
          targets={targets}
          settings={settings}
          allWoredas={allWoredas}
          selectedWoreda={selectedWoreda}
          setSelectedWoreda={setSelectedWoreda}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      )}

      {currentLevel === 'godina' && (
        <GodinaLevelView
          students={students}
          targets={targets}
          settings={settings}
          allZones={allZones}
          allWoredas={allWoredas}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />
      )}

      {currentLevel === 'oromiyaa' && (
        <OromiyaaLevelView
          students={students}
          targets={targets}
          settings={settings}
          allZones={allZones}
          allWoredas={allWoredas}
        />
      )}
    </div>
  );
};

/* ========================================================================= */
/* 1. SADARKAA AANAA (WOREDA LEVEL VIEW)                                     */
/* ========================================================================= */
interface AanaaLevelViewProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  settings: SchoolSettings;
  allWoredas: string[];
  selectedWoreda: string;
  setSelectedWoreda: (w: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  sortOrder: 'AZ' | 'ZA' | 'STUDENTS';
  setSortOrder: (s: 'AZ' | 'ZA' | 'STUDENTS') => void;
}

const AanaaLevelView: React.FC<AanaaLevelViewProps> = ({
  students,
  targets,
  settings,
  allWoredas,
  selectedWoreda,
  setSelectedWoreda,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
}) => {
  // Filter students by Woreda
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchWoreda =
        selectedWoreda === 'ALL' ||
        (s.aanaa && s.aanaa.toLowerCase() === selectedWoreda.toLowerCase());

      const matchSearch =
        s.maqaaGuutuu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.manaBarumsaa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.fanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ganda.toLowerCase().includes(searchQuery.toLowerCase());

      return matchWoreda && matchSearch;
    });
  }, [students, selectedWoreda, searchQuery]);

  // Distinct schools in this woreda selection
  const woredaSchools = useMemo(() => {
    const map = new Map<string, Student[]>();
    filteredStudents.forEach((s) => {
      const name = s.manaBarumsaa || 'Mana Barumsaa Waliigalaa';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(s);
    });
    return Array.from(map.entries());
  }, [filteredStudents]);

  // Aggregate totals
  const totalInWoreda = filteredStudents.length;
  const maleCount = filteredStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
  const femaleCount = filteredStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
  const age7Count = filteredStudents.filter((s) => s.umurii === 7).length;
  const buuuraBoruuCount = filteredStudents.filter((s) => s.umurii >= 4 && s.umurii <= 6).length;
  const disabledCount = filteredStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;

  const printWoredaReport = () => {
    window.print();
  };

  const shareTelegramWoredaReport = () => {
    const wName = selectedWoreda === 'ALL' ? 'Aanaalee Hunda' : `Aanaa ${selectedWoreda}`;
    const directWoredaUrl = `${window.location.origin}${window.location.pathname}?woreda=${encodeURIComponent(selectedWoreda)}&view=hierarchy`;

    const reportText = `🏛 *GABAASA SADARKAA AANAA - SRS KITESA* 🎓\n\n` +
      `📍 *Aanaa:* ${wName}\n` +
      `🏫 *Baayyina Manneen Barumsaa:* ${woredaSchools.length}\n` +
      `👨‍🎓 *Waliigala Barattootaa:* ${totalInWoreda} (Dhiira: ${maleCount}, Dhalaa: ${femaleCount})\n` +
      `👶 *Bu'uura Boruu (4-6):* ${buuuraBoruuCount}\n` +
      `♿️ *Miidhama Qaamaa:* ${disabledCount}\n` +
      `🗓 *Guyyaa:* ${new Date().toLocaleDateString('en-GB')}\n\n` +
      `🌐 *Sirna SRS KITESA:* \n${directWoredaUrl}`;

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(directWoredaUrl)}&text=${encodeURIComponent(reportText)}`;

    if (navigator.share) {
      navigator.share({
        title: `Gabaasa Aanaa - SRS KITESA`,
        text: reportText,
        url: window.location.origin,
      }).catch(() => {
        window.open(telegramUrl, '_blank');
      });
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Woreda Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Aanaa Filadhu:</span>
            <select
              value={selectedWoreda}
              onChange={(e) => setSelectedWoreda(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 font-extrabold text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">Aanaa Hundaa (All Woredas)</option>
              {allWoredas.map((w) => (
                <option key={w} value={w}>
                  Aanaa {w}
                </option>
              ))}
            </select>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Barbaadi M.Barumsaa, Barataa..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={shareTelegramWoredaReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm active:scale-95"
            title="Gabaasa Aanaa Telegram-iin Ogeessatti Ergi"
          >
            <Send className="w-4 h-4 text-sky-200" />
            <span>Ergii Telegram ✈️</span>
          </button>

          <button
            onClick={printWoredaReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Gabaasa Aanaa Maxxansi</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Manneen Barumsaa</span>
          <div className="text-xl font-black text-slate-900">{woredaSchools.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">M.B Aanaa keessaa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Waliigala Barattootaa</span>
          <div className="text-xl font-black text-indigo-950">{totalInWoreda}</div>
          <span className="text-[10px] text-indigo-700 font-semibold">Dhi: {maleCount} | Dha: {femaleCount}</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Umurii 7 Qofa (K1)</span>
          <div className="text-xl font-black text-amber-950">{age7Count}</div>
          <span className="text-[10px] text-amber-800 font-semibold">Umurii 7 (Kutaa 1)</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Bu'uura Boruu</span>
          <div className="text-xl font-black text-emerald-950">{buuuraBoruuCount}</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Umurii 4 - 6</span>
        </div>

        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider block">Dhiira / Dhalaa %</span>
          <div className="text-xl font-black text-sky-950">
            {totalInWoreda > 0 ? ((femaleCount / totalInWoreda) * 100).toFixed(1) : '0'}%
          </div>
          <span className="text-[10px] text-sky-800 font-semibold">Bahiinsa Koorniyaa</span>
        </div>

        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">Miidhama Qaamaa</span>
          <div className="text-xl font-black text-purple-950">{disabledCount}</div>
          <span className="text-[10px] text-purple-800 font-semibold">Deeggersa Addaa</span>
        </div>
      </div>

      {/* Schools Summary Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Manneen Barumsaa Aanaa ({selectedWoreda === 'ALL' ? 'Aanaa Hundaa' : `Aanaa ${selectedWoreda}`})
            </h3>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-900 font-bold px-3 py-1 rounded-full">
            Ida'ama: {woredaSchools.length} M.B
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-900 uppercase font-black text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Maqaa Mana Barumsaa</th>
                <th className="px-4 py-3 text-center">Dhiira</th>
                <th className="px-4 py-3 text-center">Dhalaa</th>
                <th className="px-4 py-3 text-center font-extrabold text-indigo-950">Waliigala</th>
                <th className="px-4 py-3 text-center text-amber-900 bg-amber-50/80">Umurii 7</th>
                <th className="px-4 py-3 text-center text-emerald-900 bg-emerald-50/80">Bu'uura Boruu</th>
                <th className="px-4 py-3 text-center">Kutaa 1-8</th>
                <th className="px-4 py-3 text-center">Kutaa 9-12</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {woredaSchools.map(([schoolName, schoolStus], idx) => {
                const sMale = schoolStus.filter((s) => s.koorniyaa === 'Dhiira').length;
                const sFemale = schoolStus.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const sTotal = schoolStus.length;
                const sU7 = schoolStus.filter((s) => s.umurii === 7).length;
                const sBB = schoolStus.filter((s) => s.umurii >= 4 && s.umurii <= 6).length;
                const sK1_8 = schoolStus.filter((s) => {
                  const g = parseInt(s.kutaa);
                  return !isNaN(g) && g >= 1 && g <= 8;
                }).length;
                const sK9_12 = schoolStus.filter((s) => {
                  const g = parseInt(s.kutaa);
                  return !isNaN(g) && g >= 9 && g <= 12;
                }).length;

                return (
                  <tr key={schoolName} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{schoolName}</td>
                    <td className="px-4 py-3 text-center text-sky-700 font-bold">{sMale}</td>
                    <td className="px-4 py-3 text-center text-rose-700 font-bold">{sFemale}</td>
                    <td className="px-4 py-3 text-center font-black text-indigo-950 bg-indigo-50/50">{sTotal}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-amber-950 bg-amber-50/60">{sU7}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-950 bg-emerald-50/60">{sBB}</td>
                    <td className="px-4 py-3 text-center font-mono">{sK1_8}</td>
                    <td className="px-4 py-3 text-center font-mono">{sK9_12}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 2. SADARKAA GODINAA (ZONE LEVEL VIEW)                                     */
/* ========================================================================= */
interface GodinaLevelViewProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  settings: SchoolSettings;
  allZones: string[];
  allWoredas: string[];
  selectedZone: string;
  setSelectedZone: (z: string) => void;
}

const GodinaLevelView: React.FC<GodinaLevelViewProps> = ({
  students,
  targets,
  settings,
  allZones,
  allWoredas,
  selectedZone,
  setSelectedZone,
}) => {
  // Filter students by Zone
  const filteredZoneStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedZone === 'ALL') return true;
      const zoneStr = s.godina || 'Godina Hin Ibsamne';
      return zoneStr.toLowerCase() === selectedZone.toLowerCase();
    });
  }, [students, selectedZone]);

  // Aggregate by Woreda inside this Zone
  const woredaAggregates = useMemo(() => {
    const map = new Map<string, Student[]>();
    filteredZoneStudents.forEach((s) => {
      const wName = s.aanaa || 'Aanaa Hin Ibsamne';
      if (!map.has(wName)) map.set(wName, []);
      map.get(wName)!.push(s);
    });
    return Array.from(map.entries());
  }, [filteredZoneStudents]);

  const printZoneReport = () => {
    window.print();
  };

  const shareTelegramZoneReport = () => {
    const zName = selectedZone === 'ALL' ? 'Godinaalee Hunda' : `Godina ${selectedZone}`;
    const totalZoneStu = filteredZoneStudents.length;
    const directZoneUrl = `${window.location.origin}${window.location.pathname}?zone=${encodeURIComponent(selectedZone)}&view=hierarchy`;

    const reportText = `🗺 *GABAASA SADARKAA GODINAA - SRS KITESA* 🎓\n\n` +
      `📍 *Godina:* ${zName}\n` +
      `🏛 *Baayyina Aanaalee:* ${woredaAggregates.length}\n` +
      `👨‍🎓 *Waliigala Barattoota Godinaa:* ${totalZoneStu}\n` +
      `🗓 *Guyyaa:* ${new Date().toLocaleDateString('en-GB')}\n\n` +
      `🌐 *Sirna SRS KITESA:* \n${directZoneUrl}`;

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(directZoneUrl)}&text=${encodeURIComponent(reportText)}`;

    if (navigator.share) {
      navigator.share({
        title: `Gabaasa Godinaa - SRS KITESA`,
        text: reportText,
        url: window.location.origin,
      }).catch(() => {
        window.open(telegramUrl, '_blank');
      });
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Godina Filadhu:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 font-extrabold text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">Godina Hundaa (All Zones)</option>
            {allZones.map((z) => (
              <option key={z} value={z}>
                Godina {z}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={shareTelegramZoneReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm active:scale-95"
            title="Gabaasa Godinaa Telegram-iin Ogeessatti Ergi"
          >
            <Send className="w-4 h-4 text-sky-200" />
            <span>Ergii Telegram ✈️</span>
          </button>

          <button
            onClick={printZoneReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Gabaasa Godinaa Maxxansi</span>
          </button>
        </div>
      </div>

      {/* Zone KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Aanaalee Godinaa</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{woredaAggregates.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">Aanaalee Hawaasaa</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-600 uppercase block">Waliigala Barattootaa</span>
          <div className="text-2xl font-black text-indigo-950 mt-1">{filteredZoneStudents.length}</div>
          <span className="text-[10px] text-indigo-700 font-semibold">Barattoota Godinaa</span>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs font-bold text-amber-900 uppercase block">Umurii 7 Qofa</span>
          <div className="text-2xl font-black text-amber-950 mt-1">
            {filteredZoneStudents.filter((s) => s.umurii === 7).length}
          </div>
          <span className="text-[10px] text-amber-800 font-semibold">Umurii 7 (Kutaa 1)</span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-900 uppercase block">Bu'uura Boruu</span>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {filteredZoneStudents.filter((s) => s.umurii >= 4 && s.umurii <= 6).length}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold">Umurii 4 - 6</span>
        </div>
      </div>

      {/* Woredas Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Tarree Aanaalee Godina {selectedZone === 'ALL' ? 'Hundaa' : selectedZone}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-900 uppercase font-black text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Maqaa Aanaa</th>
                <th className="px-4 py-3 text-center">Manneen Barumsaa</th>
                <th className="px-4 py-3 text-center">Dhiira</th>
                <th className="px-4 py-3 text-center">Dhalaa</th>
                <th className="px-4 py-3 text-center font-black text-indigo-950">Waliigala Barattootaa</th>
                <th className="px-4 py-3 text-center text-amber-900 bg-amber-50">Umurii 7</th>
                <th className="px-4 py-3 text-center text-emerald-900 bg-emerald-50">Bu'uura Boruu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {woredaAggregates.map(([wName, wStus], idx) => {
                const schoolsCount = new Set(wStus.map((s) => s.manaBarumsaa)).size;
                const dhiira = wStus.filter((s) => s.koorniyaa === 'Dhiira').length;
                const dhalaa = wStus.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const total = wStus.length;
                const u7 = wStus.filter((s) => s.umurii === 7).length;
                const bb = wStus.filter((s) => s.umurii >= 4 && s.umurii <= 6).length;

                return (
                  <tr key={wName} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">Aanaa {wName}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{schoolsCount}</td>
                    <td className="px-4 py-3 text-center text-sky-700 font-bold">{dhiira}</td>
                    <td className="px-4 py-3 text-center text-rose-700 font-bold">{dhalaa}</td>
                    <td className="px-4 py-3 text-center font-black text-indigo-950 bg-indigo-50/50">{total}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-amber-950 bg-amber-50/60">{u7}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-950 bg-emerald-50/60">{bb}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. SADARKAA OROMIYAA (REGIONAL OROMIA LEVEL VIEW)                        */
/* ========================================================================= */
interface OromiyaaLevelViewProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  settings: SchoolSettings;
  allZones: string[];
  allWoredas: string[];
}

const OromiyaaLevelView: React.FC<OromiyaaLevelViewProps> = ({
  students,
  targets,
  settings,
  allZones,
  allWoredas,
}) => {
  // Aggregate by Zone across Oromia
  const zoneAggregates = useMemo(() => {
    const map = new Map<string, Student[]>();
    students.forEach((s) => {
      const zName = s.godina || 'Godina Hin Ibsamne';
      if (!map.has(zName)) map.set(zName, []);
      map.get(zName)!.push(s);
    });
    return Array.from(map.entries());
  }, [students]);

  const printOromiaReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Regional Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-900 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
            🌳
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest bg-slate-950/40 text-amber-300 px-3 py-1 rounded-full border border-amber-300/30">
              Naannoo Oromiyaa • Biiroo Barnoota Oromiyaa
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              Gabaasa & Dashboard Waliigalaa Sadarkaa Oromiyaa
            </h2>
            <p className="text-xs text-amber-100 font-medium">
              Gabaasa barattootaa Naannoo Oromiyaa (Godinaalee, Aanaalee fi Manneen Barumsaa)
            </p>
          </div>
        </div>

        <button
          onClick={printOromiaReport}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-amber-100 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Printer className="w-4 h-4 text-rose-600" />
          <span>Gabaasa Oromiyaa Maxxansi</span>
        </button>
      </div>

      {/* Oromia Regional Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Godinaalee Oromiyaa</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{zoneAggregates.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">Godinaalee Waliigalaa</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-600 uppercase block">Barattoota Naannoo</span>
          <div className="text-2xl font-black text-indigo-950 mt-1">{students.length}</div>
          <span className="text-[10px] text-indigo-700 font-semibold">
            Dhi: {students.filter((s) => s.koorniyaa === 'Dhiira').length} | Dha:{' '}
            {students.filter((s) => s.koorniyaa === 'Dhalaa').length}
          </span>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs font-bold text-amber-900 uppercase block">Umurii 7 Naannoo</span>
          <div className="text-2xl font-black text-amber-950 mt-1">
            {students.filter((s) => s.umurii === 7).length}
          </div>
          <span className="text-[10px] text-amber-800 font-semibold">Umurii 7 (Kutaa 1)</span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-900 uppercase block">Bu'uura Boruu Naannoo</span>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {students.filter((s) => s.umurii >= 4 && s.umurii <= 6).length}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold">Umurii 4 - 6</span>
        </div>
      </div>

      {/* Regional Zones Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Qabiyyeewwan Godinaalee Naannoo Oromiyaa
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-900 uppercase font-black text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Maqaa Godinaa</th>
                <th className="px-4 py-3 text-center">Aanaalee</th>
                <th className="px-4 py-3 text-center">Dhiira</th>
                <th className="px-4 py-3 text-center">Dhalaa</th>
                <th className="px-4 py-3 text-center font-black text-indigo-950">Waliigala</th>
                <th className="px-4 py-3 text-center text-amber-900 bg-amber-50">Umurii 7</th>
                <th className="px-4 py-3 text-center text-emerald-900 bg-emerald-50">Bu'uura Boruu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {zoneAggregates.map(([zName, zStus], idx) => {
                const wCount = new Set(zStus.map((s) => s.aanaa)).size;
                const dhiira = zStus.filter((s) => s.koorniyaa === 'Dhiira').length;
                const dhalaa = zStus.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const total = zStus.length;
                const u7 = zStus.filter((s) => s.umurii === 7).length;
                const bb = zStus.filter((s) => s.umurii >= 4 && s.umurii <= 6).length;

                return (
                  <tr key={zName} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">Godina {zName}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{wCount}</td>
                    <td className="px-4 py-3 text-center text-sky-700 font-bold">{dhiira}</td>
                    <td className="px-4 py-3 text-center text-rose-700 font-bold">{dhalaa}</td>
                    <td className="px-4 py-3 text-center font-black text-indigo-950 bg-indigo-50/50">{total}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-amber-950 bg-amber-50/60">{u7}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-950 bg-emerald-50/60">{bb}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
