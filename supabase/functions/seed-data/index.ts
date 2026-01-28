import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, { inserted: number; skipped: number; errors: string[] }> = {};

    // Helper function to check and insert data
    async function seedTable<T extends Record<string, unknown>>(
      tableName: string,
      data: T[],
      uniqueFields: (keyof T)[]
    ) {
      results[tableName] = { inserted: 0, skipped: 0, errors: [] };

      for (const item of data) {
        try {
          // Build query to check for existing record
          let query = supabase.from(tableName).select("id");
          
          for (const field of uniqueFields) {
            query = query.eq(field as string, item[field]);
          }

          const { data: existing, error: checkError } = await query.maybeSingle();

          if (checkError) {
            results[tableName].errors.push(`Check error: ${checkError.message}`);
            continue;
          }

          if (existing) {
            results[tableName].skipped++;
            continue;
          }

          // Insert new record
          const { error: insertError } = await supabase.from(tableName).insert(item);

          if (insertError) {
            results[tableName].errors.push(`Insert error: ${insertError.message}`);
          } else {
            results[tableName].inserted++;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          results[tableName].errors.push(`Exception: ${errorMessage}`);
        }
      }
    }

    // ============== SEED BADGES ==============
    const badgesData = [
      { name: "Perfect Score", description: "Achieved 100% on an exam", icon: "trophy", color: "gold", is_preset: true },
      { name: "Fast Learner", description: "Completed course materials quickly", icon: "zap", color: "blue", is_preset: true },
      { name: "Consistent Performer", description: "Maintained high grades throughout", icon: "trending-up", color: "green", is_preset: true },
      { name: "Early Bird", description: "Submitted assignments before deadline", icon: "clock", color: "purple", is_preset: true },
      { name: "Team Player", description: "Excellent collaboration skills", icon: "users", color: "orange", is_preset: true },
      { name: "Creative Thinker", description: "Outstanding creative solutions", icon: "lightbulb", color: "yellow", is_preset: true },
      { name: "Problem Solver", description: "Excellent problem-solving abilities", icon: "puzzle", color: "red", is_preset: true },
      { name: "Knowledge Seeker", description: "Actively participates in learning", icon: "book-open", color: "teal", is_preset: true },
    ];

    await seedTable("badges", badgesData, ["name", "is_preset"]);

    // ============== SEED SAMPLE COURSES (for demo/testing) ==============
    // Note: These require a valid teacher_id, so we'll check if any teachers exist first
    const { data: teachers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher")
      .limit(1);

    if (teachers && teachers.length > 0) {
      const teacherId = teachers[0].user_id;

      const coursesData = [
        {
          id: "00000000-0000-0000-0000-000000000001",
          teacher_id: teacherId,
          title: "Introduction to Computer Science",
          description: "Learn the fundamentals of programming and computational thinking. This course covers basic algorithms, data structures, and problem-solving techniques.",
          status: "published",
        },
        {
          id: "00000000-0000-0000-0000-000000000002",
          teacher_id: teacherId,
          title: "Advanced Mathematics",
          description: "Explore calculus, linear algebra, and differential equations. Perfect for students pursuing STEM careers.",
          status: "published",
        },
        {
          id: "00000000-0000-0000-0000-000000000003",
          teacher_id: teacherId,
          title: "Data Science Fundamentals",
          description: "Introduction to data analysis, visualization, and machine learning basics using Python.",
          status: "published",
        },
        {
          id: "00000000-0000-0000-0000-000000000004",
          teacher_id: teacherId,
          title: "Web Development Bootcamp",
          description: "Full-stack web development from HTML/CSS to React and Node.js.",
          status: "draft",
        },
      ];

      await seedTable("courses", coursesData, ["id"]);

      // ============== SEED SAMPLE EXAMS ==============
      const examsData = [
        {
          id: "00000000-0000-0000-0000-000000000101",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Midterm Exam - Programming Basics",
          description: "Test your knowledge of programming fundamentals",
          duration: 60,
          total_points: 100,
          status: "published",
          kkm: 70,
        },
        {
          id: "00000000-0000-0000-0000-000000000102",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Quiz 1 - Variables and Data Types",
          description: "Quick quiz on basic programming concepts",
          duration: 30,
          total_points: 50,
          status: "published",
          kkm: 60,
        },
        {
          id: "00000000-0000-0000-0000-000000000103",
          course_id: "00000000-0000-0000-0000-000000000003",
          title: "Data Science Assessment",
          description: "Comprehensive assessment covering data analysis techniques",
          duration: 90,
          total_points: 150,
          status: "published",
          kkm: 75,
        },
      ];

      await seedTable("exams", examsData, ["id"]);

      // ============== SEED SAMPLE QUESTIONS ==============
      const questionsData = [
        {
          id: "00000000-0000-0000-0000-000000000201",
          exam_id: "00000000-0000-0000-0000-000000000101",
          question: "What is the time complexity of binary search?",
          type: "multiple-choice",
          options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
          correct_answer: 1,
          points: 10,
          order_index: 0,
        },
        {
          id: "00000000-0000-0000-0000-000000000202",
          exam_id: "00000000-0000-0000-0000-000000000101",
          question: "Which data structure uses LIFO principle?",
          type: "multiple-choice",
          options: ["Queue", "Stack", "Array", "Linked List"],
          correct_answer: 1,
          points: 10,
          order_index: 1,
        },
        {
          id: "00000000-0000-0000-0000-000000000203",
          exam_id: "00000000-0000-0000-0000-000000000101",
          question: "Explain the difference between a compiler and an interpreter. Provide examples of languages that use each.",
          type: "essay",
          points: 20,
          order_index: 2,
        },
        {
          id: "00000000-0000-0000-0000-000000000204",
          exam_id: "00000000-0000-0000-0000-000000000102",
          question: "Which of the following is not a primitive data type in most programming languages?",
          type: "multiple-choice",
          options: ["Integer", "Boolean", "Array", "Float"],
          correct_answer: 2,
          points: 10,
          order_index: 0,
        },
        {
          id: "00000000-0000-0000-0000-000000000205",
          exam_id: "00000000-0000-0000-0000-000000000103",
          question: "Which Python library is primarily used for data manipulation?",
          type: "multiple-choice",
          options: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"],
          correct_answer: 1,
          points: 15,
          order_index: 0,
        },
        {
          id: "00000000-0000-0000-0000-000000000206",
          exam_id: "00000000-0000-0000-0000-000000000103",
          question: "Describe the steps involved in a typical data science project lifecycle.",
          type: "essay",
          points: 30,
          order_index: 1,
        },
      ];

      await seedTable("questions", questionsData, ["id"]);

      // ============== SEED SAMPLE ASSIGNMENTS ==============
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const assignmentsData = [
        {
          id: "00000000-0000-0000-0000-000000000301",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Programming Assignment 1 - Hello World",
          description: "Write your first program in any programming language",
          instructions: "Create a program that outputs 'Hello World' and your name. Submit the source code file.",
          due_date: nextWeek.toISOString(),
          max_points: 100,
          status: "published",
          assignment_type: "submission",
          kkm: 70,
        },
        {
          id: "00000000-0000-0000-0000-000000000302",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Algorithm Analysis Essay",
          description: "Write an essay about algorithm complexity",
          instructions: "Explain Big O notation and provide examples of different time complexities. Minimum 500 words.",
          due_date: nextMonth.toISOString(),
          max_points: 100,
          status: "published",
          assignment_type: "submission",
          kkm: 70,
        },
        {
          id: "00000000-0000-0000-0000-000000000303",
          course_id: "00000000-0000-0000-0000-000000000003",
          title: "Data Visualization Quiz",
          description: "Quiz on data visualization concepts",
          due_date: nextWeek.toISOString(),
          max_points: 50,
          status: "published",
          assignment_type: "questions",
          kkm: 60,
        },
      ];

      await seedTable("assignments", assignmentsData, ["id"]);

      // ============== SEED SAMPLE COURSE MATERIALS ==============
      const materialsData = [
        {
          id: "00000000-0000-0000-0000-000000000401",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Introduction to Programming",
          description: "Basic concepts of programming including variables, loops, and functions.",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
          id: "00000000-0000-0000-0000-000000000402",
          course_id: "00000000-0000-0000-0000-000000000001",
          title: "Data Structures Overview",
          description: "Learn about arrays, linked lists, stacks, and queues.",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
          id: "00000000-0000-0000-0000-000000000403",
          course_id: "00000000-0000-0000-0000-000000000003",
          title: "Python for Data Science",
          description: "Getting started with Python and essential libraries.",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ];

      await seedTable("course_materials", materialsData, ["id"]);

      // ============== SEED SAMPLE ACADEMIC PERIODS ==============
      const currentYear = new Date().getFullYear();
      const academicPeriodsData = [
        {
          id: "00000000-0000-0000-0000-000000000501",
          name: `Semester 1 ${currentYear}/${currentYear + 1}`,
          academic_year: `${currentYear}/${currentYear + 1}`,
          semester: 1,
          start_date: `${currentYear}-08-01`,
          end_date: `${currentYear}-12-31`,
          is_active: true,
          created_by: teacherId,
        },
        {
          id: "00000000-0000-0000-0000-000000000502",
          name: `Semester 2 ${currentYear}/${currentYear + 1}`,
          academic_year: `${currentYear}/${currentYear + 1}`,
          semester: 2,
          start_date: `${currentYear + 1}-01-01`,
          end_date: `${currentYear + 1}-06-30`,
          is_active: false,
          created_by: teacherId,
        },
      ];

      await seedTable("academic_periods", academicPeriodsData, ["id"]);

      // ============== SEED QUESTION BANK ==============
      const questionBankData = [
        {
          id: "00000000-0000-0000-0000-000000000601",
          teacher_id: teacherId,
          question: "What is the output of 2 + 2 in most programming languages?",
          type: "multiple_choice",
          options: ["3", "4", "22", "Error"],
          correct_answer: 1,
          points: 5,
          category: "Programming Basics",
          tags: ["arithmetic", "basics"],
        },
        {
          id: "00000000-0000-0000-0000-000000000602",
          teacher_id: teacherId,
          question: "Which of the following are valid variable names? (Select all that apply)",
          type: "multiple_select",
          options: ["myVar", "123abc", "_private", "my-var"],
          correct_answers: [0, 2],
          points: 10,
          category: "Programming Basics",
          tags: ["variables", "naming conventions"],
        },
        {
          id: "00000000-0000-0000-0000-000000000603",
          teacher_id: teacherId,
          question: "Explain the concept of Object-Oriented Programming and its four main principles.",
          type: "essay",
          points: 25,
          category: "OOP Concepts",
          tags: ["oop", "theory"],
        },
      ];

      await seedTable("question_bank", questionBankData, ["id"]);
    } else {
      results["info"] = { inserted: 0, skipped: 0, errors: ["No teachers found. Please create a teacher account first to seed course-related data."] };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Seeding completed",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
