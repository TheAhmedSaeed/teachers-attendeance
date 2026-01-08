import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, FileText, ArrowRight } from 'lucide-react';
import type { SchoolConfig, Teacher } from '../types';
import { getConfig, saveConfig, generateId } from '../utils/storage';

export function ConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'teachers' | 'templates'>('general');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
  }

  async function handleSave() {
    if (config) {
      await saveConfig(config);
      setSaveMessage('تم الحفظ بنجاح ✓');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }

  function handleAddTeacher() {
    if (newTeacherName.trim() && config) {
      const newTeacher: Teacher = {
        id: generateId(),
        name: newTeacherName.trim(),
      };
      setConfig({
        ...config,
        teachers: [...config.teachers, newTeacher],
      });
      setNewTeacherName('');
    }
  }

  function handleRemoveTeacher(teacherId: string) {
    if (config) {
      setConfig({
        ...config,
        teachers: config.teachers.filter((t) => t.id !== teacherId),
      });
    }
  }

  function handleUpdateTeacher(teacherId: string, newName: string) {
    if (config) {
      setConfig({
        ...config,
        teachers: config.teachers.map((t) =>
          t.id === teacherId ? { ...t, name: newName } : t
        ),
      });
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
    <div className="config-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </button>
        <h1>إعدادات النظام</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          الإعدادات العامة
        </button>
        <button
          className={`tab ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          المعلمين
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          قوالب المساءلات
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="form-group">
              <label htmlFor="schoolName">اسم المدرسة</label>
              <input
                type="text"
                id="schoolName"
                value={config.schoolName}
                onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
                placeholder="أدخل اسم المدرسة"
              />
            </div>

            <div className="form-group">
              <label htmlFor="principalName">اسم مدير المدرسة</label>
              <input
                type="text"
                id="principalName"
                value={config.principalName}
                onChange={(e) => setConfig({ ...config, principalName: e.target.value })}
                placeholder="أدخل اسم مدير المدرسة"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cutoffTime">وقت احتساب التأخر</label>
              <input
                type="time"
                id="cutoffTime"
                value={config.tardinessCutoffTime}
                onChange={(e) => setConfig({ ...config, tardinessCutoffTime: e.target.value })}
              />
              <span className="hint">الوقت الذي يُعتبر بعده المعلم متأخراً</span>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="settings-section">
            <div className="add-teacher-form">
              <input
                type="text"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                placeholder="اسم المعلم الجديد"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeacher()}
              />
              <button className="btn-add" onClick={handleAddTeacher}>
                <Plus size={18} />
                <span>إضافة</span>
              </button>
            </div>

            <div className="teachers-list">
              {config.teachers.length === 0 ? (
                <div className="empty-state">
                  <p>لا يوجد معلمين مسجلين</p>
                  <p className="hint">أضف المعلمين باستخدام النموذج أعلاه</p>
                </div>
              ) : (
                config.teachers.map((teacher, index) => (
                  <div key={teacher.id} className="teacher-item">
                    <span className="teacher-number">{index + 1}</span>
                    <input
                      type="text"
                      value={teacher.name}
                      onChange={(e) => handleUpdateTeacher(teacher.id, e.target.value)}
                    />
                    <button
                      className="btn-delete"
                      onClick={() => handleRemoveTeacher(teacher.id)}
                      title="حذف المعلم"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="settings-section templates-section">
            <div className="template-info">
              <FileText size={20} />
              <p>
                استخدم المتغيرات التالية في القوالب:
                <code>{'{{schoolName}}'}</code>
                <code>{'{{principalName}}'}</code>
                <code>{'{{teacherName}}'}</code>
                <code>{'{{startDate}}'}</code>
                <code>{'{{endDate}}'}</code>
                <code>{'{{totalDays}}'}</code>
                <code>{'{{currentDate}}'}</code>
                <code>{'{{tardinessDetails}}'}</code>
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="absenceTemplate">قالب مساءلة الغياب</label>
              <textarea
                id="absenceTemplate"
                value={config.absenceTemplate}
                onChange={(e) => setConfig({ ...config, absenceTemplate: e.target.value })}
                rows={15}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tardinessTemplate">قالب مساءلة التأخر</label>
              <textarea
                id="tardinessTemplate"
                value={config.tardinessTemplate}
                onChange={(e) => setConfig({ ...config, tardinessTemplate: e.target.value })}
                rows={15}
              />
            </div>
          </div>
        )}
      </div>

      <div className="save-section">
        {saveMessage && <span className="save-message">{saveMessage}</span>}
        <button className="btn-save" onClick={handleSave}>
          <Save size={18} />
          <span>حفظ الإعدادات</span>
        </button>
      </div>
    </div>
  );
}
