import { Course, Exam, User, Enrollment, ExamSubmission } from '@/types';

export const mockUsers: User[] = [
  { id: '1', email: 'teacher@example.com', name: 'Dr. Sarah Johnson', role: 'teacher', avatar: undefined },
  { id: '2', email: 'teacher2@example.com', name: 'Prof. Michael Chen', role: 'teacher', avatar: undefined },
  { id: '3', email: 'student@example.com', name: 'Alex Thompson', role: 'student', avatar: undefined },
  { id: '4', email: 'student2@example.com', name: 'Emily Davis', role: 'student', avatar: undefined },
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    description: 'Learn the fundamentals of programming and computational thinking. This course covers basic algorithms, data structures, and problem-solving techniques.',
    teacherId: '1',
    teacherName: 'Dr. Sarah Johnson',
    enrolledCount: 45,
    examCount: 3,
    createdAt: '2024-01-15',
    status: 'published',
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    description: 'Explore calculus, linear algebra, and differential equations. Perfect for students pursuing STEM careers.',
    teacherId: '1',
    teacherName: 'Dr. Sarah Johnson',
    enrolledCount: 32,
    examCount: 2,
    createdAt: '2024-02-01',
    status: 'published',
  },
  {
    id: '3',
    title: 'Data Science Fundamentals',
    description: 'Introduction to data analysis, visualization, and machine learning basics using Python.',
    teacherId: '2',
    teacherName: 'Prof. Michael Chen',
    enrolledCount: 58,
    examCount: 4,
    createdAt: '2024-01-20',
    status: 'published',
  },
  {
    id: '4',
    title: 'Web Development Bootcamp',
    description: 'Full-stack web development from HTML/CSS to React and Node.js.',
    teacherId: '2',
    teacherName: 'Prof. Michael Chen',
    enrolledCount: 0,
    examCount: 0,
    createdAt: '2024-03-01',
    status: 'draft',
  },
];

export const mockExams: Exam[] = [
  {
    id: '1',
    courseId: '1',
    title: 'Midterm Exam - Programming Basics',
    description: 'Test your knowledge of programming fundamentals',
    duration: 60,
    totalPoints: 100,
    status: 'published',
    createdAt: '2024-02-15',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 'q3',
        type: 'essay',
        question: 'Explain the difference between a compiler and an interpreter. Provide examples of languages that use each.',
        points: 20,
      },
    ],
  },
  {
    id: '2',
    courseId: '1',
    title: 'Quiz 1 - Variables and Data Types',
    description: 'Quick quiz on basic programming concepts',
    duration: 30,
    totalPoints: 50,
    status: 'published',
    createdAt: '2024-02-01',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which of the following is not a primitive data type in most programming languages?',
        options: ['Integer', 'Boolean', 'Array', 'Float'],
        correctAnswer: 2,
        points: 10,
      },
    ],
  },
  {
    id: '3',
    courseId: '3',
    title: 'Data Science Assessment',
    description: 'Comprehensive assessment covering data analysis techniques',
    duration: 90,
    totalPoints: 150,
    status: 'published',
    createdAt: '2024-02-20',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which Python library is primarily used for data manipulation?',
        options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
        correctAnswer: 1,
        points: 15,
      },
      {
        id: 'q2',
        type: 'essay',
        question: 'Describe the steps involved in a typical data science project lifecycle.',
        points: 30,
      },
    ],
  },
];

export const mockEnrollments: Enrollment[] = [
  { id: '1', studentId: '3', courseId: '1', enrolledAt: '2024-01-16' },
  { id: '2', studentId: '3', courseId: '3', enrolledAt: '2024-01-21' },
  { id: '3', studentId: '4', courseId: '1', enrolledAt: '2024-01-17' },
  { id: '4', studentId: '4', courseId: '2', enrolledAt: '2024-02-02' },
];

export const mockSubmissions: ExamSubmission[] = [
  {
    id: '1',
    examId: '2',
    studentId: '3',
    answers: { 'q1': 2 },
    submittedAt: '2024-02-02T10:30:00',
    score: 10,
    graded: true,
  },
];
