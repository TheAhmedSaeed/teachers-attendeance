import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Save, Clock, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import type { SchoolConfig, TardinessRecord } from '../types';
import { getConfig, saveTardiness, getTardinessByTeacher, generateId } from '../utils/storage';
import { gregorianToHijri, getArabicDayName } from '../utils/hijriConverter';
import { calculateLateness, formatMinutesToTime, isTimeAfterCutoff, getCurrentTime } from '../utils/timeUtils';
import { generateTardinessReport } from '../utils/pdfGenerator';

export function TardinessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [arrivalTime, setArrivalTime] = useState(getCurrentTime());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lateByMinutes, setLateByMinutes] = useState(0);

  const date = new Date(dateFromUrl);
  const hijriData = gregorianToHijri(date);
  const dayName = getArabicDayName(date);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config && arrivalTime) {
      const lateness = calculateLateness(arrivalTime, config.tardinessCutoffTime);
      setLateByMinutes(lateness);
    }
  }, [arrivalTime, config]);

  async function loadConfig() {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
  }

  async function handleSave() {
    if (!selectedTeacherId || !config) {
      setMessage({ type: 'error', text: 'يرجى اختيار المعلم' });
      return;
    }

    if (!isTimeAfterCutoff(arrivalTime, config.tardinessCutoffTime)) {
      setMessage({ type: 'error', text: `وقت الحضور يجب أن يكون بعد ${config.tardinessCutoffTime}` });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const teacher = config.teachers.find((t) => t.id === selectedTeacherId);
      if (!teacher) {
        setMessage({ type: 'error', text: 'المعلم غير موجود' });
        setIsSubmitting(false);
        return;
      }

      const tardinessRecord: TardinessRecord = {
        id: generateId(),
        teacherId: selectedTeacherId,
        teacherName: teacher.name,
        date: dateFromUrl,
        hijriDate: hijriData.formatted,
        dayName: dayName,
        arrivalTime: arrivalTime,
        cutoffTime: config.tardinessCutoffTime,
        lateByMinutes: lateByMinutes,
        createdAt: new Date().toISOString(),
      };

      await saveTardiness(tardinessRecord);
      setMessage({ type: 'success', text: `تم تسجيل تأخر المعلم ${teacher.name} بنجاح` });
      setSelectedTeacherId('');
      setArrivalTime(getCurrentTime());
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrintReport() {
    if (!selectedTeacherId || !config) {
      setMessage({ type: 'error', text: 'يرجى اختيار المعلم' });
      return;
    }

    const teacher = config.teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const records = await getTardinessByTeacher(selectedTeacherId);
    if (records.length === 0) {
      setMessage({ type: 'error', text: 'لا يوجد سجلات تأخر لهذا المعلم' });
      return;
    }

    generateTardinessReport(config, teacher.name, records);
  }

  if (!config) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  const isLate = isTimeAfterCutoff(arrivalTime, config.tardinessCutoffTime);

  return (
    <div className="action-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </button>
        <h1>
          <Clock size={28} />
          <span>إدخال التأخر</span>
        </h1>
      </div>

      <div className="date-display-card">
        <div className="date-row">
          <span className="label">التاريخ:</span>
          <span className="value">{dayName} - {hijriData.formatted}</span>
        </div>
        <div className="date-row gregorian">
          <span className="label">الميلادي:</span>
          <span className="value">{dateFromUrl}</span>
        </div>
        <div className="date-row cutoff">
          <span className="label">وقت احتساب التأخر:</span>
          <span className="value">{config.tardinessCutoffTime}</span>
        </div>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label htmlFor="teacher">اسم المعلم</label>
          <select
            id="teacher"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="">-- اختر المعلم --</option>
            {config.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="arrivalTime">وقت حضور المعلم</label>
          <input
            type="time"
            id="arrivalTime"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            min={config.tardinessCutoffTime}
          />
          {!isLate && arrivalTime && (
            <span className="hint warning">⚠️ الوقت المدخل قبل وقت احتساب التأخر</span>
          )}
        </div>

        {isLate && lateByMinutes > 0 && (
          <div className="lateness-display">
            <Clock size={24} />
            <div>
              <span className="label">مقدار التأخر:</span>
              <span className="value">{formatMinutesToTime(lateByMinutes)}</span>
            </div>
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="button-group">
          <button 
            className="btn-primary"
            onClick={handleSave}
            disabled={isSubmitting || !selectedTeacherId || !isLate}
          >
            <Save size={20} />
            <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التأخر'}</span>
          </button>
          
          <button 
            className="btn-secondary"
            onClick={handlePrintReport}
            disabled={!selectedTeacherId}
          >
            <Printer size={20} />
            <span>طباعة المساءلة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
