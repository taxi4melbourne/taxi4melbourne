import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: email,
      subject: subject,
      html: message,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
