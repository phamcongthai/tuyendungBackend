import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config(); // load .env

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.BACKEND_URL}/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject: "Xác thực email của bạn",
    html: `
      <p>Xin chào,</p>
      <p>Vui lòng nhấn vào link dưới đây để xác thực email:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Link này sẽ hết hạn sau 1 giờ.</p>
    `,
  });
}
