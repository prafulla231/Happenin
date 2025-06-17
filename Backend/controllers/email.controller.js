import nodemailer from 'nodemailer';
import { User } from '../models/Users.js'
import dotenv from 'dotenv';

import {Event} from '../models/Event.js';
import {jsPDF} from 'jspdf';


dotenv.config();
// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "MISSING");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  },
  tls: {
    rejectUnauthorized: false // Ignores self-signed certificate errors
  }
});



export const sendTicketEmail = async (req, res) => {
  try {
    const { userId, eventId, userEmail, userName, sendPDF = true, sendDetails = true } = req.body;

    // Validate required fields
    if (!userId || !eventId || !userEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, eventId, userEmail' 
      });
    }

    // Fetch event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Fetch user details if userName not provided
    let finalUserName = userName;
    if (!finalUserName) {
      const user = await User.findById(userId);
      finalUserName = user ? user.name : 'Guest';
    }

    // Generate email content
    const emailSubject = `🎉 Registration Confirmed: ${event.title}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>You're all set for an amazing event!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${finalUserName}!</h2>
            <p>Great news! Your registration for <strong>${event.title}</strong> has been confirmed.</p>
            
            <div class="event-details">
              <h3>📅 Event Details</h3>
              <div class="detail-row">
                <span class="label">Event:</span> ${event.title}
              </div>
              <div class="detail-row">
                <span class="label">Description:</span> ${event.description}
              </div>
              <div class="detail-row">
                <span class="label">Date:</span> ${new Date(event.date).toDateString()}
              </div>
              <div class="detail-row">
                <span class="label">Time:</span> ${event.timeSlot}
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span> ${event.duration}
              </div>
              <div class="detail-row">
                <span class="label">Location:</span> ${event.location}
              </div>
              <div class="detail-row">
                <span class="label">Category:</span> ${event.category || 'General'}
              </div>
              <div class="detail-row">
                <span class="label">Entry Fee:</span> ₹${event.price}
              </div>
              ${event.artist ? `<div class="detail-row"><span class="label">Artist:</span> ${event.artist}</div>` : ''}
              ${event.organization ? `<div class="detail-row"><span class="label">Organized by:</span> ${event.organization}</div>` : ''}
            </div>
            
            <h3>📋 Important Information</h3>
            <ul>
              <li>Please arrive at least 15 minutes before the event starts</li>
              <li>Bring a valid ID for verification</li>
              <li>This email serves as your confirmation</li>
              ${sendPDF ? '<li>Your ticket PDF is attached to this email</li>' : ''}
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <div class="footer">
              <p>Thank you for choosing our events!</p>
              <p>This is an automated email. Please do not reply.</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: emailSubject,
      html: htmlContent,
      attachments: []
    };

 
    if (sendPDF) {
      try {
        
        const doc = new jsPDF();
        
        // Generate PDF
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // Header
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 60, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('EVENT TICKET', pageWidth / 2, 30, { align: 'center' });

        // Content
        doc.setTextColor(0, 0, 0);
        let yPos = 80;
        const details = [
          ['Event Name:', event.title],
          ['Date:', new Date(event.date).toDateString()],
          ['Time:', event.timeSlot],
          ['Location:', event.location],
          ['Ticket Holder:', finalUserName]
        ];

        details.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(label, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 70, yPos);
          yPos += 15;
        });

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        
        mailOptions.attachments.push({
          filename: `ticket-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
     
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Ticket email sent successfully',
      emailId: info.messageId
    });

  } catch (error) {
    console.error('Error sending ticket email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket email',
      error: error.message
    });
  }
};

export const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, htmlContent, textContent, attachments } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      emailId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

