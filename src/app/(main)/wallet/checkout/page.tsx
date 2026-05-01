"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

/**
 * Builds a hidden form in the DOM and submits it. Bypasses React entirely so
 * there's no lifecycle/timing ambiguity — the form always has all its inputs
 * before `.submit()` is called.
 */
function submitPaymentForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get("package");
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const createCalledRef = useRef(false);

  useEffect(() => {
    if (!packageId) {
      setError("ไม่พบแพ็กเกจที่เลือก");
      return;
    }

    // Guard against React StrictMode double-invoke in dev — we don't want
    // to create two PaymentOrders per checkout.
    if (createCalledRef.current) return;
    createCalledRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/payments/paysolutions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "เกิดข้อผิดพลาด");
          return;
        }
        if (data.form?.mock) setMockMode(true);
        // Submit the payment form imperatively — no React form lifecycle.
        submitPaymentForm(data.form.action, data.form.fields);
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถเชื่อมต่อระบบชำระเงินได้");
      }
    })();
  }, [packageId]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream/20 px-4">
        <p className="text-lg font-semibold text-brand-black">{error}</p>
        <button
          onClick={() => router.push("/wallet")}
          className="rounded-full bg-rosegold-dark px-6 py-2 text-sm font-medium text-white hover:bg-rosegold"
        >
          กลับไปหน้ากระเป๋าเงิน
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream/20 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-rosegold-dark" />
        <h1 className="text-xl font-bold text-brand-black">
          กำลังไปยังหน้าชำระเงิน...
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          กรุณาอย่าปิดหรือรีเฟรชหน้านี้ ระบบกำลังเชื่อมต่อกับ Pay Solutions
          เพื่อดำเนินการชำระเงินอย่างปลอดภัย
        </p>
        {mockMode && (
          <span className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            โหมดทดสอบ — ไม่มีการเรียกเก็บเงินจริง
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>เข้ารหัสการเชื่อมต่อด้วย HTTPS</span>
      </div>

      <Link
        href="/wallet"
        className="text-xs text-muted-foreground underline hover:text-brand-black"
      >
        ยกเลิกและกลับหน้ากระเป๋าเงิน
      </Link>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
