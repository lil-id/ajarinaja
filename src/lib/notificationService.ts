interface NotificationRecipient {
  email: string;
  name: string;
}

interface SendNotificationParams {
  recipients: NotificationRecipient[];
  courseName: string;
  teacherName: string;
  contentType: 'assignment' | 'exam' | 'enrollment';
  contentTitle: string;
  dueDate?: string;
  duration?: number;
  description?: string;
}

/**
 * Sends a course-related notification email via Supabase Edge Function.
 * 
 * @param {SendNotificationParams} params - The notification parameters.
 * @returns {Promise<void>} A promise that resolves when the notification is sent (or logged on error).
 */
export async function sendCourseNotification(params: SendNotificationParams): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-course-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send notification');
    }

    console.log(`Notification emails sent to ${params.recipients.length} recipients`);
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Don't throw - the main action succeeded, email is secondary
  }
}

/**
 * Fetches the list of students enrolled in a specific course.
 * 
 * @param {any} supabase - The Supabase client instance.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<NotificationRecipient[]>} A promise that resolves to an array of recipients (email and name).
 */
export async function getEnrolledStudents(
  supabase: any,
  courseId: string
): Promise<NotificationRecipient[]> {
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      profiles:student_id (
        email,
        name
      )
    `)
    .eq('course_id', courseId);

  if (error) {
    console.error('Failed to fetch enrolled students:', error);
    return [];
  }

  return (enrollments || [])
    .filter((e: any) => e.profiles)
    .map((e: any) => ({
      email: e.profiles.email,
      name: e.profiles.name,
    }));
}
