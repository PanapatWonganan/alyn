"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Database,
  Coins,
  FileText,
  Users,
  Info,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalNovels: number;
  totalChapters: number;
  totalCoins: number;
  totalComments: number;
}

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Calculate approximate storage (rough estimate)
  const approximateStorage = stats
    ? Math.round(
        (stats.totalUsers * 2 +
          stats.totalNovels * 10 +
          stats.totalChapters * 50 +
          stats.totalComments * 1) /
          1024
      )
    : 0;

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-rosegold-dark" />
            <h1 className="text-4xl font-bold text-brand-black">
              การตั้งค่าระบบ
            </h1>
          </div>
          <p className="text-muted-foreground">
            จัดการการตั้งค่าและดูข้อมูลระบบแพลตฟอร์ม
          </p>
        </div>

        <div className="space-y-6">
          {/* A. Site Information Section */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-rosegold-dark" />
              <h2 className="text-2xl font-bold text-brand-black">
                ข้อมูลเว็บไซต์
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">ชื่อไซต์</p>
                <p className="text-lg font-semibold text-brand-black">
                  อลิน (Alyn)
                </p>
              </div>
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">เวอร์ชัน</p>
                <p className="text-lg font-semibold text-brand-black">1.0.0</p>
              </div>
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  สภาพแวดล้อม
                </p>
                <p className="text-lg font-semibold text-brand-black">
                  Development
                </p>
              </div>
            </div>
          </div>

          {/* B. System Stats Section */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-rosegold-dark" />
              <h2 className="text-2xl font-bold text-brand-black">
                สถิติระบบ
              </h2>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                กำลังโหลด...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                เกิดข้อผิดพลาด: {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    ประเภทฐานข้อมูล
                  </p>
                  <p className="text-lg font-semibold text-brand-black">
                    SQLite
                  </p>
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    พื้นที่ใช้งานโดยประมาณ
                  </p>
                  <p className="text-lg font-semibold text-brand-black">
                    ~{approximateStorage} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* C. Coin Settings Section */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-rosegold-dark" />
              <h2 className="text-2xl font-bold text-brand-black">
                การตั้งค่าเหรียญ
              </h2>
            </div>
            <div className="space-y-4">
              {/* Revenue Splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    การแบ่งรายได้จากการซื้อตอน
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">นักเขียน</p>
                      <p className="text-2xl font-bold text-brand-black">
                        70%
                      </p>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        แพลตฟอร์ม
                      </p>
                      <p className="text-2xl font-bold text-rosegold-dark">
                        30%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    การแบ่งรายได้จากการบริจาค
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">นักเขียน</p>
                      <p className="text-2xl font-bold text-brand-black">
                        90%
                      </p>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        แพลตฟอร์ม
                      </p>
                      <p className="text-2xl font-bold text-rosegold-dark">
                        10%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    ราคาตอนขั้นต่ำ
                  </p>
                  <p className="text-lg font-semibold text-brand-black">
                    1 เหรียญ
                  </p>
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    ราคาตอนสูงสุด
                  </p>
                  <p className="text-lg font-semibold text-brand-black">
                    100 เหรียญ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* D. Content Settings Section */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-rosegold-dark" />
              <h2 className="text-2xl font-bold text-brand-black">
                การตั้งค่าเนื้อหา
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  ความยาวเรื่องย่อสูงสุด
                </p>
                <p className="text-lg font-semibold text-brand-black">
                  2,000 ตัวอักษร
                </p>
              </div>
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  ความยาวเนื้อหาตอนสูงสุด
                </p>
                <p className="text-lg font-semibold text-brand-black">
                  100,000 ตัวอักษร
                </p>
              </div>
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  จำนวนแท็กสูงสุดต่อนิยาย
                </p>
                <p className="text-lg font-semibold text-brand-black">
                  10 แท็ก
                </p>
              </div>
              <div className="p-4 bg-cream rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  สถานะนิยายที่อนุญาต
                </p>
                <p className="text-lg font-semibold text-brand-black">
                  DRAFT, ONGOING, COMPLETED, HIATUS
                </p>
              </div>
            </div>
          </div>

          {/* E. User Roles Section */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-rosegold-dark" />
              <h2 className="text-2xl font-bold text-brand-black">
                บทบาทผู้ใช้
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brand-black">
                      บทบาท
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-brand-black">
                      สิทธิ์การใช้งาน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-cream/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-semibold text-brand-black">
                          READER
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      อ่านนิยาย, บันทึก, คอมเมนต์, ซื้อเหรียญ
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-cream/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-semibold text-brand-black">
                          WRITER
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      ทุกสิทธิ์ของ READER + เขียนนิยาย, สร้างตอน, รับรายได้
                    </td>
                  </tr>
                  <tr className="hover:bg-cream/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rosegold-dark"></div>
                        <span className="font-semibold text-brand-black">
                          ADMIN
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      ทุกสิทธิ์ + จัดการผู้ใช้, จัดการเนื้อหา, ดูรายงาน
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
