import React, { useState, useEffect } from 'react';
import { Student, SchoolSettings, GradeTarget } from '../types';
import {
  exportToCSV,
  exportToExcel,
  importFullBackupExcelOrCSV,
  getStoredSchoolGradeTargetsMap,
  getUnifiedSchoolGradeTargets,
  getUnifiedWoredaTargets,
  saveUnifiedSchoolTarget,
  getStoredCustomTargetsMap,
  calculateGradesTargetTotal,
} from '../utils/storage';
import { HAALA_GALMEE_OPTIONS } from './StudentRegistration';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Lock,
  CheckCircle2,
  Table,
  Target,
  Users,
  Calendar,
  Layers,
  HeartHandshake,
  BarChart3,
  RotateCcw,
  PieChart,
  Award,
  Edit2,
  Trash2,
  Search,
  Eye,
  Upload,
  FileSpreadsheet,
  Info,
  Share2,
  Send,
  User,
  X,
  AlertCircle,
  Building,
  MapPin,
  School,
} from 'lucide-react';

interface ReportsProps {
  students: Student[];
  targets: Record<string, GradeTarget>;
  onSaveTargets: (newTargets: Record<string, GradeTarget>) => void;
  settings: SchoolSettings;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onDeleteStudent?: (id: string) => void;
  allSchools?: string[];
  allWoredas?: string[];
  allZones?: string[];
  selectedZoneFilter?: string;
  onSelectZoneFilter?: (zone: string) => void;
  selectedWoredaFilter?: string;
  onSelectWoredaFilter?: (woreda: string) => void;
  selectedSchoolFilter?: string;
  onSelectSchoolFilter?: (sch: string) => void;
  onOpenDeduplication?: () => void;
  onOpenFraudDetection?: () => void;
  onOpenSecureTransfer?: () => void;
}

export type ReportTabKey =
  | 'tabA_karoora'
  | 'tabB_waligalaa'
  | 'tabC_guyyaa'
  | 'tabD_galmee_dheeraa'
  | 'tabE_miidhama_roster'
  | 'tabF_miidhama_summary'
  | 'tabG_irra_deebii_roster'
  | 'tabH_irra_deebii_summary'
  | 'tabI_karoora_raawwii';

