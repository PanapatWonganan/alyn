import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-cream/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="/logo/Logo_Primary.svg"
              alt="Alyn"
              width={100}
              height={33}
              className="h-8 w-auto"
              style={{ width: "auto" }}
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              อลิน - พื้นที่แห่งปัญญาและความสุขจากการอ่าน
              แหล่งรวมนิยายคุณภาพที่คัดสรรมาเพื่อคุณ
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-black">
              สำรวจ
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/ranking" className="hover:text-rosegold-dark transition-colors">
                  อันดับนิยาย
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-rosegold-dark transition-colors">
                  ชั้นหนังสือ
                </Link>
              </li>
              <li>
                <Link href="/write" className="hover:text-rosegold-dark transition-colors">
                  เริ่มเขียนนิยาย
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-black">
              หมวดหมู่
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  โรแมนติก
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  แฟนตาซี
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  ดราม่า
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  สืบสวน
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-black">
              ช่วยเหลือ
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  วิธีใช้งาน
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  ข้อกำหนดการใช้งาน
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-rosegold-dark transition-colors">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Alyn (อลิน). All rights reserved.
        </div>
      </div>
    </footer>
  );
}
