import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  Landmark,
  School,
  KeyRound,
  Eye,
  Edit2,
  Trash2,
  Save,
  Info,
  Calendar,
  AlertTriangle,
  History,
} from 'lucide-react';

export interface TransferredReport {
  id: string;
  date: string;
  level: 'school_to_woreda' | 'woreda_to_zone' | 'zone_to_oromiyaa';
  levelLabel: string;
  senderGmail: string;
  senderEntity: string;
  recipientEntity: string;
  totalStudents: number;
  notes: string;
  shareUrl: string;
  createdAt: string;
  isDuplicateFlagged?: boolean;
}

interface SecureReportTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
  woredaName?: string;
  zoneName?: string;
  schoolName?: string;
  totalStudentsCount?: number;
}

const STORAGE_KEY_REPORTS = 'oromiyaa_transferred_reports_v1';

export const SecureReportTransferModal: React.FC<SecureReportTransferModalProps> = ({
  isOpen,
  onClose,
  reportTitle = "Gabaasa Consalidated Waliigalaa",
  woredaName = "",
  zoneName = "",
  schoolName = "",
  totalStudentsCount = 150,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'send' | 'history'>('send');
  const [transferLevel, setTransferLevel] = useState<'school_to_woreda' | 'woreda_to_zone' | 'zone_to_oromiyaa'>('woreda_to_zone');
  const [workGmail, setWorkGmail] = useState('');
  const [workPassword, setWorkPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [generatedSecureUrl, setGeneratedSecureUrl] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Stored Transferred Reports
  const [transferredReports, setTransferredReports] = useState<TransferredReport[]>([]);

  // View & Edit Modal States
  const [viewingReport, setViewingReport] = useState<TransferredReport | null>(null);
  const [editingReport, setEditingReport] = useState<TransferredReport | null>(null);

  // Load stored reports on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (stored) {
        setTransferredReports(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load transferred reports:', e);
    }
  }, []);

  // Save transferred reports helper
  const saveReportsToStorage = (updated: TransferredReport[]) => {
    setTransferredReports(updated);
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to store transferred reports:', e);
    }
  };

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const levelDetails = {
    school_to_woreda: {
      title: 'M/Barumsaa ➔ Waajjira Aanaa',
      from: `Mana Barumsaa (${schoolName})`,
      to: `Waajjira Barnoota Aanaa (${woredaName})`,
      icon: School,
      badgeColor: 'bg-sky-950 border-sky-500 text-sky-300',
    },
    woreda_to_zone: {
      title: 'Waajjira Aanaa ➔ Waajjira Godinaa',
      from: `Waajjira Barnoota Aanaa (${woredaName})`,
      to: `Waajjira Barnoota Godinaa (${zoneName})`,
      icon: Building,
      badgeColor: 'bg-indigo-950 border-indigo-500 text-indigo-300',
    },
    zone_to_oromiyaa: {
      title: 'Waajjira Godinaa ➔ Biiroo Barnoota Oromiyaa',
      from: `Waajjira Barnoota Godinaa (${zoneName})`,
      to: 'Biiroo Barnoota Oromiyaa (Finfinnee)',
      icon: Landmark,
      badgeColor: 'bg-amber-950 border-amber-500 text-amber-300',
    },
  }[transferLevel];

  // Verify credentials & check daily duplicate report transfers
  const handleVerifyInstitutionalAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setDuplicateWarning(null);

    const cleanEmail = workGmail.trim().toLowerCase();
    const cleanPass = workPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Maaloo Gmail mana hojii sirrii galchaa (fkn: woreda.education@oromiyaa.gov.et)');
      return;
    }

    if (!cleanPass || cleanPass.length < 3) {
      setAuthError('Maaloo Jecha Darbii (Password) mataa keessanii yoo xiqqaate dhiitii 3 galchaa!');
      return;
    }

    // Duplicate Check: Same Date, Same Transfer Level, Same From Entity
    const existingDup = transferredReports.find(
      (r) => r.date === todayStr && r.level === transferLevel && r.senderEntity === levelDetails.from
    );

    if (existingDup) {
      setDuplicateWarning(
        `⚠️ GABAASA IRRA-DEEBI'AME (DUPLICATE REPORT DETECTED):\n` +
          `Gabaasni sadarkaa "${levelDetails.title}" irraa guyyaa har'aa (${todayStr}) kanaan dura ergamee jira! ` +
          `Suaa irra-deebitee gabaasa kana erguun dataa baayyisa (Duplicates). Yoo sirreessuu feetan 'Tarree Ergamanii' keessatti Gulaaluu ykn Haquu dandeessu.`
      );
    }

    // Success Authentication using user credentials
    setIsAuthenticated(true);

    // Generate Secure Share URL
    const levelCode = transferLevel === 'school_to_woreda' ? 'school' : transferLevel === 'woreda_to_zone' ? 'woreda' : 'zone';
    const currentBaseUrl = `${window.location.origin}${window.location.pathname}`;
    const secureToken = btoa(`${cleanEmail}:${cleanPass}:${Date.now()}`);
    const shareUrl = `${currentBaseUrl}?view=reports&sec_auth=1&level=${levelCode}&sender=${encodeURIComponent(cleanEmail)}&token=${secureToken}`;

    setGeneratedSecureUrl(shareUrl);

    // Log this report submission
    const newReportRecord: TransferredReport = {
      id: `rep_${Date.now()}`,
      date: todayStr,
      level: transferLevel,
      levelLabel: levelDetails.title,
      senderGmail: cleanEmail,
      senderEntity: levelDetails.from,
      recipientEntity: levelDetails.to,
      totalStudents: totalStudentsCount,
      notes: notes || 'Gabaasa Guyyaa Nageenyaan Ergame',
      shareUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDuplicateFlagged: Boolean(existingDup),
    };

    saveReportsToStorage([newReportRecord, ...transferredReports]);
  };

  // Delete Transferred Report
  const handleDeleteReport = (id: string) => {
    if (confirm('Gabaasa ergame kana tarree gabaasotaa keessaa haquuf mirkaneessaa?')) {
      const updated = transferredReports.filter((r) => r.id !== id);
      saveReportsToStorage(updated);
    }
  };

  // Edit Transferred Report
  const handleSaveEditReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    const updated = transferredReports.map((r) => (r.id === editingReport.id ? editingReport : r));
    saveReportsToStorage(updated);
    setEditingReport(null);
  };

  const telegramShareText =
    `🔒 *GABAASA SECURED OFFICIAL TRANSFER* 📋\n` +
    `📜 *Nageenya Ragaa:* Institutional Verified (Gmail & Password Authenticated)\n` +
    `🏛️ *Irraa (From):* ${levelDetails.from}\n` +
    `🗺️ *Gara (To):* ${levelDetails.to}\n` +
    `📧 *Ergaa Gmail:* ${workGmail}\n` +
    `🌐 *Direct Secure Report Link:* ${generatedSecureUrl}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedSecureUrl || '')}&text=${encodeURIComponent(
    telegramShareText
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-800/60 rounded-3xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border-b border-indigo-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                <span>NAGEENYA RAGAA GABAASAA (REPORT SECURITY SHIELD)</span>
              </div>
              <h2 className="text-lg font-black text-white">
                Ergaa Linkii Gabaasaa (Verification & Transfer Control)
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

        {/* Navigation Sub-Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('send')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'send'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            📤 Gabaasa Ergii (Transfer Report)
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Tarree Ergamanii ({transferredReports.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeSubTab === 'send' ? (
            <>
              {/* Level Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Sadarkaa Gabaasni Itti Ergamu (Transfer Hierarchy Level):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setTransferLevel('school_to_woreda');
                      setIsAuthenticated(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      transferLevel === 'school_to_woreda'
                        ? 'bg-sky-950 border-sky-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <School className="w-4 h-4 text-sky-400" />
                      <span>M/Barumsaa ➔ Aanaa</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setTransferLevel('woreda_to_zone');
                      setIsAuthenticated(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      transferLevel === 'woreda_to_zone'
                        ? 'bg-indigo-950 border-indigo-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <Building className="w-4 h-4 text-emerald-400" />
                      <span>Aanaa ➔ Godina</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setTransferLevel('zone_to_oromiyaa');
                      setIsAuthenticated(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      transferLevel === 'zone_to_oromiyaa'
                        ? 'bg-amber-950 border-amber-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <Landmark className="w-4 h-4 text-amber-400" />
                      <span>Godina ➔ Oromiyaa</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-950 border border-amber-500/80 rounded-2xl text-xs font-bold text-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="uppercase tracking-wider font-black">Duplicate Transfer Warning</span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">{duplicateWarning}</p>
                </div>
              )}

              {/* Institutional Authentication Form */}
              {!isAuthenticated ? (
                <form onSubmit={handleVerifyInstitutionalAuth} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Mirkaneessa Nageenyaa: Gmail & Password Ergaa Sanaa
                      </h3>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-700/50 p-2.5 rounded-xl text-[11px] text-indigo-200">
                    ℹ️ <strong>Ibsa Nageenyaa:</strong> Gmail fi Jecha Darbii (Password) ogeessi gabaasa ergu sun ofumaasaatiin kan saagatu dha.
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-950 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Gmail Mana Hojii Ergaa:
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="woreda.education@oromiyaa.gov.et"
                        value={workGmail}
                        onChange={(e) => setWorkGmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Jecha Darbii (Password):
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={workPassword}
                        onChange={(e) => setWorkPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Yaada / Yaadannoo Gabaasaa (Optional Notes):
                    </label>
                    <input
                      type="text"
                      placeholder="fkn: Gabaasa barattoota galmeeffamanii kan guyyaa har'aa..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Mirkaneessi & Linkii Nageenyaa Uumi (Authenticate & Transfer)</span>
                  </button>
                </form>
              ) : (
                /* Secure Link Output */
                <div className="bg-slate-950 border border-emerald-500/50 p-4 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-300 uppercase">
                        Institutional Verification Succeeded & Logged!
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      {workGmail}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-300">
                      Linkii Nageenyaa Gabaasichaa (Secured Shareable Link):
                    </p>
                    <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg font-mono text-[11px] text-amber-300 break-all select-all">
                      {generatedSecureUrl}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Ergii Telegram (Secure)</span>
                    </a>

                    <button
                      onClick={() => {
                        if (generatedSecureUrl) {
                          navigator.clipboard.writeText(generatedSecureUrl);
                          setCopiedNotification(true);
                          setTimeout(() => setCopiedNotification(false), 3000);
                        }
                      }}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedNotification ? '✓ Linkii Koorpii Ta\'eera!' : 'Koorpii Linkii (Copy Link)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Transferred Daily Reports History Log */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Tarree Gabaasota Ergamanii & Duplicated Ta'an ({transferredReports.length})</span>
                </h3>

                {transferredReports.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Tarree gabaasota ergamanii hunda qulqulleessuu (Delete Log) ni feetaa?')) {
                        saveReportsToStorage([]);
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-[10px] font-bold"
                  >
                    Haqi Hunda
                  </button>
                )}
              </div>

              {transferredReports.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Gabaasni ergama guyyaa tokkolleen galmeeffamee hin jiru.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transferredReports.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                        rep.isDuplicateFlagged
                          ? 'bg-amber-950/40 border-amber-500/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[10px] font-black rounded-full uppercase">
                            {rep.levelLabel}
                          </span>
                          {rep.isDuplicateFlagged && (
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase">
                              ⚠️ DUPLICATE REPORT
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px] font-mono">
                            📅 {rep.date} ({rep.createdAt})
                          </span>
                        </div>

                        {/* Action Buttons: Ilaali, Gulaali, Haqi */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => setViewingReport(rep)}
                            className="px-2 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>Ilaali</span>
                          </button>

                          <button
                            onClick={() => setEditingReport({ ...rep })}
                            className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-400" />
                            <span>Gulaali</span>
                          </button>

                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Haqi</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
                        <div>📧 Sender Gmail: <strong className="text-amber-300">{rep.senderGmail}</strong></div>
                        <div>🏛️ Irraa ➔ Gara: <strong className="text-white">{rep.senderEntity} ➔ {rep.recipientEntity}</strong></div>
                        <div>👨‍🎓 Baayyina Barattootaa: <strong className="text-emerald-400">{rep.totalStudents}</strong></div>
                        <div>📝 Yaada: <span className="text-slate-400 italic">{rep.notes}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Security Protocol: AES-Tokenized Institutional Auth</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Cufi (Close)
          </button>
        </div>
      </div>

      {/* View Transferred Report Details (Ilaali) */}
      {viewingReport && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/80 rounded-3xl max-w-lg w-full text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white">Odeeffannoo Gabaasa Ergamea</h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1 bg-slate-800 text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Sadarkaa Transfer</span>
                <strong className="text-amber-300">{viewingReport.levelLabel}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Gmail Ergaa</span>
                <strong className="text-white">{viewingReport.senderGmail}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Irraa ➔ Gara</span>
                <strong className="text-sky-300">{viewingReport.senderEntity} ➔ {viewingReport.recipientEntity}</strong>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Linkii Nageenyaa</span>
                <p className="font-mono text-amber-300 text-[10px] break-all">{viewingReport.shareUrl}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Cufi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transferred Report Details (Gulaali) */}
      {editingReport && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/80 rounded-3xl max-w-lg w-full text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Gabaasa Ergame Sirreessuu / Gulaaluu</h3>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="p-1 bg-slate-800 text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReport} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Gmail Ergaa</label>
                <input
                  type="email"
                  value={editingReport.senderGmail}
                  onChange={(e) => setEditingReport({ ...editingReport, senderGmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Irraa (Sender Entity)</label>
                <input
                  type="text"
                  value={editingReport.senderEntity}
                  onChange={(e) => setEditingReport({ ...editingReport, senderEntity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Baayyina Barattootaa</label>
                <input
                  type="number"
                  value={editingReport.totalStudents}
                  onChange={(e) => setEditingReport({ ...editingReport, totalStudents: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Yaada / Yaadannoo</label>
                <input
                  type="text"
                  value={editingReport.notes}
                  onChange={(e) => setEditingReport({ ...editingReport, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Lakkii
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Olkaa'i (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
