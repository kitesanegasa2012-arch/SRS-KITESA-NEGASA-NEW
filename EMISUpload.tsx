import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, EMISStudent } from '../types';
import { exportToCSV } from '../utils/storage';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Database,
  Search,
  Download,
  Eye,
  Edit2,
  X,
  Filter,
  Sparkles,
  FolderOpen,
  Printer,
  ArrowRightLeft,
  ShieldAlert,
} from 'lucide-react';

interface EMISUploadProps {
  appStudents: Student[];
  emisRecords: EMISStudent[];
  onSaveEmisRecords: (records: EMISStudent[]) => void;
  onAddMultipleStudents: (newStudents: Student[]) => void;
  onUpdateMultipleStudents?: (updatedStudents: Student[]) => void;
  onDeleteStudentsByIDs?: (studentIds: string[]) => void;
}

// Helper to format Bara Dhalootaa to YYYY-MM-DD (e.g., 2012-01-25)
export const formatToYYYYMMDD = (rawDateStr: string | number | undefined | null): string => {
  if (!rawDateStr) return '2012-01-25';
  const str = String(rawDateStr).trim();
  if (!str || str === '-' || str === 'NO') return '2012-01-25';

  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // YYYY/MM/DD or YYYY.MM.DD or YYYY-M-D
  const ymd = str.match(/^(\d{4})[/\.\-s](\d{1,2})[/\.\-s](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/\.\-s](\d{1,2})[/\.\-s](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  // Excel serial date number (e.g., 40933 => 2012-01-25)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const jsDate = new Date((num - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) {
      const y = jsDate.getFullYear();
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const d = String(jsDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Pure 4-digit year like "2012"
  const yrMatch = str.match(/\b(19\d\d|20\d\d)\b/);
  if (yrMatch) {
    return `${yrMatch[1]}-01-25`;
  }

  return '2012-01-25';
};

// Auto-calculate Umurii (Age) by subtracting birth year from Ethiopian academic year 2019 (2019 - birthYear)
export const calculateUmuriiFromDOB = (dobStr: string | undefined | null): number => {
  const formatted = formatToYYYYMMDD(dobStr);
  const birthYearMatch = formatted.match(/^(\d{4})/);
  const birthYear = birthYearMatch ? parseInt(birthYearMatch[1], 10) : 2012;
  // Ethiopian academic calendar reference year (2019 E.C.)
  const currentYear = 2019;
  const age = currentYear - birthYear;
  return Math.max(3, Math.min(35, age));
};

// Guarantee every student has a valid 9-digit STU ID (never '-' or 'NO')
export const ensureValidSTUID = (stuiRaw: string | undefined | null, name: string, index: number = 0): string => {
  if (stuiRaw && stuiRaw !== '-' && stuiRaw !== 'NO' && stuiRaw !== 'STU ID' && !stuiRaw.startsWith('STU-EMIS')) {
    const digits = stuiRaw.replace(/\D/g, '');
    if (digits.length === 9) return digits;
    if (stuiRaw.trim().length >= 6) return stuiRaw.trim();
  }
  // Generate deterministic 9-digit STU ID based on name hash + index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash + index * 1009) % 900000 + 100000;
  return `104${posHash}`;
};

export const EMISUpload: React.FC<EMISUploadProps> = ({
  appStudents,
  emisRecords,
  onSaveEmisRecords,
  onAddMultipleStudents,
  onDeleteStudentsByIDs,
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const bsdInputRef = useRef<HTMLInputElement | null>(null);
  const srInputRef = useRef<HTMLInputElement | null>(null);
  const seInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
    recordCount?: number;
  }>({
    type: 'idle',
    message: '',
  });

  // Modal State for Viewing Uploaded EMIS Database Repository
  const [isRepositoryOpen, setIsRepositoryOpen] = useState<boolean>(false);
  const [repoViewTab, setRepoViewTab] = useState<'table' | 'excel'>('table');
  const [repoSearch, setRepoSearch] = useState<string>('');
  const [repoGradeFilter, setRepoGradeFilter] = useState<string>('ALL');
  const [repoGenderFilter, setRepoGenderFilter] = useState<string>('ALL');
  const [recentParsedItems, setRecentParsedItems] = useState<EMISStudent[]>([]);

  // View & Edit EMIS Record Modals
  const [viewingEmisRecord, setViewingEmisRecord] = useState<EMISStudent | null>(null);
  const [editingEmisRecord, setEditingEmisRecord] = useState<EMISStudent | null>(null);

  const handleSaveEmisRecordEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmisRecord) return;
    if (!window.confirm(`Mirkaneessaa: Ragaa EMIS barataa '${editingEmisRecord.maqaaGuutuu}' fooyyessuu (Save Edit) ni barbaaddaa?`)) {
      return;
    }
    const updatedList = emisRecords.map((r) => {
      if (
        (r.nationalId && r.nationalId === editingEmisRecord.nationalId) ||
        (r.maqaaGuutuu === editingEmisRecord.maqaaGuutuu && r.fanId === editingEmisRecord.fanId)
      ) {
        return editingEmisRecord;
      }
      return r;
    });
    onSaveEmisRecords(updatedList);
    setEditingEmisRecord(null);
    alert("✓ Ragaan EMIS fooyya'eera!");
  };

  // Permission / Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'inAppOnly' | 'emisSynced' | 'clearEmisDb' | 'singleAppStudent' | 'singleEmisRecord' | 'singleFile';
    title: string;
    description: string;
    targetId?: string;
    targetName?: string;
    targetRecord?: EMISStudent;
    targetFileName?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'inAppOnly',
    title: '',
    description: '',
  });

  // Helper to import ALL EMIS uploaded records directly to the Main App student registration list
  const handleImportAllEmisToApp = () => {
    if (emisRecords.length === 0) {
      alert("Dogoggora: Ragaan EMIS ol-fe'ame kuusaa keessatti hin argamne!");
      return;
    }

    const newStudents: Student[] = emisRecords.map((e, idx) => ({
      id: e.nationalId && e.nationalId !== '-' ? e.nationalId : `STU-EMIS-${Date.now()}-${idx}`,
      maqaaGuutuu: e.maqaaGuutuu,
      koorniyaa: (e.koorniyaa === 'Dhalaa' ? 'Dhalaa' : 'Dhiira') as 'Dhiira' | 'Dhalaa',
      kutaa: e.kutaa || '1',
      daree: e.daree || 'A',
      baraDhalootaa: String(e.baraDhalootaa || '2012'),
      umurii: Number(e.umurii) || 7,
      haalaGalmee: 'Haaraa',
      haalaMaatii: e.haalaMaatii || 'Lachuu qabaa',
      miidhamaQaamaa: (e.miidhamaQaamaa === 'Eeyyee' ? 'Eeyyee' : 'Lakkii') as 'Eeyyee' | 'Lakkii',
      gosaMiidhamaa: e.gosaMiidhamaa || '',
      godina: e.godina || '',
      aanaa: e.aanaa || '',
      ganda: e.ganda || '',
      maqaaHaadhaa: e.maqaaHaadhaa || '',
      fanId: e.fanId && e.fanId.trim() !== '' ? e.fanId : 'NO',
      nationalId: e.nationalId || '-',
      lakkBilbilaBarataa: e.lakkBilbilaBarataa || '',
      lakkBilbilaMaatii: e.lakkBilbilaMaatii || '',
      mbDuraan: e.mbDuraan || 'EMIS Roster',
      avireejjiiQabxii: Number(e.avireejjiiQabxii) || 80,
      guyyaaGalmee: new Date().toLocaleDateString('en-GB'),
      barsiisaaGalmeessee: 'EMIS Sync',
      manaBarumsaa: e.manaBarumsaa || e.schoolName || 'Mana Barumsaa',
    }));

    onAddMultipleStudents(newStudents);
    setUploadStatus({
      type: 'success',
      message: `✓ Tokko tokkoon ragaalee barattootaa ${newStudents.length} EMIS irraa gara Galmee App-tti milka'inaan dabalaman!`,
      recordCount: newStudents.length,
    });
  };

  const handlePrintEMISData = () => {
    if (emisRecords.length === 0) {
      alert("Dogoggora: Ragaan EMIS ol-fe'ame kuusaa keessatti hin argamne!");
      return;
    }
    window.print();
  };

  // Helper to detect binary garbage text from corrupted sheet parses
  const isGarbageText = (str: string) => {
    if (!str) return false;
    return (
      str.startsWith('~PK!') ||
      str.includes('xl/worksheets') ||
      str.includes('[Content_Types]') ||
      str.includes('.xml') ||
      str.includes('rels') ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str)
    );
  };

  // Helper to extract Grade/Kutaa (0-12, where 0 = Bu'uura Boruu) accurately from row cells, sheet name, or file name
  const extractGradeFromRowAndContext = (row: any[], sheetName: string, fileName: string): string => {
    const context = `${fileName} ${sheetName}`.toLowerCase();
    
    // Check for Bu'uura Boruu (Grade 0)
    if (
      context.includes('buuura') ||
      context.includes('boruu') ||
      context.includes('borru') ||
      context.includes('pre-primary') ||
      context.includes('kg') ||
      context.includes('kutaa 0') ||
      context.includes('grade 0')
    ) {
      return '0';
    }

    // 1. Check row cells for explicit Grade/Kutaa pattern (e.g. "Kutaa 2", "Grade 9", "Kutaa 0", "Grade 0", "Bu'uura Boruu")
    for (const cell of row) {
      const s = String(cell || '').trim().toLowerCase();
      if (s.includes('buuura') || s.includes('boruu') || s.includes('borru')) return '0';
      const match = s.match(/(?:kutaa|grade|gr)\.?\s*([0-9]|1[0-2])\b/i);
      if (match) return match[1];
    }

    // 2. Check sheetName & fileName for "Grade 2", "Grade 9", "Kutaa 1", "G1", "G2", "G10", "G9", "K1", "K2", etc.
    const contextMatch = context.match(/(?:grade|kutaa|gr|g)[_\s\-]*([0-9]|1[0-2])\b/i);
    if (contextMatch) return contextMatch[1];

    // 3. Check for standalone numbers 0-12 in sheet name if sheet name is e.g. "0", "1", "2", "9", "10"
    if (/^([0-9]|1[0-2])$/.test(sheetName.trim())) return sheetName.trim();

    // 4. Check row cells for standalone number 0-12 (skip index 0 which is serial no)
    for (let i = 1; i < Math.min(row.length, 12); i++) {
      const val = String(row[i] || '').trim();
      if (/^([0-9]|1[0-2])$/.test(val)) {
        return val;
      }
    }

    return '1';
  };

  // Helper to parse individual BSD or SR or SE or CSV file arrayBuffer using SheetJS (xlsx)
  const parseEMISArrayBuffer = (file: File, buffer: ArrayBuffer, forcedMode?: 'BSD' | 'SR' | 'SE'): EMISStudent[] => {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) return [];

      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) return [];

      const fileNameUpper = file.name.toUpperCase();
      const isBSDFile = forcedMode === 'BSD' || fileNameUpper.includes('BSD') || fileNameUpper.includes('BASIC');
      const isSRFile = forcedMode === 'SR' || fileNameUpper.includes('SR') || fileNameUpper.includes('RESULT');
      const isSEFile = forcedMode === 'SE' || fileNameUpper.includes('SE') || fileNameUpper.includes('ENROLLMENT');

      const parsedRecords: EMISStudent[] = [];

      // Detect row start: Student records start from Excel Row 3 (index 2)
      const firstRowStr = (rawRows[0] || []).map((c) => String(c).toLowerCase()).join(' ');
      const secondRowStr = (rawRows[1] || []).map((c) => String(c).toLowerCase()).join(' ');
      
      const isHeaderRowStr = (str: string) =>
        str.includes('maqaa') ||
        str.includes('stui') ||
        str.includes('student') ||
        str.includes('kutaa') ||
        str.includes('name') ||
        str.includes('gender') ||
        str.includes('basic') ||
        str.includes('result') ||
        str.includes('enrollment') ||
        str.includes('s.n') ||
        str.includes('lakk');

      let startIndex = 0;
      if (rawRows.length >= 3 && (isHeaderRowStr(firstRowStr) || isHeaderRowStr(secondRowStr))) {
        startIndex = 2; // Start from Row 3 (index 2) as student data begins on Row 3
      } else if (rawRows.length >= 2 && isHeaderRowStr(firstRowStr)) {
        startIndex = 1;
      }

      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length < 2) continue;

        const colStr = (cIdx: number) => String(row[cIdx] || '').trim();

        // Skip header rows if encountered during iteration
        const currentRowJoined = row.map((c) => String(c).toLowerCase()).join(' ');
        if (
          currentRowJoined.includes('maqaa barataa') ||
          currentRowJoined.includes('stui barataa') ||
          currentRowJoined.includes('basic student data') ||
          currentRowJoined.includes('student results') ||
          currentRowJoined.includes('student enrollment') ||
          currentRowJoined.includes('qabxii avg')
        ) {
          continue;
        }

        // Skip rows containing raw unparsed binary / XML zip headers
        if (isGarbageText(colStr(0)) || isGarbageText(colStr(1)) || isGarbageText(colStr(2))) {
          continue;
        }

        // Check if row is SE (Student Enrollment: Col A = STU ID, Col B = Maqaa, Col C = Haala Galmee, Col E = Grade)
        const isSERow =
          forcedMode === 'SE' ||
          (forcedMode !== 'BSD' && forcedMode !== 'SR' && (
            isSEFile ||
            currentRowJoined.includes('haaraa') ||
            currentRowJoined.includes('irra deebii') ||
            (colStr(2).toLowerCase().includes('haaraa') || colStr(2).toLowerCase().includes('irra'))
          ));

        if (isSERow) {
          // SE Format (Student Enrollment):
          // Col A (0) = STU ID barataa bu'uura boruu
          // Col B (1) = Maqaa Guutuu
          // Col C (2) = Haala Galmee
          // Col D (3) = Saala / Umurii
          // Col E (4) = Grade Level (Kutaa 0 / Bu'uura Boruu, 1-12)
          // Col F (5) = Section / Daree (A, B, C, D, etc.)
          const stuiRaw = colStr(0) || '-';
          const nameVal = colStr(1) || 'Barataa Bu\'uura Boruu';
          const haalaGalmee = colStr(2) || 'Haaraa';

          // Explicitly read Column E (index 4) for Grade Level (Bu'uura Boruu '0' up to Grade 12)
          const rawColE = (colStr(4) || colStr(3) || '').trim();
          let kutaaClean = '0'; // Default for SE / Bu'uura Boruu is Grade 0 ('0')

          if (rawColE) {
            const lowerColE = rawColE.toLowerCase();
            if (
              lowerColE === '0' ||
              lowerColE.includes('0') ||
              lowerColE.includes('buuura') ||
              lowerColE.includes('borru') ||
              lowerColE.includes('bb') ||
              lowerColE.includes('kg') ||
              lowerColE.includes('pre')
            ) {
              kutaaClean = '0';
            } else {
              const digitMatch = rawColE.match(/\b([0-9]|1[0-2])\b/);
              if (digitMatch) {
                kutaaClean = digitMatch[1];
              } else {
                kutaaClean = extractGradeFromRowAndContext(row, firstSheetName, file.name) || '0';
              }
            }
          } else {
            kutaaClean = extractGradeFromRowAndContext(row, firstSheetName, file.name) || '0';
          }

          // Read Column F (index 5) for Section / Daree
          const rawColF = colStr(5);
          let dareeClean = 'A';
          if (rawColF) {
            const cleanD = rawColF
              .replace(/section/i, '')
              .replace(/daree/i, '')
              .replace(/daraa/i, '')
              .trim()
              .toUpperCase();
            if (cleanD) {
              dareeClean = cleanD;
            }
          }

          // Check gender in Col D/C/row
          let gender: 'Dhiira' | 'Dhalaa' = 'Dhiira';
          const genderCandidate = (colStr(3) + ' ' + colStr(2) + ' ' + colStr(6)).toLowerCase();
          if (
            genderCandidate.includes('dhalaa') ||
            genderCandidate.includes('female') ||
            genderCandidate.includes(' f ') ||
            genderCandidate.endsWith(' f') ||
            genderCandidate.startsWith('f ') ||
            genderCandidate === 'f'
          ) {
            gender = 'Dhalaa';
          }

          // Check age/umurii (4, 5, or 6)
          let ageVal = 5;
          const ageMatch = (colStr(3) + ' ' + rawColE).match(/\b([4-6])\b/);
          if (ageMatch) {
            ageVal = parseInt(ageMatch[1]);
          }
          const dobVal = formatToYYYYMMDD(String(2026 - ageVal));
          const stuiValid = ensureValidSTUID(stuiRaw, nameVal, parsedRecords.length);

          parsedRecords.push({
            nationalId: stuiValid,
            fanId: 'NO',
            maqaaGuutuu: nameVal,
            koorniyaa: gender,
            kutaa: kutaaClean,
            daree: dareeClean,
            baraDhalootaa: dobVal,
            umurii: ageVal,
            avireejjiiQabxii: 'NO',
            haalaMaatii: 'Lachuu qabaa',
            godina: '',
            aanaa: '',
            ganda: '',
            fileSource: 'SE',
            fileName: file.name,
          });
        } else {
          // Check if row is SR (Student Result) or BSD (Basic Student Data)
          const isSRRow =
            forcedMode === 'SR' ||
            (forcedMode !== 'BSD' && (
              isSRFile ||
              colStr(0).toUpperCase().startsWith('STUI') ||
              colStr(0).toUpperCase().startsWith('STU') ||
              (firstRowStr.includes('stui') && firstRowStr.includes('kutaa'))
            ));

        if (isSRRow) {
          // SR Format: Col A = STU ID, Col B = Maqaa Guutuu, Col C = Kutaa, Col D = Qabxii Avg
          const stuiRaw = colStr(0) || '-';
          const nameVal = (colStr(1) && !/^\d{16}$/.test(colStr(1)))
            ? colStr(1)
            : (colStr(0) && isNaN(Number(colStr(0))) && !colStr(0).startsWith('STU') ? colStr(0) : `Barataa EMIS (${stuiRaw})`);
          
          const kutaaRaw = colStr(2) || colStr(1) || '1';
          const kutaaClean = extractGradeFromRowAndContext(row, firstSheetName, file.name) || kutaaRaw.replace(/\D/g, '') || '1';

          // Col D (index 3) = Qabxii Avg
          const scoreRaw = colStr(3);
          let scoreVal: number | string = 'NO';
          if (
            scoreRaw &&
            scoreRaw.trim() !== '' &&
            scoreRaw.trim() !== '-' &&
            scoreRaw.toUpperCase() !== 'NO' &&
            scoreRaw.toUpperCase() !== 'N/A' &&
            scoreRaw.toUpperCase() !== 'NULL'
          ) {
            const cleanScore = scoreRaw.replace('%', '').trim();
            const parsedNum = parseFloat(cleanScore);
            if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 100) {
              scoreVal = parsedNum;
            } else {
              scoreVal = 'NO';
            }
          } else {
            scoreVal = 'NO';
          }

          const dobVal = formatToYYYYMMDD('2012');
          const stuiValid = ensureValidSTUID(stuiRaw, nameVal, parsedRecords.length);

          parsedRecords.push({
            nationalId: stuiValid,
            fanId: 'NO',
            maqaaGuutuu: nameVal,
            koorniyaa: 'Dhiira',
            kutaa: kutaaClean,
            daree: 'A',
            baraDhalootaa: dobVal,
            umurii: calculateUmuriiFromDOB(dobVal),
            avireejjiiQabxii: scoreVal,
            godina: '',
            aanaa: '',
            ganda: '',
            fileSource: 'SR',
            fileName: file.name,
          });
        } else if (isBSDFile || row.length >= 5) {
          // BSD Format: Col C (2) = First Name, Col D (3) = Father Name, Col E (4) = Grandfather Name, Col G (6) = Saala (M/F), Col J (9) = Bara Dhalootaa, Col AC (28) = FAN ID (16 digits)
          const firstName = colStr(2);
          const fatherName = colStr(3);
          const grandFatherName = colStr(4);

          let fullName = [firstName, fatherName, grandFatherName].filter(Boolean).join(' ');
          if (!fullName || fullName.length < 2) {
            fullName = colStr(1) || colStr(0) || 'Barataa EMIS';
          }

          // Col G (index 6) = Saala (Gender)
          const genderRaw = colStr(6);
          let gender: 'Dhiira' | 'Dhalaa' = 'Dhiira';
          const gLower = genderRaw.toLowerCase().trim();
          if (
            gLower === 'f' ||
            gLower.startsWith('female') ||
            gLower.startsWith('dhalaa') ||
            gLower.startsWith('w') ||
            gLower.startsWith('v') ||
            gLower.includes('female') ||
            gLower.includes('dhalaa')
          ) {
            gender = 'Dhalaa';
          } else if (
            gLower === 'm' ||
            gLower.startsWith('male') ||
            gLower.startsWith('dhiira') ||
            gLower.startsWith('d') ||
            gLower.includes('male') ||
            gLower.includes('dhiira')
          ) {
            gender = 'Dhiira';
          } else {
            // Check row cells if col 6 didn't have explicit gender string
            const cellVal = row.find((c) => {
              const s = String(c).trim().toLowerCase();
              return s === 'm' || s === 'f' || s === 'male' || s === 'female' || s === 'dhiira' || s === 'dhalaa';
            });
            if (cellVal) {
              const s = String(cellVal).trim().toLowerCase();
              gender = (s === 'f' || s === 'female' || s === 'dhalaa') ? 'Dhalaa' : 'Dhiira';
            }
          }

          const miidhamaRaw = colStr(7) || 'Lakkii';
          const miidhamaQaamaa =
            miidhamaRaw.toLowerCase().startsWith('e') || miidhamaRaw.toLowerCase().startsWith('y')
              ? 'Eeyyee'
              : 'Lakkii';
          const gosaMiidhamaa = colStr(8);

          // Col J (index 9) = Bara Dhalootaa (Birth Date YYYY-MM-DD / Year)
          const birthDateRaw = colStr(9) || colStr(8) || colStr(10) || colStr(5) || '2012';
          const formattedDOB = formatToYYYYMMDD(birthDateRaw);
          const ageVal = calculateUmuriiFromDOB(formattedDOB);

          const godina = colStr(16) || colStr(9) || '';
          const aanaa = colStr(17) || colStr(10) || '';
          const ganda = colStr(18) || colStr(11) || '';
          const haalaMaatii = colStr(21) || 'Lachuu qabaa';

          // STU ID column check if present, otherwise ensureValidSTUID
          const stuiClean = ensureValidSTUID(colStr(0), fullName, parsedRecords.length);

          // Col AC (index 28) = FAN ID (16 digits)
          let fanIdClean = 'NO';
          const colACVal = colStr(28);
          if (colACVal && !colACVal.toLowerCase().includes('fan') && !isGarbageText(colACVal)) {
            fanIdClean = colACVal;
          } else {
            const sixteenDigitCell = row.find((c) => /^\d{16}$/.test(String(c).trim()));
            if (sixteenDigitCell) {
              fanIdClean = String(sixteenDigitCell).trim();
            }
          }

          parsedRecords.push({
            nationalId: stuiClean,
            fanId: fanIdClean,
            maqaaGuutuu: fullName,
            koorniyaa: gender,
            kutaa: extractGradeFromRowAndContext(row, firstSheetName, file.name),
            daree: 'A',
            baraDhalootaa: formattedDOB,
            umurii: ageVal,
            avireejjiiQabxii: 'NO',
            godina,
            aanaa,
            ganda,
            haalaMaatii,
            miidhamaQaamaa: miidhamaQaamaa as 'Eeyyee' | 'Lakkii',
            gosaMiidhamaa,
            fileSource: 'BSD',
            fileName: file.name,
          });
        } else {
          // Fallback simple parser (Non-SR, BSD mode)
          const name = colStr(2) || colStr(0) || 'Barataa EMIS';
          const stuiClean = ensureValidSTUID(colStr(0), name, parsedRecords.length);

          let fanIdClean = 'NO';
          const colACVal = colStr(28);
          if (colACVal && !colACVal.toLowerCase().includes('fan') && !isGarbageText(colACVal)) {
            fanIdClean = colACVal;
          } else {
            const sixteenDigitCell = row.find((c) => /^\d{16}$/.test(String(c).trim()));
            if (sixteenDigitCell) {
              fanIdClean = String(sixteenDigitCell).trim();
            }
          }

          const formattedDOB = formatToYYYYMMDD(colStr(6));

          parsedRecords.push({
            nationalId: stuiClean,
            fanId: fanIdClean,
            maqaaGuutuu: name,
            koorniyaa: colStr(3).toLowerCase().startsWith('d') ? 'Dhiira' : 'Dhalaa',
            kutaa: colStr(4) || '1',
            daree: colStr(5) || 'A',
            baraDhalootaa: formattedDOB,
            umurii: calculateUmuriiFromDOB(formattedDOB),
            avireejjiiQabxii: 'NO',
            godina: colStr(9) || '',
            aanaa: colStr(10) || '',
            ganda: colStr(11) || '',
            fileSource: 'BSD',
            fileName: file.name,
          });
        }
      }
    }

      return parsedRecords;
    } catch (err) {
      console.error('Error parsing file with XLSX:', err);
      return [];
    }
  };

  // Helper to merge EMIS records by STU ID, FAN ID, or Student Full Name
  const mergeEMISLists = (existing: EMISStudent[], incoming: EMISStudent[]): EMISStudent[] => {
    const list = [...existing];
    const cleanName = (n: string) => (n || '').trim().replace(/\s+/g, ' ').toLowerCase();

    incoming.forEach((item) => {
      const itemSTU = item.nationalId && item.nationalId !== '-' && !item.nationalId.startsWith('STU-EMIS') ? item.nationalId.trim().toLowerCase() : null;
      const itemFAN = item.fanId && item.fanId !== 'NO' && /^\d{16}$/.test(item.fanId.trim()) ? item.fanId.trim() : null;
      const itemName = cleanName(item.maqaaGuutuu);

      const idx = list.findIndex((e) => {
        const eSTU = e.nationalId && e.nationalId !== '-' && !e.nationalId.startsWith('STU-EMIS') ? e.nationalId.trim().toLowerCase() : null;
        const eFAN = e.fanId && e.fanId !== 'NO' && /^\d{16}$/.test(e.fanId.trim()) ? e.fanId.trim() : null;
        const eName = cleanName(e.maqaaGuutuu);

        if (itemSTU && eSTU && itemSTU === eSTU) return true;
        if (itemFAN && eFAN && itemFAN === eFAN) return true;
        if (itemName && eName && itemName === eName) return true;
        if (itemName.length > 5 && eName.length > 5 && (itemName.startsWith(eName) || eName.startsWith(itemName))) return true;
        return false;
      });

      if (idx !== -1) {
        const prev = list[idx];

        const hasBsd = prev.fileSource?.includes('BSD') || item.fileSource?.includes('BSD');
        const hasSr = prev.fileSource?.includes('SR') || item.fileSource?.includes('SR');
        let newSource: 'BSD' | 'SR' | 'Merged BSD & SR' = 'Merged BSD & SR';
        if (hasBsd && hasSr) {
          newSource = 'Merged BSD & SR';
        } else if (hasBsd) {
          newSource = 'BSD';
        } else if (hasSr) {
          newSource = 'SR';
        }

        const bsdRec = item.fileSource === 'BSD' ? item : (prev.fileSource === 'BSD' || prev.fileSource === 'Merged BSD & SR' ? prev : null);
        const srRec = item.fileSource === 'SR' ? item : (prev.fileSource === 'SR' || prev.fileSource === 'Merged BSD & SR' ? prev : null);

        const dobRaw = bsdRec?.baraDhalootaa || prev.baraDhalootaa || item.baraDhalootaa;
        const formattedDOB = formatToYYYYMMDD(dobRaw);

        list[idx] = {
          ...prev,
          ...item,
          // Full name from BSD or SR
          maqaaGuutuu: bsdRec?.maqaaGuutuu || prev.maqaaGuutuu || item.maqaaGuutuu,

          // STU ID strictly from SR Column A (if available) or ensureValidSTUID
          nationalId: (srRec?.nationalId && srRec.nationalId !== '-' && !srRec.nationalId.startsWith('STU-EMIS'))
            ? srRec.nationalId
            : (item.nationalId && item.nationalId !== '-' ? item.nationalId : prev.nationalId || '-'),

          // FAN ID strictly from BSD Column AC (16 digits)
          fanId: (bsdRec?.fanId && bsdRec.fanId !== 'NO')
            ? bsdRec.fanId
            : (item.fanId && item.fanId !== 'NO' ? item.fanId : prev.fanId || 'NO'),

          // Gender strictly from BSD Column G
          koorniyaa: bsdRec?.koorniyaa || prev.koorniyaa || item.koorniyaa || 'Dhiira',

          // Kutaa (Grade) strictly from SR or BSD or item
          kutaa: srRec?.kutaa || bsdRec?.kutaa || item.kutaa || prev.kutaa || '1',

          // Qabxii Avg strictly from SR Column D
          avireejjiiQabxii: (srRec?.avireejjiiQabxii !== undefined && srRec.avireejjiiQabxii !== 'NO' && srRec.avireejjiiQabxii !== '')
            ? srRec.avireejjiiQabxii
            : ((item.avireejjiiQabxii !== undefined && item.avireejjiiQabxii !== 'NO' && item.avireejjiiQabxii !== '')
                ? item.avireejjiiQabxii
                : ((prev.avireejjiiQabxii !== undefined && prev.avireejjiiQabxii !== 'NO')
                    ? prev.avireejjiiQabxii
                    : 'NO')),

          // Birth Year / Date strictly from BSD Column J formatted as YYYY-MM-DD
          baraDhalootaa: formattedDOB,
          umurii: calculateUmuriiFromDOB(formattedDOB),

          // Address & demographic info from BSD
          godina: bsdRec?.godina || prev.godina || item.godina,
          aanaa: bsdRec?.aanaa || prev.aanaa || item.aanaa,
          ganda: bsdRec?.ganda || prev.ganda || item.ganda,
          haalaMaatii: bsdRec?.haalaMaatii || prev.haalaMaatii || item.haalaMaatii,
          miidhamaQaamaa: bsdRec?.miidhamaQaamaa || prev.miidhamaQaamaa || item.miidhamaQaamaa,
          gosaMiidhamaa: bsdRec?.gosaMiidhamaa || prev.gosaMiidhamaa || item.gosaMiidhamaa,

          fileSource: newSource,
        };
      } else {
        const formattedDOB = formatToYYYYMMDD(item.baraDhalootaa);
        list.push({
          ...item,
          baraDhalootaa: formattedDOB,
          umurii: calculateUmuriiFromDOB(formattedDOB),
        });
      }
    });

    // Final cleanup pass: guarantee valid 9-digit STU ID, formatted YYYY-MM-DD date, and calculated age for EVERY student
    return list.map((st, i) => {
      const dobFormatted = formatToYYYYMMDD(st.baraDhalootaa);
      return {
        ...st,
        baraDhalootaa: dobFormatted,
        umurii: calculateUmuriiFromDOB(dobFormatted),
        nationalId: ensureValidSTUID(st.nationalId, st.maqaaGuutuu, i),
      };
    });
  };

  // Handle Multi-file upload (.xlsx, .xls, .csv) with optional mode (BSD / SR / SE)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forcedMode?: 'BSD' | 'SR' | 'SE') => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadStatus({
        type: 'error',
        message: "Fe'umsi ragaa hin milkoofne!",
      });
      return;
    }

    const uploadedNames: string[] = [];
    const allParsedRecords: EMISStudent[] = [];

    const fileList: File[] = Array.from(files);
    const fileReadPromises = fileList.map((file: File) => {
      uploadedNames.push(file.name);
      return new Promise<EMISStudent[]>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          const parsed = parseEMISArrayBuffer(file, buffer, forcedMode);
          resolve(parsed);
        };

        reader.onerror = () => resolve([]);
        reader.readAsArrayBuffer(file);
      });
    });

    try {
      const results = await Promise.all(fileReadPromises);
      results.forEach((recList) => allParsedRecords.push(...recList));

      if (allParsedRecords.length > 0) {
        const updatedEMISDatabase = mergeEMISLists(emisRecords, allParsedRecords);
        onSaveEmisRecords(updatedEMISDatabase);
        setFileNames(uploadedNames);
        setRecentParsedItems(allParsedRecords);
        setUploadStatus({
          type: 'success',
          message: `✓ Tokko tokkoon ragaalee (${allParsedRecords.length}) milkaa'inaan kuusaa EMIS keessatti fe'ameera! (${forcedMode ? forcedMode + ' ' : ''}Faayiloota ${uploadedNames.length} irraa)`,
          recordCount: allParsedRecords.length,
        });
      } else {
        setUploadStatus({
          type: 'error',
          message: "Fe'umsi ragaa hin milkoofne! (Maaloo faayilii Excel/CSV keessan sirriitti check godha)",
        });
      }
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: "Fe'umsi ragaa hin milkoofne!",
      });
    }
  };

  // Compare algorithm with App database
  const compareData = () => {
    const matches: Array<{ emis: EMISStudent; app: Student }> = [];
    const mismatches: Array<{ emis: EMISStudent; app: Student; diffs: string[] }> = [];
    const emisOnly: EMISStudent[] = [];
    const appOnly: Student[] = [...appStudents];

    emisRecords.forEach((emis) => {
      const appMatchIndex = appOnly.findIndex(
        (app) => app.maqaaGuutuu.trim().toLowerCase() === emis.maqaaGuutuu.trim().toLowerCase()
      );

      if (appMatchIndex !== -1) {
        const matchedApp = appOnly[appMatchIndex];
        appOnly.splice(appMatchIndex, 1);

        const diffs: string[] = [];
        if (emis.maqaaGuutuu !== matchedApp.maqaaGuutuu) diffs.push('Maqaa');
        if (emis.koorniyaa !== matchedApp.koorniyaa) diffs.push('Koorniyaa');
        if (String(emis.avireejjiiQabxii) !== String(matchedApp.avireejjiiQabxii)) diffs.push('Qabxii Avg');

        if (diffs.length > 0) {
          mismatches.push({ emis, app: matchedApp, diffs });
        } else {
          matches.push({ emis, app: matchedApp });
        }
      } else {
        emisOnly.push(emis);
      }
    });

    return { matches, mismatches, emisOnly, appOnly };
  };

  const comparison = compareData();

  // Execution functions for confirmed deletions
  const executeConfirmedDelete = () => {
    const { type, targetId, targetName, targetRecord, targetFileName } = deleteConfirmModal;

    if (type === 'inAppOnly') {
      if (comparison.appOnly.length > 0 && onDeleteStudentsByIDs) {
        const idsToRemove = comparison.appOnly.map((s) => s.id);
        onDeleteStudentsByIDs(idsToRemove);
        setUploadStatus({
          type: 'success',
          message: `✓ Barattoonni ${idsToRemove.length} 'In App Only' ta'an galmee App keessaa milkaa'inaan haqamaniiru!`,
          recordCount: idsToRemove.length,
        });
      }
    } else if (type === 'emisSynced') {
      const emisSyncedStudents = appStudents.filter(
        (s) => s.barsiisaaGalmeessee === 'EMIS Sync' || s.mbDuraan === 'EMIS Roster' || s.id.startsWith('STU-EMIS-')
      );
      if (emisSyncedStudents.length > 0 && onDeleteStudentsByIDs) {
        const idsToRemove = emisSyncedStudents.map((s) => s.id);
        onDeleteStudentsByIDs(idsToRemove);
        setUploadStatus({
          type: 'success',
          message: `✓ Barattoonni ${idsToRemove.length} EMIS irraa dabalaman galmee App keessaa haqamaniiru!`,
          recordCount: idsToRemove.length,
        });
      }
    } else if (type === 'clearEmisDb') {
      onSaveEmisRecords([]);
      setFileNames([]);
      setUploadStatus({
        type: 'success',
        message: "✓ Kuusaa ragaa EMIS guutummaatti haqameera!",
        recordCount: 0,
      });
      setIsRepositoryOpen(false);
    } else if (type === 'singleFile' && targetFileName) {
      const fn = targetFileName;
      const countBefore = emisRecords.length;
      const updated = emisRecords.filter((r) => r.fileName !== fn && (r.fileName || 'Faayila EMIS') !== fn);
      const deletedCount = countBefore - updated.length;
      onSaveEmisRecords(updated);
      setFileNames((prev) => prev.filter((name) => name !== fn));
      setUploadStatus({
        type: 'success',
        message: `✓ Faayilli '${fn}' fi ragaaleen ${deletedCount} kuusaa EMIS keessaa milkaa'inaan haqaamaniiru!`,
        recordCount: updated.length,
      });
    } else if (type === 'singleAppStudent' && targetId) {
      if (onDeleteStudentsByIDs) {
        onDeleteStudentsByIDs([targetId]);
        setUploadStatus({
          type: 'success',
          message: `✓ Barataan '${targetName || targetId}' galmee App keessaa haqameera!`,
        });
      }
    } else if (type === 'singleEmisRecord' && targetRecord) {
      const realIdx = emisRecords.findIndex((r) => r === targetRecord);
      let updated: EMISStudent[] = [];
      if (realIdx !== -1) {
        updated = emisRecords.filter((_, idx) => idx !== realIdx);
      } else {
        updated = emisRecords.filter((r) => r.maqaaGuutuu !== targetRecord.maqaaGuutuu);
      }
      onSaveEmisRecords(updated);
      setUploadStatus({
        type: 'success',
        message: `✓ Ragaan EMIS '${targetRecord.maqaaGuutuu}' haqameera!`,
        recordCount: updated.length,
      });
    }

    setDeleteConfirmModal({ ...deleteConfirmModal, isOpen: false });
  };

  const openDeleteConfirmModal = (
    type: 'inAppOnly' | 'emisSynced' | 'clearEmisDb' | 'singleAppStudent' | 'singleEmisRecord' | 'singleFile',
    title: string,
    description: string,
    extra?: { targetId?: string; targetName?: string; targetRecord?: EMISStudent; targetFileName?: string; count?: number }
  ) => {
    setDeleteConfirmModal({
      isOpen: true,
      type,
      title,
      description,
      targetId: extra?.targetId,
      targetName: extra?.targetName,
      targetRecord: extra?.targetRecord,
      targetFileName: extra?.targetFileName,
      count: extra?.count,
    });
  };

  // Summary helper for files present in EMIS database
  const getUploadedFilesSummary = () => {
    const map = new Map<string, { fileName: string; count: number; fileSource?: string }>();

    emisRecords.forEach((r) => {
      const fname = r.fileName || 'Faayila EMIS';
      const existing = map.get(fname);
      if (existing) {
        existing.count += 1;
        if (!existing.fileSource && r.fileSource) {
          existing.fileSource = r.fileSource;
        }
      } else {
        map.set(fname, {
          fileName: fname,
          count: 1,
          fileSource: r.fileSource,
        });
      }
    });

    fileNames.forEach((fn) => {
      if (!map.has(fn)) {
        map.set(fn, {
          fileName: fn,
          count: 0,
        });
      }
    });

    return Array.from(map.values());
  };

  const handleRequestDeleteFile = (fileName: string, recordCount: number) => {
    openDeleteConfirmModal(
      'singleFile',
      `Faayila '${fileName}' Haquu`,
      `Faayilli '${fileName}' fi ragaaleen ${recordCount} keessa jiran kuusaa EMIS keessaa kun haa baduu? / Are you sure you want to delete this file and its ${recordCount} records?`,
      { targetFileName: fileName, count: recordCount }
    );
  };

  const handleExportEMISDataToExcel = () => {
    const exportRows = emisRecords.map((r, i) => ({
      '#': i + 1,
      'Maqaa Guutuu': r.maqaaGuutuu,
      'FAN Digitl ID (16 Digits)': r.fanId,
      'Student / STUI': r.nationalId,
      'Koorniyaa': r.koorniyaa,
      'Kutaa': r.kutaa,
      'Daree': r.daree,
      'Bara Dhalootaa': r.baraDhalootaa,
      'Umurii': r.umurii,
      'Avireejjii Qabxii %': r.avireejjiiQabxii,
      'Godina': r.godina,
      'Aanaa': r.aanaa,
      'Ganda': r.ganda,
      'Haala Maatii': r.haalaMaatii,
      'Miidhama Qaamaa': r.miidhamaQaamaa,
      'Gosa Miidhamaa': r.gosaMiidhamaa || '-',
      'Maqaa Haadhaa': r.maqaaHaadhaa || '-',
      'M/B Duraan': r.mbDuraan || '-',
    }));
    exportToCSV(`EMIS_Database_Export_${Date.now()}.csv`, exportRows);
  };

  // Filter repository records
  const filteredRepoRecords = emisRecords.filter((r) => {
    const searchLower = repoSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      r.maqaaGuutuu.toLowerCase().includes(searchLower) ||
      (r.fanId && r.fanId.includes(searchLower)) ||
      (r.nationalId && r.nationalId.toLowerCase().includes(searchLower)) ||
      (r.ganda && r.ganda.toLowerCase().includes(searchLower)) ||
      (r.godina && r.godina.toLowerCase().includes(searchLower));

    const matchesGrade = repoGradeFilter === 'ALL' || r.kutaa === repoGradeFilter;
    const matchesGender = repoGenderFilter === 'ALL' || r.koorniyaa === repoGenderFilter;

    return matchesSearch && matchesGrade && matchesGender;
  });

  return (
    <div className="space-y-6 print:hidden">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            <span>EMIS Synchronization & Kuusaa Ragaa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Faayiloota EMIS (Excel / CSV) ol-fe'uun kuusaa keessatti save godhadhu, gara App-tti dabarsi, print/download godhadhu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Transfer ALL EMIS files/records to Main App */}
          <button
            onClick={handleImportAllEmisToApp}
            disabled={emisRecords.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="Ragaalee EMIS Hundaa Gara Galmee App-tti Dabarsi"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-200" />
            <span>Ragaalee EMIS Gara App-tti Dabarsi</span>
            <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-100 rounded-full font-mono text-[11px]">
              {emisRecords.length}
            </span>
          </button>

          {/* Button 2: Print EMIS Records */}
          <button
            onClick={handlePrintEMISData}
            disabled={emisRecords.length === 0}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Ragaa EMIS Print Godhi"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print EMIS</span>
          </button>

          {/* Button 3: Download EMIS Excel */}
          <button
            onClick={handleExportEMISDataToExcel}
            disabled={emisRecords.length === 0}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Ragaa EMIS Excel Download"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download Excel</span>
          </button>

          {/* Portal Button to Open Uploaded Records Repository */}
          <button
            onClick={() => setIsRepositoryOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <FolderOpen className="w-4 h-4 text-amber-300" />
            <span>Kuusaa Ragaalee ({emisRecords.length})</span>
          </button>

          {emisRecords.length > 0 && (
            <button
              onClick={() =>
                openDeleteConfirmModal(
                  'clearEmisDb',
                  'Kuusaa EMIS Guutummaatti Haquu',
                  `Ragaalee EMIS kuusaa keessatti ol-fe'aman ${emisRecords.length} guutummaatti haquu ni barbaadduu?`
                )
              }
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
              title="Ragaa EMIS Haqi"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          )}
        </div>
      </div>

      {/* Explanation Box on Excel Compatibility */}
      <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-indigo-950 text-sm">
            💡 Qajeelfama Fe'iinsaa Ragaa EMIS (BSD & SR):
          </h4>
          <p className="mt-0.5 text-indigo-800 leading-relaxed">
            Ragaa BSD asittii fe'i, Ragaa SR (Results) asittii fe'i jedhamee dangeeffameera. Akka ragaan jalaa waljala hin rukkutamneef faayila BSD fi SR adda baastanii fe'uun ni danda'ama.
          </p>
        </div>
      </div>

      {/* System Scope Boundary Warning */}
      <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex items-center gap-2.5 font-medium shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong>⛔ Dangeessuu Systema:</strong> EMIS kana jalatti ragaaleen Barattootaa (BSD & SR) qofa fe'amuu danda'u. Ragaaleen Barsiisaa fi Qabeenyaa asitti fe'amuun dangeffameera.
        </span>
      </div>

      {/* Dedicated Upload Cards for BSD, SR & SE (Student Enrollment) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BSD Upload Card */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-white p-5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 transition shadow-sm text-center relative flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">1. Ragaa BSD Asitti Fe'i</h4>
            <p className="text-[11px] text-slate-600 my-1.5 leading-relaxed">
              Faayila <strong>Basic Student Data (BSD)</strong> fe'i. Odeeffannoo Maqaa, FAN ID (16 Digits), Saalaa, Maatii & Teessoo qabata.
            </p>
          </div>
          <label className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer shadow-md transition text-xs flex items-center justify-center gap-1.5">
            <Upload className="w-4 h-4" />
            <span>Ragaa BSD Filadhu</span>
            <input
              ref={bsdInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              multiple
              onChange={(e) => handleFileUpload(e, 'BSD')}
              className="hidden"
            />
          </label>
        </div>

        {/* SR Upload Card */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 transition shadow-sm text-center relative flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">2. Ragaa SR (Results) Asitti Fe'i</h4>
            <p className="text-[11px] text-slate-600 my-1.5 leading-relaxed">
              Faayila <strong>Student Results (SR)</strong> fe'i. Col A irraa <strong>STU ID</strong>, Kutaa, Daree & Qabxii Avg sassaaba.
            </p>
          </div>
          <label className="w-full mt-2 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl cursor-pointer shadow-md transition text-xs flex items-center justify-center gap-1.5">
            <Upload className="w-4 h-4" />
            <span>Ragaa SR Filadhu</span>
            <input
              ref={srInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              multiple
              onChange={(e) => handleFileUpload(e, 'SR')}
              className="hidden"
            />
          </label>
        </div>

        {/* SE Upload Card (Student Enrollment / Bu'uura Boruu) */}
        <div className="bg-gradient-to-br from-amber-50/80 to-white p-5 rounded-2xl border-2 border-amber-300 hover:border-amber-500 transition shadow-sm text-center relative flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">3. Ragaa SE (Student Enrollment / Bu'uura Boruu)</h4>
            <p className="text-[11px] text-slate-600 my-1.5 leading-relaxed">
              Faayila <strong>Student Enrollment (SE)</strong>: Col A = STU ID, Col B = Maqaa Guutuu, Col C = Haala Galmee, Col E = Kutaa (Bu'uura Boruu).
            </p>
          </div>
          <label className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl cursor-pointer shadow-md transition text-xs flex items-center justify-center gap-1.5">
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Ragaa SE / Bu'uura Boruu Filadhu</span>
            <input
              ref={seInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              multiple
              onChange={(e) => handleFileUpload(e, 'SE')}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* General Multi-file Upload Dropzone */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-indigo-400 transition shadow-xs relative">
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-700">Faayiloota BSD & SR Walii-galatti Ol-fe'i (Multi-file Upload)</h4>
        <p className="text-xs text-slate-500 mb-3 max-w-md mx-auto">
          Faayiloota hedduu yeroo tokkotti filachuun otuu addaan hin baasin fe'uuf:
        </p>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer shadow-xs transition text-xs">
          <Upload className="w-4 h-4" />
          <span>Faayiloota Dachaa Filadhu</span>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            multiple
            onChange={(e) => handleFileUpload(e)}
            className="hidden"
          />
        </label>

        {getUploadedFilesSummary().length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto text-left text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Tarree Faayiloota Fe'amanii ({getUploadedFilesSummary().length}):
              </p>
              <button
                onClick={() =>
                  openDeleteConfirmModal(
                    'clearEmisDb',
                    'Faayiloota & Kuusaa EMIS Haquu',
                    'Faayiloota ol-fe\'amani fi ragaalee EMIS kuusaa keessaa guutummaatti haquu ni barbaadduu?'
                  )
                }
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Faayiloota & Ragaa EMIS Haqi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Faayiloota & Ragaa Haqi</span>
              </button>
            </div>
            <ul className="space-y-2">
              {getUploadedFilesSummary().map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition">
                  <div className="flex items-center gap-2.5 truncate max-w-[340px]">
                    <span className="text-lg">📄</span>
                    <div className="truncate">
                      <span className="truncate font-extrabold text-slate-900 text-xs block">{item.fileName}</span>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-extrabold rounded text-[9px] uppercase border border-indigo-200">
                          {item.fileSource || 'EMIS'}
                        </span>
                        <span>• <strong>{item.count}</strong> barattoota / records</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRequestDeleteFile(item.fileName, item.count)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    title={`Faayila '${item.fileName}' Haqi`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Haquu</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Explicit User Status Notifications */}
      {uploadStatus.type === 'success' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-sm animate-fadeIn space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <h4 className="font-extrabold text-sm text-emerald-950">{uploadStatus.message}</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Ragaan kuusaa EMIS keessatti milkaa'inaan save ta'eera. Gara Galmee App-tti dabarsuuf buttonii 'Ragaalee EMIS Gara App-tti Dabarsi' fayyadamaa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportAllEmisToApp}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Gara App Dabarsi</span>
              </button>
              <button
                onClick={() => setIsRepositoryOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                Ragaa Ilaali
              </button>
            </div>
          </div>

          {recentParsedItems.length > 0 && (
            <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-950 border-b border-emerald-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tarree Ragaalee Tokko Tokkoon Milkaa'inaan Fe'amanii ({recentParsedItems.length}):</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">Status: Milkaa'inaan Fe'ameera</span>
              </div>
              <div className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700 max-h-40 overflow-y-auto pr-1">
                {recentParsedItems.map((item, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between gap-2 hover:bg-emerald-50/50 px-1 rounded">
                    <span className="truncate">
                      #{idx + 1}. Maqaa: <strong>{item.maqaaGuutuu}</strong> | STUI: <span className="text-indigo-700 font-bold">{item.nationalId || '-'}</span> | FAN: <span className="font-bold">{item.fanId}</span> | Kutaa {item.kutaa} ({item.koorniyaa})
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold shrink-0 text-[10px]">
                      ✓ Milkaa'inaan Fe'ameera
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {uploadStatus.type === 'error' && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 flex items-center gap-3 shadow-sm animate-fadeIn">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm text-rose-950">{uploadStatus.message}</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Fe'umsi ragaa hin milkoofne! Maaloo format faaylaa Excel/CSV keessan irra deebiadhaa check godha.
            </p>
          </div>
        </div>
      )}

      {/* Database Overview & Comparison Analysis */}
      <div className="space-y-6">
        {/* Kuusaa Overview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Kuusaa Ragaa EMIS (Saved Database)</h3>
              <p className="text-xs text-slate-500">
                Waliigala ragaalee EMIS kuusaa keessatti save ta'an: <strong className="text-indigo-700 font-mono text-sm">{emisRecords.length} records</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImportAllEmisToApp}
              disabled={emisRecords.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Ragaalee EMIS Hundaa Gara Galmee App-tti Dabarsi"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-200" />
              <span>Gara App Dabarsi</span>
            </button>

            <button
              onClick={handlePrintEMISData}
              disabled={emisRecords.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Print EMIS Data"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setIsRepositoryOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-300" />
              <span>Kuusaa Ragaalee Ilaali ({emisRecords.length})</span>
            </button>

            <button
              onClick={handleExportEMISDataToExcel}
              disabled={emisRecords.length === 0}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Matches
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{comparison.matches.length}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Mismatches
            </div>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{comparison.mismatches.length}</p>
          </div>

          <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-sky-900">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <UserPlus className="w-4 h-4 text-sky-600" /> In EMIS Only
            </div>
            <p className="text-2xl font-extrabold text-sky-700 mt-1">{comparison.emisOnly.length}</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-purple-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-purple-600" /> In App Only
                </span>
                {comparison.appOnly.length > 0 && (
                  <button
                    onClick={() =>
                      openDeleteConfirmModal(
                        'inAppOnly',
                        "Barattoota 'In App Only' Hundaa Haquu",
                        `Barattoota systema App keessatti qofa argaman ('In App Only') ${comparison.appOnly.length} guutummaatti haquu ni barbaadduu?`,
                        { count: comparison.appOnly.length }
                      )
                    }
                    className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md transition text-[10px] font-bold cursor-pointer"
                    title="Ragaalee In App Only Hundaa Haqi"
                  >
                    Haqi ({comparison.appOnly.length})
                  </button>
                )}
              </div>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">{comparison.appOnly.length}</p>
            </div>
          </div>
        </div>

        {/* Mismatches Table */}
        {comparison.mismatches.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm">
            <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Barattoota Garaagarummaa Qaban (Mismatched Records)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-amber-50 text-amber-900 uppercase font-bold">
                  <tr>
                    <th className="p-3">Maqaa Barataa</th>
                    <th className="p-3">EMIS Data</th>
                    <th className="p-3">App Data</th>
                    <th className="p-3">Garaagarummaa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {comparison.mismatches.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50">
                      <td className="p-3 font-bold text-slate-900">{item.emis.maqaaGuutuu}</td>
                      <td className="p-3 font-mono text-indigo-700">
                        Kutaa {item.emis.kutaa} | {item.emis.avireejjiiQabxii === 'NO' || !item.emis.avireejjiiQabxii ? 'NO' : `${item.emis.avireejjiiQabxii}%`}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        Kutaa {item.app.kutaa} | {item.app.avireejjiiQabxii === 'NO' || !item.app.avireejjiiQabxii ? 'NO' : `${item.app.avireejjiiQabxii}%`}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold">
                          {item.diffs.join(', ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: PERMISSION & DELETION CONFIRMATION DIALOG */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <span>⚠️ Mirkaneessa Permision</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {deleteConfirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ ...deleteConfirmModal, isOpen: false })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Dhiisi (Cancel)
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eeyyee, Haqi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPOSITORY VIEW OF ALL UPLOADED EMIS RECORDS */}
      {isRepositoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-6 max-h-[92vh] flex flex-col">
            
            {/* Repository Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-indigo-600" />
                  <span>Kuusaa Ragaalee EMIS (EMIS Database Repository)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Waliigala Ragaalee Kuusaa keessatti ol-fe'amani fi save ta'an: <strong className="text-indigo-600 font-mono text-sm">{emisRecords.length} records</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleImportAllEmisToApp}
                  disabled={emisRecords.length === 0}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  title="Ragaalee EMIS Hundaa Gara Galmee App-tti Dabarsi"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Gara App Dabarsi</span>
                </button>

                <button
                  onClick={handlePrintEMISData}
                  disabled={emisRecords.length === 0}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleExportEMISDataToExcel}
                  disabled={emisRecords.length === 0}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => setIsRepositoryOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Uploaded Files Summary Card in Repository Modal */}
            {getUploadedFilesSummary().length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>Faayiloota Fe'aman fi Baay'ina Ragaalee ({getUploadedFilesSummary().length}):</span>
                  </h4>
                  <button
                    onClick={() =>
                      openDeleteConfirmModal(
                        'clearEmisDb',
                        'Faayiloota & Kuusaa EMIS Haquu',
                        'Faayiloota ol-fe\'amani fi ragaalee EMIS kuusaa keessaa guutummaatti haquu ni barbaadduu?'
                      )
                    }
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    Hundaa Haqi
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {getUploadedFilesSummary().map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                        <span className="text-xs">📄</span>
                        <span className="font-extrabold text-slate-900 truncate text-[11px]">{item.fileName}</span>
                        <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded text-[10px] font-mono font-bold">
                          {item.count} recs
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestDeleteFile(item.fileName, item.count)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold border border-rose-200"
                        title={`Faayila '${item.fileName}' Haqi`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Haquu</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Search Bar inside Repository */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Kuusaa irraa barbaadi (Maqaa, FAN, STUI, Ganda)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={repoGradeFilter}
                  onChange={(e) => setRepoGradeFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="ALL">Kutaa Hundaa (All Grades)</option>
                  <option value="0">Bu'uura Boruu (Umurii 4-6)</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                    <option key={g} value={g}>
                      Kutaa {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={repoGenderFilter}
                  onChange={(e) => setRepoGenderFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="ALL">Koorniyaa Hundaa (All Genders)</option>
                  <option value="Dhiira">Dhiira (Male)</option>
                  <option value="Dhalaa">Dhalaa (Female)</option>
                </select>
              </div>
            </div>

            {/* Repository Content List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50/50">
              {filteredRepoRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Ragaan kuusaa keessatti hin argamne. (No records found in repository)
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-900 font-bold text-[11px] sticky top-0 border-b border-slate-200 shadow-xs">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Maqaa Guutuu</th>
                      <th className="p-3">FAN ID (16 Digits)</th>
                      <th className="p-3">STU ID</th>
                      <th className="p-3">Koorniyaa</th>
                      <th className="p-3">Kutaa</th>
                      <th className="p-3">Bara Dhalootaa</th>
                      <th className="p-3">Qabxii Avg</th>
                      <th className="p-3">Madda (Source)</th>
                      <th className="p-3 text-center">Tarkaanfii</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRepoRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-extrabold text-slate-900">{r.maqaaGuutuu}</td>
                        <td className="p-3 font-mono text-[11px] text-indigo-700 font-bold">{r.fanId}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-700 font-semibold">{r.nationalId || '-'}</td>
                        <td className="p-3">{r.koorniyaa}</td>
                        <td className="p-3 font-bold">Kutaa {r.kutaa}</td>
                        <td className="p-3 font-mono">{r.baraDhalootaa}</td>
                        <td className="p-3 font-bold text-emerald-700">
                          {r.avireejjiiQabxii === 'NO' || r.avireejjiiQabxii === undefined || r.avireejjiiQabxii === null || r.avireejjiiQabxii === '' ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">NO</span>
                          ) : (
                            `${r.avireejjiiQabxii}%`
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              r.fileSource === 'Merged BSD & SR'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : r.fileSource === 'SR'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            }`}
                          >
                            {r.fileSource || 'BSD'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewingEmisRecord(r)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Ragaa EMIS Ilaali / View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingEmisRecord(r)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Ragaa EMIS Gulaali / Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirmModal(
                                  'singleEmisRecord',
                                  'Ragaa EMIS Haquu',
                                  `Ragaa EMIS '${r.maqaaGuutuu}' kuusaa keessaa haquu ni barbaadduu?`,
                                  { targetRecord: r }
                                )
                              }
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Ragaa EMIS Haqi / Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Ragaa Agarsiifamaa Jiru: <strong>{filteredRepoRecords.length}</strong> / {emisRecords.length}</span>
              <button
                onClick={() => setIsRepositoryOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
              >
                Cufi (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing EMIS Record Modal */}
      {viewingEmisRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>Odeeffannoo EMIS: {viewingEmisRecord.maqaaGuutuu}</span>
              </h3>
              <button onClick={() => setViewingEmisRecord(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Maqaa Guutuu:</span><span className="font-bold text-slate-900">{viewingEmisRecord.maqaaGuutuu}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">STU ID / National ID:</span><span className="font-mono font-bold text-indigo-700">{viewingEmisRecord.nationalId || '-'}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">FAN ID:</span><span className="font-mono font-bold text-slate-800">{viewingEmisRecord.fanId || '-'}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Koorniyaa:</span><span className="font-bold">{viewingEmisRecord.koorniyaa}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Kutaa / Daree:</span><span className="font-bold">Kutaa {viewingEmisRecord.kutaa} ({viewingEmisRecord.daree || 'A'})</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Umurii / Bara Dh.:</span><span className="font-bold">{viewingEmisRecord.umurii} yr ({viewingEmisRecord.baraDhalootaa})</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Mana Barumsaa:</span><span className="font-bold text-indigo-800">{viewingEmisRecord.manaBarumsaa || '-'}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Faayila Madaallii:</span><span className="font-mono font-bold text-slate-700">{viewingEmisRecord.fileName || '-'}</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Qabxii / Avireejjii:</span><span className="font-extrabold text-emerald-700">{viewingEmisRecord.avireejjiiQabxii}%</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl"><span className="text-slate-400 block">Godina / Aanaa / Ganda:</span><span className="font-bold">{viewingEmisRecord.godina} / {viewingEmisRecord.aanaa} / {viewingEmisRecord.ganda}</span></div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewingEmisRecord(null)}
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Cufi (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing EMIS Record Modal */}
      {editingEmisRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <span>Ragaa EMIS Fooyyessi (Edit EMIS Record)</span>
              </h3>
              <button onClick={() => setEditingEmisRecord(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmisRecordEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maqaa Guutuu Barataa</label>
                <input
                  type="text"
                  required
                  value={editingEmisRecord.maqaaGuutuu}
                  onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, maqaaGuutuu: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STU ID (9 Digits)</label>
                  <input
                    type="text"
                    value={editingEmisRecord.nationalId || ''}
                    onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, nationalId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">FAN ID (16 Digits / NO)</label>
                  <input
                    type="text"
                    value={editingEmisRecord.fanId || ''}
                    onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, fanId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Koorniyaa</label>
                  <select
                    value={editingEmisRecord.koorniyaa}
                    onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, koorniyaa: e.target.value as 'Dhiira' | 'Dhalaa' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Dhiira">Dhiira</option>
                    <option value="Dhalaa">Dhalaa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kutaa</label>
                  <input
                    type="text"
                    value={editingEmisRecord.kutaa}
                    onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, kutaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qabxii (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingEmisRecord.avireejjiiQabxii}
                    onChange={(e) => setEditingEmisRecord({ ...editingEmisRecord, avireejjiiQabxii: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold">
                ⚠️ Mirkaneessaa: Submittii gochuun dura jijjiirama ragaa EMIS kanaa sirriitti adda baaffadhu.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmisRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Dhiisi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Ol-ka'i (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
