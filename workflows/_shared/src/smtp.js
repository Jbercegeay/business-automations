import nodemailer from "nodemailer";

export class SmtpClient {
  constructor(config) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }

  async sendMessage({ to, subject, text, from }) {
    return this.transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
  }
}
