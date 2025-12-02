import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const STATIC_ETF_SYMBOLS = [
  "ZSP.TO",
  "XUU.TO",
  "SCHD",
  "VXUS",
  "SCHX",
  "VO",
  "VEE.TO",
  "VCN.TO",
  "VGRO.TO",
  "VBAL.TO",
  "VWO",
  "IJH",
  "IEMG",
  "SCHB",
  "IVV",
  "ITOT",
  "VEA",
  "VFV.TO",
  "XIC.TO",
  "BND",
  "VOO",
  "ZAG.TO",
  "VTI",
  "VIU.TO",
  "VCNS.TO",
  "SPY",
  "QQQ",
  "XTOT.TO",
  "VT",
  "VB",
  "XEF.TO",
  "XAW.TO",
  "XEC.TO",
  "VUN.TO",
  "HHIS.TO",
  "VEQT.TO",
  "XEQT.TO",
  "VDY.TO",
  "IJR",
] as const;

export const revalidate = 86400;

type HoldingRow = {
  holding_symbol: string;
  holding_name: string;
  country: string | null;
  sector: string | null;
  weight_pct: number;
};

type HoldingsPageProps = {
  params: {
    symbol: string;
  };
};

export async function generateStaticParams() {
  return STATIC_ETF_SYMBOLS.map((symbol) => ({ symbol }));
}

export async function generateMetadata({ params }: HoldingsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const symbol = resolvedParams.symbol ? resolvedParams.symbol.toUpperCase() : "ETF";
  return {
    title: `${symbol} Holdings | ETF Look-Through | WizardFolio`,
    description: `See the latest holdings for ${symbol}: top stocks, sectors, and country exposure. Powered by WizardFolio's ETF look-through engine.`,
  };
}

export default async function HoldingsPage({ params }: HoldingsPageProps) {
  const resolvedParams = await params;
  const rawSymbol = resolvedParams.symbol ?? "";
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
    return (
      <main className="p-6">
        <pre>Error: {JSON.stringify(error, null, 2)}</pre>
      </main>
    );
  }

  if (!data || data.length === 0) {
    return (
      <main className="p-6">
        <p>No holdings found for {symbol}.</p>
      </main>
    );
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
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {symbol} Holdings (Top {topHoldings.length})
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          This page shows the latest holdings for {symbol} from the WizardFolio ETF
          look-through engine. Use it to understand the underlying stocks, sectors,
          and countries in this ETF.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Top holdings
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.25em] text-zinc-500">
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
            <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
              {topHoldings.map((row) => (
                <tr
                  key={`${row.holding_symbol}-${row.holding_name}`}
                  className="last:border-b-0"
                >
                  <td className="py-3 pr-4 font-medium text-zinc-900">
                    {row.holding_name}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs uppercase tracking-wide text-zinc-600">
                    {row.holding_symbol}
                  </td>
                  <td className="py-3 pr-4 text-sm text-zinc-600">
                    {row.country ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-sm text-zinc-600">
                    {row.sector ?? "—"}
                  </td>
                  <td className="py-3 text-right font-semibold text-zinc-900">
                    {row.weight_pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-zinc-900">
            Compare {symbol} or mix it with other ETFs
          </p>
          <p className="text-sm leading-relaxed">
            Use WizardFolio to mix {symbol} with ETFs such as QQQ, XEQT, and VEQT
            and see the true stock-level exposure of your blend.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-border hover:bg-accent"
            >
              Try your own mix →
            </a>
            <a
              href="/compare/voo-vs-qqq"
              className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
            >
              VOO vs QQQ comparison
            </a>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600 leading-relaxed">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Related ETF pages
        </h2>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>
            <a
              href="/compare/voo-vs-qqq"
              className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
            >
              VOO vs QQQ comparison
            </a>
          </li>
          <li>
            <a
              href="/compare/spy-vs-qqq"
              className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
            >
              SPY vs QQQ comparison
            </a>
          </li>
          <li>
            <a
              href="/holdings/QQQ"
              className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
            >
              QQQ holdings
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
