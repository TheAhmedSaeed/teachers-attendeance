import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { gregorianToHijri, getArabicDayName } from '../utils/hijriConverter';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  excludeWeekends?: boolean;
  maxDate?: Date; // Maximum selectable date
  disableFuture?: boolean; // Disable future dates
}

const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function DatePicker({ value, onChange, excludeWeekends = true, disableFuture = true }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  // Check if date is a weekend (Friday = 5, Saturday = 6)
  function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday or Saturday
  }

  // Check if date is in the future
  function isFutureDate(date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  }

  // Check if date is disabled
  function isDateDisabled(date: Date): boolean {
    if (excludeWeekends && isWeekend(date)) return true;
    if (disableFuture && isFutureDate(date)) return true;
    return false;
  }

  // Get the nearest valid date (skip weekends and future dates)
  function getValidDate(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    
    // If future, go to today
    if (disableFuture && newDate > today) {
      newDate.setTime(today.getTime());
    }
    
    // Skip weekends (go backwards to find valid date)
    while (excludeWeekends && isWeekend(newDate)) {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    return newDate;
  }

  // Initialize with valid date
  useEffect(() => {
    if (!value) {
      const validDate = getValidDate(new Date());
      onChange(validDate.toISOString().split('T')[0]);
    } else {
      const date = new Date(value);
      if (isDateDisabled(date)) {
        const validDate = getValidDate(date);
        onChange(validDate.toISOString().split('T')[0]);
      }
    }
  }, []);

  function getDaysInMonth(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }

  function handleDateSelect(date: Date) {
    if (isDateDisabled(date)) return;
    
    setSelectedDate(date);
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  }

  function goToPreviousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isSelected(date: Date): boolean {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  }

  const days = getDaysInMonth(currentMonth);
  const displayDate = selectedDate || new Date();
  const hijriData = gregorianToHijri(displayDate);
  const dayName = getArabicDayName(displayDate);

  return (
    <div className="date-picker-wrapper">
      <div className="date-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
        <Calendar size={20} />
        <div className="selected-date-info">
          <span className="selected-day">{dayName}</span>
          <span className="selected-gregorian">{value}</span>
        </div>
      </div>

      <div className="date-display">
        <div className="date-info">
          <span className="day-name">{dayName}</span>
          <span className="hijri-date">{hijriData.formatted}</span>
        </div>
      </div>

      <p className="weekend-notice">
        {excludeWeekends && '* أيام الجمعة والسبت غير متاحة للاختيار'}
        {excludeWeekends && disableFuture && ' | '}
        {disableFuture && '* لا يمكن اختيار تاريخ في المستقبل'}
      </p>

      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="date-picker-header">
            <button type="button" onClick={goToPreviousMonth}>
              <ChevronRight size={20} />
            </button>
            <span className="current-month">
              {MONTHS_AR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button type="button" onClick={goToNextMonth}>
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="date-picker-days-header">
            {DAYS_AR.map((day, index) => (
              <span 
                key={day} 
                className={`day-header ${excludeWeekends && (index === 5 || index === 6) ? 'weekend' : ''}`}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="date-picker-days">
            {days.map((date, index) => (
              <div key={index} className="day-cell">
                {date && (
                  <button
                    type="button"
                    className={`day-button 
                      ${isToday(date) ? 'today' : ''} 
                      ${isSelected(date) ? 'selected' : ''}
                      ${excludeWeekends && isWeekend(date) ? 'weekend disabled' : ''}
                      ${disableFuture && isFutureDate(date) ? 'future disabled' : ''}
                    `}
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                  >
                    {date.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="date-picker-footer">
            <button 
              type="button" 
              className="today-button"
              onClick={() => {
                const today = getValidDate(new Date());
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                handleDateSelect(today);
              }}
            >
              اليوم
            </button>
          </div>
        </div>
      )}

      {isOpen && <div className="date-picker-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
