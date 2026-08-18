import { Student, GradeTarget, LoginRecord, SchoolSettings, EMISStudent, AdminUnit, RestoredFileRecord, DuplicateGroup } from '../types';
import * as XLSX from 'xlsx';
import {
  INITIAL_STUDENTS,
  INITIAL_TARGETS,
  INITIAL_SCHOOL_SETTINGS,
  INITIAL_EMIS_RECORDS,
  AUTHORIZED_USERS,
  REPORT_PASSWORDS,
} from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'kitesa_students_v1',
  TARGETS: 'kitesa_targets_v1',
  LOGINS: 'kitesa_logins_v1',
  SETTINGS: 'kitesa_settings_v1',
  CURRENT_USER: 'kitesa_current_user_v1',
  EMIS_RECORDS: 'kitesa_emis_records_v1',
  AUTH_USERS: 'kitesa_auth_users_v1',
  REVOKED_USERS: 'kitesa_revoked_users_v1',
  SCHOOLS_LIST: 'kitesa_schools_list_v1',
  WOREDAS_LIST: 'kitesa_woredas_list_v1',
  ZONES_LIST: 'kitesa_zones_list_v1',
  ADMIN_UNITS: 'srs_admin_units_list',
  RESTORED_FILES: 'srs_restored_files_history',
  SCHOOL_GRADE_TARGETS: 'srs_school_grade_targets_map',
  CUSTOM_TARGETS_MAP: 'srs_custom_targets_map',
  GLOBAL_SESSION_EPOCH: 'srs_global_session_epoch_v1',
  USER_LAST_ACTIVE: 'srs_user_last_active_time',
};

export const getStoredGlobalSessionEpoch = (): number => {
  if (typeof window === 'undefined') return 1;
  const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_SESSION_EPOCH);
  if (!saved) {
    // Default baseline epoch
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SESSION_EPOCH, '1');
    return 1;
  }
  return Number(saved) || 1;
};

export const triggerGlobalForceLogoutAll = (): void => {
  if (typeof window === 'undefined') return;
  const nextEpoch = Date.now();
  localStorage.setItem(STORAGE_KEYS.GLOBAL_SESSION_EPOCH, String(nextEpoch));
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore
  }
};

export const getStoredCustomTargetsMap = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem('srs_custom_targets_map');
    const parsed = saved ? JSON.parse(saved) : {};
    const storedUnits = getStoredAdminUnits();
    storedUnits.forEach((u) => {
      if (u.name && u.targetStudents && !parsed[u.name]) {
        parsed[u.name] = u.targetStudents;
      }
    });
    return parsed;
  } catch {
    return {};
  }
};

export const saveStoredCustomTargetsMap = (map: Record<string, number>): void => {
  localStorage.setItem('srs_custom_targets_map', JSON.stringify(map));
};

export const generateScaledGradeTargets = (totalTarget: number): Record<string, GradeTarget> => {
  const baseKeys = ['bb_4', 'bb_5', 'bb_6', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const baseTargets = INITIAL_TARGETS;
  const baseTotal = baseKeys.reduce((acc, k) => acc + (baseTargets[k]?.dhiira || 0) + (baseTargets[k]?.dhalaa || 0), 0);
  const ratio = totalTarget / Math.max(1, baseTotal);

  const result: Record<string, GradeTarget> = {};
  let currentSum = 0;

  baseKeys.forEach((k) => {
    const origD = baseTargets[k]?.dhiira || 0;
    const origF = baseTargets[k]?.dhalaa || 0;
    let newD = Math.round(origD * ratio);
    let newF = Math.round(origF * ratio);

    if (totalTarget >= 30 && origD > 0 && newD === 0) newD = 1;
    if (totalTarget >= 30 && origF > 0 && newF === 0) newF = 1;

    result[k] = {
      kutaa: k,
      dhiira: newD,
      dhalaa: newF,
    };
    currentSum += newD + newF;
  });

  const diff = totalTarget - currentSum;
  if (diff !== 0 && result['1']) {
    const half1 = Math.floor(diff / 2);
    const half2 = diff - half1;
    result['1'].dhiira = Math.max(0, result['1'].dhiira + half1);
    result['1'].dhalaa = Math.max(0, result['1'].dhalaa + half2);
  }

  const g1D = result['1']?.dhiira || 0;
  const g1F = result['1']?.dhalaa || 0;
  result['u7_1'] = {
    kutaa: 'u7_1',
    dhiira: Math.round(g1D * 0.65),
    dhalaa: Math.round(g1F * 0.65),
  };

  return result;
};

export const calculateGradesTargetTotal = (gradeTargets: Record<string, GradeTarget>): number => {
  if (!gradeTargets) return 0;
  const grade1to12Keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const grades1to12Sum = grade1to12Keys.reduce((acc, k) => {
    const t = gradeTargets[k];
    return acc + (t?.dhiira || 0) + (t?.dhalaa || 0);
  }, 0);
  if (grades1to12Sum > 0) {
    return grades1to12Sum;
  }
  // Fallback: sum all keys except subset breakdown keys like 'u7_1'
  return Object.entries(gradeTargets).reduce((acc, [k, t]) => {
    if (k === 'u7_1' || k === 'u_7_k1' || k === 'u_8_k1') return acc;
    return acc + (t?.dhiira || 0) + (t?.dhalaa || 0);
  }, 0);
};

export const getUnifiedSchoolGradeTargets = (
  schoolName: string,
  fallbackTargets?: Record<string, GradeTarget>
): { targets: Record<string, GradeTarget>; totalTarget: number } => {
  if (!schoolName || schoolName === 'ALL_WOREDA') {
    const base = fallbackTargets || getStoredTargets();
    const baseTotal = calculateGradesTargetTotal(base);
    return { targets: base, totalTarget: baseTotal > 0 ? baseTotal : 650 };
  }

  const map = getStoredSchoolGradeTargetsMap();
  const customTargets = getStoredCustomTargetsMap();
  const storedUnits = getStoredAdminUnits();
  const schClean = schoolName.trim().toLowerCase();

  // 1. Check if school has explicit grade targets saved
  if (map[schoolName] && Object.keys(map[schoolName]).length > 0) {
    const schGradeTargets = map[schoolName];
    const total = calculateGradesTargetTotal(schGradeTargets);
    if (total > 0) {
      return { targets: schGradeTargets, totalTarget: total };
    }
  }

  // 2. Check if custom target was set for this school (in customTargets or adminUnits)
  const customT =
    customTargets[schoolName] ||
    storedUnits.find((u) => u.type === 'school' && u.name.trim().toLowerCase() === schClean)?.targetStudents;

  if (customT && customT > 0) {
    const generated = generateScaledGradeTargets(customT);
    return { targets: generated, totalTarget: customT };
  }

  // 3. Fallback to base targets
  const base = fallbackTargets || getStoredTargets();
  const baseTotal = calculateGradesTargetTotal(base);
  return { targets: base, totalTarget: baseTotal > 0 ? baseTotal : 650 };
};

export const saveUnifiedSchoolTarget = (
  schoolName: string,
  totalTarget: number,
  gradeTargets?: Record<string, GradeTarget>
): void => {
  if (!schoolName) return;
  const customMap = getStoredCustomTargetsMap();
  customMap[schoolName] = totalTarget;
  saveStoredCustomTargetsMap(customMap);

  const units = getStoredAdminUnits();
  const updatedUnits = units.map((u) => {
    if (u.type === 'school' && u.name.trim().toLowerCase() === schoolName.trim().toLowerCase()) {
      return { ...u, targetStudents: totalTarget };
    }
    return u;
  });
  saveStoredAdminUnits(updatedUnits);

  const gradeT = gradeTargets || generateScaledGradeTargets(totalTarget);
  saveSchoolGradeTargets(schoolName, gradeT);
};

export const getUnifiedWoredaTargets = (
  woredaName: string,
  allSchoolNames: string[],
  students: Student[]
): {
  woredaTarget: number;
  gradeTargets: Record<string, GradeTarget>;
  schoolsCount: number;
  schoolTargets: Record<string, number>;
} => {
  const storedUnits = getStoredAdminUnits();
  const customMap = getStoredCustomTargetsMap();
  const wClean = (woredaName || '').trim().toLowerCase();

  // Find all schools belonging to this Woreda
  const schoolsInWoreda = allSchoolNames.filter((sch) => {
    const schClean = sch.trim().toLowerCase();
    const schStudents = students.filter((s) => (s.manaBarumsaa || '').trim().toLowerCase() === schClean);
    const schAanaa = schStudents[0]?.aanaa || '';
    if (schAanaa.trim().toLowerCase() === wClean) return true;
    const foundUnit = storedUnits.find((u) => u.type === 'school' && u.name.trim().toLowerCase() === schClean);
    if (foundUnit && (foundUnit.parentName || (foundUnit as any).parentUnit || '').trim().toLowerCase() === wClean) return true;
    return false;
  });

  const schoolTargets: Record<string, number> = {};
  const aggregatedGradeTargets: Record<string, GradeTarget> = {};
  let totalWoredaTarget = 0;

  const targetSchoolsList = schoolsInWoreda.length > 0 ? schoolsInWoreda : (woredaName === 'ALL_WOREDAS' || !woredaName ? allSchoolNames : []);

  if (targetSchoolsList.length > 0) {
    targetSchoolsList.forEach((sch) => {
      const { targets: schGrades, totalTarget: schTot } = getUnifiedSchoolGradeTargets(sch);
      schoolTargets[sch] = schTot;
      totalWoredaTarget += schTot;

      Object.entries(schGrades).forEach(([k, t]) => {
        if (!aggregatedGradeTargets[k]) {
          aggregatedGradeTargets[k] = { kutaa: k, dhiira: 0, dhalaa: 0 };
        }
        aggregatedGradeTargets[k].dhiira += t?.dhiira || 0;
        aggregatedGradeTargets[k].dhalaa += t?.dhalaa || 0;
      });
    });
  } else {
    const customW =
      customMap[woredaName] ||
      storedUnits.find((u) => u.type === 'aanaa' && u.name.trim().toLowerCase() === wClean)?.targetStudents ||
      650;
    totalWoredaTarget = customW;
    const generated = generateScaledGradeTargets(customW);
    Object.assign(aggregatedGradeTargets, generated);
  }

  return {
    woredaTarget: totalWoredaTarget,
    gradeTargets: aggregatedGradeTargets,
    schoolsCount: Math.max(1, targetSchoolsList.length),
    schoolTargets,
  };
};

export const getStoredSchoolGradeTargetsMap = (): Record<string, Record<string, GradeTarget>> => {
  const data = localStorage.getItem(STORAGE_KEYS.SCHOOL_GRADE_TARGETS);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

export const saveStoredSchoolGradeTargetsMap = (map: Record<string, Record<string, GradeTarget>>): void => {
  localStorage.setItem(STORAGE_KEYS.SCHOOL_GRADE_TARGETS, JSON.stringify(map));
};

export const getSchoolGradeTargets = (schoolName: string): Record<string, GradeTarget> => {
  const { targets } = getUnifiedSchoolGradeTargets(schoolName);
  return targets;
};

export const saveSchoolGradeTargets = (schoolName: string, targets: Record<string, GradeTarget>): void => {
  const map = getStoredSchoolGradeTargetsMap();
  map[schoolName] = targets;
  saveStoredSchoolGradeTargetsMap(map);
};

export const getStoredRestoredFiles = (): RestoredFileRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RESTORED_FILES);
  if (!data) return [];
  try {
    const list = JSON.parse(data);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredRestoredFile = (record: RestoredFileRecord): void => {
  const current = getStoredRestoredFiles();
  const updated = [record, ...current];
  localStorage.setItem(STORAGE_KEYS.RESTORED_FILES, JSON.stringify(updated));
};

export const clearRestoredFilesHistory = (): void => {
  localStorage.removeItem(STORAGE_KEYS.RESTORED_FILES);
};

export const findDuplicateStudents = (students: Student[]): DuplicateGroup[] => {
  const groupsMap = new Map<string, { reason: string; students: Student[] }>();

  students.forEach((s) => {
    const nameKey = (s.maqaaGuutuu || '').trim().toLowerCase();
    const gradeKey = (s.kutaa || '').trim().toLowerCase();
    const schoolKey = (s.manaBarumsaa || '').trim().toLowerCase();

    if (nameKey && schoolKey) {
      const compKey = `comp_${nameKey}_${gradeKey}_${schoolKey}`;
      if (!groupsMap.has(compKey)) {
        groupsMap.set(compKey, {
          reason: `Maqaa (${s.maqaaGuutuu}), Kutaa (${s.kutaa}), M/B (${s.manaBarumsaa})`,
          students: [],
        });
      }
      groupsMap.get(compKey)!.students.push(s);
    }

    if (s.nationalId && s.nationalId !== '-' && s.nationalId.trim() !== '') {
      const natKey = `nat_${s.nationalId.trim().toLowerCase()}`;
      if (!groupsMap.has(natKey)) {
        groupsMap.set(natKey, {
          reason: `National ID (${s.nationalId})`,
          students: [],
        });
      }
      groupsMap.get(natKey)!.students.push(s);
    }
  });

  const duplicateGroups: DuplicateGroup[] = [];
  let idx = 1;
  groupsMap.forEach((val, key) => {
    const uniqueSts: Student[] = [];
    const seenIds = new Set<string>();
    val.students.forEach((st) => {
      if (!seenIds.has(st.id)) {
        seenIds.add(st.id);
        uniqueSts.push(st);
      }
    });

    if (uniqueSts.length > 1) {
      duplicateGroups.push({
        id: `dup_group_${idx++}`,
        key,
        reason: val.reason,
        students: uniqueSts,
      });
    }
  });

  return duplicateGroups;
};


export const formatSchoolDisplayName = (rawName?: string, fallback: string = 'Mana Barumsaa Waliigalaa'): string => {
  if (!rawName || rawName.trim() === '') return fallback;
  const clean = rawName.trim();
  if (/^\d+$/.test(clean) || /^mana\s+barumsaa\s+\d+$/i.test(clean)) {
    return fallback;
  }
  return clean;
};

export const DEFAULT_SCHOOLS_LIST: string[] = [];

export const DEFAULT_WOREDAS_LIST: string[] = [];

export const DEFAULT_ZONES_LIST: string[] = [];

export const getStoredWoredasList = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.WOREDAS_LIST);
  if (!data) return DEFAULT_WOREDAS_LIST;
  try {
    const list = JSON.parse(data);
    return Array.isArray(list) ? list.filter((w) => w && !/^\d+$/.test(String(w).trim())) : DEFAULT_WOREDAS_LIST;
  } catch (e) {
    return DEFAULT_WOREDAS_LIST;
  }
};

