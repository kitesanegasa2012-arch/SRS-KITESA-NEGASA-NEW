import React, { useState } from 'react';
import { Student, SchoolSettings, EMISStudent } from '../types';
import {
  Baby,
  Users,
  School,
  Sparkles,
  TrendingUp,
  UserPlus,
  FileSpreadsheet,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

import { validateUniversalPassword } from '../utils/storage';

interface BuuuraBoruuDashboardProps {
  students: Student[];
  emisRecords: EMISStudent[];
  settings: SchoolSettings;
  onNavigate: (tab: string) => void;
  allSchools: string[];
}

export const BuuuraBoruuDashboard: React.FC<BuuuraBoruuDashboardProps> = ({
  students,
  emisRecords,
  settings,
  onNavigate,
  allSchools,
}) => {
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedAanaa, setSelectedAanaa] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isMonitoringUnlocked, setIsMonitoringUnlocked] = useState<boolean>(false);
  const [monitoringPassInput, setMonitoringPassInput] = useState<string>('');

  const handleUnlockMonitoring = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUniversalPassword(monitoringPassInput)) {
      setIsMonitoringUnlocked(true);
      setMonitoringPassInput('');
    } else {
      alert('Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  // Filter Bu'uura Boruu students (Kutaa === '0' or Kutaa === 'BB' or Umurii 4-6 with Kutaa 0/1)
  const isBuuuraBoruuStudent = (kutaa: string, age: number) => {
    const k = (kutaa || '').toLowerCase().trim();
    if (k === '0' || k === 'bb' || k.includes('buuura') || k.includes('borru')) return true;
    return false;
  };

  const buuuraStudents = students.filter((s) => {
    const isBB = isBuuuraBoruuStudent(s.kutaa, s.umurii);
    const matchesSchool = selectedSchool === 'ALL' || s.manaBarumsaa === selectedSchool;
    const matchesAanaa = selectedAanaa === 'ALL' || s.aanaa === selectedAanaa;
    const matchesSearch =
      !searchQuery ||
      s.maqaaGuutuu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nationalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.fanId && s.fanId.includes(searchQuery));

    return isBB && matchesSchool && matchesAanaa && matchesSearch;
  });

  const buuuraEmis = emisRecords.filter((e) => {
    const k = (e.kutaa || '').toLowerCase().trim();
    return k === '0' || k === 'bb' || k.includes('buuura') || k.includes('borru');
  });

  // Calculate age groups for Bu'uura Boruu (Umurii 4, 5, 6, and Total 4-6)
  const calculateAgeBreakdown = (list: Student[]) => {
    let u4Male = 0, u4Female = 0;
    let u5Male = 0, u5Female = 0;
    let u6Male = 0, u6Female = 0;
    let otherMale = 0, otherFemale = 0;

    list.forEach((s) => {
      const isMale = s.koorniyaa === 'Dhiira';
      if (s.umurii === 4) {
        if (isMale) u4Male++; else u4Female++;
      } else if (s.umurii === 5) {
        if (isMale) u5Male++; else u5Female++;
      } else if (s.umurii === 6) {
        if (isMale) u6Male++; else u6Female++;
      } else {
        if (isMale) otherMale++; else otherFemale++;
      }
    });

    const tot4 = u4Male + u4Female;
    const tot5 = u5Male + u5Female;
    const tot6 = u6Male + u6Female;
    const totOther = otherMale + otherFemale;
    const totMale = u4Male + u5Male + u6Male + otherMale;
    const totFemale = u4Female + u5Female + u6Female + otherFemale;
    const grandTotal = totMale + totFemale;

    return {
      u4Male, u4Female, tot4,
      u5Male, u5Female, tot5,
      u6Male, u6Female, tot6,
      otherMale, otherFemale, totOther,
      totMale, totFemale, grandTotal,
    };
  };

  const stats = calculateAgeBreakdown(buuuraStudents);

  // List of distinct Aanaas
  const allAanaas = Array.from(new Set(students.map((s) => s.aanaa).filter(Boolean)));

  // School-by-School Bu'uura Boruu Summary Table
  const schoolSummaries = allSchools.map((sch) => {
    const schStudents = students.filter(
      (s) => s.manaBarumsaa === sch && isBuuuraBoruuStudent(s.kutaa, s.umurii)
    );
    const schStats = calculateAgeBreakdown(schStudents);
    return {
      schoolName: sch,
      ...schStats,
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-300 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 translate-x-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950/15 backdrop-blur-md rounded-full text-xs font-black tracking-wide text-slate-950 border border-slate-950/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Barattoota Bu’uura Boruu</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-3">
              <Baby className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
              <span>Daashboordii Bu'uura Boruu</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              Systema Galmee Barattoota Bu'uura Boruu (Umurii 4, Umurii 5, Umurii 6)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-3 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold rounded-2xl transition shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Galmee Haaraa Galmeessi</span>
            </button>
            <button
              onClick={() => onNavigate('emis')}
              className="px-4 py-3 bg-white/90 hover:bg-white text-slate-900 font-extrabold rounded-2xl transition shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>EMIS Upload ({buuuraEmis.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stat KPI Cards (Umurii 4, Umurii 5, Umurii 6, Ida'ama 4-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Umurii 4 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">Umurii 4 (Age 4)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Baby className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">{stats.tot4}</div>
            <p className="text-xs text-slate-500 mt-0.5">Barattoota Umurii 4</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-700">👦 Dhiira: {stats.u4Male}</span>
            <span className="text-pink-700">👧 Dhalaa: {stats.u4Female}</span>
          </div>
        </div>

        {/* Card 2: Umurii 5 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-100 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">Umurii 5 (Age 5)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Baby className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">{stats.tot5}</div>
            <p className="text-xs text-slate-500 mt-0.5">Barattoota Umurii 5</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-700">👦 Dhiira: {stats.u5Male}</span>
            <span className="text-pink-700">👧 Dhalaa: {stats.u5Female}</span>
          </div>
        </div>

        {/* Card 3: Umurii 6 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Umurii 6 (Age 6)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Baby className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">{stats.tot6}</div>
            <p className="text-xs text-slate-500 mt-0.5">Barattoota Umurii 6</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-blue-700">👦 Dhiira: {stats.u6Male}</span>
            <span className="text-pink-700">👧 Dhalaa: {stats.u6Female}</span>
          </div>
        </div>

        {/* Card 4: Ida'ama Umurii 4-6 */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Ida'ama Umurii 4-6</span>
            <div className="p-2 bg-indigo-800 text-amber-300 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-300 font-mono">{stats.grandTotal}</div>
            <p className="text-xs text-slate-300 mt-0.5">Waliigala Barattoota Bu'uura Boruu</p>
          </div>
          <div className="pt-2 border-t border-indigo-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-sky-300">👦 Dhiira: {stats.totMale}</span>
            <span className="text-rose-300">👧 Dhalaa: {stats.totFemale}</span>
          </div>
        </div>
      </div>

      {/* Main Table 1: Official Policy Age Matrix (Umurii 4, 5, 6, Ida'ama 4-6) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>waligalaa barattoota Bu’uura Boruu</span>
            </h3>
            <p className="text-xs text-slate-500">
              Lakkoofsa Barattoota Bu'uura Boruu Umurii 4, Umurii 5, Umurii 6 fi Ida'ama Umurii 4-6 (Dhiira & Dhalaa)
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>mirkana’a waligalaa</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 rounded-l-2xl">Sadarkaa Umurii (Age Category)</th>
                <th className="p-3.5 text-center">👦 Dhiira</th>
                <th className="p-3.5 text-center">👧 Dhalaa</th>
                <th className="p-3.5 text-center">📊 Ida'ama</th>
                <th className="p-3.5 text-right rounded-r-2xl">% Hirmannaa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              <tr className="hover:bg-indigo-50/40">
                <td className="p-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Umurii 4 (Age 4)</span>
                </td>
                <td className="p-3.5 text-center font-mono text-blue-700">{stats.u4Male}</td>
                <td className="p-3.5 text-center font-mono text-pink-700">{stats.u4Female}</td>
                <td className="p-3.5 text-center font-mono text-indigo-900 font-extrabold text-base">{stats.tot4}</td>
                <td className="p-3.5 text-right font-mono text-slate-600">
                  {stats.grandTotal > 0 ? ((stats.tot4 / stats.grandTotal) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Umurii 5 (Age 5)</span>
                </td>
                <td className="p-3.5 text-center font-mono text-blue-700">{stats.u5Male}</td>
                <td className="p-3.5 text-center font-mono text-pink-700">{stats.u5Female}</td>
                <td className="p-3.5 text-center font-mono text-emerald-900 font-extrabold text-base">{stats.tot5}</td>
                <td className="p-3.5 text-right font-mono text-slate-600">
                  {stats.grandTotal > 0 ? ((stats.tot5 / stats.grandTotal) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-amber-50/40">
                <td className="p-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Umurii 6 (Age 6)</span>
                </td>
                <td className="p-3.5 text-center font-mono text-blue-700">{stats.u6Male}</td>
                <td className="p-3.5 text-center font-mono text-pink-700">{stats.u6Female}</td>
                <td className="p-3.5 text-center font-mono text-amber-900 font-extrabold text-base">{stats.tot6}</td>
                <td className="p-3.5 text-right font-mono text-slate-600">
                  {stats.grandTotal > 0 ? ((stats.tot6 / stats.grandTotal) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              {stats.totOther > 0 && (
                <tr className="hover:bg-slate-50 text-slate-500 italic">
                  <td className="p-3.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Umurii Biraa (&lt;4 / &gt;6)</span>
                  </td>
                  <td className="p-3.5 text-center font-mono">{stats.otherMale}</td>
                  <td className="p-3.5 text-center font-mono">{stats.otherFemale}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-slate-700">{stats.totOther}</td>
                  <td className="p-3.5 text-right font-mono">
                    {stats.grandTotal > 0 ? ((stats.totOther / stats.grandTotal) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-400 text-slate-950 font-black text-sm sm:text-base">
                <td className="p-4 rounded-l-2xl">IDA'AMA UMURII 4-6 (GRAND TOTAL)</td>
                <td className="p-4 text-center font-mono">{stats.totMale}</td>
                <td className="p-4 text-center font-mono">{stats.totFemale}</td>
                <td className="p-4 text-center font-mono text-lg">{stats.grandTotal}</td>
                <td className="p-4 text-right font-mono">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Main Table 2: School & Aanaa Level Bu'uura Boruu Monitoring */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-amber-600" />
              <span>Sirna Hordoffii Manneen Barnootaa & Aanaa (Bu'uura Boruu)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tarree Manneen Barnootaa fi baay'ina daa'immanii tokkoon tokkoon isaanii keessatti galmeeffamanii
            </p>
          </div>

          {isMonitoringUnlocked && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Aanaa */}
              {allAanaas.length > 0 && (
                <select
                  value={selectedAanaa}
                  onChange={(e) => setSelectedAanaa(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">-- Aanaa Hundaa --</option>
                  {allAanaas.map((a, i) => (
                    <option key={i} value={a}>
                      📍 Aanaa: {a}
                    </option>
                  ))}
                </select>
              )}

              {/* Filter by School */}
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ALL">-- M/Barnootaa Hundaa ({allSchools.length}) --</option>
                {allSchools.map((sch, i) => (
                  <option key={i} value={sch}>
                    🏫 {sch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!isMonitoringUnlocked ? (
          <form onSubmit={handleUnlockMonitoring} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto font-black text-xl">
              🔒
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Sirna Hordoffii Manneen Barnootaa & Aanaa Saaquuf Jecha Darbiisaa Seensisaa
            </h4>
            <p className="text-xs text-slate-500">
              Ragaalee manneen barnootaa Aanaa Bu'uura Boruu hunda ilaaluuf kooddii hidhaa galchaa:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                placeholder="Jecha darbiisaa saaqi..."
                value={monitoringPassInput}
                onChange={(e) => setMonitoringPassInput(e.target.value)}
                className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 grow"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-900 hover:bg-slate-900 text-amber-300 font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
              >
                🔓 Saaqi
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="p-3">#</th>
                  <th className="p-3">Mana Barumsaa</th>
                  <th className="p-3 text-center">Umurii 4</th>
                  <th className="p-3 text-center">Umurii 5</th>
                  <th className="p-3 text-center">Umurii 6</th>
                  <th className="p-3 text-center bg-indigo-50 text-indigo-900">Ida'ama (4-6)</th>
                  <th className="p-3 text-center">Dhiira</th>
                  <th className="p-3 text-center">Dhalaa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {schoolSummaries.map((sSum, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <School className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{sSum.schoolName}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-indigo-700">{sSum.tot4}</td>
                    <td className="p-3 text-center font-mono text-emerald-700">{sSum.tot5}</td>
                    <td className="p-3 text-center font-mono text-amber-700">{sSum.tot6}</td>
                    <td className="p-3 text-center font-mono font-extrabold text-indigo-950 bg-indigo-50/60 text-base">
                      {sSum.grandTotal}
                    </td>
                    <td className="p-3 text-center font-mono text-blue-700">{sSum.totMale}</td>
                    <td className="p-3 text-center font-mono text-pink-700">{sSum.totFemale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Student List for Bu'uura Boruu */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Tarree Barattoota Bu'uura Boruu ({buuuraStudents.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Barattoota Bu'uura Boruu galmeeffaman tokkoon tokkoo isaanii
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Barbaradi (Maqaa, STU ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {buuuraStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
            <Baby className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Hanga dhiyeenyaatti barattootni Bu'uura Boruu hin galmeeffamne!</p>
            <p className="text-xs max-w-md mx-auto">
              Gara tab 'Galmee Barattootaa' deemanii Kutaa: 'Bu'uura Boruu (Umurii 4-6)' filachuun galmeessaa.
            </p>
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Barataa Bu'uura Boruu Galmeessi</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="p-3">#</th>
                  <th className="p-3">Maqaa Guutuu</th>
                  <th className="p-3">STU ID / FAN ID</th>
                  <th className="p-3 text-center">Saala</th>
                  <th className="p-3 text-center">Umurii</th>
                  <th className="p-3">Bara Dhalootaa</th>
                  <th className="p-3">Mana Barumsaa</th>
                  <th className="p-3">Maatii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {buuuraStudents.map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{st.maqaaGuutuu}</td>
                    <td className="p-3 font-mono text-indigo-700">
                      <div>STU: {st.nationalId || '-'}</div>
                      <div className="text-[10px] text-slate-500">FAN: {st.fanId || 'NO'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          st.koorniyaa === 'Dhalaa'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {st.koorniyaa}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-black font-mono">
                        Umurii {st.umurii}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{st.baraDhalootaa}</td>
                    <td className="p-3 text-slate-700">{st.manaBarumsaa}</td>
                    <td className="p-3 text-slate-600 text-xs">
                      <div>👩 {st.maqaaHaadhaa || '-'}</div>
                      <div className="text-[10px] text-slate-400">📞 {st.lakkBilbilaMaatii || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