export const Reports: React.FC<ReportsProps> = ({
  students,
  targets,
  onSaveTargets,
  settings,
  onUpdateStudent,
  onDeleteStudent,
  allSchools = [],
  allWoredas = [],
  allZones = [],
  selectedZoneFilter: propZoneFilter,
  onSelectZoneFilter,
  selectedWoredaFilter: propWoredaFilter,
  onSelectWoredaFilter,
  selectedSchoolFilter: propSchoolFilter,
  onSelectSchoolFilter,
  onOpenDeduplication,
  onOpenFraudDetection,
  onOpenSecureTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTabKey>('tabI_karoora_raawwii');

  // Internal filter fallbacks
  const [internalZoneFilter, setInternalZoneFilter] = useState<string>('ALL_ZONES');
  const [internalWoredaFilter, setInternalWoredaFilter] = useState<string>('ALL_WOREDAS');
  const [internalSchoolFilter, setInternalSchoolFilter] = useState<string>('ALL_WOREDA');

  const zoneVal = propZoneFilter ?? internalZoneFilter;
  const woredaVal = propWoredaFilter ?? internalWoredaFilter;
  const schoolVal = propSchoolFilter ?? internalSchoolFilter;

  const handleZoneChange = (z: string) => {
    setInternalZoneFilter(z);
    if (onSelectZoneFilter) onSelectZoneFilter(z);
  };

  const handleWoredaChange = (w: string) => {
    setInternalWoredaFilter(w);
    if (onSelectWoredaFilter) onSelectWoredaFilter(w);
  };

  const handleSchoolChange = (sch: string) => {
    setInternalSchoolFilter(sch);
    if (onSelectSchoolFilter) onSelectSchoolFilter(sch);
  };

  // Filter / Search inside reports
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKebele, setSelectedKebele] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [reportAgeFilter, setReportAgeFilter] = useState<'ALL' | '7' | '4_6' | '8_plus'>('ALL');
  const [reportSortOrder, setReportSortOrder] = useState<'AZ' | 'ZA' | 'DEFAULT'>('AZ');

  // Local state for Tab A editing
  const [editingTargets, setEditingTargets] = useState<Record<string, GradeTarget>>(targets);
  const [targetSuccessMsg, setTargetSuccessMsg] = useState(false);

  // Sync editing targets whenever school or woreda filter changes
  useEffect(() => {
    if (schoolVal && schoolVal !== 'ALL_WOREDA') {
      const { targets: schT } = getUnifiedSchoolGradeTargets(schoolVal, targets);
      setEditingTargets(schT);
    } else if (woredaVal && woredaVal !== 'ALL_WOREDAS') {
      const { gradeTargets: worT } = getUnifiedWoredaTargets(woredaVal, allSchools, students);
      setEditingTargets(worT);
    } else {
      const { gradeTargets: allT } = getUnifiedWoredaTargets('ALL_WOREDAS', allSchools, students);
      setEditingTargets(allT);
    }
  }, [schoolVal, woredaVal, targets, allSchools, students]);

  // View, Edit, and Delete student state
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showZonalSubmissionModal, setShowZonalSubmissionModal] = useState<boolean>(false);
  const [showTelegramUploadModal, setShowTelegramUploadModal] = useState<boolean>(false);
  const [telegramUploadMsg, setTelegramUploadMsg] = useState<string | null>(null);
  const [isTelegramUploading, setIsTelegramUploading] = useState<boolean>(false);

  const handleTelegramFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsTelegramUploading(true);
    setTelegramUploadMsg(`Fayiloota Telegram gabaasaa (${files.length}) dubbisaa jira (Reading Telegram report files)...`);
    const res = await importFullBackupExcelOrCSV(files, settings.woredaName || '', settings.zoneName || '');
    setIsTelegramUploading(false);
    if (res.success) {
      setTelegramUploadMsg(res.message);
      setTimeout(() => {
        setShowTelegramUploadModal(false);
        setTelegramUploadMsg(null);
        window.location.reload();
      }, 2000);
    } else {
      setTelegramUploadMsg(res.message);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent) return;

    if (!window.confirm(`Mirkaneessaa: Jijjiirama ragaa barataa '${editingStudent.maqaaGuutuu}' olcaaluu (Update) ni barbaaddaa?`)) {
      return;
    }

    onUpdateStudent(editingStudent);
    setEditingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (deletingId && onDeleteStudent) {
      onDeleteStudent(deletingId);
      setDeletingId(null);
    }
  };

  // Helper normalization for locations
  const cleanLoc = (str?: string) =>
    (str || '')
      .trim()
      .toLowerCase()
      .replace(/^(godina|aanaa|waajjira|mana\s+barumsaa|m\/b|school)\s+/i, '')
      .replace(/\s+(primary|secondary|school|m\/b|mana\s+barumsaa)$/i, '')
      .trim();

  const isMetadataStudent = (name?: string) => {
    if (!name || !name.trim()) return true;
    const l = name.trim().toLowerCase();
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
      l === 'maqaa guutuu barataa'
    );
  };

  // Filter students based on current Zone, Woreda, School, age filter, and sort order
  const baseSchoolStudents = students.filter((s) => {
    if (!s.maqaaGuutuu || isMetadataStudent(s.maqaaGuutuu)) return false;

    const studentSchool = s.manaBarumsaa?.trim() || settings.savedSchoolName || '';
    const studentWoreda = s.aanaa?.trim() || settings.aanaaName || '';
    const studentGodina = s.godina?.trim() || settings.godinaName || '';

    // 1. Zone filter
    if (zoneVal && zoneVal !== 'ALL_ZONES') {
      const zTarget = cleanLoc(zoneVal);
      const sZone = cleanLoc(studentGodina);
      if (sZone && zTarget && sZone !== zTarget && !sZone.includes(zTarget) && !zTarget.includes(sZone)) {
        return false;
      }
    }
    // 2. Woreda filter
    if (woredaVal && woredaVal !== 'ALL_WOREDAS') {
      const wTarget = cleanLoc(woredaVal);
      const sWoreda = cleanLoc(studentWoreda);
      if (sWoreda && wTarget && sWoreda !== wTarget && !sWoreda.includes(wTarget) && !wTarget.includes(sWoreda)) {
        return false;
      }
    }
    // 3. School filter: When 'ALL_WOREDA', all schools are merged together!
    if (schoolVal && schoolVal !== 'ALL_WOREDA') {
      const schTarget = cleanLoc(schoolVal);
      const sSchool = cleanLoc(studentSchool);
      if (sSchool && schTarget && sSchool !== schTarget && !sSchool.includes(schTarget) && !schTarget.includes(sSchool)) {
        return false;
      }
    }
    return true;
  });

  const schoolStudents = baseSchoolStudents
    .filter((s) => {
      if (reportAgeFilter === '7') return s.umurii === 7;
      if (reportAgeFilter === '4_6') return s.umurii >= 4 && s.umurii <= 6;
      if (reportAgeFilter === '8_plus') return s.umurii >= 8;
      return true;
    })
    .sort((a, b) => {
      if (reportSortOrder === 'AZ') return a.maqaaGuutuu.localeCompare(b.maqaaGuutuu);
      if (reportSortOrder === 'ZA') return b.maqaaGuutuu.localeCompare(a.maqaaGuutuu);
      return 0;
    });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-GB');

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // Targets handler for Tab A
  const handleTargetChange = (grade: string, field: 'dhiira' | 'dhalaa', value: number) => {
    const updated = {
      ...editingTargets,
      [grade]: {
        kutaa: grade,
        dhiira: field === 'dhiira' ? value : editingTargets[grade]?.dhiira || 0,
        dhalaa: field === 'dhalaa' ? value : editingTargets[grade]?.dhalaa || 0,
      },
    };
    setEditingTargets(updated);
  };

  const handleSaveTargetsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolVal && schoolVal !== 'ALL_WOREDA') {
      const sum = calculateGradesTargetTotal(editingTargets);
      saveUnifiedSchoolTarget(schoolVal, sum, editingTargets);
      onSaveTargets(editingTargets);
    } else {
      onSaveTargets(editingTargets);
    }
    setTargetSuccessMsg(true);
    setTimeout(() => setTargetSuccessMsg(false), 3000);
  };

  // Common Grade Counts Helper with Cycle Subtotals (Bu'uura Boruu Umurii 4, 5, 6 & Total 4-6, 1-6, 7-8, 1-8, 9-12, 1-12)
  const getStructuredGradeStats = (customStudentsList = schoolStudents) => {
    const isSingleSchool = Boolean(schoolVal && schoolVal !== 'ALL_WOREDA');
    const isSingleWoreda = Boolean(woredaVal && woredaVal !== 'ALL_WOREDAS');

    let unifiedTargetMap: Record<string, GradeTarget> = {};

    if (isSingleSchool) {
      const { targets: schGrades } = getUnifiedSchoolGradeTargets(schoolVal, targets);
      unifiedTargetMap = schGrades;
    } else if (isSingleWoreda) {
      const { gradeTargets: worGrades } = getUnifiedWoredaTargets(woredaVal, allSchools, students);
      unifiedTargetMap = worGrades;
    } else {
      const { gradeTargets: allGrades } = getUnifiedWoredaTargets('ALL_WOREDAS', allSchools, students);
      unifiedTargetMap = allGrades;
    }

    // Helper to get aggregated target for any grade key across contributing schools
    const getGradeTarget = (gradeKey: string) => {
      const t = unifiedTargetMap[gradeKey] || targets[gradeKey] || { dhiira: 0, dhalaa: 0, kutaa: gradeKey };
      return {
        dhiira: t.dhiira || 0,
        dhalaa: t.dhalaa || 0,
      };
    };

    const bbStudents = customStudentsList.filter(
      (s) => s.kutaa === '0' || (s.kutaa || '').toLowerCase().includes('buuura') || (s.kutaa || '').toLowerCase().includes('borru')
    );

    // Age breakdown for Bu'uura Boruu
    const bb4 = bbStudents.filter((s) => s.umurii === 4);
    const bb5 = bbStudents.filter((s) => s.umurii === 5);
    const bb6 = bbStudents.filter((s) => s.umurii === 6);

    const makeBbRow = (key: string, label: string, list: typeof bbStudents, targetKey: string) => {
      const dhiira = list.filter((s) => s.koorniyaa === 'Dhiira').length;
      const dhalaa = list.filter((s) => s.koorniyaa === 'Dhalaa').length;
      const tgt = getGradeTarget(targetKey);
      const targetDhiira = tgt.dhiira;
      const targetDhalaa = tgt.dhalaa;
      const targetTotal = targetDhiira + targetDhalaa;
      const total = dhiira + dhalaa;

      return {
        key,
        kutaa: label,
        gradeNumber: 0,
        dhiira,
        dhalaa,
        total,
        targetDhiira,
        targetDhalaa,
        targetTotal,
        pctDhiira: targetDhiira > 0 ? parseFloat(((dhiira / targetDhiira) * 100).toFixed(1)) : 0,
        pctDhalaa: targetDhalaa > 0 ? parseFloat(((dhalaa / targetDhalaa) * 100).toFixed(1)) : 0,
        pctTotal: targetTotal > 0 ? parseFloat(((total / targetTotal) * 100).toFixed(1)) : 0,
        pct: targetTotal > 0 ? parseFloat(((total / targetTotal) * 100).toFixed(1)) : 0,
        isSubtotal: false,
        isGrandTotal: false,
      };
    };

    const rowBb4 = makeBbRow('bb_u4', "Bu'uura Boruu - Umurii 4", bb4, 'bb_4');
    const rowBb5 = makeBbRow('bb_u5', "Bu'uura Boruu - Umurii 5", bb5, 'bb_5');
    const rowBb6 = makeBbRow('bb_u6', "Bu'uura Boruu - Umurii 6", bb6, 'bb_6');

    // Subtotal for Bu'uura Boruu (Umurii 4-6)
    const bbDhiira = bbStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
    const bbDhalaa = bbStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
    const bbTargetDhiira = rowBb4.targetDhiira + rowBb5.targetDhiira + rowBb6.targetDhiira;
    const bbTargetDhalaa = rowBb4.targetDhalaa + rowBb5.targetDhalaa + rowBb6.targetDhalaa;
    const bbTargetTotal = bbTargetDhiira + bbTargetDhalaa;
    const bbTotal = bbDhiira + bbDhalaa;

    const subBb4to6 = {
      key: 'sub_bb_4_6',
      kutaa: "Subtotal: Ida'ama Bu'uura Boruu (Umurii 4-6)",
      gradeNumber: 0,
      dhiira: bbDhiira,
      dhalaa: bbDhalaa,
      total: bbTotal,
      targetDhiira: bbTargetDhiira,
      targetDhalaa: bbTargetDhalaa,
      targetTotal: bbTargetTotal,
      pctDhiira: bbTargetDhiira > 0 ? parseFloat(((bbDhiira / bbTargetDhiira) * 100).toFixed(1)) : 0,
      pctDhalaa: bbTargetDhalaa > 0 ? parseFloat(((bbDhalaa / bbTargetDhalaa) * 100).toFixed(1)) : 0,
      pctTotal: bbTargetTotal > 0 ? parseFloat(((bbTotal / bbTargetTotal) * 100).toFixed(1)) : 0,
      pct: bbTargetTotal > 0 ? parseFloat(((bbTotal / bbTargetTotal) * 100).toFixed(1)) : 0,
      isSubtotal: true,
      isGrandTotal: false,
    };

    // Grade 1 Students Breakdown
    const g1All = customStudentsList.filter((s) => s.kutaa === '1');
    const g1U7 = g1All.filter((s) => s.umurii === 7);
    const g1U8 = g1All.filter((s) => s.umurii !== 7);

    // Grade 1 Targets Breakdown aggregated for Woreda
    const targetG1All = getGradeTarget('1');
    const targetG1U7 = getGradeTarget('u7_1');

    const targetG1U8Dhiira = Math.max(0, (targetG1All.dhiira || 0) - (targetG1U7.dhiira || 0));
    const targetG1U8Dhalaa = Math.max(0, (targetG1All.dhalaa || 0) - (targetG1U7.dhalaa || 0));
    const targetG1U8Total = targetG1U8Dhiira + targetG1U8Dhalaa;
    const targetG1AllTotal = (targetG1All.dhiira || 0) + (targetG1All.dhalaa || 0);
    const targetG1U7Total = (targetG1U7.dhiira || 0) + (targetG1U7.dhalaa || 0);

    // 1. Row Umurii 7 (Kutaa 1)
    const g1U7Dhiira = g1U7.filter((s) => s.koorniyaa === 'Dhiira').length;
    const g1U7Dhalaa = g1U7.filter((s) => s.koorniyaa === 'Dhalaa').length;
    const g1U7Total = g1U7Dhiira + g1U7Dhalaa;
    const rowG1_U7 = {
      key: 'u_7_k1',
      kutaa: 'Umurii 7 (Kutaa 1)',
      gradeNumber: 0.7,
      dhiira: g1U7Dhiira,
      dhalaa: g1U7Dhalaa,
      total: g1U7Total,
      targetDhiira: targetG1U7.dhiira || 0,
      targetDhalaa: targetG1U7.dhalaa || 0,
      targetTotal: targetG1U7Total,
      pctDhiira: targetG1U7.dhiira > 0 ? parseFloat(((g1U7Dhiira / targetG1U7.dhiira) * 100).toFixed(1)) : 0,
      pctDhalaa: targetG1U7.dhalaa > 0 ? parseFloat(((g1U7Dhalaa / targetG1U7.dhalaa) * 100).toFixed(1)) : 0,
      pctTotal: targetG1U7Total > 0 ? parseFloat(((g1U7Total / targetG1U7Total) * 100).toFixed(1)) : 0,
      pct: targetG1U7Total > 0 ? parseFloat(((g1U7Total / targetG1U7Total) * 100).toFixed(1)) : 0,
      isSubtotal: false,
      isGrandTotal: false,
    };

    // 2. Row Kutaa 1 (Umurii 8 fi Isaa Ol)
    const g1U8Dhiira = g1U8.filter((s) => s.koorniyaa === 'Dhiira').length;
    const g1U8Dhalaa = g1U8.filter((s) => s.koorniyaa === 'Dhalaa').length;
    const g1U8Total = g1U8Dhiira + g1U8Dhalaa;
    const rowG1_U8 = {
      key: 'u_8_k1',
      kutaa: 'Kutaa 1 (Umurii 8+)',
      gradeNumber: 0.8,
      dhiira: g1U8Dhiira,
      dhalaa: g1U8Dhalaa,
      total: g1U8Total,
      targetDhiira: targetG1U8Dhiira,
      targetDhalaa: targetG1U8Dhalaa,
      targetTotal: targetG1U8Total,
      pctDhiira: targetG1U8Dhiira > 0 ? parseFloat(((g1U8Dhiira / targetG1U8Dhiira) * 100).toFixed(1)) : 0,
      pctDhalaa: targetG1U8Dhalaa > 0 ? parseFloat(((g1U8Dhalaa / targetG1U8Dhalaa) * 100).toFixed(1)) : 0,
      pctTotal: targetG1U8Total > 0 ? parseFloat(((g1U8Total / targetG1U8Total) * 100).toFixed(1)) : 0,
      pct: targetG1U8Total > 0 ? parseFloat(((g1U8Total / targetG1U8Total) * 100).toFixed(1)) : 0,
      isSubtotal: false,
      isGrandTotal: false,
    };

    // 3. Row Waliigalaa Kutaa 1
    const g1AllDhiira = g1All.filter((s) => s.koorniyaa === 'Dhiira').length;
    const g1AllDhalaa = g1All.filter((s) => s.koorniyaa === 'Dhalaa').length;
    const g1AllTotal = g1AllDhiira + g1AllDhalaa;
    const rowG1_Waliigala = {
      key: 'kutaa_1',
      kutaa: 'Waliigalaa Kutaa 1',
      gradeNumber: 1,
      dhiira: g1AllDhiira,
      dhalaa: g1AllDhalaa,
      total: g1AllTotal,
      targetDhiira: targetG1All.dhiira || 0,
      targetDhalaa: targetG1All.dhalaa || 0,
      targetTotal: targetG1AllTotal,
      pctDhiira: targetG1All.dhiira > 0 ? parseFloat(((g1AllDhiira / targetG1All.dhiira) * 100).toFixed(1)) : 0,
      pctDhalaa: targetG1All.dhalaa > 0 ? parseFloat(((g1AllDhalaa / targetG1All.dhalaa) * 100).toFixed(1)) : 0,
      pctTotal: targetG1AllTotal > 0 ? parseFloat(((g1AllTotal / targetG1AllTotal) * 100).toFixed(1)) : 0,
      pct: targetG1AllTotal > 0 ? parseFloat(((g1AllTotal / targetG1AllTotal) * 100).toFixed(1)) : 0,
      isSubtotal: false,
      isGrandTotal: false,
    };

    const baseStats = [
      rowG1_Waliigala,
      ...Array.from({ length: 11 }, (_, i) => {
        const gStr = String(i + 2);
        const inGrade = customStudentsList.filter((s) => s.kutaa === gStr);
        const dhiira = inGrade.filter((s) => s.koorniyaa === 'Dhiira').length;
        const dhalaa = inGrade.filter((s) => s.koorniyaa === 'Dhalaa').length;
        const tgt = getGradeTarget(gStr);
        const targetDhiira = tgt.dhiira;
        const targetDhalaa = tgt.dhalaa;
        const targetTotal = targetDhiira + targetDhalaa;
        const totalActual = dhiira + dhalaa;
        const pctDhiira = targetDhiira > 0 ? ((dhiira / targetDhiira) * 100).toFixed(1) : '0.0';
        const pctDhalaa = targetDhalaa > 0 ? ((dhalaa / targetDhalaa) * 100).toFixed(1) : '0.0';
        const pctTotal = targetTotal > 0 ? ((totalActual / targetTotal) * 100).toFixed(1) : '0.0';

        return {
          key: `kutaa_${gStr}`,
          kutaa: `Kutaa ${gStr}`,
          gradeNumber: i + 2,
          dhiira,
          dhalaa,
          total: totalActual,
          targetDhiira,
          targetDhalaa,
          targetTotal,
          pctDhiira: parseFloat(pctDhiira),
          pctDhalaa: parseFloat(pctDhalaa),
          pctTotal: parseFloat(pctTotal),
          pct: parseFloat(pctTotal),
          isSubtotal: false,
          isGrandTotal: false,
        };
      }),
    ];

    const createSubtotalRow = (
      sourceRows: typeof baseStats,
      label: string,
      key: string,
      isGrand = false
    ) => {
      const targetDhiira = sourceRows.reduce((acc, r) => acc + r.targetDhiira, 0);
      const targetDhalaa = sourceRows.reduce((acc, r) => acc + r.targetDhalaa, 0);
      const targetTotal = targetDhiira + targetDhalaa;

      const dhiira = sourceRows.reduce((acc, r) => acc + r.dhiira, 0);
      const dhalaa = sourceRows.reduce((acc, r) => acc + r.dhalaa, 0);
      const total = dhiira + dhalaa;

      const pctDhiira = targetDhiira > 0 ? parseFloat(((dhiira / targetDhiira) * 100).toFixed(1)) : 0;
      const pctDhalaa = targetDhalaa > 0 ? parseFloat(((dhalaa / targetDhalaa) * 100).toFixed(1)) : 0;
      const pctTotal = targetTotal > 0 ? parseFloat(((total / targetTotal) * 100).toFixed(1)) : 0;

      return {
        key,
        kutaa: label,
        gradeNumber: 0,
        dhiira,
        dhalaa,
        total,
        targetDhiira,
        targetDhalaa,
        targetTotal,
        pctDhiira,
        pctDhalaa,
        pctTotal,
        pct: pctTotal,
        isSubtotal: !isGrand,
        isGrandTotal: isGrand,
      };
    };

    const g1to6 = baseStats.slice(0, 6);
    const g7to8 = baseStats.slice(6, 8);
    const g1to8 = baseStats.slice(0, 8);
    const g9to12 = baseStats.slice(8, 12);
    const g1to12 = baseStats.slice(0, 12);

    const sub1to6 = createSubtotalRow(g1to6, "Ida'ama Kutaa 1-6", "sub_1_6");
    const sub7to8 = createSubtotalRow(g7to8, "Ida'ama Kutaa 7-8", "sub_7_8");
    const sub1to8 = createSubtotalRow(g1to8, "Ida'ama Kutaa 1-8", "sub_1_8");
    const sub9to12 = createSubtotalRow(g9to12, "Ida'ama Kutaa 9-12", "sub_9_12");
    const grandTotal = createSubtotalRow(g1to12, "Ida'ama Waliigalaa (Kutaa 1-12)", "grand_1_12", true);

    return [
      rowBb4,
      rowBb5,
      rowBb6,
      subBb4to6,
      rowG1_U7,
      rowG1_U8,
      rowG1_Waliigala,
      ...baseStats.slice(1, 6),
      sub1to6,
      ...baseStats.slice(6, 8),
      sub7to8,
      sub1to8,
      ...baseStats.slice(8, 12),
      sub9to12,
      grandTotal,
    ];
  };

  const structuredGradeStats = getStructuredGradeStats();

  const getActiveExportSchoolName = () => {
    if (schoolVal && schoolVal !== 'ALL_WOREDA') {
      return schoolVal;
    }
    if (woredaVal && woredaVal !== 'ALL_WOREDAS') {
      return `Aanaa_${woredaVal}`;
    }
    if (zoneVal && zoneVal !== 'ALL_ZONES') {
      return `Godina_${zoneVal}`;
    }
    return settings.savedSchoolName || 'Mana_Barumsaa';
  };

  const getExportDataWithStandardHeader = () => {
    const activeSchool = getActiveExportSchoolName();
    const activeWoreda = woredaVal !== 'ALL_WOREDAS' ? woredaVal : (allWoredas[0] || '');
    const activeZone = zoneVal !== 'ALL_ZONES' ? zoneVal : (allZones[0] || '');
    const activeYear = settings.baraBarnootaa || '2019';
    const currentDate = new Date().toISOString().slice(0, 10);

    const headerMetadata = {
      'MAQAA MANA BARUMSAA / UNITII': activeSchool,
      'AANAA': activeWoreda,
      'GODINA': activeZone,
      'BARA BARNOOTAA': activeYear,
      'GUYYAA EXPORTEERAME': currentDate,
      'GOSA GABAASA': activeTab,
    };

    let tabRows: any[] = [];
    if (activeTab === 'tabA_karoora') {
      tabRows = structuredGradeStats.map((s) => ({
        Kutaa: s.kutaa,
        'Karoora Dhiira': s.targetDhiira,
        'Karoora Dhalaa': s.targetDhalaa,
        'Karoora Waliigala': s.targetTotal,
      }));
    } else if (activeTab === 'tabB_waligalaa') {
      tabRows = schoolStudents.map((s, idx) => ({
        '#': idx + 1, // Col A (1)
        'Naannoo': 'Oromiyaa', // Col B (2)
        'Godina': s.godina || (zoneVal !== 'ALL_ZONES' ? zoneVal : 'Shawaa Lixaa'), // Col C (3)
        'Aanaa': s.aanaa || (woredaVal !== 'ALL_WOREDAS' ? woredaVal : 'Meta Wolkite'), // Col D (4)
        'Mana Barumsaa': (s.manaBarumsaa && !/^\d+$/.test(String(s.manaBarumsaa).trim()) && !/^mana\s+barumsaa\s+\d+$/i.test(String(s.manaBarumsaa).trim())) ? s.manaBarumsaa : (activeSchool || settings.savedSchoolName || 'Mana Barumsaa Waliigalaa'), // Col E (5)
        'Ganda': s.ganda || 'Ganda 01', // Col F (6)
        'Lakk. STUI Barataa': s.nationalId || s.id || '-', // Col G (7) - Ganda tti aanee
        'Maqaa Guutuu Barataa': s.maqaaGuutuu, // Col H (8) - STUI tti aanee
        'Koorniyaa': s.koorniyaa, // Col I (9) - Waljijjiiramee
        'Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)': s.fanId || '-', // Col J (10) - Waljijjiiramee
        'Kutaa': s.kutaa, // Col K (11)
        'Daree': s.daree || 'A', // Col L (12)
        'Bara Dhalootaa': s.baraDhalootaa || '-', // Col M (13)
        'Umurii': s.umurii, // Col N (14)
        'Haala Galmee': s.haalaGalmee, // Col O (15)
        'Bara Irra Deebii': s.baraIrraDeebii || '-', // Col P (16)
        'Bara Addaan Kute': s.baraAddaanKute || '-', // Col Q (17)
        'Haala Maatii': s.haalaMaatii || 'Akka Maatiitti', // Col R (18)
        'Miidhama Qaamaa': s.miidhamaQaamaa || 'Lakkii', // Col S (19)
        'Gosa Miidhamaa': s.gosaMiidhamaa || '-', // Col T (20)
        'Bilbila Barataa': s.lakkBilbilaBarataa || '-', // Col U (21)
        'Bilbila Maatii': s.lakkBilbilaMaatii || '-', // Col V (22)
        'Maqaa Haadhaa': s.maqaaHaadhaa || '-', // Col W (23)
        'M/B Duraan': s.mbDuraan || '-', // Col X (24)
        'Qabxii (%)': s.avireejjiiQabxii, // Col Y (25)
        'Guyyaa Galmee': s.guyyaaGalmee, // Col Z (26)
        'Barsiisaa Galmeessee': s.barsiisaaGalmeessee || '-', // Col AA (27)
      }));
    } else if (activeTab === 'tabC_guyyaa') {
      const todayList = schoolStudents.filter((s) => s.guyyaaGalmee === todayStr || s.guyyaaGalmee === todayFormatted);
      const stats = getStructuredGradeStats(todayList);
      tabRows = stats.map((s) => ({
        Kutaa: s.kutaa,
        Dhiira: s.dhiira,
        Dhalaa: s.dhalaa,
        "Ida'ama": s.total,
      }));
    } else if (activeTab === 'tabD_galmee_dheeraa') {
      tabRows = structuredGradeStats.map((s) => ({
        Kutaa: s.kutaa,
        Dhiira: s.dhiira,
        Dhalaa: s.dhalaa,
        "Ida'ama": s.total,
      }));
    } else if (activeTab === 'tabE_miidhama_roster') {
      const list = schoolStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee');
      tabRows = list.map((s, idx) => ({
        '#': idx + 1,
        'STUI Barataa': s.nationalId || s.id || '-',
        'Maqaa Guutuu Barataa': s.maqaaGuutuu,
        'Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)': s.fanId,
        Kutaa: s.kutaa,
        Koorniyaa: s.koorniyaa,
        'Gosa Miidhamaa': s.gosaMiidhamaa || 'Unspecified',
        Ganda: s.ganda,
      }));
    } else if (activeTab === 'tabF_miidhama_summary') {
      const list = schoolStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee');
      const stats = getStructuredGradeStats(list);
      tabRows = stats.map((s) => ({
        Kutaa: s.kutaa,
        Dhiira: s.dhiira,
        Dhalaa: s.dhalaa,
        "Ida'ama": s.total,
      }));
    } else if (activeTab === 'tabG_irra_deebii_roster') {
      const list = schoolStudents.filter((s) => s.haalaGalmee.toLowerCase().includes('irra deebii'));
      tabRows = list.map((s, idx) => ({
        '#': idx + 1,
        'STUI Barataa': s.nationalId || s.id || '-',
        'Maqaa Guutuu Barataa': s.maqaaGuutuu,
        'Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)': s.fanId,
        Kutaa: s.kutaa,
        Koorniyaa: s.koorniyaa,
        'Haala Galmee': s.haalaGalmee,
        'Bara Irra Deebii': s.baraIrraDeebii || '-',
      }));
    } else if (activeTab === 'tabH_irra_deebii_summary') {
      const list = schoolStudents.filter((s) => s.haalaGalmee.toLowerCase().includes('irra deebii'));
      const stats = getStructuredGradeStats(list);
      tabRows = stats.map((s) => ({
        Kutaa: s.kutaa,
        Dhiira: s.dhiira,
        Dhalaa: s.dhalaa,
        "Ida'ama": s.total,
      }));
    } else if (activeTab === 'tabI_karoora_raawwii') {
      tabRows = structuredGradeStats.map((s) => ({
        Kutaa: s.kutaa,
        'Karoora Dhiira': s.targetDhiira,
        'Karoora Dhalaa': s.targetDhalaa,
        'Karoora Total': s.targetTotal,
        'Raawwii Dhiira': s.dhiira,
        'Raawwii Dhalaa': s.dhalaa,
        'Raawwii Total': s.total,
        'Dhiira (%)': `${s.pctDhiira}%`,
        'Dhalaa (%)': `${s.pctDhalaa}%`,
        "Ida'ama (%)": `${s.pctTotal}%`,
      }));
    }

    return tabRows;
  };

  const exportCurrentTabCSV = () => {
    const activeSchoolName = getActiveExportSchoolName().replace(/\s+/g, '_');
    const cleanYear = (settings.baraBarnootaa || '2019').replace(/\s+/g, '_');
    const filename = `Gabaasa_${activeTab}_${activeSchoolName}_Bara_${cleanYear}.csv`;
    const exportData = getExportDataWithStandardHeader();
    exportToCSV(filename, exportData);
  };

  const exportCurrentTabExcel = () => {
    const activeSchoolName = getActiveExportSchoolName().replace(/\s+/g, '_');
    const cleanYear = (settings.baraBarnootaa || '2019').replace(/\s+/g, '_');
    const filename = `Gabaasa_${activeTab}_${activeSchoolName}_Bara_${cleanYear}.xlsx`;
    const exportData = getExportDataWithStandardHeader();
    exportToExcel(filename, exportData, activeTab);
  };

  const shareTelegramReport = () => {
    const cleanSchool = settings.savedSchoolName || 'Mana Barumsaa';
    const cleanYear = settings.baraBarnootaa || '2019';
    const totalStu = schoolStudents.length;
    const maleStu = schoolStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
    const femaleStu = schoolStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;

    let tabTitle = 'GABAASA WALIGALAA';
    let tableText = '';

    if (activeTab === 'tabC_guyyaa') {
      tabTitle = 'TAB C: GABAASA GUYYAA GUYYAA (DAILY REGISTRATION)';
      const todayList = schoolStudents.filter((s) => s.guyyaaGalmee === todayStr || s.guyyaaGalmee === todayFormatted);
      const todayStats = getStructuredGradeStats(todayList);
      const rows = todayStats.map((s) => `• *${s.kutaa}:* Dhiira: ${s.dhiira} | Dhalaa: ${s.dhalaa} | Total: ${s.total}`).join('\n');
      tableText = `🗓 *Gabaasa Galmee Guyyaa Today (${todayFormatted}):*\n` +
        `👨‍🎓 *Barattoota Guyyaa Har'aa Galmaa'an:* ${todayList.length}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else if (activeTab === 'tabD_galmee_dheeraa') {
      tabTitle = 'TAB D: GABAASA GALMEE WALIGALAA (OVERALL SUMMARY)';
      const rows = structuredGradeStats.map((s) => `• *${s.kutaa}:* Dhiira: ${s.dhiira} | Dhalaa: ${s.dhalaa} | Total: ${s.total}`).join('\n');
      tableText = `📊 *Gabatee Galmee Sadarkaa Kutaatiin:* \n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else if (activeTab === 'tabI_karoora_raawwii') {
      tabTitle = 'TAB I: GABAASA QULQULLUU KAROORA VS RAAWWII & %';
      const rows = structuredGradeStats.map((s) => 
        `• *${s.kutaa}:*\n  ▫️ Karoora: ${s.targetTotal} (Dh: ${s.targetDhiira}, DhL: ${s.targetDhalaa})\n  ▫️ Raawwii: ${s.total} (Dh: ${s.dhiira}, DhL: ${s.dhalaa})\n  ▫️ Raawwii %: *${s.pctTotal}%* (Dh: ${s.pctDhiira}%, DhL: ${s.pctDhalaa}%)`
      ).join('\n');
      tableText = `🎯 *Gabatee Karoora vs Raawwii & % (Master Education Grid):*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else if (activeTab === 'tabA_karoora') {
      tabTitle = 'TAB A: KAROORA BARATTOOTAA (PLANNING)';
      const rows = structuredGradeStats.map((s) => `• *${s.kutaa}:* Karoora Total: ${s.targetTotal} (Dh: ${s.targetDhiira}, DhL: ${s.targetDhalaa})`).join('\n');
      tableText = `📋 *Gabatee Karoora Barattootaa:* \n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else if (activeTab === 'tabF_miidhama_summary') {
      tabTitle = 'TAB F: GABAASA LAKKOOFSA MIIDHAMA QAAMAA';
      const list = schoolStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee');
      const stats = getStructuredGradeStats(list);
      const rows = stats.map((s) => `• *${s.kutaa}:* Dhiira: ${s.dhiira} | Dhalaa: ${s.dhalaa} | Total: ${s.total}`).join('\n');
      tableText = `♿️ *Gabatee Barattoota Miidhama Qaamaa (${list.length}):*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else if (activeTab === 'tabH_irra_deebii_summary') {
      tabTitle = 'TAB H: GABAASA LAKKOOFSA IRRA DEEBII';
      const list = schoolStudents.filter((s) => s.haalaGalmee.toLowerCase().includes('irra deebii'));
      const stats = getStructuredGradeStats(list);
      const rows = stats.map((s) => `• *${s.kutaa}:* Dhiira: ${s.dhiira} | Dhalaa: ${s.dhalaa} | Total: ${s.total}`).join('\n');
      tableText = `🔄 *Gabatee Barattoota Irra Deebii (${list.length}):*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    } else {
      tabTitle = activeTab.replace('tab', 'Tab ').replace(/_/g, ' ').toUpperCase();
      const rows = structuredGradeStats.map((s) => `• *${s.kutaa}:* Dhiira: ${s.dhiira} | Dhalaa: ${s.dhalaa} | Total: ${s.total}`).join('\n');
      tableText = `📊 *Gabatee Gabaasaa:* \n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${rows}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;
    }

    const appOrigin = window.location.origin;
    const directSchoolUrl = `${appOrigin}${window.location.pathname}?school=${encodeURIComponent(cleanSchool)}&view=reports`;

    const reportText = `📊 *GABAASA SRS KITESA* 🎓\n` +
      `🏫 *M/B:* ${cleanSchool} | 📅 *Bara:* ${cleanYear}\n` +
      `👨‍🎓 *Barattoota:* ${totalStu} (Dh: ${maleStu}, DhL: ${femaleStu})\n` +
      `📌 *Kutaa:* ${tabTitle}\n` +
      `🗓 *Guyyaa:* ${new Date().toLocaleDateString('en-GB')}\n\n` +
      `${tableText}\n\n` +
      `🌐 *Sirna SRS KITESA:* \n${directSchoolUrl}`;

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(directSchoolUrl)}&text=${encodeURIComponent(reportText)}`;

    if (navigator.share) {
      navigator.share({
        title: `Gabaasa SRS KITESA - ${cleanSchool}`,
        text: reportText,
        url: directSchoolUrl,
      }).catch(() => {
        window.open(telegramUrl, '_blank');
      });
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Kutaa Gabaasa Sub-tabs 9 (Tab A - Tab I)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mana Barumsaa: <strong className="text-indigo-600">{settings.savedSchoolName}</strong> | Bara Barnootaa: <strong className="text-indigo-600">{settings.baraBarnootaa} E.C</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTelegramUploadModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer shadow-md active:scale-95 border border-indigo-400"
            title="Gabaasota (Tab A - Tab I) manneen barnootaa karaa Telegram ergaman upload godhi"
          >
            <Upload className="w-4 h-4 text-indigo-200" />
            <span>📤 Upload Gabaasa Telegram (Tab A-I Excel/CSV)</span>
          </button>

          <button
            onClick={() => setShowZonalSubmissionModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer shadow-md active:scale-95 border border-amber-300"
            title="Gabaasa Consalidated Sadarkaa Aanaa Hunda Godinaaf Ergamu Banu"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>📤 Gabaasa Aanaa (Godinaaf Ergamu)</span>
          </button>

          <button
            onClick={shareTelegramReport}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-95"
            title="Gabaasa kana karaa Telegram Ogeessa Waajjira Barnootaatiif ergi"
          >
            <Send className="w-4 h-4 text-sky-200" />
            <span>Ergii Telegram ✈️</span>
          </button>

          <button
            onClick={exportCurrentTabExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
            title="Gabaasa tab kanaa bifa Excel (.xlsx) tiin buusi"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportCurrentTabCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
            title="Gabaasa tab kanaa bifa CSV (.csv) tiin buusi"
          >
            <Download className="w-4 h-4" />
            <span>CSV (.csv)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer border border-slate-300"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Automated Hierarchical Consolidation Engine Indicator Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-emerald-500/40 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl font-extrabold text-base shrink-0 shadow">
            🔄
          </div>
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-400/50 px-2.5 py-0.5 rounded-full text-[10px] font-black text-emerald-300">
              <span>SIRNA QINDOOMINA OFUMAA (AUTOMATED ROLL-UP ENGINE)</span>
            </div>
            <h3 className="text-sm font-black text-white">
              Gabaasni Manneen Barnootaa Hunda Irraa Offumaan Qinda'a
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              Manneen Barnootaa yoo ragaa galmeessan, sirni SRS KITESA ogeessa malee <strong>ofii isaatii gabaasota TAB A - TAB I hunda Sadarkaa Aanaattis ta'e Sadarkaa Godinaatti walitti fiduun qindeessa!</strong> Ogeessi Aanaa ykn Godinaa irra deebi'ee qindeessuun irra hin jiraatu.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-3 rounded-xl text-center shrink-0 min-w-[170px]">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Level Active</span>
          <span className="text-sm font-black text-amber-300">
            {woredaVal !== 'ALL_WOREDAS'
              ? `🏛️ Aanaa ${woredaVal}`
              : zoneVal !== 'ALL_ZONES'
              ? `🗺️ Godina ${zoneVal}`
              : '🌐 Naannoo Oromiyaa'}
          </span>
        </div>
      </div>

      {/* Security, De-duplication & Fraud Detection Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        {/* Card 1: Deduplication */}
        <div className="bg-slate-900 border border-indigo-800/80 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded-full text-[9px] font-black uppercase">
              DE-DUPLICATION ENGINE
            </span>
            <h4 className="text-xs font-black text-amber-300">🔍 Ragaalee Duplicated Haquu</h4>
            <p className="text-[11px] text-slate-300">
              Ragaa irra-deebi'amu M/B, Aanaa, Godina & Oromiyaa irratti permission gaafatee balleessa.
            </p>
          </div>
          {onOpenDeduplication && (
            <button
              onClick={onOpenDeduplication}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow"
            >
              Fayyadam
            </button>
          )}
        </div>

        {/* Card 2: Fraud Detection */}
        <div className="bg-slate-900 border border-rose-900/80 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-700/60 rounded-full text-[9px] font-black uppercase">
              ANTI-FRAUD SHIELD
            </span>
            <h4 className="text-xs font-black text-rose-300">🛡️ Ragaalee Sobaa Qabuu & Dhowwuu</h4>
            <p className="text-[11px] text-slate-300">
              Gabaasota M/B / Aanaa seeraan ala dhihaatan fi gabaasa irra-deddeebi'amu dhowwa.
            </p>
          </div>
          {onOpenFraudDetection && (
            <button
              onClick={onOpenFraudDetection}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow"
            >
              Fayyadam
            </button>
          )}
        </div>

        {/* Card 3: Secure Link Transfer */}
        <div className="bg-slate-900 border border-emerald-800/80 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded-full text-[9px] font-black uppercase">
              INSTITUTIONAL AUTH
            </span>
            <h4 className="text-xs font-black text-emerald-300">🔒 Nageenya Linkii Gabaasaa</h4>
            <p className="text-[11px] text-slate-300">
              M/B ➔ Aanaa ➔ Godina ➔ Oromiyaa ergamuuf Gmail & Password mana hojii gaafata.
            </p>
          </div>
          {onOpenSecureTransfer && (
            <button
              onClick={onOpenSecureTransfer}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow"
            >
              Fayyadam
            </button>
          )}
        </div>
      </div>

      {/* Global Multi-Level Filter Bar for Reports */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-700/50 shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Calaltuu Level Gabaasaa (Report Filtering Level)</h3>
            <p className="text-[11px] text-slate-300">Gabaasni Sub-tabs 9'n gadii calaltuu Godina, Aanaa fi M/Barumsaa filatame kanaan socho'a:</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Godina:</span>
            <select
              value={zoneVal}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="bg-slate-900 border border-amber-500/50 text-white text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="ALL_ZONES">🗺️ Godina Hunda</option>
              {allZones.map((z) => (
                <option key={z} value={z}>
                  📍 {z}
                </option>
              ))}
            </select>
          </div>

          {/* Woreda Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-200">
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <span>Aanaa:</span>
            <select
              value={woredaVal}
              onChange={(e) => handleWoredaChange(e.target.value)}
              className="bg-slate-900 border border-sky-500/50 text-white text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              <option value="ALL_WOREDAS">🏛️ Aanaa Hunda</option>
              {allWoredas.map((w) => (
                <option key={w} value={w}>
                  🏛️ {w}
                </option>
              ))}
            </select>
          </div>

          {/* School Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-indigo-400/40 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-200">
            <School className="w-3.5 h-3.5 text-indigo-400" />
            <span>M/B:</span>
            <select
              value={schoolVal}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="bg-slate-900 border border-indigo-400/50 text-white text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="ALL_WOREDA">🏫 M/Barumsaa Hunda</option>
              {allSchools.map((sch) => (
                <option key={sch} value={sch}>
                  🏫 {sch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Tab A to Tab I) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm print:hidden overflow-x-auto">
        <div className="flex gap-1 min-w-[900px]">
          
          <button
            onClick={() => setActiveTab('tabA_karoora')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabA_karoora' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Tab A: Karoora Galchu</span>
          </button>

          <button
            onClick={() => setActiveTab('tabB_waligalaa')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabB_waligalaa' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Tab B: Gabaasa Waliigalaa</span>
          </button>

          <button
            onClick={() => setActiveTab('tabC_guyyaa')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabC_guyyaa' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tab C: Gabaasa Guyyaa</span>
          </button>

          <button
            onClick={() => setActiveTab('tabD_galmee_dheeraa')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabD_galmee_dheeraa' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tab D: Galmee Dheeraa</span>
          </button>

          <button
            onClick={() => setActiveTab('tabE_miidhama_roster')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabE_miidhama_roster' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Tab E: Miidhama Qaamaa Maqaan</span>
          </button>

          <button
            onClick={() => setActiveTab('tabF_miidhama_summary')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabF_miidhama_summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tab F: Miidhama Qaamaa Daataan</span>
          </button>

          <button
            onClick={() => setActiveTab('tabG_irra_deebii_roster')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabG_irra_deebii_roster' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tab G: Irra Deebii Maqaan</span>
          </button>

          <button
            onClick={() => setActiveTab('tabH_irra_deebii_summary')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabH_irra_deebii_summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Tab H: Irra Deebii Daataan</span>
          </button>

          <button
            onClick={() => setActiveTab('tabI_karoora_raawwii')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tabI_karoora_raawwii' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Tab I: Karoora vs Raawwii %</span>
          </button>

        </div>
      </div>

      {/* Report Global Filters (Umurii 7 & Alphabet Sort) */}
      <div className="bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-black text-slate-800">Calallii Gabaasaa (Report Filters):</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Umurii Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Umurii:</span>
            <select
              value={reportAgeFilter}
              onChange={(e) => setReportAgeFilter(e.target.value as any)}
              className={`py-1.5 px-3 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 border cursor-pointer transition ${
                reportAgeFilter === '7'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">Umurii Hundaa (All Ages)</option>
              <option value="7">⚡ Umurii 7 Qofa (Age 7 Only)</option>
              <option value="4_6">Bu'uura Boruu (Umurii 4-6)</option>
              <option value="8_plus">Umurii 8 fi Isaa Ol</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Tartiiba:</span>
            <select
              value={reportSortOrder}
              onChange={(e) => setReportSortOrder(e.target.value as any)}
              className="py-1.5 px-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="AZ">🔤 Alphabet (A - Z)</option>
              <option value="ZA">🔤 Alphabet (Z - A)</option>
              <option value="DEFAULT">📋 Default</option>
            </select>
          </div>

          {/* Quick Filter Badge */}
          {reportAgeFilter === '7' && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-extrabold animate-pulse flex items-center gap-1">
              ✓ Barattoota Umurii 7 Qofa Agarsiisaa Jira! ({schoolStudents.length})
            </span>
          )}
        </div>
      </div>

      {/* Printable Official Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-black uppercase text-slate-900">
          Gabaasa Manneen Barnootaa / School Education Report
        </h1>
        <h2 className="text-md font-bold text-slate-800">
          {settings.savedSchoolName} — Bara Barnootaa {settings.baraBarnootaa} E.C
        </h2>
        <p className="text-xs text-slate-600 font-mono mt-1">
          Guyyaa Gabaasaa: {new Date().toLocaleDateString('en-GB')}
        </p>
      </div>

      {/* TAB A: Karoora Galchuu */}
      {activeTab === 'tabA_karoora' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Tab A: Kutaa Karoora Galchuu (Grade Target Configuration)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Karoora barattoota dhiiraa fi dhalaa kutaa 1-12 guutaa save godhaa. Ida'amni marsaa (1-6, 7-8, 1-8, 9-12, 1-12) ofumaan herregama.
              </p>
            </div>
          </div>

          {targetSuccessMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Karoorri barattootaa milkaa'inaan save ta'eera! (Targets updated successfully)</span>
            </div>
          )}

          <form onSubmit={handleSaveTargetsSubmit} className="space-y-6">
            {/* Section 1: Kutaa 1 - 6 */}
            <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <h4 className="font-extrabold text-sm text-indigo-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>1. Kutaa 1 - 6 (Primary Lower)</span>
                <span className="text-xs font-semibold text-slate-500">Kutaa 1 hanga 6</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {['1', '2', '3', '4', '5', '6'].map((g) => {
                  const target = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                  return (
                    <div key={g} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                      <h5 className="font-extrabold text-xs text-indigo-900">Kutaa {g}</h5>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhiira</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhiira}
                            onChange={(e) => handleTargetChange(g, 'dhiira', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-sky-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhalaa</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhalaa}
                            onChange={(e) => handleTargetChange(g, 'dhalaa', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-800 text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-100 flex justify-between">
                        <span>Ida'ama:</span>
                        <span className="text-indigo-700 font-mono">{target.dhiira + target.dhalaa}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Banner 1-6 */}
              {(() => {
                const sub1_6 = ['1', '2', '3', '4', '5', '6'].reduce(
                  (acc, g) => {
                    const t = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                    return { dhiira: acc.dhiira + t.dhiira, dhalaa: acc.dhalaa + t.dhalaa };
                  },
                  { dhiira: 0, dhalaa: 0 }
                );
                return (
                  <div className="p-3 bg-indigo-100/80 border border-indigo-300 rounded-xl text-xs flex flex-wrap items-center justify-between font-bold text-indigo-950">
                    <span className="uppercase tracking-wider">Ida'ama Karooraa Kutaa 1-6:</span>
                    <div className="flex gap-4">
                      <span>Dhiira: <strong className="text-sky-800">{sub1_6.dhiira}</strong></span>
                      <span>Dhalaa: <strong className="text-rose-800">{sub1_6.dhalaa}</strong></span>
                      <span>Ida'ama: <strong className="text-indigo-900 font-black">{sub1_6.dhiira + sub1_6.dhalaa}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Section 2: Kutaa 7 - 8 */}
            <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <h4 className="font-extrabold text-sm text-indigo-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>2. Kutaa 7 - 8 (Primary Upper)</span>
                <span className="text-xs font-semibold text-slate-500">Kutaa 7 fi 8</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                {['7', '8'].map((g) => {
                  const target = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                  return (
                    <div key={g} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                      <h5 className="font-extrabold text-xs text-indigo-900">Kutaa {g}</h5>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhiira</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhiira}
                            onChange={(e) => handleTargetChange(g, 'dhiira', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-sky-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhalaa</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhalaa}
                            onChange={(e) => handleTargetChange(g, 'dhalaa', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-800 text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-100 flex justify-between">
                        <span>Ida'ama:</span>
                        <span className="text-indigo-700 font-mono">{target.dhiira + target.dhalaa}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Banners 7-8 and 1-8 */}
              {(() => {
                const sub7_8 = ['7', '8'].reduce(
                  (acc, g) => {
                    const t = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                    return { dhiira: acc.dhiira + t.dhiira, dhalaa: acc.dhalaa + t.dhalaa };
                  },
                  { dhiira: 0, dhalaa: 0 }
                );
                const sub1_8 = ['1', '2', '3', '4', '5', '6', '7', '8'].reduce(
                  (acc, g) => {
                    const t = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                    return { dhiira: acc.dhiira + t.dhiira, dhalaa: acc.dhalaa + t.dhalaa };
                  },
                  { dhiira: 0, dhalaa: 0 }
                );
                return (
                  <div className="space-y-2">
                    <div className="p-3 bg-indigo-100/80 border border-indigo-300 rounded-xl text-xs flex flex-wrap items-center justify-between font-bold text-indigo-950">
                      <span className="uppercase tracking-wider">Ida'ama Karooraa Kutaa 7-8:</span>
                      <div className="flex gap-4">
                        <span>Dhiira: <strong className="text-sky-800">{sub7_8.dhiira}</strong></span>
                        <span>Dhalaa: <strong className="text-rose-800">{sub7_8.dhalaa}</strong></span>
                        <span>Ida'ama: <strong className="text-indigo-900 font-black">{sub7_8.dhiira + sub7_8.dhalaa}</strong></span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100/80 border border-purple-300 rounded-xl text-xs flex flex-wrap items-center justify-between font-bold text-purple-950">
                      <span className="uppercase tracking-wider">Ida'ama Karooraa Kutaa 1-8 (Primary Total):</span>
                      <div className="flex gap-4">
                        <span>Dhiira: <strong className="text-sky-800">{sub1_8.dhiira}</strong></span>
                        <span>Dhalaa: <strong className="text-rose-800">{sub1_8.dhalaa}</strong></span>
                        <span>Ida'ama: <strong className="text-purple-900 font-black">{sub1_8.dhiira + sub1_8.dhalaa}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Section 3: Kutaa 9 - 12 */}
            <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <h4 className="font-extrabold text-sm text-indigo-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>3. Kutaa 9 - 12 (Secondary)</span>
                <span className="text-xs font-semibold text-slate-500">Kutaa 9 hanga 12</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {['9', '10', '11', '12'].map((g) => {
                  const target = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                  return (
                    <div key={g} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                      <h5 className="font-extrabold text-xs text-indigo-900">Kutaa {g}</h5>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhiira</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhiira}
                            onChange={(e) => handleTargetChange(g, 'dhiira', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-sky-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Dhalaa</label>
                          <input
                            type="number"
                            min="0"
                            value={target.dhalaa}
                            onChange={(e) => handleTargetChange(g, 'dhalaa', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-800 text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-100 flex justify-between">
                        <span>Ida'ama:</span>
                        <span className="text-indigo-700 font-mono">{target.dhiira + target.dhalaa}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Banners 9-12 and 1-12 */}
              {(() => {
                const sub9_12 = ['9', '10', '11', '12'].reduce(
                  (acc, g) => {
                    const t = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                    return { dhiira: acc.dhiira + t.dhiira, dhalaa: acc.dhalaa + t.dhalaa };
                  },
                  { dhiira: 0, dhalaa: 0 }
                );
                const sub1_12 = Array.from({ length: 12 }, (_, i) => String(i + 1)).reduce(
                  (acc, g) => {
                    const t = editingTargets[g] || { dhiira: 0, dhalaa: 0 };
                    return { dhiira: acc.dhiira + t.dhiira, dhalaa: acc.dhalaa + t.dhalaa };
                  },
                  { dhiira: 0, dhalaa: 0 }
                );
                return (
                  <div className="space-y-2">
                    <div className="p-3 bg-indigo-100/80 border border-indigo-300 rounded-xl text-xs flex flex-wrap items-center justify-between font-bold text-indigo-950">
                      <span className="uppercase tracking-wider">Ida'ama Karooraa Kutaa 9-12:</span>
                      <div className="flex gap-4">
                        <span>Dhiira: <strong className="text-sky-800">{sub9_12.dhiira}</strong></span>
                        <span>Dhalaa: <strong className="text-rose-800">{sub9_12.dhalaa}</strong></span>
                        <span>Ida'ama: <strong className="text-indigo-900 font-black">{sub9_12.dhiira + sub9_12.dhalaa}</strong></span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between font-bold border-2 border-amber-400">
                      <span className="uppercase tracking-wider text-amber-300 font-black">Ida'ama Waliigalaa Karooraa (Kutaa 1-12):</span>
                      <div className="flex gap-6 text-sm">
                        <span>Dhiira: <strong className="text-sky-300">{sub1_12.dhiira}</strong></span>
                        <span>Dhalaa: <strong className="text-rose-300">{sub1_12.dhalaa}</strong></span>
                        <span>Ida'ama: <strong className="text-amber-300 font-black">{sub1_12.dhiira + sub1_12.dhalaa}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="text-right pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs cursor-pointer"
              >
                Karoora Ol-ka'i (Save All Targets)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB B: Gabaasa Waliigalaa Barataa (Master Grid) */}
      {activeTab === 'tabB_waligalaa' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                <span>Tab B: Gabaasa Waligalaa Barataa Galmaa'e (Full Registration Grid)</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {zoneVal === 'ALL_ZONES' && woredaVal === 'ALL_WOREDAS' && schoolVal === 'ALL_WOREDA'
                    ? '🏛️ Sadarkaa Oromiyaa (Waliigala)'
                    : zoneVal !== 'ALL_ZONES' && woredaVal === 'ALL_WOREDAS' && schoolVal === 'ALL_WOREDA'
                    ? `📍 Sadarkaa Godinaa: ${zoneVal}`
                    : woredaVal !== 'ALL_WOREDAS' && schoolVal === 'ALL_WOREDA'
                    ? `🏛️ Sadarkaa Aanaa: ${woredaVal}`
                    : `🏫 Mana Barumsaa: ${schoolVal}`}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  • Barattoota Waliigalaa: <strong className="text-indigo-700 font-mono">{schoolStudents.length}</strong> (Dhiira: <strong className="text-sky-700 font-mono">{schoolStudents.filter(s => s.koorniyaa === 'Dhiira').length}</strong>, Dhalaa: <strong className="text-rose-700 font-mono">{schoolStudents.filter(s => s.koorniyaa === 'Dhalaa').length}</strong>)
                </span>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Barbaadi (Maqaa, STUI, M/B, Aanaa)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px] border-b border-slate-300">
                <tr>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center"># (A)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Naannoo (B)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Godina (C)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Aanaa (D)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Mana Barumsaa (E)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Ganda (F)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap text-center bg-indigo-50/70 text-indigo-950 font-bold">Lakk. STUI Barataa (G)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap bg-emerald-50/70 text-emerald-950 font-bold">Maqaa Guutuu Barataa (H)</th>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center bg-sky-50/70 text-sky-950 font-bold">Koorniyaa (I)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap text-center">FAN ID (J)</th>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center">Kutaa (K)</th>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center">Daree (L)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Bara Dhalootaa (M)</th>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center">Umurii (N)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Haala Galmee (O)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Bara Irra Deebii (P)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Bara Addaan Kute (Q)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Haala Maatii (R)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Miidhama Qaamaa (S)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Gosa Miidhamaa (T)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Bilbila Barataa (U)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Bilbila Maatii (V)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Maqaa Haadhaa (W)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">M/B Duraan (X)</th>
                  <th className="px-2.5 py-3 border-r whitespace-nowrap text-center">Qabxii % (Y)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Guyyaa Galmee (Z)</th>
                  <th className="px-3 py-3 border-r whitespace-nowrap">Barsiisaa (AA)</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">Tarkaanfii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolStudents
                  .filter(
                    (s) =>
                      s.maqaaGuutuu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.ganda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.fanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (s.nationalId && s.nationalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (s.godina && s.godina.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (s.aanaa && s.aanaa.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (s.manaBarumsaa && s.manaBarumsaa.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 font-medium border-b border-slate-100">
                      <td className="px-2.5 py-2 border-r text-slate-400 font-mono text-[11px] text-center">{idx + 1}</td>
                      <td className="px-3 py-2 border-r text-slate-600 whitespace-nowrap">Oromiyaa</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.godina || (zoneVal !== 'ALL_ZONES' ? zoneVal : 'Shawaa Lixaa')}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.aanaa || (woredaVal !== 'ALL_WOREDAS' ? woredaVal : 'Meta Wolkite')}</td>
                      <td className="px-3 py-2 border-r text-slate-800 font-semibold whitespace-nowrap">{(s.manaBarumsaa && !/^\d+$/.test(String(s.manaBarumsaa).trim())) ? s.manaBarumsaa : (schoolVal !== 'ALL_WOREDA' ? schoolVal : (settings.savedSchoolName || 'Mana Barumsaa Waliigalaa'))}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.ganda || 'Ganda 01'}</td>
                      <td className="px-3 py-2 border-r font-mono text-indigo-700 font-bold whitespace-nowrap text-center bg-indigo-50/30">
                        {s.nationalId || s.id || '-'}
                      </td>
                      <td className="px-3 py-2 border-r font-bold text-slate-900 whitespace-nowrap bg-emerald-50/30">{s.maqaaGuutuu}</td>
                      <td className="px-2.5 py-2 border-r whitespace-nowrap text-center bg-sky-50/30">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${s.koorniyaa === 'Dhiira' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.koorniyaa}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r font-mono text-slate-700 font-bold whitespace-nowrap text-center">{s.fanId}</td>
                      <td className="px-2.5 py-2 border-r font-bold whitespace-nowrap text-center">Kutaa {s.kutaa}</td>
                      <td className="px-2.5 py-2 border-r text-center font-bold whitespace-nowrap">{s.daree}</td>
                      <td className="px-3 py-2 border-r font-mono whitespace-nowrap text-slate-800">{s.baraDhalootaa}</td>
                      <td className="px-2.5 py-2 border-r text-center font-bold whitespace-nowrap">{s.umurii}</td>
                      <td className="px-3 py-2 border-r text-amber-900 font-bold whitespace-nowrap">{s.haalaGalmee}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.baraIrraDeebii || '-'}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.baraAddaanKute || '-'}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.haalaMaatii || 'Akka Maatiitti'}</td>
                      <td className="px-3 py-2 border-r whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${s.miidhamaQaamaa === 'Eeyyee' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                          {s.miidhamaQaamaa}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.miidhamaQaamaa === 'Eeyyee' ? s.gosaMiidhamaa || '-' : '-'}</td>
                      <td className="px-3 py-2 border-r font-mono text-slate-700 whitespace-nowrap">{s.lakkBilbilaBarataa || '-'}</td>
                      <td className="px-3 py-2 border-r font-mono text-slate-700 whitespace-nowrap">{s.lakkBilbilaMaatii || '-'}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.maqaaHaadhaa || '-'}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.mbDuraan || '-'}</td>
                      <td className="px-2.5 py-2 border-r font-bold text-emerald-800 text-center whitespace-nowrap">{s.avireejjiiQabxii}%</td>
                      <td className="px-3 py-2 border-r text-slate-600 whitespace-nowrap font-mono text-[11px]">{s.guyyaaGalmee}</td>
                      <td className="px-3 py-2 border-r text-slate-700 whitespace-nowrap">{s.barsiisaaGalmeessee || '-'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Ilaali / View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onUpdateStudent && (
                            <button
                              onClick={() => setEditingStudent(s)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Gulaali / Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteStudent && (
                            <button
                              onClick={() => setDeletingId(s.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Haqi / Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: Guca Gabaasa Guyyaa Guyyaa */}
      {activeTab === 'tabC_guyyaa' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Tab C: Guca Gabaasa Guyyaa Guyyaa (Daily Registration Report)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Barattoota guyyaa har'aa galma'an kutaa fi koorniyaan qindeessuu. Ida'ama 1-6, 7-8, 1-8, 9-12 fi 1-12 of keessatti qaba.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900">
              Guyyaa Har'aa: {todayFormatted} ({todayStr})
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="border border-slate-300 p-2.5">Kutaa / Ida'ama</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhiira (Today)</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhalaa (Today)</th>
                  <th className="border border-slate-300 p-2.5 text-center bg-indigo-50 text-indigo-900">Ida'ama Guyyaa</th>
                </tr>
              </thead>
              <tbody>
                {getStructuredGradeStats(schoolStudents.filter((s) => s.guyyaaGalmee === todayStr || s.guyyaaGalmee === todayFormatted)).map((st) => (
                  <tr
                    key={st.key}
                    className={
                      st.isGrandTotal
                        ? 'bg-slate-900 text-white font-black'
                        : st.isSubtotal
                        ? 'bg-indigo-100/90 text-indigo-950 font-extrabold border-t-2 border-b-2 border-indigo-300'
                        : 'hover:bg-slate-50 font-medium'
                    }
                  >
                    <td className={`border border-slate-300 p-2 font-bold ${st.isGrandTotal ? 'text-amber-300' : st.isSubtotal ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                      {st.kutaa}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-sky-700 font-bold">{st.dhiira}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{st.dhalaa}</td>
                    <td className={`border border-slate-300 p-2 text-center font-black ${st.isGrandTotal ? 'bg-amber-400 text-slate-900' : st.isSubtotal ? 'bg-indigo-200/60 text-indigo-950' : 'bg-indigo-50/50 text-indigo-900'}`}>
                      {st.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: Gabaasa Galmee Waligalaa */}
      {activeTab === 'tabD_galmee_dheeraa' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Tab D: Gabaasa Galmee Waligalaa (Overall Progress Report)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Hanguma guyyaan dabalaa deemuun galmee qindeessaa deema (1-6, 7-8, 1-8, 9-12, 1-12).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="border border-slate-300 p-2.5">Kutaa / Ida'ama</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhiira</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhalaa</th>
                  <th className="border border-slate-300 p-2.5 text-center bg-indigo-50 text-indigo-900">Ida'ama Waligalaa</th>
                </tr>
              </thead>
              <tbody>
                {structuredGradeStats.map((st) => (
                  <tr
                    key={st.key}
                    className={
                      st.isGrandTotal
                        ? 'bg-slate-900 text-white font-black'
                        : st.isSubtotal
                        ? 'bg-indigo-100/90 text-indigo-950 font-extrabold border-t-2 border-b-2 border-indigo-300'
                        : 'hover:bg-slate-50 font-medium'
                    }
                  >
                    <td className={`border border-slate-300 p-2 font-bold ${st.isGrandTotal ? 'text-amber-300' : st.isSubtotal ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                      {st.kutaa}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-sky-700 font-bold">{st.dhiira}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{st.dhalaa}</td>
                    <td className={`border border-slate-300 p-2 text-center font-black ${st.isGrandTotal ? 'bg-amber-400 text-slate-900' : st.isSubtotal ? 'bg-indigo-200/60 text-indigo-950' : 'bg-indigo-50/50 text-indigo-900'}`}>
                      {st.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB E: Miidhama Qaamaa Roster */}
      {activeTab === 'tabE_miidhama_roster' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <span>Tab E: Barattoota Miidhama Qaama Qaban (Special Needs Roster)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Maqaa, kutaa, koorniyaa fi gosa miidhama qaamaa isaaniin qindaaye.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3 border text-center">#</th>
                  <th className="p-3 border text-center">Lakk. STUI Barataa (STU ID)</th>
                  <th className="p-3 border">Maqaa Guutuu Barataa</th>
                  <th className="p-3 border text-center">Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)</th>
                  <th className="p-3 border text-center">Kutaa</th>
                  <th className="p-3 border text-center">Koorniyaa</th>
                  <th className="p-3 border">Gosa Miidhamaa</th>
                  <th className="p-3 border">Ganda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolStudents
                  .filter((s) => s.miidhamaQaamaa === 'Eeyyee')
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 font-medium">
                      <td className="p-3 border text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-3 border font-mono text-indigo-700 font-bold text-center">{s.nationalId || s.id || '-'}</td>
                      <td className="p-3 border font-bold text-slate-900">{s.maqaaGuutuu}</td>
                      <td className="p-3 border font-mono text-slate-700 font-bold text-center">{s.fanId}</td>
                      <td className="p-3 border text-center">Kutaa {s.kutaa} ({s.daree})</td>
                      <td className="p-3 border text-center">{s.koorniyaa}</td>
                      <td className="p-3 border font-bold text-amber-800 bg-amber-50">{s.gosaMiidhamaa || 'Unspecified'}</td>
                      <td className="p-3 border">{s.ganda}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB F: Lakkoofsa Miidhama Qaamaa Summary */}
      {activeTab === 'tabF_miidhama_summary' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Tab F: Gabaasa Lakkoofsa Miidhama Qaamaa (Special Needs Summary)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Baay'ina barattoota miidhama qaamaa kutaa fi koorniyaan (ida'ama marsaa 1-6, 7-8, 1-8, 9-12, 1-12 wajjin).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="border border-slate-300 p-2.5">Kutaa / Ida'ama</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhiira</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhalaa</th>
                  <th className="border border-slate-300 p-2.5 text-center bg-indigo-50 text-indigo-900">Ida'ama</th>
                </tr>
              </thead>
              <tbody>
                {getStructuredGradeStats(schoolStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee')).map((st) => (
                  <tr
                    key={st.key}
                    className={
                      st.isGrandTotal
                        ? 'bg-slate-900 text-white font-black'
                        : st.isSubtotal
                        ? 'bg-indigo-100/90 text-indigo-950 font-extrabold border-t-2 border-b-2 border-indigo-300'
                        : 'hover:bg-slate-50 font-medium'
                    }
                  >
                    <td className={`border border-slate-300 p-2 font-bold ${st.isGrandTotal ? 'text-amber-300' : st.isSubtotal ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                      {st.kutaa}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-sky-700 font-bold">{st.dhiira}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{st.dhalaa}</td>
                    <td className={`border border-slate-300 p-2 text-center font-black ${st.isGrandTotal ? 'bg-amber-400 text-slate-900' : st.isSubtotal ? 'bg-indigo-200/60 text-indigo-950' : 'bg-indigo-50/50 text-indigo-900'}`}>
                      {st.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB G: Irra Deebii Roster */}
      {activeTab === 'tabG_irra_deebii_roster' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              <span>Tab G: Barattoota Irra Deebi'an Roster (Repeaters List)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Irra deebii (kufe), Irra deebii (kutee), fi M/B biroo walitti makee.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3 border text-center">#</th>
                  <th className="p-3 border text-center">Lakk. STUI Barataa (STU ID)</th>
                  <th className="p-3 border">Maqaa Guutuu Barataa</th>
                  <th className="p-3 border text-center">Lakkoofsa waraqaa eenyummaa Dijitaalaa (FAN)</th>
                  <th className="p-3 border text-center">Kutaa</th>
                  <th className="p-3 border text-center">Koorniyaa</th>
                  <th className="p-3 border">Haala Galmee</th>
                  <th className="p-3 border text-center">Bara Irra Deebii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolStudents
                  .filter((s) => s.haalaGalmee.toLowerCase().includes('irra deebii'))
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 font-medium">
                      <td className="p-3 border text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-3 border font-mono text-indigo-700 font-bold text-center">{s.nationalId || s.id || '-'}</td>
                      <td className="p-3 border font-bold text-slate-900">{s.maqaaGuutuu}</td>
                      <td className="p-3 border font-mono text-slate-700 font-bold text-center">{s.fanId}</td>
                      <td className="p-3 border text-center">Kutaa {s.kutaa}</td>
                      <td className="p-3 border text-center">{s.koorniyaa}</td>
                      <td className="p-3 border font-bold text-rose-700 bg-rose-50">{s.haalaGalmee}</td>
                      <td className="p-3 border font-mono font-bold text-center">{s.baraIrraDeebii || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB H: Irra Deebii Summary */}
      {activeTab === 'tabH_irra_deebii_summary' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Tab H: Gabaasa Lakkoofsa Irra Deebii (Repeaters Statistical Summary)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Lakkoofsa barattoota irra deebi'anii kutaa fi koorniyaan (ida'ama marsaa 1-6, 7-8, 1-8, 9-12, 1-12 wajjin).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                <tr>
                  <th className="border border-slate-300 p-2.5">Kutaa / Ida'ama</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhiira</th>
                  <th className="border border-slate-300 p-2.5 text-center">Dhalaa</th>
                  <th className="border border-slate-300 p-2.5 text-center bg-indigo-50 text-indigo-900">Ida'ama</th>
                </tr>
              </thead>
              <tbody>
                {getStructuredGradeStats(schoolStudents.filter((s) => s.haalaGalmee.toLowerCase().includes('irra deebii'))).map((st) => (
                  <tr
                    key={st.key}
                    className={
                      st.isGrandTotal
                        ? 'bg-slate-900 text-white font-black'
                        : st.isSubtotal
                        ? 'bg-indigo-100/90 text-indigo-950 font-extrabold border-t-2 border-b-2 border-indigo-300'
                        : 'hover:bg-slate-50 font-medium'
                    }
                  >
                    <td className={`border border-slate-300 p-2 font-bold ${st.isGrandTotal ? 'text-amber-300' : st.isSubtotal ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                      {st.kutaa}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-sky-700 font-bold">{st.dhiira}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{st.dhalaa}</td>
                    <td className={`border border-slate-300 p-2 text-center font-black ${st.isGrandTotal ? 'bg-amber-400 text-slate-900' : st.isSubtotal ? 'bg-indigo-200/60 text-indigo-950' : 'bg-indigo-50/50 text-indigo-900'}`}>
                      {st.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB I: Karoora vs Raawwii % (Primary Woreda Office Report) */}
      {activeTab === 'tabI_karoora_raawwii' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              <span>Tab I: Gabaasa Qulqulluu Karoora vs Raawwii & % (Master Education Report)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gabaasa Karoora, Raawwii fi Parsentii (%) marsaa barnoota ammayyaa (1-6, 7-8, 1-8, 9-12 fi 1-12) wajjin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead className="bg-slate-800 text-white font-bold text-[11px] text-center">
                <tr>
                  <th className="border border-slate-400 p-2.5 text-left" rowSpan={2}>Kutaa / Ida'ama</th>
                  <th className="border border-slate-400 p-2 bg-indigo-950/60" colSpan={3}>Karoora (Target)</th>
                  <th className="border border-slate-400 p-2 bg-sky-950/60" colSpan={3}>Raawwii (Actual)</th>
                  <th className="border border-slate-400 p-2 bg-emerald-950/60" colSpan={3}>Raawwii Parsentii (%)</th>
                </tr>
                <tr className="bg-slate-700">
                  <th className="border border-slate-400 p-1.5">Dhiira</th>
                  <th className="border border-slate-400 p-1.5">Dhalaa</th>
                  <th className="border border-slate-400 p-1.5 font-bold">Total</th>
                  <th className="border border-slate-400 p-1.5">Dhiira</th>
                  <th className="border border-slate-400 p-1.5">Dhalaa</th>
                  <th className="border border-slate-400 p-1.5 font-bold">Total</th>
                  <th className="border border-slate-400 p-1.5 text-sky-200">Dhiira %</th>
                  <th className="border border-slate-400 p-1.5 text-rose-200">Dhalaa %</th>
                  <th className="border border-slate-400 p-1.5 font-bold text-emerald-200">Ida'ama %</th>
                </tr>
              </thead>
              <tbody>
                {structuredGradeStats.map((st) => (
                  <tr
                    key={st.key}
                    className={
                      st.isGrandTotal
                        ? 'bg-slate-900 text-white font-black'
                        : st.isSubtotal
                        ? 'bg-indigo-100/90 text-indigo-950 font-extrabold border-t-2 border-b-2 border-indigo-300'
                        : 'hover:bg-slate-50 font-medium'
                    }
                  >
                    <td
                      className={`border border-slate-400 p-2 font-black ${
                        st.isGrandTotal
                          ? 'text-amber-300 bg-slate-900'
                          : st.isSubtotal
                          ? 'text-indigo-950 bg-indigo-100'
                          : 'text-slate-900 bg-slate-100/60'
                      }`}
                    >
                      {st.kutaa}
                    </td>
                    <td className="border border-slate-400 p-2 text-center text-slate-700 font-mono font-bold">{st.targetDhiira}</td>
                    <td className="border border-slate-400 p-2 text-center text-slate-700 font-mono font-bold">{st.targetDhalaa}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold text-indigo-900 bg-indigo-50/40">{st.targetTotal}</td>

                    <td className="border border-slate-400 p-2 text-center text-sky-700 font-bold">{st.dhiira}</td>
                    <td className="border border-slate-400 p-2 text-center text-rose-700 font-bold">{st.dhalaa}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold text-slate-900 bg-sky-50/40">{st.total}</td>

                    <td className="border border-slate-400 p-2 text-center font-mono font-bold text-sky-800 bg-emerald-50/30">
                      {st.pctDhiira}%
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono font-bold text-rose-800 bg-emerald-50/30">
                      {st.pctDhalaa}%
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono font-black text-emerald-900 bg-emerald-100/50">
                      {st.pctTotal}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Age 7 Specific Breakdown Table in Tab I */}
          <div className="mt-8 pt-6 border-t-2 border-amber-300 space-y-3">
            <h4 className="text-md font-black text-amber-950 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Barattoota Umurii 7 Qofa (Kutaa 1 Karoora vs Raawwii)</span>
              </span>
              <span className="text-xs bg-amber-200 text-amber-950 px-3 py-1 rounded-full font-extrabold">
                Waliigala Umurii 7: {baseSchoolStudents.filter((s) => s.umurii === 7).length} Barattoota
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-amber-300">
                <thead className="bg-amber-100 text-amber-950 font-bold text-[11px] text-center">
                  <tr>
                    <th className="border border-amber-300 p-2 text-left">Kutaa (Umurii 7)</th>
                    <th className="border border-amber-300 p-2 bg-amber-200/60" colSpan={3}>Karoora (Target U7)</th>
                    <th className="border border-amber-300 p-2 bg-amber-300/60" colSpan={3}>Raawwii (Actual U7)</th>
                    <th className="border border-amber-300 p-2 bg-amber-400/80" colSpan={3}>Raawwii (%)</th>
                  </tr>
                  <tr className="bg-amber-50">
                    <th className="border border-amber-300 p-1.5">Dhiira</th>
                    <th className="border border-amber-300 p-1.5">Dhalaa</th>
                    <th className="border border-amber-300 p-1.5 font-bold">Total</th>
                    <th className="border border-amber-300 p-1.5">Dhiira</th>
                    <th className="border border-amber-300 p-1.5">Dhalaa</th>
                    <th className="border border-amber-300 p-1.5 font-bold">Total</th>
                    <th className="border border-amber-300 p-1.5 text-sky-900">Dhiira %</th>
                    <th className="border border-amber-300 p-1.5 text-rose-900">Dhalaa %</th>
                    <th className="border border-amber-300 p-1.5 font-bold text-amber-950">Ida'ama %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 font-medium">
                  {['1'].map((gStr) => {
                    const inGradeU7 = baseSchoolStudents.filter((s) => s.kutaa === gStr && s.umurii === 7);
                    const dhiira = inGradeU7.filter((s) => s.koorniyaa === 'Dhiira').length;
                    const dhalaa = inGradeU7.filter((s) => s.koorniyaa === 'Dhalaa').length;
                    const totalActual = dhiira + dhalaa;

                    const isSingleSchool = Boolean(schoolVal && schoolVal !== 'ALL_WOREDA');
                    const isSingleWoreda = Boolean(woredaVal && woredaVal !== 'ALL_WOREDAS');

                    let u7Target = { dhiira: 0, dhalaa: 0 };
                    if (isSingleSchool) {
                      const { targets: schGrades } = getUnifiedSchoolGradeTargets(schoolVal, targets);
                      u7Target = schGrades['u7_' + gStr] || { dhiira: 0, dhalaa: 0 };
                    } else if (isSingleWoreda) {
                      const { gradeTargets: worGrades } = getUnifiedWoredaTargets(woredaVal, allSchools, students);
                      u7Target = worGrades['u7_' + gStr] || { dhiira: 0, dhalaa: 0 };
                    } else {
                      const { gradeTargets: allGrades } = getUnifiedWoredaTargets('ALL_WOREDAS', allSchools, students);
                      u7Target = allGrades['u7_' + gStr] || { dhiira: 0, dhalaa: 0 };
                    }

                    const target = u7Target;
                    const targetTotal = target.dhiira + target.dhalaa;
                    const pctDhiira = target.dhiira > 0 ? ((dhiira / target.dhiira) * 100).toFixed(1) : '0.0';
                    const pctDhalaa = target.dhalaa > 0 ? ((dhalaa / target.dhalaa) * 100).toFixed(1) : '0.0';
                    const pctTotal = targetTotal > 0 ? ((totalActual / targetTotal) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={gStr} className="hover:bg-amber-50/80">
                        <td className="border border-amber-300 p-2 font-extrabold text-amber-950 bg-amber-50">
                          Kutaa {gStr} (Umurii 7)
                        </td>
                        <td className="border border-amber-300 p-2 text-center text-slate-700 font-mono font-bold">{target.dhiira}</td>
                        <td className="border border-amber-300 p-2 text-center text-slate-700 font-mono font-bold">{target.dhalaa}</td>
                        <td className="border border-amber-300 p-2 text-center font-bold text-amber-900 bg-amber-100/50">{targetTotal}</td>

                        <td className="border border-amber-300 p-2 text-center text-sky-700 font-bold">{dhiira}</td>
                        <td className="border border-amber-300 p-2 text-center text-rose-700 font-bold">{dhalaa}</td>
                        <td className="border border-amber-300 p-2 text-center font-bold text-slate-900 bg-amber-100/30">{totalActual}</td>

                        <td className="border border-amber-300 p-2 text-center font-mono font-bold text-sky-900">{pctDhiira}%</td>
                        <td className="border border-amber-300 p-2 text-center font-mono font-bold text-rose-900">{pctDhalaa}%</td>
                        <td className="border border-amber-300 p-2 text-center font-mono font-black text-amber-950 bg-amber-200/60">{pctTotal}%</td>
                      </tr>
                    );
                  })}

                  {/* Subtotal Age 7 */}
                  {(() => {
                    const allU7 = baseSchoolStudents.filter((s) => s.umurii === 7);
                    const totActDhiira = allU7.filter((s) => s.koorniyaa === 'Dhiira').length;
                    const totActDhalaa = allU7.filter((s) => s.koorniyaa === 'Dhalaa').length;
                    const totActual = allU7.length;

                    const isSingleSchool = Boolean(schoolVal && schoolVal !== 'ALL_WOREDA');
                    const isSingleWoreda = Boolean(woredaVal && woredaVal !== 'ALL_WOREDAS');

                    let u7Target = { dhiira: 0, dhalaa: 0 };
                    if (isSingleSchool) {
                      const { targets: schGrades } = getUnifiedSchoolGradeTargets(schoolVal, targets);
                      u7Target = schGrades['u7_1'] || { dhiira: 0, dhalaa: 0 };
                    } else if (isSingleWoreda) {
                      const { gradeTargets: worGrades } = getUnifiedWoredaTargets(woredaVal, allSchools, students);
                      u7Target = worGrades['u7_1'] || { dhiira: 0, dhalaa: 0 };
                    } else {
                      const { gradeTargets: allGrades } = getUnifiedWoredaTargets('ALL_WOREDAS', allSchools, students);
                      u7Target = allGrades['u7_1'] || { dhiira: 0, dhalaa: 0 };
                    }

                    const totTgtDhiira = u7Target.dhiira;
                    const totTgtDhalaa = u7Target.dhalaa;
                    const totTgt = totTgtDhiira + totTgtDhalaa;

                    const pctDhiira = totTgtDhiira > 0 ? ((totActDhiira / totTgtDhiira) * 100).toFixed(1) : '0.0';
                    const pctDhalaa = totTgtDhalaa > 0 ? ((totActDhalaa / totTgtDhalaa) * 100).toFixed(1) : '0.0';
                    const pctTotal = totTgt > 0 ? ((totActual / totTgt) * 100).toFixed(1) : '0.0';

                    return (
                      <tr className="bg-amber-300 text-amber-950 font-black text-xs">
                        <td className="border border-amber-400 p-2.5">WALIIGALA BARATTOOTA UMURII 7 (KUTAA 1)</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{totTgtDhiira}</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{totTgtDhalaa}</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{totTgt}</td>

                        <td className="border border-amber-400 p-2 text-center font-mono">{totActDhiira}</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{totActDhalaa}</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{totActual}</td>

                        <td className="border border-amber-400 p-2 text-center font-mono">{pctDhiira}%</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{pctDhalaa}%</td>
                        <td className="border border-amber-400 p-2 text-center font-mono">{pctTotal}%</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Student Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Odeeffannoo Guutuu Barataa (24 Columns)</span>
              </h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
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
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">17. National ID / STU ID</span><span className="font-mono font-bold text-indigo-600">{viewingStudent.nationalId}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">18. Bilbila Barataa</span><span className="font-mono">{viewingStudent.lakkBilbilaBarataa || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg"><span className="text-slate-400 block">19. Bilbila Maatii</span><span className="font-mono">{viewingStudent.lakkBilbilaMaatii || '-'}</span></div>
                <div className="p-2 bg-slate-50 rounded-lg sm:col-span-2"><span className="text-slate-400 block">20. M/B Duraan</span><span className="font-bold text-amber-700">{viewingStudent.mbDuraan}</span></div>
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

      {/* Editing Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <span>Ragaa Barataa Fooyyessi: {editingStudent.maqaaGuutuu}</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maqaa Guutuu Barataa</label>
                <input
                  type="text"
                  required
                  value={editingStudent.maqaaGuutuu}
                  onChange={(e) => setEditingStudent({ ...editingStudent, maqaaGuutuu: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Koorniyaa</label>
                  <select
                    value={editingStudent.koorniyaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, koorniyaa: e.target.value as 'Dhiira' | 'Dhalaa' })}
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
                    value={editingStudent.kutaa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, kutaa: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STU ID (9 Digits)</label>
                  <input
                    type="text"
                    value={editingStudent.nationalId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">FAN ID</label>
                  <input
                    type="text"
                    value={editingStudent.fanId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fanId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ganda</label>
                  <input
                    type="text"
                    value={editingStudent.ganda}
                    onChange={(e) => setEditingStudent({ ...editingStudent, ganda: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qabxii Avireejjii (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingStudent.avireejjiiQabxii}
                    onChange={(e) => setEditingStudent({ ...editingStudent, avireejjiiQabxii: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Dhiisi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Gulaalcha Ol-ka'i (Update Student)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Consolidated Submission Report Modal (Woreda / Zone / Region) */}
      {showZonalSubmissionModal && (() => {
        const isWoredaActive = woredaVal && woredaVal !== 'ALL_WOREDAS';
        const isZoneActive = !isWoredaActive && zoneVal && zoneVal !== 'ALL_ZONES';

        const modalWoreda = isWoredaActive ? woredaVal : 'Aanoolee Hunda';
        const modalZone = isZoneActive ? zoneVal : (zoneVal !== 'ALL_ZONES' ? zoneVal : 'Godinaalee Hunda');
        
        const modalStudents = students.filter((s) => {
          if (zoneVal && zoneVal !== 'ALL_ZONES' && s.godina && s.godina !== zoneVal) return false;
          if (woredaVal && woredaVal !== 'ALL_WOREDAS' && s.aanaa && s.aanaa !== woredaVal) return false;
          return true;
        });

        const modalStats = getStructuredGradeStats(modalStudents);
        const modalSchools = Array.from(new Set([...allSchools, ...modalStudents.map((s) => s.manaBarumsaa)])).filter((s) => s && s.trim() !== '');
        const modalWoredas = Array.from(new Set([...allWoredas, ...modalStudents.map((s) => s.aanaa)])).filter((w) => w && w.trim() !== '');

        let customMap: Record<string, number> = {};
        try {
          const stored = localStorage.getItem('srs_custom_targets_map');
          if (stored) customMap = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }

        // Metrics for lower entities
        const entityMetrics = isWoredaActive
          ? modalSchools.map((sName) => {
              const schStu = modalStudents.filter((s) => (s.manaBarumsaa || '').trim().toLowerCase() === sName.trim().toLowerCase());
              const d = schStu.filter((s) => s.koorniyaa === 'Dhiira').length;
              const f = schStu.filter((s) => s.koorniyaa === 'Dhalaa').length;
              const total = schStu.length;
              const dis = schStu.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;
              const rep = schStu.filter((s) => s.haalaGalmee?.toLowerCase().includes('irra deebii')).length;
              const { totalTarget: target } = getUnifiedSchoolGradeTargets(sName, targets);
              const pct = target > 0 ? ((total / target) * 100).toFixed(1) : '0.0';
              return { name: sName, d, f, total, dis, rep, target, pct, type: 'M/Barumsaa' };
            })
          : modalWoredas.map((wName) => {
              const worStu = modalStudents.filter((s) => (s.aanaa || '').trim().toLowerCase() === wName.trim().toLowerCase());
              const d = worStu.filter((s) => s.koorniyaa === 'Dhiira').length;
              const f = worStu.filter((s) => s.koorniyaa === 'Dhalaa').length;
              const total = worStu.length;
              const dis = worStu.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;
              const rep = worStu.filter((s) => s.haalaGalmee?.toLowerCase().includes('irra deebii')).length;
              const { woredaTarget: target } = getUnifiedWoredaTargets(wName, allSchools, students);
              const pct = target > 0 ? ((total / target) * 100).toFixed(1) : '0.0';
              return { name: wName, d, f, total, dis, rep, target, pct, type: 'Aanaa' };
            });

        const totReg = modalStudents.length;
        const totDhiira = modalStudents.filter((s) => s.koorniyaa === 'Dhiira').length;
        const totDhalaa = modalStudents.filter((s) => s.koorniyaa === 'Dhalaa').length;
        const totDisabled = modalStudents.filter((s) => s.miidhamaQaamaa === 'Eeyyee').length;
        const totRepeaters = modalStudents.filter((s) => s.haalaGalmee?.toLowerCase().includes('irra deebii')).length;
        const grandTargetObj = modalStats.find((s) => s.isGrandTotal);
        const totTarget = grandTargetObj ? grandTargetObj.targetTotal : 1;
        const totPct = totTarget > 0 ? ((totReg / totTarget) * 100).toFixed(1) : '0.0';

        const reportScopeTitle = isWoredaActive
          ? `🏛️ GABAASA CONSALIDATED SADARKAA AANAA (${modalWoreda})`
          : isZoneActive
          ? `🗺️ GABAASA CONSALIDATED SADARKAA GODINAA (${modalZone})`
          : `🌐 GABAASA CONSALIDATED SADARKAA BIIROO BARNOOTAA OROMIYAA`;

        const zonalReportShareText = `📋 *${reportScopeTitle}* 🎓\n` +
          `🏛️ *Aanaa:* ${modalWoreda} | 🗺️ *Godina:* ${modalZone}\n` +
          `📅 *Bara Barnootaa:* ${settings.baraBarnootaa} E.C | 🏫 *Manneen Barnootaa:* ${modalSchools.length} | 🏛️ *Aanoolee:* ${modalWoredas.length}\n\n` +
          `📊 *WALIIGALA BARATTOOTA (BU'UURA BORUU - KUTAA 12):*\n` +
          `🎯 *Karoora Waliigalaa:* ${totTarget}\n` +
          `📝 *Raawwii Waliigalaa:* ${totReg} (${totPct}%)\n` +
          `👦 *Dhiira:* ${totDhiira} | 👧 *Dhalaa:* ${totDhalaa}\n` +
          `♿️ *Miidhama Qaamaa:* ${totDisabled} | 🔄 *Irra Deebii:* ${totRepeaters}\n\n` +
          `🏫 *QINDOOMINA RAAWWII (${isWoredaActive ? 'Manneen Barnootaa' : 'Aanoolee'}):*\n` +
          entityMetrics.map((sm, i) => `${i + 1}. *${sm.name}:* Raawwii ${sm.total} / Karoora ${sm.target} (${sm.pct}%) | Dh: ${sm.d}, DhL: ${sm.f}`).join('\n') +
          `\n\n🌐 *SRS KITESA System Link:* ${window.location.origin}${window.location.pathname}?view=reports`;

        const telegramModalUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(zonalReportShareText)}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 border-b border-indigo-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-lg font-black text-lg">
                    🏛️
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <span>BIIROO BARNOOTAA OROMIYAA - {reportScopeTitle}</span>
                    </h2>
                    <p className="text-xs text-amber-300 font-bold mt-0.5">
                      {isWoredaActive
                        ? `Gabaasa Consalidated Sadarkaa Aanatti Manneen Barnootaa Hunda Irraa Qinda'ee Godinaaf Ergamu`
                        : `Gabaasa Consalidated Sadarkaa Godinaatti Aanoolee Hunda Irraa Offumaan Qinda'e`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowZonalSubmissionModal(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
                {/* Info Bar */}
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 block">Aanaa</span>
                    <strong className="text-sm text-indigo-950 font-black">{modalWoreda}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 block">Godina</span>
                    <strong className="text-sm text-indigo-950 font-black">{modalZone}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 block">Manneen Barnootaa</span>
                    <strong className="text-sm text-indigo-950 font-black">{modalSchools.length} M/B</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 block">Bara Barnootaa</span>
                    <strong className="text-sm text-indigo-950 font-black">{settings.baraBarnootaa} E.C</strong>
                  </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow">
                    <p className="text-[10px] font-bold text-amber-400 uppercase">Karoora Waliigalaa</p>
                    <p className="text-2xl font-black text-amber-300 mt-1">{totTarget.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Bu'uura Boruu - K12</p>
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Raawwii Waliigalaa</p>
                    <p className="text-2xl font-black text-emerald-300 mt-1">{totReg.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Dhi: {totDhiira} | DhL: {totDhalaa}</p>
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow">
                    <p className="text-[10px] font-bold text-sky-400 uppercase">Dhibbeentaa Raawwii (%)</p>
                    <p className="text-2xl font-black text-sky-300 mt-1">{totPct}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">Overall Performance</p>
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow">
                    <p className="text-[10px] font-bold text-purple-400 uppercase">Miidhama & Irra Deebii</p>
                    <p className="text-2xl font-black text-purple-300 mt-1">{totDisabled} / {totRepeaters}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Miidhama / Irra Deebii</p>
                  </div>
                </div>

                {/* Grade-by-Grade Master Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>Gabatee Consalidated Kutaatiin (Bu'uura Boruu - Kutaa 12)</span>
                  </h3>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">Kutaa / Level</th>
                          <th className="p-3 text-center">Karoora Dhiira</th>
                          <th className="p-3 text-center">Karoora Dhalaa</th>
                          <th className="p-3 text-center bg-indigo-950 text-amber-300">Karoora Total</th>
                          <th className="p-3 text-center">Raawwii Dhiira</th>
                          <th className="p-3 text-center">Raawwii Dhalaa</th>
                          <th className="p-3 text-center bg-indigo-950 text-emerald-300">Raawwii Total</th>
                          <th className="p-3 text-center font-black">Raawwii (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {modalStats.map((st) => (
                          <tr
                            key={st.key}
                            className={
                              st.isGrandTotal
                                ? 'bg-indigo-900 text-white font-extrabold text-xs'
                                : st.isSubtotal
                                ? 'bg-indigo-50 font-bold text-indigo-950'
                                : 'hover:bg-slate-50'
                            }
                          >
                            <td className="p-2.5 font-bold">{st.kutaa}</td>
                            <td className="p-2.5 text-center">{st.targetDhiira}</td>
                            <td className="p-2.5 text-center">{st.targetDhalaa}</td>
                            <td className={`p-2.5 text-center font-bold ${st.isGrandTotal ? 'text-amber-300' : 'text-amber-900 bg-amber-50/50'}`}>
                              {st.targetTotal}
                            </td>
                            <td className="p-2.5 text-center">{st.dhiira}</td>
                            <td className="p-2.5 text-center">{st.dhalaa}</td>
                            <td className={`p-2.5 text-center font-bold ${st.isGrandTotal ? 'text-emerald-300' : 'text-emerald-900 bg-emerald-50/50'}`}>
                              {st.total}
                            </td>
                            <td className="p-2.5 text-center font-black">{st.pctTotal}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per Entity Breakdown Table */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-600" />
                    <span>Raawwii {isWoredaActive ? 'Manneen Barnootaa Aanaa' : 'Aanoolee Godinaa'} ({entityMetrics.length})</span>
                  </h3>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">{isWoredaActive ? 'Mana Barumsaa' : 'Aanaa'}</th>
                          <th className="p-3 text-center">Dhiira</th>
                          <th className="p-3 text-center">Dhalaa</th>
                          <th className="p-3 text-center">Raawwii Total</th>
                          <th className="p-3 text-center">Karoora Total</th>
                          <th className="p-3 text-center font-black">Raawwii (%)</th>
                          <th className="p-3 text-center">Miidhama</th>
                          <th className="p-3 text-center">Irra Deebii</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-[11px]">
                        {entityMetrics.map((sm, i) => (
                          <tr key={sm.name} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-400 font-bold">{i + 1}</td>
                            <td className="p-2.5 font-bold text-indigo-950">{isWoredaActive ? '🏫' : '🏛️'} {sm.name}</td>
                            <td className="p-2.5 text-center">{sm.d}</td>
                            <td className="p-2.5 text-center">{sm.f}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{sm.total}</td>
                            <td className="p-2.5 text-center font-bold text-slate-700">{sm.target}</td>
                            <td className="p-2.5 text-center font-black text-indigo-600">{sm.pct}%</td>
                            <td className="p-2.5 text-center font-bold text-purple-700">{sm.dis}</td>
                            <td className="p-2.5 text-center font-bold text-amber-700">{sm.rep}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Copyable Report Summary Text */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-sky-600" />
                      <span>Gabaasa Gabaabaa ({isWoredaActive ? 'Godinaaf Ergamu' : 'Biirootiif Ergamu'}):</span>
                    </label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(zonalReportShareText);
                        alert('✓ Gabaasni Consolidated milkaa\'inaan koorpii ta\'eera! WhatsApp, Telegram ykn Email irratti erguu dandeessa.');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>📋 Koorpii Godhi (Copy Text)</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={6}
                    value={zonalReportShareText}
                    className="w-full p-3 bg-slate-950 text-amber-300 font-mono text-[11px] rounded-2xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={telegramModalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ergii Telegram {isWoredaActive ? '(Godinaaf)' : '(Biiroof)'} ✈️</span>
                  </a>

                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ Maxxansi (Print Report)</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowZonalSubmissionModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cufi / Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Barataa Haquu Mirkanaaffadhu</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dhugauma barataa kana galmee irraa haquu ni barbaaddaa? Tarkaanfiin kun boodatti hin deebi'u.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-xs cursor-pointer"
              >
                Dhiisi (Cancel)
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                Haqi (Confirm Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Report Upload Modal (Tab A - Tab I Excel / CSV) */}
      {showTelegramUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-indigo-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Upload Gabaasa Telegram (Tab A - Tab I Excel/CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gabaasota manneen barnootaa karaa Telegram ergaman ol-fe'uun sirna gabaasa aanaatti walitti maki.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTelegramUploadModal(false);
                  setTelegramUploadMsg(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-2">
                <p className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Haala Hojii Telegram Report Upload:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                  <li>Manneen barnootaa gabaasota Tab A - Tab I bilbila isaaniin buusanii karaa Telegram yoo ergan;</li>
                  <li>Ogeessi Waajjira Barnootaa Aanaa fayilii Excel (.xlsx, .xls) ykn CSV (.csv) sun kompuutara/bilbila irratti save godhuun asitti upload godha.</li>
                  <li>Systemni kun ofii isaatiin maqaa mana barumsaa, aanaa, godinaa fi ragaalee barattootaa adda baasee kuusaa gabaasa Aanaatti walitti maki.</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={handleTelegramFileUpload}
                  disabled={isTelegramUploading}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <FileSpreadsheet className="w-10 h-10 text-indigo-600 mx-auto animate-bounce" />
                  <div>
                    <span className="text-sm font-black text-indigo-900 block">
                      Fayilii Gabaasa Telegram Filadhu ykn Asitti Luqqumsee
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Formats eeyyamaman: .xlsx, .xls, .csv
                    </span>
                  </div>
                </div>
              </div>

              {telegramUploadMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    telegramUploadMsg.includes('✓')
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : telegramUploadMsg.includes('❌')
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{telegramUploadMsg}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowTelegramUploadModal(false);
                  setTelegramUploadMsg(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cufi / Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
