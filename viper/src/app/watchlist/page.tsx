"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { ToastContainer, type Toast } from "@/components/toast";

type WatchlistItem = {
  id: string;
  symbol: string;
  assetType: string;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
};

type QuoteResponse = {
  symbol: string;
  last: number | null;
};

function useWatchlistId() {
  const [watchlistId, setWatchlistId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("watchlistId");
      if (stored) {
        setWatchlistId(stored);
      } else {
        // Create default watchlist
        api
          .post("watchlists", { json: { name: "My List" } })
          .json<{ id: string }>()
          .then((data) => {
            localStorage.setItem("watchlistId", data.id);
            setWatchlistId(data.id);
          })
          .catch(console.error);
      }
    }
  }, []);

  return watchlistId;
}

function WatchlistItemRow({
  item,
  watchlistId,
}: {
  item: WatchlistItem;
  watchlistId: string;
}) {
  const queryClient = useQueryClient();
  const { data: quote } = useQuery<QuoteResponse>({
    queryKey: ["quote", item.symbol],
    queryFn: () => api.get(`quote?symbol=${encodeURIComponent(item.symbol)}`).json(),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`watchlists/${watchlistId}/items/${item.id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", watchlistId] });
    },
  });

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
      <td className="px-6 py-4">
        <div className="font-mono font-semibold text-lg">{item.symbol}</div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
          {item.assetType}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="font-mono font-semibold">
          {quote?.last !== null && quote?.last !== undefined ? `$${quote.last.toFixed(2)}` : "—"}
        </div>
        {quote?.change !== null && quote?.change !== undefined && quote?.changePct !== null && quote?.changePct !== undefined && (() => {
          const change = quote.change!;
          const changePct = quote.changePct!;
          return (
            <div className={`text-xs mt-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)} ({change >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%)
            </div>
          );
        })()}
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function WatchlistPage() {
  const watchlistId = useWatchlistId();
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<"stock" | "etf" | "crypto" | "commodity" | "bond">("stock");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { data: watchlist } = useQuery<Watchlist>({
    queryKey: ["watchlist", watchlistId],
    queryFn: () => api.get(`watchlists/${watchlistId}`).json(),
    enabled: !!watchlistId,
  });

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: { symbol: string; assetType: string }) =>
      api.post(`watchlists/${watchlistId}/items`, { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", watchlistId] });
      setSymbol("");
      setToasts([...toasts, { id: Date.now().toString(), message: "Item added", type: "success" }]);
    },
    onError: (e: any) => {
      const message = e?.response?.json?.()?.then?.((d: any) => d.error) || "Failed to add item";
      setToasts([...toasts, { id: Date.now().toString(), message, type: "error" }]);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !watchlistId) return;
    addMutation.mutate({
      symbol: symbol.toUpperCase(),
      assetType,
    });
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((t) => t.id !== id));
  };

  if (!watchlistId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{watchlist?.name ?? "Watchlist"}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Track your favorite stocks and assets</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Symbol</h2>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="AAPL"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
                <option value="commodity">Commodity</option>
                <option value="bond">Bond</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {watchlist?.items.map((item) => (
                  <WatchlistItemRow key={item.id} item={item} watchlistId={watchlistId} />
                ))}
              </tbody>
            </table>
          </div>
          {watchlist?.items.length === 0 && (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <div className="text-4xl mb-2">📊</div>
              <p>No items yet. Add one above.</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

