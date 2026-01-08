import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Printer, AlertCircle, Calendar } from 'lucide-react';
import type { SchoolConfig, AbsenceRecord } from '../types';
import { getConfig, getAbsencesByTeacherAndDateRange } from '../utils/storage';
import { gregorianToHijri, getArabicDayName } from '../utils/hijriConverter';
import { generateAbsenceReport } from '../utils/pdfGenerator';

export function AbsenceReportPage() {
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (selectedTeacherId && startDate && endDate) {
      loadAbsences();
    }
  }, [selectedTeacherId, startDate, endDate]);

  async function loadConfig() {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
  }

  async function loadAbsences() {
    if (!selectedTeacherId) return;
    
    setIsLoading(true);
    try {
      const records = await getAbsencesByTeacherAndDateRange(selectedTeacherId, startDate, endDate);
      setAbsenceRecords(records);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحميل البيانات' });
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrint() {
    if (!config || !selectedTeacherId) return;

    const teacher = config.teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    if (absenceRecords.length === 0) {
      setMessage({ type: 'error', text: 'لا يوجد غياب مسجل لهذا المعلم في الفترة المحددة' });
      return;
    }

    generateAbsenceReport(config, teacher.name, startDate, endDate, absenceRecords.length);
  }

  function formatDateInfo(dateString: string) {
    const date = new Date(dateString);
    const hijri = gregorianToHijri(date);
    const dayName = getArabicDayName(date);
    return { hijri: hijri.formatted, dayName };
  }

  if (!config) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  const startDateInfo = formatDateInfo(startDate);
  const endDateInfo = formatDateInfo(endDate);
  const canPrint = selectedTeacherId && absenceRecords.length > 0;

  return (
    <div className="action-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </button>
        <h1>
          <FileText size={28} />
          <span>طباعة مساءلة الغياب</span>
        </h1>
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

        <div className="date-range-group">
          <div className="form-group">
            <label htmlFor="startDate">
              <Calendar size={16} />
              <span>تاريخ بداية الغياب</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
            <div className="date-info-display">
              <span>{startDateInfo.dayName}</span>
              <span>{startDateInfo.hijri}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="endDate">
              <Calendar size={16} />
              <span>تاريخ نهاية الغياب</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
            <div className="date-info-display">
              <span>{endDateInfo.dayName}</span>
              <span>{endDateInfo.hijri}</span>
            </div>
          </div>
        </div>

        {selectedTeacherId && (
          <div className="summary-card">
            <h3>ملخص الغياب</h3>
            {isLoading ? (
              <p>جاري التحميل...</p>
            ) : absenceRecords.length > 0 ? (
              <>
                <div className="summary-stat">
                  <span className="label">مجموع أيام الغياب:</span>
                  <span className="value highlight">{absenceRecords.length} يوم</span>
                </div>
                <div className="absence-list">
                  <h4>تفاصيل الغياب:</h4>
                  <ul>
                    {absenceRecords.map((record) => (
                      <li key={record.id}>
                        {record.dayName} - {record.hijriDate}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="no-data">لا يوجد غياب مسجل في الفترة المحددة</p>
            )}
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>
            <AlertCircle size={20} />
            <span>{message.text}</span>
          </div>
        )}

        <button 
          className="btn-primary"
          onClick={handlePrint}
          disabled={!canPrint}
        >
          <Printer size={20} />
          <span>طباعة مساءلة الغياب</span>
        </button>
        
        {!canPrint && selectedTeacherId && absenceRecords.length === 0 && (
          <p className="hint warning">
            ⚠️ لا يمكن طباعة المساءلة لعدم وجود غياب مسجل في الفترة المحددة
          </p>
        )}
      </div>
    </div>
  );
}