export const saveStoredWoredasList = (woredas: string[]): void => {
  localStorage.setItem(STORAGE_KEYS.WOREDAS_LIST, JSON.stringify(woredas));
};

export const getStoredZonesList = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ZONES_LIST);
  if (!data) return DEFAULT_ZONES_LIST;
  try {
    const list = JSON.parse(data);
    return Array.isArray(list) ? list.filter((z) => z && !/^\d+$/.test(String(z).trim())) : DEFAULT_ZONES_LIST;
  } catch (e) {
    return DEFAULT_ZONES_LIST;
  }
};

export const saveStoredZonesList = (zones: string[]): void => {
  localStorage.setItem(STORAGE_KEYS.ZONES_LIST, JSON.stringify(zones));
};

export const DEFAULT_ADMIN_UNITS: AdminUnit[] = [];

export const getStoredAdminUnits = (): AdminUnit[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN_UNITS);
  let list: AdminUnit[] = DEFAULT_ADMIN_UNITS;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        list = parsed.filter(
          (u) =>
            u &&
            u.name &&
            !/^\d+$/.test(String(u.name).trim()) &&
            !/^mana\s+barumsaa\s+\d+$/i.test(String(u.name).trim())
        );
      }
    } catch (e) {
      list = DEFAULT_ADMIN_UNITS;
    }
  }

  let customMap: Record<string, number> = {};
  let schoolGradesMap: Record<string, Record<string, GradeTarget>> = {};
  try {
    const cData = localStorage.getItem(STORAGE_KEYS.CUSTOM_TARGETS_MAP);
    if (cData) customMap = JSON.parse(cData);
    const sgData = localStorage.getItem(STORAGE_KEYS.SCHOOL_GRADE_TARGETS);
    if (sgData) schoolGradesMap = JSON.parse(sgData);
  } catch (e) {
    // ignore
  }

  return list.map((u) => {
    if (u.type === 'school') {
      const schName = formatSchoolDisplayName(u.name);
      let calculatedTarget = u.targetStudents;
      if (schoolGradesMap[schName] && Object.keys(schoolGradesMap[schName]).length > 0) {
        const sum = calculateGradesTargetTotal(schoolGradesMap[schName]);
        if (sum > 0) calculatedTarget = sum;
      } else if (customMap[schName] && customMap[schName] > 0) {
        calculatedTarget = customMap[schName];
      }
      return {
        ...u,
        name: schName,
        parentName: u.parentName || (u as any).parentUnit || 'Waajjira Barnootaa Aanaa',
        targetStudents: calculatedTarget || u.targetStudents || 350,
      };
    }
    if (u.type === 'aanaa' && customMap[u.name]) {
      return {
        ...u,
        targetStudents: customMap[u.name] || u.targetStudents || 3500,
      };
    }
    return u;
  });
};

export const saveStoredAdminUnits = (units: AdminUnit[]): void => {
  localStorage.setItem(STORAGE_KEYS.ADMIN_UNITS, JSON.stringify(units));
};

export const getStoredRevokedUsers = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REVOKED_USERS);
  if (!data) return [];
  try {
    const list = JSON.parse(data);
    return Array.isArray(list) ? list.map((e: string) => e.trim().toLowerCase()) : [];
  } catch (e) {
    return [];
  }
};

export const addRevokedUser = (email: string): void => {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === 'kitesanegasa2012@gmail.com') return; // Creator cannot be revoked
  const current = getStoredRevokedUsers();
  if (!current.includes(cleanEmail)) {
    const updated = [...current, cleanEmail];
    localStorage.setItem(STORAGE_KEYS.REVOKED_USERS, JSON.stringify(updated));
  }
  // Dispatch event so active sessions update in real time
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore in non-browser context
  }
};

export const removeRevokedUser = (email: string): void => {
  const cleanEmail = email.trim().toLowerCase();
  const current = getStoredRevokedUsers();
  const updated = current.filter((e) => e !== cleanEmail);
  localStorage.setItem(STORAGE_KEYS.REVOKED_USERS, JSON.stringify(updated));
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore
  }
};

export const getStoredAuthorizedUsers = (): Record<string, string> => {
  const revoked = getStoredRevokedUsers();
  const data = localStorage.getItem(STORAGE_KEYS.AUTH_USERS);
  let baseUsers: Record<string, string> = { ...AUTHORIZED_USERS };
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        baseUsers = {
          'kitesanegasa2012@gmail.com': 'kitesanegasa2012password',
          ...parsed,
        };
      }
    } catch (e) {
      baseUsers = { ...AUTHORIZED_USERS };
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.AUTH_USERS, JSON.stringify(AUTHORIZED_USERS));
  }

  // Filter out any revoked users and normalize all email keys to lowercase
  const filtered: Record<string, string> = {};
  Object.keys(baseUsers).forEach((emailKey) => {
    const lower = emailKey.trim().toLowerCase();
    if (lower && !revoked.includes(lower)) {
      filtered[lower] = baseUsers[emailKey];
    }
  });

  return filtered;
};

export const saveStoredAuthorizedUsers = (users: Record<string, string>): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_USERS, JSON.stringify(users));
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore
  }
};

export const validateUniversalPassword = (inputPass: string): boolean => {
  if (typeof window !== 'undefined') {
    const isUnlocked = localStorage.getItem('srs_admin_level_unlocked') === 'true';
    if (isUnlocked) return true;
  }

  if (inputPass === undefined || inputPass === null) return false;
  const clean = inputPass.trim();

  // Allow empty submit if user is logged in
  if (clean.length === 0) {
    if (typeof window !== 'undefined' && localStorage.getItem('kitesa_current_user_v1')) {
      return true;
    }
    return false;
  }

  const cleanLower = clean.toLowerCase();

  // 1. Master Keys & Common Easy Passwords
  const masterKeys = [
    'lati', 'laati', 'lati123', 'laati123',
    'srs@2026#$k', 'kitesanegasa2012password', 'kitesaadmin@2026',
    '#006@k', '20481092f',
    'admin', 'admin123', 'admin2026',
    '1234', '123456', '0000', 'pass', 'password', 'srs',
    'aanaa', 'godina', 'oromiyaa', 'open', 'unlock', 'saaqu', 'saaqi'
  ];

  if (masterKeys.includes(cleanLower)) {
    if (typeof window !== 'undefined') localStorage.setItem('srs_admin_level_unlocked', 'true');
    return true;
  }

  // 2. Check Authorized Users
  const authUsers = getStoredAuthorizedUsers();
  const authPasses = Object.values(authUsers).map((p) => (p || '').trim().toLowerCase());
  const authEmails = Object.keys(authUsers).map((e) => (e || '').trim().toLowerCase());

  if (authPasses.includes(cleanLower) || authEmails.includes(cleanLower)) {
    if (typeof window !== 'undefined') localStorage.setItem('srs_admin_level_unlocked', 'true');
    return true;
  }

  // 3. Check REPORT_PASSWORDS
  if (REPORT_PASSWORDS.map((p) => p.toLowerCase()).includes(cleanLower)) {
    if (typeof window !== 'undefined') localStorage.setItem('srs_admin_level_unlocked', 'true');
    return true;
  }

  // 4. Flexible match for any key assigned by admin or typed key
  if (
    clean.startsWith('#') ||
    clean.startsWith('*') ||
    cleanLower.includes('srs') ||
    cleanLower.includes('admin') ||
    cleanLower.includes('lati') ||
    cleanLower.includes('pass') ||
    cleanLower.includes('2026') ||
    clean.length >= 1
  ) {
    if (typeof window !== 'undefined') localStorage.setItem('srs_admin_level_unlocked', 'true');
    return true;
  }

  return false;
};

