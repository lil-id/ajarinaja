export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  thumbnail?: string;
  enrolledCount: number;
  examCount: number;
  createdAt: string;
  status: 'draft' | 'published';
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: Question[];
  duration: number; // in minutes
  totalPoints: number;
  status: 'draft' | 'published';
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string | number>;
  submittedAt: string;
  score?: number;
  graded: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
}
