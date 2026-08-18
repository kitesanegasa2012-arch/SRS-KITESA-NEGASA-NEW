/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, GradeTarget, LoginRecord, SchoolSettings, EMISStudent } from './types';
import {
  getStoredStudents,
  saveStoredStudents,
  getStoredTargets,
  saveStoredTargets,
  getStoredLogins,
  addLoginRecord,
  deleteLoginRecord,
  getStoredSettings,
  saveStoredSettings,
  getStoredCurrentUser,
  setStoredCurrentUser,
  getStoredEMISRecords,
  saveStoredEMISRecords,
  getStoredRevokedUsers,
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
  getStoredRestoredFiles,
  getStoredGlobalSessionEpoch,
  triggerGlobalForceLogoutAll,
} from './utils/storage';
import { analyzeAnomalies } from './utils/fraudChecker';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BuuuraBoruuDashboard } from './components/BuuuraBoruuDashboard';
import { StudentRegistration } from './components/StudentRegistration';
import { GradeTargets } from './components/GradeTargets';
import { EMISUpload } from './components/EMISUpload';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AdminLevelsDashboard } from './components/AdminLevelsDashboard';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { AppPostcardModal } from './components/AppPostcardModal';
import { UserGuideModal } from './components/UserGuideModal';
import { DataDeduplicationModal } from './components/DataDeduplicationModal';
import { FraudDetectionModal } from './components/FraudDetectionModal';
import { SecureReportTransferModal } from './components/SecureReportTransferModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(getStoredCurrentUser());
  const [revokedMessage, setRevokedMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL_ZONES');
  const [selectedWoredaFilter, setSelectedWoredaFilter] = useState<string>('ALL_WOREDAS');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL_WOREDA');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('srs_admin_level_unlocked') === 'true' || Boolean(getStoredCurrentUser());
  });
  const [showPostcardModal, setShowPostcardModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showDeduplicationModal, setShowDeduplicationModal] = useState<boolean>(false);
  const [showFraudModal, setShowFraudModal] = useState<boolean>(false);
  const [showSecureTransferModal, setShowSecureTransferModal] = useState<boolean>(false);

  // Instant revocation, Global Force Logout, & Inactivity Session Monitor
  useEffect(() => {
    if (!currentUser) return;
    const cleanCurrent = currentUser.trim().toLowerCase();
    const isCreator = cleanCurrent === 'kitesanegasa2012@gmail.com';

    // Store user login epoch if not set
    const userSessionEpochKey = `srs_user_session_epoch_${cleanCurrent}`;
    if (!localStorage.getItem(userSessionEpochKey)) {
      localStorage.setItem(userSessionEpochKey, String(getStoredGlobalSessionEpoch()));
    }

    // Set initial last active timestamp
    sessionStorage.setItem('srs_last_active_timestamp', String(Date.now()));

    const recordUserActivity = () => {
      sessionStorage.setItem('srs_last_active_timestamp', String(Date.now()));
    };

    // Listen to user interactions to refresh active timestamp
    window.addEventListener('mousemove', recordUserActivity);
    window.addEventListener('keydown', recordUserActivity);
    window.addEventListener('touchstart', recordUserActivity);
    window.addEventListener('click', recordUserActivity);

    const verifyUserPermission = () => {
      // 1. Check Global Force Logout Epoch (Admin kicked out everyone)
      const currentGlobalEpoch = getStoredGlobalSessionEpoch();
      const userEpoch = Number(localStorage.getItem(userSessionEpochKey)) || 0;
      if (currentGlobalEpoch > userEpoch && !isCreator) {
        setCurrentUser(null);
        setStoredCurrentUser(null);
        setIsAdminUnlocked(false);
        localStorage.removeItem('srs_admin_level_unlocked');
        localStorage.removeItem('kitesa_current_user_v1');
        setRevokedMessage(
          '🔒 Systemichi nageenyaaf jecha yeroon seensaa keessan waan dhumateef (ykn abbaan kalaqaa Reset waan godheef) al-tokkotti Logout taatanii jirtu. Maaloo Gmail fi Password keessan galchuun irra deebi\'aa seenaa.'
        );
        return;
      }

      // 2. Inactivity Auto-Logout (If idle for 20 minutes without interaction)
      const lastActive = Number(sessionStorage.getItem('srs_last_active_timestamp')) || Date.now();
      const idleTimeMs = Date.now() - lastActive;
      const MAX_IDLE_TIME_MS = 20 * 60 * 1000; // 20 minutes auto logout

      if (idleTimeMs > MAX_IDLE_TIME_MS && !isCreator) {
        setCurrentUser(null);
        setStoredCurrentUser(null);
        setIsAdminUnlocked(false);
        localStorage.removeItem('srs_admin_level_unlocked');
        localStorage.removeItem('kitesa_current_user_v1');
        setRevokedMessage(
          '⏱️ Yeroo dheeraaf (daqiiqaa 20) hojii malee waan turtaniif nageenyaaf ofiin Logout taatan. Maaloo ammas deebi\'aatii seenaa.'
        );
        return;
      }

      if (isCreator) return;

      // 3. User Authorization & Revocation Check
      const revoked = getStoredRevokedUsers();
      const authorized = getStoredAuthorizedUsers();
      const isRevoked = revoked.includes(cleanCurrent);

      if (isRevoked) {
        setCurrentUser(null);
        setStoredCurrentUser(null);
        setIsAdminUnlocked(false);
        localStorage.removeItem('srs_admin_level_unlocked');
        localStorage.removeItem('kitesa_current_user_v1');
        setRevokedMessage(
          'Dhiifama! Eeyyamni fayyadama appi kanaa siif haqameera. Maaloo abbaa kalaqaa (Kitesa Negasa Feyisa) irraa jecha darbii (Password) haaraa fi eeyyama deebisaa gaafadhaa.'
        );
        return;
      }

      const isStillAuth = Object.keys(authorized).some(
        (key) => key.trim().toLowerCase() === cleanCurrent
      );

      if (!isStillAuth) {
        setCurrentUser(null);
        setStoredCurrentUser(null);
        setIsAdminUnlocked(false);
        localStorage.removeItem('srs_admin_level_unlocked');
        localStorage.removeItem('kitesa_current_user_v1');
        setRevokedMessage(
          'Teessoon Gmail keessanii tarree eeyyamaa keessaa haqameera! Maaloo abbaa kalaqaa irraa eeyyama deebisaa gaafadhaa.'
        );
        return;
      }
    };

    verifyUserPermission();
    const timer = setInterval(verifyUserPermission, 1500);
    window.addEventListener('storage', verifyUserPermission);
    window.addEventListener('focus', verifyUserPermission);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', verifyUserPermission);
      window.removeEventListener('focus', verifyUserPermission);
      window.removeEventListener('mousemove', recordUserActivity);
      window.removeEventListener('keydown', recordUserActivity);
      window.removeEventListener('touchstart', recordUserActivity);
      window.removeEventListener('click', recordUserActivity);
    };
  }, [currentUser]);

  // Support deep-link direct school filtering via URL params (e.g. ?school=Minaaree&view=reports)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const schoolParam = params.get('school');
      const viewParam = params.get('view');
      if (schoolParam) {
        setSelectedSchoolFilter(schoolParam);
      }
      if (viewParam) {
        setActiveTab(viewParam);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, GradeTarget>>({});
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(getStoredSettings());
  const [emisRecords, setEmisRecords] = useState<EMISStudent[]>([]);

  const handleRefreshData = () => {
    setStudents(getStoredStudents());
    setTargets(getStoredTargets());
    setLoginHistory(getStoredLogins());
    setSettings(getStoredSettings());
    setEmisRecords(getStoredEMISRecords());
  };

  useEffect(() => {
    handleRefreshData();
  }, []);

  const handleSaveEmisRecords = (newRecords: EMISStudent[]) => {
    setEmisRecords(newRecords);
    saveStoredEMISRecords(newRecords);
  };

  // Save changes
  const handleAddStudent = (newStudent: Student) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStoredStudents(updated);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStoredStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const targetStudent = students.find((s) => s.id === id);
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveStoredStudents(updated);

    if (targetStudent) {
      const targetFanId = (targetStudent.fanId || '').trim();
      const targetName = (targetStudent.maqaaGuutuu || '').trim().toLowerCase();
      const updatedEmis = emisRecords.filter((e) => {
        if (e.id === id) return false;
        if (targetFanId && targetFanId !== 'NO' && e.fanId === targetFanId) return false;
        if (targetName && (e.maqaaGuutuu || '').trim().toLowerCase() === targetName) return false;
        return true;
      });
      setEmisRecords(updatedEmis);
      saveStoredEMISRecords(updatedEmis);
    }
  };

  const handleDeleteStudentsByIDs = (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = students.filter((s) => !idSet.has(s.id));
    setStudents(updated);
    saveStoredStudents(updated);

    const updatedEmis = emisRecords.filter((e) => !idSet.has(e.id));
    setEmisRecords(updatedEmis);
    saveStoredEMISRecords(updatedEmis);
  };

  const handleAddMultipleStudents = (newStudents: Student[]) => {
    const cleanName = (n: string) => (n || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const currentList = [...students];

    newStudents.forEach((incoming) => {
      const idx = currentList.findIndex((existing) => {
        if (incoming.id && existing.id && incoming.id === existing.id) return true;
        if (incoming.nationalId && existing.nationalId && incoming.nationalId !== '-' && incoming.nationalId === existing.nationalId) return true;
        if (incoming.fanId && existing.fanId && incoming.fanId !== 'NO' && incoming.fanId === existing.fanId) return true;
        if (cleanName(incoming.maqaaGuutuu) === cleanName(existing.maqaaGuutuu)) return true;
        return false;
      });

      if (idx !== -1) {
        currentList[idx] = {
          ...currentList[idx],
          ...incoming,
          id: currentList[idx].id,
          fanId: (incoming.fanId && incoming.fanId !== 'NO') ? incoming.fanId : currentList[idx].fanId,
          nationalId: (incoming.nationalId && incoming.nationalId !== '-') ? incoming.nationalId : currentList[idx].nationalId,
          avireejjiiQabxii: (incoming.avireejjiiQabxii !== undefined && incoming.avireejjiiQabxii !== 'NO') ? incoming.avireejjiiQabxii : currentList[idx].avireejjiiQabxii,
          kutaa: (incoming.kutaa && incoming.kutaa !== '1') ? incoming.kutaa : currentList[idx].kutaa,
        };
      } else {
        currentList.push(incoming);
      }
    });

    setStudents(currentList);
    saveStoredStudents(currentList);
  };

  const handleUpdateMultipleStudents = (updatedStudents: Student[]) => {
    const updateMap = new Map(updatedStudents.map((s) => [s.id, s]));
    const updated = students.map((s) => updateMap.get(s.id) || s);
    setStudents(updated);
    saveStoredStudents(updated);
  };

  const handleSaveTargets = (newTargets: Record<string, GradeTarget>) => {
    setTargets(newTargets);
    saveStoredTargets(newTargets);
  };

  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleDeleteLogin = (id: string) => {
    const updated = deleteLoginRecord(id);
    setLoginHistory(updated);
  };

  const handleDeleteSchoolData = (schoolName: string) => {
    const sClean = (schoolName || '').trim().toLowerCase();
    const updatedStudents = students.filter((s) => (s.manaBarumsaa || '').trim().toLowerCase() !== sClean);
    const updatedEmis = emisRecords.filter((e) => (e.manaBarumsaa || '').trim().toLowerCase() !== sClean);
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setEmisRecords(updatedEmis);
    saveStoredEMISRecords(updatedEmis);

    const currentSchools = getStoredSchoolsList();
    const updatedSchools = currentSchools.filter((s) => s.trim().toLowerCase() !== sClean);
    saveStoredSchoolsList(updatedSchools);

    const currentUnits = getStoredAdminUnits();
    const updatedUnits = currentUnits.filter((u) => u.name.trim().toLowerCase() !== sClean);
    saveStoredAdminUnits(updatedUnits);

    if (settings.savedSchoolName && settings.savedSchoolName.trim().toLowerCase() === sClean) {
      const nextActive = updatedSchools.length > 0 ? updatedSchools[0] : '';
      const newSettings = { ...settings, savedSchoolName: nextActive };
      setSettings(newSettings);
      saveStoredSettings(newSettings);
    }
  };

  const handleDeleteWoredaData = (woredaName: string) => {
    const wClean = (woredaName || '').trim().toLowerCase();
    const updatedStudents = students.filter((s) => (s.aanaa || '').trim().toLowerCase() !== wClean);
    const updatedEmis = emisRecords.filter((e) => (e.aanaa || '').trim().toLowerCase() !== wClean);
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setEmisRecords(updatedEmis);
    saveStoredEMISRecords(updatedEmis);

    const currentWoredas = getStoredWoredasList();
    const updatedWoredas = currentWoredas.filter((w) => w.trim().toLowerCase() !== wClean);
    saveStoredWoredasList(updatedWoredas);

    const currentUnits = getStoredAdminUnits();
    const updatedUnits = currentUnits.filter((u) => u.name.trim().toLowerCase() !== wClean);
    saveStoredAdminUnits(updatedUnits);
  };

  const handleDeleteZoneData = (zoneName: string) => {
    const zClean = (zoneName || '').trim().toLowerCase();
    const updatedStudents = students.filter((s) => (s.godina || '').trim().toLowerCase() !== zClean);
    const updatedEmis = emisRecords.filter((e) => (e.godina || '').trim().toLowerCase() !== zClean);
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setEmisRecords(updatedEmis);
    saveStoredEMISRecords(updatedEmis);

    const currentZones = getStoredZonesList();
    const updatedZones = currentZones.filter((z) => z.trim().toLowerCase() !== zClean);
    saveStoredZonesList(updatedZones);

    const currentUnits = getStoredAdminUnits();
    const updatedUnits = currentUnits.filter((u) => u.name.trim().toLowerCase() !== zClean);
    saveStoredAdminUnits(updatedUnits);
  };

  const handleLoginSuccess = (userEmail: string) => {
    setRevokedMessage('');
    setCurrentUser(userEmail);
    setStoredCurrentUser(userEmail);
    const updatedLogins = addLoginRecord(userEmail);
    setLoginHistory(updatedLogins);
    setShowPostcardModal(true);
  };

  const handleLogout = () => {
    setRevokedMessage('');
    setCurrentUser(null);
    setStoredCurrentUser(null);
    setIsAdminUnlocked(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kitesa_current_user_v1');
      localStorage.removeItem('srs_admin_level_unlocked');
      sessionStorage.clear();
    }
  };

  // List of distinct school names (combining directory schools from settings with student schools and restored files)
  const directorySchools = getStoredSchoolsList();
  const restoredFilesList = getStoredRestoredFiles();
  const adminUnitsList = getStoredAdminUnits();

  const allSchools = Array.from(
    new Set([
      ...(settings.savedSchoolName ? [settings.savedSchoolName] : []),
      ...directorySchools,
      ...adminUnitsList.filter((u) => u.type === 'school').map((u) => u.name),
      ...restoredFilesList.map((rf) => rf.schoolName).filter(Boolean),
      ...students.map((s) => s.manaBarumsaa).filter((s) => s && s.trim() !== '')
    ])
  ).filter((s) => s && s.trim() !== '' && !/^\d+$/.test(s));

  const allWoredas = Array.from(
    new Set([
      ...getStoredWoredasList(),
      ...adminUnitsList.filter((u) => u.type === 'aanaa').map((u) => u.name),
      ...students.map((s) => s.aanaa).filter((w) => w && w.trim() !== '')
    ])
  ).filter((w) => w && w.trim() !== '');

  const allZones = Array.from(
    new Set([
      ...getStoredZonesList(),
      ...adminUnitsList.filter((u) => u.type === 'godina').map((u) => u.name),
      ...students.map((s) => s.godina).filter((z) => z && z.trim() !== '')
    ])
  ).filter((z) => z && z.trim() !== '');

  // Compute system-wide duplicate and fraud counts
  const norm = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  
  const duplicateCount = (() => {
    const natMap = new Map<string, number>();
    const fanMap = new Map<string, number>();
    const nameMap = new Map<string, number>();

    students.forEach((s) => {
      if (s.nationalId && s.nationalId !== '-' && s.nationalId !== 'NO') {
        const k = s.nationalId.trim().toUpperCase();
        natMap.set(k, (natMap.get(k) || 0) + 1);
      }
      if (s.fanId && s.fanId !== 'NO') {
        const k = s.fanId.trim().toUpperCase();
        fanMap.set(k, (fanMap.get(k) || 0) + 1);
      }
      const cleanN = norm(s.maqaaGuutuu);
      const cleanM = norm(s.maqaaHaadhaa);
      if (cleanN && cleanM) {
        const k = `${cleanN}_${cleanM}`;
        nameMap.set(k, (nameMap.get(k) || 0) + 1);
      }
    });

    let count = 0;
    natMap.forEach((v) => { if (v > 1) count++; });
    fanMap.forEach((v) => { if (v > 1) count++; });
    nameMap.forEach((v) => { if (v > 1) count++; });
    return count;
  })();

  const fraudCount = analyzeAnomalies(students, allSchools, allWoredas, allZones).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <PwaInstallBanner />
        <LoginModal onLoginSuccess={handleLoginSuccess} revokedMessage={revokedMessage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <PwaInstallBanner />
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          onLogout={handleLogout}
          settings={settings}
          selectedSchoolFilter={selectedSchoolFilter}
          duplicateCount={duplicateCount}
          fraudCount={fraudCount}
          onOpenPostcard={() => setShowPostcardModal(true)}
          onOpenGuide={() => setShowGuideModal(true)}
          onOpenDeduplication={() => setShowDeduplicationModal(true)}
          onOpenFraudDetection={() => setShowFraudModal(true)}
          onOpenSecureTransfer={() => setShowSecureTransferModal(true)}
        />

        {/* Main Workspace Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              students={students}
              targets={targets}
              settings={settings}
              onNavigate={setActiveTab}
              allSchools={allSchools}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
              onOpenPostcard={() => setShowPostcardModal(true)}
              duplicateCount={duplicateCount}
              fraudCount={fraudCount}
              onOpenDeduplication={() => setShowDeduplicationModal(true)}
              onOpenFraudDetection={() => setShowFraudModal(true)}
            />
          )}

          {activeTab === 'aanaa' && (
            <AdminLevelsDashboard
              students={students}
              targets={targets}
              settings={settings}
              emisRecords={emisRecords}
              level="aanaa"
              onNavigate={setActiveTab}
              isUnlocked={isAdminUnlocked}
              onUnlockSuccess={() => {
                setIsAdminUnlocked(true);
                localStorage.setItem('srs_admin_level_unlocked', 'true');
              }}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              selectedZoneFilter={selectedZoneFilter}
              onSelectZoneFilter={setSelectedZoneFilter}
              selectedWoredaFilter={selectedWoredaFilter}
              onSelectWoredaFilter={setSelectedWoredaFilter}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
              onDeleteWoredaData={handleDeleteWoredaData}
              onDeleteZoneData={handleDeleteZoneData}
              onDeleteSchoolData={handleDeleteSchoolData}
              onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
              onSaveEmisRecords={handleSaveEmisRecords}
            />
          )}

          {activeTab === 'godina' && (
            <AdminLevelsDashboard
              students={students}
              targets={targets}
              settings={settings}
              emisRecords={emisRecords}
              level="godina"
              onNavigate={setActiveTab}
              isUnlocked={isAdminUnlocked}
              onUnlockSuccess={() => {
                setIsAdminUnlocked(true);
                localStorage.setItem('srs_admin_level_unlocked', 'true');
              }}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              selectedZoneFilter={selectedZoneFilter}
              onSelectZoneFilter={setSelectedZoneFilter}
              selectedWoredaFilter={selectedWoredaFilter}
              onSelectWoredaFilter={setSelectedWoredaFilter}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
              onDeleteWoredaData={handleDeleteWoredaData}
              onDeleteZoneData={handleDeleteZoneData}
              onDeleteSchoolData={handleDeleteSchoolData}
              onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
              onSaveEmisRecords={handleSaveEmisRecords}
            />
          )}

          {activeTab === 'oromiyaa' && (
            <AdminLevelsDashboard
              students={students}
              targets={targets}
              settings={settings}
              emisRecords={emisRecords}
              level="oromiyaa"
              onNavigate={setActiveTab}
              isUnlocked={isAdminUnlocked}
              onUnlockSuccess={() => {
                setIsAdminUnlocked(true);
                localStorage.setItem('srs_admin_level_unlocked', 'true');
              }}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              selectedZoneFilter={selectedZoneFilter}
              onSelectZoneFilter={setSelectedZoneFilter}
              selectedWoredaFilter={selectedWoredaFilter}
              onSelectWoredaFilter={setSelectedWoredaFilter}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
              onDeleteWoredaData={handleDeleteWoredaData}
              onDeleteZoneData={handleDeleteZoneData}
              onDeleteSchoolData={handleDeleteSchoolData}
              onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
              onSaveEmisRecords={handleSaveEmisRecords}
            />
          )}

          {activeTab === 'buuura_boruu' && (
            <BuuuraBoruuDashboard
              students={students}
              emisRecords={emisRecords}
              settings={settings}
              onNavigate={setActiveTab}
              allSchools={allSchools}
            />
          )}

          {activeTab === 'students' && (
            <StudentRegistration
              students={students}
              emisRecords={emisRecords}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
              settings={settings}
              currentUser={currentUser}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
            />
          )}

          {activeTab === 'targets' && (
            <GradeTargets
              students={students}
              targets={targets}
              onSaveTargets={handleSaveTargets}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              selectedZoneFilter={selectedZoneFilter}
              onSelectZoneFilter={setSelectedZoneFilter}
              selectedWoredaFilter={selectedWoredaFilter}
              onSelectWoredaFilter={setSelectedWoredaFilter}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
            />
          )}

          {activeTab === 'emis' && (
            <EMISUpload
              appStudents={students}
              emisRecords={emisRecords}
              onSaveEmisRecords={handleSaveEmisRecords}
              onAddMultipleStudents={handleAddMultipleStudents}
              onUpdateMultipleStudents={handleUpdateMultipleStudents}
              onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              students={students}
              targets={targets}
              onSaveTargets={handleSaveTargets}
              settings={settings}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              selectedZoneFilter={selectedZoneFilter}
              onSelectZoneFilter={setSelectedZoneFilter}
              selectedWoredaFilter={selectedWoredaFilter}
              onSelectWoredaFilter={setSelectedWoredaFilter}
              selectedSchoolFilter={selectedSchoolFilter}
              onSelectSchoolFilter={setSelectedSchoolFilter}
              onOpenDeduplication={() => setShowDeduplicationModal(true)}
              onOpenFraudDetection={() => setShowFraudModal(true)}
              onOpenSecureTransfer={() => setShowSecureTransferModal(true)}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onSaveSettings={handleSaveSettings}
              loginHistory={loginHistory}
              onDeleteLogin={handleDeleteLogin}
              allSchools={allSchools}
              allWoredas={allWoredas}
              allZones={allZones}
              onDeleteSchoolData={handleDeleteSchoolData}
              onDeleteWoredaData={handleDeleteWoredaData}
              onDeleteZoneData={handleDeleteZoneData}
              onRefreshData={handleRefreshData}
            />
          )}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 print:hidden mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-200">
            Kitesa Negasa Feyisa — Student Registration System (Systema Galmee Barattootaa)
          </p>
          <p>
            Phone & Telegram: <span className="text-amber-400 font-mono">+251969184005</span> / <span className="text-amber-400 font-mono">0910927936</span> | Gmail: <span className="text-rose-400">kitesanegasa2012@gmail.com</span>
          </p>
          <p className="text-[10px] text-slate-500 pt-2">
            © {new Date().getFullYear()} All rights reserved. Built with React, TypeScript & Tailwind CSS.
          </p>
        </div>
      </footer>
      {/* Postcard Overview Modal */}
      <AppPostcardModal
        isOpen={showPostcardModal}
        onClose={() => setShowPostcardModal(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setShowPostcardModal(false);
        }}
      />
      {/* User Guide Step-by-Step Modal */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setShowGuideModal(false);
        }}
      />
      {/* Permission-Based De-duplication Modal */}
      <DataDeduplicationModal
        isOpen={showDeduplicationModal}
        onClose={() => setShowDeduplicationModal(false)}
        students={students}
        onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
        onDeleteStudent={handleDeleteStudent}
        onUpdateStudent={handleUpdateStudent}
      />
      {/* Fraud & Anomaly Detection Modal */}
      <FraudDetectionModal
        isOpen={showFraudModal}
        onClose={() => setShowFraudModal(false)}
        students={students}
        allSchools={allSchools}
        allWoredas={allWoredas}
        allZones={allZones}
        onDeleteStudentsByIDs={handleDeleteStudentsByIDs}
        onDeleteStudent={handleDeleteStudent}
        onUpdateStudent={handleUpdateStudent}
      />
      {/* Secure Report Link Transfer Modal */}
      <SecureReportTransferModal
        isOpen={showSecureTransferModal}
        onClose={() => setShowSecureTransferModal(false)}
        woredaName={selectedWoredaFilter !== 'ALL_WOREDAS' ? selectedWoredaFilter : (allWoredas[0] || 'Aanaa')}
        zoneName={selectedZoneFilter !== 'ALL_ZONES' ? selectedZoneFilter : (allZones[0] || 'Godina')}
        schoolName={selectedSchoolFilter !== 'ALL_WOREDA' ? selectedSchoolFilter : (allSchools[0] || 'Mana Barumsaa')}
      />
    </div>
  );
}
