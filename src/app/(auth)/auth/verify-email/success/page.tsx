import Link from "next/link";

export const metadata = {
  title: "ยืนยันอีเมลสำเร็จ",
  description: "บัญชี Alyn ของคุณได้รับการยืนยันเรียบร้อย",
};

export default function VerifyEmailSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-rosegold tracking-widest">
            อลิน
          </h1>
          <p className="text-sm text-rosegold-dark mt-1">
            แพลตฟอร์มนิยายออนไลน์คุณภาพ
          </p>
        </div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rosegold/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-rosegold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-brand-black mb-3">
          ยืนยันอีเมลสำเร็จ
        </h2>
        <p className="text-brand-black/70 mb-6">
          ขอบคุณที่ยืนยันอีเมลของคุณ บัญชี Alyn ของคุณพร้อมใช้งานแล้ว
        </p>
        <Link
          href="/auth/login"
          className="inline-block w-full py-3 px-4 rounded-lg bg-rosegold text-white font-semibold hover:bg-rosegold-dark transition-colors"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
