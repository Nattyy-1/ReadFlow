import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const sendEmail = async (options) => {
  const host = config.mail.host;
  const port = Number(config.mail.port);
  const user = config.mail.user;
  const pass = config.mail.password;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: '"ReadFlow" <noreply@ReadFlow.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Add html: options.html here later if you want a pretty email
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
