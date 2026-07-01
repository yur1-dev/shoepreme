"use client";

import { useState } from "react";

interface ReserveModalProps {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  onClose: () => void;
}

export default function ReserveModal({
  variantId,
  productTitle,
  variantTitle,
  onClose,
}: ReserveModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          variantId,
          quantity: 1,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0d1117] p-6">
        {success ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Reserved</h3>
            <p className="mt-2 text-sm text-white/60">
              We'll confirm availability for {productTitle} ({variantTitle}) and
              send you a secure payment link by email once stock is confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[#e8a830] py-3 text-sm font-medium text-black"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-white">
              Reserve This Item
            </h3>
            <p className="mt-1 text-sm text-white/60">
              {productTitle} — {variantTitle}
            </p>
            <p className="mt-2 text-xs text-white/40">
              Sourced from abroad. No payment now — we'll confirm stock and send
              you a payment link.
            </p>

            <div className="mt-5 space-y-3">
              <input
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30"
              />
              <div className="flex gap-3">
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-1/2 rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30"
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-1/2 rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30"
                />
              </div>
              <input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30"
              />
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 rounded-xl border border-white/[0.08] py-3 text-sm text-white/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 rounded-xl bg-[#e8a830] py-3 text-sm font-medium text-black disabled:opacity-50"
              >
                {loading ? "Reserving..." : "Reserve Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
