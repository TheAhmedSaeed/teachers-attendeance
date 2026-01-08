import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Printer, Clock } from 'lucide-react';
import type { SchoolConfig, TardinessRecord } from '../types';
import { getConfig, getAllTardinessRecords } from '../utils/storage';
import { formatMinutesToTime } from '../utils/timeUtils';
import { generateTardinessReport } from '../utils/pdfGenerator';

export function TardinessReportPage() {
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [tardinessRecords, setTardinessRecords] = useState<TardinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
      
      const records = await getAllTardinessRecords();
      // Sort by date descending
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTardinessRecords(records);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrint(teacherId: string) {
    if (!config) return;

    const teacher = config.teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const teacherRecords = tardinessRecords.filter((r) => r.teacherId === teacherId);
    if (teacherRecords.length === 0) return;

    generateTardinessReport(config, teacher.name, teacherRecords);
  }

  // Group records by teacher
  const recordsByTeacher = tardinessRecords.reduce((acc, record) => {
    if (!acc[record.teacherId]) {
      acc[record.teacherId] = {
        teacherName: record.teacherName,
        records: [],
      };
    }
    acc[record.teacherId].records.push(record);
    return acc;
  }, {} as Record<string, { teacherName: string; records: TardinessRecord[] }>);

  if (!config || isLoading) {
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
          <FileText size={28} />
          <span>طباعة مساءلة التأخر</span>
        </h1>
      </div>

      <div className="report-content">
        {Object.keys(recordsByTeacher).length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>لا يوجد سجلات تأخر</p>
          </div>
        ) : (
          <div className="tardiness-list">
            {Object.entries(recordsByTeacher).map(([teacherId, data]) => (
              <div key={teacherId} className="teacher-tardiness-card">
                <div className="card-header">
                  <h3>{data.teacherName}</h3>
                  <button 
                    className="btn-print"
                    onClick={() => handlePrint(teacherId)}
                  >
                    <Printer size={18} />
                    <span>طباعة</span>
                  </button>
                </div>
                <div className="card-stats">
                  <span>عدد مرات التأخر: {data.records.length}</span>
                  <span>إجمالي التأخر: {formatMinutesToTime(data.records.reduce((sum, r) => sum + r.lateByMinutes, 0))}</span>
                </div>
                <div className="records-table">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>اليوم</th>
                        <th>وقت الحضور</th>
                        <th>مقدار التأخر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.hijriDate}</td>
                          <td>{record.dayName}</td>
                          <td>{record.arrivalTime}</td>
                          <td>{formatMinutesToTime(record.lateByMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
