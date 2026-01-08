export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

export function timeToMinutes(timeString: string): number {
  const { hours, minutes } = parseTime(timeString);
  return hours * 60 + minutes;
}

export function calculateLateness(arrivalTime: string, cutoffTime: string): number {
  const arrivalMinutes = timeToMinutes(arrivalTime);
  const cutoffMinutes = timeToMinutes(cutoffTime);
  
  if (arrivalMinutes <= cutoffMinutes) {
    return 0;
  }
  
  return arrivalMinutes - cutoffMinutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
  return `${minutes} دقيقة`;
}

export function isTimeAfterCutoff(arrivalTime: string, cutoffTime: string): boolean {
  return timeToMinutes(arrivalTime) > timeToMinutes(cutoffTime);
}

export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
