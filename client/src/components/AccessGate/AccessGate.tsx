import { useEffect, useState, type ReactNode } from "react";
import {
  clearStoredPassword,
  fetchPasswordRequired,
  getStoredPassword,
  setStoredPassword,
  verifyPassword,
} from "../../api/client";

// There are no accounts. The password goes in localStorage, so a visitor is
// asked once per device and every later visit goes straight through.
type Status = "checking" | "locked" | "unlocked";

const AccessGate = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const stored = getStoredPassword();
      try {
        const required = await fetchPasswordRequired();
        if (cancelled) return;

        if (!required) {
          setStatus("unlocked");
          return;
        }
        if (!stored) {
          setStatus("locked");
          return;
        }

        // Re-check on load so changing the password mid-tournament re-prompts
        // instead of leaving devices with silently failing requests.
        const ok = await verifyPassword(stored);
        if (cancelled) return;
        if (ok) {
          setStatus("unlocked");
        } else {
          clearStoredPassword();
          setError("That password has changed — please enter the new one.");
          setStatus("locked");
        }
      } catch {
        if (cancelled) return;
        setStatus("locked");
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    if (!password.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        setStoredPassword(password);
        setStatus("unlocked");
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "unlocked") return <>{children}</>;

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-fairway-900/5"
      >
        <header className="text-center">
          <div className="text-3xl">⛳</div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-fairway-800">
            Tournament Tracker
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter the tournament password. You'll only be asked once on this
            device.
          </p>
        </header>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-fairway-800">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl bg-canvas p-3 text-ink shadow-sm ring-1 ring-fairway-900/5 focus:outline-none focus:ring-2 focus:ring-fairway-600"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !password.trim()}
          className="rounded-xl bg-fairway-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-fairway-700 disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
};

export default AccessGate;
