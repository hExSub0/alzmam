const { Resend } = require("resend");

let resend;
const client = () => {
  if (!process.env.RESEND_API_KEY) throw new Error("Email provider is not configured");
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

const sendEmail = async ({ to, subject, html }) => {
  const { error } = await client().emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  if (error) throw new Error("Email delivery failed");
};

const sendVerificationCode = (to, code) => sendEmail({
  to,
  subject: "Verify your ECO account",
  html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
});

const sendPasswordReset = (to, token) => {
  const url = new URL(process.env.PASSWORD_RESET_URL);
  url.searchParams.set("token", token);
  return sendEmail({
    to,
    subject: "Reset your ECO password",
    html: `<p><a href="${url.toString()}">Reset your password</a></p><p>This link expires in 30 minutes and can only be used once.</p>`,
  });
};

module.exports = { sendVerificationCode, sendPasswordReset };
