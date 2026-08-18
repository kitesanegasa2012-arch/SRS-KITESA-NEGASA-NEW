import React, { useState } from 'react';
import { Student, SchoolSettings, EMISStudent } from '../types';
import { exportToCSV, exportFullBackupJSON, mergeBackupJSON } from '../utils/storage';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  X,
  AlertCircle,
  User,
  CheckCircle2,
  RefreshCw,
  Database,
  Sparkles,
  Layers,
} from 'lucide-react';

interface StudentRegistrationProps {
  students: Student[];
  emisRecords?: EMISStudent[];
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteStudentsByIDs?: (ids: string[]) => void;
  settings: SchoolSettings;
  currentUser: string;
  allSchools?: string[];
  allWoredas?: string[];
  allZones?: string[];
}

export const generate16DigitFANId = (): string => {
  const p1 = '1000';
  const p2 = Math.floor(10000000 + Math.random() * 90000000).toString();
  const p3 = Math.floor(1000 + Math.random() * 9000).toString();
  return `${p1}${p2}${p3}`;
};

export const generate16DigitFADId = generate16DigitFANId;

export const isFANIdValid = (fanId: string): boolean => {
  if (!fanId) return false;
  const cleanStr = fanId.trim();
  return /^\d{16}$/.test(cleanStr);
};

export const isFADIdValid = isFANIdValid;

export const generate9DigitSTUId = (): string => {
  const rand9 = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `STU${rand9}`;
};

export const isSTUIdValid = (stuiStr: string): boolean => {
  if (!stuiStr) return false;
  const digits = stuiStr.trim().replace(/\D/g, '');
  return digits.length === 9;
};

export const parseNumericGrade = (gStr: string): number | null => {
  if (!gStr) return null;
  const s = gStr.trim().toLowerCase();
  if (s === '0' || s === 'bb' || s.startsWith('bb_') || s.includes('buuura') || s.includes('boruu')) return 0;
  const match = s.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 0 && num <= 12) return num;
  }
  return null;
};

export const getHaalaGalmeeError = (
  activeEmis: EMISStudent | null,
  scoreVal: number | string,
  selectedStatus: string
): string | null => {
  if (!activeEmis) {
    if (selectedStatus !== 'Haaraa') {
      return "⚠️ Barataan EMIS irraa maqaan isaa hin jirre: Systemni ofumaan 'Haaraa' akka jedhu ta'uu qaba!";
    }
    return null;
  }

  const scoreNum = typeof scoreVal === 'number' ? scoreVal : parseFloat(String(scoreVal));
  const hasValidScore = typeof scoreVal === 'number' || (!isNaN(scoreNum) && String(scoreVal).toUpperCase() !== 'NO' && String(scoreVal).trim() !== '');

  if (hasValidScore && scoreNum >= 50) {
    if (selectedStatus !== 'Kan darbe') {
      return "⚠️ Barataa EMIS irraa argamee qabxii 50 fi isaa ol qabuuf: Systemni 'Kan darbe' akka jedhu ta'uu qaba!";
    }
  } else if (hasValidScore && scoreNum < 50) {
    if (selectedStatus !== 'Irra deebii (kufe)') {
      return "⚠️ Barataa EMIS irraa argamee qabxii 50 gadi qabuuf: Systemni 'Irra deebii (kufe)' akka jedhu ta'uu qaba!";
    }
  } else {
    if (selectedStatus !== 'Irra deebii (kute)' && selectedStatus !== 'Irra deebii (kutee)') {
      return "⚠️ Barataa EMIS irraa argamee Qabxiin isaa hin jirreef: Systemni 'Irra deebii (kute)' akka jedhu ta'uu qaba!";
    }
  }

  return null;
};

export const getGradeNoticeText = (
  activeEmis: EMISStudent | null,
  age: number,
  scoreVal: number | string,
  currentKutaa: string
): string | null => {
  if (age < 7) {
    return "Barattoota umuriin isaanii Waggaa 7 gadii: Iddoo kutaatti 'Bu'uura Boruu (um4-6)' akka jedhu ta'a.";
  }

  if (!activeEmis) return null;

  const scoreNum = typeof scoreVal === 'number' ? scoreVal : parseFloat(String(scoreVal));
  const hasValidScore = typeof scoreVal === 'number' || (!isNaN(scoreNum) && String(scoreVal).toUpperCase() !== 'NO' && String(scoreVal).trim() !== '');

  if (hasValidScore && scoreNum >= 50) {
    return `barataa qabxii kee bara darbeen kutaa itti aanuttu dabarteta, kanaaf kutaa ${currentKutaa}tti si galmeesa`;
  } else if (hasValidScore && scoreNum < 50) {
    return `barataa qabxiin kee kutaa itti aanutti sin dabarsu`;
  } else {
    return `adda waan kutteef qabxii hin qabdu`;
  }
};

export const checkIsNationalExamGrade = (kutaaStr: string, activeEmis: EMISStudent | null): boolean => {
  const g1 = parseNumericGrade(kutaaStr);
  const g2 = activeEmis ? parseNumericGrade(activeEmis.kutaa) : null;
  return g1 === 6 || g1 === 8 || g2 === 6 || g2 === 8;
};

export const HAALA_GALMEE_OPTIONS = [
  'Haaraa',
  'Kan darbe',
  'Irra deebii (kufe)',
  'Irra deebii (kute)',
  'Irra deebii mana barumsaa biroo',
  'Mana barumsaa Biroo',
];

export const HAALA_MAATII_OPTIONS = [
  'Lachuu qabaa',
  'Abbaa qofaa',
  'Haadha qofa',
  'Lachuu hin qabuu',
];

export const GOSA_MIIDHAMAA_OPTIONS = [
  'Arguu salphaa (Mild Visual)',
  'Arguu cimaa (Severe Visual / Blind)',
  'Dhageettii salphaa (Mild Hearing)',
  'Dhageettii cimaa (Severe Hearing / Deaf)',
  'Dubbii salphaa (Mild Speech)',
  'Dubbii cimaa (Severe Speech)',
  'Saaleessa sammuu (Intellectual Disability)',
  'Hirrisa hawaasummaa (Social/Behavioral)',
  'Biroo (Other)',
];

