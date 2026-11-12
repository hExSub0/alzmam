const AppError = require("./AppError");

const sendEmail = async (emailMessage) => {
  const apiKey = process.env.SENDLIBERTY_API_KEY;
  if (!apiKey) {
    throw new AppError(503, "خدمة البريد الإلكتروني غير مهيأة. حاول مرة أخرى لاحقًا.", "EMAIL_DELIVERY_FAILED");
  }

  const requestBody = {
    to: emailMessage.to,
    subject: emailMessage.subject,
    html: emailMessage.html,
    text: emailMessage.text,
  };
  if (process.env.SENDLIBERTY_FROM) {
    requestBody.from = process.env.SENDLIBERTY_FROM;
  }

  let response;
  try {
    response = await fetch("https://sendliberty.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "email_delivery_failed",
      name: error.name || "Error",
      code: error.code || null,
      message: error.message || null,
    }));
    throw new AppError(503, "تعذر إرسال البريد الإلكتروني الآن. حاول مرة أخرى بعد قليل.", "EMAIL_DELIVERY_FAILED");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const providerMessage = result.message || result.error?.message || (typeof result.error === "string" ? result.error : null);
    console.error(JSON.stringify({
      event: "email_delivery_failed",
      provider: "sendliberty",
      statusCode: response.status,
      code: result.code || result.error?.code || null,
      message: typeof providerMessage === "string" ? providerMessage.slice(0, 300) : null,
    }));
    throw new AppError(503, "تعذر إرسال البريد الإلكتروني الآن. تحقق من إعدادات Sendliberty وحاول مرة أخرى.", "EMAIL_DELIVERY_FAILED");
  }
};

const createVerificationEmail = (verificationCode) => {
  const safeCode = String(verificationCode).replace(/[^0-9]/g, "");
  return {
    subject: "رمز التحقق لحسابك في زمام الجودة",
    text: `مرحباً بك في زمام الجودة،\n\nرمز التحقق الخاص بك هو: ${safeCode}\n\nاستخدم هذا الرمز خلال 10 دقائق لإكمال إنشاء حسابك. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.`,
    html: `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>رمز التحقق لحسابك في زمام الجودة</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f3f1;font-family:Arial,Tahoma,sans-serif;color:#222624;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">رمز التحقق الخاص بك في زمام الجودة، صالح لمدة 10 دقائق.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f3f1;padding:42px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e5e1;border-radius:18px;overflow:hidden;">
          <tr><td style="height:5px;background-color:#c49b4a;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:29px 28px 27px;background-color:#202321;">
            <div style="font-size:16px;letter-spacing:5px;font-weight:700;color:#d6b76f;direction:ltr;">ALZMAM</div>
            <div style="margin-top:7px;font-size:12px;letter-spacing:1px;color:#d7d8d4;">زمام الجودة للدعاية والإعلان</div>
          </td></tr>
          <tr><td style="padding:34px 38px 36px;text-align:right;">
            <p style="margin:0 0 10px;font-size:11px;line-height:1.6;font-weight:700;letter-spacing:1px;color:#a78339;">تأكيد الحساب</p>
            <h1 style="margin:0 0 13px;font-size:25px;line-height:1.55;color:#202321;font-weight:700;">أهلاً بك في زمام الجودة</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#666b65;">استخدم رمز التحقق أدناه لتأكيد بريدك الإلكتروني وإكمال إنشاء حسابك.</p>
            <div dir="ltr" style="width:max-content;min-width:210px;margin:0 auto 24px;padding:14px 22px;border:1px solid #e8dfce;border-radius:12px;background-color:#fbf8f2;color:#202321;font-family:Arial,Tahoma,sans-serif;font-size:28px;font-weight:700;letter-spacing:6px;text-align:center;">${safeCode}</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:19px;background-color:#f7f7f4;border-radius:10px;"><tr><td style="padding:13px 15px;text-align:right;font-size:13px;line-height:1.8;color:#686d66;">⏱ صلاحية الرمز <strong style="color:#30342f;">10 دقائق</strong></td></tr></table>
            <p style="margin:0;font-size:12px;line-height:1.9;color:#8a8e88;">إذا لم تطلب إنشاء حساب، فتجاهل هذه الرسالة. لن يتم إنشاء الحساب دون إدخال الرمز.</p>
          </td></tr>
          <tr><td style="padding:17px 28px;border-top:1px solid #eeeeec;background-color:#fcfcfb;text-align:center;font-size:11px;line-height:1.8;color:#9a9d97;">رسالة آلية من زمام الجودة للدعاية والإعلان<br>© زمام الجودة</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
};
const createPasswordResetEmail = (resetUrl) => ({
  subject: "إعادة تعيين كلمة المرور لحسابك في زمام الجودة",
  text: `تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في زمام الجودة. استخدم الرابط التالي خلال 30 دقيقة لإعداد كلمة مرور جديدة:\n${resetUrl}\n\nإذا لم تطلب إعادة التعيين، فتجاهل هذه الرسالة.`,
  html: `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>إعادة تعيين كلمة المرور</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f3f1;font-family:Arial,Tahoma,sans-serif;color:#222624;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">رابط آمن لإعادة تعيين كلمة المرور، صالح لمدة 30 دقيقة.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f3f1;padding:42px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e5e1;border-radius:18px;overflow:hidden;">
          <tr><td style="height:5px;background-color:#c49b4a;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:29px 28px 27px;background-color:#202321;">
            <div style="font-size:16px;letter-spacing:5px;font-weight:700;color:#d6b76f;direction:ltr;">ALZMAM</div>
            <div style="margin-top:7px;font-size:12px;letter-spacing:1px;color:#d7d8d4;">زمام الجودة للدعاية والإعلان</div>
          </td></tr>
          <tr><td style="padding:34px 38px 38px;text-align:right;">
            <p style="margin:0 0 10px;font-size:11px;line-height:1.6;font-weight:700;letter-spacing:1px;color:#a78339;">أمان الحساب</p>
            <h1 style="margin:0 0 13px;font-size:25px;line-height:1.55;color:#202321;font-weight:700;">إعادة تعيين كلمة المرور</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#666b65;">تلقينا طلبًا لإعداد كلمة مرور جديدة لحسابك. اضغط على الزر أدناه لإكمال العملية.</p>
            <div style="margin:0 0 24px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;border-radius:10px;background-color:#202321;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#686d66;">تنتهي صلاحية الرابط خلال <strong style="color:#30342f;">30 دقيقة</strong>، ويمكن استخدامه مرة واحدة فقط.</p>
            <p style="margin:0;font-size:12px;line-height:1.9;color:#8a8e88;">إذا لم تطلب إعادة التعيين، فتجاهل هذه الرسالة. لن تتغير كلمة مرورك دون فتح الرابط.</p>
          </td></tr>
          <tr><td style="padding:17px 28px;border-top:1px solid #eeeeec;background-color:#fcfcfb;text-align:center;font-size:11px;line-height:1.8;color:#9a9d97;">رسالة آلية من زمام الجودة للدعاية والإعلان<br>© زمام الجودة</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
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
