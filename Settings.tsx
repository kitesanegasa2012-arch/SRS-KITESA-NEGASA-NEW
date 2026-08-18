import React, { useState, useEffect } from 'react';
import { SchoolSettings, LoginRecord } from '../types';
import {
  Settings as SettingsIcon,
  Save,
  History,
  Trash2,
  School,
  ShieldAlert,
  Users,
  Key,
  Download,
  Upload,
  Search,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Star,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { ADMIN_PASSWORD } from '../data/initialData';
import {
  getStoredAuthorizedUsers,
  saveStoredAuthorizedUsers,
  getStoredSchoolsList,
  saveStoredSchoolsList,
  getStoredWoredasList,
  saveStoredWoredasList,
  getStoredZonesList,
  saveStoredZonesList,
  getStoredAdminUnits,
  saveStoredAdminUnits,
  exportFullBackupJSON,
  importFullBackupJSON,
  mergeBackupJSON,
  exportFullBackupExcel,
  importFullBackupExcelOrCSV,
  addRevokedUser,
  removeRevokedUser,
  validateUniversalPassword,
  triggerGlobalForceLogoutAll,
} from '../utils/storage';

interface SettingsProps {
  settings: SchoolSettings;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  loginHistory: LoginRecord[];
  onDeleteLogin: (id: string) => void;
  allSchools: string[];
  allWoredas?: string[];
  allZones?: string[];
  onDeleteSchoolData: (schoolName: string) => void;
  onDeleteWoredaData?: (woredaName: string) => void;
  onDeleteZoneData?: (zoneName: string) => void;
  onRefreshData?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  loginHistory,
  onDeleteLogin,
  allSchools,
  allWoredas = [],
  allZones = [],
  onDeleteSchoolData,
  onDeleteWoredaData,
  onDeleteZoneData,
  onRefreshData,
}) => {
  const [schoolName, setSchoolName] = useState(settings.savedSchoolName);
  const [academicYear, setAcademicYear] = useState(settings.baraBarnootaa);
  const [saveMessage, setSaveMessage] = useState('');

  // Authorized Users with localStorage persistence
  const [authUsers, setAuthUsers] = useState<Record<string, string>>({});
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Edit user state
  const [editingUserKey, setEditingUserKey] = useState<string | null>(null);
  const [editUserEmailInput, setEditUserEmailInput] = useState('');
  const [editUserPassInput, setEditUserPassInput] = useState('');

  const togglePasswordVisibility = (email: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const toggleAllPasswords = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    const newVis: Record<string, boolean> = {};
    Object.keys(authUsers).forEach((e) => {
      newVis[e] = nextState;
    });
    setVisiblePasswords(newVis);
  };

  const handleStartEditUser = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setEditingUserKey(cleanEmail);
    setEditUserEmailInput(cleanEmail);
    setEditUserPassInput(authUsers[cleanEmail] || authUsers[email] || '');
  };

  const handleSaveEditUser = () => {
    if (!editingUserKey) return;
    const oldEmail = editingUserKey;
    const newEmail = editUserEmailInput.trim().toLowerCase();
    const newPass = editUserPassInput.trim();

    if (!newEmail || !newPass) {
      alert("Maaloo Email fi Password guutaa!");
      return;
    }

    removeRevokedUser(newEmail);
    const updated = { ...authUsers };
    delete updated[oldEmail];
    updated[newEmail] = newPass;

    setAuthUsers(updated);
    saveStoredAuthorizedUsers(updated);
    setEditingUserKey(null);
    if (onRefreshData) onRefreshData();
    alert(`✓ Eeyyamni '${newEmail}' tiif milkiidhaan jijjiirameera!`);
  };

  // School Directory for 5000+ schools
  const [schoolsList, setSchoolsList] = useState<string[]>([]);
  const [newSchoolInput, setNewSchoolInput] = useState('');
  const [batchSchoolsInput, setBatchSchoolsInput] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolPage, setSchoolPage] = useState(1);
  const schoolsPerPage = 20;

  // Section Lock States
  const [isAddUserUnlocked, setIsAddUserUnlocked] = useState(false);
  const [addUserPassInput, setAddUserPassInput] = useState('');

  const [isSchoolsUnlocked, setIsSchoolsUnlocked] = useState(false);
  const [schoolsPassInput, setSchoolsPassInput] = useState('');

  const [isHistoryUnlocked, setIsHistoryUnlocked] = useState(false);
  const [historyPassInput, setHistoryPassInput] = useState('');

  const verifyPasscode = (pass: string): boolean => {
    return validateUniversalPassword(pass);
  };

  const handleUnlockAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(addUserPassInput)) {
      setIsAddUserUnlocked(true);
      setAddUserPassInput('');
    } else {
      alert('❌ Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  const handleUnlockSchools = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(schoolsPassInput)) {
      setIsSchoolsUnlocked(true);
      setSchoolsPassInput('');
    } else {
      alert('❌ Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  const handleUnlockHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(historyPassInput)) {
      setIsHistoryUnlocked(true);
      setHistoryPassInput('');
    } else {
      alert('❌ Jecha Darbiisaa (Password) dogoggoraa!');
    }
  };

  useEffect(() => {
    setAuthUsers(getStoredAuthorizedUsers());
    setWoredasList(getStoredWoredasList());
    setZonesList(getStoredZonesList());
    
    // Initial load of stored schools list
    const storedSchools = getStoredSchoolsList().filter((s) => {
      const lower = s.toLowerCase();
      return !lower.includes('oda') && !lower.includes('bako');
    });

    const activeSchool = settings.savedSchoolName;
    const initialList = Array.from(new Set([...storedSchools, ...allSchools, activeSchool])).filter(
      (s) => {
        if (!s || s.trim() === '') return false;
        const lower = s.toLowerCase();
        return !lower.includes('oda') && !lower.includes('bako');
      }
    );
    setSchoolsList(initialList);
    saveStoredSchoolsList(initialList);
  }, []); // Run only on initial mount so user deletions persist cleanly!

  // Woredas (Aanolee) & Zones (Godinaalee) Directory State & Lock
  const [isWoredasZonesUnlocked, setIsWoredasZonesUnlocked] = useState(false);
  const [woredasZonesPassInput, setWoredasZonesPassInput] = useState('');

  const [woredasList, setWoredasList] = useState<string[]>([]);
  const [newWoredaInput, setNewWoredaInput] = useState('');
  const [editingWoredaIndex, setEditingWoredaIndex] = useState<number | null>(null);
  const [editWoredaValue, setEditWoredaValue] = useState('');

  const [zonesList, setZonesList] = useState<string[]>([]);
  const [newZoneInput, setNewZoneInput] = useState('');
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [editZoneValue, setEditZoneValue] = useState('');

  // Password / Permission helper (requires 'LATI' or valid passcode without showing hints)
  const askPermissionPasscode = (actionDescription: string): boolean => {
    if (isWoredasZonesUnlocked || isSchoolsUnlocked) return true;
    const entered = prompt(`🔒 Eeyyama (${actionDescription}) raawwachuuf Jecha Darbiisaa galchaa:`);
    if (!entered || !verifyPasscode(entered)) {
      alert('❌ Eeyyamamuu hin dandeenye! Jecha darbiisaa (Password) dogoggoraa!');
      return false;
    }
    return true;
  };

  const handleUnlockWoredasZones = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(woredasZonesPassInput)) {
      setIsWoredasZonesUnlocked(true);
      setWoredasZonesPassInput('');
    } else {
      alert('❌ Jecha darbiisaa (Password) dogoggoraa!');
    }
  };

  // Woreda Handlers
  const handleAddWoreda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoredaInput.trim()) return;
    if (!askPermissionPasscode(`Aanaa '${newWoredaInput.trim()}' dabaluu`)) return;

    const clean = newWoredaInput.trim();
    if (woredasList.includes(clean)) {
      alert(`Aanaan "${clean}" duraan galmee keessa jira!`);
      return;
    }
    const updated = [clean, ...woredasList];
    setWoredasList(updated);
    saveStoredWoredasList(updated);
    setNewWoredaInput('');
  };

  const handleStartEditWoreda = (idx: number, name: string) => {
    if (!askPermissionPasscode(`Aanaa '${name}' gulaaluu`)) return;
    setEditingWoredaIndex(idx);
    setEditWoredaValue(name);
  };

  const handleSaveEditWoreda = (idx: number) => {
    if (!editWoredaValue.trim()) return;
    if (!askPermissionPasscode(`Jijjiirama Aanaa '${editWoredaValue.trim()}' ol-kaa'uu`)) return;

    const clean = editWoredaValue.trim();
    const updated = [...woredasList];
    updated[idx] = clean;
    setWoredasList(updated);
    saveStoredWoredasList(updated);
    setEditingWoredaIndex(null);
  };

  const handleDeleteWoreda = (name: string) => {
    if (!askPermissionPasscode(`Aanaa '${name}' haquu (delete)`)) return;

    if (confirm(`Dhugauma Aanaa "${name}" tarree irraa haquu ni barbaaddaa?`)) {
      const updated = woredasList.filter((w) => w !== name);
      setWoredasList(updated);
      saveStoredWoredasList(updated);
    }
  };

  // Zone Handlers
  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneInput.trim()) return;
    if (!askPermissionPasscode(`Godina '${newZoneInput.trim()}' dabaluu`)) return;

    const clean = newZoneInput.trim();
    if (zonesList.includes(clean)) {
      alert(`Godinni "${clean}" duraan galmee keessa jira!`);
      return;
    }
    const updated = [clean, ...zonesList];
    setZonesList(updated);
    saveStoredZonesList(updated);
    setNewZoneInput('');
  };

  const handleStartEditZone = (idx: number, name: string) => {
    if (!askPermissionPasscode(`Godina '${name}' gulaaluu`)) return;
    setEditingZoneIndex(idx);
    setEditZoneValue(name);
  };

  const handleSaveEditZone = (idx: number) => {
    if (!editZoneValue.trim()) return;
    if (!askPermissionPasscode(`Jijjiirama Godina '${editZoneValue.trim()}' ol-kaa'uu`)) return;

    const clean = editZoneValue.trim();
    const updated = [...zonesList];
    updated[idx] = clean;
    setZonesList(updated);
    saveStoredZonesList(updated);
    setEditingZoneIndex(null);
  };

  const handleDeleteZone = (name: string) => {
    if (!askPermissionPasscode(`Godina '${name}' haquu (delete)`)) return;

    if (confirm(`Dhugauma Godina "${name}" tarree irraa haquu ni barbaaddaa?`)) {
      const updated = zonesList.filter((z) => z !== name);
      setZonesList(updated);
      saveStoredZonesList(updated);
    }
  };

  // --- BATCH DELETE & CLEAR ALL HANDLERS (Aanolee, Godinaalee & Manneen Barnootaa) ---
  const handleClearAllWoredas = () => {
    if (woredasList.length === 0) {
      alert("Tarree keessa Aanaan tokkollee hin jiru!");
      return;
    }
    if (!askPermissionPasscode(`Tarree Aanaalee hunda (${woredasList.length}) al-tokkotti haquu`)) return;

    if (!confirm(`⚠️ OF-EEGGANNOO: Dhugauma tarree Aanaalee hunda (${woredasList.length}) al-tokkotti haquu ni barbaaddaa?`)) {
      return;
    }

    const deleteDataToo = confirm(
      `Ragaalee barattootaa fi EMIS Aanaalee kanneen keessa jiranis al-tokkotti haquu ni barbaaddaa?\n\n` +
      `• 'OK' = Ragaalee barattootaa fi tarree Aanaalee hunda haqi\n` +
      `• 'Cancel' = Tarree Aanaalee qofa qulqulleessi`
    );

    if (deleteDataToo && onDeleteWoredaData) {
      woredasList.forEach((w) => onDeleteWoredaData(w));
    }

    setWoredasList([]);
    saveStoredWoredasList([]);

    const currentUnits = getStoredAdminUnits().filter((u) => u.type !== 'aanaa');
    saveStoredAdminUnits(currentUnits);

    if (onRefreshData) onRefreshData();
    alert(`✓ Tarreen Aanaalee hunda milkiidhaan haqameera!`);
  };

  const handleClearAllZones = () => {
    if (zonesList.length === 0) {
      alert("Tarree keessa Godinni tokkollee hin jiru!");
      return;
    }
    if (!askPermissionPasscode(`Tarree Godinaalee hunda (${zonesList.length}) al-tokkotti haquu`)) return;

    if (!confirm(`⚠️ OF-EEGGANNOO: Dhugauma tarree Godinaalee hunda (${zonesList.length}) al-tokkotti haquu ni barbaaddaa?`)) {
      return;
    }

    const deleteDataToo = confirm(
      `Ragaalee barattootaa fi EMIS Godinaalee kanneen keessa jiranis al-tokkotti haquu ni barbaaddaa?\n\n` +
      `• 'OK' = Ragaalee barattootaa fi tarree Godinaalee hunda haqi\n` +
      `• 'Cancel' = Tarree Godinaalee qofa qulqulleessi`
    );

    if (deleteDataToo && onDeleteZoneData) {
      zonesList.forEach((z) => onDeleteZoneData(z));
    }

    setZonesList([]);
    saveStoredZonesList([]);

    const currentUnits = getStoredAdminUnits().filter((u) => u.type !== 'godina');
    saveStoredAdminUnits(currentUnits);

    if (onRefreshData) onRefreshData();
    alert(`✓ Tarreen Godinaalee hunda milkiidhaan haqameera!`);
  };

  const handleClearAllSchools = () => {
    if (schoolsList.length === 0) {
      alert("Tarree keessa Manni Barnootaa tokkollee hin jiru!");
      return;
    }
    if (!askPermissionPasscode(`Tarree Manneen Barnootaa hunda (${schoolsList.length}) al-tokkotti haquu`)) return;

    if (!confirm(`⚠️ OF-EEGGANNOO: Dhugauma tarree Manneen Barnootaa hunda (${schoolsList.length}) al-tokkotti haquu ni barbaaddaa?`)) {
      return;
    }

    const deleteDataToo = confirm(
      `Ragaalee barattootaa fi EMIS Manneen Barnootaa kanneenis al-tokkotti haquu ni barbaaddaa?\n\n` +
      `• 'OK' = Ragaalee barattootaa fi tarree M/B hunda haqi\n` +
      `• 'Cancel' = Tarree M/B qofa qulqulleessi`
    );

    if (deleteDataToo) {
      schoolsList.forEach((s) => onDeleteSchoolData(s));
    }

    setSchoolsList([]);
    saveStoredSchoolsList([]);

    const currentUnits = getStoredAdminUnits().filter((u) => u.type !== 'school');
    saveStoredAdminUnits(currentUnits);

    if (onRefreshData) onRefreshData();
    alert(`✓ Tarreen Manneen Barnootaa hunda (${schoolsList.length}) milkiidhaan haqameera!`);
  };

  const handleClearAllEntitiesBatch = () => {
    if (!askPermissionPasscode(`Tarree Manneen Barnootaa, Aanaalee fi Godinaalee hunda al-tokkotti haquu`)) return;

    if (!confirm(
      `🚨 OF-EEGGANNOO CIMAAN (MASTER CLEAN):\n\n` +
      `Tarree:\n` +
      `• Manneen Barnootaa (${schoolsList.length})\n` +
      `• Aanaalee (${woredasList.length})\n` +
      `• Godinaalee (${zonesList.length})\n\n` +
      `HUNDA al-tokkotti haquu akka barbaaddan mirkaneessaa?`
    )) {
      return;
    }

    const deleteDataToo = confirm(
      `Ragaalee barattootaa fi EMIS hundas waliin haquu ni barbaaddaa?\n\n` +
      `• 'OK' = Ragaalee barattootaa fi tarreewwan hunda haqi\n` +
      `• 'Cancel' = Tarreewwan (lists) qofa qulqulleessi`
    );

    if (deleteDataToo) {
      schoolsList.forEach((s) => onDeleteSchoolData(s));
      woredasList.forEach((w) => onDeleteWoredaData?.(w));
      zonesList.forEach((z) => onDeleteZoneData?.(z));
    }

    setSchoolsList([]);
    saveStoredSchoolsList([]);
    setWoredasList([]);
    saveStoredWoredasList([]);
    setZonesList([]);
    saveStoredZonesList([]);
    saveStoredAdminUnits([]);

    if (onRefreshData) onRefreshData();
    alert(`✓ Tarreen Manneen Barnootaa, Aanaalee fi Godinaalee hunda al-tokkotti milkiidhaan qulqullaa'eera!`);
  };

  const getNextSequentialCode = (usersDict: Record<string, string>) => {
    const nextIndex = Object.keys(usersDict).length + 1;
    const padded = String(nextIndex).padStart(3, '0');
    return `#${padded}@K`;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    const cleanEmail = newUserEmail.trim().toLowerCase();
    const assignedPass = newUserPass.trim() || getNextSequentialCode(authUsers);
    removeRevokedUser(cleanEmail);
    const updated = {
      ...authUsers,
      [cleanEmail]: assignedPass,
    };
    setAuthUsers(updated);
    saveStoredAuthorizedUsers(updated);
    setNewUserEmail('');
    setNewUserPass('');
    if (onRefreshData) onRefreshData();
    alert(`✓ Eeyyamni ${cleanEmail} tiif jecha darbiisaa '${assignedPass}' wajjin milkiidhaan ol-kaa'ameera!`);
  };

  const handleRevokeUser = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'kitesanegasa2012@gmail.com') {
      alert('❌ Email abbaa kalaqaa (kitesanegasa2012@gmail.com) haquun hin danda’amu!');
      return;
    }
    addRevokedUser(cleanEmail);
    const updated = { ...authUsers };
    delete updated[cleanEmail];
    delete updated[email];
    setAuthUsers(updated);
    saveStoredAuthorizedUsers(updated);
    if (onRefreshData) onRefreshData();
    alert(`✓ Eeyyamni '${cleanEmail}' milkiidhaan haqameera! Yeroo fayyadaan saaqqachuuf yaalu ergaan dogoggoraa isaanif agarsiifama.`);
  };

  // School Directory Handlers
  const handleAddSingleSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolInput.trim()) return;
    const cleanName = newSchoolInput.trim();
    if (schoolsList.includes(cleanName)) {
      alert(`Mana Barumsaa "${cleanName}" duraan galmeeffameera!`);
      return;
    }
    const updated = [cleanName, ...schoolsList];
    setSchoolsList(updated);
    saveStoredSchoolsList(updated);
    setNewSchoolInput('');
    alert(`✓ Mana Barumsaa "${cleanName}" galmee keessatti dabalameera!`);
  };

  const handleBatchAddSchools = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchSchoolsInput.trim()) return;
    const lines = batchSchoolsInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...lines, ...schoolsList]));
    setSchoolsList(merged);
    saveStoredSchoolsList(merged);
    setBatchSchoolsInput('');
    setShowBatchModal(false);
    alert(`✓ Baayyina M/B ${lines.length} milkiidhaan galmeeffamaniiru!`);
  };

  const handleDeleteSchoolFromList = (schName: string) => {
    if (!confirm(`Dhugauma Mana Barumsaa "${schName}" fi ragaalee barattootaa isaa tarree irraa guutummaatti haquu ni barbaaddaa?`)) {
      return;
    }

    // 1. Purge all students registered under this school name
    onDeleteSchoolData(schName);

    // 2. Remove school from current list and save to storage
    const updated = schoolsList.filter((s) => s !== schName);
    setSchoolsList(updated);
    saveStoredSchoolsList(updated);

    // 3. Reset active school if deleted school was currently selected
    if (settings.savedSchoolName === schName && updated.length > 0) {
      onSaveSettings({
        savedSchoolName: updated[0],
        baraBarnootaa: academicYear,
      });
      setSchoolName(updated[0]);
    }

    alert(`✓ Mana Barumsaa "${schName}" fi ragaaleen barattootaa isaa milkiidhaan haqamaniiru!`);
  };

  const handleSetActiveSchool = (schName: string) => {
    setSchoolName(schName);
    onSaveSettings({
      savedSchoolName: schName,
      baraBarnootaa: academicYear,
    });
    alert(`✓ Mana Barumsaa "${schName}" meeshaa (device) kanaaf hidhamee ol-kaa'ameera!`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSchool = schoolName.trim();
    const cleanYear = academicYear.trim();

    onSaveSettings({
      savedSchoolName: cleanSchool,
      baraBarnootaa: cleanYear,
    });

    if (cleanSchool) {
      const stored = getStoredSchoolsList();
      if (!stored.includes(cleanSchool)) {
        const updated = [cleanSchool, ...stored];
        setSchoolsList(updated);
        saveStoredSchoolsList(updated);
      }
    }

    if (onRefreshData) onRefreshData();

    setSaveMessage("Qindaa'inni ol-ka'ameera! (Mana barumsaa ol-kaa'amee turaniin wajjin qindaa'eera)");
    setTimeout(() => setSaveMessage(''), 3500);
  };

  // Restore Backup File Handler
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importFullBackupJSON(content);
        if (success) {
          alert('✓ Backup Ragaa milkiidhaan deebifameera (Restored)! Appichi ammma ni haareffama.');
          if (onRefreshData) onRefreshData();
          window.location.reload();
        } else {
          alert('Dogoggora: File JSON sirrii miti ykn ragaan isaa manca’eera!');
        }
      }
    };
    reader.readAsText(file);
  };

  // Merge Data Handler for Multi-teacher registration
  const handleMergeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = mergeBackupJSON(content);
        if (result.success) {
          alert(result.message);
          if (onRefreshData) onRefreshData();
          window.location.reload();
        } else {
          alert(`❌ ${result.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  // Pagination for Schools Directory
  const filteredDirectory = schoolsList.filter((sch) =>
    sch.toLowerCase().includes(schoolSearchQuery.toLowerCase().trim())
  );
  const totalPages = Math.ceil(filteredDirectory.length / schoolsPerPage) || 1;
  const paginatedSchools = filteredDirectory.slice(
    (schoolPage - 1) * schoolsPerPage,
    schoolPage * schoolsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-600" />
            <span>Qindaa'ina Systemaa (System Settings)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maqaa mana barumsaa, bara barnootaa, fayyadamtoota eeyyama argatanii fi galmee seensaa bulchiinsaa
          </p>
        </div>

        {/* Quick Backup Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportFullBackupExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Download Full Excel Backup (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>📥 Backup Excel (.xlsx)</span>
          </button>

          <label className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>📤 Restore Excel / CSV (Multiple)</span>
            <input
              type="file"
              multiple
              accept=".xlsx, .xls, .csv"
              onChange={async (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const res = await importFullBackupExcelOrCSV(files, settings.woredaName || '', settings.zoneName || '');
                  alert(res.message);
                  if (res.success) {
                    window.location.reload();
                  }
                }
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={exportFullBackupJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Download Full JSON Backup"
          >
            <Download className="w-4 h-4" />
            <span>JSON Backup</span>
          </button>
          
          <label className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer" title="Barsiisota biraa irraa galmee JSON walitti makaa">
            <Layers className="w-4 h-4" />
            <span>🔀 Merge JSON</span>
            <input type="file" accept=".json" onChange={handleMergeFile} className="hidden" />
          </label>

          <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore JSON</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School & Academic Year Configuration Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-5 h-5 text-indigo-600" />
            <span>Mana Barumsaa & Bara Barnootaa</span>
          </h3>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maqaa Mana Barumsaa Ijoo (Active School Name)
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Maqaa Mana Barumsaa Galche..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bara Barnootaa (Academic Year E.C)
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2019"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Qindaa'ina Ol-ka'i (Save Settings)</span>
            </button>
          </form>

          {/* Backup & Nageenya Guidance */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-2 text-xs">
            <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <span>🔒 Nageenya Ragaa & Of-Eeggannoo (Data Safety & Preservation)</span>
            </h4>
            <p className="leading-relaxed text-slate-700">
              1. <strong>Ragaan keessan meeshaa (bilbila/kompuutara) keessan irratti qofa ol-kaa'ama.</strong>
              <br />
              2. Linkii appicha saaqqattanis ykn appichi yoo haareffames ragaan bilbila keessan irra jiru hin badu.
              <br />
              3. Qulqullinaaf, butoonii <strong>"Ragaa olkaawwadhu (Backup)"</strong> jedhu fayyadamuun fayilii JSON gadi buufadhaa ol-kaa'adhaa.
            </p>
          </div>
        </div>

        {/* Authorized Users & Gmail Credentials Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Fayyadamtoota Eeyyama argatanii (Authorized Users)</span>
            </h3>
            {!isAddUserUnlocked && (
              <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg font-extrabold border border-amber-200">
                🔒 Cufamaa (Locked)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Fayyadamtoota gmailii systemichaan seensaa eeyyamamuufii danda'an:
          </p>

          {!isAddUserUnlocked ? (
            <form onSubmit={handleUnlockAddUser} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center mx-auto font-black text-lg">
                🔒
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Qaamolee Eeyyama Argatan (Fayyadamtoota) Ilaaluu fi Dabaluuf Jecha Darbiisaa (Password) Seensisaa
              </h4>
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="password"
                  required
                  placeholder="Jecha darbiisaa saaqi..."
                  value={addUserPassInput}
                  onChange={(e) => setAddUserPassInput(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 grow"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 hover:bg-slate-900 text-amber-300 font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
                >
                  🔓 Saaqi
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Tarree Fayyadamtootaa ({Object.keys(authUsers).length})
                </span>
                <button
                  type="button"
                  onClick={toggleAllPasswords}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition cursor-pointer border border-indigo-200"
                >
                  {showAllPasswords ? '🙈 Passwords Hundaa Dhoksi' : '👁️ Passwords Hundaa Mul’isi'}
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Object.keys(authUsers).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">Fayyadamaan eeyyamame hin jiru.</p>
                ) : (
                  Object.keys(authUsers).map((userEmail) => {
                    const isPassVisible = showAllPasswords || !!visiblePasswords[userEmail];
                    const passText = authUsers[userEmail] || '';
                    const isEditingThis = editingUserKey === userEmail.toLowerCase();

                    if (isEditingThis) {
                      return (
                        <div
                          key={userEmail}
                          className="p-3 bg-amber-50/90 rounded-xl border-2 border-amber-400 space-y-2 text-xs font-mono shadow-md"
                        >
                          <div className="font-extrabold text-amber-900 flex items-center justify-between">
                            <span>✏️ Odeeffannoo Fayyadamaa Jijjiiruu</span>
                            <button
                              type="button"
                              onClick={() => setEditingUserKey(null)}
                              className="text-slate-500 hover:text-slate-800 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Gmail Address:</label>
                              <input
                                type="email"
                                value={editUserEmailInput}
                                onChange={(e) => setEditUserEmailInput(e.target.value)}
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Password Haaraa:</label>
                              <input
                                type="text"
                                value={editUserPassInput}
                                onChange={(e) => setEditUserPassInput(e.target.value)}
                                className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingUserKey(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs cursor-pointer"
                            >
                              ❌ Dhiisi
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditUser}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs shadow-md cursor-pointer"
                            >
                              💾 Jijjiirama Ol-kaa'i
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={userEmail}
                        className="p-2.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div className="truncate min-w-0 grow">
                          <span className="font-bold text-slate-800 block truncate">{userEmail}</span>
                          <span className="text-[11px] text-amber-800 font-extrabold font-mono">
                            Pass: {isPassVisible ? passText : '••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(userEmail)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1"
                            title="Password Agarsiisi / Dhoksi"
                          >
                            <span>{isPassVisible ? '🙈 Dhoksi' : '👁️ Mul’isi'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(userEmail)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 border border-amber-300"
                            title="Odeeffannoo Jijjiiri"
                          >
                            <span>✏️ Jijjiiri</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeUser(userEmail)}
                            className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 border border-rose-200"
                            title="Eeyyama Fayyadamaa Haqi (Delete/Revoke)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Haqi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Authorized User Form */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-600" /> Seensa Haaraaf Eeyyama Kenni (Add authorized Gmail)
                </h4>
                <form onSubmit={handleAddUser} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Gmail address..."
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder={`Password (ex: ${getNextSequentialCode(authUsers)})...`}
                        value={newUserPass}
                        onChange={(e) => setNewUserPass(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setNewUserPass(getNextSequentialCode(authUsers))}
                        className="text-[10px] text-indigo-700 hover:text-indigo-900 font-extrabold underline cursor-pointer block"
                      >
                        ⚡ Kooddii Tartiibaa Auto-fill: {getNextSequentialCode(authUsers)}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>+ Qaama Haaraaf Eeyyama Kenni (Save Authorized Gmail)</span>
                  </button>
                </form>

                {/* Master Force Logout / Session Reset for All Users */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                  <div className="text-left">
                    <h5 className="text-xs font-black text-rose-900 flex items-center gap-1">
                      🚨 Bilbilaa fi Kompiitara Nama Hundaarraa Ofiin Logout Taasisi (Remote Force Logout All)
                    </h5>
                    <p className="text-[11px] text-rose-700">
                      Butoonii kana tuquun fayyadamtoota hunda battalatti ofiin Logout godha; deebi'anii seenuuf Gmail fi Password eeyyamame qofa gaafata.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("⚠️ OF-EEGGANNOO CIMAAN:\n\nDhugauma bilbilaa fi kompiitara nama hundaarraa al-tokkotti Logout akka ta'an gochuu ni barbaaddaa?\n\nNamni hundi deebi'ee seenuuf Gmail fi Password gaafatama.")) {
                        triggerGlobalForceLogoutAll();
                        alert("✓ Milkiidhaan raawwateera! Bilbilaa fi kompiitara nama hundaa irraa al-tokkotti Logout ta'aniiru.");
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs transition cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                  >
                    <span>🔒 Nama Hundaarraa Logout Taasisi</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulchiinsa Aanolee fi Godinaalee Directory (Save, Edit & Delete Woredas & Zones) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Bulchiinsa Aanolee fi Godinaalee (Woredas & Zones Manager)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Iddoo Aanaalee fi Godinaalee haaraa galmeessan, gulaalan (edit) fi haqan (delete):
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isWoredasZonesUnlocked && (
              <span className="px-3 py-1 bg-amber-50 text-amber-900 font-extrabold rounded-xl text-xs border border-amber-300">
                🔒 Cufamaa (Locked)
              </span>
            )}
            <span className="px-3 py-1 bg-amber-100 text-amber-950 font-bold rounded-full text-xs font-mono">
              🏛️ {woredasList.length} Aanolee | 🗺️ {zonesList.length} Godinaalee
            </span>
            {isWoredasZonesUnlocked && (woredasList.length > 0 || zonesList.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Dhugauma Aanolee fi Godinaalee hunda al-tokkotti haquu ni barbaaddaa?")) {
                    handleClearAllWoredas();
                    handleClearAllZones();
                  }
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                title="Aanolee fi Godinaalee hunda al-tokkotti haqi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ Aanolee & Godinaalee Hunda Haqi</span>
              </button>
            )}
          </div>
        </div>

        {!isWoredasZonesUnlocked ? (
          <form onSubmit={handleUnlockWoredasZones} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-extrabold text-slate-900">🔒 Seensa Kutaa Bulchiinsa Aanolee fi Godinaalee</h4>
              <p className="text-xs text-slate-500">Aanolee fi godinaalee galmeessuu, gulaaluu fi haquuf jecha darbiisaa saaqaa:</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="password"
                required
                placeholder="Jecha darbiisaa saaqi..."
                value={woredasZonesPassInput}
                onChange={(e) => setWoredasZonesPassInput(e.target.value)}
                className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 w-full sm:w-60 shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1"
              >
                <Key className="w-4 h-4" />
                <span>Saaqi</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AANOOLEE (WOREDAS) MANAGEMENT BOX */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏛️ Tarree Aanaalee ({woredasList.length})</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {woredasList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllWoredas}
                    className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-0.5 border border-rose-300"
                    title="Tarree Aanaalee Hunda Al-tokkotti Haqi"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Hunda Haqi</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-medium">Galmeessi / Gulaali / Haqi</span>
              </div>
            </div>

            {/* Add New Woreda Form */}
            <form onSubmit={handleAddWoreda} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Maqaa Aanaa haaraa..."
                value={newWoredaInput}
                onChange={(e) => setNewWoredaInput(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>+ Dabali</span>
              </button>
            </form>

            {/* Woredas List with Edit & Delete */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {woredasList.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center p-3">Aanaan galmeeffame hin jiru.</p>
              ) : (
                woredasList.map((woreda, idx) => {
                  const isEditing = editingWoredaIndex === idx;
                  return (
                    <div
                      key={`${woreda}-${idx}`}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 grow">
                          <input
                            type="text"
                            value={editWoredaValue}
                            onChange={(e) => setEditWoredaValue(e.target.value)}
                            className="p-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditWoreda(idx)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] cursor-pointer shrink-0"
                          >
                            💾 Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWoredaIndex(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-extrabold text-slate-800 truncate" title={woreda}>
                            🏛️ {woreda}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditWoreda(idx, woreda)}
                              className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg font-bold text-[10px] transition cursor-pointer"
                              title="Gulaali (Edit)"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWoreda(woreda)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[10px] transition cursor-pointer border border-rose-200"
                              title="Haqi (Delete)"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600 inline mr-0.5" />
                              Haqi
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* GODINAALEE (ZONES) MANAGEMENT BOX */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🗺️ Tarree Godinaalee ({zonesList.length})</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {zonesList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllZones}
                    className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-0.5 border border-rose-300"
                    title="Tarree Godinaalee Hunda Al-tokkotti Haqi"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Hunda Haqi</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-medium">Galmeessi / Gulaali / Haqi</span>
              </div>
            </div>

            {/* Add New Zone Form */}
            <form onSubmit={handleAddZone} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Maqaa Godinaa haaraa..."
                value={newZoneInput}
                onChange={(e) => setNewZoneInput(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>+ Dabali</span>
              </button>
            </form>

            {/* Zones List with Edit & Delete */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {zonesList.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center p-3">Godinni galmeeffame hin jiru.</p>
              ) : (
                zonesList.map((zone, idx) => {
                  const isEditing = editingZoneIndex === idx;
                  return (
                    <div
                      key={`${zone}-${idx}`}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 grow">
                          <input
                            type="text"
                            value={editZoneValue}
                            onChange={(e) => setEditZoneValue(e.target.value)}
                            className="p-1.5 bg-indigo-50 border border-indigo-300 rounded-lg text-xs font-bold w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditZone(idx)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] cursor-pointer shrink-0"
                          >
                            💾 Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingZoneIndex(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-extrabold text-slate-800 truncate" title={zone}>
                            🗺️ {zone}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditZone(idx, zone)}
                              className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg font-bold text-[10px] transition cursor-pointer"
                              title="Gulaali (Edit)"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteZone(zone)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[10px] transition cursor-pointer border border-rose-200"
                              title="Haqi (Delete)"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600 inline mr-0.5" />
                              Haqi
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Bulchiinsa Manneen Barnootaa Directory (Supports 5000+ Schools) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>Bulchiinsa Manneen Barnootaa (Schools Directory - 5000+ Capacity)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tarree manneen barnootaa Aanaa/Godinaa , M/B ijoo filadhaa, ykn galmee haaraa dabalaa:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full font-mono text-xs font-bold">
              Baayyina: {schoolsList.length} M/B
            </span>
            {isSchoolsUnlocked && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Gurmuun Dabali (Batch Import)</span>
                </button>
                {schoolsList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSchools}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Manneen Barnootaa Hunda Al-tokkotti Haqi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>🗑️ M/B Hunda Al-tokkotti Haqi</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {!isSchoolsUnlocked ? (
          <form onSubmit={handleUnlockSchools} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center mx-auto font-black text-xl">
              🔒
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Bulchiinsa Manneen Barnootaa Saaquuf Jecha Darbiisaa (Password) Seensisaa
            </h4>
            <p className="text-xs text-slate-500">
              Ragaalee M/B galmeessuu, hirrisuu fi ilaaluuf kooddii seensisaa:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                placeholder="Jecha darbiisaa saaqi..."
                value={schoolsPassInput}
                onChange={(e) => setSchoolsPassInput(e.target.value)}
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
          <>
            {/* Search & Add Single School Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search school name (Barbaadi M/B)..."
                  value={schoolSearchQuery}
                  onChange={(e) => {
                    setSchoolSearchQuery(e.target.value);
                    setSchoolPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <form onSubmit={handleAddSingleSchool} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="M/B Haaraa..."
                  value={newSchoolInput}
                  onChange={(e) => setNewSchoolInput(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
                >
                  + Dabali
                </button>
              </form>
            </div>

            {/* Batch Schools Import Modal */}
            {showBatchModal && (
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-indigo-950">
                    Gurmuun Manneen Barnootaa Baay'ee Galmeessi (Batch Import Schools)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    ✕ Cufi
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Maqaa manneen barnootaa koman (,) ykn sarara haaraan addaan baasitii asitti garagalchaa..."
                  value={batchSchoolsInput}
                  onChange={(e) => setBatchSchoolsInput(e.target.value)}
                  className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Dhiisi
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchAddSchools}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    ✓ Hunda Galmeessi
                  </button>
                </div>
              </div>
            )}

            {/* Directory Schools List Grid */}
            {paginatedSchools.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Mana barumsaa akka barbaaddanitti argamuu hin dandeenye.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                {paginatedSchools.map((sch) => {
                  const isActive = sch === settings.savedSchoolName;
                  return (
                    <div
                      key={sch}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                        isActive ? 'bg-indigo-50/80 border-indigo-400 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={sch}>
                          {sch}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                            <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" /> M/B Ijoo Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveSchool(sch)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                          >
                            Active Godhi
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            if (confirm(`Data barattoota M/B "${sch}" haquu akka barbaaddan mirkaneessaa?`)) {
                              onDeleteSchoolData(sch);
                              alert(`✓ Data barattoota M/B "${sch}" milkiidhaan haqameera!`);
                            }
                          }}
                          className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          title="Data Barattootaa Haqi"
                        >
                          Data Haqi
                        </button>
                        <button
                          onClick={() => handleDeleteSchoolFromList(sch)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-[10px] border border-rose-200"
                          title="M/B Tarree irraa Haqi"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>M/B Haqi</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Directory Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>
                  Fuula {schoolPage} / {totalPages} (Total {filteredDirectory.length} M/B)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={schoolPage === 1}
                    onClick={() => setSchoolPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold"
                  >
                    ← Dura
                  </button>
                  <button
                    disabled={schoolPage === totalPages}
                    onClick={() => setSchoolPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold"
                  >
                    Dabarsa →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Woreda & Zone Level Data Deletion Management Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <span>Bulchiinsa Haquu Ragaalee Sadarkaa Aanaa & Godinaa</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            (Excel Restore / Upload Clear)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aanaa Level Deletion */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <span>🏛️ Ragaa Aanaa Haquu:</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ragaalee barattootaa fi EMIS Aanaa tokko keessatti upload ykn restore ta'an haquuf:
            </p>
            {allWoredas.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aanaan galmeeffame hin jiru.</p>
            ) : (
              <div className="space-y-2">
                <select
                  id="settings-aanaa-select"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Aanaa Filadhu --</option>
                  {allWoredas.map((w) => (
                    <option key={w} value={w}>🏛️ Aanaa {w}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById('settings-aanaa-select') as HTMLSelectElement;
                    const selectedVal = select?.value;
                    if (!selectedVal) {
                      alert('Maaloo Aanaa filadhu!');
                      return;
                    }
                    if (confirm(`Ragaalee Aanaa "${selectedVal}" keessatti upload/restore ta'an haquu akka barbaaddan mirkaneessaa?`)) {
                      onDeleteWoredaData?.(selectedVal);
                      alert(`✓ Ragaaleen Aanaa "${selectedVal}" haqamaniiru!`);
                    }
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ragaa Aanaa Haqi</span>
                </button>
              </div>
            )}
          </div>

          {/* Godina Level Deletion */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <span>🗺️ Ragaa Godinaa Haquu:</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ragaalee barattootaa fi EMIS Godina tokko keessatti upload ykn restore ta'an haquuf:
            </p>
            {allZones.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Godinaan galmeeffame hin jiru.</p>
            ) : (
              <div className="space-y-2">
                <select
                  id="settings-godina-select"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Godina Filadhu --</option>
                  {allZones.map((z) => (
                    <option key={z} value={z}>🗺️ Godina {z}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById('settings-godina-select') as HTMLSelectElement;
                    const selectedVal = select?.value;
                    if (!selectedVal) {
                      alert('Maaloo Godina filadhu!');
                      return;
                    }
                    if (confirm(`Ragaalee Godina "${selectedVal}" keessatti upload/restore ta'an haquu akka barbaaddan mirkaneessaa?`)) {
                      onDeleteZoneData?.(selectedVal);
                      alert(`✓ Ragaaleen Godina "${selectedVal}" haqamaniiru!`);
                    }
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ragaa Godinaa Haqi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Master Batch Delete / Clear All Lists Component */}
        <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 space-y-3 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-rose-200/60 pb-2">
            <div>
              <h4 className="font-black text-xs text-rose-950 flex items-center gap-1.5 uppercase tracking-wide">
                <span>💥 Qulqulleessaa Waliigalaa Al-tokkotti (Batch Master Cleaner)</span>
              </h4>
              <p className="text-[11px] text-rose-800">
                Tarree manneen barnootaa, aanolee fi godinaalee hunda al-tokkotti haquuf ykn qulqulleessuuf:
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-rose-200 text-rose-950 font-black rounded-lg text-[10px]">
              OF-EEGGANNOO CIMAAN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearAllWoredas}
              className="px-3 py-2.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>🏛️ Aanolee Hunda Haqi ({woredasList.length})</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllSchools}
              className="px-3 py-2.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>🏫 M/B Hunda Haqi ({schoolsList.length})</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllZones}
              className="px-3 py-2.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>🗺️ Godinaalee Hunda Haqi ({zonesList.length})</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllEntitiesBatch}
              className="px-3 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-200" />
              <span>🔥 Hunda Al-tokkotti Haqi (All 3)</span>
            </button>
          </div>
        </div>
      </div>

      {/* App Version & Live Update Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-700/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              🔄
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Haaromsa Appii Bilbilaa (PWA & Mobile Live Update)
              </h3>
              <p className="text-xs text-indigo-200">
                Sirreeffamoota haaraa fi Tarree Raawwii Gabaasaa haaromfame bilbila keessan irratti fiduuf
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-mono font-bold">
            v6.0-Live
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-indigo-900/40 p-4 rounded-2xl border border-indigo-700/40">
          <div className="text-xs text-slate-200 space-y-1">
            <p className="font-bold text-amber-300">
              💡 Sirreeffamni haaraan bilbila keessan irratti yoo hin mul'anne:
            </p>
            <p>
              1. Butoonii keelloo <strong className="text-amber-300">"Appii Haaromsi"</strong> kan gubbaa yookiin kan armaan gadii tuqaa.
            </p>
            <p>
              2. Browser/Appiin ofumaan kuusaa duraanii (cache) qulqulleessee ragaa haaraa fida.
            </p>
          </div>

          <button
            type="button"
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
              window.location.href = window.location.pathname + '?update=' + Date.now();
            }}
            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-xs shrink-0 cursor-pointer active:scale-95 border border-amber-300"
          >
            <RefreshCw className="w-4 h-4 text-slate-950" />
            <span>Appii Haaromsi (Clear Cache)</span>
          </button>
        </div>
      </div>

      {/* Login History Log Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Galmee seensaa bulchiinsaa (Login History Log)</span>
          </h3>

          {isHistoryUnlocked && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              ✓ Unlocked
            </span>
          )}
        </div>

        {!isHistoryUnlocked ? (
          <form onSubmit={handleUnlockHistory} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center mx-auto font-black text-xl">
              🔒
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">
              Seenaa Fayyadamtotaa Ilaaluuf Jecha Darbiisaa (Password) Seensisaa
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                placeholder="Jecha darbiisaa saaqi..."
                value={historyPassInput}
                onChange={(e) => setHistoryPassInput(e.target.value)}
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
              <thead className="bg-slate-100 uppercase font-bold text-slate-900">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Gmail Address</th>
                  <th className="p-3">Guyyaa & Sa'aatii (Login Time)</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loginHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">#{item.id}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.gmail}</td>
                    <td className="p-3 font-mono text-slate-600">{item.loginTime}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onDeleteLogin(item.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
