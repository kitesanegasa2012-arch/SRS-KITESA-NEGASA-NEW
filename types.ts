export interface Student {
  id: string;
  maqaaGuutuu: string;
  koorniyaa: 'Dhiira' | 'Dhalaa';
  kutaa: string;
  daree: string;
  baraDhalootaa: string;
  umurii: number;
  haalaGalmee: string;
  baraAddaanKute?: string;
  baraIrraDeebii?: string;
  haalaMaatii: string;
  miidhamaQaamaa: 'Eeyyee' | 'Lakkii';
  gosaMiidhamaa?: string;
  godina: string;
  aanaa: string;
  ganda: string;
  maqaaHaadhaa: string;
  fanId: string;
  nationalId: string;
  lakkBilbilaBarataa: string;
  lakkBilbilaMaatii: string;
  mbDuraan: string;
  avireejjiiQabxii: number | string;
  guyyaaGalmee: string;
  barsiisaaGalmeessee: string;
  manaBarumsaa: string;
  gosaGabaasaa?: string;
}

export interface GradeTarget {
  kutaa: string;
  dhiira: number;
  dhalaa: number;
}

export interface LoginRecord {
  id: string;
  gmail: string;
  loginTime: string;
}

export interface SchoolSettings {
  savedSchoolName: string;
  baraBarnootaa: string;
}

export interface User {
  email: string;
  name: string;
  role: string;
}

export interface AdminUnit {
  id: string;
  type: 'godina' | 'aanaa' | 'school';
  name: string;
  parentName: string;
  codeOrGanda?: string;
  targetStudents?: number;
}

export interface EMISStudent {
  id?: string;
  nationalId?: string;
  fanId?: string;
  maqaaGuutuu: string;
  koorniyaa: string;
  kutaa: string;
  daree?: string;
  baraDhalootaa: string;
  umurii: number | string;
  avireejjiiQabxii?: number | string;
  godina?: string;
  aanaa?: string;
  ganda?: string;
  maqaaHaadhaa?: string;
  lakkBilbilaBarataa?: string;
  lakkBilbilaMaatii?: string;
  mbDuraan?: string;
  haalaMaatii?: string;
  miidhamaQaamaa?: string;
  gosaMiidhamaa?: string;
  manaBarumsaa?: string;
  fileSource?: 'BSD' | 'SR' | 'SE' | 'Merged BSD & SR';
  fileName?: string;
}

export interface EMISComparison {
  matches: Array<{ key: string; data: EMISStudent; national_id: string }>;
  mismatches: Array<{
    key: string;
    emis_data: EMISStudent;
    app_data: Student;
    mismatch_fields: Record<string, { emis: string; app: string }>;
    national_id: string;
  }>;
  emis_not_in_app: Array<{ key: string; data: EMISStudent; national_id: string }>;
  app_not_in_emis: Array<{ key: string; data: Student }>;
}

export interface RestoredFileRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  reportDate: string; // Guyyaa Galmee
  schoolName: string; // Mana Barumsaa
  level: 'aanaa' | 'godina' | 'school' | 'oromiyaa';
  unitName: string; // Aanaa / Godina
  reportType: string; // Karoora Galmee, Gabaasa Galmee Daily, Gabaasa EMIS Daily
  totalRecords: number;
  newAdded: number;
  duplicateCount: number;
}

export interface DuplicateGroup {
  id: string;
  key: string;
  reason: string;
  students: Student[];
}

