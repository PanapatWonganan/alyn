import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-rosegold-dark/10 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-rosegold-dark" />
          </div>
        </div>

        {/* 404 Number */}
        <h1 className="text-9xl font-bold text-rosegold-dark mb-4">404</h1>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-brand-black mb-4">
          ไม่พบหน้าที่คุณต้องการ
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8">
          หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือลบไปแล้ว
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-rosegold-dark text-white font-medium hover:bg-rosegold-dark/90 transition-colors"
          >
            กลับหน้าแรก
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border-2 border-rosegold-dark text-rosegold-dark font-medium hover:bg-rosegold-dark/5 transition-colors"
          >
            สำรวจนิยาย
          </Link>
        </div>
      </div>
    </div>
  );
}
