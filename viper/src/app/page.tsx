"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useState, useEffect } from "react";

type Watchlist = {
  id: string;
  name: string;
  items: Array<{ id: string; symbol: string; assetType: string }>;
};

type HoldingsSummary = {
  holdings: Array<{
    symbol: string;
    qty: number;
    avgCost: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPct: number;
  }>;
  totals: {
    totalValue: number;
    totalUnrealizedPL: number;
    totalUnrealizedPLPct: number;
  };
};

type QuoteResponse = {
  symbol: string;
  last: number | null;
  change?: number | null;
  changePct?: number | null;
};

function MarketCard({ symbol }: { symbol: string }) {
  const { data: quote } = useQuery<QuoteResponse>({
    queryKey: ["quote", symbol],
    queryFn: () => api.get(`quote?symbol=${encodeURIComponent(symbol)}`).json(),
    refetchInterval: 30000,
  });

  const change = quote?.change ?? null;
  const changePct = quote?.changePct ?? null;
  const isPositive = change !== null && change >= 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow">
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{symbol}</div>
      <div className="text-xl font-bold mb-2">
        {quote?.last !== null && quote?.last !== undefined ? `$${quote.last.toFixed(2)}` : "—"}
      </div>
      {change !== null && changePct !== null && (
        <div className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "+" : ""}
          {change.toFixed(2)} ({isPositive ? "+" : ""}
          {changePct.toFixed(2)}%)
        </div>
      )}
    </div>
  );
}

function WatchlistSummary() {
  const [watchlistId, setWatchlistId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("watchlistId");
      if (stored) {
        setWatchlistId(stored);
      } else {
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

  const { data: watchlist } = useQuery<Watchlist>({
    queryKey: ["watchlist", watchlistId],
    queryFn: () => api.get(`watchlists/${watchlistId}`).json(),
    enabled: !!watchlistId,
  });

  if (!watchlist || watchlist.items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Watchlist</h2>
          <Link
            href="/watchlist"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All →
          </Link>
        </div>
        <p className="text-zinc-500 text-sm">No items yet. Add symbols to your watchlist.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{watchlist.name}</h2>
        <Link
          href="/watchlist"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {watchlist.items.slice(0, 5).map((item) => (
          <WatchlistRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function WatchlistRow({ item }: { item: { id: string; symbol: string; assetType: string } }) {
  const { data: quote } = useQuery<QuoteResponse>({
    queryKey: ["quote", item.symbol],
    queryFn: () => api.get(`quote?symbol=${encodeURIComponent(item.symbol)}`).json(),
    refetchInterval: 30000,
  });

  const change = quote?.change ?? null;
  const changePct = quote?.changePct ?? null;
  const isPositive = change !== null && change >= 0;

  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div>
        <div className="font-semibold font-mono">{item.symbol}</div>
        <div className="text-xs text-zinc-500">{item.assetType}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">
          {quote?.last !== null && quote?.last !== undefined ? `$${quote.last.toFixed(2)}` : "—"}
        </div>
        {change !== null && changePct !== null && (
          <div className={`text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}
            {change.toFixed(2)} ({isPositive ? "+" : ""}
            {changePct.toFixed(2)}%)
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioSummary() {
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

  const { data: holdings } = useQuery<HoldingsSummary>({
    queryKey: ["portfolio", portfolioId, "holdings"],
    queryFn: () => api.get(`portfolio/${portfolioId}/holdings`).json(),
    enabled: !!portfolioId,
    refetchInterval: 30000,
  });

  if (!holdings || holdings.holdings.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Portfolio</h2>
          <Link
            href="/portfolio"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All →
          </Link>
        </div>
        <p className="text-zinc-500 text-sm">No holdings yet. Add lots to track your portfolio.</p>
      </div>
    );
  }

  const isPositive = holdings.totals.totalUnrealizedPL >= 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <Link
          href="/portfolio"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Value</div>
            <div className="text-lg font-semibold">${holdings.totals.totalValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Unrealized P/L</div>
            <div className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}${holdings.totals.totalUnrealizedPL.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">P/L %</div>
            <div className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}
              {holdings.totals.totalUnrealizedPLPct.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="space-y-2">
            {holdings.holdings.slice(0, 5).map((holding) => {
              const isPos = holding.unrealizedPL >= 0;
              return (
                <div key={holding.symbol} className="flex justify-between items-center">
                  <div className="font-mono font-semibold">{holding.symbol}</div>
                  <div className="text-right">
                    <div className="font-semibold">${holding.marketValue.toFixed(2)}</div>
                    <div className={`text-xs ${isPos ? "text-green-600" : "text-red-600"}`}>
                      {isPos ? "+" : ""}${holding.unrealizedPL.toFixed(2)} ({isPos ? "+" : ""}
                      {holding.unrealizedPLPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const popularSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Market Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Real-time market data and portfolio overview</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Popular Stocks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {popularSymbols.map((symbol) => (
              <MarketCard key={symbol} symbol={symbol} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WatchlistSummary />
          <PortfolioSummary />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/watchlist"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-all hover:border-blue-500"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold mb-2">Watchlists</h3>
            <p className="text-sm text-zinc-500">Track your favorite stocks and assets</p>
          </Link>
          <Link
            href="/portfolio"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-all hover:border-blue-500"
          >
            <div className="text-2xl mb-2">💼</div>
            <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
            <p className="text-sm text-zinc-500">Manage your holdings and track P/L</p>
          </Link>
          <Link
            href="/alerts"
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-all hover:border-blue-500"
          >
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="text-lg font-semibold mb-2">Alerts</h3>
            <p className="text-sm text-zinc-500">Set price alerts for your investments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
