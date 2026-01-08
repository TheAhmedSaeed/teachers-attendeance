import localforage from 'localforage';
import type { SchoolConfig, AbsenceRecord, TardinessRecord } from '../types';

// Initialize localforage
localforage.config({
  name: 'presence-app',
  storeName: 'attendance_data',
});

const KEYS = {
  CONFIG: 'school_config',
  ABSENCES: 'absence_records',
  TARDINESS: 'tardiness_records',
};

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
  const config = await localforage.getItem<SchoolConfig>(KEYS.CONFIG);
  return config || defaultConfig;
}

export async function saveConfig(config: SchoolConfig): Promise<void> {
  await localforage.setItem(KEYS.CONFIG, config);
}

// Absence operations
export async function getAbsences(): Promise<AbsenceRecord[]> {
  const absences = await localforage.getItem<AbsenceRecord[]>(KEYS.ABSENCES);
  return absences || [];
}

export async function saveAbsence(absence: AbsenceRecord): Promise<void> {
  const absences = await getAbsences();
  absences.push(absence);
  await localforage.setItem(KEYS.ABSENCES, absences);
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
  const tardiness = await localforage.getItem<TardinessRecord[]>(KEYS.TARDINESS);
  return tardiness || [];
}

export async function saveTardiness(tardiness: TardinessRecord): Promise<void> {
  const records = await getTardiness();
  records.push(tardiness);
  await localforage.setItem(KEYS.TARDINESS, records);
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
