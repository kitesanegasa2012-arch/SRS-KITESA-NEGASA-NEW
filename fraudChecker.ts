import { Student } from '../types';

export interface FraudFlag {
  id: string;
  type:
    | 'unregistered_school'
    | 'unregistered_woreda'
    | 'age_mismatch'
    | 'buura_boruu_age_error'
    | 'repeated_submission'
    | 'expired_overdue_report'
    | 'fake_national_id';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  entityName: string;
  level: 'school' | 'woreda' | 'zone' | 'oromiyaa';
  associatedStudentIds: string[];
}

// Grade minimum age requirements as requested:
// Bu'uura Boruu: strictly 4 to 6 years old ONLY!
// Kutaa 1: min 7 years old
// Kutaa 2: min 8 years old
// Kutaa 3: min 9 years old
// Kutaa 4: min 10 years old
// Kutaa 5: min 11 years old
// Kutaa 6: min 12 years old
// Kutaa 7: min 13 years old
// Kutaa 8: min 14 years old
// Kutaa 9: min 15 years old
// Kutaa 10: min 16 years old
// Kutaa 11: min 17 years old
// Kutaa 12: min 18 years old

const MIN_AGE_PER_GRADE: Record<number, number> = {
  1: 7,
  2: 8,
  3: 9,
  4: 10,
  5: 11,
  6: 12,
  7: 13,
  8: 14,
  9: 15,
  10: 16,
  11: 17,
  12: 18,
};

