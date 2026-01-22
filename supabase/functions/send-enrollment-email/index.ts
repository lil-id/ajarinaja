import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Interface for the enrollment email request payload.
 */
interface EnrollmentEmailRequest {
  studentEmail: string;
  studentName: string;
  courseName: string;
  teacherName: string;
}

/**
 * Request handler for the send-enrollment-email edge function.
 * Handles CORS, parses request body, and sends enrollment confirmation via Gmail SMTP.
 * 
 * @param {Request} req - The incoming request.
 * @returns {Promise<Response>} The response object.
 */
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, courseName, teacherName }: EnrollmentEmailRequest = await req.json();

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail credentials not configured");
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    // Get the app URL from environment or use default
    const appUrl = Deno.env.get("APP_URL") || "https://ajarinaja.lovable.app";
    const coursesLink = `${appUrl}/student/courses`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Enrollment Notification</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Course Enrollment</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="font-size: 16px;">Hi <strong>${studentName}</strong>,</p>
    
    <p style="font-size: 16px;">Great news! You have been enrolled in a new course:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${courseName}</h2>
      <p style="margin: 0; color: #666;">Instructor: <strong>${teacherName}</strong></p>
    </div>
    
    <p style="font-size: 16px;">You can now access all course materials, assignments, and exams.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${coursesLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">View My Courses</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">Happy learning! 📚</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This email was sent because you were enrolled in a course on AjarinAja.<br>
      If you have any questions, please contact your instructor.
    </p>
  </div>
</body>
</html>
    `;

    await client.send({
      from: gmailUser,
      to: studentEmail,
      subject: `You've been enrolled in ${courseName}`,
      content: "You have been enrolled in a new course. Please view this email in an HTML-compatible email client.",
      html: htmlContent,
    });

    await client.close();

    console.log("Enrollment email sent successfully to:", studentEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending enrollment email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
