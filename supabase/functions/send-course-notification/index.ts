import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Interface for the notification email request payload.
 */
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

/**
 * Formats a date string into a readable format.
 * @param dateStr - The date string to format.
 * @returns {string|null} The formatted date string or null if input is invalid.
 */
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

/**
 * Generates the HTML content and subject for the notification email.
 * @param data - The notification data.
 * @param recipientName - The name of the recipient.
 * @returns {object} An object containing the email subject and HTML body.
 */
const getEmailContent = (data: NotificationEmailRequest, recipientName: string) => {
  const appUrl = Deno.env.get("APP_URL") || "https://ajarinaja.lovable.app";

  const contentTypeConfig = {
    assignment: { label: 'Assignment', link: '/student/assignments', color: '#10b981', bgColor: '#ecfdf5' },
    exam: { label: 'Exam', link: '/student/exams', color: '#f59e0b', bgColor: '#fffbeb' },
    enrollment: { label: 'Course', link: '/student/courses', color: '#6366f1', bgColor: '#eef2ff' },
  };

  const config = contentTypeConfig[data.contentType];

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

  const title = data.contentType === 'enrollment'
    ? `Welcome to ${data.courseName}`
    : data.contentTitle;

  const enrollmentMessage = `You've been enrolled in <strong style="color:#334155;">${data.courseName}</strong>. Access course materials, assignments, and exams from your dashboard.`;

  let detailsHtml = '';
  if (data.contentType !== 'enrollment') {
    if (data.dueDate) {
      detailsHtml += `
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#94a3b8;font-size:14px;display:inline-block;width:100px;">Due Date</span>
            <span style="color:#1e293b;font-size:14px;font-weight:500;">${formatDate(data.dueDate)}</span>
          </td>
        </tr>`;
    }
    if (data.duration) {
      detailsHtml += `
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#94a3b8;font-size:14px;display:inline-block;width:100px;">Duration</span>
            <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.duration} minutes</span>
          </td>
        </tr>`;
    }
    if (data.description) {
      detailsHtml += `
        <tr>
          <td style="padding:16px 0 0 0;">
            <p style="color:#94a3b8;font-size:13px;margin:0 0 8px 0;">Description</p>
            <p style="color:#475569;font-size:14px;margin:0;line-height:1.6;">${data.description}</p>
          </td>
        </tr>`;
    }
  }

  const detailsSection = data.contentType === 'enrollment'
    ? `<tr><td style="padding:0 0 24px 0;"><p style="color:#64748b;font-size:15px;margin:0;line-height:1.6;">${enrollmentMessage}</p></td></tr>`
    : (detailsHtml ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">${detailsHtml}</table>` : '');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subjectMap[data.contentType]}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
<tr>
<td align="center" style="padding:40px 20px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr>
<td align="center" style="padding-bottom:24px;">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:${config.bgColor};padding:12px 20px;border-radius:8px;">
<span style="color:${config.color};font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${getHeaderText()}</span>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="height:4px;background-color:${config.color};border-radius:12px 12px 0 0;"></td>
</tr>
<tr>
<td style="padding:32px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding-bottom:8px;">
<p style="color:#94a3b8;font-size:14px;margin:0;">Hello, ${recipientName}</p>
</td>
</tr>
<tr>
<td style="padding-bottom:20px;">
<h1 style="color:#0f172a;font-size:22px;font-weight:700;margin:0;line-height:1.3;">${title}</h1>
</td>
</tr>
<tr>
<td style="padding-bottom:20px;">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;">
<span style="color:#64748b;font-size:13px;">Course: </span>
<span style="color:#334155;font-size:13px;font-weight:600;">${data.courseName}</span>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td>${detailsSection}</td>
</tr>
<tr>
<td align="center" style="padding-top:8px;">
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:${config.color};border-radius:8px;">
<a href="${appUrl}${config.link}" style="display:block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">View ${config.label}${data.contentType !== 'enrollment' ? 's' : ''}</a>
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
<tr>
<td style="padding:24px 16px;text-align:center;">
<p style="color:#94a3b8;font-size:13px;margin:0 0 4px 0;">Sent by <span style="color:#64748b;font-weight:500;">${data.teacherName}</span></p>
<p style="color:#cbd5e1;font-size:12px;margin:0;">AjarinAja Learning Platform</p>
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

/**
 * Request handler for the send-course-notification edge function.
 * Handles CORS, validates input, and sends emails via Gmail SMTP.
 * 
 * @param {Request} req - The incoming request.
 * @returns {Promise<Response>} The response object.
 */
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

    // Use raw SMTP instead of denomailer to avoid encoding issues
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    for (const recipient of data.recipients) {
      const { subject, html } = getEmailContent(data, recipient.name);

      // Create MIME message
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`;

      const message = [
        `From: ${gmailUser}`,
        `To: ${recipient.email}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        `Please view this email in an HTML-compatible email client.`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        html,
        ``,
        `--${boundary}--`,
      ].join('\r\n');

      // Connect to Gmail SMTP
      const conn = await Deno.connectTls({
        hostname: "smtp.gmail.com",
        port: 465,
      });

      const read = async (): Promise<string> => {
        const buffer = new Uint8Array(1024);
        const n = await conn.read(buffer);
        return n ? decoder.decode(buffer.subarray(0, n)) : "";
      };

      const write = async (cmd: string): Promise<void> => {
        await conn.write(encoder.encode(cmd + "\r\n"));
      };

      const sendCommand = async (cmd: string): Promise<string> => {
        await write(cmd);
        return await read();
      };

      try {
        // Read greeting
        await read();

        // EHLO
        await sendCommand(`EHLO localhost`);

        // AUTH LOGIN
        await sendCommand(`AUTH LOGIN`);
        await sendCommand(btoa(gmailUser));
        await sendCommand(btoa(gmailPassword));

        // MAIL FROM
        await sendCommand(`MAIL FROM:<${gmailUser}>`);

        // RCPT TO
        await sendCommand(`RCPT TO:<${recipient.email}>`);

        // DATA
        await sendCommand(`DATA`);

        // Send message body
        await write(message);
        await sendCommand(`.`);

        // QUIT
        await sendCommand(`QUIT`);
      } finally {
        conn.close();
      }
    }

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