export const analyzeAnomalies = (
  students: Student[],
  allSchools: string[] = [],
  allWoredas: string[] = [],
  allZones: string[] = []
): FraudFlag[] => {
  const flags: FraudFlag[] = [];

  const norm = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const knownSchoolsSet = new Set(allSchools.map(norm));
  const knownWoredasSet = new Set(allWoredas.map(norm));

  const schoolStudentsMap = new Map<string, Student[]>();

  students.forEach((st) => {
    const sName = (st.manaBarumsaa || '').trim();
    const wName = (st.aanaa || '').trim();

    if (sName) {
      if (!schoolStudentsMap.has(sName)) schoolStudentsMap.set(sName, []);
      schoolStudentsMap.get(sName)!.push(st);
    }

    // 1. Unregistered School
    if (sName && knownSchoolsSet.size > 0 && !knownSchoolsSet.has(norm(sName))) {
      flags.push({
        id: `unreg_sch_${st.id}`,
        type: 'unregistered_school',
        severity: 'high',
        title: '🚨 Mana Barumsaa Seeraan Ala Ta\'e',
        description: `Manni Barumsaa "${sName}" master registry keessatti galmaa'ee hin jiru. Gabaasni M/B kana irraa dhihaate soba ta'uu danda'a.`,
        entityName: sName,
        level: 'school',
        associatedStudentIds: [st.id],
      });
    }

    // 2. Unregistered Woreda
    if (wName && knownWoredasSet.size > 0 && !knownWoredasSet.has(norm(wName))) {
      flags.push({
        id: `unreg_wor_${st.id}`,
        type: 'unregistered_woreda',
        severity: 'high',
        title: '🏛️ Aanaa Seeraan Ala Ta\'e',
        description: `Aanaan "${wName}" tarree aanoolee seeraa keessa hin jiru.`,
        entityName: wName,
        level: 'woreda',
        associatedStudentIds: [st.id],
      });
    }

    // 3. Strict Age & Grade Rules
    const age = Number(st.umurii);
    const gradeRaw = (st.kutaa || '').trim().toLowerCase();
    const isBuuraBoruu =
      gradeRaw === '0' ||
      gradeRaw.includes('bu\'uura') ||
      gradeRaw.includes('boruu') ||
      gradeRaw.includes('kg') ||
      gradeRaw.includes('o-class') ||
      gradeRaw.includes('pre');

    if (age > 0) {
      if (isBuuraBoruu) {
        // Bu'uura Boruu rule: MUST BE strictly 4 - 6 years old only!
        if (age < 4 || age > 6) {
          flags.push({
            id: `bb_age_err_${st.id}`,
            type: 'buura_boruu_age_error',
            severity: 'high',
            title: '🚨 Bu\'uura Boruu: Umurii Seeraan Ala Ta\'e',
            description: `Barataan ${st.maqaaGuutuu} Bu'uura Boruu irratti umurii ${age} ta'ee gabaasame. Seeraan Bu'uura Boruu umurii 4 - 6 qofaaf heyyamama!`,
            entityName: st.manaBarumsaa || st.aanaa,
            level: 'school',
            associatedStudentIds: [st.id],
          });
        }
      } else {
        // Grades 1 - 12 rules
        const gradeNum = parseInt(gradeRaw.replace(/\D/g, ''), 10);
        if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12) {
          const reqMinAge = MIN_AGE_PER_GRADE[gradeNum];
          if (reqMinAge && age < reqMinAge) {
            flags.push({
              id: `age_mismatch_${st.id}`,
              type: 'age_mismatch',
              severity: 'high',
              title: `⚠️ Kutaa ${gradeNum} & Umurii Walsimuu Dhabuu (Age Anomaly)`,
              description: `Barataan ${st.maqaaGuutuu} Kutaa ${gradeNum} irratti umurii ${age} ta'ee gabaasame. Seeraan Kutaan ${gradeNum} umurii ${reqMinAge} fi isaa olii ta'uu qaba!`,
              entityName: st.manaBarumsaa || st.aanaa,
              level: 'school',
              associatedStudentIds: [st.id],
            });
          } else if (age > reqMinAge + 12) {
            // Unusually high age for grade (e.g. Grade 1 with age > 19)
            flags.push({
              id: `age_mismatch_high_${st.id}`,
              type: 'age_mismatch',
              severity: 'medium',
              title: `⚠️ Kutaa ${gradeNum} & Umurii Baay'ee Ol-ka'aa`,
              description: `Barataan ${st.maqaaGuutuu} Kutaa ${gradeNum} irratti umurii ${age} ta'ee gabaasame. Umuriin kun kutaa kanaaf garmalee ol-ka'aadha.`,
              entityName: st.manaBarumsaa || st.aanaa,
              level: 'school',
              associatedStudentIds: [st.id],
            });
          }
        }
      }
    }

    // 4. Expired / Overdue / Re-reported Historical Data
    if (st.haalaGalmee === 'Irra Deebii' || (st.baraIrraDeebii && st.baraIrraDeebii.trim() !== '')) {
      const regDate = st.guyyaaGalmee ? new Date(st.guyyaaGalmee) : null;
      const nowYear = new Date().getFullYear();
      if (regDate && !isNaN(regDate.getTime()) && nowYear - regDate.getFullYear() >= 2) {
        flags.push({
          id: `expired_rep_${st.id}`,
          type: 'expired_overdue_report',
          severity: 'high',
          title: '⌛ Gabaasa Yeroon Isaa Darbe / Historical Re-report',
          description: `Barataan ${st.maqaaGuutuu} gabaasa baragoota darbee (${st.guyyaaGalmee}) irra-deebi'amuun ammas gabaafameera. Kun gabaasa yeroon isaa darbedha.`,
          entityName: st.manaBarumsaa || st.aanaa,
          level: 'school',
          associatedStudentIds: [st.id],
        });
      }
    }

    // 5. Fake or Patterned National ID
    if (st.nationalId && st.nationalId !== '-' && st.nationalId !== 'NO') {
      const cleanId = st.nationalId.trim();
      if (/^0+$|^12345|^test$|^abc$/i.test(cleanId) || cleanId.length < 3) {
        flags.push({
          id: `fake_id_${st.id}`,
          type: 'fake_national_id',
          severity: 'high',
          title: '🆔 Fake / Patterned National ID',
          description: `Barataan ${st.maqaaGuutuu} Lakk. Eenyummaa Sobaa/Fakkeessaa (${cleanId}) gabaaseera.`,
          entityName: st.manaBarumsaa || st.aanaa,
          level: 'school',
          associatedStudentIds: [st.id],
        });
      }
    }
  });

  // 6. Over-reporting Anomalies (>1500 per school)
  schoolStudentsMap.forEach((stList, sName) => {
    if (stList.length > 1500) {
      flags.push({
        id: `repeat_sub_${sName}`,
        type: 'repeated_submission',
        severity: 'high',
        title: "📈 Gabaasa Garmalee Baay'ee / Over-reporting Anomaly",
        description: `Manni Barumsaa "${sName}" gabaasa barattoota ${stList.length} dhiyeesseera. Kun gabaasa irra-deddeebi'ame ykn soba ta'uu danda'a.`,
        entityName: sName,
        level: 'school',
        associatedStudentIds: stList.map((s) => s.id),
      });
    }
  });

  return flags;
};
