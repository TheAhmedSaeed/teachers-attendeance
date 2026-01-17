import type { SchoolConfig, AbsenceRecord, TardinessRecord } from '../types';
import { apiGetConfig, apiSaveConfig, apiGetAbsences, apiSaveAbsence, apiGetTardiness, apiSaveTardiness } from './api';

// Default configuration
const defaultConfig: SchoolConfig = {
  schoolName: '',
  principalName: '',
  tardinessCutoffTime: '07:00',
  teachers: [],
  absenceTemplate: `بسم الله الرحمن الرحيم

المملكة العربية السعودية
وزارة التعليم
إدارة التعليم بمنطقة ________
مدرسة: {{schoolName}}

مساءلة غياب

الأخ المعلم / {{teacherName}}                                                    حفظه الله

السلام عليكم ورحمة الله وبركاته،،، وبعد:

نفيدكم بأنه قد تغيبتم عن العمل بدون عذر مقبول في الفترة من {{startDate}} إلى {{endDate}} بإجمالي ({{totalDays}}) يوم/أيام.

لذا نأمل منكم توضيح أسباب هذا الغياب كتابياً خلال ثلاثة أيام من تاريخه.

والله يحفظكم،،،

مدير المدرسة
{{principalName}}

التاريخ: {{currentDate}}`,
  tardinessTemplate: `بسم الله الرحمن الرحيم

المملكة العربية السعودية
وزارة التعليم
إدارة التعليم بمنطقة ________
مدرسة: {{schoolName}}

مساءلة تأخر

الأخ المعلم / {{teacherName}}                                                    حفظه الله

السلام عليكم ورحمة الله وبركاته،،، وبعد:

نفيدكم بأنه قد تم رصد تأخركم عن الحضور في الأوقات التالية:

{{tardinessDetails}}

لذا نأمل منكم الالتزام بأوقات الدوام الرسمي وتوضيح أسباب هذا التأخر كتابياً.

والله يحفظكم،،،

مدير المدرسة
{{principalName}}

التاريخ: {{currentDate}}`,
};

// Config operations
export async function getConfig(): Promise<SchoolConfig> {
  try {
    const config = await apiGetConfig();
    return config || defaultConfig;
  } catch {
    return defaultConfig;
  }
}

export async function saveConfig(config: SchoolConfig): Promise<void> {
  await apiSaveConfig(config);
}

// Absence operations
export async function getAbsences(): Promise<AbsenceRecord[]> {
  try {
    return await apiGetAbsences();
  } catch {
    return [];
  }
}

export async function saveAbsence(absence: AbsenceRecord): Promise<void> {
  await apiSaveAbsence(absence);
}

export async function getAbsencesByTeacher(teacherId: string): Promise<AbsenceRecord[]> {
  const absences = await getAbsences();
  return absences.filter((a) => a.teacherId === teacherId);
}

export async function getAbsencesByTeacherAndDateRange(
  teacherId: string,
  startDate: string,
  endDate: string
): Promise<AbsenceRecord[]> {
  const absences = await getAbsences();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return absences.filter((a) => {
    const absenceDate = new Date(a.date);
    return a.teacherId === teacherId && absenceDate >= start && absenceDate <= end;
  });
}

export async function checkAbsenceExists(teacherId: string, date: string): Promise<boolean> {
  const absences = await getAbsences();
  return absences.some((a) => a.teacherId === teacherId && a.date === date);
}

// Tardiness operations
export async function getTardiness(): Promise<TardinessRecord[]> {
  try {
    return await apiGetTardiness();
  } catch {
    return [];
  }
}

export async function saveTardiness(tardiness: TardinessRecord): Promise<void> {
  await apiSaveTardiness(tardiness);
}

export async function getTardinessByTeacher(teacherId: string): Promise<TardinessRecord[]> {
  const records = await getTardiness();
  return records.filter((t) => t.teacherId === teacherId);
}

export async function getAllTardinessRecords(): Promise<TardinessRecord[]> {
  return getTardiness();
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
