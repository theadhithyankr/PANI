import { supabase } from './supabaseClient';

// Helper function to send emails through Supabase Edge Function
export const sendEmail = async ({ from, to, subject, html, text }) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        from,
        to,
        subject,
        html,
        text,
      }
    });

    if (error) {
      console.error('Error calling Edge Function:', error);
      return { success: false, error };
    }

    if (!data.success) {
      console.error('Email function error:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send job posted notification emails
export const sendJobPostedEmail = async ({
  to,
  jobTitle,
  location,
  jobType,
  experienceLevel,
  salaryRange = null,
  jobUrl = null,
  dashboardUrl = null
}) => {
  try {
    const subject = `🎉 Your job "${jobTitle}" has been posted successfully!`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Posted Successfully</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
          .celebration { font-size: 48px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .job-details { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .job-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .job-info { color: #6b7280; margin-bottom: 5px; }
          .highlight { color: #6366f1; font-weight: 600; }
          .cta-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 30px 0; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Velai</div>
            <div class="celebration">🎉</div>
            <h1 class="title">Job Posted Successfully!</h1>
            <p class="subtitle">Your job listing is now live and visible to thousands of talented candidates</p>
          </div>

          <div class="job-details">
            <div class="job-title">${jobTitle}</div>
            <div class="job-info">📍 <span class="highlight">${location || 'Remote'}</span></div>
            <div class="job-info">💼 <span class="highlight">${jobType || 'Not specified'}</span></div>
            <div class="job-info">📊 <span class="highlight">${experienceLevel || 'Not specified'}</span></div>
            ${salaryRange ? `<div class="job-info">💰 <span class="highlight">${salaryRange}</span></div>` : ''}
          </div>

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">What's Next?</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">Manage your job posting and start connecting with candidates</div>
            ${jobUrl ? `<a href="${jobUrl}" class="button">View Job Posting</a>` : ''}
            ${dashboardUrl ? `<a href="${dashboardUrl}" class="button">Go to Dashboard</a>` : ''}
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
🎉 Congratulations! Your job "${jobTitle}" has been posted successfully!

Your job listing is now live and visible to thousands of talented candidates.

Job Details:
- Title: ${jobTitle}
- Location: ${location || 'Remote'}
- Type: ${jobType || 'Not specified'}
- Experience: ${experienceLevel || 'Not specified'}
${salaryRange ? `- Salary: ${salaryRange}` : ''}

What's Next?
- View your job posting: ${jobUrl || 'Available in your dashboard'}
- Go to dashboard: ${dashboardUrl || 'https://app.velai.co/dashboard'}

We'll notify you when new candidates apply and when AI finds highly matched candidates.

Best regards,
The Velai Team
    `;

    return await sendEmail({
      from: 'noreply@velai.eu',
      to,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending job posted email:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send bulk emails
export const sendBulkEmail = async (emails) => {
  try {
    // For bulk emails, we'll send them individually through the Edge Function
    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email))
    );
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    
    const failed = results.filter(result => 
      result.status === 'rejected' || !result.value.success
    );

    return { 
      success: true, 
      data: { 
        successful: successful.length, 
        failed: failed.length,
        results 
      } 
    };
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return { success: false, error: error.message };
  }
}; 