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
    throw new Error(`Failed to send email: ${error.message}`);
  }
  return data;
};

export const sendCollaborationEmail = async (
  email: string,
  noteTitle: string,
  senderEmail: string,
  inviteLink: string,
) => {
  const { data, error } = await resend.emails.send({
    from: "invite@biruk.site", // Or a dedicated invite address
    to: [email],
    subject: `Invitation to collaborate on: ${noteTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p>${senderEmail} has invited you to collaborate on the note: <strong>${noteTitle}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        </div>
        <p>If you don't recognize this request, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
  return data;
};
