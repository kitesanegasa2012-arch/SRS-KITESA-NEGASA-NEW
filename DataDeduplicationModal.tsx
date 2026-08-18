import React, { useState } from 'react';
import { Student } from '../types';
import {
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  School,
  Building,
  MapPin,
  Landmark,
  X,
  Lock,
  Search,
  Eye,
  Edit2,
  Save,
  RefreshCw,
  Info,
  FileSpreadsheet,
} from 'lucide-react';

interface DataDeduplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  allSchools?: string[];
  allWoredas?: string[];
  allZones?: string[];
  onDeleteStudentsByIDs: (ids: string[]) => void;
  onDeleteStudent?: (id: string) => void;
  onUpdateStudent?: (updated: Student) => void;
}

export type DuplicateLevel = 'school' | 'woreda' | 'zone' | 'oromiyaa';
export type DuplicateCategory = 'students' | 'schools' | 'woredas' | 'zones' | 'reports';

export interface DuplicateGroup {
  id: string;
  reason: string;
  level: DuplicateLevel;
  category: DuplicateCategory;
  keyDetails: string;
  records: Student[];
}

export const DataDeduplicationModal: React.FC<DataDeduplicationModalProps> = ({
  isOpen,
  onClose,
  students,
  allSchools = [],
  allWoredas = [],
  allZones = [],
  onDeleteStudentsByIDs,
  onDeleteStudent,
  onUpdateStudent,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<DuplicateLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<DuplicateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Explicit Permission Confirmation Modal States
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionTargetLevel, setPermissionTargetLevel] = useState<string>('');
  const [permissionTargetIds, setPermissionTargetIds] = useState<string[]>([]);
  const [permissionUserConfirmText, setPermissionUserConfirmText] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // View Record Modal State
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Edit Record Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  if (!isOpen) return null;

  const norm = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // Deduplication Engine across all levels & categories
  const findDuplicateGroups = (): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = [];

    // Maps for grouping
    const nationalIdMap = new Map<string, Student[]>();
    const fanIdMap = new Map<string, Student[]>();
    const nameAndMotherMap = new Map<string, Student[]>();

    // Maps for entity level duplicates
    const schoolNameMap = new Map<string, Student[]>();
    const woredaNameMap = new Map<string, Student[]>();
    const zoneNameMap = new Map<string, Student[]>();

    students.forEach((s) => {
      // 1. National ID Duplicate
      if (s.nationalId && s.nationalId !== '-' && s.nationalId !== 'NO') {
        const k = s.nationalId.trim().toUpperCase();
        if (!nationalIdMap.has(k)) nationalIdMap.set(k, []);
        nationalIdMap.get(k)!.push(s);
      }

      // 2. FAN ID Duplicate
      if (s.fanId && s.fanId !== 'NO') {
        const k = s.fanId.trim().toUpperCase();
        if (!fanIdMap.has(k)) fanIdMap.set(k, []);
        fanIdMap.get(k)!.push(s);
      }

      // 3. Name & Mother Name Duplicate
      const cleanN = norm(s.maqaaGuutuu);
      const cleanM = norm(s.maqaaHaadhaa);
      if (cleanN && cleanM) {
        const k = `${cleanN}_${cleanM}`;
        if (!nameAndMotherMap.has(k)) nameAndMotherMap.set(k, []);
        nameAndMotherMap.get(k)!.push(s);
      }

      // 4. School level grouping
      const sName = (s.manaBarumsaa || '').trim();
      if (sName) {
        if (!schoolNameMap.has(sName)) schoolNameMap.set(sName, []);
        schoolNameMap.get(sName)!.push(s);
      }

      // 5. Woreda level grouping
      const wName = (s.aanaa || '').trim();
      if (wName) {
        if (!woredaNameMap.has(wName)) woredaNameMap.set(wName, []);
        woredaNameMap.get(wName)!.push(s);
      }

      // 6. Zone level grouping
      const zName = (s.godina || '').trim();
      if (zName) {
        if (!zoneNameMap.has(zName)) zoneNameMap.set(zName, []);
        zoneNameMap.get(zName)!.push(s);
      }
    });

    // Process National ID Duplicates
    nationalIdMap.forEach((list, natId) => {
      if (list.length > 1) {
        const first = list[0];
        let level: DuplicateLevel = 'school';
        if (list.some((item) => item.aanaa !== first.aanaa)) level = 'woreda';
        else if (list.some((item) => item.godina !== first.godina)) level = 'zone';

        groups.push({
          id: `dup_nat_${natId}`,
          reason: '🚨 National ID Irra-deebi\'ame',
          level,
          category: 'students',
          keyDetails: `National ID: ${natId}`,
          records: list,
        });
      }
    });

    // Process FAN ID Duplicates
    fanIdMap.forEach((list, fanId) => {
      if (list.length > 1) {
        const first = list[0];
        let level: DuplicateLevel = 'school';
        if (list.some((item) => item.aanaa !== first.aanaa)) level = 'woreda';
        else if (list.some((item) => item.godina !== first.godina)) level = 'zone';

        groups.push({
          id: `dup_fan_${fanId}`,
          reason: '🆔 FAN ID Irra-deebi\'ame',
          level,
          category: 'students',
          keyDetails: `FAN ID: ${fanId}`,
          records: list,
        });
      }
    });

    // Process Name + Mother Name Duplicates
    nameAndMotherMap.forEach((list, key) => {
      if (list.length > 1) {
        const first = list[0];
        let level: DuplicateLevel = 'school';
        if (list.some((item) => item.aanaa !== first.aanaa)) level = 'woreda';
        else if (list.some((item) => item.godina !== first.godina)) level = 'zone';

        groups.push({
          id: `dup_nm_${key}`,
          reason: '👨‍🎓 Maqaa Barataa & Haadhaa Wal-sima',
          level,
          category: 'students',
          keyDetails: `Maqaa: ${first.maqaaGuutuu} (Haadhaa: ${first.maqaaHaadhaa})`,
          records: list,
        });
      }
    });

    // Process School Variant / Multi-Aanaa Duplicates
    schoolNameMap.forEach((list, sName) => {
      const distinctWoredas = new Set(list.map((s) => s.aanaa));
      if (distinctWoredas.size > 1) {
        groups.push({
          id: `dup_sch_${sName}`,
          reason: '🏫 Mana Barumsaa Aanoolee Adda Addaa Keessatti Galmee Irra-deebi\'ii Qabu',
          level: 'woreda',
          category: 'schools',
          keyDetails: `M/B: "${sName}" (Aanoolee: ${Array.from(distinctWoredas).join(', ')})`,
          records: list,
        });
      }
    });

    // Process Woreda Multi-Zone Duplicates
    woredaNameMap.forEach((list, wName) => {
      const distinctZones = new Set(list.map((s) => s.godina));
      if (distinctZones.size > 1) {
        groups.push({
          id: `dup_wor_${wName}`,
          reason: '🏛️ Aanaa Godinaalee Adda Addaa Keessatti Irra-deebi\'ame',
          level: 'zone',
          category: 'woredas',
          keyDetails: `Aanaa: "${wName}" (Godinaalee: ${Array.from(distinctZones).join(', ')})`,
          records: list,
        });
      }
    });

    return groups;
  };

  const allDuplicateGroups = findDuplicateGroups();

  // Stats Counters
  const schoolCount = allDuplicateGroups.filter((g) => g.level === 'school').length;
  const woredaCount = allDuplicateGroups.filter((g) => g.level === 'woreda').length;
  const zoneCount = allDuplicateGroups.filter((g) => g.level === 'zone').length;
  const oromiyaaCount = allDuplicateGroups.filter((g) => g.level === 'oromiyaa').length;

  // Filtered Groups
  const filteredGroups = allDuplicateGroups.filter((g) => {
    if (selectedLevel !== 'all' && g.level !== selectedLevel) return false;
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        g.reason.toLowerCase().includes(q) ||
        g.keyDetails.toLowerCase().includes(q) ||
        g.records.some(
          (r) =>
            r.maqaaGuutuu.toLowerCase().includes(q) ||
            r.manaBarumsaa.toLowerCase().includes(q) ||
            r.aanaa.toLowerCase().includes(q)
        )
      );
    }
    return true;
  });

  // Action: Single Group Deletion Request
  const handleRequestGroupDeletion = (grp: DuplicateGroup) => {
    // Keep 1st record, delete all subsequent duplicate records
    const idsToDelete = grp.records.slice(1).map((r) => r.id);
    if (idsToDelete.length === 0) return;

    setPermissionTargetLevel(grp.level.toUpperCase());
    setPermissionTargetIds(idsToDelete);
    setPermissionUserConfirmText('');
    setShowPermissionPrompt(true);
  };

  // Action: Bulk Deletion Request per Level
  const handleRequestBulkDeletion = (level: DuplicateLevel | 'all') => {
    const targetGroups = level === 'all' ? filteredGroups : filteredGroups.filter((g) => g.level === level);

    const idsToDelete: string[] = [];
    targetGroups.forEach((g) => {
      // Keep 1st record (primary), gather remaining duplicate IDs
      idsToDelete.push(...g.records.slice(1).map((r) => r.id));
    });

    if (idsToDelete.length === 0) {
      alert('⚠️ Ragaan duplicated ta\'e balleessuuf jiraatu tokkolleen hin argamne!');
      return;
    }

    setPermissionTargetLevel(level === 'all' ? 'WALIIGALAA (HUNDA)' : level.toUpperCase());
    setPermissionTargetIds(Array.from(new Set(idsToDelete)));
    setPermissionUserConfirmText('');
    setShowPermissionPrompt(true);
  };

  // Action: Execute Permission Confirmed Deletion
  const handleConfirmPermissionAndDelete = () => {
    if (permissionUserConfirmText.trim().toUpperCase() !== 'HAQI') {
      alert('Maaloo jecha "HAQI" jedhu sirriitti galchaa!');
      return;
    }

    onDeleteStudentsByIDs(permissionTargetIds);
    setShowPermissionPrompt(false);

    setActionMessage(
      `✓ EEYYAMNI KENNAMEERA: Ragaaleen duplicated ta'an (${permissionTargetIds.length}) sadarkaa ${permissionTargetLevel} irraa haqamaniiru!`
    );
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleIndividualDelete = (stId: string, name: string) => {
    if (confirm(`Ragaa duplicated barataa "${name}" jedhamu kana balleessuuf mirkaneessaa?`)) {
      if (onDeleteStudent) {
        onDeleteStudent(stId);
      } else {
        onDeleteStudentsByIDs([stId]);
      }
      setActionMessage(`✓ Barataan "${name}" haqameera!`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (onUpdateStudent) {
      onUpdateStudent(editingStudent);
      setActionMessage(`✓ Ragaan barataa "${editingStudent.maqaaGuutuu}" sirreeffameera (Gulaalameera)!`);
      setEditingStudent(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-800/60 rounded-3xl max-w-5xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border-b border-indigo-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-amber-300 flex items-center justify-center shadow-lg font-black shrink-0 border border-amber-400/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                <span>PERMISSION-BASED DE-DUPLICATION SYSTEM</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Ragaalee Duplicated Ta'an Ilaaluu, Gulaaluu & Haquu
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toast Notification */}
        {actionMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 p-3.5 px-6 text-emerald-200 text-xs font-bold flex items-center gap-2 shrink-0 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Hunda ({allDuplicateGroups.length})
          </button>
          <button
            onClick={() => setSelectedCategory('students')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'students'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            👨‍🎓 Barattoota ({allDuplicateGroups.filter((g) => g.category === 'students').length})
          </button>
          <button
            onClick={() => setSelectedCategory('schools')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'schools'
                ? 'bg-sky-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🏫 Manneen Barnootaa ({allDuplicateGroups.filter((g) => g.category === 'schools').length})
          </button>
          <button
            onClick={() => setSelectedCategory('woredas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'woredas'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🏛️ Aanoolee ({allDuplicateGroups.filter((g) => g.category === 'woredas').length})
          </button>
          <button
            onClick={() => setSelectedCategory('zones')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'zones'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🗺️ Godinaalee ({allDuplicateGroups.filter((g) => g.category === 'zones').length})
          </button>
        </div>

        {/* Level Counter Badges */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <button
            onClick={() => setSelectedLevel('school')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              selectedLevel === 'school'
                ? 'bg-indigo-900/90 border-amber-400 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-sky-400" /> M/Barumsaa
              </span>
              <span className="px-2 py-0.5 bg-sky-950 border border-sky-500/40 text-sky-300 rounded-full text-[10px]">
                {schoolCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Duplicated M/Barumsaa keessatti</p>
          </button>

          <button
            onClick={() => setSelectedLevel('woreda')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              selectedLevel === 'woreda'
                ? 'bg-indigo-900/90 border-amber-400 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-400" /> Aanaa
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-full text-[10px]">
                {woredaCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">M/Barumsaa adda addaa Aanaa keessatti</p>
          </button>

          <button
            onClick={() => setSelectedLevel('zone')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              selectedLevel === 'zone'
                ? 'bg-indigo-900/90 border-amber-400 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> Godina
              </span>
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-300 rounded-full text-[10px]">
                {zoneCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Aanoolee adda addaa Godina keessatti</p>
          </button>

          <button
            onClick={() => setSelectedLevel('oromiyaa')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              selectedLevel === 'oromiyaa'
                ? 'bg-indigo-900/90 border-amber-400 text-white shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-rose-400" /> Biiroo Oromiyaa
              </span>
              <span className="px-2 py-0.5 bg-rose-950 border border-rose-500/40 text-rose-300 rounded-full text-[10px]">
                {oromiyaaCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Godinaalee adda addaa Biiroo keessatti</p>
          </button>
        </div>

        {/* Search Bar & Action Trigger */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Barbaa Maqaa, M/B, Aanaa, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLevel === 'all' && selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hunda Agarsiisi ({allDuplicateGroups.length})
            </button>

            <button
              onClick={() => handleRequestBulkDeletion(selectedLevel)}
              disabled={filteredGroups.length === 0}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Haquu Hunda (Permission Request)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredGroups.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Ragaan Duplicated Ta'e Hin Argamne!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Qabiyyee ({selectedCategory === 'all' ? 'Hundaa' : selectedCategory}) fi Sadarkaa ({selectedLevel === 'all' ? 'Hundaa' : selectedLevel}) irratti ragaan irra-deebi'amee galmeeffame tokkolleen hin jiru. Ragaan keessan qulqulluudha.
              </p>
            </div>
          ) : (
            filteredGroups.map((grp, idx) => {
              const levelBadgeMap: Record<DuplicateLevel, { color: string; icon: any; label: string }> = {
                school: { color: 'bg-sky-950 border-sky-500/40 text-sky-300', icon: School, label: 'Sadarkaa M/Barumsaa' },
                woreda: { color: 'bg-emerald-950 border-emerald-500/40 text-emerald-300', icon: Building, label: 'Sadarkaa Aanaa' },
                zone: { color: 'bg-purple-950 border-purple-500/40 text-purple-300', icon: MapPin, label: 'Sadarkaa Godinaa' },
                oromiyaa: { color: 'bg-rose-950 border-rose-500/40 text-rose-300', icon: Landmark, label: 'Sadarkaa Oromiyaa' },
              };

              const lvlInfo = levelBadgeMap[grp.level];
              const LvlIcon = lvlInfo.icon;

              return (
                <div key={grp.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${lvlInfo.color}`}>
                        <LvlIcon className="w-3 h-3" />
                        <span>{lvlInfo.label}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[10px] font-bold rounded-md uppercase">
                        {grp.category}
                      </span>
                      <span className="text-xs font-black text-amber-300">
                        {grp.reason}: {grp.keyDetails}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRequestGroupDeletion(grp)}
                      className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Balleessi Irra-deebii ({grp.records.length - 1})</span>
                    </button>
                  </div>

                  {/* Student/Entity Record Cards Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {grp.records.map((st, sIdx) => (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          sIdx === 0
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-white">
                          <span className="flex items-center gap-1.5">
                            {sIdx === 0 ? (
                              <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-black rounded text-[9px] uppercase">
                                Primary (Keephaa)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-rose-900 text-rose-200 font-black rounded text-[9px] uppercase">
                                Duplicate #{sIdx}
                              </span>
                            )}
                            <span>{st.maqaaGuutuu}</span>
                          </span>
                          <span className="text-slate-400 text-[10px]">Kutaa {st.kutaa}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-400">
                          <div>👩 Maqaa Haadhaa: <strong className="text-white">{st.maqaaHaadhaa || '-'}</strong></div>
                          <div>🆔 National ID: <strong className="text-amber-300">{st.nationalId || '-'}</strong></div>
                          <div>🏫 M/Barumsaa: <strong className="text-slate-200">{st.manaBarumsaa}</strong></div>
                          <div>🏛️ Aanaa/Godina: <strong className="text-slate-200">{st.aanaa} / {st.godina}</strong></div>
                        </div>

                        {/* Action Buttons: Ilaali, Gulaali, Haqi */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => setViewingStudent(st)}
                            className="px-2 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Ragaa Duplicated Kana Ilaali"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>Ilaali</span>
                          </button>

                          <button
                            onClick={() => setEditingStudent({ ...st })}
                            className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Ragaa Duplicated Kana Gulaali / Sirreessi"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-400" />
                            <span>Gulaali</span>
                          </button>

                          <button
                            onClick={() => handleIndividualDelete(st.id, st.maqaaGuutuu)}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Ragaa Kana Balleessi"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Haqi</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Duplicated n-1 ta'an ni haqamu; galmeen calqabaa ni tura.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cufi (Close)
          </button>
        </div>
      </div>

      {/* View Details Modal (Ilaali) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/80 rounded-3xl max-w-xl w-full text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white">
                  Ragaa Duplicated Guutuu (View Details)
                </h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Maqaa Guutuu</span>
                <strong className="text-amber-300 text-sm">{viewingStudent.maqaaGuutuu}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Maqaa Haadhaa</span>
                <strong className="text-white">{viewingStudent.maqaaHaadhaa || '-'}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mana Barumsaa</span>
                <strong className="text-sky-300">{viewingStudent.manaBarumsaa}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Aanaa / Godina</span>
                <strong className="text-emerald-300">{viewingStudent.aanaa} / {viewingStudent.godina}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Kutaa & Umurii</span>
                <strong className="text-white">Kutaa {viewingStudent.kutaa} (Umurii {viewingStudent.umurii})</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">National ID / FAN ID</span>
                <strong className="text-amber-400 font-mono">{viewingStudent.nationalId || '-'} / {viewingStudent.fanId || '-'}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Cufi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal (Gulaali) */}
      {editingStudent && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/80 rounded-3xl max-w-xl w-full text-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  Ragaa Duplicated Sirreessuu / Gulaaluu
                </h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Maqaa Guutuu</label>
                  <input
                    type="text"
                    value={editingStudent.maqaaGuutuu}
                    onChange={(e) => setEditingStudent({ ...editingStudent, maqaaGuutuu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Maqaa Haadhaa</label>
                  <input
                    type="text"
                    value={editingStudent.maqaaHaadhaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, maqaaHaadhaa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Mana Barumsaa</label>
                  <input
                    type="text"
                    value={editingStudent.manaBarumsaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, manaBarumsaa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Aanaa</label>
                  <input
                    type="text"
                    value={editingStudent.aanaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, aanaa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Kutaa</label>
                  <input
                    type="text"
                    value={editingStudent.kutaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, kutaa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Umurii</label>
                  <input
                    type="number"
                    value={editingStudent.umurii}
                    onChange={(e) => setEditingStudent({ ...editingStudent, umurii: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">National ID</label>
                  <input
                    type="text"
                    value={editingStudent.nationalId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">FAN ID</label>
                  <input
                    type="text"
                    value={editingStudent.fanId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fanId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Lakkii
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Odeeffannoo Olkaa'i (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Permission Confirmation Prompt Modal */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-lg w-full text-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-rose-600/30">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-400">
                  PERMISSION REQUEST (Eeyyama Haquus Gaafachuu)
                </h3>
                <p className="text-xs text-slate-300">
                  Goocha Balleessaa Ragaa Duplicated Sadarkaa <strong>{permissionTargetLevel}</strong>
                </p>
              </div>
            </div>

            <div className="bg-rose-950/50 border border-rose-800/60 p-4 rounded-2xl text-xs space-y-2 text-rose-200">
              <p className="font-bold text-white">
                ⚠️ Mirkanneessa Permission: Ragaalee irra-deebi'anii galmeeffaman ({permissionTargetIds.length}) sadarkaa <strong>{permissionTargetLevel}</strong> irraa balleessuuf mirkaneessuun si irra jira.
              </p>
              <p className="text-slate-300">
                Ragaan haqame kuusaa ragaa (Database) keessaa yeruma sana kan dhabamu ta'a.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Jecha Mirkaneessaa: Jecha <strong>HAQI</strong> jedhu galchi
              </label>
              <input
                type="text"
                placeholder="HAQI"
                value={permissionUserConfirmText}
                onChange={(e) => setPermissionUserConfirmText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-center font-black tracking-widest text-amber-300 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Lakkii (Cancel)
              </button>

              <button
                disabled={permissionUserConfirmText.trim().toUpperCase() !== 'HAQI'}
                onClick={handleConfirmPermissionAndDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eeyyee, Balleessi (Confirm Permission)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
