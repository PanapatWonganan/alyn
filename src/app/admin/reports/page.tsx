"use client";

import { useEffect, useState } from "react";
import {
  Flag,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

interface Report {
  id: string;
  targetType: "COMMENT" | "NOVEL" | "CHAPTER";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    penName: string | null;
    email: string;
  };
}

interface ApiResponse {
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const statusTabs: { key: ReportStatus; label: string }[] = [
  { key: "PENDING", label: "รอดำเนินการ" },
  { key: "RESOLVED", label: "แก้ไขแล้ว" },
  { key: "DISMISSED", label: "ยกเลิก" },
];

const targetTypeLabel: Record<Report["targetType"], string> = {
  COMMENT: "ความคิดเห็น",
  NOVEL: "นิยาย",
  CHAPTER: "ตอน",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/reports?status=${status}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data: ApiResponse = await response.json();
      setReports(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("เกิดข้อผิดพลาดในการโหลดรายงาน");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: "RESOLVED" | "DISMISSED"
  ) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update report");
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตรายงาน");
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            รายงานเนื้อหา
          </h1>
          <p className="text-muted-foreground">ทั้งหมด {total} รายการ</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  status === tab.key
                    ? "bg-rosegold-dark text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rosegold-dark" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Flag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground text-lg">ไม่มีรายงาน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-rosegold/10 rounded-lg">
                    <Flag className="w-5 h-5 text-rosegold-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rosegold/10 text-rosegold-dark">
                            {targetTypeLabel[report.targetType]}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              report.status === "PENDING" &&
                                "bg-yellow-100 text-yellow-700",
                              report.status === "RESOLVED" &&
                                "bg-green-100 text-green-700",
                              report.status === "DISMISSED" &&
                                "bg-gray-100 text-gray-700"
                            )}
                          >
                            {report.status === "PENDING" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {report.status === "RESOLVED" && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {report.status === "DISMISSED" && (
                              <XCircle className="w-3 h-3" />
                            )}
                            {statusTabs.find((t) => t.key === report.status)
                              ?.label}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          รายงานโดย{" "}
                          <span className="font-medium text-brand-black">
                            {report.reporter.penName || report.reporter.name}
                          </span>{" "}
                          · {report.reporter.email}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2 font-mono">
                      ID: {report.targetId}
                    </div>

                    <p className="text-brand-black mb-4 whitespace-pre-wrap">
                      {report.reason}
                    </p>

                    {report.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "RESOLVED")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          แก้ไขแล้ว
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "DISMISSED")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
