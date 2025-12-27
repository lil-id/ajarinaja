import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Teacher Pages
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherOverview from "./pages/teacher/Overview";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherExams from "./pages/teacher/Exams";
import TeacherGradeExam from "./pages/teacher/GradeExam";
import TeacherAnalytics from "./pages/teacher/Analytics";
import TeacherStudents from "./pages/teacher/Students";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherSettings from "./pages/teacher/Settings";

// Student Pages
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentExams from "./pages/student/Exams";
import TakeExam from "./pages/student/TakeExam";
import ExamResults from "./pages/student/ExamResults";
import StudentProfile from "./pages/student/Profile";
import StudentSettings from "./pages/student/Settings";

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
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TeacherOverview />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="exams/:examId/grade" element={<TeacherGradeExam />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="students" element={<TeacherStudents />} />
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
              <Route path="exams" element={<StudentExams />} />
              <Route path="exam/:examId" element={<TakeExam />} />
              <Route path="exam/:examId/results" element={<ExamResults />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
