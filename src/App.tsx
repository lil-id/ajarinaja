import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import PublicCourses from "./pages/PublicCourses";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Teacher Pages
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherOverview from "./pages/teacher/Overview";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherCourseDetail from "./pages/teacher/CourseDetail";
import TeacherExams from "./pages/teacher/Exams";
import TeacherCreateExam from "./pages/teacher/CreateExam";
import TeacherEditExam from "./pages/teacher/EditExam";
import TeacherGradeExam from "./pages/teacher/GradeExam";
import TeacherAnnouncements from "./pages/teacher/Announcements";
import TeacherMaterials from "./pages/teacher/Materials";
import TeacherAnalytics from "./pages/teacher/Analytics";
import TeacherStudents from "./pages/teacher/Students";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherSettings from "./pages/teacher/Settings";
import TeacherAssignments from "./pages/teacher/Assignments";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import AssignmentSubmissions from "./pages/teacher/AssignmentSubmissions";
import TeacherQuestionBank from "./pages/teacher/QuestionBank";
import TeacherCalendar from "./pages/teacher/Calendar";
import TeacherAtRiskStudents from "./pages/teacher/AtRiskStudents";
import TeacherReportCards from "./pages/teacher/ReportCards";
import TeacherReportCardDetail from "./pages/teacher/ReportCardDetail";
import TeacherAttendanceSessionDetail from "./pages/teacher/AttendanceSessionDetail";
import TeacherAttendance from "./pages/teacher/Attendance";

// Student Pages
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentExploreCourses from "./pages/student/ExploreCourses";
import StudentCourseDetail from "./pages/student/CourseDetail";
import StudentExams from "./pages/student/Exams";
import TakeExam from "./pages/student/TakeExam";
import ExamResults from "./pages/student/ExamResults";
import StudentAnnouncements from "./pages/student/Announcements";
import StudentMaterials from "./pages/student/Materials";
import StudentBadges from "./pages/student/Badges";
import StudentProfile from "./pages/student/Profile";
import StudentSettings from "./pages/student/Settings";
import StudentAssignments from "./pages/student/Assignments";
import SubmitAssignment from "./pages/student/SubmitAssignment";
import StudentNotifications from "./pages/student/Notifications";
import StudentAnalytics from "./pages/student/Analytics";
import StudentCalendar from "./pages/student/Calendar";
import StudentReportCards from "./pages/student/ReportCards";
import StudentReportCardDetail from "./pages/student/ReportCardDetail";
import StudentAttendance from "./pages/student/Attendance";
import StudentOnboarding from "./pages/student/StudentOnboarding";

// Parent Pages
import ParentLayout from "./layouts/ParentLayout";
import ParentOverview from "./pages/parent/ParentOverview";
import AddChild from "./pages/parent/AddChild";
import ChildDashboard from "./pages/parent/ChildDashboard";
import ChildAttendance from "./pages/parent/ChildAttendance";
import ChildAssignments from "./pages/parent/ChildAssignments";
import ChildExams from "./pages/parent/ChildExams";

import ParentNotifications from "./pages/parent/ParentNotifications";
import ParentSettings from "./pages/parent/ParentSettings";

// Operator Pages
import OperatorLayout from "./layouts/OperatorLayout";
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorPeriods from "./pages/operator/OperatorPeriods";
import OperatorCourses from "./pages/operator/OperatorCourses";
import OperatorUsers from "./pages/operator/OperatorUsers";
import OperatorReports from "./pages/operator/OperatorReports";
import OperatorAnnouncements from "./pages/operator/OperatorAnnouncements";
import OperatorSettings from "./pages/operator/OperatorSettings";
import OperatorClasses from "./pages/operator/OperatorClasses";
import OperatorSchedules from "./pages/operator/OperatorSchedules";
import OperatorCalendar from "./pages/operator/OperatorCalendar";

