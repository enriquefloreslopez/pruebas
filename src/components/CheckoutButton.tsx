"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/site";

export function CheckoutButton({
  plan,
  highlighted,
}: {
  plan: PlanId;
  highlighted?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={`w-full rounded-full px-5 py-3 font-semibold transition disabled:opacity-60 ${
          highlighted
            ? "bg-white text-teal-800 hover:bg-teal-50"
            : "bg-teal-700 text-white hover:bg-teal-800"
        }`}
      >
        {loading ? "Abriendo pago…" : "Contratar"}
      </button>
      {error && (
        <p role="alert" className={`mt-2 text-sm ${highlighted ? "text-white" : "text-red-700"}`}>
          {error}
        </p>
      )}
    </div>
  );
}
