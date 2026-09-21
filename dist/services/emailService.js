import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
let transporter = null;
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: "ethereal.user@ethereal.email",
            pass: "ethereal.pass",
        },
    });
};
export const sendOtpEmail = async (toEmail, otp) => {
    try {
        if (!transporter) {
            transporter = createTransporter();
        }
        const fromAddress = process.env.SMTP_FROM || `"HOB Platform" <no-reply@hyperlocal.app>`;
        const mailOptions = {
            from: fromAddress,
            to: toEmail,
            subject: `Your HOB Verification Code: ${otp}`,
            text: `Welcome to HOB Hyperlocal P2P Platform.\n\nYour 6-digit verification OTP is: ${otp}\nThis code will expire in 10 minutes.\n\nDo not share this OTP with anyone.`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 24px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #18181b; border: 2px solid #facc15; padding: 12px 18px; border-radius: 16px; margin-bottom: 12px;">
              <span style="font-size: 20px; font-weight: 900; color: #facc15; letter-spacing: -0.5px;">HOB<span style="color: #ffffff;">.</span></span>
            </div>
            <h2 style="font-size: 22px; font-weight: 900; color: #18181b; margin: 0 0 6px 0;">Verify Your Email</h2>
            <p style="font-size: 14px; color: #71717a; margin: 0;">Hyperlocal Peer-to-Peer Micro-Tasking Platform</p>
          </div>
          
          <div style="background: #fefce8; border: 1.5px solid #fef08a; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit OTP</span>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #18181b; margin: 12px 0;">
              ${otp}
            </div>
            <span style="font-size: 12px; color: #a1a1aa;">Valid for 10 minutes</span>
          </div>

          <p style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0 0 16px 0;">
            Use this code to complete your login or registration on HOB. If you didn't request this code, you can safely ignore this email.
          </p>

          <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; text-align: center;">
            <p style="font-size: 11px; color: #a1a1aa; margin: 0;">
              &copy; ${new Date().getFullYear()} HOB Technologies. All rights reserved.
            </p>
          </div>
        </div>
      `,
        };
        console.log(`[EmailService] Sending OTP ${otp} to ${toEmail}`);
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            await transporter.sendMail(mailOptions);
        }
        return true;
    }
    catch (error) {
        console.error("[EmailService] Error sending email:", error);
        return false;
    }
};
