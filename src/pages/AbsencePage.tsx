import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Save, UserX, CheckCircle, AlertCircle } from 'lucide-react';
import type { SchoolConfig, AbsenceRecord } from '../types';
import { getConfig, saveAbsence, checkAbsenceExists, generateId } from '../utils/storage';
import { gregorianToHijri, getArabicDayName } from '../utils/hijriConverter';

export function AbsencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const date = new Date(dateFromUrl);
  const hijriData = gregorianToHijri(date);
  const dayName = getArabicDayName(date);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
  }

  async function handleSave() {
    if (!selectedTeacherId || !config) {
      setMessage({ type: 'error', text: 'يرجى اختيار المعلم' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Check if absence already exists for this teacher on this date
      const exists = await checkAbsenceExists(selectedTeacherId, dateFromUrl);
      if (exists) {
        setMessage({ type: 'error', text: 'تم تسجيل غياب هذا المعلم في هذا التاريخ مسبقاً' });
        setIsSubmitting(false);
        return;
      }

      const teacher = config.teachers.find((t) => t.id === selectedTeacherId);
      if (!teacher) {
        setMessage({ type: 'error', text: 'المعلم غير موجود' });
        setIsSubmitting(false);
        return;
      }

      const absenceRecord: AbsenceRecord = {
        id: generateId(),
        teacherId: selectedTeacherId,
        teacherName: teacher.name,
        date: dateFromUrl,
        hijriDate: hijriData.formatted,
        dayName: dayName,
        createdAt: new Date().toISOString(),
      };

      await saveAbsence(absenceRecord);
      setMessage({ type: 'success', text: `تم تسجيل غياب المعلم ${teacher.name} بنجاح` });
      setSelectedTeacherId('');
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!config) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="action-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </button>
        <h1>
          <UserX size={28} />
          <span>إدخال الغياب</span>
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

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <button 
          className="btn-primary"
          onClick={handleSave}
          disabled={isSubmitting || !selectedTeacherId}
        >
          <Save size={20} />
          <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الغياب'}</span>
        </button>
      </div>
    </div>
  );
}
