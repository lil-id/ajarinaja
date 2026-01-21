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
  
  const contentTypeConfig = {
    assignment: { label: 'Assignment', link: '/student/assignments', color: '#10b981', bgColor: '#ecfdf5' },
    exam: { label: 'Exam', link: '/student/exams', color: '#f59e0b', bgColor: '#fffbeb' },
    enrollment: { label: 'Course', link: '/student/courses', color: '#6366f1', bgColor: '#eef2ff' },
  };
  
  const config = contentTypeConfig[data.contentType];
  
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

  const getHeaderText = () => {
    if (data.contentType === 'enrollment') return 'Course Enrollment';
    if (data.contentType === 'assignment') return 'New Assignment';
    return 'New Exam';
  };

  const getDetailsHtml = () => {
    if (data.contentType === 'enrollment') {
      return `
        <tr>
          <td style="padding: 0 0 24px 0;">
            <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">
              You've been enrolled in <strong style="color: #334155;">${data.courseName}</strong>. 
              Access course materials, assignments, and exams from your dashboard.
            </p>
          </td>
        </tr>
      `;
    }
    
    let detailsRows = '';
    if (data.dueDate) {
      detailsRows += `
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #94a3b8; font-size: 14px; width: 100px; vertical-align: top;">Due Date</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 500;">${formatDate(data.dueDate)}</td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }
    if (data.duration) {
      detailsRows += `
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #94a3b8; font-size: 14px; width: 100px; vertical-align: top;">Duration</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 500;">${data.duration} minutes</td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }
    if (data.description) {
      detailsRows += `
        <tr>
          <td style="padding: 16px 0 0 0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px 0;">Description</p>
            <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">${data.description}</p>
          </td>
        </tr>
      `;
    }
    return detailsRows ? `<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">${detailsRows}</table>` : '';
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${subjectMap[data.contentType]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
          
          <!-- Header Badge -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="background-color: ${config.bgColor}; padding: 12px 20px; border-radius: 8px;">
                    <span style="color: ${config.color}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${getHeaderText()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                
                <!-- Top Accent -->
                <tr>
                  <td style="height: 4px; background-color: ${config.color}; border-radius: 12px 12px 0 0;"></td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      
                      <!-- Greeting -->
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Hello, {{recipientName}}</p>
                        </td>
                      </tr>
                      
                      <!-- Title -->
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0; line-height: 1.3;">
                            ${data.contentType === 'enrollment' ? `Welcome to ${data.courseName}` : data.contentTitle}
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Course Info -->
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" style="border-collapse: collapse;">
                            <tr>
                              <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <span style="color: #64748b; font-size: 13px;">Course: </span>
                                <span style="color: #334155; font-size: 13px; font-weight: 600;">${data.courseName}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Details -->
                      ${getDetailsHtml()}
                      
                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding-top: 8px;">
                          <table role="presentation" style="border-collapse: collapse;">
                            <tr>
                              <td style="background-color: ${config.color}; border-radius: 8px;">
                                <a href="${appUrl}${config.link}" style="display: block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
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
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 16px; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;">
                Sent by <span style="color: #64748b; font-weight: 500;">${data.teacherName}</span>
              </p>
              <p style="color: #cbd5e1; font-size: 12px; margin: 0;">AjarinAja Learning Platform</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
