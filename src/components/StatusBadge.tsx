import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PREPARATION: "bg-blue-100 text-blue-800 border-blue-200",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ANNOUNCED: "bg-purple-100 text-purple-800 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-luxluf-100 text-luxluf-800 border-luxluf-200",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-block border px-3 py-1 text-xs font-medium tracking-wide",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
