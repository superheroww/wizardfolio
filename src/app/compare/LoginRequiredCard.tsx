"use client";

type LoginRequiredCardProps = {
  onSignIn: () => void;
};

export default function LoginRequiredCard({ onSignIn }: LoginRequiredCardProps) {
  return (
    <div className="flex h-full min-h-[200px] flex-col justify-between rounded-3xl border border-dashed border-neutral-300 bg-white/90 p-5 shadow-sm shadow-black/5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Compare mixes
        </p>
        <h3 className="mt-2 text-lg font-semibold text-neutral-900">
          Sign in to compare your mixes
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          Save mixes to your account, then unlock side-by-side exposure
          comparisons, benchmarks, and templates.
        </p>
      </div>

      <button
        type="button"
        onClick={onSignIn}
        className="mt-6 rounded-full bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/40 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Sign in
      </button>
    </div>
  );
}
