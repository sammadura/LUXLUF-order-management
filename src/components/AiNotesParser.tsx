"use client";

import { useState } from "react";
import type { ParsedOrder } from "@/lib/ai";

interface Props {
  onParsed: (data: ParsedOrder) => void;
}

export default function AiNotesParser({ onParsed }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!notes.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Failed to parse notes");

      const { parsed } = await res.json();
      onParsed(parsed);
    } catch {
      setError("Could not parse notes. Please fill in the form manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-8 border-luxluf-300 bg-luxluf-50">
      <h3 className="font-serif text-lg text-luxluf-800 mb-3">
        AI Order Assistant
      </h3>
      <p className="text-sm text-luxluf-500 mb-4">
        Paste your phone notes and AI will extract the order details.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Mrs Chen from the Plaza called, wants white peonies for anniversary, $450, deliver by 2pm to suite 1201..."
        className="input min-h-[100px] resize-y"
        rows={4}
      />
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={handleParse}
          disabled={loading || !notes.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Parsing..." : "Extract Order Details"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
