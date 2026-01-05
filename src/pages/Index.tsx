import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BookOpen,
  Users,
  Award,
  ArrowRight,
  GraduationCap,
  BarChart3,
  CheckCircle,
  MessageSquare,
  FileText,
  Shield,
  Clock,
  Zap,
  Eye,
} from "lucide-react";
import heroClassroom from "@/assets/hero-classroom.jpg";
import teacherTeaching from "@/assets/teacher-teaching.jpg";
import studentsStudying from "@/assets/students-studying.jpg";
import studentExam from "@/assets/student-exam.jpg";
import studentsLearning from "@/assets/students-learning.jpg";
import teacherSmartboard from "@/assets/teacher-smartboard.jpg";
import studentOnlineExam from "@/assets/student-online-exam.jpg";
import teacherAnalytics from "@/assets/teacher-analytics.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";

const Index = () => {
  const navigate = useNavigate();

  const handleContactDemo = () => {
    window.open('https://wa.me/6282293675164?text=Halo, saya tertarik untuk demo AjarinAja!', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AjarinAja</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#for-teachers" className="text-muted-foreground hover:text-foreground transition-colors">
              For Teachers
            </a>
            <a href="#for-schools" className="text-muted-foreground hover:text-foreground transition-colors">
              For Schools
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" disabled className="opacity-50 cursor-not-allowed">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                Trusted by 500+ Schools Worldwide
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                Your Complete
                <span className="text-gradient block">Learning Management System</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                AjarinAja is the all-in-one LMS platform for modern educators. Manage courses, create assignments & exams, 
                track student progress, and deliver an exceptional learning experience.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button variant="outline" size="xl" onClick={() => navigate("/demo/teacher")}>
                  <Eye className="w-4 h-4" />
                  Try Demo
                </Button>
                <Button variant="hero" size="xl" onClick={handleContactDemo}>
                  <MessageSquare className="w-4 h-4" />
                  Contact for Full Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Schools</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">100K+</div>
                  <div className="text-sm text-muted-foreground">Lessons Delivered</div>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={studentsLearning}
                  alt="Students engaged in digital learning with laptops in a modern classroom"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              <div
                className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-card animate-fade-in"
                style={{ animationDelay: "300ms" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Assignments Submitted</div>
                    <div className="text-sm text-muted-foreground">2,847 today</div>
                  </div>
                </div>
              </div>
              <div
                className="absolute -top-4 -right-4 bg-card p-4 rounded-2xl shadow-card animate-fade-in"
                style={{ animationDelay: "500ms" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Teachers Online</div>
                    <div className="text-sm text-muted-foreground">342 active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section id="for-teachers" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={teacherSmartboard}
                  alt="Teacher explaining content on digital smartboard to engaged students"
                  className="rounded-2xl shadow-lg w-full h-56 object-cover animate-slide-up col-span-2"
                  style={{ animationDelay: "100ms" }}
                />
                <img
                  src={teacherAnalytics}
                  alt="Teacher reviewing student performance analytics on computer"
                  className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="bg-gradient-hero rounded-2xl p-6 flex flex-col justify-center items-center text-center animate-slide-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <div className="text-4xl font-bold text-primary-foreground">75%</div>
                  <div className="text-sm text-primary-foreground/80">Time Saved on Grading</div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                For Teachers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Everything You Need to Teach Effectively
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Create engaging courses, design comprehensive exams, and track student progress with powerful analytics.
                Spend less time on administration and more time teaching.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: <BookOpen className="w-4 h-4" />, text: "Create unlimited courses with rich content" },
                  { icon: <FileText className="w-4 h-4" />, text: "Design multiple choice & essay exams with rubrics" },
                  { icon: <BarChart3 className="w-4 h-4" />, text: "Auto-grading with detailed performance analytics" },
                  { icon: <Clock className="w-4 h-4" />, text: "Assignment management with deadline tracking" },
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-secondary">
                      {item.icon}
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Button variant="hero" size="lg" onClick={handleContactDemo}>
                <MessageSquare className="w-4 h-4" />
                Contact for Full Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* For Schools Section */}
      <section id="for-schools" className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                For Schools & Institutions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Scale Your Institution with Confidence
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                A comprehensive platform designed to support educational institutions of all sizes. From course
                management to student enrollment, everything you need in one secure place.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">Unlimited</div>
                  <div className="text-sm text-muted-foreground">Courses & Students</div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">Enterprise</div>
                  <div className="text-sm text-muted-foreground">Grade Security</div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">Real-time</div>
                  <div className="text-sm text-muted-foreground">Progress Tracking</div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Support Available</div>
                </div>
              </div>
              <Button variant="outline" size="lg" onClick={handleContactDemo}>
                Contact for Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={heroClassroom}
                alt="Modern classroom environment with students and teacher"
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                style={{ animationDelay: "100ms" }}
              />
              <img
                src={teacherTeaching}
                alt="Teacher actively teaching in classroom"
                className="rounded-2xl shadow-lg w-full h-48 object-cover mt-8 animate-slide-up"
                style={{ animationDelay: "200ms" }}
              />
              <img
                src={studentOnlineExam}
                alt="Student taking online exam on laptop"
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                style={{ animationDelay: "300ms" }}
              />
              <div
                className="bg-gradient-secondary rounded-2xl p-6 flex flex-col justify-center items-center text-center mt-8 animate-slide-up"
                style={{ animationDelay: "400ms" }}
              >
                <div className="text-4xl font-bold text-secondary-foreground">98%</div>
                <div className="text-sm text-secondary-foreground/80">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Education
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to deliver exceptional learning experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Course Management"
              description="Create and organize courses with videos, documents, and learning materials. Students can access content directly in the platform."
              delay={0}
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Comprehensive Exams"
              description="Design multiple choice. multiple select and essay exams with customizable rubrics. Auto-grade MCQ and manually review essays."
              delay={100}
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Advanced Analytics"
              description="Track student performance with detailed reports. Export data to CSV or PDF for institutional reporting."
              delay={200}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Student Enrollment"
              description="Students can browse and enroll in courses. Manage enrollment status and track participation."
              delay={300}
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Assignment Tracking"
              description="Create assignments with deadlines, accept file submissions, and provide feedback with grades."
              delay={400}
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-time Updates"
              description="Students receive instant notifications for new materials, grades, and announcements."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* Student Experience Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src={studentsStudying}
                alt="Students collaborating and studying together"
                className="rounded-3xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-card p-6 rounded-2xl shadow-card">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">4.9/5</div>
                    <div className="text-sm text-muted-foreground">Student Rating</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                A Seamless Experience for Students
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Give your students an intuitive platform where they can discover courses, access learning materials,
                take exams, and track their progress all in one place.
              </p>
              <ul className="space-y-4">
                {[
                  "Browse and enroll in available courses easily",
                  "View videos and materials directly in the platform",
                  "Take exams with a clean, distraction-free interface",
                  "Track grades and progress with visual analytics",
                  "Receive instant notifications for updates",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Loved by Educators Worldwide</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See what teachers and school administrators are saying about AjarinAja
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="AjarinAja has transformed how we manage our LMS. What used to take hours now takes minutes. The auto-grading and assignment tracking alone saves us 10+ hours per week."
              name="Dr. Sarah Mitchell"
              role="Department Head, Westfield Academy"
              avatar={testimonialSarah}
              delay={0}
            />
            <TestimonialCard
              quote="The platform is incredibly intuitive. Our teachers adopted it within days, and students love the clean interface for taking courses and assessments."
              name="Michael Chen"
              role="Principal, Sunrise International School"
              avatar={testimonialJames}
              delay={100}
            />
            <TestimonialCard
              quote="The analytics dashboard gives us insights we never had before. We can now identify struggling students early and provide targeted support."
              name="Emily Rodriguez"
              role="Academic Director, Tech Valley Institute"
              avatar={testimonialEmily}
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about AjarinAja LMS platform
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                What is AjarinAja and who is it for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                AjarinAja is a comprehensive Learning Management System (LMS) designed for schools, educational institutions, 
                and independent educators. It provides tools for course management, assignment creation, exam administration, 
                student progress tracking, and analytics — all in one platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                How does the exam and assignment auto-grading work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Our platform supports multiple choice, multiple answer, and essay-type questions. Multiple choice and 
                multiple answer questions are automatically graded instantly upon submission. For essay questions, teachers 
                can use our rubric-based grading system or provide manual feedback. All scores are automatically recorded 
                and reflected in student analytics.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                Can I upload course materials like PDFs and videos?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Yes! Teachers can upload various types of course materials including PDF documents, videos (via URL or direct upload), 
                and other learning resources. Students can access these materials directly through their course dashboard, 
                and teachers can track which materials have been viewed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                How do I track student performance and identify at-risk students?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Our analytics dashboard provides comprehensive insights including score distributions, submission rates, 
                and performance trends. The platform also includes an "At-Risk Students" feature that automatically 
                identifies students who may need additional support based on factors like missed assignments, low scores, 
                or late submissions — allowing for early intervention.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                Is there a demo I can try before committing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Absolutely! We offer an interactive demo that lets you explore the platform from both teacher and student 
                perspectives. You can try creating courses, assignments, and exams, or experience the student view of 
                taking assessments. Click the "Try Demo" button above to get started, or contact us for a personalized 
                walkthrough of all features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                What kind of support do you provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                We provide dedicated support via WhatsApp for quick assistance, comprehensive documentation, and 
                personalized onboarding for new schools. Our team is committed to ensuring a smooth transition and 
                ongoing success with the platform. Contact us anytime for setup help or training sessions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-hero rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Transform Your School?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join hundreds of schools already using AjarinAja to deliver exceptional education. Start free today, no
                credit card required.
              </p>
              <Button
                variant="heroOutline"
                size="xl"
                onClick={handleContactDemo}
              >
                <MessageSquare className="w-5 h-5" />
                Contact for Full Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">AjarinAja</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete learning management system for modern schools and educators.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#for-teachers" className="hover:text-foreground transition-colors">
                    For Teachers
                  </a>
                </li>
                <li>
                  <a href="#for-schools" className="hover:text-foreground transition-colors">
                    For Schools
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sales
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Partnership
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2024 AjarinAja. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, delay }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border/50"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  delay: number;
}

const TestimonialCard = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ quote, name, role, avatar, delay }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-card rounded-2xl p-8 shadow-card animate-slide-up border border-border/50"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        <p className="text-foreground mb-6 leading-relaxed">"{quote}"</p>
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-sm text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    );
  }
);
TestimonialCard.displayName = "TestimonialCard";

export default Index;
