import type { BenchmarkMix } from "@/lib/benchmarkPresets";

export function getBenchmarkLabel(benchmark: BenchmarkMix) {
  return (
    benchmark.label ||
    benchmark.positions?.[0]?.symbol ||
    benchmark.id
  );
}
