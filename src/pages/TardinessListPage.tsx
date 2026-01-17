import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Clock, AlertTriangle, X } from 'lucide-react';
import type { TardinessRecord } from '../types';
import { getTardiness } from '../utils/storage';
import { formatMinutesToTime } from '../utils/timeUtils';
import localforage from 'localforage';

export function TardinessListPage() {
  const navigate = useNavigate();
  const [tardiness, setTardiness] = useState<TardinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<TardinessRecord | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTardiness();
  }, []);

  async function loadTardiness() {
    setIsLoading(true);
    try {
      const records = await getTardiness();
      // Sort by date descending (newest first)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTardiness(records);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(record: TardinessRecord) {
    try {
      const allTardiness = await getTardiness();
      const updatedTardiness = allTardiness.filter(t => t.id !== record.id);
      await localforage.setItem('tardiness_records', updatedTardiness);
      setTardiness(updatedTardiness.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDeleteConfirm(null);
      setMessage(`تم حذف تأخر ${record.teacherName} بنجاح`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('حدث خطأ أثناء الحذف');
    }
  }

  if (isLoading) {
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
          <Clock size={28} />
          <span>سجل التأخر</span>
        </h1>
      </div>

      {message && (
        <div className="message success" style={{ marginBottom: '1rem' }}>
          <span>{message}</span>
        </div>
      )}

      <div className="list-content">
        {tardiness.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>لا يوجد سجلات تأخر</p>
          </div>
        ) : (
          <div className="records-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم المعلم</th>
                  <th>التاريخ الهجري</th>
                  <th>اليوم</th>
                  <th>وقت الحضور</th>
                  <th>مقدار التأخر</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {tardiness.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.teacherName}</td>
                    <td>{record.hijriDate}</td>
                    <td>{record.dayName}</td>
                    <td>{record.arrivalTime}</td>
                    <td className="late-time">{formatMinutesToTime(record.lateByMinutes)}</td>
                    <td>
                      <button
                        className="btn-delete-row"
                        onClick={() => setDeleteConfirm(record)}
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon warning">
              <AlertTriangle size={40} />
            </div>
            <h2>تأكيد الحذف</h2>
            <p>هل أنت متأكد من حذف تأخر المعلم:</p>
            <div className="modal-details">
              <strong>{deleteConfirm.teacherName}</strong>
              <span>{deleteConfirm.dayName} - {deleteConfirm.hijriDate}</span>
              <span>تأخر: {formatMinutesToTime(deleteConfirm.lateByMinutes)}</span>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                إلغاء
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={18} />
                <span>نعم، احذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
