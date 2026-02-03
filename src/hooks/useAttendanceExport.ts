import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export function useAttendanceExport() {
    const { t } = useTranslation();

    const exportToCSV = (data: any[], courseId: string, period: string) => {
        if (!data || data.length === 0) return;

        const headers = [
            t('auth.name'),
            t('auth.email'),
            t('attendance.status.present'),
            t('attendance.status.late'),
            t('attendance.status.excused'),
            t('attendance.status.absent'),
            t('attendance.attendancePercentage') || 'Attendance %'
        ];

        const rows = data.map((student: any) => [
            student.name,
            student.email,
            student.present,
            student.late,
            student.excused,
            student.absent,
            `${student.attendancePercentage.toFixed(1)}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_summary_${courseId}_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = (data: any[], courseId: string, period: string, dateRangeText?: string) => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(t('attendance.studentSummary') || 'Student Attendance Summary', 14, 22);

        doc.setFontSize(11);
        let dateText = `${t('common.date')}: ${format(new Date(), 'PPP')}`;
        if (dateRangeText) {
            dateText += ` (${dateRangeText})`;
        } else if (period === 'all') {
            dateText += ` (${t('attendance.periodAll') || 'All Time'})`;
        }
        doc.text(dateText, 14, 30);

        const headers = [[
            t('auth.name'),
            t('attendance.status.present'),
            t('attendance.status.late'),
            t('attendance.status.excused'),
            t('attendance.status.absent'),
            '%'
        ]];

        const mappedData = data.map((student: any) => [
            student.name,
            student.present,
            student.late,
            student.excused,
            student.absent,
            `${student.attendancePercentage.toFixed(1)}%`
        ]);

        autoTable(doc, {
            head: headers,
            body: mappedData,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [63, 81, 181] },
        });

        doc.save(`attendance_summary_${courseId}_${period}.pdf`);
    };

    return { exportToCSV, exportToPDF };
}
