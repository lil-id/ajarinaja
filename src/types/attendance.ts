// Attendance System Types

export interface AttendanceSettings {
    course_id: string;
    grace_period_minutes: number;
    late_window_minutes: number;
    weight_in_grade: number;
    minimum_percentage: number;
    calculation_method: 'simple' | 'weighted';
    scoring: {
        present: number;
        late: number;
        excused: number;
        sick: number;
        absent: number;
    };
    created_at?: string;
    updated_at?: string;
}

export interface AttendanceSession {
    id: string;
    course_id: string;
    teacher_id: string;
    session_number: number;
    topic?: string;
    session_date: string;
    open_time?: string;
    close_time?: string;
    grace_end_time?: string;
    pin_hash?: string;
    pin_encrypted?: string;
    status: 'scheduled' | 'open' | 'closed' | 'finalized';
    total_students: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    excused_count: number;
    sick_count: number;
    created_at: string;
    updated_at: string;
}

export interface AttendanceRecord {
    id: string;
    session_id: string;
    student_id: string;
    status: 'present' | 'late' | 'excused' | 'sick' | 'absent';
    check_in_time?: string;
    check_in_method?: 'pin' | 'manual_teacher' | 'excuse_approved';
    pin_attempts: number;
    notes?: string;
    marked_by?: string;
    original_status?: string;
    created_at: string;
    updated_at: string;
}

export interface AttendanceExcuse {
    id: string;
    student_id: string;
    course_id: string;
    excuse_type: 'sick' | 'excused';
    start_date: string;
    end_date: string;
    reason: string;
    attachment_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by?: string;
    reviewed_at?: string;
    review_notes?: string;
    created_at: string;
    updated_at: string;
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
    student: {
        id: string;
        name: string;
        email: string;
        avatar_url?: string;
    };
}

export interface AttendanceSessionWithCourse extends AttendanceSession {
    course: {
        id: string;
        title: string;
    };
}

// RPC Response Types
export interface OpenSessionResponse {
    success: boolean;
    open_time: string;
    close_time: string;
    grace_end_time: string;
    total_students: number;
}

export interface CheckInResponse {
    success: boolean;
    status: 'present' | 'late';
    check_in_time: string;
}

export interface ApproveExcuseResponse {
    success: boolean;
    sessions_updated: number;
}

export interface UpdateAttendanceResponse {
    success: boolean;
    old_status: string;
    new_status: string;
}
