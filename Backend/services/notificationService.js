import Notification from '../models/Notification.js';
import sendSMS from './smsService.js';
import sendEmail from './emailService.js';

/**
 * Creates a Dashboard Notification in MongoDB and dispatches external SMS/Email
 * after the database write has safely committed.
 */
export const notifyUser = async ({
  userId,
  type = 'system',
  title,
  message,
  bookingId,
  sendSms = false,
  sendEmail: shouldSendEmail = false,
  toPhone,
  toEmail,
  smsText,
  emailSubject,
  emailText,
  emailHtml
}) => {
  try {
    // 1. Create Dashboard Notification record in DB
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      bookingId,
      read: false,
      smsStatus: sendSms && toPhone ? 'pending' : 'not_sent',
      emailStatus: shouldSendEmail && toEmail ? 'pending' : 'not_sent'
    });

    // 2. Post-Transaction / Post-Write Asynchronous Dispatch
    // Dispatches external SMS/Email outside the DB write so provider failure NEVER affects the booking transaction
    setImmediate(async () => {
      try {
        let updated = false;

        if (sendSms && toPhone && smsText) {
          const smsResult = await sendSMS(toPhone, smsText);
          notification.smsStatus = smsResult.success ? 'sent' : 'failed';
          if (!smsResult.success) notification.smsError = smsResult.error || 'SMS send failed';
          updated = true;
        }

        if (shouldSendEmail && toEmail && emailSubject && emailText) {
          const emailResult = await sendEmail({
            to: toEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml
          });
          notification.emailStatus = emailResult.success ? 'sent' : 'failed';
          if (!emailResult.success) notification.emailError = emailResult.error || 'Email send failed';
          updated = true;
        }

        if (updated) {
          await notification.save();
        }
      } catch (dispatchErr) {
        console.error('[Notification Dispatch Error]:', dispatchErr.message);
      }
    });

    return notification;
  } catch (err) {
    console.error('[Notification Creation Error]:', err.message);
    // Never throw to prevent breaking upstream booking operations
    return null;
  }
};

export default notifyUser;
