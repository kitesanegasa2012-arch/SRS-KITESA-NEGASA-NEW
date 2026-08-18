import React, { useState, useEffect } from 'react';
import { Student, GradeTarget } from '../types';
import { Target, Save, CheckCircle2, Award, Filter, School, Building, MapPin } from 'lucide-react';
import {
  getUnifiedSchoolGradeTargets,
  saveUnifiedSchoolTarget,
  getUnifiedWoredaTargets,
  calculateGradesTargetTotal,
} from '../utils/storage';

interface GradeTargetsProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  onSaveTargets: (newTargets: Record<string, GradeTarget>) => void;
  allSchools?: string[];
  allWoredas?: string[];
  allZones?: string[];
  selectedZoneFilter?: string;
  onSelectZoneFilter?: (zone: string) => void;
  selectedWoredaFilter?: string;
  onSelectWoredaFilter?: (woreda: string) => void;
  selectedSchoolFilter?: string;
  onSelectSchoolFilter?: (sch: string) => void;
}

export const GradeTargets: React.FC<GradeTargetsProps> = ({
  students,
  targets,
  onSaveTargets,
  allSchools = [],
  allWoredas = [],
  allZones = [],
  selectedZoneFilter = 'ALL_ZONES',
  onSelectZoneFilter,
  selectedWoredaFilter = 'ALL_WOREDAS',
  onSelectWoredaFilter,
  selectedSchoolFilter = 'ALL_WOREDA',
  onSelectSchoolFilter,
}) => {
  const [localTargets, setLocalTargets] = useState<Record<string, GradeTarget>>(targets);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync targets when filter changes
  useEffect(() => {
    if (selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA') {
      const { targets: schTargets } = getUnifiedSchoolGradeTargets(selectedSchoolFilter, targets);
      setLocalTargets(schTargets);
    } else if (selectedWoredaFilter && selectedWoredaFilter !== 'ALL_WOREDAS') {
      const { gradeTargets: worTargets } = getUnifiedWoredaTargets(selectedWoredaFilter, allSchools, students);
      setLocalTargets(worTargets);
    } else {
      const { gradeTargets: allGrades } = getUnifiedWoredaTargets('ALL_WOREDAS', allSchools, students);
      setLocalTargets(allGrades && Object.keys(allGrades).length > 0 ? allGrades : targets);
    }
  }, [selectedSchoolFilter, selectedWoredaFilter, targets, allSchools, students]);

  // Filter students based on selected Zone, Woreda, and School
  const activeStudents = students.filter((s) => {
    if (selectedZoneFilter && selectedZoneFilter !== 'ALL_ZONES' && s.godina && s.godina.trim().toLowerCase() !== selectedZoneFilter.trim().toLowerCase()) {
      return false;
    }
    if (selectedWoredaFilter && selectedWoredaFilter !== 'ALL_WOREDAS' && s.aanaa && s.aanaa.trim().toLowerCase() !== selectedWoredaFilter.trim().toLowerCase()) {
      return false;
    }
    if (selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA' && s.manaBarumsaa && s.manaBarumsaa.trim().toLowerCase() !== selectedSchoolFilter.trim().toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate unique active schools in current Zone/Woreda context
  const activeSchoolsInContext = Array.from(
    new Set(
      students
        .filter((s) => {
          if (selectedZoneFilter && selectedZoneFilter !== 'ALL_ZONES' && s.godina && s.godina.trim().toLowerCase() !== selectedZoneFilter.trim().toLowerCase()) return false;
          if (selectedWoredaFilter && selectedWoredaFilter !== 'ALL_WOREDAS' && s.aanaa && s.aanaa.trim().toLowerCase() !== selectedWoredaFilter.trim().toLowerCase()) return false;
          return true;
        })
        .map((s) => s.manaBarumsaa)
        .filter((sch): sch is string => Boolean(sch && sch.trim() !== ''))
    )
  );

  const totalSchoolsCount = Math.max(1, activeSchoolsInContext.length > 0 ? activeSchoolsInContext.length : (allSchools.length > 0 ? allSchools.length : 28));

  // Single school filter active
  const isSingleSchoolSelected = Boolean(selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA');

  // Total calculated target for current view (sum of grades 1-12 matching Reports and Dashboard)
  const totalCalculatedTarget = calculateGradesTargetTotal(localTargets);

  // Helper to get target display for individual rows
  const getDisplayGradeTarget = (targetObj: GradeTarget) => {
    const rawD = targetObj?.dhiira || 0;
    const rawF = targetObj?.dhalaa || 0;
    return { dhiira: rawD, dhalaa: rawF, total: rawD + rawF };
  };

  const handleTargetChange = (kutaa: string, gender: 'dhiira' | 'dhalaa', val: number) => {
    setLocalTargets((prev) => ({
      ...prev,
      [kutaa]: {
        ...prev[kutaa],
        [gender]: Math.max(0, val),
      },
    }));
  };

  const handleSave = () => {
    onSaveTargets(localTargets);

    // If filtering by a specific school or woreda, automatically persist total target and detailed grade targets
    try {
      if (selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA') {
        saveUnifiedSchoolTarget(selectedSchoolFilter, totalCalculatedTarget, localTargets);
      } else if (selectedWoredaFilter && selectedWoredaFilter !== 'ALL_WOREDAS') {
        const saved = localStorage.getItem('srs_custom_targets_map');
        const map = saved ? JSON.parse(saved) : {};
        map[selectedWoredaFilter] = totalCalculatedTarget;
        localStorage.setItem('srs_custom_targets_map', JSON.stringify(map));
      }
    } catch (err) {
      console.error('Error saving custom targets map:', err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const buuuraAgeGroups = [
    { key: 'bb_4', label: "Bu'uura Boruu - Umurii 4", age: 4 },
    { key: 'bb_5', label: "Bu'uura Boruu - Umurii 5", age: 5 },
    { key: 'bb_6', label: "Bu'uura Boruu - Umurii 6", age: 6 },
  ];

  const gradesList = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Calculate actuals for Bu'uura Boruu
  const buuuraStudents = activeStudents.filter(
    (s) => s.kutaa === '0' || (s.kutaa || '').toLowerCase().includes('buuura') || (s.kutaa || '').toLowerCase().includes('borru')
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            <span>Karoora Galmee Kutaa Kutaadhaan & Bu'uura Boruu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Karoora baay'ina barattootaa Bu'uura Boruu (Umurii 4, 5, 6) fi Kutaa 1 - 12 dhiiraa fi dhalaa galmeessuuf karoorfame
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Zone Filter */}
          {allZones.length > 0 && onSelectZoneFilter && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Godina:</span>
              <select
                value={selectedZoneFilter}
                onChange={(e) => onSelectZoneFilter(e.target.value)}
                className="bg-white border border-amber-300 text-amber-950 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL_ZONES">🗺️ Godina Hunda</option>
                {allZones.map((z) => (
                  <option key={z} value={z}>
                    📍 {z}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Woreda Filter */}
          {allWoredas.length > 0 && onSelectWoredaFilter && (
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-900 shadow-sm">
              <Building className="w-3.5 h-3.5 text-sky-600" />
              <span>Aanaa:</span>
              <select
                value={selectedWoredaFilter}
                onChange={(e) => onSelectWoredaFilter(e.target.value)}
                className="bg-white border border-sky-300 text-sky-950 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="ALL_WOREDAS">🏛️ Aanaa Hunda</option>
                {allWoredas.map((w) => (
                  <option key={w} value={w}>
                    🏛️ {w}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* School Filter */}
          {allSchools.length > 0 && onSelectSchoolFilter && (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-900 shadow-sm">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>M/B:</span>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => onSelectSchoolFilter(e.target.value)}
                className="bg-white border border-indigo-300 text-indigo-900 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL_WOREDA">🏫 M/Barumsaa Hunda</option>
                {allSchools.map((sch) => (
                  <option key={sch} value={sch}>
                    🏫 {sch}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Karoora Ol-ka'i (Save Targets)</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Karoorri milkiidhaan ol-ka'ameera! Qaqqabiinsi karoora M/B kanaas Sadarkaa Aanaa (TAB A) irratti ofumaan qinda'eera.</span>
        </div>
      )}

      {/* Aggregation Summary Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-indigo-700/50 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-800/60 border border-indigo-500/40 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Qindaa'ina Karooraa: {' '}
              {selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA'
                ? `🏫 M/B ${selectedSchoolFilter}`
                : selectedWoredaFilter && selectedWoredaFilter !== 'ALL_WOREDAS'
                ? `🏛️ Aanaa ${selectedWoredaFilter}`
                : selectedZoneFilter && selectedZoneFilter !== 'ALL_ZONES'
                ? `🗺️ Godina ${selectedZoneFilter}`
                : '🏛️ Sadarkaa Aanaa Hunda'}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Qindoomina Karooraa fi Raawwii {selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA' ? 'M/Barumsaa' : 'Aanaa'}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            {selectedSchoolFilter && selectedSchoolFilter !== 'ALL_WOREDA'
              ? `Karoorri kutaawwan M/B ${selectedSchoolFilter} tiif galchitan kun ida'amee akka karoora M/B sanaatti kuufama. Ida'amni karoora M/Barumsaa aanaa keessaa hundis TAB A (Sadarkaa Aanaa) irratti ofumaan walitti qindaa'a!`
              : `Karoorri kutaadhaan galmeessitan kun waliigala karoora aanaa tiif faayidaa irra oola. M/Barumsaa addatiif karoora kennuuf calaltuu M/B olii fayyadamaa.`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
          <div className="bg-slate-800/80 border border-indigo-500/30 p-3 rounded-xl min-w-[110px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Ida'ama Karooraa</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{totalCalculatedTarget.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/80 border border-indigo-500/30 p-3 rounded-xl min-w-[110px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Raawwii (Barattoota)</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{activeStudents.length.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/80 border border-indigo-500/30 p-3 rounded-xl min-w-[110px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Raawwii (%)</p>
            <p className="text-xl font-black text-sky-400 mt-0.5">
              {totalCalculatedTarget > 0 ? ((activeStudents.length / totalCalculatedTarget) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Target Table & Progress Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
        <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide px-2 pt-2 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span>1. Karoora Bu'uura Boruu (Umurii 4, Umurii 5, Umurii 6 & Ida'ama 4-6)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-amber-100/80 text-amber-950 uppercase font-bold text-xs border-b border-amber-200">
              <tr>
                <th className="px-4 py-3.5">Kutaa / Sadarkaa Umurii</th>
                <th className="px-4 py-3.5">Karoora Dhiira</th>
                <th className="px-4 py-3.5">Raawwii Dhiira</th>
                <th className="px-4 py-3.5">Karoora Dhalaa</th>
                <th className="px-4 py-3.5">Raawwii Dhalaa</th>
                <th className="px-4 py-3.5">Waliigala Karoora</th>
                <th className="px-4 py-3.5">Waliigala Galmaa'e</th>
                <th className="px-4 py-3.5">Raawwii (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-semibold">
              {buuuraAgeGroups.map((ag) => {
                const targetObj = localTargets[ag.key] || { kutaa: ag.key, dhiira: 15, dhalaa: 15 };
                const displayTarget = getDisplayGradeTarget(targetObj);
                const inAge = buuuraStudents.filter((s) => s.umurii === ag.age);
                const actualDhiira = inAge.filter((s) => s.koorniyaa === 'Dhiira').length;
                const actualDhalaa = inAge.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const totalTarget = displayTarget.total;
                const totalActual = inAge.length;
                const pct = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0';

                return (
                  <tr key={ag.key} className="hover:bg-amber-50/50 transition">
                    <td className="px-4 py-3 font-extrabold text-amber-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{ag.label}</span>
                    </td>
                    
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhiira}
                        onChange={(e) => handleTargetChange(ag.key, 'dhiira', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-blue-700">{actualDhiira}</td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhalaa}
                        onChange={(e) => handleTargetChange(ag.key, 'dhalaa', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-pink-700">{actualDhalaa}</td>

                    <td className="px-4 py-3 font-extrabold text-slate-800">{totalTarget}</td>

                    <td className="px-4 py-3 font-extrabold text-indigo-700">{totalActual}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{pct}%</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(pct) >= 100
                                ? 'bg-emerald-500'
                                : parseFloat(pct) >= 70
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal row for Bu'uura Boruu (Umurii 4-6) */}
              {(() => {
                const totTgtDhiira = buuuraAgeGroups.reduce((acc, ag) => acc + (localTargets[ag.key]?.dhiira || 0), 0);
                const totTgtDhalaa = buuuraAgeGroups.reduce((acc, ag) => acc + (localTargets[ag.key]?.dhalaa || 0), 0);
                const grandTgt = totTgtDhiira + totTgtDhalaa;
                const actDhiira = buuuraStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
                const actDhalaa = buuuraStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const grandAct = buuuraStudents.length;
                const grandPct = grandTgt > 0 ? ((grandAct / grandTgt) * 100).toFixed(1) : '0';

                return (
                  <tr className="bg-amber-200/80 font-black text-amber-950 text-sm">
                    <td className="px-4 py-3.5">IDA'AMA BU'UURA BORUU (UMURII 4-6)</td>
                    <td className="px-4 py-3.5 font-mono text-center">{totTgtDhiira}</td>
                    <td className="px-4 py-3.5 font-mono">{actDhiira}</td>
                    <td className="px-4 py-3.5 font-mono text-center">{totTgtDhalaa}</td>
                    <td className="px-4 py-3.5 font-mono">{actDhalaa}</td>
                    <td className="px-4 py-3.5 font-mono text-base">{grandTgt}</td>
                    <td className="px-4 py-3.5 font-mono text-base text-indigo-900">{grandAct}</td>
                    <td className="px-4 py-3.5 font-mono">{grandPct}%</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide px-2 pt-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span>2. Karoora & Raawwii Barattoota Umurii 7 Qofa (Kutaa 1 Qofa)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-amber-50 text-amber-950 uppercase font-bold text-xs border-b border-amber-200">
              <tr>
                <th className="px-4 py-3.5">Kutaa (Umurii 7)</th>
                <th className="px-4 py-3.5">Karoora Dhiira</th>
                <th className="px-4 py-3.5">Raawwii Dhiira (U7)</th>
                <th className="px-4 py-3.5">Karoora Dhalaa</th>
                <th className="px-4 py-3.5">Raawwii Dhalaa (U7)</th>
                <th className="px-4 py-3.5">Waliigala Karoora</th>
                <th className="px-4 py-3.5">Waliigala Galmaa'e (U7)</th>
                <th className="px-4 py-3.5">Raawwii (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-medium">
              {['1'].map((g) => {
                const targetKey = `u7_${g}`;
                const targetObj = localTargets[targetKey] || { kutaa: targetKey, dhiira: 0, dhalaa: 0 };
                const displayTarget = getDisplayGradeTarget(targetObj);
                const inGradeU7 = activeStudents.filter((s) => s.kutaa === g && s.umurii === 7);
                const actualDhiira = inGradeU7.filter((s) => s.koorniyaa === 'Dhiira').length;
                const actualDhalaa = inGradeU7.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const totalTarget = displayTarget.total;
                const totalActual = inGradeU7.length;
                const pct = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0';

                return (
                  <tr key={targetKey} className="hover:bg-amber-50/60 transition">
                    <td className="px-4 py-3 font-extrabold text-amber-900">Kutaa {g} (Umurii 7)</td>
                    
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhiira}
                        onChange={(e) => handleTargetChange(targetKey, 'dhiira', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-sky-700">{actualDhiira}</td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhalaa}
                        onChange={(e) => handleTargetChange(targetKey, 'dhalaa', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-rose-700">{actualDhalaa}</td>

                    <td className="px-4 py-3 font-extrabold text-slate-800">{totalTarget}</td>

                    <td className="px-4 py-3 font-extrabold text-indigo-700">{totalActual}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{pct}%</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(pct) >= 100
                                ? 'bg-emerald-500'
                                : parseFloat(pct) >= 70
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal Row for Age 7 (Kutaa 1) */}
              {(() => {
                const totTgtDhiira = ['1'].reduce((acc, g) => acc + (localTargets[`u7_${g}`]?.dhiira || 0), 0);
                const totTgtDhalaa = ['1'].reduce((acc, g) => acc + (localTargets[`u7_${g}`]?.dhalaa || 0), 0);
                const grandTgt = totTgtDhiira + totTgtDhalaa;
                const allU7 = activeStudents.filter((s) => s.umurii === 7);
                const actDhiira = allU7.filter((s) => s.koorniyaa === 'Dhiira').length;
                const actDhalaa = allU7.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const grandAct = allU7.length;
                const grandPct = grandTgt > 0 ? ((grandAct / grandTgt) * 100).toFixed(1) : '0';

                return (
                  <tr className="bg-amber-200/80 font-black text-amber-950 text-sm">
                    <td className="px-4 py-3.5">WALIIGALA BARATTOOTA UMURII 7 (KUTAA 1)</td>
                    <td className="px-4 py-3.5 font-mono text-center">{totTgtDhiira}</td>
                    <td className="px-4 py-3.5 font-mono">{actDhiira}</td>
                    <td className="px-4 py-3.5 font-mono text-center">{totTgtDhalaa}</td>
                    <td className="px-4 py-3.5 font-mono">{actDhalaa}</td>
                    <td className="px-4 py-3.5 font-mono text-base">{grandTgt}</td>
                    <td className="px-4 py-3.5 font-mono text-base text-indigo-900">{grandAct}</td>
                    <td className="px-4 py-3.5 font-mono">{grandPct}%</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide px-2 pt-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          <span>3. Karoora Waliigalaa Kutaa 1 - 12 (All Ages Grade 1 to 12)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/90 text-slate-900 uppercase font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Kutaa</th>
                <th className="px-4 py-3.5">Karoora Dhiira</th>
                <th className="px-4 py-3.5">Raawwii Dhiira</th>
                <th className="px-4 py-3.5">Karoora Dhalaa</th>
                <th className="px-4 py-3.5">Raawwii Dhalaa</th>
                <th className="px-4 py-3.5">Waliigala Karoora</th>
                <th className="px-4 py-3.5">Waliigala Galmaa'e</th>
                <th className="px-4 py-3.5">Raawwii (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradesList.map((g) => {
                const targetObj = localTargets[g] || { kutaa: g, dhiira: 0, dhalaa: 0 };
                const displayTarget = getDisplayGradeTarget(targetObj);
                const inGrade = activeStudents.filter((s) => s.kutaa === g);
                const actualDhiira = inGrade.filter((s) => s.koorniyaa === 'Dhiira').length;
                const actualDhalaa = inGrade.filter((s) => s.koorniyaa === 'Dhalaa').length;
                const totalTarget = displayTarget.total;
                const totalActual = inGrade.length;
                const pct = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0';

                return (
                  <tr key={g} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-extrabold text-slate-900">Kutaa {g}</td>
                    
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhiira}
                        onChange={(e) => handleTargetChange(g, 'dhiira', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-sky-700">{actualDhiira}</td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={targetObj.dhalaa}
                        onChange={(e) => handleTargetChange(g, 'dhalaa', parseInt(e.target.value) || 0)}
                        className="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-center"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-rose-700">{actualDhalaa}</td>

                    <td className="px-4 py-3 font-extrabold text-slate-800">{totalTarget}</td>

                    <td className="px-4 py-3 font-extrabold text-indigo-700">{totalActual}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{pct}%</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(pct) >= 100
                                ? 'bg-emerald-500'
                                : parseFloat(pct) >= 70
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                          />
                        </div>
                      </div>
                    </td>
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
