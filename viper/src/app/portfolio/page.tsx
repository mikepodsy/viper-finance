"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api-client";
import { ToastContainer, type Toast } from "@/components/toast";

type Holding = {
  symbol: string;
  qty: number;
  avgCost: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPct: number;
};

type HoldingsResponse = {
  holdings: Holding[];
  totals: {
    totalValue: number;
    totalUnrealizedPL: number;
    totalUnrealizedPLPct: number;
  };
};

const lotSchema = z.object({
  symbol: z.string().min(1).max(20),
  qty: z.number().positive(),
  costBasis: z.number().nonnegative(),
  tradeDate: z.string().min(1),
});

type LotFormData = z.infer<typeof lotSchema>;

function usePortfolioId() {
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("portfolioId");
      if (stored) {
        setPortfolioId(stored);
      } else {
        api
          .post("portfolio", {})
          .json<{ id: string }>()
          .then((data) => {
            localStorage.setItem("portfolioId", data.id);
            setPortfolioId(data.id);
          })
          .catch(console.error);
      }
    }
  }, []);

  return portfolioId;
}

export default function PortfolioPage() {
  const portfolioId = usePortfolioId();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { data: holdingsData } = useQuery<HoldingsResponse>({
    queryKey: ["portfolio", portfolioId, "holdings"],
    queryFn: () => api.get(`portfolio/${portfolioId}/holdings`).json(),
    enabled: !!portfolioId,
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      tradeDate: new Date().toISOString().split("T")[0],
    },
  });

  const addLotMutation = useMutation({
    mutationFn: (data: LotFormData) =>
      api.post(`portfolio/${portfolioId}/lots`, {
        json: {
          ...data,
          tradeDate: new Date(data.tradeDate).toISOString(),
        },
      }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      reset();
      setToasts([...toasts, { id: Date.now().toString(), message: "Lot added", type: "success" }]);
    },
    onError: (e: any) => {
      const message = e?.response?.json?.()?.then?.((d: any) => d.error) || "Failed to add lot";
      setToasts([...toasts, { id: Date.now().toString(), message, type: "error" }]);
    },
  });

  const onSubmit = (data: LotFormData) => {
    if (!portfolioId) return;
    addLotMutation.mutate(data);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((t) => t.id !== id));
  };

  if (!portfolioId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage your holdings and track profit/loss</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Lot</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Symbol</label>
              <input
                {...register("symbol")}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="AAPL"
              />
              {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Quantity</label>
              <input
                type="number"
                step="0.0001"
                {...register("qty", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="10"
              />
              {errors.qty && <p className="text-red-500 text-xs mt-1">{errors.qty.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Cost Basis ($)</label>
              <input
                type="number"
                step="0.01"
                {...register("costBasis", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="150.00"
              />
              {errors.costBasis && (
                <p className="text-red-500 text-xs mt-1">{errors.costBasis.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Trade Date</label>
              <input
                type="date"
                {...register("tradeDate")}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
              />
              {errors.tradeDate && (
                <p className="text-red-500 text-xs mt-1">{errors.tradeDate.message}</p>
              )}
            </div>
            <div className="col-span-1 md:col-span-4">
              <button
                type="submit"
                disabled={addLotMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {addLotMutation.isPending ? "Adding..." : "Add Lot"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Avg Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Market Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Unrealized P/L</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">P/L %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {holdingsData?.holdings.map((holding) => (
                  <tr key={holding.symbol} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-lg">{holding.symbol}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{holding.qty.toFixed(4)}</td>
                    <td className="px-6 py-4 text-right font-mono">${holding.avgCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">${holding.marketValue.toFixed(2)}</td>
                    <td
                      className={`px-6 py-4 text-right font-mono font-semibold ${
                        holding.unrealizedPL >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holding.unrealizedPL >= 0 ? "+" : ""}${holding.unrealizedPL.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-mono font-semibold ${
                        holding.unrealizedPLPct >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holding.unrealizedPLPct >= 0 ? "+" : ""}
                      {holding.unrealizedPLPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {holdingsData?.totals && (
                  <tr className="bg-zinc-50 dark:bg-zinc-800 font-semibold border-t-2 border-zinc-300 dark:border-zinc-700">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4 text-right font-mono text-lg">
                      ${holdingsData.totals.totalValue.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-mono text-lg ${
                        holdingsData.totals.totalUnrealizedPL >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holdingsData.totals.totalUnrealizedPL >= 0 ? "+" : ""}
                      ${holdingsData.totals.totalUnrealizedPL.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-mono text-lg ${
                        holdingsData.totals.totalUnrealizedPLPct >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {holdingsData.totals.totalUnrealizedPLPct >= 0 ? "+" : ""}
                      {holdingsData.totals.totalUnrealizedPLPct.toFixed(2)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {holdingsData?.holdings.length === 0 && (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <div className="text-4xl mb-2">💼</div>
              <p>No holdings yet. Add a lot above.</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

