import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
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
import DemoStudentAnalytics from "./pages/demo/DemoStudentAnalytics";
import DemoStudentCalendar from "./pages/demo/DemoStudentCalendar";
import DemoStudentNotifications from "./pages/demo/DemoStudentNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TeacherOverview />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
              <Route path="exams" element={<TeacherExams />} />
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
              <Route path="courses" element={<StudentCourses />} />
              <Route path="explore" element={<StudentExploreCourses />} />
              <Route path="courses/:courseId" element={<StudentCourseDetail />} />
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
              <Route path="profile" element={<StudentProfile />} />
              <Route path="settings" element={<StudentSettings />} />
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
              <Route path="student/analytics" element={<DemoStudentAnalytics />} />
              <Route path="student/calendar" element={<DemoStudentCalendar />} />
              <Route path="student/notifications" element={<DemoStudentNotifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
