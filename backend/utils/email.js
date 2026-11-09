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
    text: emailMessage.text,
  });

  if (error) {
    throw new Error("Email delivery failed");
  }
};

const createVerificationEmail = (verificationCode) => {
  const safeCode = String(verificationCode).replace(/[^0-9]/g, "");
  const codeCells = safeCode.split("").map((digit) => (
    `<td align="center" valign="middle" style="width:44px;height:54px;border:1px solid #e8dfce;border-radius:9px;background-color:#fbf8f2;color:#202321;font-family:Arial,Tahoma,sans-serif;font-size:25px;font-weight:700;">${digit}</td>`
  )).join("");
  return {
    subject: "رمز التحقق لحسابك في الزمام",
    text: `مرحباً بك في الزمام،\n\nرمز التحقق الخاص بك هو: ${safeCode}\n\nاستخدم هذا الرمز خلال 10 دقائق لإكمال إنشاء حسابك. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.`,
    html: `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>رمز التحقق لحسابك في الزمام</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f3f1;font-family:Arial,Tahoma,sans-serif;color:#222624;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">رمز التحقق الخاص بك في الزمام، صالح لمدة 10 دقائق.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f3f1;padding:42px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e5e1;border-radius:18px;overflow:hidden;">
          <tr><td style="height:5px;background-color:#c49b4a;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:29px 28px 27px;background-color:#202321;">
            <div style="font-size:16px;letter-spacing:5px;font-weight:700;color:#d6b76f;direction:ltr;">ALZMAM</div>
            <div style="margin-top:7px;font-size:12px;letter-spacing:1px;color:#d7d8d4;">الزمام للدعاية والإعلان</div>
          </td></tr>
          <tr><td style="padding:34px 38px 36px;text-align:right;">
            <p style="margin:0 0 10px;font-size:11px;line-height:1.6;font-weight:700;letter-spacing:1px;color:#a78339;">تأكيد الحساب</p>
            <h1 style="margin:0 0 13px;font-size:25px;line-height:1.55;color:#202321;font-weight:700;">أهلاً بك في الزمام</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#666b65;">استخدم رمز التحقق أدناه لتأكيد بريدك الإلكتروني وإكمال إنشاء حسابك.</p>
            <table role="presentation" align="center" dir="ltr" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;border-collapse:separate;border-spacing:6px 0;"><tr>${codeCells}</tr></table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:19px;background-color:#f7f7f4;border-radius:10px;"><tr><td style="padding:13px 15px;text-align:right;font-size:13px;line-height:1.8;color:#686d66;">⏱ صلاحية الرمز <strong style="color:#30342f;">10 دقائق</strong></td></tr></table>
            <p style="margin:0;font-size:12px;line-height:1.9;color:#8a8e88;">إذا لم تطلب إنشاء حساب، فتجاهل هذه الرسالة. لن يتم إنشاء الحساب دون إدخال الرمز.</p>
          </td></tr>
          <tr><td style="padding:17px 28px;border-top:1px solid #eeeeec;background-color:#fcfcfb;text-align:center;font-size:11px;line-height:1.8;color:#9a9d97;">رسالة آلية من الزمام للدعاية والإعلان<br>© الزمام</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
};
const createPasswordResetEmail = (resetUrl) => ({
  subject: "إعادة تعيين كلمة المرور لحسابك في الزمام",
  html: `<div dir="rtl" lang="ar"><p><a href="${resetUrl}">إعادة تعيين كلمة المرور</a></p><p>تنتهي صلاحية هذا الرابط خلال 30 دقيقة، ويمكن استخدامه مرة واحدة فقط.</p></div>`,
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
