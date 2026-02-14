"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import type { Role } from "@/lib/types";
import { getAllowedTransitions } from "@/lib/roles";
import { STATUS_LABELS } from "@/lib/types";

interface Props {
  orderId: number;
  currentStatus: OrderStatus;
  role: Role;
}

export default function StatusActions({
  orderId,
  currentStatus,
  role,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState("");

  const transitions = getAllowedTransitions(role, currentStatus);

  if (transitions.length === 0) return null;

  async function handleTransition(newStatus: OrderStatus) {
    if (newStatus === "OUT_FOR_DELIVERY" && !driverName.trim()) {
      alert("Please enter driver name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          role,
          driverName: driverName || undefined,
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mt-6 border-luxluf-400">
      <h3 className="font-serif text-lg text-luxluf-800 mb-4">Actions</h3>

      {transitions.includes("OUT_FOR_DELIVERY" as OrderStatus) && (
        <div className="mb-4">
          <label className="label">Driver Name</label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="input max-w-xs"
            placeholder="Enter your name"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {transitions.map((status) => (
          <button
            key={status}
            onClick={() => handleTransition(status)}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Updating..." : `Mark as ${STATUS_LABELS[status]}`}
          </button>
        ))}
      </div>
    </div>
  );
}
