import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, UserX, AlertTriangle, X } from 'lucide-react';
import type { AbsenceRecord } from '../types';
import { getAbsences } from '../utils/storage';
import localforage from 'localforage';

export function AbsenceListPage() {
  const navigate = useNavigate();
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<AbsenceRecord | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAbsences();
  }, []);

  async function loadAbsences() {
    setIsLoading(true);
    try {
      const records = await getAbsences();
      // Sort by date descending (newest first)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAbsences(records);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(record: AbsenceRecord) {
    try {
      const allAbsences = await getAbsences();
      const updatedAbsences = allAbsences.filter(a => a.id !== record.id);
      await localforage.setItem('absence_records', updatedAbsences);
      setAbsences(updatedAbsences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDeleteConfirm(null);
      setMessage(`تم حذف غياب ${record.teacherName} بنجاح`);
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
          <UserX size={28} />
          <span>سجل الغياب</span>
        </h1>
      </div>

      {message && (
        <div className="message success" style={{ marginBottom: '1rem' }}>
          <span>{message}</span>
        </div>
      )}

      <div className="list-content">
        {absences.length === 0 ? (
          <div className="empty-state">
            <UserX size={48} />
            <p>لا يوجد سجلات غياب</p>
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
                  <th>التاريخ الميلادي</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.teacherName}</td>
                    <td>{record.hijriDate}</td>
                    <td>{record.dayName}</td>
                    <td>{record.date}</td>
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
            <p>هل أنت متأكد من حذف غياب المعلم:</p>
            <div className="modal-details">
              <strong>{deleteConfirm.teacherName}</strong>
              <span>{deleteConfirm.dayName} - {deleteConfirm.hijriDate}</span>
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
