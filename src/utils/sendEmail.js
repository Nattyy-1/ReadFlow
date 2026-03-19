import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // 2. Define the email contents
  const mailOptions = {
    from: '"ReadFlow" <noreply@ReadFlow.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Add html: options.html here later if you want a pretty email
  };

  // 3. Send it
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
