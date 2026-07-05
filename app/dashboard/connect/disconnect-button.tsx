"use client";

import { useState } from "react";

/**
 * Disconnect button with an inline confirm step — never disconnects on a single
 * click. Submits a POST form to /api/auth/google/disconnect.
 */
export function DisconnectButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
      >
        Disconnect
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 sm:flex-row sm:items-center">
      <span className="text-sm text-rose-800">
        Disconnect this Google account?
      </span>
      <div className="flex gap-2">
        <form action="/api/auth/google/disconnect" method="post">
          <button
            type="submit"
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Yes, disconnect
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
