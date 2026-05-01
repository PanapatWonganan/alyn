import { Resend } from "resend";

/**
 * Email service wrapper for Alyn platform.
 *
 * - If `RESEND_API_KEY` is set, emails are sent via the Resend SDK.
 * - If not, emails are logged to the console with an `[EMAIL MOCK]` prefix
 *   so the app can run in dev without configuring Resend.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  id: string;
  success: boolean;
}

const BRAND_NAME = "อลิน";
const BRAND_COLOR = "#CB8A7C";
const BRAND_COLOR_DARK = "#9D5E55";
const BRAND_BG = "#FFF4F1";
const BRAND_TEXT = "#2D1B18";

function getFromAddress(): string {
  return (
    process.env.ALYN_EMAIL_FROM ||
    (process.env.RESEND_API_KEY
      ? "onboarding@resend.dev"
      : "Alyn <noreply@alyn.co>")
  );
}

let cachedResend: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedResend) {
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResend();

  if (!resend) {
    const preview = html.length > 500 ? `${html.slice(0, 500)}...` : html;
    console.log(
      `\n[EMAIL MOCK] ------------------------------\n` +
        `[EMAIL MOCK] To:      ${to}\n` +
        `[EMAIL MOCK] From:    ${getFromAddress()}\n` +
        `[EMAIL MOCK] Subject: ${subject}\n` +
        `[EMAIL MOCK] HTML preview:\n${preview}\n` +
        `[EMAIL MOCK] ------------------------------\n`
    );
    return { id: `mock-${Date.now()}`, success: true };
  }

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { id: "", success: false };
    }

    return { id: result.data?.id || "", success: true };
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return { id: "", success: false };
  }
}

// ---------- Templates ----------

function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_BG};font-family:'Noto Sans Thai',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND_TEXT};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(205,138,124,0.12);">
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;font-weight:700;">${BRAND_NAME}</h1>
              <p style="margin:4px 0 0;color:#FFF4F1;font-size:13px;">แพลตฟอร์มนิยายออนไลน์คุณภาพ</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND_BG};padding:20px 32px;text-align:center;font-size:12px;color:${BRAND_COLOR_DARK};">
              <p style="margin:0;">© ${new Date().getFullYear()} Alyn (อลิน) — แพลตฟอร์มนิยายออนไลน์</p>
              <p style="margin:4px 0 0;">อีเมลฉบับนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(url: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:${BRAND_COLOR};">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName: string
): Promise<SendEmailResult> {
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEXT};font-size:22px;">รีเซ็ตรหัสผ่านของคุณ</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${escapeHtml(userName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี Alyn ของคุณ คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
    ${buttonHtml(resetUrl, "รีเซ็ตรหัสผ่าน")}
    <p style="margin:16px 0;font-size:14px;line-height:1.7;color:${BRAND_COLOR_DARK};">หรือคัดลอกลิงก์นี้ไปยังเบราว์เซอร์ของคุณ:<br/><a href="${resetUrl}" style="color:${BRAND_COLOR_DARK};word-break:break-all;">${resetUrl}</a></p>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#888;">ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง หากคุณไม่ได้ร้องขอให้รีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
  `;
  return sendEmail({
    to,
    subject: "รีเซ็ตรหัสผ่าน Alyn",
    html: baseLayout("รีเซ็ตรหัสผ่าน Alyn", body),
  });
}

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  userName: string
): Promise<SendEmailResult> {
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEXT};font-size:22px;">ยืนยันอีเมลของคุณ</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${escapeHtml(userName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">ขอบคุณที่สมัครใช้งาน Alyn แพลตฟอร์มนิยายออนไลน์คุณภาพ กรุณายืนยันอีเมลของคุณโดยคลิกปุ่มด้านล่าง</p>
    ${buttonHtml(verifyUrl, "ยืนยันอีเมล")}
    <p style="margin:16px 0;font-size:14px;line-height:1.7;color:${BRAND_COLOR_DARK};">หรือคัดลอกลิงก์นี้ไปยังเบราว์เซอร์ของคุณ:<br/><a href="${verifyUrl}" style="color:${BRAND_COLOR_DARK};word-break:break-all;">${verifyUrl}</a></p>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#888;">ลิงก์นี้จะหมดอายุภายใน 24 ชั่วโมง หากคุณไม่ได้สมัครสมาชิก Alyn กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
  `;
  return sendEmail({
    to,
    subject: "ยืนยันอีเมล Alyn",
    html: baseLayout("ยืนยันอีเมล Alyn", body),
  });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<SendEmailResult> {
  const exploreUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/explore`;
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEXT};font-size:22px;">ยินดีต้อนรับสู่ Alyn</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${escapeHtml(userName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">ยินดีต้อนรับเข้าสู่ครอบครัว Alyn อย่างเป็นทางการ! บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว คุณสามารถเริ่มอ่านนิยายคุณภาพและร่วมเป็นส่วนหนึ่งของชุมชนนักอ่านและนักเขียนของเราได้ทันที</p>
    ${buttonHtml(exploreUrl, "เริ่มสำรวจนิยาย")}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;">ขอให้มีความสุขกับการอ่านและการเขียนครับ/ค่ะ</p>
  `;
  return sendEmail({
    to,
    subject: "ยินดีต้อนรับสู่ Alyn",
    html: baseLayout("ยินดีต้อนรับสู่ Alyn", body),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
