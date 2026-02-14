"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AiNotesParser from "./AiNotesParser";
import type { ParsedOrder } from "@/lib/ai";

export default function OrderForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    customerName: "",
    contactInfo: "",
    conciergeHotel: "",
    productDescription: "",
    quantity: 1,
    deliveryAddress: "",
    deliveryTime: "",
    specialInstructions: "",
    orderAmount: "",
    rawNotes: "",
  });

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAiParsed(parsed: ParsedOrder) {
    setForm({
      customerName: parsed.customerName || form.customerName,
      contactInfo: parsed.contactInfo || form.contactInfo,
      conciergeHotel: parsed.conciergeHotel || form.conciergeHotel,
      productDescription:
        parsed.productDescription || form.productDescription,
      quantity: parsed.quantity || form.quantity,
      deliveryAddress: parsed.deliveryAddress || form.deliveryAddress,
      deliveryTime: parsed.deliveryTime
        ? new Date(parsed.deliveryTime).toISOString().slice(0, 16)
        : form.deliveryTime,
      specialInstructions:
        parsed.specialInstructions || form.specialInstructions,
      orderAmount: parsed.orderAmount
        ? String(parsed.orderAmount)
        : form.orderAmount,
      rawNotes: form.rawNotes,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          orderAmount: Number(form.orderAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || ["Failed to create order"]);
        return;
      }

      router.push(`/orders/${data.order.id}`);
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <AiNotesParser onParsed={handleAiParsed} />

      <form onSubmit={handleSubmit} className="card">
        {errors.length > 0 && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label">Customer Name *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Contact Info *</label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => updateField("contactInfo", e.target.value)}
              className="input"
              placeholder="Phone or email"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Concierge / Hotel *</label>
            <input
              type="text"
              value={form.conciergeHotel}
              onChange={(e) => updateField("conciergeHotel", e.target.value)}
              className="input"
              placeholder="e.g. James at The Plaza"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Product Description *</label>
            <textarea
              value={form.productDescription}
              onChange={(e) =>
                updateField("productDescription", e.target.value)
              }
              className="input min-h-[80px] resize-y"
              required
            />
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Order Amount (USD) *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.orderAmount}
              onChange={(e) => updateField("orderAmount", e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Delivery Address *</label>
            <input
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => updateField("deliveryAddress", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Delivery Time *</label>
            <input
              type="datetime-local"
              value={form.deliveryTime}
              onChange={(e) => updateField("deliveryTime", e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Special Instructions</label>
            <textarea
              value={form.specialInstructions}
              onChange={(e) =>
                updateField("specialInstructions", e.target.value)
              }
              className="input min-h-[60px] resize-y"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
