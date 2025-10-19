import { useState, useCallback } from 'react';
import { sendEmail, sendJobPostedEmail } from '../../clients/resendClient';

// Email templates
const emailTemplates = {
  jobPosted: {
    subject: (data) => `🎉 Your job "${data.jobTitle}" has been posted successfully!`,
    html: (data) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Posted Successfully</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
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
            <div class="job-title">${data.jobTitle}</div>
            <div class="job-info">📍 <span class="highlight">${data.location || 'Remote'}</span></div>
            <div class="job-info">💼 <span class="highlight">${data.jobType || 'Not specified'}</span></div>
            <div class="job-info">📊 <span class="highlight">${data.experienceLevel || 'Not specified'}</span></div>
            ${data.salaryRange ? `<div class="job-info">💰 <span class="highlight">${data.salaryRange}</span></div>` : ''}
          </div>

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">What's Next?</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">Manage your job posting and start connecting with candidates</div>
            <a href="${data.jobUrl || '#'}" class="button">View Job Posting</a>
            <a href="${data.dashboardUrl || '#'}" class="button">Go to Dashboard</a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
🎉 Congratulations! Your job "${data.jobTitle}" has been posted successfully!

Your job listing is now live and visible to thousands of talented candidates.

Job Details:
- Title: ${data.jobTitle}
- Location: ${data.location || 'Remote'}
- Type: ${data.jobType || 'Not specified'}
- Experience: ${data.experienceLevel || 'Not specified'}
${data.salaryRange ? `- Salary: ${data.salaryRange}` : ''}

What's Next?
- View your job posting: ${data.jobUrl || 'Available in your dashboard'}
- Go to dashboard: ${data.dashboardUrl || 'https://app.velai.co/dashboard'}

We'll notify you when new candidates apply and when AI finds highly matched candidates.

Best regards,
The Velai Team
    `
  },

  accountCreated: {
    subject: (data) => `🎉 Welcome to Velai! Your account has been created successfully`,
    html: (data) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Velai</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
          .welcome { font-size: 48px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .account-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .info-item { color: #6b7280; margin-bottom: 5px; }
          .highlight { color: #6366f1; font-weight: 600; }
          .cta-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 30px 0; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Velai</div>
            <div class="welcome">🎉</div>
            <h1 class="title">Welcome to Velai!</h1>
            <p class="subtitle">Your account has been created successfully. You're now part of the future of recruitment!</p>
          </div>

          <div class="account-info">
            <div class="info-item">👤 <span class="highlight">Name:</span> ${data.fullName || 'User'}</div>
            <div class="info-item">📧 <span class="highlight">Email:</span> ${data.email}</div>
            <div class="info-item">🏢 <span class="highlight">Account Type:</span> ${data.accountType === 'employer' ? 'Employer' : 'Candidate'}</div>
            <div class="info-item">📅 <span class="highlight">Created:</span> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Get Started</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">Complete your profile and start your journey with Velai</div>
            <a href="${data.dashboardUrl || 'https://app.velai.co/dashboard'}" class="button">Go to Dashboard</a>
            <a href="${data.profileUrl || 'https://app.velai.co/profile'}" class="button">Complete Profile</a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
🎉 Welcome to Velai! Your account has been created successfully.

You're now part of the future of recruitment!

Account Details:
- Name: ${data.fullName || 'User'}
- Email: ${data.email}
- Account Type: ${data.accountType === 'employer' ? 'Employer' : 'Candidate'}
- Created: ${new Date().toLocaleDateString()}

Get Started:
- Go to Dashboard: ${data.dashboardUrl || 'https://app.velai.co/dashboard'}
- Complete Profile: ${data.profileUrl || 'https://app.velai.co/profile'}

Welcome aboard!
The Velai Team
    `
  },

  onboardingCompleted: {
    subject: (data) => `🎯 Congratulations! Your ${data.accountType === 'employer' ? 'Company' : 'Professional'} Profile is Complete`,
    html: (data) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Onboarding Complete</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
          .celebration { font-size: 48px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .profile-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .info-item { color: #6b7280; margin-bottom: 5px; }
          .highlight { color: #6366f1; font-weight: 600; }
          .cta-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 30px 0; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Velai</div>
            <div class="celebration">🎯</div>
            <h1 class="title">Onboarding Complete!</h1>
            <p class="subtitle">Your ${data.accountType === 'employer' ? 'company profile' : 'professional profile'} is now complete and ready to go!</p>
          </div>

          <div class="profile-info">
            <div class="info-item">👤 <span class="highlight">Name:</span> ${data.fullName || 'User'}</div>
            <div class="info-item">🏢 <span class="highlight">Type:</span> ${data.accountType === 'employer' ? 'Employer' : 'Candidate'}</div>
            ${data.accountType === 'employer' ? `<div class="info-item">🏢 <span class="highlight">Company:</span> ${data.companyName || 'Not specified'}</div>` : ''}
            ${data.accountType === 'candidate' ? `<div class="info-item">💼 <span class="highlight">Profession:</span> ${data.profession || 'Not specified'}</div>` : ''}
            <div class="info-item">📅 <span class="highlight">Completed:</span> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">What's Next?</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">
              ${data.accountType === 'employer' 
                ? 'Start posting jobs and finding amazing candidates!' 
                : 'Start exploring jobs and connecting with employers!'}
            </div>
            <a href="${data.dashboardUrl || 'https://app.velai.co/dashboard'}" class="button">Go to Dashboard</a>
            ${data.accountType === 'employer' 
              ? '<a href="https://app.velai.co/jobs/create" class="button">Post a Job</a>' 
              : '<a href="https://app.velai.co/jobs" class="button">Browse Jobs</a>'}
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Need help?</strong> Contact our support team at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
🎯 Congratulations! Your ${data.accountType === 'employer' ? 'Company' : 'Professional'} Profile is Complete

Your ${data.accountType === 'employer' ? 'company profile' : 'professional profile'} is now complete and ready to go!

Profile Details:
- Name: ${data.fullName || 'User'}
- Type: ${data.accountType === 'employer' ? 'Employer' : 'Candidate'}
${data.accountType === 'employer' ? `- Company: ${data.companyName || 'Not specified'}` : ''}
${data.accountType === 'candidate' ? `- Profession: ${data.profession || 'Not specified'}` : ''}
- Completed: ${new Date().toLocaleDateString()}

What's Next?
${data.accountType === 'employer' 
  ? 'Start posting jobs and finding amazing candidates!' 
  : 'Start exploring jobs and connecting with employers!'}

- Go to Dashboard: ${data.dashboardUrl || 'https://app.velai.co/dashboard'}
${data.accountType === 'employer' 
  ? '- Post a Job: https://app.velai.co/jobs/create' 
  : '- Browse Jobs: https://app.velai.co/jobs'}

You're all set!
The Velai Team
    `
  },

  interviewScheduled: {
    subject: (data) => `📅 Interview Scheduled: ${data.jobTitle} - ${data.interviewDate}`,
    html: (data) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Scheduled</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
          .calendar { font-size: 48px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .interview-details { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .detail-item { color: #6b7280; margin-bottom: 8px; }
          .highlight { color: #6366f1; font-weight: 600; }
          .cta-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 30px 0; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
          .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; }
          .reminder-title { font-weight: 600; color: #92400e; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Velai</div>
            <div class="calendar">📅</div>
            <h1 class="title">Interview Scheduled!</h1>
            <p class="subtitle">Your interview for ${data.jobTitle} has been scheduled successfully</p>
          </div>

          <div class="interview-details">
            <div class="detail-item">💼 <span class="highlight">Position:</span> ${data.jobTitle}</div>
            <div class="detail-item">🏢 <span class="highlight">Company:</span> ${data.companyName}</div>
            <div class="detail-item">👤 <span class="highlight">${data.recipientType === 'candidate' ? 'Interviewer' : 'Candidate'}:</span> ${data.recipientType === 'candidate' ? data.interviewerName : data.candidateName}</div>
            <div class="detail-item">📅 <span class="highlight">Date:</span> ${data.interviewDate}</div>
            <div class="detail-item">🕐 <span class="highlight">Time:</span> ${data.interviewTime}</div>
            <div class="detail-item">📍 <span class="highlight">Location:</span> ${data.interviewLocation || 'To be confirmed'}</div>
            ${data.interviewType ? `<div class="detail-item">💻 <span class="highlight">Type:</span> ${data.interviewType}</div>` : ''}
            ${data.interviewDuration ? `<div class="detail-item">⏱️ <span class="highlight">Duration:</span> ${data.interviewDuration}</div>` : ''}
          </div>

          <div class="reminder">
            <div class="reminder-title">📝 Important Reminders:</div>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Please arrive 5-10 minutes early</li>
              <li>Bring a copy of your resume and portfolio</li>
              <li>Prepare questions for the interviewer</li>
              <li>Test your video/audio if it's a virtual interview</li>
            </ul>
          </div>

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Interview Details</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">View complete interview information and prepare for success</div>
            <a href="${data.interviewUrl || 'https://app.velai.co/interviews'}" class="button">View Interview Details</a>
            <a href="${data.jobUrl || 'https://app.velai.co/jobs'}" class="button">View Job Details</a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Need to reschedule?</strong> Contact ${data.recipientType === 'candidate' ? 'the employer' : 'the candidate'} or our support team</p>
            <p><strong>Questions?</strong> Contact us at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
📅 Interview Scheduled: ${data.jobTitle} - ${data.interviewDate}

Your interview has been scheduled successfully!

Interview Details:
- Position: ${data.jobTitle}
- Company: ${data.companyName}
- ${data.recipientType === 'candidate' ? 'Interviewer' : 'Candidate'}: ${data.recipientType === 'candidate' ? data.interviewerName : data.candidateName}
- Date: ${data.interviewDate}
- Time: ${data.interviewTime}
- Location: ${data.interviewLocation || 'To be confirmed'}
${data.interviewType ? `- Type: ${data.interviewType}` : ''}
${data.interviewDuration ? `- Duration: ${data.interviewDuration}` : ''}

Important Reminders:
• Please arrive 5-10 minutes early
• Bring a copy of your resume and portfolio
• Prepare questions for the interviewer
• Test your video/audio if it's a virtual interview

Interview Details: ${data.interviewUrl || 'https://app.velai.co/interviews'}
Job Details: ${data.jobUrl || 'https://app.velai.co/jobs'}

Need to reschedule? Contact ${data.recipientType === 'candidate' ? 'the employer' : 'the candidate'} or our support team.

Good luck with your interview!
The Velai Team
    `
  },

  messageReceived: {
    subject: (data) => `💬 New message from ${data.senderName} - ${data.jobTitle || 'Velai'}`,
    html: (data) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Message Received</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
          .message { font-size: 48px; margin-bottom: 20px; }
          .title { color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .message-preview { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .message-text { color: #1f2937; font-style: italic; font-size: 16px; line-height: 1.6; }
          .job-context { background: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; }
          .context-title { font-weight: 600; color: #01579b; margin-bottom: 10px; }
          .context-item { color: #01579b; margin-bottom: 5px; }
          .cta-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 30px 0; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Velai</div>
            <div class="message">💬</div>
            <h1 class="title">New Message Received!</h1>
            <p class="subtitle">You have a new message from ${data.senderName}</p>
          </div>

          <div class="message-preview">
            <div class="message-text">"${data.messagePreview}"</div>
          </div>

          ${data.jobTitle ? `
          <div class="job-context">
            <div class="context-title">📋 Job Context:</div>
            <div class="context-item">💼 <strong>Position:</strong> ${data.jobTitle}</div>
            ${data.companyName ? `<div class="context-item">🏢 <strong>Company:</strong> ${data.companyName}</div>` : ''}
            ${data.applicationStatus ? `<div class="context-item">📊 <strong>Application Status:</strong> ${data.applicationStatus}</div>` : ''}
          </div>
          ` : ''}

          <div class="cta-section">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Reply Now</div>
            <div style="opacity: 0.9; margin-bottom: 20px;">Don't keep them waiting - respond to continue the conversation</div>
            <a href="${data.conversationUrl || 'https://app.velai.co/messages'}" class="button">View Conversation</a>
            <a href="${data.dashboardUrl || 'https://app.velai.co/dashboard'}" class="button">Go to Dashboard</a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Quick Tip:</strong> Responding quickly improves your chances of moving forward in the hiring process!</p>
            <p><strong>Questions?</strong> Contact us at <a href="mailto:support@velai.co">support@velai.co</a></p>
            <p>© 2024 Velai. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
💬 New message from ${data.senderName}

You have received a new message:

"${data.messagePreview}"

${data.jobTitle ? `
Job Context:
- Position: ${data.jobTitle}
${data.companyName ? `- Company: ${data.companyName}` : ''}
${data.applicationStatus ? `- Application Status: ${data.applicationStatus}` : ''}
` : ''}

Reply now to continue the conversation:
${data.conversationUrl || 'https://app.velai.co/messages'}

Quick Tip: Responding quickly improves your chances of moving forward in the hiring process!

Best regards,
The Velai Team
    `
  }
};

const useEmailNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendNotificationEmail = useCallback(async ({
    templateKey,
    to,
    from = 'noreply@velai.eu',
    data = {},
    customSubject = null,
    customHtml = null,
    customText = null
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const template = emailTemplates[templateKey];
      
      if (!template && !customHtml) {
        throw new Error(`Email template '${templateKey}' not found and no custom template provided`);
      }

      // Use custom templates if provided, otherwise use predefined template
      const subject = customSubject || (template?.subject ? template.subject(data) : `Notification from Velai`);
      const html = customHtml || (template?.html ? template.html(data) : null);
      const text = customText || (template?.text ? template.text(data) : null);

      const emailPayload = {
        from,
        to,
        subject,
        html,
        text
      };

      console.log('Sending email notification:', {
        templateKey,
        to,
        from,
        subject: subject.substring(0, 50) + '...'
      });

      const result = await sendEmail(emailPayload);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send email');
      }

      console.log('Email notification sent successfully:', result.data);
      return { success: true, data: result.data };

    } catch (err) {
      const errorMessage = err.message || 'Failed to send email notification';
      setError(errorMessage);
      console.error('Email notification error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Specific method for job posted notifications
  const sendJobPostedNotification = useCallback(async ({
    to,
    jobData,
    urls = {}
  }) => {
    // Use the new frontend function for job posted emails
    return await sendJobPostedEmail({
      to,
      jobTitle: jobData.title,
      location: jobData.location,
      jobType: jobData.job_type,
      experienceLevel: jobData.experience_level,
      salaryRange: jobData.salary_range ? 
        `${jobData.salary_range.currency} ${jobData.salary_range.min || ''} - ${jobData.salary_range.max || ''}`.trim() : 
        null,
      jobUrl: urls.jobUrl,
      dashboardUrl: urls.dashboardUrl || '/dashboard/jobs'
    });
  }, []);

  // Method for account creation notifications
  const sendAccountCreatedNotification = useCallback(async ({
    to,
    fullName,
    accountType,
    dashboardUrl = 'https://app.velai.co/dashboard',
    profileUrl = 'https://app.velai.co/profile'
  }) => {
    return await sendNotificationEmail({
      templateKey: 'accountCreated',
      to,
      data: {
        fullName,
        email: to,
        accountType,
        dashboardUrl,
        profileUrl
      }
    });
  }, [sendNotificationEmail]);

  // Method for onboarding completion notifications
  const sendOnboardingCompletedNotification = useCallback(async ({
    to,
    fullName,
    accountType,
    companyName = null,
    profession = null,
    dashboardUrl = 'https://app.velai.co/dashboard'
  }) => {
    return await sendNotificationEmail({
      templateKey: 'onboardingCompleted',
      to,
      data: {
        fullName,
        accountType,
        companyName,
        profession,
        dashboardUrl
      }
    });
  }, [sendNotificationEmail]);

  // Method for interview scheduling notifications
  const sendInterviewScheduledNotification = useCallback(async ({
    to,
    recipientType, // 'candidate' or 'employer'
    jobTitle,
    companyName,
    candidateName,
    interviewerName,
    interviewDate,
    interviewTime,
    interviewLocation = null,
    interviewType = null,
    interviewDuration = null,
    interviewUrl = 'https://app.velai.co/interviews',
    jobUrl = 'https://app.velai.co/jobs'
  }) => {
    return await sendNotificationEmail({
      templateKey: 'interviewScheduled',
      to,
      data: {
        recipientType,
        jobTitle,
        companyName,
        candidateName,
        interviewerName,
        interviewDate,
        interviewTime,
        interviewLocation,
        interviewType,
        interviewDuration,
        interviewUrl,
        jobUrl
      }
    });
  }, [sendNotificationEmail]);

  // Method for message received notifications
  const sendMessageReceivedNotification = useCallback(async ({
    to,
    senderName,
    messagePreview,
    jobTitle = null,
    companyName = null,
    applicationStatus = null,
    conversationUrl = 'https://app.velai.co/messages',
    dashboardUrl = 'https://app.velai.co/dashboard'
  }) => {
    return await sendNotificationEmail({
      templateKey: 'messageReceived',
      to,
      data: {
        senderName,
        messagePreview,
        jobTitle,
        companyName,
        applicationStatus,
        conversationUrl,
        dashboardUrl
      }
    });
  }, [sendNotificationEmail]);

  // Method to get available templates
  const getAvailableTemplates = useCallback(() => {
    return Object.keys(emailTemplates);
  }, []);

  return {
    sendNotificationEmail,
    sendJobPostedNotification,
    sendAccountCreatedNotification,
    sendOnboardingCompletedNotification,
    sendInterviewScheduledNotification,
    sendMessageReceivedNotification, // Added new method
    getAvailableTemplates,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

export default useEmailNotifications; 