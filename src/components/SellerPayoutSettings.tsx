// components/SellerPayoutSettings.tsx
import { useEffect, useState } from "react";

type Account = {
  payouts_enabled: boolean;
  charges_enabled: boolean;
  settings: {
    payouts: {
      schedule: { interval: string; monthly_anchor?: number };
    };
  };
  capabilities: { card_payments: string; transfers: string };
};

export function SellerPayoutSettings({ sellerId }: { sellerId: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stripe/account-status?sellerId=${sellerId}`)
      .then((r) => r.json())
      .then((data) => {
        setAccount(data);
        setLoading(false);
      });
  }, [sellerId]);

  if (loading) return <p>Loading payout info…</p>;
  if (!account) return <p>No payout account found.</p>;

  return (
    <div className="space-y-4">
      <p>
        <strong>Payouts enabled:</strong>{" "}
        {account.payouts_enabled ? "Yes" : "No"}
        <br />
        <strong>Schedule:</strong> {account.settings.payouts.schedule.interval}
        {account.settings.payouts.schedule.monthly_anchor
          ? ` on day ${account.settings.payouts.schedule.monthly_anchor}`
          : ""}
      </p>
      {!account.payouts_enabled && (
        <a
          href={`/api/stripe/create-account-link`}
          onClick={(e) => {
            e.preventDefault();
            fetch("/api/stripe/create-account-link", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sellerId }),
            })
              .then((r) => r.json())
              .then(({ url }) => (window.location.href = url));
          }}
          className="btn"
        >
          Complete Payout Setup
        </a>
      )}
      {account.payouts_enabled && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const newInterval = (e.target as any).interval.value;
            await fetch("/api/stripe/update-payout-schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sellerId, interval: newInterval }),
            });
            // re-fetch
            const refreshed = await fetch(
              `/api/stripe/account-status?sellerId=${sellerId}`,
            ).then((r) => r.json());
            setAccount(refreshed);
          }}
        >
          <label>
            Change payout schedule:
            <select
              name="interval"
              defaultValue={account.settings.payouts.schedule.interval}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <button type="submit" className="btn">
            Update
          </button>
        </form>
      )}
    </div>
  );
}