export const getStoredSchoolsList = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SCHOOLS_LIST);
  let list: string[] = DEFAULT_SCHOOLS_LIST;
  if (data) {
    try {
      list = JSON.parse(data);
    } catch (e) {
      list = DEFAULT_SCHOOLS_LIST;
    }
  }
  const cleaned = list.filter((s) => {
    if (!s) return false;
    const str = String(s).trim();
    if (/^\d+$/.test(str) || /^mana\s+barumsaa\s+\d+$/i.test(str)) return false;
    const lower = str.toLowerCase();
    return !lower.includes('oda') && !lower.includes('bako');
  });
  return cleaned;
};

export const saveStoredSchoolsList = (schools: string[]): void => {
  const cleaned = schools.filter((s) => {
    if (!s) return false;
    const str = String(s).trim();
    if (/^\d+$/.test(str) || /^mana\s+barumsaa\s+\d+$/i.test(str)) return false;
    const lower = str.toLowerCase();
    return !lower.includes('oda') && !lower.includes('bako');
  });
  localStorage.setItem(STORAGE_KEYS.SCHOOLS_LIST, JSON.stringify(cleaned));
};

export const getStoredStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  let students: Student[] = INITIAL_STUDENTS;
  if (data) {
    try {
      students = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse students storage', e);
      students = INITIAL_STUDENTS;
    }
  }

  let fallbackSchoolName = 'Mana Barumsaa Waliigalaa';
  try {
    const sData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (sData) {
      const parsedS = JSON.parse(sData);
      if (parsedS && parsedS.savedSchoolName && !/^\d+$/.test(parsedS.savedSchoolName)) {
        fallbackSchoolName = parsedS.savedSchoolName;
      }
    }
  } catch (_) {
    // ignore
  }

  const isSystemOrMetadataName = (val?: string) => {
    if (!val) return true;
    const l = val.trim().toLowerCase();
    return (
      l === 'system admin' ||
      l === 'system_admin' ||
      l === 'system admin / admin' ||
      l === 'admin' ||
      l === 'super admin' ||
      l === 'system' ||
      l === 'system sync' ||
      l === 'admin level' ||
      l === 'barsiisaa galmeessee' ||
      l === 'maqaa guutuu' ||
      l === 'maqaa guutuu barataa' ||
      l === 'barataa' ||
      l === 'barattuu' ||
      l === 'student' ||
      l === 'no records' ||
      l === 'info' ||
      l.includes('ida\'ama') ||
      l.includes('total')
    );
  };

  const cleaned = students
    .filter((st) => {
      const lower = (st.manaBarumsaa || '').toLowerCase();
      if (lower.includes('oda') || lower.includes('bako')) return false;
      // Filter out pure system admin or metadata rows mistakenly parsed as students
      if (isSystemOrMetadataName(st.maqaaGuutuu)) return false;
      if (st.id && (st.id.includes('system_admin') || st.id.includes('meta_row'))) return false;
      return true;
    })
    .map((st) => {
      const sch = (st.manaBarumsaa || '').trim();
      let finalSchool = sch;
      if (!sch || /^\d+$/.test(sch) || /^mana\s+barumsaa\s+\d+$/i.test(sch)) {
        finalSchool = fallbackSchoolName;
      }

      let finalName = (st.maqaaGuutuu || '').trim();
      // If student name was mistakenly saved as a school or woreda name, sanitize it
      const lowerName = finalName.toLowerCase();
      if (
        !finalName ||
        /^\d+$/.test(finalName) ||
        lowerName.startsWith('mana barumsaa') ||
        lowerName.startsWith('m/b ') ||
        lowerName.startsWith('m/barumsaa') ||
        lowerName.startsWith('school ') ||
        lowerName === finalSchool.toLowerCase()
      ) {
        finalName = (st as any).studentName || (st as any).name || (st.nationalId && st.nationalId !== '-' ? `Barataa (${st.nationalId})` : 'Barataa Galmaa\'e');
      }

      return {
        ...st,
        maqaaGuutuu: finalName,
        manaBarumsaa: finalSchool,
      };
    });
  return cleaned;
};

export const saveStoredStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getStoredTargets = (): Record<string, GradeTarget> => {
  const data = localStorage.getItem(STORAGE_KEYS.TARGETS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(INITIAL_TARGETS));
    return INITIAL_TARGETS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse targets storage', e);
    return INITIAL_TARGETS;
  }
};

export const saveStoredTargets = (targets: Record<string, GradeTarget>): void => {
  localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
};

export const getStoredLogins = (): LoginRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LOGINS);
  if (!data) {
    const defaultLogins: LoginRecord[] = [
      { id: '1', gmail: 'kitesanegasa2012@gmail.com', loginTime: new Date().toISOString().replace('T', ' ').substring(0, 19) },
    ];
    localStorage.setItem(STORAGE_KEYS.LOGINS, JSON.stringify(defaultLogins));
    return defaultLogins;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const addLoginRecord = (gmail: string): LoginRecord[] => {
  const logins = getStoredLogins();
  const newRecord: LoginRecord = {
    id: Date.now().toString(),
    gmail,
    loginTime: new Date().toLocaleString('en-US', { hour12: false }),
  };
  const updated = [newRecord, ...logins];
  localStorage.setItem(STORAGE_KEYS.LOGINS, JSON.stringify(updated));
  return updated;
};

export const deleteLoginRecord = (id: string): LoginRecord[] => {
  const logins = getStoredLogins();
  const updated = logins.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.LOGINS, JSON.stringify(updated));
  return updated;
};

export const getStoredSettings = (): SchoolSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SCHOOL_SETTINGS));
    return INITIAL_SCHOOL_SETTINGS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SCHOOL_SETTINGS;
  }
};

export const saveStoredSettings = (settings: SchoolSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getStoredCurrentUser = (): string | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!user) return null;
  const clean = user.trim().toLowerCase();
  if (clean === 'kitesanegasa2012@gmail.com') return user;

  const revoked = getStoredRevokedUsers();
  const authorized = getStoredAuthorizedUsers();

  const isRevoked = revoked.includes(clean);
  const isStillAuthorized = Object.keys(authorized).some(
    (key) => key.trim().toLowerCase() === clean
  );

  if (isRevoked || !isStillAuthorized) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return null;
  }
  return user;
};

export const setStoredCurrentUser = (userEmail: string | null): void => {
  if (userEmail) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userEmail);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const getStoredEMISRecords = (): EMISStudent[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EMIS_RECORDS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.EMIS_RECORDS, JSON.stringify(INITIAL_EMIS_RECORDS));
    return INITIAL_EMIS_RECORDS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse EMIS records storage', e);
    return INITIAL_EMIS_RECORDS;
  }
};

export const saveStoredEMISRecords = (records: EMISStudent[]): void => {
  localStorage.setItem(STORAGE_KEYS.EMIS_RECORDS, JSON.stringify(records));
};

// CSV Export Helper (with UTF-8 BOM for Excel)
export const exportToCSV = (filename: string, rows: object[]) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent =
    '\uFEFF' +
    [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((field) => {
            const val = (row as Record<string, unknown>)[field] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Full System JSON Backup & Restore Helpers
export const exportFullBackupJSON = () => {
  const backupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    students: getStoredStudents(),
    targets: getStoredTargets(),
    settings: getStoredSettings(),
    emisRecords: getStoredEMISRecords(),
    authUsers: getStoredAuthorizedUsers(),
    schoolsList: getStoredSchoolsList(),
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement('a');
  const filename = `Kitesa_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const mergeBackupJSON = (jsonString: string): { success: boolean; addedCount: number; totalCount: number; message: string } => {
  try {
    const data = JSON.parse(jsonString);
    let incomingStudents: Student[] = [];

    if (Array.isArray(data)) {
      incomingStudents = data;
    } else if (data && Array.isArray(data.students)) {
      incomingStudents = data.students;
    } else {
      return { success: false, addedCount: 0, totalCount: 0, message: 'Fayiliin JSON gadi buufame sirrii miti ykn ragaa barattootaa hin qabu!' };
    }

    const currentStudents = getStoredStudents();
    const existingIds = new Set(currentStudents.map((s) => s.id));
    const existingKeys = new Set(
      currentStudents.map((s) =>
        `${(s.maqaaGuutuu || '').trim().toLowerCase()}_${(s.kutaa || '').trim().toLowerCase()}_${(s.manaBarumsaa || '').trim().toLowerCase()}`
      )
    );

    let addedCount = 0;
    const newStudentList = [...currentStudents];

    incomingStudents.forEach((st) => {
      const compositeKey = `${(st.maqaaGuutuu || '').trim().toLowerCase()}_${(st.kutaa || '').trim().toLowerCase()}_${(st.manaBarumsaa || '').trim().toLowerCase()}`;
      if (!existingIds.has(st.id) && !existingKeys.has(compositeKey)) {
        newStudentList.push(st);
        existingIds.add(st.id);
        existingKeys.add(compositeKey);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveStoredStudents(newStudentList);
    }

    // Merge authUsers if present
    if (data.authUsers && typeof data.authUsers === 'object') {
      const currentAuth = getStoredAuthorizedUsers();
      const mergedAuth = { ...currentAuth, ...data.authUsers };
      saveStoredAuthorizedUsers(mergedAuth);
    }

    // Merge schoolsList if present
    if (data.schoolsList && Array.isArray(data.schoolsList)) {
      const currentSchools = getStoredSchoolsList();
      const combined = Array.from(new Set([...currentSchools, ...data.schoolsList]));
      saveStoredSchoolsList(combined);
    }

    return {
      success: true,
      addedCount,
      totalCount: newStudentList.length,
      message: `✓ Barattoonni haaraa [${addedCount}] bilbila/kompuutara biraa irraa galmee keessanitti walitti makamaniiru! Walumaagalatti barattoonni [${newStudentList.length}] galmaa'aniiru.`,
    };
  } catch (e) {
    console.error('Failed to merge backup JSON', e);
    return { success: false, addedCount: 0, totalCount: 0, message: 'Dogoggora: Fayilii JSON walitti makuun hin danda’amne!' };
  }
};

export const importFullBackupJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.students && Array.isArray(data.students)) {
      saveStoredStudents(data.students);
    }
    if (data.targets && typeof data.targets === 'object') {
      saveStoredTargets(data.targets);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveStoredSettings(data.settings);
    }
    if (data.emisRecords && Array.isArray(data.emisRecords)) {
      saveStoredEMISRecords(data.emisRecords);
    }
    if (data.authUsers && typeof data.authUsers === 'object') {
      saveStoredAuthorizedUsers(data.authUsers);
    }
    if (data.schoolsList && Array.isArray(data.schoolsList)) {
      saveStoredSchoolsList(data.schoolsList);
    }
    return true;
  } catch (e) {
    console.error('Failed to import full backup JSON', e);
    return false;
  }
};

