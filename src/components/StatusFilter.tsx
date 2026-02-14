"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: (OrderStatus | "ALL")[] = [
  "ALL",
  "SUBMITTED",
  "IN_PREPARATION",
  "PAYMENT_RECEIVED",
  "ANNOUNCED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "ALL";

  function setFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={cn(
            "px-4 py-2 text-xs tracking-wide border transition-colors",
            current === status
              ? "bg-luxluf-700 text-luxluf-50 border-luxluf-700"
              : "bg-white text-luxluf-600 border-luxluf-300 hover:border-luxluf-500"
          )}
        >
          {status === "ALL" ? "All Orders" : STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
