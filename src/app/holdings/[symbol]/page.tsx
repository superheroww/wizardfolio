import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type HoldingRow = {
  holding_symbol: string;
  holding_name: string;
  country: string | null;
  sector: string | null;
  weight_pct: number;
};

type HoldingParams = {
  symbol?: string | string[];
};

type HoldingsPageProps = {
  params: Promise<HoldingParams>;
};

function getSymbolFromParams(params: HoldingParams) {
  const symbol = params.symbol;
  if (Array.isArray(symbol)) {
    return symbol[0] ?? "";
  }
  return symbol ?? "";
}

export async function generateMetadata({ params }: HoldingsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const symbolValue = getSymbolFromParams(resolvedParams);
  const symbol = symbolValue ? symbolValue.toUpperCase() : "ETF";
  return {
    title: `${symbol} Holdings | ETF Look-Through | WizardFolio`,
    description: `See the latest holdings for ${symbol}: top stocks, sectors, and country exposure. Powered by WizardFolio's ETF look-through engine.`,
  };
}

export default async function HoldingsPage({ params }: HoldingsPageProps) {
  const resolvedParams = await params;
  const rawSymbol = getSymbolFromParams(resolvedParams);
  const symbol = rawSymbol.toUpperCase();

  if (!symbol) {
    notFound();
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("etf_holdings")
    .select("holding_symbol,holding_name,country,sector,weight_pct")
    .eq("etf_symbol", symbol)
    .order("weight_pct", { ascending: false });

  if (error) {
    console.error("Error loading holdings", error);
    notFound();
  }

  if (!data || data.length === 0) {
    notFound();
  }

  const holdings = data.map((row) => ({
    holding_symbol: row.holding_symbol,
    holding_name: row.holding_name,
    country: row.country,
    sector: row.sector,
    weight_pct:
      typeof row.weight_pct === "string"
        ? parseFloat(row.weight_pct)
        : row.weight_pct ?? 0,
  })) as HoldingRow[];

  const topHoldings = holdings.slice(0, 10);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {symbol} Holdings (Top {topHoldings.length})
        </h1>
        <p className="text-sm text-neutral-700">
          This page shows the latest holdings for {symbol} from the WizardFolio ETF
          look-through engine. Use it to understand the underlying stocks, sectors,
          and countries in this ETF.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Top holdings
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                <th scope="col" className="pb-2 pr-4 text-left">
                  Stock
                </th>
                <th scope="col" className="pb-2 pr-4 text-left">
                  Ticker
                </th>
                <th scope="col" className="pb-2 pr-4 text-left">
                  Country
                </th>
                <th scope="col" className="pb-2 pr-4 text-left">
                  Sector
                </th>
                <th scope="col" className="pb-2 text-right">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {topHoldings.map((row) => (
                <tr
                  key={`${row.holding_symbol}-${row.holding_name}`}
                  className="last:border-b-0"
                >
                  <td className="py-3 pr-4 font-medium text-neutral-900">
                    {row.holding_name}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm font-semibold text-neutral-900">
                    {row.holding_symbol}
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-700">
                    {row.country ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-700">
                    {row.sector ?? "—"}
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-neutral-900">
                    {row.weight_pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
        <div className="space-y-3">
          <p className="text-base font-semibold text-neutral-900">
            Compare {symbol} or mix it with other ETFs
          </p>
          <p className="text-sm text-neutral-700">
            Use WizardFolio to mix {symbol} with ETFs such as QQQ, XEQT, and VEQT
            and see the true stock-level exposure of your blend.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/"
              className="inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Try your own mix →
            </a>
            <a
              href="/compare/voo-vs-qqq"
              className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              VOO vs QQQ comparison
            </a>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Related ETF Pages
        </h2>
        <ul className="space-y-2 text-sm text-neutral-700">
          <li>
            <a
              href="/compare/voo-vs-qqq"
              className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              VOO vs QQQ comparison
            </a>
          </li>
          <li>
            <a
              href="/compare/spy-vs-qqq"
              className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              SPY vs QQQ comparison
            </a>
          </li>
          <li>
            <a
              href="/holdings/QQQ"
              className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              QQQ holdings
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
