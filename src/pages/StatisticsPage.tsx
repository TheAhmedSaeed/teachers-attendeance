import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Printer, UserX, Clock, ChevronLeft } from 'lucide-react';
import type { SchoolConfig } from '../types';
import { getConfig, getAbsences, getTardiness } from '../utils/storage';
import { formatMinutesToTime } from '../utils/timeUtils';
import { generateStatisticsReport } from '../utils/pdfGenerator';

interface AbsenceStat {
  teacherId: string;
  teacherName: string;
  totalAbsences: number;
}

interface TardinessStat {
  teacherId: string;
  teacherName: string;
  totalTardiness: number;
  totalMinutes: number;
}

export function StatisticsPage() {
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [absenceStats, setAbsenceStats] = useState<AbsenceStat[]>([]);
  const [tardinessStats, setTardinessStats] = useState<TardinessStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
      
      const absences = await getAbsences();
      const tardiness = await getTardiness();
      
      // Calculate absence statistics
      const absenceMap = new Map<string, AbsenceStat>();
      absences.forEach((record) => {
        const existing = absenceMap.get(record.teacherId);
        if (existing) {
          existing.totalAbsences++;
        } else {
          absenceMap.set(record.teacherId, {
            teacherId: record.teacherId,
            teacherName: record.teacherName,
            totalAbsences: 1,
          });
        }
      });
      
      // Calculate tardiness statistics
      const tardinessMap = new Map<string, TardinessStat>();
      tardiness.forEach((record) => {
        const existing = tardinessMap.get(record.teacherId);
        if (existing) {
          existing.totalTardiness++;
          existing.totalMinutes += record.lateByMinutes;
        } else {
          tardinessMap.set(record.teacherId, {
            teacherId: record.teacherId,
            teacherName: record.teacherName,
            totalTardiness: 1,
            totalMinutes: record.lateByMinutes,
          });
        }
      });
      
      // Sort by total (descending)
      setAbsenceStats(Array.from(absenceMap.values()).sort((a, b) => b.totalAbsences - a.totalAbsences));
      setTardinessStats(Array.from(tardinessMap.values()).sort((a, b) => b.totalTardiness - a.totalTardiness));
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrint() {
    if (!config) return;
    generateStatisticsReport(config, absenceStats, tardinessStats);
  }

  if (!config || isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="action-page statistics-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </button>
        <h1>
          <BarChart3 size={28} />
          <span>الإحصائيات</span>
        </h1>
      </div>

      <div className="statistics-content">
        <div className="stats-section">
          <div className="section-header">
            <UserX size={24} />
            <h2>إحصائيات الغياب</h2>
          </div>
          {absenceStats.length === 0 ? (
            <div className="empty-state small">
              <p>لا يوجد سجلات غياب</p>
            </div>
          ) : (
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم المعلم</th>
                    <th>عدد أيام الغياب</th>
                    <th>التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceStats.map((stat, index) => (
                    <tr key={stat.teacherId}>
                      <td>{index + 1}</td>
                      <td>{stat.teacherName}</td>
                      <td className="highlight">{stat.totalAbsences}</td>
                      <td>
                        <button 
                          className="btn-details"
                          onClick={() => navigate(`/teacher/${stat.teacherId}`)}
                        >
                          <span>عرض التفاصيل</span>
                          <ChevronLeft size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="section-header">
            <Clock size={24} />
            <h2>إحصائيات التأخر</h2>
          </div>
          {tardinessStats.length === 0 ? (
            <div className="empty-state small">
              <p>لا يوجد سجلات تأخر</p>
            </div>
          ) : (
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم المعلم</th>
                    <th>عدد مرات التأخر</th>
                    <th>إجمالي التأخر</th>
                    <th>التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {tardinessStats.map((stat, index) => (
                    <tr key={stat.teacherId}>
                      <td>{index + 1}</td>
                      <td>{stat.teacherName}</td>
                      <td>{stat.totalTardiness}</td>
                      <td className="highlight">{formatMinutesToTime(stat.totalMinutes)}</td>
                      <td>
                        <button 
                          className="btn-details"
                          onClick={() => navigate(`/teacher/${stat.teacherId}`)}
                        >
                          <span>عرض التفاصيل</span>
                          <ChevronLeft size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button 
          className="btn-primary print-stats"
          onClick={handlePrint}
          disabled={absenceStats.length === 0 && tardinessStats.length === 0}
        >
          <Printer size={20} />
          <span>طباعة الإحصائيات</span>
        </button>
      </div>
    </div>
  );
}
