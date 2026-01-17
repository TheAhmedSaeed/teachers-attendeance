import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, FileText, ArrowRight, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { SchoolConfig, Teacher } from '../types';
import { getConfig, saveConfig, generateId } from '../utils/storage';

export function ConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [newTeacher, setNewTeacher] = useState({ name: '', nationalId: '', phone: '' });
  const [activeTab, setActiveTab] = useState<'general' | 'teachers' | 'templates'>('general');
  const [saveMessage, setSaveMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function validateNationalId(id: string): boolean {
    // Saudi National ID validation: 10 digits, starts with 1 or 2
    const regex = /^[12]\d{9}$/;
    return regex.test(id);
  }

  function handleAddTeacher() {
    setValidationError('');
    
    if (!newTeacher.name.trim()) {
      setValidationError('يرجى إدخال اسم المعلم');
      return;
    }
    
    if (!newTeacher.nationalId.trim()) {
      setValidationError('يرجى إدخال رقم الهوية');
      return;
    }
    
    if (!validateNationalId(newTeacher.nationalId)) {
      setValidationError('رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2');
      return;
    }
    
    // Check for duplicate national ID
    if (config?.teachers.some(t => t.nationalId === newTeacher.nationalId)) {
      setValidationError('رقم الهوية مسجل مسبقاً');
      return;
    }

    if (config) {
      const teacher: Teacher = {
        id: generateId(),
        name: newTeacher.name.trim(),
        nationalId: newTeacher.nationalId.trim(),
        phone: newTeacher.phone.trim() || undefined,
      };
      setConfig({
        ...config,
        teachers: [...config.teachers, teacher],
      });
      setNewTeacher({ name: '', nationalId: '', phone: '' });
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

  function handleUpdateTeacher(teacherId: string, field: keyof Teacher, value: string) {
    if (config) {
      setConfig({
        ...config,
        teachers: config.teachers.map((t) =>
          t.id === teacherId ? { ...t, [field]: value } : t
        ),
      });
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !config) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Skip header row and process data
        const newTeachers: Teacher[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const name = String(row[0] || '').trim();
          const nationalId = String(row[1] || '').trim();
          const phone = String(row[2] || '').trim();

          if (!name || !nationalId) {
            errors.push(`صف ${i + 1}: الاسم أو رقم الهوية فارغ`);
            continue;
          }

          if (!validateNationalId(nationalId)) {
            errors.push(`صف ${i + 1}: رقم الهوية غير صحيح (${nationalId})`);
            continue;
          }

          // Check for duplicates in existing teachers and new teachers
          if (config.teachers.some(t => t.nationalId === nationalId) || 
              newTeachers.some(t => t.nationalId === nationalId)) {
            errors.push(`صف ${i + 1}: رقم الهوية مكرر (${nationalId})`);
            continue;
          }

          newTeachers.push({
            id: generateId(),
            name,
            nationalId,
            phone: phone || undefined,
          });
        }

        if (newTeachers.length > 0) {
          setConfig({
            ...config,
            teachers: [...config.teachers, ...newTeachers],
          });
          setSaveMessage(`تم إضافة ${newTeachers.length} معلم بنجاح`);
          setTimeout(() => setSaveMessage(''), 5000);
        }

        if (errors.length > 0) {
          setValidationError(errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n... و ${errors.length - 3} أخطاء أخرى` : ''));
          setTimeout(() => setValidationError(''), 10000);
        }
      } catch (error) {
        setValidationError('حدث خطأ في قراءة الملف. تأكد من صيغة الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function downloadTemplate() {
    const templateData = [
      ['اسم المعلم', 'رقم الهوية', 'رقم الجوال'],
      ['محمد أحمد', '1234567890', '0501234567'],
      ['عبدالله خالد', '1098765432', '0559876543'],
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المعلمين');
    XLSX.writeFile(workbook, 'قالب_المعلمين.xlsx');
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
            {/* Excel Upload Section */}
            <div className="excel-section">
              <h3>استيراد من ملف Excel</h3>
              <div className="excel-buttons">
                <button className="btn-template" onClick={downloadTemplate}>
                  <Download size={18} />
                  <span>تحميل القالب</span>
                </button>
                <label className="btn-upload">
                  <Upload size={18} />
                  <span>رفع ملف Excel</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    hidden
                  />
                </label>
              </div>
              <p className="hint">الملف يجب أن يحتوي على: اسم المعلم، رقم الهوية، رقم الجوال (اختياري)</p>
            </div>

            <div className="divider">
              <span>أو أضف يدوياً</span>
            </div>

            {/* Manual Add Form */}
            <div className="add-teacher-form-new">
              <div className="form-row">
                <div className="form-group">
                  <label>اسم المعلم *</label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    placeholder="أدخل اسم المعلم"
                  />
                </div>
                <div className="form-group">
                  <label>رقم الهوية *</label>
                  <input
                    type="text"
                    value={newTeacher.nationalId}
                    onChange={(e) => setNewTeacher({ ...newTeacher, nationalId: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10 أرقام"
                    maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label>رقم الجوال</label>
                  <input
                    type="text"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="05xxxxxxxx"
                    maxLength={10}
                  />
                </div>
              </div>
              
              {validationError && (
                <div className="validation-error">
                  {validationError.split('\n').map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
              
              <button className="btn-add" onClick={handleAddTeacher}>
                <Plus size={18} />
                <span>إضافة معلم</span>
              </button>
            </div>

            {/* Teachers List */}
            <div className="teachers-list-new">
              <h3>قائمة المعلمين ({config.teachers.length})</h3>
              {config.teachers.length === 0 ? (
                <div className="empty-state">
                  <p>لا يوجد معلمين مسجلين</p>
                  <p className="hint">أضف المعلمين باستخدام النموذج أعلاه أو قم برفع ملف Excel</p>
                </div>
              ) : (
                <div className="teachers-table">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اسم المعلم</th>
                        <th>رقم الهوية</th>
                        <th>رقم الجوال</th>
                        <th>إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.teachers.map((teacher, index) => (
                        <tr key={teacher.id}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={teacher.name}
                              onChange={(e) => handleUpdateTeacher(teacher.id, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={teacher.nationalId}
                              onChange={(e) => handleUpdateTeacher(teacher.id, 'nationalId', e.target.value.replace(/\D/g, '').slice(0, 10))}
                              maxLength={10}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={teacher.phone || ''}
                              onChange={(e) => handleUpdateTeacher(teacher.id, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="-"
                              maxLength={10}
                            />
                          </td>
                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => handleRemoveTeacher(teacher.id)}
                              title="حذف المعلم"
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
                <code>{'{{nationalId}}'}</code>
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
