import { createTransport } from "nodemailer";

export const mailTransporter = createTransport({
    // service: 'gmail',
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    }
});

export const registerUserMailTemplate = `<div>
        <h1>Dear {{username}}</h1>
        <p>A new account has been created for you!</p>
        <h2>Thank you!</h2>
        </div>
        `


// utils/emailService.js
export const sendEmail = async (to, subject, html) => {
    try {
        await mailTransporter.sendMail({
            from: `"EduMatch" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};
export const emailTemplates = {
    bookingCreated: (studentName, teacherName, booking) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Booking Request</h2>
            <p>Hello ${teacherName},</p>
            <p>You have received a new booking request from ${studentName}:</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <ul style="padding-left: 20px;">
                ${Array.isArray(booking.day) ?
            `<li><strong>Days:</strong> ${booking.day.join(', ')}</li>` :
            `<li><strong>Day:</strong> ${booking.day}</li>`}
                <li><strong>Time:</strong> ${booking.timeFrom} - ${booking.timeTo}</li>
                <li><strong>Duration:</strong> ${booking.duration}</li>
                <li><strong>Session Type:</strong> ${booking.sessionType}</li>
                ${booking.notes ? `<li><strong>Notes:</strong> ${booking.notes}</li>` : ''}
              </ul>
            </div>
      
            <p>Please log in to your account to respond to this request.</p>
            
            <div style="margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
              <p>Booking ID: ${booking._id}</p>
            </div>
          </div>
        `,

    priceUpdated: (studentName, booking) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Booking Price Updated</h2>
            <p>Hello ${studentName},</p>
            <p>The teacher has proposed the following session details:</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Session Details</h3>
              <ul style="padding-left: 20px;">
                <li><strong>Price:</strong> ${booking.price} ${booking.currency}</li>
                ${Array.isArray(booking.day) ?
            `<li><strong>Days:</strong> ${booking.day.join(', ')}</li>` :
            `<li><strong>Day:</strong> ${booking.day}</li>`}
                <li><strong>Time:</strong> ${booking.timeFrom} - ${booking.timeTo}</li>
                <li><strong>Duration:</strong> ${booking.duration}</li>
              </ul>
            </div>
      
            <p>Please log in to confirm or reject this booking.</p>
            
            <div style="margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
              <p>Booking ID: ${booking._id}</p>
            </div>
          </div>
        `,

    bookingConfirmed: (teacherName, booking) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27ae60;">Booking Confirmed</h2>
            <p>Hello ${teacherName},</p>
            <p>Your session with ${booking.studentName} has been confirmed!</p>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Confirmed Session</h3>
              <ul style="padding-left: 20px;">
                <li><strong>Student:</strong> ${booking.studentName}</li>
                <li><strong>Price:</strong> ${booking.price} ${booking.currency}</li>
                ${Array.isArray(booking.day) ?
            `<li><strong>Days:</strong> ${booking.day.join(', ')}</li>` :
            `<li><strong>Day:</strong> ${booking.day}</li>`}
                <li><strong>Time:</strong> ${booking.timeFrom} - ${booking.timeTo}</li>
                <li><strong>Duration:</strong> ${booking.duration}</li>
              </ul>
            </div>
      
            <p style="font-weight: bold;">Please prepare for the session accordingly.</p>
            
            <div style="margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
              <p>Booking ID: ${booking._id}</p>
              <p>Student Contact: ${booking.studentEmail}</p>
            </div>
          </div>
        `
};