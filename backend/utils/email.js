const { Resend } = require("resend");

let resendClient;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email provider is not configured");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const sendEmail = async (emailMessage) => {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: emailMessage.to,
    subject: emailMessage.subject,
    html: emailMessage.html,
  });

  if (error) {
    throw new Error("Email delivery failed");
  }
};

const createVerificationEmail = (verificationCode) => ({
  subject: "Verify your ECO account",
  html: `<p>Your verification code is <strong>${verificationCode}</strong>.</p><p>It expires in 10 minutes.</p>`,
});

const createPasswordResetEmail = (resetUrl) => ({
  subject: "Reset your ECO password",
  html: `<p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes and can only be used once.</p>`,
});

const sendVerificationCode = async (recipientEmail, verificationCode) => {
  const verificationEmail = createVerificationEmail(verificationCode);
  await sendEmail({
    to: recipientEmail,
    ...verificationEmail,
  });
};

const sendPasswordReset = async (recipientEmail, resetToken) => {
  const resetUrl = new URL(process.env.PASSWORD_RESET_URL);
  resetUrl.searchParams.set("token", resetToken);

  const resetEmail = createPasswordResetEmail(resetUrl.toString());
  await sendEmail({
    to: recipientEmail,
    ...resetEmail,
  });
};

module.exports = {
  sendVerificationCode,
  sendPasswordReset,
};