// Demo Pages
import DemoLayout from "./layouts/DemoLayout";
import DemoTeacherOverview from "./pages/demo/DemoTeacherOverview";
import DemoStudentDashboard from "./pages/demo/DemoStudentDashboard";
import DemoGenericPage from "./pages/demo/DemoGenericPage";
import DemoTeacherCourses from "./pages/demo/DemoTeacherCourses";
import DemoTeacherExams from "./pages/demo/DemoTeacherExams";
import DemoTeacherAssignments from "./pages/demo/DemoTeacherAssignments";
import DemoTeacherMaterials from "./pages/demo/DemoTeacherMaterials";
import DemoTeacherAnalytics from "./pages/demo/DemoTeacherAnalytics";
import DemoTeacherCalendar from "./pages/demo/DemoTeacherCalendar";
import DemoTeacherAnnouncements from "./pages/demo/DemoTeacherAnnouncements";
import DemoTeacherStudents from "./pages/demo/DemoTeacherStudents";
import DemoTeacherQuestionBank from "./pages/demo/DemoTeacherQuestionBank";
import DemoTeacherGradeExam from "./pages/demo/DemoTeacherGradeExam";
import DemoTeacherGradeAssignment from "./pages/demo/DemoTeacherGradeAssignment";
import DemoStudentCourses from "./pages/demo/DemoStudentCourses";
import DemoStudentCourseDetail from "./pages/demo/DemoStudentCourseDetail";
import DemoStudentExams from "./pages/demo/DemoStudentExams";
import DemoStudentTakeExam from "./pages/demo/DemoStudentTakeExam";
import DemoStudentAssignments from "./pages/demo/DemoStudentAssignments";
import DemoStudentSubmitAssignment from "./pages/demo/DemoStudentSubmitAssignment";
import DemoStudentAnalytics from "./pages/demo/DemoStudentAnalytics";
import DemoStudentCalendar from "./pages/demo/DemoStudentCalendar";
import DemoStudentNotifications from "./pages/demo/DemoStudentNotifications";
import DemoStudentMaterials from "./pages/demo/DemoStudentMaterials";
// Parent Demo
import DemoParentOverview from "./pages/demo/DemoParentOverview";
import DemoChildDashboard from "./pages/demo/DemoChildDashboard";
import DemoChildAttendance from "./pages/demo/DemoChildAttendance";
import DemoChildAssignments from "./pages/demo/DemoChildAssignments";
import DemoChildExams from "./pages/demo/DemoChildExams";
// Operator Demo
import DemoOperatorDashboard from "./pages/demo/DemoOperatorDashboard";
import DemoOperatorReports from "./pages/demo/DemoOperatorReports";
import DemoOperatorAnnouncements from "./pages/demo/DemoOperatorAnnouncements";
import DemoOperatorPeriods from "./pages/demo/DemoOperatorPeriods";
import DemoOperatorSchedules from "./pages/demo/DemoOperatorSchedules";
import DemoOperatorClasses from "./pages/demo/DemoOperatorClasses";

const queryClient = new QueryClient();

