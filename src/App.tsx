import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Teacher Pages
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherOverview from "./pages/teacher/Overview";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherExams from "./pages/teacher/Exams";
import TeacherStudents from "./pages/teacher/Students";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherSettings from "./pages/teacher/Settings";

// Student Pages
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentExams from "./pages/student/Exams";
import TakeExam from "./pages/student/TakeExam";
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
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherOverview />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="profile" element={<TeacherProfile />} />
              <Route path="settings" element={<TeacherSettings />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="exams" element={<StudentExams />} />
              <Route path="exam/:examId" element={<TakeExam />} />
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
