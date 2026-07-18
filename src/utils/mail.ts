import { Resend } from "resend";
import { env } from "../config/env";
const resend = new Resend(env.RESEND_API_KEY);
export const sendVerificationEmail = async (
  email: string,
  code: string,
  type: "verify" | "password_reset",
) => {
  const isReset = type === "password_reset";
  const title = isReset ? "Reset your password" : "Verify your account";
  const body = isReset
    ? "Use this code to reset your password:"
    : "Use this code to verify your account:";
  const { data, error } = await resend.emails.send({
    from: "verify@biruk.site",
    to: [email],
    subject: "Your Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>${body}</p>
        <h1 style="letter-spacing: 5px; color: #333;">${code}</h1>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Email Error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  return data;
};
