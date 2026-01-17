import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserX, 
  Clock, 
  FileText, 
  BarChart3,
  Calendar,
  Building2,
  User,
  List
} from 'lucide-react';
import type { SchoolConfig } from '../types';
import { getConfig } from '../utils/storage';
import { DatePicker } from '../components/DatePicker';

export function MainPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
  }

  function handleAction(action: string) {
    navigate(`/${action}?date=${selectedDate}`);
  }

  if (!config) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  const isConfigured = config.schoolName && config.principalName && config.teachers.length > 0;

  return (
    <div className="main-page">
      <div className="school-header">
        <div className="school-info">
          <div className="info-item">
            <Building2 size={24} />
            <div>
              <span className="label">المدرسة</span>
              <span className="value">{config.schoolName || 'غير محدد'}</span>
            </div>
          </div>
          <div className="info-item">
            <User size={24} />
            <div>
              <span className="label">مدير المدرسة</span>
              <span className="value">{config.principalName || 'غير محدد'}</span>
            </div>
          </div>
        </div>
      </div>

      {!isConfigured && (
        <div className="config-warning">
          <p>⚠️ يرجى إكمال إعدادات النظام قبل البدء</p>
          <button onClick={() => navigate('/config')}>
            الذهاب للإعدادات
          </button>
        </div>
      )}

      <div className="date-section">
        <h2>
          <Calendar size={22} />
          <span>تاريخ اليوم</span>
        </h2>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          excludeWeekends={true}
        />
      </div>

      <div className="actions-section">
        <h2>الإجراءات</h2>
        <div className="actions-grid">
          <button 
            className="action-card absence"
            onClick={() => handleAction('absence')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <UserX size={32} />
            </div>
            <span>إدخال الغياب</span>
          </button>

          <button 
            className="action-card tardiness"
            onClick={() => handleAction('tardiness')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <Clock size={32} />
            </div>
            <span>إدخال التأخر</span>
          </button>

          <button 
            className="action-card view-list"
            onClick={() => navigate('/absence-list')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <List size={32} />
            </div>
            <span>سجل الغياب</span>
          </button>

          <button 
            className="action-card view-list"
            onClick={() => navigate('/tardiness-list')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <List size={32} />
            </div>
            <span>سجل التأخر</span>
          </button>

          <button 
            className="action-card report-absence"
            onClick={() => handleAction('absence-report')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <FileText size={32} />
            </div>
            <span>طباعة مساءلة الغياب</span>
          </button>

          <button 
            className="action-card report-tardiness"
            onClick={() => handleAction('tardiness-report')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <FileText size={32} />
            </div>
            <span>طباعة مساءلة التأخر</span>
          </button>

          <button 
            className="action-card statistics"
            onClick={() => handleAction('statistics')}
            disabled={!isConfigured}
          >
            <div className="action-icon">
              <BarChart3 size={32} />
            </div>
            <span>طباعة الإحصائيات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
