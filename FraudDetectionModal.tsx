import React, { useState } from 'react';
import { Student } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  CheckCircle2,
  X,
  Search,
  School,
  Building,
  MapPin,
  Landmark,
  Eye,
  Edit2,
  Trash2,
  Save,
  Info,
} from 'lucide-react';
import { analyzeAnomalies, FraudFlag } from '../utils/fraudChecker';

interface FraudDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  allSchools: string[];
  allWoredas: string[];
  allZones: string[];
  onDeleteStudentsByIDs: (ids: string[]) => void;
  onDeleteStudent?: (id: string) => void;
  onUpdateStudent?: (updated: Student) => void;
}

export const FraudDetectionModal: React.FC<FraudDetectionModalProps> = ({
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
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'school' | 'woreda' | 'zone' | 'oromiyaa'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // View Record Modal State
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Edit Record Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  if (!isOpen) return null;

  const allFlags = analyzeAnomalies(students, allSchools, allWoredas, allZones);

  // Filter flags
  const filteredFlags = allFlags.filter((f) => {
    if (selectedLevel !== 'all' && f.level !== selectedLevel) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        f.entityName.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Reject & Block Fraudulent Submission
  const handleRejectFraud = (flag: FraudFlag) => {
    if (flag.associatedStudentIds.length === 0) return;
    if (
      confirm(
        `⛔ GABAASA SOBAA DHOWWUU & BALLEESSUU:\n\nRagaalee sobaa/shakkisiisaa (${flag.associatedStudentIds.length}) M/B / Aanaa "${flag.entityName}" irraa dhihaate systema keessaa haquuf mirkaneessaa?`
      )
    ) {
      onDeleteStudentsByIDs(flag.associatedStudentIds);
      setNotification(
        `✓ GABAASNI SOBAA DHOWWAMEERA: Ragaaleen ${flag.associatedStudentIds.length} "${flag.entityName}" irraa dhufan systema keessaa haqamaniiru!`
      );
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleIndividualDelete = (stId: string, name: string) => {
    if (confirm(`Ragaa sobaa barataa "${name}" jedhamu kana systema keessaa haquuf mirkaneessaa?`)) {
      if (onDeleteStudent) {
        onDeleteStudent(stId);
      } else {
        onDeleteStudentsByIDs([stId]);
      }
      setNotification(`✓ Barataan "${name}" haqameera!`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (onUpdateStudent) {
      onUpdateStudent(editingStudent);
      setNotification(`✓ Ragaan barataa "${editingStudent.maqaaGuutuu}" sirreeffameera (Gulaalameera)!`);
      setEditingStudent(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-rose-800/60 rounded-3xl max-w-5xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-5 border-b border-rose-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg font-black shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                <span>ANTI-FRAUD & ANOMALY DETECTION SHIELD</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Ragaalee Sobaa Qabuu, Ilaaluu, Gulaaluu & Dhowwuu
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 p-3.5 px-6 text-emerald-200 text-xs font-bold flex items-center gap-2 shrink-0 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Level Filters */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLevel === 'all' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Hunda ({allFlags.length})
            </button>
            <button
              onClick={() => setSelectedLevel('school')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedLevel === 'school' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <School className="w-3.5 h-3.5 text-sky-400" /> M/Barumsaa
            </button>
            <button
              onClick={() => setSelectedLevel('woreda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedLevel === 'woreda' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-400" /> Aanaa
            </button>
            <button
              onClick={() => setSelectedLevel('zone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedLevel === 'zone' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-purple-400" /> Godina
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Barbaa M/B, Aanaa, Ykn Soba..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredFlags.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Ragaan Sobaa ykn Shakkisiisaan Tokkolleen Hin Argamne!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gabaasni M/Barumsaa, Aanaa, fi Godinaa hundi seeraa fi master registry waliin wal-sima.
              </p>
            </div>
          ) : (
            filteredFlags.map((flag) => {
              const matchedStudents = students.filter((s) => flag.associatedStudentIds.includes(s.id));

              return (
                <div
                  key={flag.id}
                  className="bg-slate-950 border border-rose-900/80 rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-rose-900/80 border border-rose-500/50 text-rose-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                          RAGAA SOBAA / ANOMALY
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[10px] font-bold rounded-md uppercase">
                          Sadarkaa {flag.level.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-black text-amber-300">{flag.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl">{flag.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold pt-0.5">
                        <span>📍 EESSATTI ARGAME:</span>
                        <strong className="text-white">
                          Mana Barumsaa / Aanaa / Godina: "{flag.entityName}"
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRejectFraud(flag)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Hunda Dhowwi / Reject ({flag.associatedStudentIds.length})</span>
                    </button>
                  </div>

                  {/* Flagged Individual Record Cards */}
                  {matchedStudents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {matchedStudents.map((st) => (
                        <div
                          key={st.id}
                          className="bg-slate-900/90 border border-rose-800/60 p-3 rounded-xl text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between font-black text-white">
                            <span>{st.maqaaGuutuu}</span>
                            <span className="text-amber-400 text-[11px]">Kutaa {st.kutaa} (Umurii {st.umurii})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-400">
                            <div>👩 Maqaa Haadhaa: <strong className="text-white">{st.maqaaHaadhaa || '-'}</strong></div>
                            <div>🆔 National ID: <strong className="text-amber-300">{st.nationalId || '-'}</strong></div>
                            <div>🏫 M/Barumsaa: <strong className="text-slate-200">{st.manaBarumsaa}</strong></div>
                            <div>🏛️ Aanaa: <strong className="text-slate-200">{st.aanaa}</strong></div>
                          </div>

                          {/* Action Buttons: Ilaali, Gulaali, Haqi */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => setViewingStudent(st)}
                              className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Ragaa Barataa Kanaa Guutummaatti Ilaali"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" />
                              <span>Ilaali</span>
                            </button>

                            <button
                              onClick={() => setEditingStudent({ ...st })}
                              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Ragaa Barataa Kanaa Sirreessi / Gulaali"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Gulaali</span>
                            </button>

                            <button
                              onClick={() => handleIndividualDelete(st.id, st.maqaaGuutuu)}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Ragaa Barataa Kanaa Balleessi"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Haqi</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Shield: Anti-Fraud Verification Engine Active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
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
                  Ragaa Barataa Guutuu (View Details)
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
                  Ragaa Barataa Sirreessuu / Gulaaluu
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
    </div>
  );
};
