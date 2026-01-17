import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, User, UserX, Clock, Calendar, Phone, CreditCard, Printer } from 'lucide-react';
import type { SchoolConfig, Teacher, AbsenceRecord, TardinessRecord } from '../types';
import { getConfig, getAbsencesByTeacher, getTardinessByTeacher } from '../utils/storage';
import { formatMinutesToTime } from '../utils/timeUtils';
import { generateAbsenceReport, generateTardinessReport } from '../utils/pdfGenerator';

export function TeacherDetailsPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [tardiness, setTardiness] = useState<TardinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'absences' | 'tardiness'>('absences');

  useEffect(() => {
    loadData();
  }, [teacherId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
      
      const foundTeacher = savedConfig.teachers.find(t => t.id === teacherId);
      setTeacher(foundTeacher || null);
      
      if (teacherId) {
        const absenceRecords = await getAbsencesByTeacher(teacherId);
        absenceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAbsences(absenceRecords);
        
        const tardinessRecords = await getTardinessByTeacher(teacherId);
        tardinessRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTardiness(tardinessRecords);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrintAbsenceReport() {
    if (!config || !teacher || absences.length === 0) return;
    
    const sortedAbsences = [...absences].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = sortedAbsences[0].date;
    const endDate = sortedAbsences[sortedAbsences.length - 1].date;
    
    generateAbsenceReport(config, teacher.name, startDate, endDate, absences.length);
  }

  function handlePrintTardinessReport() {
    if (!config || !teacher || tardiness.length === 0) return;
    generateTardinessReport(config, teacher.name, tardiness);
  }

  // Calculate total tardiness minutes
  const totalTardinessMinutes = tardiness.reduce((sum, t) => sum + t.lateByMinutes, 0);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="action-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/statistics')}>
            <ArrowRight size={20} />
            <span>العودة</span>
          </button>
          <h1>المعلم غير موجود</h1>
        </div>
        <div className="empty-state">
          <User size={48} />
          <p>لم يتم العثور على المعلم</p>
        </div>
      </div>
    );
  }

  return (
    <div className="action-page teacher-details-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/statistics')}>
          <ArrowRight size={20} />
          <span>العودة للإحصائيات</span>
        </button>
        <h1>
          <User size={28} />
          <span>تفاصيل المعلم</span>
        </h1>
      </div>

      {/* Teacher Info Card */}
      <div className="teacher-info-card">
        <div className="teacher-avatar">
          <User size={40} />
        </div>
        <div className="teacher-details">
          <h2>{teacher.name}</h2>
          <div className="teacher-meta">
            <span className="meta-item">
              <CreditCard size={16} />
              <span>رقم الهوية: {teacher.nationalId}</span>
            </span>
            {teacher.phone && (
              <span className="meta-item">
                <Phone size={16} />
                <span>الجوال: {teacher.phone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card absence-stat">
          <div className="stat-icon">
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{absences.length}</span>
            <span className="stat-label">يوم غياب</span>
          </div>
        </div>
        <div className="stat-card tardiness-stat">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{tardiness.length}</span>
            <span className="stat-label">مرة تأخر</span>
          </div>
        </div>
        <div className="stat-card total-tardiness-stat">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatMinutesToTime(totalTardinessMinutes)}</span>
            <span className="stat-label">إجمالي التأخر</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="details-tabs">
        <button
          className={`tab ${activeTab === 'absences' ? 'active' : ''}`}
          onClick={() => setActiveTab('absences')}
        >
          <UserX size={18} />
          <span>سجل الغياب ({absences.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'tardiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('tardiness')}
        >
          <Clock size={18} />
          <span>سجل التأخر ({tardiness.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="details-content">
        {activeTab === 'absences' && (
          <div className="tab-panel">
            {absences.length === 0 ? (
              <div className="empty-state small">
                <UserX size={32} />
                <p>لا يوجد سجلات غياب</p>
              </div>
            ) : (
              <>
                <div className="panel-header">
                  <h3>تفاصيل الغياب</h3>
                  <button className="btn-print-small" onClick={handlePrintAbsenceReport}>
                    <Printer size={16} />
                    <span>طباعة المساءلة</span>
                  </button>
                </div>
                <div className="records-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اليوم</th>
                        <th>التاريخ الهجري</th>
                        <th>التاريخ الميلادي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absences.map((record, index) => (
                        <tr key={record.id}>
                          <td>{index + 1}</td>
                          <td>{record.dayName}</td>
                          <td>{record.hijriDate}</td>
                          <td>{record.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tardiness' && (
          <div className="tab-panel">
            {tardiness.length === 0 ? (
              <div className="empty-state small">
                <Clock size={32} />
                <p>لا يوجد سجلات تأخر</p>
              </div>
            ) : (
              <>
                <div className="panel-header">
                  <h3>تفاصيل التأخر</h3>
                  <button className="btn-print-small" onClick={handlePrintTardinessReport}>
                    <Printer size={16} />
                    <span>طباعة المساءلة</span>
                  </button>
                </div>
                <div className="records-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اليوم</th>
                        <th>التاريخ الهجري</th>
                        <th>وقت الدوام</th>
                        <th>وقت الحضور</th>
                        <th>مقدار التأخر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tardiness.map((record, index) => (
                        <tr key={record.id}>
                          <td>{index + 1}</td>
                          <td>{record.dayName}</td>
                          <td>{record.hijriDate}</td>
                          <td>{record.cutoffTime}</td>
                          <td className="arrival-time">{record.arrivalTime}</td>
                          <td className="late-time">{formatMinutesToTime(record.lateByMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="total-row">
                  <span>إجمالي التأخر:</span>
                  <strong>{formatMinutesToTime(totalTardinessMinutes)}</strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
