import { useState } from "react";

export type TravelMapFilterValues = {
  q: string;
  city: string;
  state: string;
  category: string;
  verified: boolean;
  sponsored: boolean;
};

export default function TravelMapFilters({
  initialValues,
  onApply,
}: {
  initialValues: TravelMapFilterValues;
  onApply: (values: TravelMapFilterValues) => void;
}) {
  const [values, setValues] = useState<TravelMapFilterValues>(initialValues);

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input
          value={values.q}
          onChange={(e) => setValues((v) => ({ ...v, q: e.target.value }))}
          placeholder="Search businesses, food, beauty, coffee..."
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.city}
          onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
          placeholder="City"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.state}
          onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
          placeholder="State"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.category}
          onChange={(e) =>
            setValues((v) => ({ ...v, category: e.target.value }))
          }
          placeholder="Category"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={values.verified}
            onChange={(e) =>
              setValues((v) => ({ ...v, verified: e.target.checked }))
            }
          />
          Verified only
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={values.sponsored}
            onChange={(e) =>
              setValues((v) => ({ ...v, sponsored: e.target.checked }))
            }
          />
          Sponsored only
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => onApply(values)}
          className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400"
        >
          Apply Filters
        </button>

        <button
          onClick={() => {
            const reset = {
              q: "",
              city: "",
              state: "",
              category: "",
              verified: false,
              sponsored: false,
            };
            setValues(reset);
            onApply(reset);
          }}
          className="rounded-xl border border-yellow-500/25 bg-transparent px-5 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
