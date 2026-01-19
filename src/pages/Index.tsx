import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollReveal, StaggeredReveal } from "@/components/ScrollReveal";
import { useParallax } from "@/hooks/useScrollAnimation";
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
  TrendingUp,
  Bell,
  FolderOpen,
  AlertTriangle,
  Calendar,
  PieChart,
  Building2,
  Lock,
  Headphones,
  Globe,
  Database,
  ClipboardCheck,
} from "lucide-react";
import heroClassroom from "@/assets/hero-classroom.jpg";
import teacherTeaching from "@/assets/teacher-teaching.jpg";
import studentsStudying from "@/assets/students-studying.jpg";
import studentExam from "@/assets/student-exam.jpg";
import studentsLearning from "@/assets/hero-university.jpg";
import teacherSmartboard from "@/assets/teacher-smartboard.jpg";
import studentOnlineExam from "@/assets/student-online-exam.jpg";
import teacherAnalytics from "@/assets/teacher-analytics.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <button
              onClick={() => navigate("/courses")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Courses
            </button>
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
                <div 
                  className="w-full h-[400px] md:h-[500px]"
                  style={{ 
                    transform: `translateY(${scrollY * 0.15}px) scale(${1 + scrollY * 0.0002})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  <img
                    src={studentsLearning}
                    alt="Modern university campus with students walking on pathways at golden hour"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
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
      <section id="for-teachers" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <ScrollReveal animation="fade-up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              For Teachers
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Empower Your Teaching Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline your workflow, save hours on administrative tasks, and focus on what matters most—inspiring your students.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Course Builder",
                description: "Create engaging courses with videos, PDFs, and rich content. Organize materials by modules.",
                color: "bg-blue-500/10 text-blue-600",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Smart Exam Creator",
                description: "Build MCQ, multiple-select & essay exams. Reuse questions from your question bank.",
                color: "bg-purple-500/10 text-purple-600",
              },
              {
                icon: <ClipboardCheck className="w-6 h-6" />,
                title: "Auto-Grading",
                description: "MCQ exams grade instantly. Save hours with automatic score calculation and feedback.",
                color: "bg-green-500/10 text-green-600",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Performance Analytics",
                description: "Track class averages, identify struggling students, and export detailed reports.",
                color: "bg-orange-500/10 text-orange-600",
              },
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                title: "At-Risk Detection",
                description: "Get alerts when students miss deadlines or score below KKM. Intervene early.",
                color: "bg-red-500/10 text-red-600",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Schedule Management",
                description: "Visual calendar for exams and assignments. Never miss an important deadline.",
                color: "bg-cyan-500/10 text-cyan-600",
              },
            ].map((feature, index) => (
              <ScrollReveal
                key={index}
                animation="fade-up"
                delay={index * 100}
              >
                <div className="bg-card rounded-2xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <img
                src={teacherSmartboard}
                alt="Teacher explaining content on digital smartboard"
                className="rounded-3xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-2xl shadow-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">75%</div>
                    <div className="text-xs text-muted-foreground">Time Saved on Grading</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Why Teachers Love AjarinAja</h3>
              <ul className="space-y-4 mb-6">
                {[
                  "Reusable question bank saves hours of exam creation",
                  "Rubric-based grading ensures fair, consistent scoring",
                  "Bulk import questions from existing documents",
                  "Student progress tracking with exportable reports",
                  "Announcement system keeps students informed",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
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
      <section id="for-schools" className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <ScrollReveal animation="fade-up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Schools & Institutions
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Enterprise-Ready Education Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A secure, scalable solution designed for educational institutions of all sizes—from small tutoring centers to large universities.
            </p>
          </ScrollReveal>

          {/* Key Benefits Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: <Users className="w-6 h-6" />, value: "Unlimited", label: "Students & Teachers" },
              { icon: <BookOpen className="w-6 h-6" />, value: "Unlimited", label: "Courses & Materials" },
              { icon: <Lock className="w-6 h-6" />, value: "Enterprise", label: "Grade Security" },
              { icon: <Headphones className="w-6 h-6" />, value: "24/7", label: "Priority Support" },
            ].map((stat, index) => (
              <ScrollReveal
                key={index}
                animation="scale"
                delay={index * 100}
              >
                <div className="bg-card rounded-2xl p-6 border border-border text-center h-full">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mx-auto mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Features for Institutions */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Complete Institution Management</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: <FolderOpen className="w-5 h-5" />,
                    title: "Centralized Content Library",
                    description: "Store all learning materials in one secure location accessible to authorized teachers and students.",
                  },
                  {
                    icon: <PieChart className="w-5 h-5" />,
                    title: "Institution-Wide Analytics",
                    description: "Track performance across all courses, identify trends, and generate comprehensive reports for stakeholders.",
                  },
                  {
                    icon: <Bell className="w-5 h-5" />,
                    title: "Automated Notifications",
                    description: "Keep everyone informed with automated alerts for deadlines, grades, and announcements.",
                  },
                  {
                    icon: <Database className="w-5 h-5" />,
                    title: "Academic Period Management",
                    description: "Organize courses by semester, generate report cards, and maintain academic records.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={heroClassroom}
                alt="Modern classroom environment"
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
              />
              <img
                src={teacherTeaching}
                alt="Teacher actively teaching"
                className="rounded-2xl shadow-lg w-full h-48 object-cover mt-8 animate-slide-up"
                style={{ animationDelay: "100ms" }}
              />
              <img
                src={studentOnlineExam}
                alt="Student taking online exam"
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                style={{ animationDelay: "200ms" }}
              />
              <div
                className="bg-gradient-secondary rounded-2xl p-6 flex flex-col justify-center items-center text-center mt-8 animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                <div className="text-4xl font-bold text-secondary-foreground">98%</div>
                <div className="text-sm text-secondary-foreground/80">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* CTA for Schools */}
          <div className="bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Institution?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join 500+ schools already using AjarinAja. Get a personalized demo and see how we can help your institution thrive.
            </p>
            <Button variant="hero" size="lg" onClick={handleContactDemo}>
              <MessageSquare className="w-4 h-4" />
              Schedule Institution Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <ScrollReveal animation="fade-up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Platform Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed to streamline education—from content creation to performance tracking.
            </p>
          </ScrollReveal>

          {/* Main Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Large Feature Card */}
            <div className="lg:col-span-2 bg-card rounded-3xl p-8 border border-border/50 shadow-card">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Comprehensive Course Management</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Build rich, engaging courses with multiple content types. Upload videos, PDFs, and documents. 
                    Students access materials directly in-platform with our built-in viewer—no downloads required.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Video Support", "PDF Viewer", "YouTube Embed", "Organized Modules"].map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Smaller Feature Card */}
            <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-card">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Flexible Exam Builder</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Create MCQ, multiple-select, and essay questions. Set time limits, schedule exams, and configure auto-grading with KKM thresholds.
              </p>
              <ul className="space-y-2">
                {["Question Bank", "Rubric Grading", "Time Limits"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<BarChart3 className="w-7 h-7" />}
              title="Analytics Dashboard"
              description="Visual charts showing class performance, grade distributions, and student progress over time."
              delay={0}
            />
            <FeatureCard
              icon={<AlertTriangle className="w-7 h-7" />}
              title="At-Risk Alerts"
              description="Automatic detection of struggling students based on missed deadlines and low scores."
              delay={100}
            />
            <FeatureCard
              icon={<Calendar className="w-7 h-7" />}
              title="Smart Calendar"
              description="Unified view of all exams, assignments, and events. Never miss an important deadline."
              delay={200}
            />
            <FeatureCard
              icon={<Bell className="w-7 h-7" />}
              title="Instant Notifications"
              description="Real-time alerts for new grades, materials, announcements, and upcoming deadlines."
              delay={300}
            />
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <FeatureCard
              icon={<Award className="w-7 h-7" />}
              title="Badges & Gamification"
              description="Motivate students with achievement badges for excellent performance and milestones."
              delay={400}
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-7 h-7" />}
              title="Report Cards"
              description="Generate comprehensive semester report cards with grades, averages, and teacher notes."
              delay={500}
            />
            <FeatureCard
              icon={<Globe className="w-7 h-7" />}
              title="Multi-Language Support"
              description="Full interface available in English and Indonesian with easy language switching."
              delay={600}
            />
          </div>
        </div>
      </section>

      {/* Student Experience Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal animation="fade-right">
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
            </ScrollReveal>
            <ScrollReveal animation="fade-left" delay={200}>
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
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Loved by Educators Worldwide</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See what teachers and school administrators are saying about AjarinAja
            </p>
          </ScrollReveal>

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
          <ScrollReveal animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about AjarinAja LMS platform
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
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
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal animation="scale">
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
          </ScrollReveal>
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

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <ScrollReveal animation="fade-up" delay={delay}>
      <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50 h-full">
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </ScrollReveal>
  );
};

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  delay: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, role, avatar, delay }) => {
  return (
    <ScrollReveal animation="fade-up" delay={delay}>
      <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 h-full">
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
    </ScrollReveal>
  );
};

export default Index;
