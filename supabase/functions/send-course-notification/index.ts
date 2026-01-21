import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  recipients: Array<{
    email: string;
    name: string;
  }>;
  courseName: string;
  teacherName: string;
  contentType: 'assignment' | 'exam' | 'enrollment';
  contentTitle: string;
  dueDate?: string;
  duration?: number;
  description?: string;
}

const getEmailContent = (data: NotificationEmailRequest) => {
  const appUrl = Deno.env.get("APP_URL") || "https://ajarinaja.lovable.app";
  
  const contentTypeLabels = {
    assignment: { label: 'Assignment', icon: '📝', link: '/student/assignments', color: '#10b981' },
    exam: { label: 'Exam', icon: '📋', link: '/student/exams', color: '#f59e0b' },
    enrollment: { label: 'Course', icon: '🎓', link: '/student/courses', color: '#6366f1' },
  };
  
  const config = contentTypeLabels[data.contentType];
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const subjectMap = {
    assignment: `New Assignment: ${data.contentTitle}`,
    exam: `New Exam: ${data.contentTitle}`,
    enrollment: `Welcome to ${data.courseName}!`,
  };

  const getDetailsHtml = () => {
    if (data.contentType === 'enrollment') {
      return `
        <p style="color: #64748b; font-size: 15px; margin: 0 0 20px 0;">
          You've been enrolled in <strong>${data.courseName}</strong>. 
          Access course materials, assignments, and exams from your dashboard.
        </p>
      `;
    }
    
    let details = '';
    if (data.dueDate) {
      details += `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #94a3b8; width: 100px;">Due Date</span>
          <span style="color: #1e293b; font-weight: 500;">${formatDate(data.dueDate)}</span>
        </div>
      `;
    }
    if (data.duration) {
      details += `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #94a3b8; width: 100px;">Duration</span>
          <span style="color: #1e293b; font-weight: 500;">${data.duration} minutes</span>
        </div>
      `;
    }
    if (data.description) {
      details += `
        <div style="margin-top: 16px;">
          <span style="color: #94a3b8; display: block; margin-bottom: 8px;">Description</span>
          <p style="color: #475569; margin: 0; line-height: 1.6;">${data.description}</p>
        </div>
      `;
    }
    return details;
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectMap[data.contentType]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
          
          <!-- Logo & Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 16px 24px; border-radius: 16px;">
                <span style="font-size: 28px;">${config.icon}</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
              
              <!-- Accent Bar -->
              <div style="height: 4px; background: linear-gradient(90deg, ${config.color} 0%, ${config.color}88 100%); border-radius: 16px 16px 0 0;"></div>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 32px 32px 24px;">
                    
                    <!-- Greeting -->
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                      Hello, {{recipientName}}
                    </p>
                    
                    <!-- Title -->
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.3;">
                      ${data.contentType === 'enrollment' ? `Welcome to ${data.courseName}` : data.contentTitle}
                    </h1>
                    
                    <!-- Course Badge -->
                    <div style="display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; margin-bottom: 20px;">
                      <span style="color: #64748b; font-size: 13px;">Course: </span>
                      <span style="color: #334155; font-weight: 600; font-size: 13px;">${data.courseName}</span>
                    </div>
                    
                    <!-- Details -->
                    ${getDetailsHtml()}
                    
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 0 32px 32px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <a href="${appUrl}${config.link}" 
                             style="display: inline-block; background: ${config.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; transition: all 0.2s;">
                            View ${config.label}${data.contentType !== 'enrollment' ? 's' : ''}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 16px; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px 0;">
                Sent by <strong style="color: #64748b;">${data.teacherName}</strong>
              </p>
              <p style="color: #cbd5e1; font-size: 12px; margin: 0;">
                AjarinAja Learning Platform
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    subject: subjectMap[data.contentType],
    html,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationEmailRequest = await req.json();

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

    const { subject, html } = getEmailContent(data);
    
    // Send to all recipients
    for (const recipient of data.recipients) {
      const personalizedHtml = html.replace(/\{\{recipientName\}\}/g, recipient.name);
      
      await client.send({
        from: gmailUser,
        to: recipient.email,
        subject,
        content: "Please view this email in an HTML-compatible email client.",
        html: personalizedHtml,
      });
      
      console.log(`Notification email sent to: ${recipient.email}`);
    }

    await client.close();

    return new Response(JSON.stringify({ success: true, sent: data.recipients.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
