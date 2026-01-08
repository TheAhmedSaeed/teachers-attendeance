export interface Teacher {
  id: string;
  name: string;
}

export interface SchoolConfig {
  schoolName: string;
  principalName: string;
  tardinessCutoffTime: string; // Format: "HH:mm"
  teachers: Teacher[];
  absenceTemplate: string;
  tardinessTemplate: string;
}

export interface AbsenceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO date string
  hijriDate: string;
  dayName: string;
  createdAt: string;
}

export interface TardinessRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO date string
  hijriDate: string;
  dayName: string;
  arrivalTime: string; // Format: "HH:mm"
  cutoffTime: string; // Format: "HH:mm"
  lateByMinutes: number;
  createdAt: string;
}

export interface AppState {
  selectedDate: string; // ISO date string
}
