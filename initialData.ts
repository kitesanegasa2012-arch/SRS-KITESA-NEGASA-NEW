import { Student, GradeTarget, SchoolSettings, EMISStudent } from '../types';

export const AUTHORIZED_USERS: Record<string, string> = {
  'kitesanegasa2012@gmail.com': 'kitesanegasa2012password',
  'barsiisaa1@gmail.com': 'pass1234',
  'bulchaa@gmail.com': 'admin2026',
  'feyisamililu23@gmail.com': '20481092F',
  'tokumadida430@gmail.com': '#006@K',
};

export const REPORT_PASSWORDS = ['kitesanegasa2012password', 'SRS@2026#$K', 'admin123', '#006@K'];
export const ADMIN_PASSWORD = 'SRS@2026#$K';

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  savedSchoolName: '',
  baraBarnootaa: '2019',
};

export const INITIAL_TARGETS: Record<string, GradeTarget> = {
  'bb_4': { kutaa: 'bb_4', dhiira: 15, dhalaa: 15 },
  'bb_5': { kutaa: 'bb_5', dhiira: 18, dhalaa: 15 },
  'bb_6': { kutaa: 'bb_6', dhiira: 22, dhalaa: 20 },
  '0': { kutaa: '0', dhiira: 55, dhalaa: 50 },
  '1': { kutaa: '1', dhiira: 45, dhalaa: 40 },
  '2': { kutaa: '2', dhiira: 40, dhalaa: 38 },
  '3': { kutaa: '3', dhiira: 35, dhalaa: 35 },
  '4': { kutaa: '4', dhiira: 35, dhalaa: 32 },
  '5': { kutaa: '5', dhiira: 30, dhalaa: 30 },
  '6': { kutaa: '6', dhiira: 30, dhalaa: 28 },
  '7': { kutaa: '7', dhiira: 25, dhalaa: 25 },
  '8': { kutaa: '8', dhiira: 25, dhalaa: 22 },
  '9': { kutaa: '9', dhiira: 20, dhalaa: 20 },
  '10': { kutaa: '10', dhiira: 20, dhalaa: 18 },
  '11': { kutaa: '11', dhiira: 15, dhalaa: 15 },
  '12': { kutaa: '12', dhiira: 15, dhalaa: 12 },
};

export const INITIAL_STUDENTS: Student[] = [];

// Ragaaleen EMIS duraan koodii keessa turan haqamanii array qullaa godhamaniiru
export const INITIAL_EMIS_RECORDS: EMISStudent[] = [];