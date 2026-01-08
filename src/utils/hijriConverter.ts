// Hijri date conversion utilities
// Using the Umm al-Qura calendar algorithm

const ARABIC_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

// Julian Day Number calculation
function gregorianToJD(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// Convert Julian Day to Hijri
function jdToHijri(jd: number): { year: number; month: number; day: number } {
  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  
  return { year, month, day };
}

export function gregorianToHijri(date: Date): { year: number; month: number; day: number; monthName: string; formatted: string } {
  const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const hijri = jdToHijri(jd);
  
  return {
    year: hijri.year,
    month: hijri.month,
    day: hijri.day,
    monthName: ARABIC_MONTHS[hijri.month - 1],
    formatted: `${hijri.day} ${ARABIC_MONTHS[hijri.month - 1]} ${hijri.year}هـ`,
  };
}

export function getArabicDayName(date: Date): string {
  return ARABIC_DAYS[date.getDay()];
}

export function formatGregorianDate(date: Date): string {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateForDisplay(dateString: string): {
  gregorian: string;
  hijri: string;
  dayName: string;
} {
  const date = new Date(dateString);
  const hijriData = gregorianToHijri(date);
  
  return {
    gregorian: formatGregorianDate(date),
    hijri: hijriData.formatted,
    dayName: getArabicDayName(date),
  };
}