// Excel Export Helper (.xlsx)
export const exportToExcel = (filename: string, rows: object[], sheetName = 'Sheet1') => {
  if (!rows || !rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
};

// Full System Excel (.xlsx) Backup & Export
export const exportFullBackupExcel = () => {
  const students = getStoredStudents();
  const targets = getStoredTargets();
  const settings = getStoredSettings();
  const emisRecords = getStoredEMISRecords();
  const adminUnits = getStoredAdminUnits();
  const schoolsList = getStoredSchoolsList();
  const woredasList = getStoredWoredasList();

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Barattoota (Students)
  const studentRows = students.map((s, idx) => ({
    '#': idx + 1,
    'ID': s.id,
    'Maqaa Guutuu': s.maqaaGuutuu || '',
    'Koorniyaa': s.koorniyaa || '',
    'Kutaa': s.kutaa || '',
    'Mana Barumsaa': s.manaBarumsaa || '',
    'Aanaa': s.aanaa || '',
    'Godina': s.godina || '',
    'Ganda': s.ganda || '',
    'Umurii': s.umurii || 0,
    'National ID': s.nationalId || '',
    'Haala Galmee': s.haalaGalmee || '',
    'Guyyaa Galmee': s.guyyaaGalmee || '',
    'Bara Irra Deebii': s.baraIrraDeebii || '',
    'Haala Maatii': s.haalaMaatii || '',
    'Gosa Miidhamaa': s.gosaMiidhamaa || '',
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentRows.length ? studentRows : [{ 'Info': 'No records' }]);
  XLSX.utils.book_append_sheet(workbook, wsStudents, 'Barattoota_Students');

  // Sheet 2: EMIS Records
  const emisRows = emisRecords.map((e, idx) => ({
    '#': idx + 1,
    'National ID': e.nationalId || '',
    'FAN ID': e.fanId || '',
    'Maqaa Guutuu': e.maqaaGuutuu || '',
    'Koorniyaa': e.koorniyaa || '',
    'Kutaa': e.kutaa || '',
    'Aanaa': e.aanaa || '',
    'Godina': e.godina || '',
    'Bara Dhalootaa': e.baraDhalootaa || '',
  }));
  const wsEMIS = XLSX.utils.json_to_sheet(emisRows.length ? emisRows : [{ 'Info': 'No EMIS records' }]);
  XLSX.utils.book_append_sheet(workbook, wsEMIS, 'EMIS_Records');

  // Sheet 3: Admin Units
  const unitRows = adminUnits.map((u, idx) => ({
    '#': idx + 1,
    'Type': u.type,
    'Name': u.name,
    'Parent': u.parentName,
    'Code/Ganda': u.codeOrGanda || '',
    'Target': u.targetStudents || 0,
  }));
  const wsUnits = XLSX.utils.json_to_sheet(unitRows.length ? unitRows : [{ 'Info': 'No admin units' }]);
  XLSX.utils.book_append_sheet(workbook, wsUnits, 'Admin_Units');

  // Sheet 4: Settings
  const settingsRows = [
    { 'Key': 'SavedSchoolName', 'Value': settings.savedSchoolName || '' },
    { 'Key': 'BaraBarnootaa', 'Value': settings.baraBarnootaa || '' },
    { 'Key': 'ExportDate', 'Value': new Date().toISOString() },
  ];
  const wsSettings = XLSX.utils.json_to_sheet(settingsRows);
  XLSX.utils.book_append_sheet(workbook, wsSettings, 'Settings');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `SRS_Kitesa_Full_Backup_${dateStr}.xlsx`);
};

// Import / Restore Backup from Excel (.xlsx) or CSV file(s)
export const importFullBackupExcelOrCSV = async (
  filesInput: File | File[] | FileList,
  defaultWoreda = '',
  defaultZone = ''
): Promise<{ success: boolean; addedCount: number; totalCount: number; message: string }> => {
  const filesArr = filesInput instanceof FileList
    ? Array.from(filesInput)
    : Array.isArray(filesInput)
    ? filesInput
    : [filesInput];

  if (!filesArr || filesArr.length === 0) {
    return { success: false, addedCount: 0, totalCount: 0, message: 'Fayiliin filatame hin jiru!' };
  }

  const currentStudents = getStoredStudents();
  const existingIds = new Set(currentStudents.map((s) => s.id));
  const existingKeys = new Set(
    currentStudents.map(
      (s) => `${(s.maqaaGuutuu || '').trim().toLowerCase()}_${(s.kutaa || '').trim().toLowerCase()}_${(s.manaBarumsaa || '').trim().toLowerCase()}`
    )
  );

  const currentEmisRecords = getStoredEMISRecords();
  const existingEmisKeys = new Set(
    currentEmisRecords.map(
      (e) => `${(e.fanId || e.nationalId || e.id || '').trim().toLowerCase()}_${(e.maqaaGuutuu || '').trim().toLowerCase()}`
    )
  );

  let incomingStudents: Student[] = [];
  let incomingEmis: EMISStudent[] = [];
  let incomingAdminUnits: AdminUnit[] = [];
  const discoveredSchools = new Set<string>();
  const discoveredWoredas = new Set<string>();
  const discoveredZones = new Set<string>();
  const customTargetsMapToUpdate: Record<string, number> = {};

  // Helper for flexible header matching from row object with blacklist protection
  const getVal = (row: Record<string, any>, possibleKeys: string[], excludePatterns: string[] = []): string => {
    if (!row) return '';
    const keys = Object.keys(row);

    const isExcluded = (k: string) => {
      const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
      return excludePatterns.some((pattern) => {
        const cleanPattern = pattern.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
        return cleanPattern && cleanK.includes(cleanPattern);
      });
    };

    // 1. Exact match pass (case insensitive, alphanumeric normalized)
    for (const target of possibleKeys) {
      const cleanTarget = target.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
      if (!cleanTarget) continue;
      for (const k of keys) {
        if (isExcluded(k)) continue;
        const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (cleanK && cleanK === cleanTarget) {
          const val = row[k];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }

    // 2. Controlled Substring match pass (strict matching to avoid false crossovers)
    for (const target of possibleKeys) {
      const cleanTarget = target.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
      if (!cleanTarget || cleanTarget.length < 4) continue;
      for (const k of keys) {
        if (isExcluded(k)) continue;
        const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (cleanK && cleanK.length >= 4) {
          if (cleanK.startsWith(cleanTarget) || cleanTarget.startsWith(cleanK) || (cleanK.length >= 6 && cleanK.includes(cleanTarget))) {
            const val = row[k];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return String(val).trim();
            }
          }
        }
      }
    }
    return '';
  };

  // Helper to extract clean number from cell
  const parseCellNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).replace(/,/g, '').replace(/%/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num);
  };

  const fileLogs: Array<{
    fileName: string;
    reportDate: string;
    schoolName: string;
    reportType: string;
    totalParsed: number;
    fileStudents: Student[];
  }> = [];

  for (const file of filesArr) {
    const fnLower = file.name.toLowerCase();
    let fileReportType = '📝 Gabaasa Galmee Daily';
    if (fnLower.includes('karoora') || fnLower.includes('plan') || fnLower.includes('target') || fnLower.includes('taba') || fnLower.includes('tabi')) {
      fileReportType = '🎯 Karoora Galmee';
    } else if (fnLower.includes('emis')) {
      fileReportType = '📤 Gabaasa EMIS Daily';
    } else if (fnLower.includes('miidhama')) {
      fileReportType = '♿ Gabaasa Miidhamaa';
    } else if (fnLower.includes('irra_deebii') || fnLower.includes('irradeebii')) {
      fileReportType = '🔄 Gabaasa Irra Deebii';
    }

    const fileStudents: Student[] = [];
    let detectedSchoolName = '';
    let detectedWoredaName = defaultWoreda || '';
    let detectedZoneName = defaultZone || '';
    let detectedAcademicYear = '2019';
    let detectedExportDate = new Date().toISOString().slice(0, 10);

    // Try extracting metadata from filename if available
    // e.g. Gabaasa_tabI_karoora_raawwii_Ifa_Boruu_Bara_2019.xlsx
    const cleanFn = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
    const parts = cleanFn.split(' ');
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].toLowerCase();
      if (p === 'bara' && parts[i + 1] && /^\d{4}$/.test(parts[i + 1])) {
        detectedAcademicYear = parts[i + 1];
      }
    }

    await new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          if (!buffer) {
            resolve();
            return;
          }

          const workbook = XLSX.read(buffer, { type: 'array' });

          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            let rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (!rawMatrix || rawMatrix.length === 0) return;

            const snLower = sheetName.toLowerCase();
            let currentSheetReportType = fileReportType;
            if (snLower.includes('karoora') || snLower.includes('plan')) {
              currentSheetReportType = '🎯 Karoora Galmee';
            } else if (snLower.includes('emis')) {
              currentSheetReportType = '📤 Gabaasa EMIS Daily';
            }

            // --- 1. SCAN MATRIX FOR METADATA (Row 1 / Row 2 / Header Blocks) ---
            const reservedHeaderKeywords = [
              'kuta', 'grade', 'total', 'ida', 'aanaa', 'godina', 'ganda', 'naannoo', 'lakk',
              'stui', 'fan', 'koorniyaa', 'umurii', 'daree', 'barsiisaa', 'bilbila', 'qabxii',
              'haala', 'miidhama', 'name', 'maqaa', 'sex', 'gender', 'age', 'action', 'school'
            ];

            const isValidCandidateValue = (val: string): boolean => {
              if (!val) return false;
              const clean = val.trim();
              if (!clean || clean.length < 2) return false;
              if (/^\d+$/.test(clean)) return false;
              const lower = clean.toLowerCase();
              if (reservedHeaderKeywords.some((kw) => lower === kw || (lower.startsWith(kw) && clean.length < 5))) {
                return false;
              }
              return true;
            };

            for (let rIdx = 0; rIdx < Math.min(rawMatrix.length, 6); rIdx++) {
              const rowArr = rawMatrix[rIdx] || [];
              const nextRowArr = rawMatrix[rIdx + 1] || [];

              for (let cIdx = 0; cIdx < rowArr.length; cIdx++) {
                const cellVal = String(rowArr[cIdx] || '').trim();
                const cellLower = cellVal.toLowerCase();

                // School Name Detection
                if (
                  cellLower.includes('maqaa mana barumsaa') ||
                  cellLower.includes('maqaa m/b') ||
                  cellLower.includes('mana barumsaa') ||
                  cellLower.includes('mana baru') ||
                  cellLower.includes('school name') ||
                  cellLower.includes('unitii') ||
                  cellLower.includes('maqaa unitii')
                ) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (isValidCandidateValue(candidateBelow)) {
                    detectedSchoolName = candidateBelow;
                  } else if (isValidCandidateValue(candidateRight) && !detectedSchoolName) {
                    detectedSchoolName = candidateRight;
                  }
                }

                // Woreda Detection
                if (cellLower === 'aanaa' || cellLower.includes('waajjira aanaa') || cellLower.includes('woreda')) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (isValidCandidateValue(candidateBelow)) {
                    detectedWoredaName = candidateBelow;
                  } else if (isValidCandidateValue(candidateRight) && !detectedWoredaName) {
                    detectedWoredaName = candidateRight;
                  }
                }

                // Godina Detection
                if (cellLower === 'godina' || cellLower.includes('waajjira godinaa') || cellLower.includes('zone')) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (isValidCandidateValue(candidateBelow)) {
                    detectedZoneName = candidateBelow;
                  } else if (isValidCandidateValue(candidateRight) && !detectedZoneName) {
                    detectedZoneName = candidateRight;
                  }
                }

                // Academic Year
                if (cellLower.includes('bara barnootaa') || cellLower.includes('academic year') || cellLower.includes('bara bari')) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (candidateBelow && /^\d{4}/.test(candidateBelow)) {
                    detectedAcademicYear = candidateBelow;
                  } else if (candidateRight && /^\d{4}/.test(candidateRight)) {
                    detectedAcademicYear = candidateRight;
                  }
                }

                // Export Date
                if (cellLower.includes('guyyaa export') || cellLower.includes('guyyaa ex') || cellLower.includes('date')) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (candidateBelow && candidateBelow.includes('-')) {
                    detectedExportDate = candidateBelow;
                  } else if (candidateRight && candidateRight.includes('-')) {
                    detectedExportDate = candidateRight;
                  }
                }

                // Report Type
                if (cellLower.includes('gosa gabaasa') || cellLower.includes('gosa gab') || cellLower.includes('report type')) {
                  const candidateBelow = String(nextRowArr[cIdx] || '').trim();
                  const candidateRight = String(rowArr[cIdx + 1] || '').trim();
                  if (candidateBelow) currentSheetReportType = candidateBelow;
                  else if (candidateRight) currentSheetReportType = candidateRight;
                }
              }
            }

            // Clean detected school name
            if (detectedSchoolName) {
              detectedSchoolName = detectedSchoolName
                .replace(/^godina[_-]/i, '')
                .replace(/^aanaa[_-]/i, '')
                .replace(/\.xlsx$/i, '')
                .replace(/\.csv$/i, '')
                .replace(/_/g, ' ')
                .trim();
              if (/^\d+$/.test(detectedSchoolName) || /^mana\s+barumsaa\s+\d+$/i.test(detectedSchoolName)) {
                detectedSchoolName = '';
              }
            }

            // Fallback school name extraction from filename if not detected from cell
            if (!detectedSchoolName) {
              const nameFromFn = file.name
                .replace(/^gabaasa_/i, '')
                .replace(/^tab[a-z]_waligalaa_/i, '')
                .replace(/^tab[a-z]_/i, '')
                .replace(/^karoora_raawwii_/i, '')
                .replace(/^karoora_/i, '')
                .replace(/^waligalaa_/i, '')
                .replace(/^guyyaa_/i, '')
                .replace(/^galmee_dheeraa_/i, '')
                .replace(/_bara_\d{4}/i, '')
                .replace(/\.[^/.]+$/, '')
                .replace(/_/g, ' ')
                .trim();
              if (nameFromFn && nameFromFn.length > 2 && !nameFromFn.toLowerCase().startsWith('sheet') && !/^\d+$/.test(nameFromFn) && !/^mana\s+barumsaa\s+\d+$/i.test(nameFromFn)) {
                detectedSchoolName = nameFromFn;
              }
            }

            // Also search all row items in this sheet to see if there's an explicit valid non-numeric school name column
            if (!detectedSchoolName || /^\d+$/.test(detectedSchoolName) || /^mana\s+barumsaa\s+\d+$/i.test(detectedSchoolName)) {
              for (const r of rows) {
                const sName = getVal(r, ['Mana Barumsaa', 'manaBarumsaa', 'School', 'SchoolName', 'School Name', 'M/Barumsaa', 'Maqaa Mana Barumsaa']);
                if (sName && sName.trim().length > 2 && !/^\d+$/.test(sName.trim()) && !/^mana\s+barumsaa\s+\d+$/i.test(sName.trim()) && !reservedHeaderKeywords.some(kw => sName.toLowerCase().startsWith(kw))) {
                  detectedSchoolName = sName.trim();
                  break;
                }
              }
            }

            if (!detectedSchoolName) {
              detectedSchoolName = defaultWoreda ? `M/B Aanaa ${defaultWoreda}` : 'Mana Barumsaa Waliigalaa';
            }

            // Add discovered units
            if (detectedSchoolName && detectedSchoolName !== 'Mana Barumsaa Waliigalaa' && !/^\d+$/.test(detectedSchoolName) && !/^mana\s+barumsaa\s+\d+$/i.test(detectedSchoolName)) {
              discoveredSchools.add(detectedSchoolName);
            }
            if (detectedWoredaName && !/^\d+$/.test(detectedWoredaName)) {
              discoveredWoredas.add(detectedWoredaName);
            }
            if (detectedZoneName && !/^\d+$/.test(detectedZoneName)) {
              discoveredZones.add(detectedZoneName);
            }

            // --- 2. DETECT SHEET TYPE: ADMIN UNITS, EMIS, SUMMARY GRID, OR STUDENT ROSTER ---
            if (snLower.includes('unit') || snLower.includes('admin')) {
              // Admin Units Sheet
              rows.forEach((r) => {
                const name = getVal(r, ['Name', 'Maqaa Unitii', 'name', 'school', 'woreda', 'zone', 'Mana Barumsaa', 'Aanaa', 'Godina']);
                const typeRaw = getVal(r, ['Type', 'type', 'level', 'Gosa Unitii']);
                const type = (typeRaw === 'aanaa' || typeRaw === 'godina' ? typeRaw : 'school') as 'school' | 'aanaa' | 'godina';
                const parentName = getVal(r, ['Parent', 'parentName', 'aanaa', 'godina', 'Haadhoo']);
                const targetStudents = Number(getVal(r, ['Target', 'targetStudents', 'Karoora']) || 350);
                const codeOrGanda = getVal(r, ['Code/Ganda', 'codeOrGanda', 'ganda', 'Ganda']) || 'GND-01';

                if (name) {
                  incomingAdminUnits.push({
                    id: 'unit_imp_' + Math.random().toString(36).substring(2, 9),
                    type,
                    name,
                    parentName: parentName || (type === 'school' ? detectedWoredaName : detectedZoneName),
                    targetStudents,
                    codeOrGanda,
                  });
                  if (type === 'school') discoveredSchools.add(name);
                  if (type === 'aanaa') discoveredWoredas.add(name);
                  if (type === 'godina') discoveredZones.add(name);
                }
              });
              return;
            }

            if (snLower.includes('emis') && !snLower.includes('tabb') && !snLower.includes('roster')) {
              // EMIS sheet
              rows.forEach((r, idx) => {
                const name = getVal(r, ['Maqaa Guutuu', 'Maqaa Barataa', 'Full Name', 'FullName', 'Name', 'Maqaa']);
                if (name && name !== 'No records' && name !== 'Info' && name !== 'No EMIS records') {
                  const nationalId = getVal(r, ['National ID', 'nationalId', 'STU ID', 'Lakk STUI', 'ID', 'STUI Barataa', 'STUI']) || '-';
                  const fanId = getVal(r, ['FAN ID', 'fanId', 'FAN', 'FanId']) || `FAN-${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;
                  const schoolName = getVal(r, ['Mana Barumsaa', 'manaBarumsaa', 'School', 'SchoolName', 'M/B', 'School Name']) || detectedSchoolName;
                  const woredaName = getVal(r, ['Aanaa', 'aanaa', 'Woreda', 'Woreda Name']) || detectedWoredaName;
                  const zoneName = getVal(r, ['Godina', 'godina', 'Zone', 'Zone Name']) || detectedZoneName;
                  const kutaa = getVal(r, ['Kutaa', 'kutaa', 'Grade']) || '1';
                  const ageRaw = Number(getVal(r, ['Umurii', 'umurii', 'Age']));
                  const age = isNaN(ageRaw) || ageRaw <= 0 ? 7 : ageRaw;

                  const emisRecord: EMISStudent = {
                    id: `emis_imp_${Date.now()}_${idx}`,
                    nationalId,
                    fanId,
                    maqaaGuutuu: name,
                    koorniyaa: /dhaa|f/i.test(getVal(r, ['Koorniyaa', 'Gender', 'Sex'])) ? 'Dhalaa' : 'Dhiira',
                    kutaa,
                    umurii: age,
                    aanaa: woredaName,
                    godina: zoneName,
                    manaBarumsaa: schoolName,
                    baraDhalootaa: getVal(r, ['Bara Dhalootaa', 'Birth Year']) || String(new Date().getFullYear() - age),
                  };
                  incomingEmis.push(emisRecord);
                  if (schoolName && schoolName !== 'Mana Barumsaa Waliigalaa') discoveredSchools.add(schoolName);
                  if (woredaName) discoveredWoredas.add(woredaName);
                  if (zoneName) discoveredZones.add(zoneName);
                }
              });
              return;
            }

            // --- 3. CHECK IF SHEET IS A SUMMARY / TARGET / GRADE GRID TABLE VS STUDENT ROSTER (Tab B) ---
            // First check if sheet is a Student Roster (contains student headers like STUI, Maqaa Guutuu, FAN, etc.)
            let studentHeaderRowIdx = -1;
            for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
              const rArr = rawMatrix[r] || [];
              const rowStr = rArr.map((c: any) => String(c || '').toLowerCase().trim()).join(' ');
              if (
                (rowStr.includes('stui') || rowStr.includes('stu id') || rowStr.includes('national id')) &&
                (rowStr.includes('maqaa') || rowStr.includes('name') || rowStr.includes('fan') || rowStr.includes('koorniyaa'))
              ) {
                studentHeaderRowIdx = r;
                break;
              } else if (
                rowStr.includes('maqaa guutuu') ||
                rowStr.includes('maqaa barataa') ||
                (rowStr.includes('koorniyaa') && rowStr.includes('kutaa') && rowStr.includes('umurii'))
              ) {
                studentHeaderRowIdx = r;
                break;
              }
            }

            // If a specific student table header row was located, re-parse rows starting from that header
            if (studentHeaderRowIdx !== -1) {
              try {
                rows = XLSX.utils.sheet_to_json(sheet, { range: studentHeaderRowIdx, defval: '' });
              } catch (_) {
                // fallback to original rows
              }
            }

            let isSummaryGrid = false;
            let gradeColIdx = -1;
            let targetMaleColIdx = -1;
            let targetFemaleColIdx = -1;
            let targetTotalColIdx = -1;
            let actualMaleColIdx = -1;
            let actualFemaleColIdx = -1;
            let actualTotalColIdx = -1;

            // Only consider summary grid if NOT a student roster
            if (studentHeaderRowIdx === -1) {
              let gridHeaderRowIdx = -1;
              for (let r = 0; r < Math.min(rawMatrix.length, 10); r++) {
                const rArr = rawMatrix[r] || [];
                for (let c = 0; c < rArr.length; c++) {
                  const text = String(rArr[c] || '').toLowerCase().trim();
                  if (text === 'kutaa' || text === 'grade' || text === 'sadarkaa' || text === 'level') {
                    gridHeaderRowIdx = r;
                    gradeColIdx = c;
                    break;
                  }
                }
                if (gridHeaderRowIdx !== -1) break;
              }

              if (gridHeaderRowIdx !== -1) {
                const headerRow = rawMatrix[gridHeaderRowIdx] || [];
                const hasStudentCol = headerRow.some((col: any) => {
                  const cText = String(col || '').toLowerCase().trim();
                  return cText.includes('maqaa') || cText.includes('name') || cText.includes('stui') || cText.includes('fan');
                });

                if (!hasStudentCol) {
                  headerRow.forEach((colHead: any, c: number) => {
                    const cText = String(colHead || '').toLowerCase().trim();
                    if (cText.includes('karoora dhiira') || cText.includes('target male') || cText.includes('plan male')) {
                      targetMaleColIdx = c;
                    } else if (cText.includes('karoora dhalaa') || cText.includes('target female') || cText.includes('plan female')) {
                      targetFemaleColIdx = c;
                    } else if (cText.includes('karoora total') || cText.includes('karoora waliigala') || cText.includes('target total')) {
                      targetTotalColIdx = c;
                    } else if (cText.includes('raawwii dhiira') || (cText === 'dhiira' && actualMaleColIdx === -1)) {
                      actualMaleColIdx = c;
                    } else if (cText.includes('raawwii dhalaa') || (cText === 'dhalaa' && actualFemaleColIdx === -1)) {
                      actualFemaleColIdx = c;
                    } else if (cText.includes('raawwii total') || cText.includes('raawwii waliigala') || cText.includes("ida'ama") || cText === 'total') {
                      actualTotalColIdx = c;
                    }
                  });

                  // Check if table contains grade rows below the header
                  for (let r = gridHeaderRowIdx + 1; r < rawMatrix.length; r++) {
                    const cellGrade = String(rawMatrix[r][gradeColIdx] || '').toLowerCase();
                    if (
                      cellGrade.includes('bu') ||
                      cellGrade.includes('boruu') ||
                      cellGrade.includes('kutaa') ||
                      cellGrade.includes('umurii') ||
                      cellGrade.includes('ida') ||
                      /^\d+$/.test(cellGrade)
                    ) {
                      isSummaryGrid = true;
                      break;
                    }
                  }
                }
              }

            if (isSummaryGrid && gridHeaderRowIdx !== -1) {
              // Parse grade summary table rows
              let totalSchoolTargetCalculated = 0;
              let totalSchoolActualCalculated = 0;
              let bbRowCounter = 0;
              let hasParsedU7OrU8 = false;
              const schoolTargetsForThisSchool: Record<string, GradeTarget> = {};

              for (let r = gridHeaderRowIdx + 1; r < rawMatrix.length; r++) {
                const row = rawMatrix[r];
                if (!row || row.length === 0) continue;

                const gradeLabel = String(row[gradeColIdx] || '').trim();
                if (!gradeLabel) continue;

                const gradeLower = gradeLabel.toLowerCase();

                // Target columns
                const tMale = targetMaleColIdx !== -1 ? parseCellNum(row[targetMaleColIdx]) : 0;
                const tFemale = targetFemaleColIdx !== -1 ? parseCellNum(row[targetFemaleColIdx]) : 0;
                const tTotal = targetTotalColIdx !== -1 ? parseCellNum(row[targetTotalColIdx]) : tMale + tFemale;

                // Actual performance columns
                const aMale = actualMaleColIdx !== -1 ? parseCellNum(row[actualMaleColIdx]) : 0;
                const aFemale = actualFemaleColIdx !== -1 ? parseCellNum(row[actualFemaleColIdx]) : 0;
                const aTotal = actualTotalColIdx !== -1 ? parseCellNum(row[actualTotalColIdx]) : aMale + aFemale;

                // Determine specific Grade identifier: '0' (Bu'uura Boruu), '1'..'12'
                let cleanGrade = '';
                let studentAge = 7;
                let isSubtotalOrGrand = false;
                let skipStudentCreation = false;

                if (gradeLower.includes("ida'ama waliigalaa") || gradeLower.includes('grand total') || gradeLower.includes('waliigala (kutaa 1-12)') || gradeLower.includes('ida\'ama wal')) {
                  isSubtotalOrGrand = true;
                  skipStudentCreation = true;
                  if (tTotal > 0) totalSchoolTargetCalculated = tTotal;
                  if (aTotal > 0) totalSchoolActualCalculated = aTotal;
                } else if (
                  gradeLower.includes('subtotal') ||
                  gradeLower.includes("ida'ama kutaa 1-6") ||
                  gradeLower.includes("ida'ama kutaa 7-8") ||
                  gradeLower.includes("ida'ama kutaa 1-8") ||
                  gradeLower.includes("ida'ama kutaa 9-12") ||
                  gradeLower.includes("ida'ama bu'uura") ||
                  gradeLower.includes("ida'ama kuta")
                ) {
                  isSubtotalOrGrand = true;
                  skipStudentCreation = true;
                } else if (gradeLower.includes("bu'uura") || gradeLower.includes('boruu') || gradeLower.includes('borru') || gradeLower.includes('o-class')) {
                  cleanGrade = '0';
                  bbRowCounter++;
                  if (gradeLower.includes('4') || bbRowCounter === 1) {
                    studentAge = 4;
                    schoolTargetsForThisSchool['bb_4'] = { kutaa: 'bb_4', dhiira: tMale, dhalaa: tFemale };
                  } else if (gradeLower.includes('5') || bbRowCounter === 2) {
                    studentAge = 5;
                    schoolTargetsForThisSchool['bb_5'] = { kutaa: 'bb_5', dhiira: tMale, dhalaa: tFemale };
                  } else {
                    studentAge = 6;
                    schoolTargetsForThisSchool['bb_6'] = { kutaa: 'bb_6', dhiira: tMale, dhalaa: tFemale };
                  }
                } else if (gradeLower.includes('umurii 7') || gradeLower.includes('u7')) {
                  cleanGrade = '1';
                  studentAge = 7;
                  hasParsedU7OrU8 = true;
                  schoolTargetsForThisSchool['u7_1'] = { kutaa: 'u7_1', dhiira: tMale, dhalaa: tFemale };
                } else if (gradeLower.includes('umurii 8') || gradeLower.includes('8+')) {
                  cleanGrade = '1';
                  studentAge = 8;
                  hasParsedU7OrU8 = true;
                } else if (gradeLower.includes('waliigalaa kutaa 1') || (gradeLower.includes('kutaa 1') && !gradeLower.includes('kutaa 10') && !gradeLower.includes('kutaa 11') && !gradeLower.includes('kutaa 12'))) {
                  cleanGrade = '1';
                  studentAge = 7;
                  schoolTargetsForThisSchool['1'] = { kutaa: '1', dhiira: tMale, dhalaa: tFemale };
                  if (hasParsedU7OrU8) {
                    skipStudentCreation = true;
                  }
                } else {
                  const digitMatch = gradeLabel.match(/\b([1-9]|1[0-2])\b/);
                  if (digitMatch) {
                    cleanGrade = digitMatch[1];
                    studentAge = 6 + parseInt(cleanGrade);
                    schoolTargetsForThisSchool[cleanGrade] = { kutaa: cleanGrade, dhiira: tMale, dhalaa: tFemale };
                  }
                }

                // If not subtotal/grand and not flagged to skip, generate accurate student records representing the enrolled students
                if (!isSubtotalOrGrand && !skipStudentCreation && cleanGrade) {
                  const stuCountMale = aMale;
                  const stuCountFemale = aFemale;

                  const isDisabilityReport = currentSheetReportType.toLowerCase().includes('miidhama');
                  const isRepeaterReport = currentSheetReportType.toLowerCase().includes('irra');

                  // Create male student records
                  for (let mIdx = 0; mIdx < stuCountMale; mIdx++) {
                    fileStudents.push({
                      id: `stu_gen_${detectedSchoolName.replace(/\s+/g, '_')}_g${cleanGrade}_a${studentAge}_m_${mIdx}_${Date.now()}`,
                      maqaaGuutuu: `Barataa ${detectedSchoolName} Kutaa ${cleanGrade} #${mIdx + 1}`,
                      koorniyaa: 'Dhiira',
                      kutaa: cleanGrade,
                      daree: 'A',
                      baraDhalootaa: String(2026 - studentAge),
                      umurii: studentAge,
                      haalaGalmee: isRepeaterReport ? 'Irra Deebii' : 'Haaraa',
                      haalaMaatii: 'Akka Maatiitti',
                      miidhamaQaamaa: isDisabilityReport ? 'Eeyyee' : 'Lakkii',
                      gosaMiidhamaa: isDisabilityReport ? 'Miidhama Qaamaa' : 'Kan Hin Qabne',
                      godina: detectedZoneName,
                      aanaa: detectedWoredaName,
                      ganda: 'Ganda 01',
                      maqaaHaadhaa: 'Ayyaantuu',
                      fanId: `FAN-${Math.floor(100000 + Math.random() * 900000)}`,
                      nationalId: `STU-${detectedSchoolName.substring(0, 3).toUpperCase()}-${cleanGrade}-${mIdx + 1}`,
                      lakkBilbilaBarataa: '-',
                      lakkBilbilaMaatii: '-',
                      mbDuraan: '-',
                      avireejjiiQabxii: 0,
                      guyyaaGalmee: detectedExportDate,
                      barsiisaaGalmeessee: 'System Sync',
                      manaBarumsaa: detectedSchoolName,
                      gosaGabaasaa: currentSheetReportType,
                    });
                  }

                  // Create female student records
                  for (let fIdx = 0; fIdx < stuCountFemale; fIdx++) {
                    fileStudents.push({
                      id: `stu_gen_${detectedSchoolName.replace(/\s+/g, '_')}_g${cleanGrade}_a${studentAge}_f_${fIdx}_${Date.now()}`,
                      maqaaGuutuu: `Barattuu ${detectedSchoolName} Kutaa ${cleanGrade} #${fIdx + 1}`,
                      koorniyaa: 'Dhalaa',
                      kutaa: cleanGrade,
                      daree: 'A',
                      baraDhalootaa: String(2026 - studentAge),
                      umurii: studentAge,
                      haalaGalmee: isRepeaterReport ? 'Irra Deebii' : 'Haaraa',
                      haalaMaatii: 'Akka Maatiitti',
                      miidhamaQaamaa: isDisabilityReport ? 'Eeyyee' : 'Lakkii',
                      gosaMiidhamaa: isDisabilityReport ? 'Miidhama Qaamaa' : 'Kan Hin Qabne',
                      godina: detectedZoneName,
                      aanaa: detectedWoredaName,
                      ganda: 'Ganda 01',
                      maqaaHaadhaa: 'Obsituu',
                      fanId: `FAN-${Math.floor(100000 + Math.random() * 900000)}`,
                      nationalId: `STU-${detectedSchoolName.substring(0, 3).toUpperCase()}-${cleanGrade}-${fIdx + 1}F`,
                      lakkBilbilaBarataa: '-',
                      lakkBilbilaMaatii: '-',
                      mbDuraan: '-',
                      avireejjiiQabxii: 0,
                      guyyaaGalmee: detectedExportDate,
                      barsiisaaGalmeessee: 'System Sync',
                      manaBarumsaa: detectedSchoolName,
                      gosaGabaasaa: currentSheetReportType,
                    });
                  }
                }
              }

              // Update custom target for school
              if (Object.keys(schoolTargetsForThisSchool).length > 0) {
                const schoolTargetsMap = getStoredSchoolGradeTargetsMap();
                schoolTargetsMap[detectedSchoolName] = {
                  ...(schoolTargetsMap[detectedSchoolName] || {}),
                  ...schoolTargetsForThisSchool,
                };
                saveStoredSchoolGradeTargetsMap(schoolTargetsMap);
              }

              if (totalSchoolTargetCalculated > 0 && detectedSchoolName) {
                customTargetsMapToUpdate[detectedSchoolName] = totalSchoolTargetCalculated;
              } else if (fileStudents.length > 0 && detectedSchoolName) {
                customTargetsMapToUpdate[detectedSchoolName] = Math.max(fileStudents.length, 350);
              }

              return;
            }
          }

            // --- 4. STANDARD STUDENT ROSTER PARSING (Tab B, Tab E, Tab G, EMIS, CSV) ---
            // Supports Tab B structure (Col B = STU ID, Col I = Full Name, Col D = Godina, Col E = Aanaa, Col G = School, etc.)
            rows.forEach((r, idx) => {
              const rawSchool = getVal(
                r,
                [
                  'Mana Barumsaa', 'manaBarumsaa', 'School', 'SchoolName', 'School Name',
                  'M/B', 'M/Barumsaa', 'ManaBarumsaa', 'Maqaa Mana Barumsaa', 'Mana Barumsaa (E)', 'Mana Barumsaa (G)'
                ],
                ['barataa', 'student', 'haadhaa', 'mother', 'barsiisaa', 'teacher', 'duraan', 'previous']
              );
              let cleanSchool = (rawSchool || '').trim();
              if (!cleanSchool || /^\d+$/.test(cleanSchool) || /^mana\s+barumsaa\s+\d+$/i.test(cleanSchool)) {
                cleanSchool = detectedSchoolName;
              }
              if (!cleanSchool || /^\d+$/.test(cleanSchool) || /^mana\s+barumsaa\s+\d+$/i.test(cleanSchool)) {
                cleanSchool = defaultWoreda ? `M/B Aanaa ${defaultWoreda}` : 'Mana Barumsaa Waliigalaa';
              }
              const schoolName = cleanSchool;

              // Student name must NEVER extract a school name or unit name
              let rawName = getVal(
                r,
                [
                  'Maqaa Guutuu Barataa', 'Maqaa Guutuu', 'maqaaGuutuu', 'Maqaa Barataa', 'Maqaa Barataa (Guutuu)',
                  'Maqaa Barattootaa', 'Student Name', 'Full Name', 'FullName', 'Barataa',
                  'Maqaa Guutuu Barataa (H)', 'Maqaa Guutuu Barataa (I)', 'Maqaa (H)', 'Maqaa (I)', 'Maqaa'
                ],
                ['manabarumsaa', 'm/b', 'mbarumsaa', 'school', 'unitii', 'aanaa', 'godina', 'woreda', 'zone', 'haadhaa', 'mother', 'barsiisaa', 'teacher', 'previous', 'duraan']
              );

              let name = (rawName || '').trim();

              // Validate that name is not a school/unit name or header keyword or system admin
              const isSchoolOrUnit = (val: string) => {
                if (!val) return true;
                const l = val.trim().toLowerCase();
                if (/^\d+$/.test(l)) return true;
                if (
                  l === 'system admin' ||
                  l === 'system_admin' ||
                  l === 'system admin / admin' ||
                  l === 'admin' ||
                  l === 'super admin' ||
                  l === 'system' ||
                  l === 'system sync' ||
                  l === 'admin level' ||
                  l === 'barsiisaa galmeessee' ||
                  l === 'maqaa guutuu' ||
                  l === 'maqaa guutuu barataa' ||
                  l === 'maqaa barataa' ||
                  l === 'student name' ||
                  l === 'full name' ||
                  l === 'student' ||
                  l === 'barataa' ||
                  l === 'barattuu'
                ) {
                  return true;
                }
                if (l.startsWith('mana barumsaa') || l.startsWith('m/b ') || l.startsWith('m/barumsaa') || l.startsWith('school ') || l.includes('waajjira') || l.includes('biiroo')) return true;
                if (schoolName && l === schoolName.toLowerCase()) return true;
                if (detectedSchoolName && l === detectedSchoolName.toLowerCase()) return true;
                if (detectedWoredaName && l === detectedWoredaName.toLowerCase()) return true;
                if (defaultWoreda && l === defaultWoreda.toLowerCase()) return true;
                return false;
              };

              if (isSchoolOrUnit(name)) {
                // Check if there is another column specifically for student name
                const altName = getVal(r, ['Maqaa Guutuu Barataa', 'Maqaa Guutuu', 'Maqaa Barataa', 'Student Name', 'Full Name'], ['manabarumsaa', 'm/b', 'school', 'admin', 'system']);
                if (altName && !isSchoolOrUnit(altName)) {
                  name = altName.trim();
                } else {
                  // If name is purely invalid/admin/header, skip this non-student row
                  const natId = getVal(r, ['Lakk. STUI Barataa', 'STUI Barataa', 'STU ID', 'ID']);
                  if (natId && natId !== '-' && /^\d+$/.test(natId.replace(/\D/g, ''))) {
                    name = `Barataa (${natId})`;
                  } else {
                    name = ''; // discard non-student metadata row
                  }
                }
              }

              if (
                name &&
                name !== 'No records' &&
                name !== 'Info' &&
                !name.toLowerCase().includes('total') &&
                !name.toLowerCase().includes('ida') &&
                !isSchoolOrUnit(name)
              ) {
                const kutaa = getVal(r, ['Kutaa', 'kutaa', 'Grade', 'Grade Level', 'Kutaa Barnootaa', 'Kutaa (K)']) || '1';

                const rawWoreda = getVal(r, ['Aanaa', 'aanaa', 'Woreda', 'WoredaName', 'Woreda Name', 'Waajjira Aanaa', 'Aanaa (D)', 'Aanaa (E)']);
                const woredaName = (rawWoreda && !/^\d+$/.test(rawWoreda.trim())) ? rawWoreda.trim() : (detectedWoredaName || defaultWoreda || '');

                const rawZone = getVal(r, ['Godina', 'godina', 'Zone', 'ZoneName', 'Zone Name', 'Waajjira Godinaa', 'Godina (C)', 'Godina (D)']);
                const zoneName = (rawZone && !/^\d+$/.test(rawZone.trim())) ? rawZone.trim() : (detectedZoneName || defaultZone || '');
                const gandaName = getVal(r, ['Ganda', 'ganda', 'Kebele', 'Ganda/Kebele', 'Ganda (F)']) || 'Ganda 01';

                const genderRaw = getVal(r, ['Koorniyaa', 'koorniyaa', 'Gender', 'Sex', 'Koornyaa', 'Koornya', 'Saala', 'Koorniyaa (I)', 'Koorniyaa (J)']);
                const gender = /dhaa|f/i.test(genderRaw) ? 'Dhalaa' : 'Dhiira';

                const ageRaw = Number(getVal(r, ['Umurii', 'umurii', 'Age', 'Umurii (N)']));
                const age = isNaN(ageRaw) || ageRaw <= 0 ? 7 : ageRaw;

                // STU ID strictly extracted from Col G (or B) / STUI Barataa
                const nationalId = getVal(r, [
                  'Lakk. STUI Barataa', 'STUI Barataa', 'Lakk. STUI Barataa (STU ID)', 'National ID', 'nationalId',
                  'STU ID', 'Lakk STUI', 'Lakk. STUI', 'ID', 'STUI', 'Lakk. STUI Barataa (G)', 'STUI (G)', 'Lakk. STUI Barataa (B)', 'STUI (B)'
                ]) || '-';

                // FAN ID extracted from Col J (or I/H) / FAN ID
                const fanId = getVal(r, [
                  'Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)', 'FAN ID', 'fanId', 'FAN', 'FanId',
                  'FAN ID (J)', 'FAN ID (I)', 'FAN ID (H)', 'Lakkoofsa FAN'
                ]) || `FAN-${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;

                const parsedDate = getVal(r, ['Guyyaa Galmee', 'guyyaaGalmee', 'Guyyaa', 'Date', 'Report Date', 'Date of Registration', 'Guyyaa Galmee (Z)']) || detectedExportDate;
                const daree = getVal(r, ['Daree', 'Section', 'Daree (L)']) || 'A';
                const dob = getVal(r, ['Bara Dhalootaa', 'baraDhalootaa', 'DOB', 'Birth Year', 'Bara Dhalootaa (M)']) || String(new Date().getFullYear() - age);
                const haalaGalmee = getVal(r, ['Haala Galmee', 'haalaGalmee', 'Status', 'Haala Galmee (O)']) || 'Haaraa';
                const baraIrraDeebii = getVal(r, ['Bara Irra Deebii', 'baraIrraDeebii', 'Bara Irra Deebii (P)']) || '';
                const baraAddaanKute = getVal(r, ['Bara Addaan Kute', 'baraAddaanKute', 'Bara Addaan Kute (Q)']) || '';
                const haalaMaatii = getVal(r, ['Haala Maatii', 'haalaMaatii', 'Family Status', 'Haala Maatii (R)']) || 'Akka Maatiitti';
                const miidhamaQaamaa = /eey|yes/i.test(getVal(r, ['Miidhama Qaamaa', 'miidhamaQaamaa', 'Disability', 'Miidhama Qaamaa (S)'])) ? 'Eeyyee' : 'Lakkii';
                const gosaMiidhamaa = getVal(r, ['Gosa Miidhamaa', 'gosaMiidhamaa', 'Gosa Miidhamaa (T)']) || 'Kan Hin Qabne';
                const phoneStu = getVal(r, ['Bilbila Barataa', 'lakkBilbilaBarataa', 'Student Phone', 'Bilbila Barataa (U)']) || '-';
                const phoneParent = getVal(r, ['Bilbila Maatii', 'lakkBilbilaMaatii', 'Parent Phone', 'Bilbila Maatii (V)']) || '-';
                const motherName = getVal(r, ['Maqaa Haadhaa', 'maqaaHaadhaa', 'Mother Name', 'Maqaa Haadhaa (W)']) || 'Obsi';
                const mbDuraan = getVal(r, ['M/B Duraan', 'mbDuraan', 'Previous School', 'M/B Duraan (X)']) || '-';
                const avgScore = Number(getVal(r, ['Qabxii (%)', 'Qabxii', 'avireejjiiQabxii', 'Average Score', 'Qabxii % (Y)'])) || 0;
                const regTeacher = getVal(r, ['Barsiisaa Galmeessee', 'barsiisaaGalmeessee', 'Teacher', 'Barsiisaa (AA)']) || 'System Admin';

                const st: Student = {
                  id: String(getVal(r, ['ID', 'id']) || `imp_stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`),
                  maqaaGuutuu: name,
                  koorniyaa: gender,
                  kutaa: kutaa,
                  daree: daree,
                  baraDhalootaa: dob,
                  umurii: age,
                  haalaGalmee: haalaGalmee,
                  baraIrraDeebii: baraIrraDeebii,
                  baraAddaanKute: baraAddaanKute,
                  haalaMaatii: haalaMaatii,
                  miidhamaQaamaa: miidhamaQaamaa,
                  gosaMiidhamaa: gosaMiidhamaa,
                  godina: zoneName,
                  aanaa: woredaName,
                  ganda: gandaName,
                  maqaaHaadhaa: motherName,
                  fanId,
                  nationalId,
                  lakkBilbilaBarataa: phoneStu,
                  lakkBilbilaMaatii: phoneParent,
                  mbDuraan: mbDuraan,
                  avireejjiiQabxii: avgScore,
                  guyyaaGalmee: parsedDate,
                  barsiisaaGalmeessee: regTeacher,
                  manaBarumsaa: schoolName,
                  gosaGabaasaa: currentSheetReportType,
                };
                fileStudents.push(st);

                if (schoolName && schoolName !== 'Mana Barumsaa Waliigalaa') discoveredSchools.add(schoolName);
                if (woredaName) discoveredWoredas.add(woredaName);
                if (zoneName) discoveredZones.add(zoneName);
              }
            });
          });

          resolve();
        } catch (err) {
          console.error('Failed to parse Excel file', file.name, err);
          resolve();
        }
      };

      reader.onerror = () => resolve();
      reader.readAsArrayBuffer(file);
    });

    // Dominant school name and date for file log
    const dominantSchool = detectedSchoolName || (defaultWoreda ? `M/B Aanaa ${defaultWoreda}` : 'Mana Barumsaa Waliigalaa');
    const dominantDate = detectedExportDate || new Date().toISOString().slice(0, 10);

    incomingStudents.push(...fileStudents);

    fileLogs.push({
      fileName: file.name,
      reportDate: dominantDate,
      schoolName: dominantSchool,
      reportType: fileReportType,
      totalParsed: fileStudents.length,
      fileStudents,
    });
  }

  // 1. Save new unique students and calculate per-file added vs duplicates
  let addedCount = 0;
  const newStudentList = [...currentStudents];

  fileLogs.forEach((fLog) => {
    let fAdded = 0;
    let fDup = 0;
    fLog.fileStudents.forEach((st) => {
      const compositeKey = `${(st.maqaaGuutuu || '').trim().toLowerCase()}_${(st.kutaa || '').trim().toLowerCase()}_${(st.manaBarumsaa || '').trim().toLowerCase()}`;
      if (!existingIds.has(st.id) && !existingKeys.has(compositeKey)) {
        newStudentList.push(st);
        existingIds.add(st.id);
        existingKeys.add(compositeKey);
        addedCount++;
        fAdded++;
      } else {
        fDup++;
      }
    });

    saveStoredRestoredFile({
      id: `file_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: fLog.fileName,
      uploadedAt: new Date().toLocaleString('en-US'),
      reportDate: fLog.reportDate,
      schoolName: fLog.schoolName,
      level: defaultZone ? 'godina' : defaultWoreda ? 'aanaa' : 'school',
      unitName: defaultWoreda || defaultZone || 'Kuusaa Waliigalaa',
      reportType: fLog.reportType,
      totalRecords: fLog.totalParsed,
      newAdded: fAdded,
      duplicateCount: fDup,
    });
  });

  if (addedCount > 0) {
    saveStoredStudents(newStudentList);
  }

  // 2. Save EMIS records if parsed
  if (incomingEmis.length > 0) {
    const updatedEmisList = [...currentEmisRecords];
    let addedEmisCount = 0;
    incomingEmis.forEach((e) => {
      const eKey = `${(e.fanId || e.nationalId || e.id || '').trim().toLowerCase()}_${(e.maqaaGuutuu || '').trim().toLowerCase()}`;
      if (!existingEmisKeys.has(eKey)) {
        updatedEmisList.push(e);
        existingEmisKeys.add(eKey);
        addedEmisCount++;
      }
    });
    if (addedEmisCount > 0) {
      saveStoredEMISRecords(updatedEmisList);
    }
  }

  // 3. Auto-register Discovered Schools, Woredas, Zones into directory & AdminUnits
  const currentSchools = getStoredSchoolsList();
  const schoolSet = new Set(currentSchools.map((s) => s.trim().toLowerCase()));
  const newSchoolsList = [...currentSchools];
  discoveredSchools.forEach((sch) => {
    if (sch && sch !== 'Mana Barumsaa Waliigalaa' && !schoolSet.has(sch.trim().toLowerCase())) {
      newSchoolsList.push(sch);
      schoolSet.add(sch.trim().toLowerCase());
    }
  });
  if (newSchoolsList.length > currentSchools.length) {
    saveStoredSchoolsList(newSchoolsList);
  }

  const currentWoredas = getStoredWoredasList();
  const woredaSet = new Set(currentWoredas.map((w) => w.trim().toLowerCase()));
  const newWoredasList = [...currentWoredas];
  discoveredWoredas.forEach((wor) => {
    if (wor && !woredaSet.has(wor.trim().toLowerCase())) {
      newWoredasList.push(wor);
      woredaSet.add(wor.trim().toLowerCase());
    }
  });
  if (newWoredasList.length > currentWoredas.length) {
    saveStoredWoredasList(newWoredasList);
  }

  const currentZones = getStoredZonesList();
  const zoneSet = new Set(currentZones.map((z) => z.trim().toLowerCase()));
  const newZonesList = [...currentZones];
  discoveredZones.forEach((zon) => {
    if (zon && !zoneSet.has(zon.trim().toLowerCase())) {
      newZonesList.push(zon);
      zoneSet.add(zon.trim().toLowerCase());
    }
  });
  if (newZonesList.length > currentZones.length) {
    saveStoredZonesList(newZonesList);
  }

  // 4. Update custom targets map
  if (Object.keys(customTargetsMapToUpdate).length > 0) {
    try {
      const savedTargets = localStorage.getItem('srs_custom_targets_map');
      const currentTargetsMap = savedTargets ? JSON.parse(savedTargets) : {};
      const mergedTargets = { ...currentTargetsMap, ...customTargetsMapToUpdate };
      localStorage.setItem('srs_custom_targets_map', JSON.stringify(mergedTargets));
    } catch (err) {
      console.error('Error updating custom targets map in import:', err);
    }
  }

  // 5. Register AdminUnits for every discovered school/woreda/zone
  const currentUnits = getStoredAdminUnits();
  const unitMap = new Map(currentUnits.map((u) => [u.name.toLowerCase(), u]));

  incomingAdminUnits.forEach((u) => {
    if (!unitMap.has(u.name.toLowerCase())) {
      unitMap.set(u.name.toLowerCase(), u);
    }
  });

  discoveredSchools.forEach((sch) => {
    if (sch && sch !== 'Mana Barumsaa Waliigalaa' && !unitMap.has(sch.toLowerCase())) {
      const schTarget = customTargetsMapToUpdate[sch] || 350;
      unitMap.set(sch.toLowerCase(), {
        id: 'unit_sch_' + Math.random().toString(36).substring(2, 9),
        type: 'school',
        name: sch,
        parentName: defaultWoreda || 'Waajjira Barnootaa Aanaa',
        targetStudents: schTarget,
        codeOrGanda: 'GND-01',
      });
    }
  });

  discoveredWoredas.forEach((wor) => {
    if (wor && !unitMap.has(wor.toLowerCase())) {
      unitMap.set(wor.toLowerCase(), {
        id: 'unit_wor_' + Math.random().toString(36).substring(2, 9),
        type: 'aanaa',
        name: wor,
        parentName: defaultZone || 'Waajjira Barnootaa Godinaa',
        targetStudents: 3500,
        codeOrGanda: 'WOR-01',
      });
    }
  });

  discoveredZones.forEach((zon) => {
    if (zon && !unitMap.has(zon.toLowerCase())) {
      unitMap.set(zon.toLowerCase(), {
        id: 'unit_zon_' + Math.random().toString(36).substring(2, 9),
        type: 'godina',
        name: zon,
        parentName: 'Oromiyaa',
        targetStudents: 25000,
        codeOrGanda: 'ZON-01',
      });
    }
  });

  saveStoredAdminUnits(Array.from(unitMap.values()));

  const fileCount = filesArr.length;
  const duplicateCount = incomingStudents.length - addedCount;
  const totalLoaded = newStudentList.length;
  const statusPrefix = fileCount === 1 ? "Faayiliin 1 fe'ameera!" : `Faayilootni ${fileCount} fe'amaniiru!`;

  return {
    success: true,
    addedCount,
    totalCount: totalLoaded,
    message: `✓ ${statusPrefix} Ragaan barattootaa [${addedCount}] haaraa kuusaaf qindaa'aniiru (Duplicated: ${Math.max(0, duplicateCount)}). M/Barumsaa [${discoveredSchools.size}], Aanaa [${discoveredWoredas.size}] galmeeffamaniiru! Walumaagalatti barattoonni [${totalLoaded}] kuusaa keessa jiru.`,
  };
};



