"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart, X, Coins, Loader2, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCoin } from "@/lib/utils";

interface DonationButtonProps {
  receiverId: string;
  receiverName: string;
}

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export default function DonationButton({
  receiverId,
  receiverName,
}: DonationButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const openModal = async () => {
    if (!session?.user) {
      window.location.href = "/auth/login";
      return;
    }

    // Check if trying to donate to self
    if (session.user.id === receiverId) {
      setError("คุณไม่สามารถสนับสนุนตัวเองได้");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Fetch current balance
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAmount(null);
    setCustomAmount("");
    setMessage("");
    setError("");
    setSuccess(false);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const getFinalAmount = (): number => {
    if (customAmount) {
      return parseInt(customAmount);
    }
    return selectedAmount || 0;
  };

  const handleSubmit = async () => {
    const amount = getFinalAmount();

    if (amount <= 0) {
      setError("กรุณาเลือกจำนวนเหรียญ");
      return;
    }

    if (userBalance !== null && amount > userBalance) {
      setError("เหรียญของคุณไม่เพียงพอ");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          amount,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      const data = await res.json();
      setUserBalance(data.newBalance);
      setSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        closeModal();
        // Optionally refresh the page to show updated donation list
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งกำลังใจ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Donation Button */}
      <Button
        onClick={openModal}
        className="bg-gradient-to-r from-rosegold to-rosegold-dark hover:from-rosegold-dark hover:to-rosegold text-white"
      >
        <Heart className="h-5 w-5" />
        สนับสนุนนักเขียน
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-cream hover:text-brand-black"
            >
              <X className="h-5 w-5" />
            </button>

            {success ? (
              /* Success State */
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rosegold/20 to-cream animate-pulse">
                  <Heart className="h-8 w-8 fill-rosegold-dark text-rosegold-dark" />
                </div>
                <h3 className="text-2xl font-bold text-brand-black">
                  ส่งกำลังใจสำเร็จ!
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  ขอบคุณที่สนับสนุน {receiverName}
                </p>
                <p className="mt-4 text-lg font-semibold text-rosegold-dark">
                  {formatCoin(getFinalAmount())} เหรียญ
                </p>
              </div>
            ) : (
              /* Donation Form */
              <>
                <h2 className="mb-1 text-xl font-bold text-brand-black">
                  สนับสนุน {receiverName}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  นักเขียนจะได้รับ 90% จากจำนวนที่คุณส่ง
                </p>

                {/* Current Balance */}
                {userBalance !== null && (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-cream/30 p-3">
                    <span className="text-sm text-muted-foreground">
                      เหรียญคงเหลือ
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-coin">
                      <Coins className="h-4 w-4" />
                      {formatCoin(userBalance)}
                    </span>
                  </div>
                )}

                {/* Preset Amounts */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-brand-black">
                    เลือกจำนวนเหรียญ
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleAmountSelect(amount)}
                        disabled={loading}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all ${
                          selectedAmount === amount
                            ? "border-rosegold bg-rosegold/10 text-rosegold-dark"
                            : "border-border bg-white text-muted-foreground hover:border-rosegold/30 hover:bg-cream/30"
                        }`}
                      >
                        <Coins className="mb-1 h-5 w-5" />
                        <span className="text-xs font-semibold">{amount}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-brand-black">
                    หรือระบุจำนวนเอง
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-coin" />
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="0"
                      disabled={loading}
                      className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-brand-black">
                    ข้อความ (ไม่บังคับ)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="เขียนข้อความให้กำลังใจ..."
                    disabled={loading}
                    rows={3}
                    maxLength={200}
                    className="w-full resize-none rounded-xl border border-border bg-white p-3 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.length}/200
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || getFinalAmount() <= 0}
                  className="w-full bg-gradient-to-r from-rosegold to-rosegold-dark hover:from-rosegold-dark hover:to-rosegold text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      ส่งกำลังใจ {getFinalAmount() > 0 && `${formatCoin(getFinalAmount())} เหรียญ`}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
