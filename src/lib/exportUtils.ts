import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExamPerformanceData {
  name: string;
  fullName: string;
  submissions: number;
  avgScore: number;
  totalPoints: number;
}

interface ScoreRangeData {
  range: string;
  count: number;
  label: string;
}

interface AnalyticsData {
  totalStudents: number;
  totalSubmissions: number;
  avgScore: number;
  passRate: number;
  scoreRanges: ScoreRangeData[];
  examPerformance: ExamPerformanceData[];
  courseName?: string;
  exportDate: string;
}

// CSV Export
export function exportToCSV(data: AnalyticsData, filename: string = 'analytics-report') {
  const lines: string[] = [];
  
  // Header
  lines.push('AjarinAja Analytics Report');
  lines.push(`Export Date,${data.exportDate}`);
  if (data.courseName) {
    lines.push(`Course,${data.courseName}`);
  }
  lines.push('');
  
  // Overview Stats
  lines.push('OVERVIEW STATISTICS');
  lines.push('Metric,Value');
  lines.push(`Total Students,${data.totalStudents}`);
  lines.push(`Total Submissions,${data.totalSubmissions}`);
  lines.push(`Average Score (pts),${data.avgScore}`);
  lines.push(`Pass Rate,${data.passRate}%`);
  lines.push('');
  
  // Score Distribution
  lines.push('SCORE DISTRIBUTION');
  lines.push('Range,Grade,Count');
  data.scoreRanges.forEach(range => {
    lines.push(`${range.range},${range.label},${range.count}`);
  });
  lines.push('');
  
  // Exam Performance
  lines.push('EXAM PERFORMANCE');
  lines.push('Exam Name,Submissions,Average Score (%),Total Points');
  data.examPerformance.forEach(exam => {
    lines.push(`"${exam.fullName}",${exam.submissions},${exam.avgScore}%,${exam.totalPoints}`);
  });
  
  const csvContent = lines.join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// PDF Export
export function exportToPDF(data: AnalyticsData, filename: string = 'analytics-report') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('AjarinAja Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${data.exportDate}`, pageWidth / 2, 28, { align: 'center' });
  if (data.courseName) {
    doc.text(`Course: ${data.courseName}`, pageWidth / 2, 34, { align: 'center' });
  }
  
  // Overview Stats Section
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Overview Statistics', 14, 48);
  
  autoTable(doc, {
    startY: 52,
    head: [['Metric', 'Value']],
    body: [
      ['Total Students', data.totalStudents.toString()],
      ['Total Submissions', data.totalSubmissions.toString()],
      ['Average Score (pts)', data.avgScore.toString()],
      ['Pass Rate', `${data.passRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [20, 184, 166] },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  });
  
  // Score Distribution Section
  const afterOverview = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Score Distribution', 14, afterOverview);
  
  autoTable(doc, {
    startY: afterOverview + 4,
    head: [['Range', 'Grade', 'Students']],
    body: data.scoreRanges.map(range => [range.range, range.label, range.count.toString()]),
    theme: 'grid',
    headStyles: { fillColor: [20, 184, 166] },
    margin: { left: 14, right: 14 },
  });
  
  // Exam Performance Section
  const afterScore = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (afterScore > 240) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Exam Performance', 14, 20);
    
    autoTable(doc, {
      startY: 24,
      head: [['Exam Name', 'Submissions', 'Avg Score', 'Total Points']],
      body: data.examPerformance.map(exam => [
        exam.fullName.length > 35 ? exam.fullName.substring(0, 35) + '...' : exam.fullName,
        exam.submissions.toString(),
        `${exam.avgScore}%`,
        exam.totalPoints.toString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 80 },
      },
    });
  } else {
    doc.setFontSize(14);
    doc.text('Exam Performance', 14, afterScore);
    
    autoTable(doc, {
      startY: afterScore + 4,
      head: [['Exam Name', 'Submissions', 'Avg Score', 'Total Points']],
      body: data.examPerformance.map(exam => [
        exam.fullName.length > 35 ? exam.fullName.substring(0, 35) + '...' : exam.fullName,
        exam.submissions.toString(),
        `${exam.avgScore}%`,
        exam.totalPoints.toString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 80 },
      },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | AjarinAja Analytics`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`${filename}.pdf`);
}

// Detailed submissions export
interface SubmissionData {
  studentName: string;
  studentEmail: string;
  examTitle: string;
  submittedAt: string;
  score: number | null;
  totalPoints: number;
  graded: boolean;
}

export function exportSubmissionsToCSV(
  submissions: SubmissionData[],
  filename: string = 'exam-submissions'
) {
  const lines: string[] = [];
  
  lines.push('Student Name,Student Email,Exam,Submitted At,Score,Total Points,Percentage,Status');
  
  submissions.forEach(s => {
    const percentage = s.score !== null && s.totalPoints > 0 
      ? Math.round((s.score / s.totalPoints) * 100) + '%'
      : 'N/A';
    const status = s.graded ? 'Graded' : 'Pending';
    lines.push(
      `"${s.studentName}","${s.studentEmail}","${s.examTitle}","${s.submittedAt}",${s.score ?? 'N/A'},${s.totalPoints},${percentage},${status}`
    );
  });
  
  const csvContent = lines.join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// Helper function to trigger download
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
