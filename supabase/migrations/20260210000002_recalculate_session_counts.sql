-- Recalculate Session Statistics
-- Updates all attendance_sessions with accurate counts from attendance_records

UPDATE attendance_sessions s
SET 
    present_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'present'),
    late_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'late'),
    absent_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'absent'),
    excused_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'excused'),
    sick_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'sick')
WHERE TRUE;
