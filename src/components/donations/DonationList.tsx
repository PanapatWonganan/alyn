"use client";

import { useEffect, useState } from "react";
import { Heart, User, Loader2 } from "lucide-react";
import { formatRelativeTime, formatCoin } from "@/lib/utils";
import Link from "next/link";

interface DonationListProps {
  receiverId: string;
}

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    penName: string | null;
  };
}

export default function DonationList({ receiverId }: DonationListProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchDonations() {
      try {
        const res = await fetch(
          `/api/donations?receiverId=${receiverId}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setDonations(data.donations || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, [receiverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-black">
          การสนับสนุนล่าสุด
        </h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            รวม {formatCoin(total)} เหรียญ
          </span>
        )}
      </div>

      {donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
            <Heart className="h-8 w-8 text-rosegold/30" />
          </div>
          <p className="text-sm text-muted-foreground">ยังไม่มีการสนับสนุน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => {
            const senderName = donation.sender.penName || donation.sender.name;
            return (
              <div
                key={donation.id}
                className="flex gap-4 rounded-xl border border-border bg-cream/30 p-4 transition-all hover:border-rosegold/30 hover:bg-cream/50"
              >
                {/* Heart Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rosegold/20 to-cream">
                  <Heart className="h-5 w-5 fill-rosegold-dark text-rosegold-dark" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/user/${donation.sender.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-rosegold-dark hover:underline"
                    >
                      <User className="h-3.5 w-3.5" />
                      {senderName}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      ส่งกำลังใจ
                    </span>
                    <span className="font-semibold text-coin">
                      {formatCoin(donation.amount)} เหรียญ
                    </span>
                  </div>

                  {donation.message && (
                    <p className="mb-2 text-sm text-brand-black/80">
                      &quot;{donation.message}&quot;
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(donation.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
