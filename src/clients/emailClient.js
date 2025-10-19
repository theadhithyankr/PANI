/**
 * EmailJS Client for Pani Platform
 * Handles email sending using EmailJS service
 */

import emailjs from '@emailjs/browser';

class EmailClient {
  constructor() {
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    
    if (!this.serviceId || !this.templateId || !this.publicKey) {
      console.warn('EmailJS configuration incomplete. Please check your environment variables.');
    }

    // Initialize EmailJS with public key
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  /**
   * Send an email using EmailJS
   * @param {Object} templateParams - Parameters for the email template
   * @returns {Promise<Object>} - EmailJS response
   */
  async sendEmail(templateParams) {
    if (!this.isConfigured()) {
      throw new Error('EmailJS not properly configured. Please check your environment variables.');
    }

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );

      return {
        success: true,
        message: 'Email sent successfully',
        response
      };
    } catch (error) {
      console.error('EmailJS Error:', error);
      throw new Error(`Failed to send email: ${error.text || error.message}`);
    }
  }

  /**
   * Send welcome email to new users
   * @param {Object} userData - User data
   */
  async sendWelcomeEmail(userData) {
    const templateParams = {
      to_name: userData.name || userData.email,
      to_email: userData.email,
      user_type: userData.type || 'user',
      platform_name: 'Pani',
      login_url: window.location.origin + '/login',
      support_email: 'support@pani.com'
    };

    return this.sendEmail(templateParams);
  }

  /**
   * Send password reset email
   * @param {Object} resetData - Reset data
   */
  async sendPasswordResetEmail(resetData) {
    const templateParams = {
      to_name: resetData.name || resetData.email,
      to_email: resetData.email,
      reset_link: resetData.resetLink,
      platform_name: 'Pani',
      expiry_time: '24 hours'
    };

    return this.sendEmail(templateParams);
  }

  /**
   * Send job application notification
   * @param {Object} applicationData - Application data
   */
  async sendJobApplicationNotification(applicationData) {
    const templateParams = {
      to_name: applicationData.employerName,
      to_email: applicationData.employerEmail,
      candidate_name: applicationData.candidateName,
      job_title: applicationData.jobTitle,
      application_date: new Date().toLocaleDateString(),
      view_application_url: `${window.location.origin}/employer/applications/${applicationData.applicationId}`,
      platform_name: 'Pani'
    };

    return this.sendEmail(templateParams);
  }

  /**
   * Send interview invitation
   * @param {Object} interviewData - Interview data
   */
  async sendInterviewInvitation(interviewData) {
    const templateParams = {
      to_name: interviewData.candidateName,
      to_email: interviewData.candidateEmail,
      job_title: interviewData.jobTitle,
      company_name: interviewData.companyName,
      interview_date: interviewData.interviewDate,
      interview_time: interviewData.interviewTime,
      interview_link: interviewData.interviewLink,
      platform_name: 'Pani'
    };

    return this.sendEmail(templateParams);
  }

  /**
   * Send general notification email
   * @param {Object} notificationData - Notification data
   */
  async sendNotificationEmail(notificationData) {
    const templateParams = {
      to_name: notificationData.recipientName,
      to_email: notificationData.recipientEmail,
      subject: notificationData.subject,
      message: notificationData.message,
      platform_name: 'Pani',
      ...notificationData.additionalParams
    };

    return this.sendEmail(templateParams);
  }

  /**
   * Check if EmailJS is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.serviceId && this.templateId && this.publicKey);
  }

  /**
   * Get configuration status
   * @returns {Object}
   */
  getConfigStatus() {
    return {
      serviceId: !!this.serviceId,
      templateId: !!this.templateId,
      publicKey: !!this.publicKey,
      isConfigured: this.isConfigured()
    };
  }
}

// Export singleton instance
export const emailClient = new EmailClient();
export default emailClient;