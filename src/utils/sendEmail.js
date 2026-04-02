import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT);
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
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