/**
 * Root Application Component.
 * 
 * Configures global providers:
 * - QueryClientProvider: React Query cache
 * - AuthProvider: User authentication state
 * - TooltipProvider: UI tooltips
 * - Toaster: Toast notifications
 * - BrowserRouter: Client-side routing
 * 
 * Defines all application routes:
 * - Public routes (Home, Login, Reset Password)
 * - Teacher routes (Protected, /teacher/*)
 * - Student routes (Protected, /student/*)
 * - Demo routes (/demo/*)
 * 
 * @returns {JSX.Element} The root application tree.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<PublicCourses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute requiredRole="teacher">
                <SidebarProvider>
                  <TeacherLayout />
                </SidebarProvider>
              </ProtectedRoute>
            }>
              <Route index element={<TeacherOverview />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
              <Route path="courses/:courseId/attendance/:sessionId" element={<TeacherAttendanceSessionDetail />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="exams/new" element={<TeacherCreateExam />} />
              <Route path="exams/:examId/edit" element={<TeacherEditExam />} />
              <Route path="exams/:examId/grade" element={<TeacherGradeExam />} />
              <Route path="announcements" element={<TeacherAnnouncements />} />
              <Route path="materials" element={<TeacherMaterials />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="assignments/new" element={<CreateAssignment />} />
              <Route path="assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
              <Route path="assignments/:assignmentId/edit" element={<CreateAssignment />} />
              <Route path="question-bank" element={<TeacherQuestionBank />} />
              <Route path="calendar" element={<TeacherCalendar />} />
              <Route path="at-risk" element={<TeacherAtRiskStudents />} />
              <Route path="report-cards" element={<TeacherReportCards />} />
              <Route path="report-cards/:reportCardId" element={<TeacherReportCardDetail />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="profile" element={<TeacherProfile />} />
              <Route path="settings" element={<TeacherSettings />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="onboarding" element={<StudentOnboarding />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="explore" element={<StudentExploreCourses />} />
              <Route path="courses/:courseId" element={<StudentCourseDetail />} />
              <Route path="exams" element={<StudentExams />} />
              <Route path="exam/:examId" element={<TakeExam />} />
              <Route path="exam/:examId/results" element={<ExamResults />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="materials" element={<StudentMaterials />} />
              <Route path="badges" element={<StudentBadges />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="assignments/:assignmentId" element={<SubmitAssignment />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="analytics" element={<StudentAnalytics />} />
              <Route path="calendar" element={<StudentCalendar />} />
              <Route path="report-cards" element={<StudentReportCards />} />
              <Route path="report-cards/:reportCardId" element={<StudentReportCardDetail />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

            {/* Parent Routes */}
            <Route path="/parent" element={
              <ProtectedRoute requiredRole="parent">
                <ParentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ParentOverview />} />
              <Route path="children" element={<ParentOverview />} />
              <Route path="add-child" element={<AddChild />} />
              <Route path="children/:childId" element={<ChildDashboard />} />
              <Route path="children/:childId/attendance" element={<ChildAttendance />} />
              <Route path="children/:childId/assignments" element={<ChildAssignments />} />
              <Route path="children/:childId/exams" element={<ChildExams />} />
              <Route path="children/:childId/courses" element={<DemoGenericPage />} />
              <Route path="notifications" element={<ParentNotifications />} />
              <Route path="profile" element={<ParentSettings />} />
              <Route path="settings" element={<ParentSettings />} />
            </Route>

            {/* Operator Routes */}
            <Route path="/operator" element={
              <ProtectedRoute requiredRole="operator">
                <OperatorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<OperatorDashboard />} />
              <Route path="announcements" element={<OperatorAnnouncements />} />
              <Route path="periods" element={<OperatorPeriods />} />
              <Route path="courses" element={<OperatorCourses />} />
              <Route path="users" element={<OperatorUsers />} />
              <Route path="reports" element={<OperatorReports />} />
              <Route path="settings" element={<OperatorSettings />} />
              <Route path="classes" element={<OperatorClasses />} />
              <Route path="schedules" element={<OperatorSchedules />} />
              <Route path="calendar" element={<OperatorCalendar />} />
            </Route>

            {/* Demo Routes */}
            <Route path="/demo" element={
              <DemoProvider>
                <DemoLayout />
              </DemoProvider>
            }>
              {/* Teacher Demo */}
              <Route path="teacher" element={<DemoTeacherOverview />} />
              <Route path="teacher/courses" element={<DemoTeacherCourses />} />
              <Route path="teacher/exams" element={<DemoTeacherExams />} />
              <Route path="teacher/exams/:examId/grade" element={<DemoTeacherGradeExam />} />
              <Route path="teacher/assignments" element={<DemoTeacherAssignments />} />
              <Route path="teacher/assignments/:assignmentId/grade" element={<DemoTeacherGradeAssignment />} />
              <Route path="teacher/materials" element={<DemoTeacherMaterials />} />
              <Route path="teacher/students" element={<DemoTeacherStudents />} />
              <Route path="teacher/question-bank" element={<DemoTeacherQuestionBank />} />
              <Route path="teacher/analytics" element={<DemoTeacherAnalytics />} />
              <Route path="teacher/calendar" element={<DemoTeacherCalendar />} />
              <Route path="teacher/announcements" element={<DemoTeacherAnnouncements />} />

              {/* Student Demo */}
              <Route path="student" element={<DemoStudentDashboard />} />
              <Route path="student/courses" element={<DemoStudentCourses />} />
              <Route path="student/courses/:courseId" element={<DemoStudentCourseDetail />} />
              <Route path="student/exams" element={<DemoStudentExams />} />
              <Route path="student/exams/:examId" element={<DemoStudentTakeExam />} />
              <Route path="student/assignments" element={<DemoStudentAssignments />} />
              <Route path="student/assignments/:assignmentId" element={<DemoStudentSubmitAssignment />} />
              <Route path="student/materials" element={<DemoStudentMaterials />} />
              <Route path="student/analytics" element={<DemoStudentAnalytics />} />
              <Route path="student/calendar" element={<DemoStudentCalendar />} />
              <Route path="student/notifications" element={<DemoStudentNotifications />} />

              {/* Parent Demo */}
              <Route path="parent" element={<DemoParentOverview />} />
              <Route path="parent/children" element={<DemoParentOverview />} />
              <Route path="parent/children/:childId" element={<DemoChildDashboard />} />
              <Route path="parent/children/:childId/attendance" element={<DemoChildAttendance />} />
              <Route path="parent/children/:childId/assignments" element={<DemoChildAssignments />} />
              <Route path="parent/children/:childId/exams" element={<DemoChildExams />} />
              <Route path="parent/notifications" element={<DemoGenericPage />} />
              <Route path="parent/settings" element={<DemoGenericPage />} />

              {/* Operator Demo */}
              <Route path="operator" element={<DemoOperatorDashboard />} />
              <Route path="operator/periods" element={<DemoOperatorPeriods />} />
              <Route path="operator/classes" element={<DemoOperatorClasses />} />
              <Route path="operator/schedules" element={<DemoOperatorSchedules />} />
              <Route path="operator/reports" element={<DemoOperatorReports />} />
              <Route path="operator/announcements" element={<DemoOperatorAnnouncements />} />
              <Route path="operator/settings" element={<DemoGenericPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
