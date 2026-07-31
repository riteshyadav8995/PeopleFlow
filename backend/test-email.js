require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Error verifying transporter:");
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
    
    // Now try to send a mail
    transporter.sendMail({
      from: `"Test" <${process.env.SMTP_FROM_EMAIL}>`,
      to: "ritesh.kumar@nxtwave.co.in",
      subject: "Test from PeopleFlow",
      text: "This is a test email."
    }, (err, info) => {
      if (err) {
        console.log("Error sending email:", err);
      } else {
        console.log("Email sent successfully!", info.messageId);
      }
    });
  }
});