export const BARA_IRRA_DEEBII_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2000 + i));

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  students,
  emisRecords = [],
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteStudentsByIDs,
  settings,
  currentUser,
  allSchools = [],
  allWoredas = [],
  allZones = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [haalaGalmeeFilter, setHaalaGalmeeFilter] = useState('ALL');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'DEFAULT' | 'AZ' | 'ZA' | 'GRADE'>('AZ');
  const [emisAutofillToast, setEmisAutofillToast] = useState<string>('');
  const [activeEmisRecord, setActiveEmisRecord] = useState<EMISStudent | null>(null);

  // Selection & Batch Delete state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [justAddedStudent, setJustAddedStudent] = useState<Student | null>(null);

  // Initial Form State
  const getInitialFormState = (prevForm?: Omit<Student, 'id'>): Omit<Student, 'id'> => ({
    maqaaGuutuu: '',
    koorniyaa: prevForm?.koorniyaa || 'Dhiira',
    kutaa: prevForm?.kutaa || 'bb_4',
    daree: prevForm?.daree || 'A',
    baraDhalootaa: '2012-01-01',
    umurii: 4,
    haalaGalmee: 'Haaraa',
    baraAddaanKute: '',
    baraIrraDeebii: '2018',
    haalaMaatii: 'Lachuu qabaa',
    miidhamaQaamaa: 'Lakkii',
    gosaMiidhamaa: '',
    godina: prevForm?.godina || settings.godinaName || 'Shawaa Lixaa',
    aanaa: prevForm?.aanaa || settings.aanaaName || 'Meta Wolkite',
    ganda: prevForm?.ganda || 'Ganda 01',
    maqaaHaadhaa: '',
    fanId: prevForm?.fanId && prevForm.fanId !== 'NO' && /^\d{16}$/.test(prevForm.fanId) ? prevForm.fanId : 'NO',
    nationalId: generate9DigitSTUId(),
    lakkBilbilaBarataa: '',
    lakkBilbilaMaatii: '',
    mbDuraan: prevForm?.mbDuraan || settings.savedSchoolName || '',
    avireejjiiQabxii: 80.0,
    guyyaaGalmee: new Date().toISOString().split('T')[0],
    barsiisaaGalmeessee: currentUser || 'Kitesa Negasa',
    manaBarumsaa: prevForm?.manaBarumsaa || settings.savedSchoolName || 'Mana Barumsaa',
  });

  const [formData, setFormData] = useState<Omit<Student, 'id'>>(getInitialFormState());
  const [emisQuickSearch, setEmisQuickSearch] = useState('');

  // Helper normalization for string matching
  const normStr = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

  // Compute duplicate student IDs across all students
  const getDuplicateStudentIds = (allStudents: Student[]): Set<string> => {
    const dupSet = new Set<string>();
    const natMap = new Map<string, Student[]>();
    const fanMap = new Map<string, Student[]>();
    const nameMap = new Map<string, Student[]>();

    allStudents.forEach((st) => {
      if (st.nationalId && st.nationalId.trim() !== '' && st.nationalId !== '-' && st.nationalId !== 'NO') {
        const k = st.nationalId.trim().toUpperCase();
        if (!natMap.has(k)) natMap.set(k, []);
        natMap.get(k)!.push(st);
      }
      if (st.fanId && st.fanId.trim() !== '' && st.fanId !== 'NO') {
        const k = st.fanId.trim().toUpperCase();
        if (!fanMap.has(k)) fanMap.set(k, []);
        fanMap.get(k)!.push(st);
      }
      const cName = normStr(st.maqaaGuutuu);
      const cMother = normStr(st.maqaaHaadhaa);
      if (cName && cMother) {
        const k = `${cName}__${cMother}`;
        if (!nameMap.has(k)) nameMap.set(k, []);
        nameMap.get(k)!.push(st);
      }
    });

    [natMap, fanMap, nameMap].forEach((m) => {
      m.forEach((list) => {
        if (list.length > 1) {
          list.forEach((st) => dupSet.add(st.id));
        }
      });
    });

    return dupSet;
  };

  const duplicateStudentIds = getDuplicateStudentIds(students);

  // Live duplicate check for form input
  const checkCurrentFormDuplicate = (
    name: string,
    mother: string,
    nationalId: string,
    fanId: string,
    currentId?: string
  ): { isDup: boolean; matchedStudent?: Student; reason?: string } => {
    const cName = normStr(name);
    const cMother = normStr(mother);
    const cNat = (nationalId || '').trim().toUpperCase();
    const cFan = (fanId || '').trim().toUpperCase();

    if (!cName) return { isDup: false };

    for (const st of students) {
      if (currentId && st.id === currentId) continue;

      if (cNat && cNat !== '-' && cNat !== 'NO' && st.nationalId && st.nationalId.trim().toUpperCase() === cNat) {
        return { isDup: true, matchedStudent: st, reason: `Lakk. National ID (${st.nationalId})` };
      }
      if (cFan && cFan !== 'NO' && st.fanId && st.fanId.trim().toUpperCase() === cFan) {
        return { isDup: true, matchedStudent: st, reason: `FAN ID (${st.fanId})` };
      }
      if (cName && cMother && normStr(st.maqaaGuutuu) === cName && normStr(st.maqaaHaadhaa) === cMother) {
        return { isDup: true, matchedStudent: st, reason: `Maqaa (${st.maqaaGuutuu}) & Maqaa Haadhaa (${st.maqaaHaadhaa})` };
      }
    }

    return { isDup: false };
  };

  // Auto-calculate age from birth date (e.g., YYYY-MM-DD)
  const calculateAgeFromBirthDate = (dateStr: string): number => {
    const currentEthYear = parseInt(settings.baraBarnootaa) || 2019;
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[0]);
      if (birthYear > 1900 && birthYear <= currentEthYear) {
        return Math.max(1, currentEthYear - birthYear);
      }
    }
    return 7;
  };

  // Handle Bara Dhalootaa Change
  const handleBaraDhalootaaChange = (val: string, isEdit: boolean = false) => {
    const calculatedAge = calculateAgeFromBirthDate(val);
    if (isEdit && editingStudent) {
      setEditingStudent({
        ...editingStudent,
        baraDhalootaa: val,
        umurii: calculatedAge,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        baraDhalootaa: val,
        umurii: calculatedAge,
      }));
    }
  };

  // Handle Score Change (<50% auto repeater rule)
  const handleScoreChange = (valStr: string, isEdit: boolean = false) => {
    const parsed = parseFloat(valStr);
    const val = valStr === '' || isNaN(parsed) ? (valStr === '' ? '' : 0) : parsed;
    const isBelow50 = typeof val === 'number' && val < 50;
    if (isEdit && editingStudent) {
      setEditingStudent({
        ...editingStudent,
        avireejjiiQabxii: val as any,
        haalaGalmee: isBelow50 ? 'Irra deebii (kufe)' : editingStudent.haalaGalmee,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        avireejjiiQabxii: val as any,
        haalaGalmee: isBelow50 ? 'Irra deebii (kufe)' : prev.haalaGalmee,
      }));
    }
  };

  // Handle Haala Galmee Change
  const handleHaalaGalmeeChange = (val: string, isEdit: boolean = false) => {
    const isOtherSchool = val === 'Irra deebii mana barumsaa biroo' || val === 'Mana barumsaa Biroo';
    if (isEdit && editingStudent) {
      setEditingStudent({
        ...editingStudent,
        haalaGalmee: val,
        mbDuraan: isOtherSchool ? editingStudent.mbDuraan : settings.savedSchoolName,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        haalaGalmee: val,
        mbDuraan: isOtherSchool ? prev.mbDuraan : settings.savedSchoolName,
      }));
    }
  };

  // Search EMIS records by name, FAD ID, STU ID, or mother name (starts with 1st letter)
  const getEmisMatches = (searchQuery: string): EMISStudent[] => {
    if (!searchQuery || searchQuery.trim().length < 1) return [];
    const query = searchQuery.trim().toLowerCase();
    const searchWords = query.split(/\s+/);
    return emisRecords
      .filter((e) => {
        const nameLower = (e.maqaaGuutuu || '').toLowerCase();
        const fullTarget = `${e.maqaaGuutuu} ${e.fanId || ''} ${e.nationalId || ''} ${e.maqaaHaadhaa || ''} ${e.godina || ''} ${e.aanaa || ''} ${e.ganda || ''}`.toLowerCase();
        return nameLower.startsWith(query) || searchWords.every((w) => fullTarget.includes(w));
      })
      .slice(0, 8);
  };

  const handleAutofillFromEMIS = (emis: EMISStudent) => {
    setActiveEmisRecord(emis);
    const isOtherSchool = emis.mbDuraan && emis.mbDuraan !== settings.savedSchoolName;

    // Rule 1: Barataan Ragaa EMIS irraa FAN hin qabne -> "NO"
    const cleanFan = emis.fanId && emis.fanId !== 'NO' && /^\d{16}$/.test(emis.fanId.trim())
      ? emis.fanId.trim()
      : 'NO';

    const cleanSTUID = emis.nationalId && emis.nationalId !== '-' && emis.nationalId !== 'NO'
      ? emis.nationalId
      : (formData.nationalId && isSTUIdValid(formData.nationalId) ? formData.nationalId : generate9DigitSTUId());

    const dobStr = String(emis.baraDhalootaa || '2012-01-01');
    const computedAge = Number(emis.umurii) || calculateAgeFromBirthDate(dobStr);

    let rawScoreVal: number | string = 'NO';
    if (
      emis.avireejjiiQabxii !== undefined &&
      emis.avireejjiiQabxii !== null &&
      emis.avireejjiiQabxii !== 'NO' &&
      !isNaN(Number(emis.avireejjiiQabxii))
    ) {
      rawScoreVal = Number(emis.avireejjiiQabxii);
    }

    // Determine Status & Grade according to strict user rules:
    let autoKutaa = emis.kutaa || '1';
    let autoStatus = 'Haaraa';

    if (computedAge < 7) {
      // Rule 3a: Umurii < 7 -> Bu'uura Booruu (um4-6)
      autoKutaa = computedAge === 4 ? 'bb_4' : computedAge === 5 ? 'bb_5' : computedAge === 6 ? 'bb_6' : '0';
      autoStatus = 'Haaraa';
    } else {
      const emisGradeNum = parseNumericGrade(emis.kutaa);
      if (typeof rawScoreVal === 'number' && rawScoreVal >= 50) {
        // Rule 2b & 3b: Score >= 50 -> "Kan darbe", +1 step promotion
        autoStatus = 'Kan darbe';
        if (emisGradeNum !== null) {
          const nextG = emisGradeNum < 12 ? emisGradeNum + 1 : 12;
          autoKutaa = String(nextG);
        }
      } else if (typeof rawScoreVal === 'number' && rawScoreVal < 50) {
        // Rule 2c & 3c: Score < 50 -> "Irra deebii (kufe)", same grade
        autoStatus = 'Irra deebii (kufe)';
        if (emisGradeNum !== null) {
          autoKutaa = String(emisGradeNum);
        }
      } else {
        // Rule 2d & 3d: No Score -> "Irra deebii (kute)", same grade
        autoStatus = 'Irra deebii (kute)';
        if (emisGradeNum !== null) {
          autoKutaa = String(emisGradeNum);
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      maqaaGuutuu: emis.maqaaGuutuu,
      koorniyaa: (emis.koorniyaa === 'Dhalaa' ? 'Dhalaa' : 'Dhiira') as 'Dhiira' | 'Dhalaa',
      kutaa: autoKutaa,
      daree: emis.daree || prev.daree || 'A',
      baraDhalootaa: dobStr,
      umurii: computedAge,
      haalaGalmee: autoStatus,
      fanId: cleanFan,
      nationalId: cleanSTUID,
      godina: emis.godina || prev.godina,
      aanaa: emis.aanaa || prev.aanaa,
      ganda: emis.ganda || prev.ganda,
      maqaaHaadhaa: emis.maqaaHaadhaa || prev.maqaaHaadhaa,
      haalaMaatii: emis.haalaMaatii || prev.haalaMaatii,
      miidhamaQaamaa: (emis.miidhamaQaamaa === 'Eeyyee' ? 'Eeyyee' : 'Lakkii') as 'Eeyyee' | 'Lakkii',
      gosaMiidhamaa: emis.gosaMiidhamaa || prev.gosaMiidhamaa,
      lakkBilbilaBarataa: emis.lakkBilbilaBarataa || prev.lakkBilbilaBarataa,
      lakkBilbilaMaatii: emis.lakkBilbilaMaatii || prev.lakkBilbilaMaatii,
      mbDuraan: isOtherSchool ? (emis.mbDuraan || prev.mbDuraan) : settings.savedSchoolName,
      avireejjiiQabxii: rawScoreVal,
    }));

    setEmisAutofillToast(
      `✓ Odeeffannoo "${emis.maqaaGuutuu}" (STU ID: ${cleanSTUID}, Kutaa: ${autoKutaa}, Haala: ${autoStatus}, FAN: ${cleanFan}) EMIS kuusaa irraa sirriitti guutameera!`
    );
    setTimeout(() => setEmisAutofillToast(''), 6000);
  };

  // Filter & Sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.maqaaGuutuu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.fanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.ganda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lakkBilbilaBarataa.includes(searchTerm) ||
        student.mbDuraan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'ALL' || student.kutaa === gradeFilter;
      const matchesGender = genderFilter === 'ALL' || student.koorniyaa === genderFilter;
      const matchesHaala = haalaGalmeeFilter === 'ALL' || student.haalaGalmee === haalaGalmeeFilter;
      const matchesAge = ageFilter === 'ALL' || String(student.umurii) === ageFilter;

      return matchesSearch && matchesGrade && matchesGender && matchesHaala && matchesAge;
    })
    .sort((a, b) => {
      if (sortOrder === 'AZ') {
        return a.maqaaGuutuu.localeCompare(b.maqaaGuutuu);
      } else if (sortOrder === 'ZA') {
        return b.maqaaGuutuu.localeCompare(a.maqaaGuutuu);
      } else if (sortOrder === 'GRADE') {
        const gA = parseNumericGrade(a.kutaa) ?? 99;
        const gB = parseNumericGrade(b.kutaa) ?? 99;
        if (gA !== gB) return gA - gB;
        return a.maqaaGuutuu.localeCompare(b.maqaaGuutuu);
      }
      return 0;
    });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maqaaGuutuu.trim()) return;

    let cleanFanId = formData.fanId.trim();
    if (!cleanFanId || cleanFanId.toUpperCase() === 'NO') {
      cleanFanId = 'NO';
    } else if (!/^\d{16}$/.test(cleanFanId)) {
      alert(`Dogoggora: Yoo qabaattan lakk. dijiitii 16 guutaa! (Saa'aatti dijiitii ${cleanFanId.length} qaba). Yoo FAN hin qabne 'NO' jedhaa.`);
      return;
    }

    const cleanStui = formData.nationalId.trim();
    const stuiDigits = cleanStui.replace(/\D/g, '').length;
    if (!isSTUIdValid(cleanStui)) {
      alert(`Dogoggora: Lakk. STUI Barataa dijiitii 9 qofa ta'uu qaba!\n(Saa'aatti dijiitii ${stuiDigits} qaba). 8/gadi ykn 10/ol systemni hin fudhatu!`);
      return;
    }

    const isOtherSchool = formData.haalaGalmee === 'Irra deebii mana barumsaa biroo' || formData.haalaGalmee === 'Mana barumsaa Biroo';

    const chosenSchool = formData.manaBarumsaa?.trim() || settings.savedSchoolName || 'Mana Barumsaa';
    const chosenGodina = formData.godina?.trim() || settings.godinaName || 'Shawaa Lixaa';
    const chosenAanaa = formData.aanaa?.trim() || settings.aanaaName || 'Meta Wolkite';

    const newStudent: Student = {
      ...formData,
      godina: chosenGodina,
      aanaa: chosenAanaa,
      manaBarumsaa: chosenSchool,
      avireejjiiQabxii: typeof formData.avireejjiiQabxii === 'number' ? formData.avireejjiiQabxii : (parseFloat(String(formData.avireejjiiQabxii)) || 0),
      fanId: cleanFanId,
      nationalId: cleanStui,
      id: `STU-${Date.now().toString().slice(-5)}`,
      mbDuraan: isOtherSchool ? (formData.mbDuraan || chosenSchool) : chosenSchool,
    };

    onAddStudent(newStudent);
    setIsAddOpen(false);
    setJustAddedStudent(newStudent);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!window.confirm(`Mirkaneessaa: Jijjiirama ragaa barataa '${editingStudent.maqaaGuutuu}' olcaaluu (Update) ni barbaaddaa?`)) {
      return;
    }

    let cleanFanId = editingStudent.fanId.trim();
    if (!cleanFanId || cleanFanId.toUpperCase() === 'NO') {
      cleanFanId = 'NO';
    } else if (!/^\d{16}$/.test(cleanFanId)) {
      alert(`Dogoggora: Yoo qabaattan lakk. dijiitii 16 guutaa! (Saa'aatti dijiitii ${cleanFanId.length} qaba). Yoo FAN hin qabne 'NO' jedhaa.`);
      return;
    }

    const cleanStui = editingStudent.nationalId.trim();
    const stuiDigits = cleanStui.replace(/\D/g, '').length;
    if (!isSTUIdValid(cleanStui)) {
      alert(`Dogoggora: Lakk. STUI Barataa dijiitii 9 qofa ta'uu qaba!\n(Saa'aatti dijiitii ${stuiDigits} qaba). 8/gadi ykn 10/ol systemni hin fudhatu!`);
      return;
    }

    onUpdateStudent({
      ...editingStudent,
      avireejjiiQabxii: typeof editingStudent.avireejjiiQabxii === 'number' ? editingStudent.avireejjiiQabxii : (parseFloat(String(editingStudent.avireejjiiQabxii)) || 0),
      fanId: cleanFanId,
      nationalId: cleanStui,
    });
    setEditingStudent(null);
  };

  const handleRegisterNextStudent = () => {
    setFormData(getInitialFormState(formData)); // Retains common fields (kutaa, daree, ganda, etc.)
    setJustAddedStudent(null);
    setIsAddOpen(true);
  };

  const handleExport = () => {
    const exportData = filteredStudents.map((s) => ({
      'Maqaa Guutuu': s.maqaaGuutuu,
      'Koorniyaa': s.koorniyaa,
      'FAN ID': s.fanId,
      'Kutaa': s.kutaa,
      'Daree': s.daree,
      'Bara Dhalootaa': s.baraDhalootaa,
      'Umurii': s.umurii,
      'Haala Galmee': s.haalaGalmee,
      'Bara Addaan Kute': s.baraAddaanKute || '-',
      'Bara Irra Deebii': s.baraIrraDeebii || '-',
      'Haala Maatii': s.haalaMaatii,
      'Miidhama Qaamaa': s.miidhamaQaamaa,
      'Gosa Miidhamaa': s.gosaMiidhamaa || '-',
      'Godina': s.godina,
      'Aanaa': s.aanaa,
      'Ganda': s.ganda,
      'Lakk. STUI Barataa (National ID)': s.nationalId || s.id,
      'Maqaa Haadhaa': s.maqaaHaadhaa,
      'Bilbila Barataa': s.lakkBilbilaBarataa,
      'Bilbila Maatii': s.lakkBilbilaMaatii,
      'M/B Duraan': s.mbDuraan,
      'Avireejjii Qabxii': s.avireejjiiQabxii,
      'Guyyaa Galmee': s.guyyaaGalmee,
      'Barsiisaa': s.barsiisaaGalmeessee,
      'Mana Barumsaa': s.manaBarumsaa,
    }));
    exportToCSV(`Student_Registration_${settings.savedSchoolName}_${Date.now()}.csv`, exportData);
  };

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
          window.location.reload();
        } else {
          alert(`❌ ${result.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            <span>Galmee Barattootaa (Student Registration)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Waliigala barattoota galmaa'an: <strong className="text-indigo-600">{filteredStudents.length}</strong> / {students.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              setFormData(getInitialFormState());
              setIsAddOpen(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Barataa Haaraa Galmeessi</span>
          </button>

          {selectedStudentIds.length > 0 && (
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer animate-pulse"
              title="Barattoota filataman haqi"
            >
              <Trash2 className="w-4 h-4" />
              <span>🗑️ Filataman Balleessi ({selectedStudentIds.length})</span>
            </button>
          )}

          <label
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="Barsiisota/Bilbiloota biraa irraa JSON galmee barattootaa walitti makaa"
          >
            <Layers className="w-4 h-4" />
            <span>🔀 Ragaa Walitti Makaa (Merge Data)</span>
            <input type="file" accept=".json" onChange={handleMergeFile} className="hidden" />
          </label>

          <button
            onClick={exportFullBackupJSON}
            className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="JSON Ragaa olkaawwadhu (Backup)"
          >
            <Download className="w-4 h-4" />
            <span>Ragaa olkaawwadhu (Backup)</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Teacher Registration Guide Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/10 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5">
            📱 Multi-Device
          </div>
          <div className="space-y-0.5 font-medium">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              💡 Barsiisota Baay'eedhaan Bilbila / Kompuutara Garaagaraatiin Galmeessuuf:
            </p>
            <p className="text-[11px] sm:text-xs text-slate-700">
              1. Barsiistoni bilbila isaaniin galmeessanii butoonii <strong>"Ragaa olkaawwadhu (Backup)"</strong> jedhuun fayilii JSON gadi buufatanii Hogganaadhaaf ergu.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-700">
              2. Hogganaan/Barsiisaan buttun <strong>"🔀 Ragaa Walitti Makaa (Merge Data)"</strong> jedhu fayyadamuun fayilii JSON ergame sana bilbila isaatti galchuun barattoota hunda walitti maka!
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Search Field */}
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Barbaadi (Maqaa, FAN, NID)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">Kutaa Hundaa (All Grades)</option>
            <optgroup label="Bu'uura Boruu (Umurii 4 - 6)">
              <option value="bb_4">Umurii 4 (Bu'uura Boruu)</option>
              <option value="bb_5">Umurii 5 (Bu'uura Boruu)</option>
              <option value="bb_6">Umurii 6 (Bu'uura Boruu)</option>
              <option value="0">Bu'uura Boruu (Waliigala / 0)</option>
            </optgroup>
            <optgroup label="Kutaalee Primary & Secondary (1 - 12)">
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                <option key={g} value={g}>
                  Kutaa {g}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Age Filter (Specifically including Umurii 7) */}
        <div className="flex items-center gap-2">
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className={`w-full py-2.5 px-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold border transition ${
              ageFilter === '7'
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">Umurii Hundaa (All Ages)</option>
            <option value="7">⚡ Umurii 7 Qofa (Age 7 Only)</option>
            <option value="4">Umurii 4 (BB)</option>
            <option value="5">Umurii 5 (BB)</option>
            <option value="6">Umurii 6 (BB)</option>
            {Array.from({ length: 13 }, (_, i) => i + 8).map((a) => (
              <option key={a} value={String(a)}>
                Umurii {a}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order Dropdown (Alphabet A-Z, Z-A) */}
        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full py-2.5 px-2 bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            title="Tartiiba Maqaa Barattootaa (Alphabet Sort)"
          >
            <option value="AZ">🔤 Alphabet (A - Z)</option>
            <option value="ZA">🔤 Alphabet (Z - A)</option>
            <option value="GRADE">🔢 Tartiiba Kutaa (Grade)</option>
            <option value="DEFAULT">📋 Tartiiba Galmee (Default)</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Koorniyaa Hundaa</option>
            <option value="Dhiira">Dhiira (Male)</option>
            <option value="Dhalaa">Dhalaa (Female)</option>
          </select>
        </div>

        {/* Haala Galmee Filter */}
        <div className="flex items-center gap-2">
          <select
            value={haalaGalmeeFilter}
            onChange={(e) => setHaalaGalmeeFilter(e.target.value)}
            className="w-full py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Haala Galmee (Hundaa)</option>
            {HAALA_GALMEE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-900 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={() => {
                      if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
                        setSelectedStudentIds([]);
                      } else {
                        setSelectedStudentIds(filteredStudents.map((s) => s.id));
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    title="Hunda Filadhu / Deselect All"
                  />
                </th>
                <th className="px-4 py-3.5">
                  Maqaa Guutuu Barataa
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(student full name)</span>
                </th>
                <th className="px-3 py-3.5">
                  Koorniyaa
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(gender)</span>
                </th>
                <th className="px-3 py-3.5">
                  FAN ID
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(16 digits)</span>
                </th>
                <th className="px-3 py-3.5">
                  Kutaa/Daree
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(grade/section)</span>
                </th>
                <th className="px-3 py-3.5">
                  Haala Galmee
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(status)</span>
                </th>
                <th className="px-3 py-3.5">
                  M/B Duraan
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(prev. school)</span>
                </th>
                <th className="px-3 py-3.5">
                  Ganda
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(kebele)</span>
                </th>
                <th className="px-3 py-3.5">
                  Lakk. STUI Barataa
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(STU ID)</span>
                </th>
                <th className="px-3 py-3.5">
                  Qabxii
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(avg score)</span>
                </th>
                <th className="px-4 py-3.5 text-center">
                  Tarkaanfii
                  <span className="block text-[9px] text-slate-500 font-normal lowercase">(actions)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    Barataan homaayyuu hin argamne. (No student records found)
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isDup = duplicateStudentIds.has(student.id);
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={
                        isSelected
                          ? 'bg-indigo-50/80 border-l-4 border-indigo-600 transition'
                          : isDup
                          ? 'bg-rose-50/90 border-l-4 border-rose-600 hover:bg-rose-100/90 transition'
                          : 'hover:bg-slate-50 transition'
                      }
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedStudentIds((prev) =>
                              prev.includes(student.id)
                                ? prev.filter((id) => id !== student.id)
                                : [...prev, student.id]
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={isDup ? 'text-rose-900 font-black' : ''}>{student.maqaaGuutuu}</span>
                          {isDup && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md shadow-xs animate-pulse">
                              🚨 Duplicated: barataan kun duraan galmaa'e ture!
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Maqaa Haadhaa: {student.maqaaHaadhaa || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            student.koorniyaa === 'Dhiira'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {student.koorniyaa}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">
                        {student.fanId}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {student.kutaa === '0' ? 'Bu\'uura Boruu' : `Kutaa ${student.kutaa}`} ({student.daree})
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          {student.haalaGalmee}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-600 truncate max-w-[140px]" title={student.mbDuraan}>
                        {student.mbDuraan}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{student.ganda}</td>
                      <td className="px-3 py-3 font-mono text-indigo-700 font-bold text-[11px] whitespace-nowrap">
                        {student.nationalId || student.id || '-'}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        <span className={student.avireejjiiQabxii < 50 ? 'text-rose-600 font-black' : 'text-emerald-700'}>
                          {student.avireejjiiQabxii}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Ilaali / View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Gulaali / Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(student.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Haqu / Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal (All 24 fields + Age Auto Calc + Low Score Warnings) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Barataa Haaraa Galmeessi (Register New Student)</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {emisRecords.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50 border-2 border-indigo-200 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>Barataa EMIS Kuusaa Irraa Filadhu (Quick Fill from EMIS Uploaded Data)</span>
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-mono font-bold">
                      {emisRecords.length} Barattoota EMIS
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {/* Search filter input */}
                    <div className="relative w-full sm:w-1/3">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Barbaradi (Maqaa, STU, FAN)..."
                        value={emisQuickSearch}
                        onChange={(e) => setEmisQuickSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Filtered dropdown */}
                    <select
                      onChange={(e) => {
                        const selected = emisRecords.find(
                          (rec) => rec.nationalId === e.target.value || rec.maqaaGuutuu === e.target.value
                        );
                        if (selected) {
                          handleAutofillFromEMIS(selected);
                        }
                      }}
                      className="w-full sm:w-2/3 p-2 bg-white border-2 border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Barataa Kuusaa EMIS irraa filadhu ({emisRecords.length}) --
                      </option>
                      {emisRecords
                        .filter((r) => {
                          const q = emisQuickSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            r.maqaaGuutuu.toLowerCase().includes(q) ||
                            (r.nationalId && r.nationalId.toLowerCase().includes(q)) ||
                            (r.fanId && r.fanId.includes(q))
                          );
                        })
                        .map((rec, idx) => (
                          <option key={idx} value={rec.nationalId || rec.maqaaGuutuu}>
                            👤 {rec.maqaaGuutuu} — Kutaa {rec.kutaa || '1'} (STU: {rec.nationalId || '-'}, FAN: {rec.fanId || '16-Digits'}, Qabxii: {rec.avireejjiiQabxii === 'NO' || !rec.avireejjiiQabxii ? 'NO' : `${rec.avireejjiiQabxii}%`})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs font-semibold text-indigo-900">
                📌 Odeeffannoo Guutuu Barataa (All 24 Registration Fields):
              </div>

              {(() => {
                const dupCheck = checkCurrentFormDuplicate(
                  formData.maqaaGuutuu,
                  formData.maqaaHaadhaa,
                  formData.nationalId,
                  formData.fanId
                );
                if (!dupCheck.isDup) return null;
                return (
                  <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-lg border-2 border-rose-800 space-y-1.5 animate-pulse">
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                      <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
                      <span>🚨 WARNII: barataan kun duraan galmaa'e ture!</span>
                    </div>
                    <p className="text-xs text-rose-100 font-medium">
                      Barataan <strong>"{dupCheck.matchedStudent?.maqaaGuutuu}"</strong> (M/B: {dupCheck.matchedStudent?.manaBarumsaa}, Kutaa: {dupCheck.matchedStudent?.kutaa}, STU ID: {dupCheck.matchedStudent?.nationalId}) kuusaa ragaa keessatti duraan galmaa'ee jira! ({dupCheck.reason})
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Maqaa Guutuu */}
                <div className="sm:col-span-2 relative">
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>1. Maqaa Guutuu Barataa <span className="text-xs text-slate-500 font-normal">(Student Full Name)</span> *</span>
                    {emisRecords.length > 0 && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>EMIS kuusaa save ta'ee waliin wal-qabata</span>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.maqaaGuutuu}
                    onChange={(e) => setFormData({ ...formData, maqaaGuutuu: e.target.value })}
                    placeholder="Maqaa Abbaa Akaakayyu... (Fk. Gadaa Feyisa Tolaa)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Toast Alert when autofilled from EMIS */}
                  {emisAutofillToast && (
                    <div className="mt-2 p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{emisAutofillToast}</span>
                    </div>
                  )}

                  {/* EMIS Search & Match Suggestions Card */}
                  {formData.maqaaGuutuu.trim().length >= 1 && getEmisMatches(formData.maqaaGuutuu).length > 0 && (
                    <div className="mt-2 p-3 bg-indigo-50/95 border-2 border-indigo-300 rounded-2xl shadow-lg space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950 border-b border-indigo-200 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <span>Odeeffannoo EMIS Kuusaa keessatti argameera! (Online/Uploaded Data)</span>
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-md text-[10px] font-mono font-bold">
                          {getEmisMatches(formData.maqaaGuutuu).length} Matches
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {getEmisMatches(formData.maqaaGuutuu).map((emisMatch, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white border border-indigo-100 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-indigo-400 transition"
                          >
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2 flex-wrap">
                                <span>{emisMatch.maqaaGuutuu}</span>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-950 text-[10px] font-extrabold rounded-md border border-indigo-200">
                                  Ref: {emisMatch.fileSource ? `${emisMatch.fileSource} file` : 'BSD file'}
                                </span>
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">
                                  Kutaa {emisMatch.kutaa || '1'}
                                </span>
                                <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 text-[10px] rounded font-bold">
                                  Bara Dhal: {emisMatch.baraDhalootaa || '2012'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                <span>STU ID: <strong className="text-emerald-700">{emisMatch.nationalId || '-'}</strong></span>
                                <span>• FAN ID: <strong className="text-indigo-700">{emisMatch.fanId || '16-Digits'}</strong></span>
                                <span>• Koorniyaa: <strong>{emisMatch.koorniyaa}</strong></span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAutofillFromEMIS(emisMatch)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1 cursor-pointer transition shadow-sm active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>EMIS irraa guuti</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field Reference Badge Footer */}
                  {activeEmisRecord && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 font-bold text-xs flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        ✓ Reference: {activeEmisRecord.fileSource || 'BSD file'} (Col C/D/E: Maqaa Guutuu - "{activeEmisRecord.maqaaGuutuu}")
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Koorniyaa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Koorniyaa <span className="text-xs text-slate-500 font-normal">(Gender)</span> *
                  </label>
                  <select
                    value={formData.koorniyaa}
                    onChange={(e) => setFormData({ ...formData, koorniyaa: e.target.value as 'Dhiira' | 'Dhalaa' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Dhiira">Dhiira (Male)</option>
                    <option value="Dhalaa">Dhalaa (Female)</option>
                  </select>
                  {activeEmisRecord && (
                    <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Ref: BSD file (Col G: Saala - {formData.koorniyaa === 'Dhiira' ? 'Male / Dhiira' : 'Female / Dhalaa'})
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Kutaa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Kutaa <span className="text-xs text-slate-500 font-normal">(Grade 1-12)</span> *
                  </label>
                  <select
                    value={formData.kutaa}
                    onChange={(e) => setFormData({ ...formData, kutaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <optgroup label="Bu'uura Boruu (Umurii 4 - 6)">
                      <option value="bb_4">Umurii 4 (Bu'uura Boruu / Um4)</option>
                      <option value="bb_5">Umurii 5 (Bu'uura Boruu / Um5)</option>
                      <option value="bb_6">Umurii 6 (Bu'uura Boruu / Um6)</option>
                      <option value="0">Bu'uura Boruu (Waliigala / Grade 0)</option>
                    </optgroup>
                    <optgroup label="Kutaalee Primary & Secondary (1 - 12)">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                        <option key={g} value={g}>
                          Kutaa {g} (Grade {g})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {getGradeNoticeText(activeEmisRecord, formData.umurii, formData.avireejjiiQabxii, formData.kutaa) && (
                    <div className="mt-1.5 p-2 bg-sky-50 border border-sky-300 rounded-xl text-sky-950 font-bold text-xs flex items-center gap-1.5 animate-fadeIn">
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{getGradeNoticeText(activeEmisRecord, formData.umurii, formData.avireejjiiQabxii, formData.kutaa)}</span>
                    </div>
                  )}
                  {activeEmisRecord && (
                    <div className="mt-1.5 p-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-950 font-bold text-[11px] flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Ref: SR/BSD file (Kutaa {formData.kutaa})</span>
                    </div>
                  )}
                </div>

                {/* 4. Daree */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4. Daree <span className="text-xs text-slate-500 font-normal">(Section)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.daree}
                    onChange={(e) => setFormData({ ...formData, daree: e.target.value })}
                    placeholder="A, B, C..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 5. Bara Dhalootaa (YYYY-MM-DD pattern) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    5. Bara Dhalootaa <span className="text-xs text-slate-500 font-normal">(Date of Birth: YYYY-MM-DD)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.baraDhalootaa}
                    onChange={(e) => handleBaraDhalootaaChange(e.target.value, false)}
                    placeholder="2012-01-25"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                  {activeEmisRecord ? (
                    <div className="mt-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-bold text-[11px] flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Ref: BSD file (Col J: Bara Dhal - {formData.baraDhalootaa})</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Pattern: 2012-01-25 (YYYY-MM-DD standard)</span>
                  )}
                </div>

                {/* 6. Umurii (Auto Calculated) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    6. Umurii <span className="text-xs text-slate-500 font-normal">(Age Auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.umurii}
                    onChange={(e) => setFormData({ ...formData, umurii: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-900"
                  />
                </div>

                {/* 7. Haala Galmee */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    7. Haala Galmee <span className="text-xs text-slate-500 font-normal">(Registration Status)</span> *
                  </label>
                  <select
                    value={formData.haalaGalmee}
                    onChange={(e) => handleHaalaGalmeeChange(e.target.value, false)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {HAALA_GALMEE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {getHaalaGalmeeError(activeEmisRecord, formData.avireejjiiQabxii, formData.haalaGalmee) && (
                    <div className="mt-2 p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-950 font-black text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{getHaalaGalmeeError(activeEmisRecord, formData.avireejjiiQabxii, formData.haalaGalmee)}</span>
                    </div>
                  )}
                </div>

                {/* 8. Bara Irra Deebii / Addaan Kute */}
                {formData.haalaGalmee.toLowerCase().includes('irra deebii') ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      8. Bara Irra Deebii <span className="text-xs text-slate-500 font-normal">(Repeated Year)</span>
                    </label>
                    <select
                      value={formData.baraIrraDeebii || '2018'}
                      onChange={(e) => setFormData({ ...formData, baraIrraDeebii: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-amber-900"
                    >
                      {BARA_IRRA_DEEBII_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          Bara {y} E.C
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      8. Bara Addaan Kute <span className="text-xs text-slate-500 font-normal">(Dropout Year)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.baraAddaanKute || ''}
                      onChange={(e) => setFormData({ ...formData, baraAddaanKute: e.target.value })}
                      placeholder="e.g. 2018"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                )}

                {/* 9. Haala Maatii */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    9. Haala Maatii <span className="text-xs text-slate-500 font-normal">(Parental Status)</span>
                  </label>
                  <select
                    value={formData.haalaMaatii}
                    onChange={(e) => setFormData({ ...formData, haalaMaatii: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {HAALA_MAATII_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 10. Miidhama Qaamaa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    10. Miidhama Qaamaa <span className="text-xs text-slate-500 font-normal">(Disability Status)</span>
                  </label>
                  <select
                    value={formData.miidhamaQaamaa}
                    onChange={(e) => setFormData({ ...formData, miidhamaQaamaa: e.target.value as 'Eeyyee' | 'Lakkii' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Lakkii">Lakkii (No)</option>
                    <option value="Eeyyee">Eeyyee (Yes)</option>
                  </select>
                </div>

                {/* 11. Gosa Miidhamaa Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    11. Gosa Miidhamaa <span className="text-xs text-slate-500 font-normal">(Disability Category)</span>
                  </label>
                  {formData.miidhamaQaamaa === 'Eeyyee' ? (
                    <select
                      value={formData.gosaMiidhamaa || GOSA_MIIDHAMAA_OPTIONS[0]}
                      onChange={(e) => setFormData({ ...formData, gosaMiidhamaa: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-medium text-slate-900"
                    >
                      {GOSA_MIIDHAMAA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="N/A (Fayyaa Bu'uuraa)"
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-400"
                    />
                  )}
                </div>

                {/* 12. Godina */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    12. Godina <span className="text-xs text-slate-500 font-normal">(Zone)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.godina}
                    onChange={(e) => setFormData({ ...formData, godina: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 13. Aanaa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    13. Aanaa <span className="text-xs text-slate-500 font-normal">(Woreda / District)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aanaa}
                    onChange={(e) => setFormData({ ...formData, aanaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 14. Ganda */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    14. Ganda <span className="text-xs text-slate-500 font-normal">(Kebele / Sub-district)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ganda}
                    onChange={(e) => setFormData({ ...formData, ganda: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 15. Maqaa Haadhaa/Guddistuu */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    15. Maqaa Haadhaa / Guddistuu <span className="text-xs text-slate-500 font-normal">(Mother's / Guardian Name)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.maqaaHaadhaa}
                    onChange={(e) => setFormData({ ...formData, maqaaHaadhaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 16. Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>16. Lakkoofsa FAN <span className="text-xs text-slate-500 font-normal">(16-Digit FAN ID)</span></span>
                    <span className={`text-xs font-mono font-bold ${formData.fanId.trim().length === 16 && /^\d{16}$/.test(formData.fanId.trim()) ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formData.fanId.trim().toUpperCase() === 'NO' || formData.fanId.trim().length === 0 ? '(FAN Hin Qabu: "NO")' : `(${formData.fanId.trim().length} / 16 dijiitii)`}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.fanId}
                    onChange={(e) => setFormData({ ...formData, fanId: e.target.value })}
                    placeholder="Yoo qabaattan lakk. dijiitii 16 guutaa (Yoo hin qabne: NO)"
                    className={`w-full p-2.5 rounded-xl font-mono transition border-2 ${
                      formData.fanId.trim().length === 16 && /^\d{16}$/.test(formData.fanId.trim())
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-emerald-500 font-bold'
                        : formData.fanId.trim().toUpperCase() === 'NO' || formData.fanId.trim().length === 0
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-indigo-500 font-semibold'
                        : 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500 font-bold'
                    }`}
                  />
                  {formData.fanId.trim().length > 0 && formData.fanId.trim().toUpperCase() !== 'NO' && !/^\d{16}$/.test(formData.fanId.trim()) ? (
                    <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>
                        ⚠️ Yoo qabaattan lakk. dijiitii 16 guutaa! (Saa'aatti: {formData.fanId.trim().length} dijiitii).
                      </span>
                    </div>
                  ) : formData.fanId.trim().length === 16 && /^\d{16}$/.test(formData.fanId.trim()) ? (
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>✓ Lakkoofsa FAN dijiitii 16 ta'uun mirkanaa'eera.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Yoo qabaattan lakk. dijiitii 16 guutaa (Yoo hin qabne: "NO")</span>
                    </div>
                  )}
                  {activeEmisRecord && (
                    <div className="mt-1.5 p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 font-bold text-[11px] flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Ref: BSD file (Col AC: FAN ID - {formData.fanId})</span>
                    </div>
                  )}
                </div>

                {/* 17. Lakk. STUI Barataa (STU ID - 9 Digits Strict) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>17. Lakk. STUI Barataa <span className="text-xs text-slate-500 font-normal">(9-Digit STU ID)</span> *</span>
                    <span className={`text-xs font-mono font-bold ${isSTUIdValid(formData.nationalId) ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ({formData.nationalId.trim().replace(/\D/g, '').length} / 9 dijiitii)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="104125439"
                    className={`w-full p-2.5 rounded-xl font-mono transition border-2 ${
                      isSTUIdValid(formData.nationalId)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-emerald-500 font-bold'
                        : 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500 font-bold'
                    }`}
                  />
                  {!isSTUIdValid(formData.nationalId) ? (
                    <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>
                        ⚠️ Dogoggora: Lakk. STUI dijiitii 9 qofa ta'uu qaba! (Saa'aatti dijiitii {formData.nationalId.trim().replace(/\D/g, '').length} qaba). 8/gadi ykn 10/ol halluu diimaan ibsama!
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>✓ Lakk. STUI dijiitii 9 ta'uun mirkanaa'eera.</span>
                    </div>
                  )}
                  {activeEmisRecord && (
                    <div className="mt-1.5 p-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-950 font-bold text-[11px] flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Ref: SR file (Col A: STU ID - {formData.nationalId}, Col B: Maqaa - {formData.maqaaGuutuu})</span>
                    </div>
                  )}
                </div>

                {/* 18. Lakk Bilbila Barataa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    18. Lakk. Bilbila Barataa <span className="text-xs text-slate-500 font-normal">(Student Phone)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lakkBilbilaBarataa}
                    onChange={(e) => setFormData({ ...formData, lakkBilbilaBarataa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 19. Lakk Bilbila Maatii */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    19. Lakk. Bilbila Maatii <span className="text-xs text-slate-500 font-normal">(Parent Phone)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lakkBilbilaMaatii}
                    onChange={(e) => setFormData({ ...formData, lakkBilbilaMaatii: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 20. M/B Duraan Itti Barachaa Ture */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    20. M/B Duraan <span className="text-xs text-slate-500 font-normal">(Previous School Name)</span> *
                  </label>
                  {formData.haalaGalmee === 'Irra deebii mana barumsaa biroo' || formData.haalaGalmee === 'Mana barumsaa Biroo' ? (
                    <input
                      type="text"
                      required
                      value={formData.mbDuraan}
                      onChange={(e) => setFormData({ ...formData, mbDuraan: e.target.value })}
                      placeholder="Maqaa mana barumsaa duraan..."
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                    />
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={settings.savedSchoolName}
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* 21. Avireejjii Qabxii + Warning */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    21. Qabxii Avireejjii <span className="text-xs text-slate-500 font-normal">(Average Score %)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={formData.avireejjiiQabxii === '' ? '' : formData.avireejjiiQabxii}
                    onChange={(e) => handleScoreChange(e.target.value, false)}
                    placeholder="Fk. 80.0"
                    className={`w-full p-2.5 border rounded-xl font-bold ${
                      typeof formData.avireejjiiQabxii === 'number' && formData.avireejjiiQabxii < 50
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  {typeof formData.avireejjiiQabxii === 'number' && formData.avireejjiiQabxii < 50 && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      ⚠️ Qabxiin 50% gadi! Haalli galmee Irra deebii (kufe) ta'eera.
                    </p>
                  )}
                  {checkIsNationalExamGrade(formData.kutaa, activeEmisRecord) && (
                    <div className="mt-2 p-2.5 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 font-extrabold text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Qabxii ati galchitu kan qorumsa biyyaaleessati, malee Rosteera Mana barumsaa miti</span>
                    </div>
                  )}
                </div>

                {/* 22. Guyyaa Galmee */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">22. Guyyaa Galmee</label>
                  <input
                    type="date"
                    value={formData.guyyaaGalmee}
                    onChange={(e) => setFormData({ ...formData, guyyaaGalmee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                {/* 23. Barsiisaa Galmeessee */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">23. Barsiisaa Galmeessee</label>
                  <input
                    type="text"
                    value={formData.barsiisaaGalmeessee}
                    onChange={(e) => setFormData({ ...formData, barsiisaaGalmeessee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 24. Mana Barumsaa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    24. Mana Barumsaa <span className="text-xs text-slate-500 font-normal">(School Name)</span> *
                  </label>
                  <input
                    type="text"
                    required
                    list="registered-schools-list"
                    value={formData.manaBarumsaa}
                    onChange={(e) => setFormData({ ...formData, manaBarumsaa: e.target.value })}
                    placeholder="Maqaa Mana Barumsaa..."
                    className="w-full p-2.5 bg-indigo-50/70 border border-indigo-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="registered-schools-list">
                    {allSchools.map((s) => (
                      <option key={s} value={s} />
                    ))}
                    {settings.savedSchoolName && <option value={settings.savedSchoolName} />}
                  </datalist>
                </div>

              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Dhiisi (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Galmeessi (Save Student)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Feedback & Save-Next Modal */}
      {justAddedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Barataan Milkaa'inaan Galmaa'eera!
            </h3>
            <p className="text-xs text-slate-600">
              Barataa <strong className="text-indigo-600">{justAddedStudent.maqaaGuutuu}</strong> (Kutaa {justAddedStudent.kutaa} {justAddedStudent.daree}) milkaa'inaan save ta'eera.
            </p>

            <div className="p-3 bg-slate-50 border rounded-xl text-left text-xs space-y-1 font-mono text-slate-700">
              <div><strong>FAN ID:</strong> {justAddedStudent.fanId}</div>
              <div><strong>National ID:</strong> {justAddedStudent.nationalId}</div>
              <div><strong>Haala Galmee:</strong> {justAddedStudent.haalaGalmee}</div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleRegisterNextStudent}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Barataa Biraa Galmeessi (Register Next)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingStudent(justAddedStudent);
                    setJustAddedStudent(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Dogoggora Sirreessi (Edit)
                </button>
                <button
                  onClick={() => setJustAddedStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cufi (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <span>Odeeffannoo Barataa Gulaali (Edit Student)</span>
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs sm:text-sm">
              {editingStudent && (() => {
                const dupCheck = checkCurrentFormDuplicate(
                  editingStudent.maqaaGuutuu,
                  editingStudent.maqaaHaadhaa,
                  editingStudent.nationalId,
                  editingStudent.fanId,
                  editingStudent.id
                );
                if (!dupCheck.isDup) return null;
                return (
                  <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-lg border-2 border-rose-800 space-y-1.5 animate-pulse">
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                      <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
                      <span>🚨 WARNII: barataan kun duraan galmaa'e ture!</span>
                    </div>
                    <p className="text-xs text-rose-100 font-medium">
                      Barataan <strong>"{dupCheck.matchedStudent?.maqaaGuutuu}"</strong> (M/B: {dupCheck.matchedStudent?.manaBarumsaa}, Kutaa: {dupCheck.matchedStudent?.kutaa}) kuusaa ragaa keessatti duraan galmaa'ee jira! ({dupCheck.reason})
                    </p>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Maqaa Guutuu</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.maqaaGuutuu}
                    onChange={(e) => setEditingStudent({ ...editingStudent, maqaaGuutuu: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Koorniyaa</label>
                  <select
                    value={editingStudent.koorniyaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, koorniyaa: e.target.value as 'Dhiira' | 'Dhalaa' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Dhiira">Dhiira</option>
                    <option value="Dhalaa">Dhalaa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kutaa</label>
                  <select
                    value={editingStudent.kutaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, kutaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <optgroup label="Bu'uura Boruu (Umurii 4 - 6)">
                      <option value="bb_4">Umurii 4 (Bu'uura Boruu / Um4)</option>
                      <option value="bb_5">Umurii 5 (Bu'uura Boruu / Um5)</option>
                      <option value="bb_6">Umurii 6 (Bu'uura Boruu / Um6)</option>
                      <option value="0">Bu'uura Boruu (Waliigala / Grade 0)</option>
                    </optgroup>
                    <optgroup label="Kutaalee Primary & Secondary (1 - 12)">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                        <option key={g} value={g}>
                          Kutaa {g}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Daree</label>
                  <input
                    type="text"
                    value={editingStudent.daree}
                    onChange={(e) => setEditingStudent({ ...editingStudent, daree: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bara Dhalootaa</label>
                  <input
                    type="text"
                    value={editingStudent.baraDhalootaa}
                    onChange={(e) => handleBaraDhalootaaChange(e.target.value, true)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Umurii</label>
                  <input
                    type="number"
                    value={editingStudent.umurii}
                    onChange={(e) => setEditingStudent({ ...editingStudent, umurii: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Haala Galmee</label>
                  <select
                    value={editingStudent.haalaGalmee}
                    onChange={(e) => handleHaalaGalmeeChange(e.target.value, true)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {HAALA_GALMEE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {getHaalaGalmeeError(activeEmisRecord, editingStudent.avireejjiiQabxii, editingStudent.haalaGalmee) && (
                    <div className="mt-2 p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-950 font-black text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{getHaalaGalmeeError(activeEmisRecord, editingStudent.avireejjiiQabxii, editingStudent.haalaGalmee)}</span>
                    </div>
                  )}
                </div>

                {editingStudent.haalaGalmee.toLowerCase().includes('irra deebii') && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bara Irra Deebii</label>
                    <select
                      value={editingStudent.baraIrraDeebii || '2018'}
                      onChange={(e) => setEditingStudent({ ...editingStudent, baraIrraDeebii: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold"
                    >
                      {BARA_IRRA_DEEBII_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          Bara {y} E.C
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Haala Maatii</label>
                  <select
                    value={editingStudent.haalaMaatii}
                    onChange={(e) => setEditingStudent({ ...editingStudent, haalaMaatii: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {HAALA_MAATII_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Miidhama Qaamaa</label>
                  <select
                    value={editingStudent.miidhamaQaamaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, miidhamaQaamaa: e.target.value as 'Eeyyee' | 'Lakkii' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Lakkii">Lakkii</option>
                    <option value="Eeyyee">Eeyyee</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Gosa Miidhamaa</label>
                  {editingStudent.miidhamaQaamaa === 'Eeyyee' ? (
                    <select
                      value={editingStudent.gosaMiidhamaa || GOSA_MIIDHAMAA_OPTIONS[0]}
                      onChange={(e) => setEditingStudent({ ...editingStudent, gosaMiidhamaa: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-medium"
                    >
                      {GOSA_MIIDHAMAA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="N/A"
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-400"
                    />
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">M/B Duraan Itti Barachaa Ture</label>
                  {editingStudent.haalaGalmee === 'Irra deebii mana barumsaa biroo' || editingStudent.haalaGalmee === 'Mana barumsaa Biroo' ? (
                    <input
                      type="text"
                      required
                      value={editingStudent.mbDuraan}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mbDuraan: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-medium"
                    />
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={settings.savedSchoolName}
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Lakkoofsa FAN <span className="text-xs text-slate-500 font-normal">(16-Digit FAN ID)</span></span>
                    <span className={`text-xs font-mono font-bold ${editingStudent.fanId.trim().length === 16 && /^\d{16}$/.test(editingStudent.fanId.trim()) ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {editingStudent.fanId.trim().toUpperCase() === 'NO' || editingStudent.fanId.trim().length === 0 ? '(FAN Hin Qabu: "NO")' : `(${editingStudent.fanId.trim().length} / 16 dijiitii)`}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editingStudent.fanId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fanId: e.target.value })}
                    placeholder="Yoo qabaattan lakk. dijiitii 16 guutaa (Yoo hin qabne: NO)"
                    className={`w-full p-2.5 rounded-xl font-mono transition border-2 ${
                      editingStudent.fanId.trim().length === 16 && /^\d{16}$/.test(editingStudent.fanId.trim())
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-emerald-500 font-bold'
                        : editingStudent.fanId.trim().toUpperCase() === 'NO' || editingStudent.fanId.trim().length === 0
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-indigo-500 font-semibold'
                        : 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500 font-bold'
                    }`}
                  />
                  {editingStudent.fanId.trim().length > 0 && editingStudent.fanId.trim().toUpperCase() !== 'NO' && !/^\d{16}$/.test(editingStudent.fanId.trim()) ? (
                    <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>
                        ⚠️ Yoo qabaattan lakk. dijiitii 16 guutaa! (Saa'aatti: {editingStudent.fanId.trim().length} dijiitii).
                      </span>
                    </div>
                  ) : editingStudent.fanId.trim().length === 16 && /^\d{16}$/.test(editingStudent.fanId.trim()) ? (
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>✓ Lakkoofsa FAN dijiitii 16 ta'uun mirkanaa'eera.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Yoo qabaattan lakk. dijiitii 16 guutaa (Yoo hin qabne: "NO")</span>
                    </div>
                  )}
                </div>

                {/* Lakk. STUI Barataa (STU ID - 9 Digits Strict) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Lakk. STUI Barataa (STU ID) *</span>
                    <span className={`text-xs font-mono font-bold ${isSTUIdValid(editingStudent.nationalId) ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ({editingStudent.nationalId.trim().replace(/\D/g, '').length} / 9 dijiitii)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nationalId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })}
                    placeholder="STU104125439"
                    className={`w-full p-2.5 rounded-xl font-mono transition border-2 ${
                      isSTUIdValid(editingStudent.nationalId)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-emerald-500 font-bold'
                        : 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500 font-bold'
                    }`}
                  />
                  {!isSTUIdValid(editingStudent.nationalId) ? (
                    <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>
                        ⚠️ Dogoggora: Lakk. STUI dijiitii 9 qofa ta'uu qaba! (Saa'aatti dijiitii {editingStudent.nationalId.trim().replace(/\D/g, '').length} qaba). 8/gadi ykn 10/ol halluu diimaan ibsama!
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>✓ Lakk. STUI dijiitii 9 ta'uun mirkanaa'eera.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Godina (Zone)</label>
                  <input
                    type="text"
                    value={editingStudent.godina}
                    onChange={(e) => setEditingStudent({ ...editingStudent, godina: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aanaa (Woreda)</label>
                  <input
                    type="text"
                    value={editingStudent.aanaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, aanaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ganda</label>
                  <input
                    type="text"
                    value={editingStudent.ganda}
                    onChange={(e) => setEditingStudent({ ...editingStudent, ganda: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Mana Barumsaa (School Name)</label>
                  <input
                    type="text"
                    list="edit-schools-list"
                    value={editingStudent.manaBarumsaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, manaBarumsaa: e.target.value })}
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-300 rounded-xl font-bold text-slate-900"
                  />
                  <datalist id="edit-schools-list">
                    {allSchools.map((s) => (
                      <option key={s} value={s} />
                    ))}
                    {settings.savedSchoolName && <option value={settings.savedSchoolName} />}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qabxii Avireejjii (%)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={editingStudent.avireejjiiQabxii === '' ? '' : editingStudent.avireejjiiQabxii}
                    onChange={(e) => handleScoreChange(e.target.value, true)}
                    placeholder="Fk. 80.0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                  {checkIsNationalExamGrade(editingStudent.kutaa, activeEmisRecord) && (
                    <div className="mt-2 p-2.5 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 font-extrabold text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Qabxii ati galchitu kan qorumsa biyyaaleessati, malee Rosteera Mana barumsaa miti</span>
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Dhiisi
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Gulaalcha Ol-ka'i (Update Student)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Odeeffannoo Guutuu Barataa (24 Columns)</span>
              </h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-[10px] text-indigo-600 font-bold">1. Maqaa Guutuu Barataa</p>
                <p className="text-lg font-bold text-slate-900">{viewingStudent.maqaaGuutuu}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">2. Koorniyaa</span><span className="font-bold">{viewingStudent.koorniyaa}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">3 & 4. Kutaa / Daree</span><span className="font-bold">Kutaa {viewingStudent.kutaa} ({viewingStudent.daree})</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">5. Bara Dhalootaa</span><span className="font-bold font-mono">{viewingStudent.baraDhalootaa}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">6. Umurii</span><span className="font-bold">{viewingStudent.umurii} yr</span></div>
                <div className="p-2 bg-slate-50 rounded-lg sm:col-span-2"><span className="text-slate-400 block">7. Haala Galmee</span><span className="font-bold text-indigo-700">{viewingStudent.haalaGalmee}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">8. Bara Addaan/Irra Deebii</span><span className="font-bold">{viewingStudent.baraIrraDeebii || viewingStudent.baraAddaanKute || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">9. Haala Maatii</span><span className="font-bold">{viewingStudent.haalaMaatii}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">10. Miidhama Qaamaa</span><span className="font-bold">{viewingStudent.miidhamaQaamaa}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg sm:col-span-2"><span className="text-slate-400 block">11. Gosa Miidhamaa</span><span className="font-bold text-amber-800">{viewingStudent.gosaMiidhamaa || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">12. Godina</span><span className="font-bold">{viewingStudent.godina}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">13. Aanaa</span><span className="font-bold">{viewingStudent.aanaa}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">14. Ganda</span><span className="font-bold">{viewingStudent.ganda}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">15. Maqaa Haadhaa</span><span className="font-bold">{viewingStudent.maqaaHaadhaa || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">16. FAN ID</span><span className="font-mono font-bold text-indigo-600">{viewingStudent.fanId}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">17. National ID</span><span className="font-mono font-bold text-indigo-600">{viewingStudent.nationalId}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">18. Bilbila Barataa</span><span className="font-mono">{viewingStudent.lakkBilbilaBarataa || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">19. Bilbila Maatii</span><span className="font-mono">{viewingStudent.lakkBilbilaMaatii || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg sm:col-span-2"><span className="text-slate-400 block">20. M/B Duraan Itti Barachaa Ture</span><span className="font-bold text-amber-700">{viewingStudent.mbDuraan}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">21. Qabxii Avireejjii</span><span className="font-extrabold text-emerald-600">{viewingStudent.avireejjiiQabxii}%</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">22. Guyyaa Galmee</span><span className="font-bold font-mono">{viewingStudent.guyyaaGalmee}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">23. Barsiisaa Galmeessee</span><span className="font-bold">{viewingStudent.barsiisaaGalmeessee}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">24. Mana Barumsaa</span><span className="font-bold">{viewingStudent.manaBarumsaa}</span></div>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Cufi (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Barattoota {selectedStudentIds.length} Balleessi</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              Dhugauma barattoota filataman <strong>{selectedStudentIds.length}</strong> galmee irraa haquu ni barbaaddaa? Tarkaanfiin kun koodii fi kuusaa irraa haqa.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition"
              >
                Dhiisi (Cancel)
              </button>
              <button
                onClick={() => {
                  if (onDeleteStudentsByIDs) {
                    onDeleteStudentsByIDs(selectedStudentIds);
                  } else {
                    selectedStudentIds.forEach((id) => onDeleteStudent(id));
                  }
                  setSelectedStudentIds([]);
                  setShowBatchDeleteModal(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eeyyee, Balleessi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Barataa Haquu Mirkanaaffadhu</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Dhugauma barataa kana galmee irraa haquu ni barbaaddaa? Action kun deebi'ee hin argamu.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Dhiisi
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deletingId);
                  setDeletingId(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Eeyyee, Haqi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
