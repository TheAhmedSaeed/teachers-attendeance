import type { SchoolConfig, TardinessRecord } from '../types';
import { formatDateForDisplay } from './hijriConverter';

function downloadAsPdf(htmlContent: string, filename: string): void {
  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتحميل الملف');
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Naskh Arabic', 'Traditional Arabic', 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.8;
          padding: 40px;
          direction: rtl;
          text-align: right;
          background: white;
          color: #1a1a2e;
        }
        
        .content {
          white-space: pre-wrap;
          max-width: 100%;
        }
        
        h1, h2 {
          margin-bottom: 20px;
          color: #0f4c5c;
        }
        
        h1 {
          text-align: center;
          border-bottom: 2px solid #0f4c5c;
          padding-bottom: 10px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        th, td {
          border: 1px solid #333;
          padding: 10px;
          text-align: right;
        }
        
        th {
          background-color: #0f4c5c;
          color: white;
        }
        
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        .date-footer {
          text-align: left;
          margin-top: 40px;
          font-size: 12px;
        }
        
        .print-instructions {
          position: fixed;
          top: 10px;
          left: 10px;
          background: #0f4c5c;
          color: white;
          padding: 15px 25px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .print-instructions button {
          background: white;
          color: #0f4c5c;
          border: none;
          padding: 8px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-family: inherit;
          font-weight: bold;
          margin-top: 10px;
          display: block;
          width: 100%;
        }
        
        .print-instructions button:hover {
          background: #f0f0f0;
        }
        
        @media print {
          .print-instructions {
            display: none !important;
          }
          
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-instructions">
        <div>لحفظ كملف PDF:</div>
        <div style="font-size: 12px; margin-top: 5px;">اضغط Ctrl+P ثم اختر "Save as PDF"</div>
        <button onclick="window.print()">طباعة / حفظ PDF</button>
      </div>
      ${htmlContent}
    </body>
    </html>
  `;

  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

export function generateAbsenceReport(
  config: SchoolConfig,
  teacherName: string,
  startDate: string,
  endDate: string,
  totalDays: number
): void {
  const startDateInfo = formatDateForDisplay(startDate);
  const endDateInfo = formatDateForDisplay(endDate);
  const currentDateInfo = formatDateForDisplay(new Date().toISOString());
  
  let content = config.absenceTemplate
    .replace(/{{schoolName}}/g, config.schoolName)
    .replace(/{{principalName}}/g, config.principalName)
    .replace(/{{teacherName}}/g, teacherName)
    .replace(/{{startDate}}/g, `${startDateInfo.hijri} (${startDateInfo.dayName})`)
    .replace(/{{endDate}}/g, `${endDateInfo.hijri} (${endDateInfo.dayName})`)
    .replace(/{{totalDays}}/g, totalDays.toString())
    .replace(/{{currentDate}}/g, currentDateInfo.hijri);

  const htmlContent = `
    <div class="content">${content.replace(/\n/g, '<br>')}</div>
  `;

  const filename = `مساءلة غياب - ${teacherName}`;
  downloadAsPdf(htmlContent, filename);
}

export function generateTardinessReport(
  config: SchoolConfig,
  teacherName: string,
  tardinessRecords: TardinessRecord[]
): void {
  const currentDateInfo = formatDateForDisplay(new Date().toISOString());
  
  const tardinessDetails = tardinessRecords
    .map((record) => {
      const dateInfo = formatDateForDisplay(record.date);
      return `- ${dateInfo.dayName} ${dateInfo.hijri}: حضور الساعة ${record.arrivalTime} (تأخر ${record.lateByMinutes} دقيقة)`;
    })
    .join('\n');

  let content = config.tardinessTemplate
    .replace(/{{schoolName}}/g, config.schoolName)
    .replace(/{{principalName}}/g, config.principalName)
    .replace(/{{teacherName}}/g, teacherName)
    .replace(/{{tardinessDetails}}/g, tardinessDetails)
    .replace(/{{currentDate}}/g, currentDateInfo.hijri);

  const htmlContent = `
    <div class="content">${content.replace(/\n/g, '<br>')}</div>
  `;

  const filename = `مساءلة تأخر - ${teacherName}`;
  downloadAsPdf(htmlContent, filename);
}

export function generateStatisticsReport(
  config: SchoolConfig,
  absenceStats: { teacherName: string; totalAbsences: number }[],
  tardinessStats: { teacherName: string; totalTardiness: number; totalMinutes: number }[]
): void {
  const currentDateInfo = formatDateForDisplay(new Date().toISOString());

  const htmlContent = `
    <div class="header">
      <h1>إحصائيات الحضور والغياب</h1>
      <p>مدرسة: ${config.schoolName}</p>
      <p>مدير المدرسة: ${config.principalName}</p>
    </div>
    
    <h2>إحصائيات الغياب</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>اسم المعلم</th>
          <th>عدد أيام الغياب</th>
        </tr>
      </thead>
      <tbody>
        ${absenceStats.length > 0 ? absenceStats.map((stat, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${stat.teacherName}</td>
            <td>${stat.totalAbsences}</td>
          </tr>
        `).join('') : '<tr><td colspan="3" style="text-align: center;">لا يوجد سجلات غياب</td></tr>'}
      </tbody>
    </table>
    
    <h2>إحصائيات التأخر</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>اسم المعلم</th>
          <th>عدد مرات التأخر</th>
          <th>إجمالي دقائق التأخر</th>
        </tr>
      </thead>
      <tbody>
        ${tardinessStats.length > 0 ? tardinessStats.map((stat, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${stat.teacherName}</td>
            <td>${stat.totalTardiness}</td>
            <td>${stat.totalMinutes}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center;">لا يوجد سجلات تأخر</td></tr>'}
      </tbody>
    </table>
    
    <p class="date-footer">تاريخ الطباعة: ${currentDateInfo.hijri}</p>
  `;

  const filename = `إحصائيات الحضور`;
  downloadAsPdf(htmlContent, filename);
}
